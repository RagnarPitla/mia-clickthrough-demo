import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ActivityTimeline from './ActivityTimeline';
import type { ActivityFeedEntry } from '../types/domain';

const makeEntry = (overrides: Partial<ActivityFeedEntry> = {}): ActivityFeedEntry => ({
  id: 'e1',
  icon: '✓',
  taskId: 'K1',
  message: 'GL Chart of Accounts configured',
  timestamp: '2026-04-25T14:34:00Z',
  ...overrides,
});

describe('ActivityTimeline', () => {
  it('renders empty state', () => {
    render(<ActivityTimeline entries={[]} />);
    expect(screen.getByTestId('activity-timeline-empty')).toBeInTheDocument();
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
  });

  it('renders entries with timestamps', () => {
    const entries = [
      makeEntry({ id: 'e1', timestamp: '2026-04-25T14:34:00Z' }),
      makeEntry({ id: 'e2', timestamp: '2026-04-25T14:31:00Z' }),
    ];
    render(<ActivityTimeline entries={entries} />);
    expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-entry-e1')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-entry-e2')).toBeInTheDocument();
  });

  it('renders status icon for each entry', () => {
    const entries = [
      makeEntry({ id: 'e1', icon: '✓' }),
      makeEntry({ id: 'e2', icon: '✗' }),
      makeEntry({ id: 'e3', icon: '▶' }),
    ];
    render(<ActivityTimeline entries={entries} />);
    expect(screen.getByTestId('timeline-icon-e1')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-icon-e2')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-icon-e3')).toBeInTheDocument();
  });

  it('applies correct color for success icon', () => {
    render(<ActivityTimeline entries={[makeEntry({ id: 'e1', icon: '✓' })]} />);
    const icon = screen.getByTestId('timeline-icon-e1');
    expect(icon.style.color).toBe('rgb(48, 209, 88)');
  });

  it('applies correct color for failed icon', () => {
    render(<ActivityTimeline entries={[makeEntry({ id: 'e1', icon: '✗' })]} />);
    const icon = screen.getByTestId('timeline-icon-e1');
    expect(icon.style.color).toBe('rgb(255, 59, 48)');
  });

  it('renders sanitized message text', () => {
    const entries = [makeEntry({ message: '```json\n{"key":"val"}\n```  extra   spaces' })];
    render(<ActivityTimeline entries={entries} />);
    // sanitizeOutput strips markdown fences and collapses whitespace
    expect(screen.getByTestId('timeline-message-e1').textContent).not.toContain('```');
  });

  it('formats timestamp to locale time string', () => {
    const entries = [makeEntry({ id: 'e1', timestamp: '2026-04-25T14:34:00Z' })];
    render(<ActivityTimeline entries={entries} />);
    const ts = screen.getByTestId('timeline-ts-e1');
    // Should have some time string rendered (locale-dependent)
    expect(ts.textContent!.length).toBeGreaterThan(0);
  });
});
