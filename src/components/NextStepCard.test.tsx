import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NextStepCard, { deriveNextStep } from './NextStepCard';
import type { E2EProcess, Wave, Task, Project } from '../types/domain';

function makeProcess(overrides: Partial<E2EProcess> = {}): E2EProcess {
  return {
    id: 'proc-1', name: 'GL', bpcId: 'bpc-1', areas: 'Finance',
    modules: 'GL', isInScope: true, projectId: 'proj-1', ...overrides,
  };
}

function makeWave(overrides: Partial<Wave> = {}): Wave {
  return {
    id: 'wave-1', name: 'Wave 1', description: '', status: 'Released',
    projectId: 'proj-1', taskCount: 3, errorCount: 0, ...overrides,
  };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1', name: 'Config GL', status: 'Ready', skillName: 'gl-config',
    waveId: 'wave-1', waveName: 'Wave 1', attempt: 1, predecessorIds: [],
    modifiedOn: new Date().toISOString(), ...overrides,
  };
}

const PROJECT: Project = {
  id: 'proj-1', name: 'Contoso FA', description: 'Test project',
  customerName: 'Contoso', foSandboxUrl: 'https://d365.example.com',
};

describe('deriveNextStep', () => {
  it('returns loading when isLoading is true', () => {
    expect(deriveNextStep([], [], [], true)).toBe('loading');
  });

  it('returns review-scope when no processes are in scope', () => {
    const procs = [makeProcess({ isInScope: false })];
    expect(deriveNextStep(procs, [], [], false)).toBe('review-scope');
  });

  it('returns review-scope when processes list is empty', () => {
    expect(deriveNextStep([], [], [], false)).toBe('review-scope');
  });

  it('returns compose-wave when processes scoped but no waves', () => {
    const procs = [makeProcess({ isInScope: true })];
    expect(deriveNextStep(procs, [], [], false)).toBe('compose-wave');
  });

  it('returns monitor-execution when tasks are running', () => {
    const procs = [makeProcess()];
    const waves = [makeWave()];
    const tasks = [
      makeTask({ id: 't1', status: 'Completed' }),
      makeTask({ id: 't2', status: 'InProgress' }),
    ];
    expect(deriveNextStep(procs, waves, tasks, false)).toBe('monitor-execution');
  });

  it('returns review-gate when tasks complete but not all done', () => {
    const procs = [makeProcess()];
    const waves = [makeWave()];
    const tasks = [
      makeTask({ id: 't1', status: 'Completed' }),
      makeTask({ id: 't2', status: 'Failed' }),
    ];
    expect(deriveNextStep(procs, waves, tasks, false)).toBe('review-gate');
  });

  it('returns verify-d365 when all tasks completed', () => {
    const procs = [makeProcess()];
    const waves = [makeWave()];
    const tasks = [
      makeTask({ id: 't1', status: 'Completed' }),
      makeTask({ id: 't2', status: 'Completed' }),
    ];
    expect(deriveNextStep(procs, waves, tasks, false)).toBe('verify-d365');
  });

  it('returns compose-wave when waves exist but no tasks', () => {
    const procs = [makeProcess()];
    const waves = [makeWave()];
    expect(deriveNextStep(procs, waves, [], false)).toBe('compose-wave');
  });
});

describe('NextStepCard', () => {
  it('renders loading skeleton when isLoading', () => {
    render(
      <NextStepCard processes={[]} waves={[]} tasks={[]} project={PROJECT}
        isLoading onNavigate={() => {}} />,
    );
    const card = screen.getByTestId('next-step-card');
    expect(card.getAttribute('data-state')).toBe('loading');
  });

  it('renders review-scope state with correct CTA', () => {
    const onNav = vi.fn();
    render(
      <NextStepCard processes={[]} waves={[]} tasks={[]} project={PROJECT}
        onNavigate={onNav} />,
    );
    expect(screen.getByText('Review proposed scope')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('next-step-cta'));
    expect(onNav).toHaveBeenCalledWith('process');
  });

  it('renders compose-wave state', () => {
    const procs = [makeProcess()];
    render(
      <NextStepCard processes={procs} waves={[]} tasks={[]} project={PROJECT}
        onNavigate={() => {}} />,
    );
    expect(screen.getByText('Compose your first wave')).toBeInTheDocument();
  });

  it('renders monitor-execution state with task counts', () => {
    const procs = [makeProcess()];
    const waves = [makeWave()];
    const tasks = [
      makeTask({ id: 't1', status: 'Completed' }),
      makeTask({ id: 't2', status: 'InProgress' }),
      makeTask({ id: 't3', status: 'Ready' }),
    ];
    render(
      <NextStepCard processes={procs} waves={waves} tasks={tasks} project={PROJECT}
        onNavigate={() => {}} />,
    );
    expect(screen.getByText(/Monitor Wave/)).toBeInTheDocument();
    expect(screen.getByText(/1 of 3 tasks complete/)).toBeInTheDocument();
  });

  it('renders verify-d365 state and opens external link', () => {
    const procs = [makeProcess()];
    const waves = [makeWave()];
    const tasks = [makeTask({ status: 'Completed' })];
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(
      <NextStepCard processes={procs} waves={waves} tasks={tasks} project={PROJECT}
        onNavigate={() => {}} />,
    );
    expect(screen.getByText('Verify in D365')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('next-step-cta'));
    expect(openSpy).toHaveBeenCalledWith('https://d365.example.com', '_blank', 'noopener');
    openSpy.mockRestore();
  });
});
