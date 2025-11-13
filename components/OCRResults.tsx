'use client';

import { TableData, exportOCRResults, parseOCRResponse } from '@/lib/excel-export';
import { OCRResult } from '@/lib/types';
import { useEffect, useState } from 'react';

interface OCRResultsProps {
  results: OCRResult[];
}

export default function OCRResults({ results }: OCRResultsProps) {
  const [previewData, setPreviewData] = useState<any>(null);

  const handleExport = () => {
    try {
      const filename = `ocr-extraction-${Date.now()}.xlsx`;
      exportOCRResults(results, filename);
    } catch (error: any) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}`);
    }
  };

  const handlePreview = () => {
    try {
      const allData = results
        .filter((r) => r.data && !r.error)
        .map((r) => typeof r.data === 'string' ? r.data : JSON.stringify(r.data))
        .join('\n\n');

      if (allData) {
        const tables = parseOCRResponse(allData);
        setPreviewData(tables);
      }
    } catch (error) {
      console.error('Preview error:', error);
    }
  };

  const successfulResults = results.filter((r) => r.data !== null && r.data !== undefined && r.data !== "" && !r.error);
  const failedResults = results.filter((r) => r.error);

  if (results.length === 0) {
    return null;
  }

  // Debug: log results to help diagnose
  console.log('OCR Results:', {
    total: results.length,
    successful: successfulResults.length,
    failed: failedResults.length,
    results: results.map(r => ({
      imageId: r.imageId,
      hasData: r.data !== null && r.data !== undefined,
      dataType: typeof r.data,
      dataLength: typeof r.data === 'string' ? r.data.length : 'N/A',
      error: r.error
    }))
  });

  // Auto-load preview if we have successful results
  useEffect(() => {
    const successful = results.filter((r) => r.data !== null && r.data !== undefined && r.data !== "" && !r.error);
    if (successful.length > 0 && !previewData) {
      try {
        const allData = successful
          .map((r) => typeof r.data === 'string' ? r.data : JSON.stringify(r.data))
          .join('\n\n');

        if (allData) {
          const tables = parseOCRResponse(allData);
          setPreviewData(tables);
        }
      } catch (error) {
        console.error('Auto-preview error:', error);
      }
    }
  }, [results, previewData]);

  return (
    <div className="terminal-border p-4 font-mono text-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="text-terminal-green font-bold">
          OCR RESULTS: {successfulResults.length} successful, {failedResults.length} errors
        </div>
        <div className="flex gap-2">
          {successfulResults.length > 0 && (
            <>
              <button
                onClick={handlePreview}
                className="terminal-border px-3 py-1 text-xs hover:bg-terminal-green hover:text-terminal-dark transition-colors"
              >
                {previewData ? 'REFRESH PREVIEW' : 'PREVIEW'}
              </button>
              <button
                onClick={handleExport}
                className="terminal-border px-3 py-1 text-xs bg-terminal-green text-terminal-dark hover:bg-terminal-green/80 transition-colors"
              >
                EXPORT EXCEL
              </button>
            </>
          )}
        </div>
      </div>

      {successfulResults.length === 0 && failedResults.length > 0 && (
        <div className="text-terminal-amber text-xs mb-4">
          All images failed to process. See errors below.
        </div>
      )}

      {successfulResults.length === 0 && failedResults.length === 0 && results.length > 0 && (
        <div className="text-terminal-amber text-xs mb-4">
          Results received but no valid data found. Check console for details.
          <div className="mt-2 text-xs text-terminal-green/50">
            Total results: {results.length}
          </div>
        </div>
      )}

      {successfulResults.length > 0 && !previewData && (
        <div className="text-terminal-green/70 text-xs mb-4">
          Click PREVIEW to see extracted data, or EXPORT EXCEL to download all results.
        </div>
      )}

      {previewData && (
        <div className="mb-4 terminal-border p-3 max-h-64 overflow-auto">
          <div className="text-terminal-amber mb-2 font-bold">PREVIEW:</div>
          {(previewData as TableData[]).map((table: TableData, idx: number) => (
            <div key={idx} className="mb-4">
              <div className="text-terminal-green mb-1">Table {idx + 1}:</div>
              <div className="text-xs overflow-x-auto">
                <table className="border-collapse border border-terminal-green">
                  <thead>
                    <tr>
                      {table.headers.map((header: string, hIdx: number) => (
                        <th
                          key={hIdx}
                          className="border border-terminal-green p-1 text-terminal-green"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.slice(0, 10).map((row: any[], rIdx: number) => (
                      <tr key={rIdx}>
                        {row.map((cell: any, cIdx: number) => (
                          <td
                            key={cIdx}
                            className="border border-terminal-green/50 p-1 text-terminal-green/80"
                          >
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {table.rows.length > 10 && (
                  <div className="text-terminal-green/50 mt-1">
                    ... and {table.rows.length - 10} more rows
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {failedResults.length > 0 && (
        <div className="mt-4 terminal-border border-red-500 p-3">
          <div className="text-red-500 mb-2 font-bold">ERRORS:</div>
          <div className="space-y-1 text-xs">
            {failedResults.map((result, idx) => (
              <div key={idx} className="text-red-500/80">
                Image {idx + 1}: {result.error}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
