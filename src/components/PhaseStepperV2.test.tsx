import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PhaseStepperV2 from './PhaseStepperV2';
import type { Phase } from '../types/domain';

function makePhase(overrides: Partial<Phase> & { name: string; order: number }): Phase {
  return {
    id: `phase-${overrides.order}`,
    description: '',
    status: 'NotStarted',
    projectId: 'proj-1',
    ...overrides,
  };
}

const SEVEN_PHASES: Phase[] = [
  makePhase({ name: 'Kick-off', order: 1, status: 'Completed' }),
  makePhase({ name: 'Design', order: 2, status: 'Active' }),
  makePhase({ name: 'CRP 1', order: 3 }),
  makePhase({ name: 'Feedback', order: 4 }),
  makePhase({ name: 'CRP 2', order: 5 }),
  makePhase({ name: 'Migration', order: 6 }),
  makePhase({ name: 'Go-Live', order: 7 }),
];

describe('PhaseStepperV2', () => {
  it('renders all 7 phase labels', () => {
    render(<PhaseStepperV2 phases={SEVEN_PHASES} />);
    expect(screen.getByTestId('phase-stepper-v2')).toBeInTheDocument();
    for (const p of SEVEN_PHASES) {
      expect(screen.getByText(new RegExp(p.name))).toBeInTheDocument();
    }
  });

  it('marks completed phases with ✓ prefix and green styling', () => {
    render(<PhaseStepperV2 phases={SEVEN_PHASES} />);
    const pill = screen.getByTestId('phase-pill-0');
    expect(pill.getAttribute('data-state')).toBe('completed');
    expect(pill.textContent).toContain('✓');
  });

  it('marks active phase with ● prefix', () => {
    render(<PhaseStepperV2 phases={SEVEN_PHASES} />);
    const pill = screen.getByTestId('phase-pill-1');
    expect(pill.getAttribute('data-state')).toBe('active');
    expect(pill.textContent).toContain('●');
  });

  it('marks future phases as future', () => {
    render(<PhaseStepperV2 phases={SEVEN_PHASES} />);
    const pill = screen.getByTestId('phase-pill-2');
    expect(pill.getAttribute('data-state')).toBe('future');
  });

  it('renders 6 gate diamonds between 7 phases', () => {
    render(<PhaseStepperV2 phases={SEVEN_PHASES} />);
    const gates = screen.getAllByTestId(/^gate-diamond-/);
    expect(gates).toHaveLength(6);
  });

  it('renders completed gate diamond after completed phase', () => {
    render(<PhaseStepperV2 phases={SEVEN_PHASES} />);
    const gate = screen.getByTestId('gate-diamond-0');
    expect(gate.getAttribute('data-completed')).toBe('true');
  });

  it('renders pending gate diamond after active/future phase', () => {
    render(<PhaseStepperV2 phases={SEVEN_PHASES} />);
    const gate = screen.getByTestId('gate-diamond-1');
    expect(gate.getAttribute('data-completed')).toBe('false');
  });

  it('handles empty phases gracefully', () => {
    render(<PhaseStepperV2 phases={[]} />);
    expect(screen.getByTestId('phase-stepper-v2')).toBeInTheDocument();
  });

  it('sorts phases by order', () => {
    const reversed = [...SEVEN_PHASES].reverse();
    render(<PhaseStepperV2 phases={reversed} />);
    const pills = screen.getAllByTestId(/^phase-pill-/);
    expect(pills[0].textContent).toContain('Kick-off');
    expect(pills[6].textContent).toContain('Go-Live');
  });
});
