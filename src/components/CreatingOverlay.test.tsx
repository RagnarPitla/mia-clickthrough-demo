import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CreatingOverlay from './CreatingOverlay';

const STEP_INTERVAL = 300;
const DWELL_MS = 600;

const sampleSteps = [
  { label: 'Project created' },
  { label: '3 team members added' },
  { label: '13 E2E processes seeded (1 in scope)' },
];

describe('CreatingOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders all step labels', () => {
    render(
      <CreatingOverlay
        steps={sampleSteps}
        playbookName="Document-Driven v1.0"
        projectName="Contoso FA Implementation"
      />,
    );
    for (const step of sampleSteps) {
      expect(screen.getByText(step.label)).toBeInTheDocument();
    }
  });

  it('shows project name in the title', () => {
    render(
      <CreatingOverlay
        steps={sampleSteps}
        playbookName="Document-Driven v1.0"
        projectName="Contoso FA Implementation"
      />,
    );
    expect(
      screen.getByText(/Creating Contoso FA Implementation/),
    ).toBeInTheDocument();
  });

  it('shows playbook name', () => {
    render(
      <CreatingOverlay
        steps={sampleSteps}
        playbookName="Document-Driven v1.0"
        projectName="Contoso FA Implementation"
      />,
    );
    expect(screen.getByText(/Document-Driven v1.0/)).toBeInTheDocument();
  });

  it('all steps start as pending', () => {
    render(
      <CreatingOverlay
        steps={sampleSteps}
        playbookName="Doc-Driven"
        projectName="Test"
      />,
    );
    const rows = screen.getAllByTestId(/^step-\d+$/);
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row).toHaveAttribute('data-status', 'pending');
    }
  });

  it('first step becomes active after first interval', () => {
    render(
      <CreatingOverlay
        steps={sampleSteps}
        playbookName="Doc-Driven"
        projectName="Test"
      />,
    );
    act(() => {
      vi.advanceTimersByTime(STEP_INTERVAL);
    });
    expect(screen.getByTestId('step-0')).toHaveAttribute(
      'data-status',
      'active',
    );
    expect(screen.getByTestId('step-1')).toHaveAttribute(
      'data-status',
      'pending',
    );
  });

  it('step transitions from active to done and next becomes active', () => {
    render(
      <CreatingOverlay
        steps={sampleSteps}
        playbookName="Doc-Driven"
        projectName="Test"
      />,
    );
    // step 0 active at 300ms
    act(() => {
      vi.advanceTimersByTime(STEP_INTERVAL);
    });
    expect(screen.getByTestId('step-0')).toHaveAttribute(
      'data-status',
      'active',
    );

    // step 0 done, step 1 active at 600ms
    act(() => {
      vi.advanceTimersByTime(STEP_INTERVAL);
    });
    expect(screen.getByTestId('step-0')).toHaveAttribute(
      'data-status',
      'done',
    );
    expect(screen.getByTestId('step-1')).toHaveAttribute(
      'data-status',
      'active',
    );
  });

  it('all steps reach done after full animation', () => {
    render(
      <CreatingOverlay
        steps={sampleSteps}
        playbookName="Doc-Driven"
        projectName="Test"
      />,
    );
    // 3 steps: active at 300, 600, 900. Done at 600, 900, 1200.
    // Total ticks: (steps.length + 1) * STEP_INTERVAL = 1200ms
    const totalAnimation = (sampleSteps.length + 1) * STEP_INTERVAL;
    act(() => {
      vi.advanceTimersByTime(totalAnimation);
    });
    for (let i = 0; i < sampleSteps.length; i++) {
      expect(screen.getByTestId(`step-${i}`)).toHaveAttribute(
        'data-status',
        'done',
      );
    }
  });

  it('calls onComplete after animation + dwell', () => {
    const onComplete = vi.fn();
    render(
      <CreatingOverlay
        steps={sampleSteps}
        playbookName="Doc-Driven"
        projectName="Test"
        onComplete={onComplete}
      />,
    );
    const totalAnimation = (sampleSteps.length + 1) * STEP_INTERVAL;
    act(() => {
      vi.advanceTimersByTime(totalAnimation);
    });
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(DWELL_MS);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not call onComplete twice', () => {
    const onComplete = vi.fn();
    render(
      <CreatingOverlay
        steps={sampleSteps}
        playbookName="Doc-Driven"
        projectName="Test"
        onComplete={onComplete}
      />,
    );
    const totalTime =
      (sampleSteps.length + 1) * STEP_INTERVAL + DWELL_MS + 5000;
    act(() => {
      vi.advanceTimersByTime(totalTime);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('handles empty steps by calling onComplete after dwell', () => {
    const onComplete = vi.fn();
    render(
      <CreatingOverlay
        steps={[]}
        playbookName="Doc-Driven"
        projectName="Test"
        onComplete={onComplete}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(DWELL_MS);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('shows correct status icons: ○ pending, ● active, ✓ done', () => {
    render(
      <CreatingOverlay
        steps={sampleSteps}
        playbookName="Doc-Driven"
        projectName="Test"
      />,
    );
    // Initially all pending → ○
    const icons = screen.getAllByTestId(/^step-icon-/);
    expect(icons[0]).toHaveTextContent('○');

    // Advance to make step 0 active → ●
    act(() => {
      vi.advanceTimersByTime(STEP_INTERVAL);
    });
    expect(screen.getByTestId('step-icon-0')).toHaveTextContent('●');

    // Advance to make step 0 done → ✓
    act(() => {
      vi.advanceTimersByTime(STEP_INTERVAL);
    });
    expect(screen.getByTestId('step-icon-0')).toHaveTextContent('✓');
  });

  it('cleans up timers on unmount', () => {
    const onComplete = vi.fn();
    const { unmount } = render(
      <CreatingOverlay
        steps={sampleSteps}
        playbookName="Doc-Driven"
        projectName="Test"
        onComplete={onComplete}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(STEP_INTERVAL);
    });
    unmount();
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(onComplete).not.toHaveBeenCalled();
  });
});
