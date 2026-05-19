import { useState, useEffect } from 'react';
import type { E2EProcess } from '../types/domain';
import { fetchE2EProcesses } from '../services/dataverse';

export function useE2EProcesses(projectId: string | null) {
  const [processes, setProcesses] = useState<E2EProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    let cancelled = false;

    fetchE2EProcesses(projectId)
      .then(list => { if (!cancelled) { setProcesses(list); setError(null); } })
      .catch((e: any) => { if (!cancelled) setError(e.message ?? 'Failed to fetch processes'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [projectId]);

  return { processes, loading, error };
}
