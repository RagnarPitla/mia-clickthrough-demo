import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatsRow from './StatsRow';
import type { Wave, Task } from '../types/domain';

function makeWave(id: string): Wave {
  return { id, name: `Wave ${id}`, description: '', status: 'Released', projectId: 'proj-1', taskCount: 3, errorCount: 0 };
}

function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    name: 'Task', status: 'Ready', skillName: 'skill', waveId: 'w1',
    waveName: 'Wave 1', attempt: 1, predecessorIds: [],
    modifiedOn: new Date().toISOString(), ...overrides,
  };
}

describe('StatsRow', () => {
  it('renders 4 stat cards', () => {
    render(<StatsRow waves={[makeWave('1'), makeWave('2')]} tasks={[]} teamCount={5} />);
    expect(screen.getByTestId('stats-row')).toBeInTheDocument();
    expect(screen.getByTestId('stat-waves')).toBeInTheDocument();
    expect(screen.getByTestId('stat-tasks')).toBeInTheDocument();
    expect(screen.getByTestId('stat-complete')).toBeInTheDocument();
    expect(screen.getByTestId('stat-team')).toBeInTheDocument();
  });

  it('displays correct wave count', () => {
    render(<StatsRow waves={[makeWave('1'), makeWave('2'), makeWave('3')]} tasks={[]} teamCount={0} />);
    expect(screen.getByTestId('stat-waves').textContent).toContain('3');
  });

  it('displays correct task count', () => {
    const tasks = [makeTask({ id: 't1' }), makeTask({ id: 't2' }), makeTask({ id: 't3' })];
    render(<StatsRow waves={[]} tasks={tasks} teamCount={0} />);
    expect(screen.getByTestId('stat-tasks').textContent).toContain('3');
  });

  it('calculates completion percentage', () => {
    const tasks = [
      makeTask({ id: 't1', status: 'Completed' }),
      makeTask({ id: 't2', status: 'Completed' }),
      makeTask({ id: 't3', status: 'Ready' }),
      makeTask({ id: 't4', status: 'InProgress' }),
    ];
    render(<StatsRow waves={[]} tasks={tasks} teamCount={0} />);
    expect(screen.getByTestId('stat-complete').textContent).toContain('50%');
  });

  it('shows 0% when no tasks', () => {
    render(<StatsRow waves={[]} tasks={[]} teamCount={0} />);
    expect(screen.getByTestId('stat-complete').textContent).toContain('0%');
  });

  it('displays team count', () => {
    render(<StatsRow waves={[]} tasks={[]} teamCount={7} />);
    expect(screen.getByTestId('stat-team').textContent).toContain('7');
  });
});
