import { useCallback, useEffect, useRef, useState } from 'react';
import { MIA_COWORK_DECISION_KEY, MIA_DEMO_PLAYBACK_KEY, MIA_DEMO_WAVE_COUNT } from '../services/miaDemoData';

// Two-phase release animation timing.
// Each wave briefly shows as "Releasing" (InProgress) then transitions to Completed.
// Per-wave click release uses this as the fast hand-off (~330 ms), and the
// "Release Waves" button cascades through every remaining wave at the same pace.
const RELEASE_PHASE_MS = 330;

const STORAGE_DELIMITER = ',';

function readStoredReleased(): Set<number> {
  try {
    const raw = localStorage.getItem(MIA_DEMO_PLAYBACK_KEY);
    if (!raw) return new Set();
    // Backwards-compat: older builds stored a single integer "progress".
    if (!raw.includes(STORAGE_DELIMITER)) {
      const value = Number.parseInt(raw, 10);
      if (Number.isFinite(value) && value > 0) {
        const set = new Set<number>();
        for (let i = 0; i < Math.min(value, MIA_DEMO_WAVE_COUNT); i++) set.add(i);
        return set;
      }
      return new Set();
    }
    const out = new Set<number>();
    raw.split(STORAGE_DELIMITER).forEach(token => {
      const n = Number.parseInt(token, 10);
      if (Number.isFinite(n) && n >= 0 && n < MIA_DEMO_WAVE_COUNT) out.add(n);
    });
    return out;
  } catch {
    return new Set();
  }
}

function persistReleased(released: ReadonlySet<number>) {
  try {
    const sorted = [...released].sort((a, b) => a - b);
    localStorage.setItem(MIA_DEMO_PLAYBACK_KEY, sorted.join(STORAGE_DELIMITER));
  } catch {
    // localStorage unavailable — playback still works, progress just won't survive a reload.
  }
}

export function useMiaDemoPlayback(enabled: boolean) {
  const [released, setReleased] = useState<Set<number>>(readStoredReleased);
  const [running, setRunning] = useState(false);
  const [runningIndex, setRunningIndex] = useState<number>(-1);
  const [completionPending, setCompletionPending] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const cascadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const singleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const progress = released.size;
  const complete = progress >= MIA_DEMO_WAVE_COUNT;

  // Persist released set to localStorage so reloads keep state.
  useEffect(() => {
    if (!enabled) {
      setRunning(false);
      setRunningIndex(-1);
      return;
    }
    persistReleased(released);
  }, [enabled, released]);

  // Show completion the moment progress crosses the finish line during an
  // active run (cascade or click-by-click). Loading the page fresh at full
  // progress should NOT pop the completion card.
  useEffect(() => {
    if (completionPending && complete) {
      setShowCompletion(true);
      setCompletionPending(false);
    }
  }, [completionPending, complete]);

  // Clear any pending timers on unmount.
  useEffect(() => () => {
    if (cascadeRef.current) clearTimeout(cascadeRef.current);
    if (singleRef.current) clearTimeout(singleRef.current);
  }, []);

  // Cascade loop ("Release Waves" button): release every remaining wave
  // sequentially, RELEASE_PHASE_MS apart.
  useEffect(() => {
    if (!enabled || !running) return;
    // Find the next un-released wave index.
    let next = -1;
    for (let i = 0; i < MIA_DEMO_WAVE_COUNT; i++) {
      if (!released.has(i)) { next = i; break; }
    }
    if (next === -1) {
      setRunning(false);
      setRunningIndex(-1);
      return;
    }

    setRunningIndex(next);
    cascadeRef.current = setTimeout(() => {
      setReleased(prev => {
        const updated = new Set(prev);
        updated.add(next);
        return updated;
      });
    }, RELEASE_PHASE_MS);

    return () => {
      if (cascadeRef.current) {
        clearTimeout(cascadeRef.current);
        cascadeRef.current = null;
      }
    };
  }, [enabled, running, released]);

  // Per-wave click release (out-of-order allowed).
  const releaseWaveAt = useCallback((index: number) => {
    if (index < 0 || index >= MIA_DEMO_WAVE_COUNT) return;
    if (running) return;
    if (released.has(index)) return;
    setRunningIndex(index);
    setCompletionPending(true);
    if (singleRef.current) clearTimeout(singleRef.current);
    singleRef.current = setTimeout(() => {
      setReleased(prev => {
        const updated = new Set(prev);
        updated.add(index);
        return updated;
      });
      setRunningIndex(-1);
      singleRef.current = null;
    }, RELEASE_PHASE_MS);
  }, [running, released]);

  // Batch release ("Release Discover" / "Release Implement" etc.). Releases
  // each provided wave index in one set update on the next tick — avoids the
  // "only the last call sticks" race that happens when releaseWaveAt is
  // invoked N times synchronously and each invocation clears the prior
  // pending timeout.
  const releaseWavesAt = useCallback((indexes: readonly number[]) => {
    const valid = Array.from(new Set(indexes.filter(i => i >= 0 && i < MIA_DEMO_WAVE_COUNT)));
    if (valid.length === 0) return;
    if (running) return;
    setCompletionPending(true);
    setRunningIndex(valid[0] ?? -1);
    if (singleRef.current) clearTimeout(singleRef.current);
    singleRef.current = setTimeout(() => {
      setReleased(prev => {
        const updated = new Set(prev);
        valid.forEach(i => updated.add(i));
        return updated;
      });
      setRunningIndex(-1);
      singleRef.current = null;
    }, RELEASE_PHASE_MS);
  }, [running]);

  const startPlayback = useCallback(() => {
    setShowCompletion(false);
    setCompletionPending(true);
    setReleased(new Set());
    setRunningIndex(-1);
    setRunning(true);
  }, []);

  const resetPlayback = useCallback(() => {
    if (cascadeRef.current) { clearTimeout(cascadeRef.current); cascadeRef.current = null; }
    if (singleRef.current) { clearTimeout(singleRef.current); singleRef.current = null; }
    setRunning(false);
    setReleased(new Set());
    setRunningIndex(-1);
    setCompletionPending(false);
    setShowCompletion(false);
    // Also clear the cowork-side decision so the awaiting-user pill comes
    // back the next time wave 3.4 is released.
    try { localStorage.removeItem(MIA_COWORK_DECISION_KEY); } catch {}
  }, []);

  const dismissCompletion = useCallback(() => {
    setShowCompletion(false);
  }, []);

  return {
    released,
    progress,
    running,
    runningIndex,
    complete,
    showCompletion,
    startPlayback,
    resetPlayback,
    releaseWaveAt,
    releaseWavesAt,
    dismissCompletion,
  };
}
