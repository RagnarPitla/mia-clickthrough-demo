import { useState, useEffect } from 'react';
import type { KzkPlaybook } from '../types/domain';
import { fetchPlaybooks } from '../services/dataverse';
import { MIA_SBD_PLAYBOOK, mergeMiaDemoPlaybookFirst } from '../services/miaDemoData';
import { isDemoModeCached } from '../services/demoBootstrap';
import { DEMO_PLAYBOOKS } from '../services/demoPlaybooks';

interface UsePlaybooksResult {
  playbooks: KzkPlaybook[];
  loading: boolean;
  error: string | null;
}

export function usePlaybooks(): UsePlaybooksResult {
  // In click-through demo mode, surface only the clean Microsoft Dynamics 365
  // example playbooks (Finance, SCM, Contact Center). Skip the live Dataverse
  // call entirely so we never expose customer-specific playbooks like
  // "Mamamia8 Success by Design Four E2E Demo" or the Mia/Zava SBD playbook.
  const demoMode = isDemoModeCached();

  const [playbooks, setPlaybooks] = useState<KzkPlaybook[]>(
    demoMode ? DEMO_PLAYBOOKS : [MIA_SBD_PLAYBOOK]
  );
  const [loading, setLoading] = useState(!demoMode);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (demoMode) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPlaybooks()
      .then(data => {
        if (!cancelled) {
          setPlaybooks(mergeMiaDemoPlaybookFirst(data));
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setPlaybooks([MIA_SBD_PLAYBOOK]);
          setError(err instanceof Error ? err.message : 'Failed to load live playbooks');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [demoMode]);

  return { playbooks, loading, error };
}
