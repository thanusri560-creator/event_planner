import { useState, useCallback } from 'react';

export interface PerformanceMetrics {
  lastCalcDurationMs: number;
  avgCalcDurationMs: number;
  totalCalculations: number;
  cacheHitCount: number;
  cacheMissCount: number;
  lastOperationName: string;
}

/**
 * Custom hook to track computation performance and algorithmic efficiency.
 */
export function useEnginePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lastCalcDurationMs: 0.18,
    avgCalcDurationMs: 0.22,
    totalCalculations: 1,
    cacheHitCount: 0,
    cacheMissCount: 1,
    lastOperationName: 'Initial CPM & Budget Pass',
  });

  const recordExecution = useCallback(
    <T>(operationName: string, fn: () => T, wasCached: boolean = false): T => {
      const start = performance.now();
      const result = fn();
      const duration = Math.round((performance.now() - start) * 100) / 100;

      setMetrics((prev) => {
        const newTotal = prev.totalCalculations + 1;
        const newAvg = Math.round(((prev.avgCalcDurationMs * prev.totalCalculations + duration) / newTotal) * 100) / 100;
        return {
          lastCalcDurationMs: duration,
          avgCalcDurationMs: newAvg,
          totalCalculations: newTotal,
          cacheHitCount: prev.cacheHitCount + (wasCached ? 1 : 0),
          cacheMissCount: prev.cacheMissCount + (wasCached ? 0 : 1),
          lastOperationName: operationName,
        };
      });

      return result;
    },
    []
  );

  return { metrics, recordExecution };
}
