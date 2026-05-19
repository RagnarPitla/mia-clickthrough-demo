import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WatchDogPage from './WatchDogPage';
import type { WatchDogPageProps } from './WatchDogPage';
import type { WatchdogSchedule, Task } from '../types/domain';

const makeSchedule = (overrides: Partial<WatchdogSchedule> = {}): WatchdogSchedule => ({
  id: 's1',
  name: 'Nightly Health Check',
  cronExpression: '0 0 * * *',
  skillName: 'health-check',
  promptText: 'Check system health',
  toolsAllowed: 'dataverse-read',
  enabled: true,
  ...overrides,
});

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 't1',
  name: 'Health check run',
  status: 'Completed',
  skillName: '[{"name":"health-check","version":"1"}]',
  waveId: 'w1',
  waveName: 'Wave 1',
  attempt: 0,
  predecessorIds: [],
  outputSummary: 'All systems operational',
  modifiedOn: '2026-04-27T10:00:00Z',
  ...overrides,
});

function defaultProps(overrides: Partial<WatchDogPageProps> = {}): WatchDogPageProps {
  return {
    schedules: [],
    activity: [],
    loading: false,
    error: null,
    onCreateSchedule: vi.fn().mockResolvedValue(undefined),
    onUpdateSchedule: vi.fn().mockResolvedValue(undefined),
    onDeleteSchedule: vi.fn().mockResolvedValue(undefined),
    onToggleSchedule: vi.fn().mockResolvedValue(undefined),
    onRefresh: vi.fn(),
    ...overrides,
  };
}

describe('WatchDogPage', () => {
  // ── Loading state ──

  it('renders loading state', () => {
    render(<WatchDogPage {...defaultProps({ loading: true })} />);
    expect(screen.getByTestId('watchdog-page')).toBeInTheDocument();
    expect(screen.getByTestId('watchdog-loading')).toBeInTheDocument();
  });

  // ── Empty state ──

  it('renders empty state when no schedules', () => {
    render(<WatchDogPage {...defaultProps()} />);
    expect(screen.getByTestId('watchdog-page')).toBeInTheDocument();
    expect(screen.getByTestId('watchdog-empty')).toBeInTheDocument();
    expect(screen.getByText(/No watchdog schedules configured/)).toBeInTheDocument();
  });

  // ── Error state ──

  it('renders error banner', () => {
    render(<WatchDogPage {...defaultProps({ error: 'Table not found' })} />);
    expect(screen.getByTestId('watchdog-error')).toHaveTextContent('Table not found');
  });

  // ── Schedule list ──

  it('renders schedule rows', () => {
    const schedules = [
      makeSchedule({ id: 's1', name: 'Nightly Check', cronExpression: '0 0 * * *', skillName: 'health-check' }),
      makeSchedule({ id: 's2', name: 'Weekly Audit', cronExpression: '0 0 * * 0', skillName: 'audit', enabled: false }),
    ];
    render(<WatchDogPage {...defaultProps({ schedules })} />);
    expect(screen.getByTestId('schedule-row-s1')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-row-s2')).toBeInTheDocument();
    expect(screen.getByText('Nightly Check')).toBeInTheDocument();
    expect(screen.getByText('Weekly Audit')).toBeInTheDocument();
  });

  it('renders status badges', () => {
    const schedules = [makeSchedule({ lastStatus: 'Success' })];
    render(<WatchDogPage {...defaultProps({ schedules })} />);
    expect(screen.getByTestId('schedule-status-s1')).toHaveTextContent('Success');
  });

  // ── Toggle ──

  it('calls onToggleSchedule when toggle is clicked', () => {
    const onToggle = vi.fn().mockResolvedValue(undefined);
    const schedules = [makeSchedule({ enabled: true })];
    render(<WatchDogPage {...defaultProps({ schedules, onToggleSchedule: onToggle })} />);
    fireEvent.click(screen.getByTestId('schedule-toggle-s1'));
    expect(onToggle).toHaveBeenCalledWith('s1', false);
  });

  // ── Create schedule ──

  it('opens create form when Add Schedule clicked', () => {
    render(<WatchDogPage {...defaultProps()} />);
    expect(screen.queryByTestId('watchdog-schedule-form')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('watchdog-add-btn'));
    expect(screen.getByTestId('watchdog-schedule-form')).toBeInTheDocument();
    expect(screen.getByText('New Schedule')).toBeInTheDocument();
  });

  it('submits create form', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<WatchDogPage {...defaultProps({ onCreateSchedule: onCreate })} />);
    fireEvent.click(screen.getByTestId('watchdog-add-btn'));

    fireEvent.change(screen.getByTestId('schedule-name-input'), { target: { value: 'Test Schedule' } });
    fireEvent.change(screen.getByTestId('schedule-cron-input'), { target: { value: '*/5 * * * *' } });
    fireEvent.change(screen.getByTestId('schedule-skill-input'), { target: { value: 'test-skill' } });
    fireEvent.change(screen.getByTestId('schedule-prompt-input'), { target: { value: 'Run tests' } });
    fireEvent.click(screen.getByTestId('schedule-save-btn'));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Schedule',
        cronExpression: '*/5 * * * *',
        skillName: 'test-skill',
        promptText: 'Run tests',
        enabled: true,
      }));
    });
  });

  it('cancels form', () => {
    render(<WatchDogPage {...defaultProps()} />);
    fireEvent.click(screen.getByTestId('watchdog-add-btn'));
    expect(screen.getByTestId('watchdog-schedule-form')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('schedule-cancel-btn'));
    expect(screen.queryByTestId('watchdog-schedule-form')).not.toBeInTheDocument();
  });

  // ── Edit schedule ──

  it('opens edit form with pre-filled values', () => {
    const schedules = [makeSchedule()];
    render(<WatchDogPage {...defaultProps({ schedules })} />);
    fireEvent.click(screen.getByTestId('schedule-edit-s1'));
    expect(screen.getByTestId('watchdog-schedule-form')).toBeInTheDocument();
    expect(screen.getByText('Edit Schedule')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-name-input')).toHaveValue('Nightly Health Check');
  });

  it('submits edit form', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const schedules = [makeSchedule()];
    render(<WatchDogPage {...defaultProps({ schedules, onUpdateSchedule: onUpdate })} />);
    fireEvent.click(screen.getByTestId('schedule-edit-s1'));
    fireEvent.change(screen.getByTestId('schedule-name-input'), { target: { value: 'Updated Name' } });
    fireEvent.click(screen.getByTestId('schedule-save-btn'));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith('s1', expect.objectContaining({
        name: 'Updated Name',
      }));
    });
  });

  // ── Delete schedule ──

  it('shows delete confirmation dialog', () => {
    const schedules = [makeSchedule()];
    render(<WatchDogPage {...defaultProps({ schedules })} />);
    fireEvent.click(screen.getByTestId('schedule-delete-s1'));
    expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
  });

  it('calls onDeleteSchedule when confirmed', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const schedules = [makeSchedule()];
    render(<WatchDogPage {...defaultProps({ schedules, onDeleteSchedule: onDelete })} />);
    fireEvent.click(screen.getByTestId('schedule-delete-s1'));
    fireEvent.click(screen.getByTestId('delete-confirm-btn'));
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith('s1');
    });
  });

  it('cancels delete', () => {
    const schedules = [makeSchedule()];
    render(<WatchDogPage {...defaultProps({ schedules })} />);
    fireEvent.click(screen.getByTestId('schedule-delete-s1'));
    fireEvent.click(screen.getByTestId('delete-cancel-btn'));
    expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument();
  });

  // ── Activity feed ──

  it('renders activity entries', () => {
    const activity = [
      makeTask({ id: 't1', status: 'Completed', outputSummary: 'All good' }),
      makeTask({ id: 't2', status: 'Failed', outputSummary: 'Check failed' }),
    ];
    render(<WatchDogPage {...defaultProps({ activity })} />);
    expect(screen.getByTestId('watchdog-activity-list')).toBeInTheDocument();
    expect(screen.getByTestId('activity-entry-t1')).toBeInTheDocument();
    expect(screen.getByTestId('activity-entry-t2')).toBeInTheDocument();
  });

  it('renders empty activity state', () => {
    render(<WatchDogPage {...defaultProps()} />);
    expect(screen.getByTestId('watchdog-activity-empty')).toBeInTheDocument();
    expect(screen.getByText(/No recent watchdog activity/)).toBeInTheDocument();
  });

  // ── Refresh ──

  it('calls onRefresh when refresh button clicked', () => {
    const onRefresh = vi.fn();
    render(<WatchDogPage {...defaultProps({ onRefresh })} />);
    fireEvent.click(screen.getByTestId('watchdog-refresh-btn'));
    expect(onRefresh).toHaveBeenCalled();
  });

  // ── Save button disabled state ──

  it('disables save button when name is empty', () => {
    render(<WatchDogPage {...defaultProps()} />);
    fireEvent.click(screen.getByTestId('watchdog-add-btn'));
    const saveBtn = screen.getByTestId('schedule-save-btn');
    expect(saveBtn).toBeDisabled();
  });

  // ── Sections structure ──

  it('renders both schedule and activity sections', () => {
    render(<WatchDogPage {...defaultProps()} />);
    expect(screen.getByTestId('watchdog-schedules-card')).toBeInTheDocument();
    expect(screen.getByTestId('watchdog-activity-card')).toBeInTheDocument();
  });
});
