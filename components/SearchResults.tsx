'use client';

import { SearchResult } from '@/lib/types';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
}

export default function SearchResults({ results, query }: SearchResultsProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="terminal-border border-terminal-amber p-3 font-mono text-sm">
      <div className="text-terminal-amber mb-2 font-bold">
        SEARCH RESULTS: {query}
      </div>
      <div className="space-y-2">
        {results.slice(0, 5).map((result, index) => (
          <div
            key={index}
            className="border-l-2 border-terminal-green pl-2 text-terminal-green/80"
          >
            <div className="font-bold text-terminal-green">
              [{index + 1}] {result.title}
            </div>
            <div className="text-xs text-terminal-green/60 mb-1">
              {result.url}
            </div>
            <div className="text-xs text-terminal-green/70">
              {result.content.substring(0, 150)}...
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
