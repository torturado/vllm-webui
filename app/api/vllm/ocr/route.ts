import { ProviderConfig } from "@/lib/types";
import { ocrExtraction } from "@/lib/vllm-client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { model, images, prompt, provider } = body;

		if (!model) {
			return NextResponse.json(
				{ error: "Model is required" },
				{ status: 400 }
			);
		}

		if (!images || !Array.isArray(images) || images.length === 0) {
			return NextResponse.json(
				{ error: "Images array is required and must not be empty" },
				{ status: 400 }
			);
		}

		const providerConfig: ProviderConfig | undefined = provider;

		// Process images in batches to avoid overwhelming the API
		const batchSize = 10;
		const batches: string[][] = [];

		for (let i = 0; i < images.length; i += batchSize) {
			batches.push(images.slice(i, i + batchSize));
		}

		const results: Array<{
			batchIndex: number;
			data: string;
			error?: string;
		}> = [];

		for (let i = 0; i < batches.length; i++) {
			try {
				const batch = batches[i];
				const data = await ocrExtraction(
					model,
					batch,
					prompt,
					providerConfig
				);
				results.push({
					batchIndex: i,
					data:
						typeof data === "string" ? data : JSON.stringify(data),
				});
			} catch (error: any) {
				results.push({
					batchIndex: i,
					data: "",
					error: error.message || "OCR extraction failed",
				});
			}
		}

		return NextResponse.json({
			success: true,
			results,
			totalBatches: batches.length,
			totalImages: images.length,
		});
	} catch (error: any) {
		console.error("Error in OCR route:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to process OCR request" },
			{ status: 500 }
		);
	}
}
