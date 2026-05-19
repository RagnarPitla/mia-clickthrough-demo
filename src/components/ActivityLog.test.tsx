import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ActivityLog, { type ActivityEntry } from './ActivityLog';

const makeEntry = (overrides: Partial<ActivityEntry> = {}): ActivityEntry => ({
  id: 'a1',
  timestamp: '2026-04-25T12:00:00Z',
  taskName: 'Configure Depreciation',
  action: 'Completed',
  ...overrides,
});

describe('ActivityLog', () => {
  it('shows empty state', () => {
    render(<ActivityLog entries={[]} />);
    expect(screen.getByTestId('activity-empty')).toBeInTheDocument();
  });

  it('renders entries', () => {
    const entries = [
      makeEntry({ id: 'a1', taskName: 'Task A', action: 'Started' }),
      makeEntry({ id: 'a2', taskName: 'Task B', action: 'Completed' }),
    ];
    render(<ActivityLog entries={entries} />);
    expect(screen.getByTestId('activity-a1')).toBeInTheDocument();
    expect(screen.getByTestId('activity-a2')).toBeInTheDocument();
    expect(screen.getByText('Task A')).toBeInTheDocument();
    expect(screen.getByText('Started')).toBeInTheDocument();
  });

  it('shows detail when present', () => {
    const entries = [makeEntry({ detail: 'Created 3 records' })];
    render(<ActivityLog entries={entries} />);
    expect(screen.getByText('Created 3 records')).toBeInTheDocument();
  });
});
