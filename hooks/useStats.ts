'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatStats } from '@/lib/types';

export function useStats() {
  const [stats, setStats] = useState<ChatStats>({
    tokensPerSecond: 0,
    latency: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    generationTime: 0,
  });

  const updateStats = (newStats: Partial<ChatStats>) => {
    setStats((prev) => ({ ...prev, ...newStats }));
  };

  const resetStats = () => {
    setStats({
      tokensPerSecond: 0,
      latency: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      generationTime: 0,
    });
  };

  return {
    stats,
    updateStats,
    resetStats,
  };
}
