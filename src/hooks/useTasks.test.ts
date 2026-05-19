import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTasks } from './useTasks';

// Mock dataverse service at boundary
vi.mock('../services/dataverse', () => ({
  fetchTasks: vi.fn(),
  fetchDependencies: vi.fn(),
}));

import { fetchTasks, fetchDependencies } from '../services/dataverse';

const mockFetchTasks = vi.mocked(fetchTasks);
const mockFetchDeps = vi.mocked(fetchDependencies);

const WAVE_ID = 'wave-001';

const fakeTasks = [
  { id: 't1', name: 'Task 1', status: 'Ready' as const, skillName: 'skill-a', waveId: WAVE_ID, waveName: '', attempt: 0, predecessorIds: [], modifiedOn: '2026-01-01' },
  { id: 't2', name: 'Task 2', status: 'Pending' as const, skillName: 'skill-b', waveId: WAVE_ID, waveName: '', attempt: 0, predecessorIds: [], modifiedOn: '2026-01-01' },
];

const fakeDeps = [
  { taskId: 't2', predecessorId: 't1' },
];

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchTasks.mockResolvedValue(fakeTasks);
    mockFetchDeps.mockResolvedValue(fakeDeps);
  });

  it('fetches tasks and wires dependencies for a wave', async () => {
    const { result } = renderHook(() => useTasks(WAVE_ID));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tasks).toHaveLength(2);
    expect(result.current.tasks[0].predecessorIds).toEqual([]);
    expect(result.current.tasks[1].predecessorIds).toEqual(['t1']);
    expect(result.current.error).toBeNull();
  });

  it('returns empty when waveId is null', async () => {
    const { result } = renderHook(() => useTasks(null));

    // Should not fetch at all
    expect(mockFetchTasks).not.toHaveBeenCalled();
    expect(result.current.tasks).toEqual([]);
  });

  it('surfaces fetch errors', async () => {
    mockFetchTasks.mockRejectedValueOnce(new Error('Network down'));

    const { result } = renderHook(() => useTasks(WAVE_ID));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Network down');
  });
});
