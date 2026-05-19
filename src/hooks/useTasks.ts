import { useState, useCallback, useEffect, useRef } from 'react';
import type { Task } from '../types/domain';
import { fetchTasks, fetchDependencies } from '../services/dataverse';
import { timed } from './usePerfLog';

export function useTasks(waveId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeWaveRef = useRef(waveId);

  useEffect(() => {
    activeWaveRef.current = waveId;
    if (!waveId) { setLoading(false); return; }

    setTasks([]);
    setLoading(true);
    setError(null);

    let cancelled = false;

    (async () => {
      try {
        await timed('⏱ Total (wave)', async () => {
          const taskList = await fetchTasks(waveId);
          if (cancelled || activeWaveRef.current !== waveId) return;

          const taskIds = taskList.map(t => t.id);
          const deps = await fetchDependencies(taskIds);
          if (cancelled || activeWaveRef.current !== waveId) return;

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
        if (!cancelled) setError(e.message ?? 'Failed to fetch tasks');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [waveId]);

  const refresh = useCallback(() => {
    if (!waveId) return;
    setLoading(true);
    (async () => {
      try {
        await timed('⏱ Total (wave)', async () => {
          const taskList = await fetchTasks(waveId);
          const taskIds = taskList.map(t => t.id);
          const deps = await fetchDependencies(taskIds);
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
        setError(e.message ?? 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    })();
  }, [waveId]);

  return { tasks, loading, error, refresh };
}
