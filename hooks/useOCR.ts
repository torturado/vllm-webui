'use client';

import { useState, useCallback } from 'react';
import { OCRImage, OCRResult } from '@/lib/types';
import { generateId, imageToBase64 } from '@/lib/utils';

const BATCH_SIZE = 10;

export function useOCR() {
  const [images, setImages] = useState<OCRImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0, errors: 0 });
  const [results, setResults] = useState<OCRResult[]>([]);

  const addImages = useCallback(async (files: File[]) => {
    const newImages: OCRImage[] = await Promise.all(
      files.map(async (file) => ({
        id: generateId(),
        file,
        status: 'pending' as const,
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

  const processImages = useCallback(async (
    model: string,
    prompt?: string,
    onProgress?: (progress: { processed: number; total: number; errors: number }) => void
  ) => {
    if (images.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setProgress({ processed: 0, total: images.length, errors: 0 });
    setResults([]);

    // Convert images to base64
    const imageData = await Promise.all(
      images.map(async (img) => await imageToBase64(img.file))
    );

    // Process in batches
    const batches: string[][] = [];
    for (let i = 0; i < imageData.length; i += BATCH_SIZE) {
      batches.push(imageData.slice(i, i + BATCH_SIZE));
    }

    const allResults: OCRResult[] = [];
    let processedCount = 0;
    let errorCount = 0;

    try {
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];

        // Update image statuses to processing
        setImages((prev) =>
          prev.map((img, idx) => {
            const startIdx = batchIndex * BATCH_SIZE;
            const endIdx = startIdx + batch.length;
            if (idx >= startIdx && idx < endIdx) {
              return { ...img, status: 'processing' };
            }
            return img;
          })
        );

        try {
          const response = await fetch('/api/vllm/ocr', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              images: batch,
              prompt,
            }),
          });

          if (!response.ok) {
            throw new Error(`OCR batch ${batchIndex + 1} failed`);
          }

          const data = await response.json();

          // Process results
          data.results.forEach((result: any, idx: number) => {
            const imageIndex = batchIndex * BATCH_SIZE + idx;
            if (result.error) {
              errorCount++;
              allResults.push({
                imageId: images[imageIndex]?.id || generateId(),
                error: result.error,
              });

              setImages((prev) =>
                prev.map((img, i) =>
                  i === imageIndex ? { ...img, status: 'error', error: result.error } : img
                )
              );
            } else {
              processedCount++;
              allResults.push({
                imageId: images[imageIndex]?.id || generateId(),
                data: result.data,
              });

              setImages((prev) =>
                prev.map((img, i) =>
                  i === imageIndex
                    ? { ...img, status: 'completed', extractedData: result.data }
                    : img
                )
              );
            }
          });
        } catch (error: any) {
          errorCount += batch.length;
          batch.forEach((_, idx) => {
            const imageIndex = batchIndex * BATCH_SIZE + idx;
            allResults.push({
              imageId: images[imageIndex]?.id || generateId(),
              error: error.message || 'Processing failed',
            });

            setImages((prev) =>
              prev.map((img, i) =>
                i === imageIndex
                  ? { ...img, status: 'error', error: error.message || 'Processing failed' }
                  : img
              )
            );
          });
        }

        processedCount = Math.min(processedCount, images.length);
        const currentProgress = {
          processed: processedCount,
          total: images.length,
          errors: errorCount,
        };
        setProgress(currentProgress);
        if (onProgress) {
          onProgress(currentProgress);
        }
      }

      setResults(allResults);
    } catch (error) {
      console.error('Error processing OCR:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [images, isProcessing]);

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
