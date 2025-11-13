'use client';

import { ChatStats } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface StatsPanelProps {
  stats: ChatStats;
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  if (stats.totalTokens === 0 && stats.latency === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 text-terminal-green/70 font-mono text-xs">
      {stats.latency > 0 && (
        <div>
          <span className="text-terminal-green/50">LATENCY:</span>{' '}
          <span className="text-terminal-amber">{stats.latency}ms</span>
        </div>
      )}
      {stats.tokensPerSecond > 0 && (
        <div>
          <span className="text-terminal-green/50">TOKENS/S:</span>{' '}
          <span className="text-terminal-amber">
            {formatNumber(stats.tokensPerSecond)}
          </span>
        </div>
      )}
      {stats.totalTokens > 0 && (
        <div>
          <span className="text-terminal-green/50">TOKENS:</span>{' '}
          <span className="text-terminal-amber">{stats.totalTokens}</span>
        </div>
      )}
      {stats.generationTime > 0 && (
        <div>
          <span className="text-terminal-green/50">TIME:</span>{' '}
          <span className="text-terminal-amber">
            {(stats.generationTime / 1000).toFixed(2)}s
          </span>
        </div>
      )}
    </div>
  );
}
