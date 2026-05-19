import { useState, useCallback, useEffect, useRef } from 'react';
import type { Project } from '../types/domain';
import { fetchProjects } from '../services/dataverse';
import { mergeMiaDemoProject, MIA_DEMO_PROJECT, MIA_DEMO_PROJECT_ID } from '../services/miaDemoData';

const PROJECT_KEY = 'kazuki-project';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    try { return localStorage.getItem(PROJECT_KEY); } catch { return null; }
  });
  // If we have a cached project, mark as not loading — render immediately
  const [loading, setLoading] = useState(() => {
    try { return !localStorage.getItem(PROJECT_KEY); } catch { return true; }
  });
  const [error, setError] = useState<string | null>(null);
  const didFetch = useRef(false);

  const load = useCallback(async () => {
    if (activeProjectId === MIA_DEMO_PROJECT_ID) {
      setProjects([MIA_DEMO_PROJECT]);
      setError(null);
      setLoading(false);
      return;
    }
    try {
      const list = mergeMiaDemoProject(await fetchProjects());
      setProjects(list);
      setError(null);
      // Auto-select first project only if nothing cached
      if (!activeProjectId && list.length > 0) {
        const id = list[0].id;
        setActiveProjectId(id);
        try { localStorage.setItem(PROJECT_KEY, id); } catch {}
      }
    } catch (e: any) {
      setError(e.message ?? 'Failed to load projects');
      setProjects([MIA_DEMO_PROJECT]);
      if (!activeProjectId) {
        setActiveProjectId(MIA_DEMO_PROJECT_ID);
        try { localStorage.setItem(PROJECT_KEY, MIA_DEMO_PROJECT_ID); } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    // If we have a cached ID, defer the project list fetch — don't block rendering
    if (activeProjectId) {
      // Background fetch for the project list (non-blocking)
      load();
    } else {
      load();
    }
  }, [activeProjectId, load]);

  const selectProject = useCallback((id: string) => {
    setActiveProjectId(id);
    try { localStorage.setItem(PROJECT_KEY, id); } catch {}
  }, []);

  return { projects, activeProjectId, selectProject, loading, error, reload: load };
}
