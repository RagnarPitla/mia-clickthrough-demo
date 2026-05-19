import { describe, it, expect } from 'vitest';
import { deriveKickoffGate, deriveActivityFromTasks } from './dashboardHelpers';
import type { Task } from '../types/domain';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 't1',
  name: 'Task 1',
  status: 'Pending',
  skillName: '',
  waveId: 'w1',
  waveName: 'Wave 0',
  attempt: 0,
  predecessorIds: [],
  modifiedOn: '2026-04-25T12:00:00Z',
  ...overrides,
});

describe('deriveKickoffGate', () => {
  it('returns null for empty tasks', () => {
    expect(deriveKickoffGate([], 'w1', 'p1')).toBeNull();
  });

  it('returns Open gate when not all tasks complete', () => {
    const tasks = [
      makeTask({ id: 't1', status: 'Completed' }),
      makeTask({ id: 't2', status: 'Pending' }),
    ];
    const gate = deriveKickoffGate(tasks, 'w1', 'p1');
    expect(gate?.kzk_outcome).toBe('Open');
  });

  it('returns Pass gate when all tasks complete', () => {
    const tasks = [
      makeTask({ id: 't1', status: 'Completed' }),
      makeTask({ id: 't2', status: 'Completed' }),
    ];
    const gate = deriveKickoffGate(tasks, 'w1', 'p1');
    expect(gate?.kzk_outcome).toBe('Pass');
  });

  it('includes task names as requirements', () => {
    const tasks = [
      makeTask({ id: 't1', name: 'Verify GL', status: 'Completed' }),
      makeTask({ id: 't2', name: 'Enable FA', status: 'Pending' }),
    ];
    const gate = deriveKickoffGate(tasks, 'w1', 'p1');
    const reqs = JSON.parse(gate!.kzk_requiredjson);
    expect(reqs).toHaveLength(2);
    expect(reqs[0]).toEqual({ label: 'Verify GL', met: true });
    expect(reqs[1]).toEqual({ label: 'Enable FA', met: false });
  });
});

describe('deriveActivityFromTasks', () => {
  it('returns empty for no tasks', () => {
    expect(deriveActivityFromTasks([])).toEqual([]);
  });

  it('excludes Pending and Ready tasks', () => {
    const tasks = [
      makeTask({ id: 't1', status: 'Pending' }),
      makeTask({ id: 't2', status: 'Ready' }),
    ];
    expect(deriveActivityFromTasks(tasks)).toEqual([]);
  });

  it('maps Completed tasks with ✓ icon', () => {
    const tasks = [makeTask({ id: 't1', name: 'K1 Verify', status: 'Completed', outputSummary: 'GL is live' })];
    const entries = deriveActivityFromTasks(tasks);
    expect(entries).toHaveLength(1);
    expect(entries[0].icon).toBe('✓');
    expect(entries[0].message).toBe('GL is live');
  });

  it('maps InProgress tasks with ▶ icon', () => {
    const tasks = [makeTask({ id: 't1', name: 'K2 Enable', status: 'InProgress' })];
    const entries = deriveActivityFromTasks(tasks);
    expect(entries[0].icon).toBe('▶');
    expect(entries[0].message).toContain('running');
  });

  it('maps Failed tasks with ✗ icon', () => {
    const tasks = [makeTask({ id: 't1', name: 'K1 Verify', status: 'Failed' })];
    const entries = deriveActivityFromTasks(tasks);
    expect(entries[0].icon).toBe('✗');
  });

  it('sorts by modifiedOn timestamp', () => {
    const tasks = [
      makeTask({ id: 't2', status: 'Completed', modifiedOn: '2026-04-25T12:02:00Z' }),
      makeTask({ id: 't1', status: 'Completed', modifiedOn: '2026-04-25T12:00:00Z' }),
    ];
    const entries = deriveActivityFromTasks(tasks);
    expect(entries[0].id).toBe('activity-t1');
    expect(entries[1].id).toBe('activity-t2');
  });
});
