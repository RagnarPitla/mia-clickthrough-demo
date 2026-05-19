import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskDetailPanel, { parseCheckpoint } from './TaskDetailPanel';
import type { Task } from '../types/domain';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 't1',
  name: 'Configure Depreciation',
  status: 'Completed',
  skillName: 'fo-depreciation@1',
  waveId: 'w1',
  waveName: 'Wave 1',
  attempt: 1,
  predecessorIds: [],
  modifiedOn: '2026-01-01',
  ...overrides,
});

describe('TaskDetailPanel', () => {
  it('renders nothing when task is null', () => {
    const { container } = render(<TaskDetailPanel task={null} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows task name, status, skill', () => {
    render(<TaskDetailPanel task={makeTask()} onClose={vi.fn()} />);
    expect(screen.getByTestId('panel-title')).toHaveTextContent('Configure Depreciation');
    expect(screen.getByTestId('panel-status')).toHaveTextContent('✓ Completed');
    expect(screen.getByTestId('panel-skill')).toHaveTextContent('fo-depreciation@1');
  });

  it('shows output preview when present', () => {
    render(<TaskDetailPanel task={makeTask({ outputSummary: 'Created 3 records' })} onClose={vi.fn()} />);
    expect(screen.getByTestId('panel-output')).toHaveTextContent('Created 3 records');
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<TaskDetailPanel task={makeTask()} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('panel-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows Retry button only for Failed tasks', () => {
    render(<TaskDetailPanel task={makeTask({ status: 'Failed' })} onClose={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByTestId('btn-retry')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-cancel')).toBeNull();
  });

  it('shows Cancel button only for Ready/Pending tasks', () => {
    render(<TaskDetailPanel task={makeTask({ status: 'Ready' })} onClose={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId('btn-cancel')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-retry')).toBeNull();
  });

  it('fires onRetry with task id', () => {
    const onRetry = vi.fn();
    render(<TaskDetailPanel task={makeTask({ status: 'Failed' })} onClose={vi.fn()} onRetry={onRetry} />);
    fireEvent.click(screen.getByTestId('btn-retry'));
    expect(onRetry).toHaveBeenCalledWith('t1');
  });

  it('shows dependency count when predecessors exist', () => {
    render(<TaskDetailPanel task={makeTask({ predecessorIds: ['a', 'b'] })} onClose={vi.fn()} />);
    expect(screen.getByTestId('panel-deps')).toHaveTextContent('2 predecessor(s)');
  });

  describe('checkpoint timeline', () => {
    const SAMPLE_CHECKPOINT = [
      '[18:19:46] **Bootstrap** — Task claimed: *Initialize project*',
      '[18:19:47] **Repo** — Branch `task/f3ce54f6` created',
      '[18:19:55] **Execute** — Sending task prompt to LLM…',
      '[18:20:53] **Execute** — ✓ Complete (502 chars captured)',
    ].join('\n');

    it('renders checkpoint timeline when checkpoint is present', () => {
      render(<TaskDetailPanel task={makeTask({ checkpoint: SAMPLE_CHECKPOINT })} onClose={vi.fn()} />);
      expect(screen.getByTestId('panel-checkpoint')).toBeInTheDocument();
    });

    it('does not render checkpoint section when checkpoint is empty', () => {
      render(<TaskDetailPanel task={makeTask({ checkpoint: '' })} onClose={vi.fn()} />);
      expect(screen.queryByTestId('panel-checkpoint')).toBeNull();
    });

    it('does not render checkpoint section when checkpoint is undefined', () => {
      render(<TaskDetailPanel task={makeTask()} onClose={vi.fn()} />);
      expect(screen.queryByTestId('panel-checkpoint')).toBeNull();
    });

    it('shows stage names from checkpoint entries', () => {
      render(<TaskDetailPanel task={makeTask({ checkpoint: SAMPLE_CHECKPOINT })} onClose={vi.fn()} />);
      const el = screen.getByTestId('panel-checkpoint');
      expect(el.textContent).toContain('Bootstrap');
      expect(el.textContent).toContain('Repo');
      expect(el.textContent).toContain('Execute');
    });

    it('shows messages from checkpoint entries', () => {
      render(<TaskDetailPanel task={makeTask({ checkpoint: SAMPLE_CHECKPOINT })} onClose={vi.fn()} />);
      const el = screen.getByTestId('panel-checkpoint');
      expect(el.textContent).toContain('Task claimed');
      expect(el.textContent).toContain('Branch');
      expect(el.textContent).toContain('Sending task prompt');
    });
  });

  describe('parseCheckpoint', () => {
    it('parses standard checkpoint format', () => {
      const entries = parseCheckpoint('[18:19:46] **Bootstrap** — Task claimed');
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual({ time: '18:19:46', stage: 'Bootstrap', message: 'Task claimed' });
    });

    it('parses multiple lines', () => {
      const raw = '[18:19:46] **Bootstrap** — claimed\n[18:20:00] **Execute** — running';
      const entries = parseCheckpoint(raw);
      expect(entries).toHaveLength(2);
      expect(entries[0].stage).toBe('Bootstrap');
      expect(entries[1].stage).toBe('Execute');
    });

    it('returns empty array for empty string', () => {
      expect(parseCheckpoint('')).toEqual([]);
    });

    it('handles lines without standard format as fallback', () => {
      const entries = parseCheckpoint('Some unformatted log line');
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual({ time: '', stage: '', message: 'Some unformatted log line' });
    });

    it('handles em-dash separator', () => {
      const entries = parseCheckpoint('[18:19:46] **Repo** — Branch created');
      expect(entries[0]).toEqual({ time: '18:19:46', stage: 'Repo', message: 'Branch created' });
    });
  });

  describe('rerun with feedback', () => {
    it('shows Rerun button for Worker tasks in any status', () => {
      render(<TaskDetailPanel task={makeTask({ assigneeKind: 'Worker', status: 'Completed' })} onClose={vi.fn()} onRerun={vi.fn()} />);
      expect(screen.getByTestId('btn-rerun')).toBeInTheDocument();
    });

    it('does not show Rerun button for Role tasks', () => {
      render(<TaskDetailPanel task={makeTask({ assigneeKind: 'Role', status: 'Completed' })} onClose={vi.fn()} onRerun={vi.fn()} />);
      expect(screen.queryByTestId('btn-rerun')).toBeNull();
    });

    it('shows Resubmit hosted agent button for Worker tasks', () => {
      render(<TaskDetailPanel task={makeTask({ assigneeKind: 'Worker', status: 'InProgress' })} onClose={vi.fn()} onResubmit={vi.fn()} />);
      expect(screen.getByTestId('btn-resubmit')).toBeInTheDocument();
    });

    it('calls onResubmit with task id', () => {
      const onResubmit = vi.fn();
      render(<TaskDetailPanel task={makeTask({ assigneeKind: 'Worker', status: 'Failed' })} onClose={vi.fn()} onResubmit={onResubmit} />);
      fireEvent.click(screen.getByTestId('btn-resubmit'));
      expect(onResubmit).toHaveBeenCalledWith('t1');
    });

    it('does not show Resubmit hosted agent button for Role tasks', () => {
      render(<TaskDetailPanel task={makeTask({ assigneeKind: 'Role', status: 'Ready' })} onClose={vi.fn()} onResubmit={vi.fn()} />);
      expect(screen.queryByTestId('btn-resubmit')).toBeNull();
    });

    it('shows DA approval button for Ready Role/DA Approval tasks', () => {
      render(<TaskDetailPanel task={makeTask({ assigneeKind: 'Role', assigneeRole: 'DA', type: 'Approval', status: 'Ready' })} onClose={vi.fn()} onApproveGate={vi.fn()} />);
      expect(screen.getByTestId('btn-approve-gate')).toHaveTextContent('Approve gate');
      expect(screen.getByTestId('approval-gate-hint')).toHaveTextContent('DA approval gate');
    });

    it('calls onApproveGate with task id', () => {
      const onApproveGate = vi.fn();
      render(<TaskDetailPanel task={makeTask({ assigneeKind: 'Role', assigneeRole: 'DA', type: 'Approval', status: 'Ready' })} onClose={vi.fn()} onApproveGate={onApproveGate} />);
      fireEvent.click(screen.getByTestId('btn-approve-gate'));
      expect(onApproveGate).toHaveBeenCalledWith('t1');
    });

    it('does not show DA approval button for completed approval tasks', () => {
      render(<TaskDetailPanel task={makeTask({ assigneeKind: 'Role', assigneeRole: 'DA', type: 'Approval', status: 'Completed' })} onClose={vi.fn()} onApproveGate={vi.fn()} />);
      expect(screen.queryByTestId('btn-approve-gate')).toBeNull();
    });

    it('does not show Rerun button when onRerun is not provided', () => {
      render(<TaskDetailPanel task={makeTask({ assigneeKind: 'Worker' })} onClose={vi.fn()} />);
      expect(screen.queryByTestId('btn-rerun')).toBeNull();
    });

    it('opens feedback textarea when Rerun clicked', () => {
      render(<TaskDetailPanel task={makeTask({ assigneeKind: 'Worker' })} onClose={vi.fn()} onRerun={vi.fn()} />);
      fireEvent.click(screen.getByTestId('btn-rerun'));
      expect(screen.getByTestId('rerun-feedback')).toBeInTheDocument();
      expect(screen.getByTestId('rerun-feedback-input')).toBeInTheDocument();
    });

    it('submit is disabled when feedback is empty', () => {
      render(<TaskDetailPanel task={makeTask({ assigneeKind: 'Worker' })} onClose={vi.fn()} onRerun={vi.fn()} />);
      fireEvent.click(screen.getByTestId('btn-rerun'));
      expect(screen.getByTestId('rerun-submit')).toBeDisabled();
    });

    it('calls onRerun with task id and feedback text', () => {
      const onRerun = vi.fn();
      render(<TaskDetailPanel task={makeTask({ assigneeKind: 'Worker' })} onClose={vi.fn()} onRerun={onRerun} />);
      fireEvent.click(screen.getByTestId('btn-rerun'));
      fireEvent.change(screen.getByTestId('rerun-feedback-input'), { target: { value: 'Use 7-year depreciation' } });
      fireEvent.click(screen.getByTestId('rerun-submit'));
      expect(onRerun).toHaveBeenCalledWith('t1', 'Use 7-year depreciation');
    });

    it('closes feedback panel on cancel', () => {
      render(<TaskDetailPanel task={makeTask({ assigneeKind: 'Worker' })} onClose={vi.fn()} onRerun={vi.fn()} />);
      fireEvent.click(screen.getByTestId('btn-rerun'));
      expect(screen.getByTestId('rerun-feedback')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('rerun-cancel'));
      expect(screen.queryByTestId('rerun-feedback')).toBeNull();
    });
  });
});
