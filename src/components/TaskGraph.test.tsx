import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskGraph from './TaskGraph';
import type { Task } from '../types/domain';

// React Flow requires ResizeObserver
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = MockResizeObserver as any;

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

describe('TaskGraph', () => {
  it('shows empty state when no tasks', () => {
    render(<TaskGraph tasks={[]} />);
    expect(screen.getByTestId('task-graph-empty')).toBeInTheDocument();
  });

  it('renders task nodes for each task', () => {
    const tasks = [
      makeTask({ id: 't1', name: 'Task Alpha' }),
      makeTask({ id: 't2', name: 'Task Beta', status: 'Completed' }),
    ];
    render(<div style={{ width: 800, height: 600 }}><TaskGraph tasks={tasks} /></div>);
    expect(screen.getByText('Task Alpha')).toBeInTheDocument();
    expect(screen.getByText('Task Beta')).toBeInTheDocument();
  });

  it('shows correct status badge', () => {
    const tasks = [makeTask({ id: 't1', name: 'T1', status: 'Failed' })];
    render(<div style={{ width: 800, height: 600 }}><TaskGraph tasks={tasks} /></div>);
    expect(screen.getByText('✗ FAIL')).toBeInTheDocument();
  });

  it('shows skill tag', () => {
    const tasks = [makeTask({ id: 't1', skillName: 'fo-depreciation@1' })];
    render(<div style={{ width: 800, height: 600 }}><TaskGraph tasks={tasks} /></div>);
    expect(screen.getByText('⚙ fo-depreciation@1')).toBeInTheDocument();
  });

  it('shows output preview when present', () => {
    const tasks = [makeTask({ id: 't1', outputSummary: 'Created 3 records' })];
    render(<div style={{ width: 800, height: 600 }}><TaskGraph tasks={tasks} /></div>);
    expect(screen.getByText(/Created 3 records/)).toBeInTheDocument();
  });

  it('calls onTaskClick with task id when node is clicked', () => {
    const onClick = vi.fn();
    const tasks = [makeTask({ id: 't1', name: 'Clickable' })];
    render(<div style={{ width: 800, height: 600 }}><TaskGraph tasks={tasks} onTaskClick={onClick} /></div>);

    const node = screen.getByText('Clickable');
    fireEvent.click(node);
    expect(onClick).toHaveBeenCalledWith('t1');
  });
});
