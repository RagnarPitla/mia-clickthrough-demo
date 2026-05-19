import { useState, useEffect } from 'react';
import type { Phase } from '../types/domain';
import { fetchPhases } from '../services/dataverse';

export function usePhases(projectId: string | null) {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    let cancelled = false;

    fetchPhases(projectId)
      .then(list => { if (!cancelled) { setPhases(list); setError(null); } })
      .catch((e: any) => { if (!cancelled) setError(e.message ?? 'Failed to fetch phases'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [projectId]);

  return { phases, loading, error };
}
