import { useState, useEffect, useCallback } from 'react';
import type { Wave } from '../types/domain';
import { fetchWaves } from '../services/dataverse';

export function useWaves(projectId: string | null) {
  const [waves, setWaves] = useState<Wave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    fetchWaves(projectId)
      .then(list => { setWaves(list); setError(null); })
      .catch((e: any) => { setError(e.message ?? 'Failed to fetch waves'); })
      .finally(() => { setLoading(false); });
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  return { waves, loading, error, refreshWaves: load };
}
