import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskList from './TaskList';
import type { Task } from '../types/domain';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 't1',
  name: 'Test Task',
  status: 'Ready',
  skillName: 'test-skill@1',
  waveId: 'w1',
  waveName: 'Wave 1',
  attempt: 0,
  predecessorIds: [],
  modifiedOn: '2026-01-01',
  ...overrides,
});

describe('TaskList', () => {
  it('shows empty state when no tasks', () => {
    render(<TaskList tasks={[]} />);
    expect(screen.getByTestId('task-list-empty')).toBeInTheDocument();
  });

  it('renders a row per task', () => {
    const tasks = [
      makeTask({ id: 't1', name: 'Alpha' }),
      makeTask({ id: 't2', name: 'Beta' }),
      makeTask({ id: 't3', name: 'Gamma' }),
    ];
    render(<TaskList tasks={tasks} />);
    expect(screen.getByTestId('task-row-t1')).toBeInTheDocument();
    expect(screen.getByTestId('task-row-t2')).toBeInTheDocument();
    expect(screen.getByTestId('task-row-t3')).toBeInTheDocument();
  });

  it('shows status labels correctly', () => {
    const tasks = [
      makeTask({ id: 't1', status: 'Completed' }),
      makeTask({ id: 't2', status: 'Failed' }),
    ];
    render(<TaskList tasks={tasks} />);
    expect(screen.getByTestId('status-t1')).toHaveTextContent('✓ Done');
    expect(screen.getByTestId('status-t2')).toHaveTextContent('✗ Failed');
  });

  it('calls onTaskClick with task id', () => {
    const onClick = vi.fn();
    const tasks = [makeTask({ id: 't1', name: 'Clickable' })];
    render(<TaskList tasks={tasks} onTaskClick={onClick} />);
    fireEvent.click(screen.getByTestId('task-row-t1'));
    expect(onClick).toHaveBeenCalledWith('t1');
  });

  it('highlights selected row', () => {
    const tasks = [makeTask({ id: 't1' }), makeTask({ id: 't2' })];
    render(<TaskList tasks={tasks} selectedTaskId="t1" />);
    const row = screen.getByTestId('task-row-t1');
    expect(row.style.background).toContain('var(--accent-glow)');
  });
});
