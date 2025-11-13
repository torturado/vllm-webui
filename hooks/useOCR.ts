"use client";

import { OCRImage, OCRResult, ProviderConfig } from "@/lib/types";
import { generateId, imageToBase64 } from "@/lib/utils";
import { useCallback, useState } from "react";

export function useOCR() {
	const [images, setImages] = useState<OCRImage[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState({
		processed: 0,
		total: 0,
		errors: 0,
	});
	const [results, setResults] = useState<OCRResult[]>([]);

	const addImages = useCallback(async (files: File[]) => {
		const newImages: OCRImage[] = await Promise.all(
			files.map(async (file) => ({
				id: generateId(),
				file,
				status: "pending" as const,
			}))
		);
		setImages((prev) => [...prev, ...newImages]);
	}, []);

	const removeImage = useCallback((id: string) => {
		setImages((prev) => prev.filter((img) => img.id !== id));
	}, []);

	const clearImages = useCallback(() => {
		setImages([]);
		setResults([]);
		setProgress({ processed: 0, total: 0, errors: 0 });
	}, []);

	const processImages = useCallback(
		async (
			model: string,
			prompt?: string,
			onProgress?: (progress: {
				processed: number;
				total: number;
				errors: number;
			}) => void,
			provider?: ProviderConfig
		) => {
			if (images.length === 0 || isProcessing) return;

			setIsProcessing(true);
			setProgress({ processed: 0, total: images.length, errors: 0 });
			setResults([]);

			// Convert images to base64
			const imageData = await Promise.all(
				images.map(async (img) => await imageToBase64(img.file))
			);

			// Process each image individually (no shared context)
			const allResults: OCRResult[] = [];
			let processedCount = 0;
			let errorCount = 0;

			// Cache to store results as they complete
			const resultCache: Map<number, OCRResult> = new Map();

			try {
				// Process images sequentially to avoid overwhelming the API
				// but each image is processed independently
				for (
					let imageIndex = 0;
					imageIndex < images.length;
					imageIndex++
				) {
					const imageBase64 = imageData[imageIndex];
					const imageId = images[imageIndex]?.id || generateId();

					// Update image status to processing
					setImages((prev) =>
						prev.map((img, i) =>
							i === imageIndex
								? { ...img, status: "processing" }
								: img
						)
					);

					try {
						// Process single image - no context shared between images
						const response = await fetch("/api/vllm/ocr", {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								model,
								images: [imageBase64], // Single image per request
								prompt,
								provider,
							}),
						});

						if (!response.ok) {
							const errorData = await response
								.json()
								.catch(() => ({}));
							throw new Error(
								errorData.error ||
									`OCR failed for image ${imageIndex + 1}`
							);
						}

						const data = await response.json();

						console.log(`[OCR] Image ${imageIndex + 1} response:`, {
							hasResults: !!data.results,
							resultsLength: data.results?.length || 0,
							firstResult: data.results?.[0],
						});

						// Process result (should only be one result for single image)
						if (data.results && data.results.length > 0) {
							const result = data.results[0];
							if (result.error) {
								errorCount++;
								const ocrResult: OCRResult = {
									imageId,
									data: null,
									error: result.error,
								};
								resultCache.set(imageIndex, ocrResult);
								allResults.push(ocrResult);

								setImages((prev) =>
									prev.map((img, i) =>
										i === imageIndex
											? {
													...img,
													status: "error",
													error: result.error,
											  }
											: img
									)
								);
							} else {
								// Check if data exists and is not empty
								const resultData = result.data;
								console.log(
									`[OCR] Image ${imageIndex + 1} data:`,
									{
										hasData:
											resultData !== null &&
											resultData !== undefined,
										dataType: typeof resultData,
										dataLength:
											typeof resultData === "string"
												? resultData.length
												: "N/A",
										dataPreview:
											typeof resultData === "string"
												? resultData.substring(0, 100)
												: resultData,
									}
								);

								if (
									resultData !== null &&
									resultData !== undefined &&
									resultData !== ""
								) {
									processedCount++;
									const ocrResult: OCRResult = {
										imageId,
										data: resultData,
									};
									resultCache.set(imageIndex, ocrResult);
									allResults.push(ocrResult);

									console.log(
										`[OCR] Image ${
											imageIndex + 1
										} saved successfully. Total results: ${
											allResults.length
										}`
									);

									setImages((prev) =>
										prev.map((img, i) =>
											i === imageIndex
												? {
														...img,
														status: "completed",
														extractedData:
															resultData,
												  }
												: img
										)
									);
								} else {
									// Data is empty or null
									errorCount++;
									const ocrResult: OCRResult = {
										imageId,
										data: null,
										error: "Empty result returned from API",
									};
									resultCache.set(imageIndex, ocrResult);
									allResults.push(ocrResult);

									setImages((prev) =>
										prev.map((img, i) =>
											i === imageIndex
												? {
														...img,
														status: "error",
														error: "Empty result returned from API",
												  }
												: img
										)
									);
								}
							}
						} else {
							// No result returned
							errorCount++;
							const ocrResult: OCRResult = {
								imageId,
								data: null,
								error: "No result returned from API",
							};
							resultCache.set(imageIndex, ocrResult);
							allResults.push(ocrResult);

							setImages((prev) =>
								prev.map((img, i) =>
									i === imageIndex
										? {
												...img,
												status: "error",
												error: "No result returned from API",
										  }
										: img
								)
							);
						}
					} catch (error: any) {
						errorCount++;
						const ocrResult: OCRResult = {
							imageId,
							data: null,
							error: error.message || "Processing failed",
						};
						resultCache.set(imageIndex, ocrResult);
						allResults.push(ocrResult);

						setImages((prev) =>
							prev.map((img, i) =>
								i === imageIndex
									? {
											...img,
											status: "error",
											error:
												error.message ||
												"Processing failed",
									  }
									: img
							)
						);
					}

					// Update progress after each image
					const currentProgress = {
						processed: processedCount + errorCount,
						total: images.length,
						errors: errorCount,
					};
					setProgress(currentProgress);
					if (onProgress) {
						onProgress(currentProgress);
					}
				}

				// All images processed - set final results from cache
				console.log(
					`[OCR] Processing complete. Total results: ${allResults.length}`,
					{
						successful: allResults.filter((r) => r.data && !r.error)
							.length,
						failed: allResults.filter((r) => r.error).length,
						allResults: allResults.map((r) => ({
							imageId: r.imageId,
							hasData: r.data !== null && r.data !== undefined,
							dataType: typeof r.data,
							error: r.error,
						})),
					}
				);
				setResults(allResults);
			} catch (error) {
				console.error("Error processing OCR:", error);
			} finally {
				setIsProcessing(false);
			}
		},
		[images, isProcessing]
	);

	return {
		images,
		isProcessing,
		progress,
		results,
		addImages,
		removeImage,
		clearImages,
		processImages,
	};
}
