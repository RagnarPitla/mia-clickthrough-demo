import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WaveSidebar from './WaveSidebar';
import type { Wave, Task } from '../types/domain';

const makeWave = (overrides: Partial<Wave> = {}): Wave => ({
  id: 'w1',
  name: 'Wave 0 — Project Setup',
  description: '',
  status: 'Active',
  projectId: 'p1',
  taskCount: 3,
  errorCount: 0,
  ...overrides,
});

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

describe('WaveSidebar', () => {
  it('renders empty state when no waves', () => {
    render(<WaveSidebar waves={[]} tasks={[]} activeWaveId={null} onSelectWave={() => {}} />);
    expect(screen.getByTestId('wave-sidebar-empty')).toBeInTheDocument();
  });

  it('renders wave cards', () => {
    const waves = [makeWave({ id: 'w1', name: 'Wave 0 — Setup' }), makeWave({ id: 'w2', name: 'Wave 1 — Collect' })];
    render(<WaveSidebar waves={waves} tasks={[]} activeWaveId="w1" onSelectWave={() => {}} />);
    expect(screen.getByTestId('wave-sidebar')).toBeInTheDocument();
    expect(screen.getByText('Wave 0 — Setup')).toBeInTheDocument();
    expect(screen.getByText('Wave 1 — Collect')).toBeInTheDocument();
  });

  it('shows progress bar with completed/total counts', () => {
    const waves = [makeWave({ id: 'w1', taskCount: 3 })];
    const tasks = [
      makeTask({ id: 't1', waveId: 'w1', status: 'Completed' }),
      makeTask({ id: 't2', waveId: 'w1', status: 'InProgress' }),
      makeTask({ id: 't3', waveId: 'w1', status: 'Pending' }),
    ];
    render(<WaveSidebar waves={waves} tasks={tasks} activeWaveId="w1" onSelectWave={() => {}} />);
    expect(screen.getByTestId('wave-progress-w1')).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  it('highlights active wave', () => {
    const waves = [makeWave({ id: 'w1' }), makeWave({ id: 'w2' })];
    render(<WaveSidebar waves={waves} tasks={[]} activeWaveId="w1" onSelectWave={() => {}} />);
    expect(screen.getByTestId('wave-sidebar-card-w1').getAttribute('data-active')).toBe('true');
    expect(screen.getByTestId('wave-sidebar-card-w2').getAttribute('data-active')).toBe('false');
  });
});
