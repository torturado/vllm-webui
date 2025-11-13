'use client';

interface OCRProgressProps {
  processed: number;
  total: number;
  errors: number;
}

export default function OCRProgress({ processed, total, errors }: OCRProgressProps) {
  if (total === 0) return null;

  const percentage = Math.round((processed / total) * 100);

  return (
    <div className="terminal-border p-3 font-mono text-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="text-terminal-green">PROCESSING OCR...</div>
        <div className="text-terminal-amber">
          {processed}/{total} ({percentage}%)
        </div>
      </div>
      <div className="terminal-border h-4 bg-terminal-dark relative">
        <div
          className="h-full bg-terminal-green transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {errors > 0 && (
        <div className="mt-2 text-red-500 text-xs">
          ERRORS: {errors}
        </div>
      )}
    </div>
  );
}
