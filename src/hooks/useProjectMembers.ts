import { useState, useEffect } from 'react';
import type { ProjectMember } from '../types/domain';
import { fetchProjectMembers } from '../services/dataverse';

export function useProjectMembers(projectId: string | null) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    let cancelled = false;

    fetchProjectMembers(projectId)
      .then(list => { if (!cancelled) { setMembers(list); setError(null); } })
      .catch((e: any) => { if (!cancelled) setError(e.message ?? 'Failed to fetch members'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [projectId]);

  return { members, loading, error };
}
