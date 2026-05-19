import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { usePolling } from './usePolling';

describe('usePolling', () => {
  it('calls fetcher immediately on mount', async () => {
    const fetcher = vi.fn().mockResolvedValue(undefined);
    renderHook(() => usePolling(fetcher, 60000));

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  });

  it('calls fetcher on interval', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockResolvedValue(undefined);
    renderHook(() => usePolling(fetcher, 1000));

    // Initial call
    await act(async () => { vi.advanceTimersByTime(0); });
    expect(fetcher).toHaveBeenCalledTimes(1);

    // After 1 interval
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(fetcher).toHaveBeenCalledTimes(2);

    // After 2 intervals
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(fetcher).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });

  it('stops polling when stop() is called', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePolling(fetcher, 1000));

    await act(async () => { vi.advanceTimersByTime(0); });
    expect(fetcher).toHaveBeenCalledTimes(1);

    act(() => { result.current.stop(); });

    await act(async () => { vi.advanceTimersByTime(3000); });
    expect(fetcher).toHaveBeenCalledTimes(1); // No more calls

    vi.useRealTimers();
  });

  it('resumes polling when start() is called after stop()', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePolling(fetcher, 1000));

    await act(async () => { vi.advanceTimersByTime(0); });
    act(() => { result.current.stop(); });
    await act(async () => { vi.advanceTimersByTime(3000); });
    const callsAfterStop = fetcher.mock.calls.length;

    act(() => { result.current.start(); });
    await act(async () => { vi.advanceTimersByTime(0); });
    expect(fetcher.mock.calls.length).toBeGreaterThan(callsAfterStop);

    vi.useRealTimers();
  });

  it('manual refresh() triggers fetcher immediately', async () => {
    const fetcher = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePolling(fetcher, 60000));

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    await act(async () => { await result.current.refresh(); });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
