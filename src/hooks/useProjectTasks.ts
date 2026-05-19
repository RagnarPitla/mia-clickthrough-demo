import { useState, useCallback, useEffect, useRef } from 'react';
import type { Task } from '../types/domain';
import { fetchProjectTasks, fetchDependencies } from '../services/dataverse';
import { timed } from './usePerfLog';

export function useProjectTasks(projectId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeProjectRef = useRef(projectId);

  const load = useCallback(() => {
    activeProjectRef.current = projectId;
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    (async () => {
      try {
        await timed('⏱ Total (project tasks)', async () => {
          const taskList = await fetchProjectTasks(projectId);
          if (activeProjectRef.current !== projectId) return;

          const taskIds = taskList.map(t => t.id);
          const deps = await fetchDependencies(taskIds);
          if (activeProjectRef.current !== projectId) return;

          const depMap = new Map<string, string[]>();
          for (const d of deps) {
            const arr = depMap.get(d.taskId) ?? [];
            arr.push(d.predecessorId);
            depMap.set(d.taskId, arr);
          }

          setTasks(taskList.map(t => ({ ...t, predecessorIds: depMap.get(t.id) ?? [] })));
          setError(null);
        });
      } catch (e: any) {
        setError(e.message ?? 'Failed to fetch project tasks');
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  return { tasks, loading, error, refresh: load };
}
