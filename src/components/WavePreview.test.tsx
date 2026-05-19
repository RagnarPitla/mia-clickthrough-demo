import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WavePreview from './WavePreview';
import type { PlaybookTaskPreview } from '../types/domain';

const sampleTasks: PlaybookTaskPreview[] = [
  {
    id: 'K1',
    title: 'Verify GL is live',
    assigneeKind: 'Worker',
    skillName: 'fo-gl-verify',
    dependsOn: [],
  },
  {
    id: 'K2',
    title: 'Enable FA module',
    assigneeKind: 'Worker',
    skillName: 'fo-module-config',
    dependsOn: ['K1'],
  },
  {
    id: 'K3',
    title: 'Confirm team onboarding',
    assigneeKind: 'Role',
    assigneeRole: 'DA',
    dependsOn: ['K2'],
  },
];

const gateReqs = ['GL verified live', 'FA module enabled', 'Team onboarded'];

describe('WavePreview', () => {
  it('renders with data-testid', () => {
    render(<WavePreview waveName="Wave 0 — Project Setup" tasks={sampleTasks} />);
    expect(screen.getByTestId('wave-preview')).toBeInTheDocument();
  });

  it('shows wave name', () => {
    render(<WavePreview waveName="Wave 0 — Project Setup" tasks={sampleTasks} />);
    expect(screen.getByText('Wave 0 — Project Setup')).toBeInTheDocument();
  });

  it('renders all tasks', () => {
    render(<WavePreview waveName="Wave 0" tasks={sampleTasks} />);
    expect(screen.getByTestId('wave-task-K1')).toBeInTheDocument();
    expect(screen.getByTestId('wave-task-K2')).toBeInTheDocument();
    expect(screen.getByTestId('wave-task-K3')).toBeInTheDocument();
  });

  it('shows AI Worker label for Worker tasks', () => {
    render(<WavePreview waveName="Wave 0" tasks={sampleTasks} />);
    expect(screen.getByTestId('wave-task-assignee-K1').textContent).toBe('AI Worker');
  });

  it('shows You (DA) label for Role tasks', () => {
    render(<WavePreview waveName="Wave 0" tasks={sampleTasks} />);
    expect(screen.getByTestId('wave-task-assignee-K3').textContent).toBe('You (DA)');
  });

  it('shows skill badge for tasks with skills', () => {
    render(<WavePreview waveName="Wave 0" tasks={sampleTasks} />);
    expect(screen.getByTestId('wave-task-skill-K1').textContent).toContain('fo-gl-verify');
  });

  it('does not show skill badge for tasks without skills', () => {
    render(<WavePreview waveName="Wave 0" tasks={sampleTasks} />);
    expect(screen.queryByTestId('wave-task-skill-K3')).not.toBeInTheDocument();
  });

  it('shows gate requirements when provided', () => {
    render(
      <WavePreview waveName="Wave 0" tasks={sampleTasks} gateRequirements={gateReqs} />,
    );
    expect(screen.getByTestId('wave-gate')).toBeInTheDocument();
    expect(screen.getByTestId('gate-req-0').textContent).toContain('GL verified live');
    expect(screen.getByTestId('gate-req-1').textContent).toContain('FA module enabled');
    expect(screen.getByTestId('gate-req-2').textContent).toContain('Team onboarded');
  });

  it('does not show gate section when no requirements', () => {
    render(<WavePreview waveName="Wave 0" tasks={sampleTasks} />);
    expect(screen.queryByTestId('wave-gate')).not.toBeInTheDocument();
  });

  it('shows task count', () => {
    render(<WavePreview waveName="Wave 0" tasks={sampleTasks} />);
    expect(screen.getByTestId('wave-task-count').textContent).toContain('Wave 0: 3 tasks');
  });
});
