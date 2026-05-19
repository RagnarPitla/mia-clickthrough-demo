import { useState, useEffect, useCallback, useRef } from 'react';

export function usePolling(
  fetcher: () => Promise<void>,
  intervalMs: number = 15000
) {
  const [active, setActive] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    await fetcherRef.current();
    setLastRefreshed(new Date());
  }, []);

  useEffect(() => {
    if (!active) return;
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs, refresh]);

  return {
    active,
    lastRefreshed,
    stop: () => setActive(false),
    start: () => setActive(true),
    refresh,
  };
}
