import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GateCard from './GateCard';
import type { KzkGate } from '../types/domain';

const makeGate = (overrides: Partial<KzkGate> = {}): KzkGate => ({
  kzk_gateid: 'g1',
  kzk_name: 'Kick-off Completion',
  kzk_waveid: 'w1',
  kzk_projectid: 'p1',
  kzk_outcome: 'Open',
  kzk_requiredjson: JSON.stringify([
    { label: 'GL verified live', met: true },
    { label: 'FA module enabled', met: true },
    { label: 'Team onboarded', met: false },
  ]),
  ...overrides,
});

describe('GateCard', () => {
  it('renders gate name', () => {
    render(<GateCard gate={makeGate()} />);
    expect(screen.getByTestId('gate-card')).toBeInTheDocument();
    expect(screen.getByText(/Kick-off Completion/)).toBeInTheDocument();
  });

  it('shows requirements with met/unmet status', () => {
    render(<GateCard gate={makeGate()} />);
    expect(screen.getByTestId('gate-req-0')).toBeInTheDocument();
    expect(screen.getByTestId('gate-req-1')).toBeInTheDocument();
    expect(screen.getByTestId('gate-req-2')).toBeInTheDocument();
    expect(screen.getByText('GL verified live')).toBeInTheDocument();
    expect(screen.getByText('Team onboarded')).toBeInTheDocument();
  });

  it('shows action button when gate is Open and onAction provided', () => {
    const onAction = vi.fn();
    render(<GateCard gate={makeGate()} onAction={onAction} actionLabel="Confirm Team Onboarded →" />);
    const btn = screen.getByTestId('gate-action-btn');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('hides action button when gate is passed', () => {
    render(<GateCard gate={makeGate({ kzk_outcome: 'Pass' })} onAction={() => {}} actionLabel="Confirm" />);
    expect(screen.queryByTestId('gate-action-btn')).not.toBeInTheDocument();
  });

  it('handles malformed JSON gracefully', () => {
    render(<GateCard gate={makeGate({ kzk_requiredjson: 'not json' })} />);
    expect(screen.getByTestId('gate-card')).toBeInTheDocument();
  });

  it('handles empty requirements', () => {
    render(<GateCard gate={makeGate({ kzk_requiredjson: '[]' })} />);
    expect(screen.getByTestId('gate-card')).toBeInTheDocument();
  });
});
