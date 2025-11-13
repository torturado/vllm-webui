'use client';

import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { OCRImage } from '@/lib/types';
import { formatBytes } from '@/lib/utils';

interface OCRUploaderProps {
  images: OCRImage[];
  onAddImages: (files: File[]) => void;
  onRemoveImage: (id: string) => void;
  isProcessing: boolean;
}

export default function OCRUploader({
  images,
  onAddImages,
  onRemoveImage,
  isProcessing,
}: OCRUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      onAddImages(files);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((file) =>
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      onAddImages(files);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="terminal-border p-4 font-mono text-sm">
      <div className="mb-4">
        <div className="text-terminal-green mb-2 font-bold">OCR IMAGE UPLOADER</div>
        <div className="text-terminal-green/70 text-xs">
          Upload images for OCR extraction (supports 100+ images)
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`terminal-border border-dashed p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-terminal-amber bg-terminal-gray/50'
            : 'border-terminal-green'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <div className="text-terminal-green/70 mb-2">
          {isDragging ? 'DROP IMAGES HERE' : 'DRAG & DROP OR CLICK TO SELECT IMAGES'}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isProcessing}
          className="hidden"
        />
        <div className="text-terminal-green/50 text-xs">
          Supported: JPG, PNG, WEBP, etc.
        </div>
      </div>

      {images.length > 0 && (
        <div className="mt-4">
          <div className="text-terminal-green mb-2">
            SELECTED: {images.length} image{images.length !== 1 ? 's' : ''}
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {images.map((img) => (
              <div
                key={img.id}
                className="terminal-border p-2 flex items-center justify-between text-xs"
              >
                <div className="flex-1 truncate text-terminal-green">
                  {img.file.name} ({formatBytes(img.file.size)})
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`${
                      img.status === 'pending'
                        ? 'text-terminal-green/50'
                        : img.status === 'processing'
                        ? 'text-terminal-amber'
                        : img.status === 'completed'
                        ? 'text-terminal-green'
                        : 'text-red-500'
                    }`}
                  >
                    [{img.status.toUpperCase()}]
                  </span>
                  {!isProcessing && (
                    <button
                      onClick={() => onRemoveImage(img.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
