import { useState, useCallback, useEffect, useRef } from 'react';
import type { WatchdogSchedule, Task } from '../types/domain';
import {
  fetchWatchdogSchedules,
  createWatchdogSchedule,
  updateWatchdogSchedule,
  deleteWatchdogSchedule,
  fetchWatchdogActivity,
  type CreateWatchdogScheduleInput,
} from '../services/dataverse';

export function useWatchdogSchedules(enabled = true) {
  const [schedules, setSchedules] = useState<WatchdogSchedule[]>([]);
  const [activity, setActivity] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!enabled) {
      setSchedules([]);
      setActivity([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const scheduleList = await fetchWatchdogSchedules();
      if (!mountedRef.current) return;
      setSchedules(scheduleList);

      const skillNames = [...new Set(scheduleList.map(s => s.skillName).filter(Boolean))];
      const activityList = await fetchWatchdogActivity(skillNames);
      if (!mountedRef.current) return;
      setActivity(activityList);
    } catch (e: any) {
      if (mountedRef.current) setError(e.message ?? 'Failed to load watchdog data');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  const create = useCallback(async (input: CreateWatchdogScheduleInput) => {
    if (!enabled) return;
    await createWatchdogSchedule(input);
    await load();
  }, [enabled, load]);

  const update = useCallback(async (id: string, fields: Partial<Omit<CreateWatchdogScheduleInput, 'projectId'>>) => {
    if (!enabled) return;
    await updateWatchdogSchedule(id, fields);
    await load();
  }, [enabled, load]);

  const remove = useCallback(async (id: string) => {
    if (!enabled) return;
    await deleteWatchdogSchedule(id);
    await load();
  }, [enabled, load]);

  return { schedules, activity, loading, error, refresh: load, create, update, remove };
}
