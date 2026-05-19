import { useState, useEffect } from 'react';

export interface PerfEntry {
  label: string;
  durationMs: number;
  timestamp: number;
}

const MAX_ENTRIES = 30;
let entries: PerfEntry[] = [];
const listeners = new Set<() => void>();

export function logPerf(label: string, durationMs: number) {
  entries = [{ label, durationMs, timestamp: Date.now() }, ...entries].slice(0, MAX_ENTRIES);
  listeners.forEach(fn => fn());
}

export async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const t0 = performance.now();
  try {
    return await fn();
  } finally {
    logPerf(label, Math.round(performance.now() - t0));
  }
}

export function usePerfLog(): PerfEntry[] {
  const [, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick(t => t + 1);
    listeners.add(bump);
    return () => { listeners.delete(bump); };
  }, []);

  return entries;
}
