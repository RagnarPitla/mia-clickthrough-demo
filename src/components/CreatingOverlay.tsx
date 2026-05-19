import { useState, useEffect, useRef, useCallback } from 'react';

export interface CreatingStep {
  label: string;
}

type StepStatus = 'pending' | 'active' | 'done';

interface CreatingOverlayProps {
  steps: CreatingStep[];
  playbookName: string;
  projectName: string;
  onComplete?: () => void;
}

const STEP_INTERVAL = 300;
const DWELL_MS = 600;

const statusIcon: Record<StepStatus, string> = {
  pending: '○',
  active: '●',
  done: '✓',
};

const statusColor: Record<StepStatus, string> = {
  pending: 'var(--text-tertiary)',
  active: 'var(--accent)',
  done: 'var(--completed)',
};

export default function CreatingOverlay({
  steps,
  playbookName,
  projectName,
  onComplete,
}: CreatingOverlayProps) {
  const [statuses, setStatuses] = useState<StepStatus[]>(() =>
    steps.map(() => 'pending'),
  );
  const completedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) clearTimeout(id);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    completedRef.current = false;

    if (steps.length === 0) {
      const id = setTimeout(() => {
        if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current?.();
        }
      }, DWELL_MS);
      timersRef.current.push(id);
      return clearTimers;
    }

    // Schedule each step: active at tick i, done at tick i+1
    for (let i = 0; i < steps.length; i++) {
      // Step i becomes active
      const activeId = setTimeout(() => {
        setStatuses((prev) => {
          const next = [...prev];
          next[i] = 'active';
          return next;
        });
      }, (i + 1) * STEP_INTERVAL);
      timersRef.current.push(activeId);

      // Step i becomes done
      const doneId = setTimeout(() => {
        setStatuses((prev) => {
          const next = [...prev];
          next[i] = 'done';
          return next;
        });
      }, (i + 2) * STEP_INTERVAL);
      timersRef.current.push(doneId);
    }

    // Fire onComplete after all done + dwell
    const completeId = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
    }, (steps.length + 1) * STEP_INTERVAL + DWELL_MS);
    timersRef.current.push(completeId);

    return clearTimers;
  }, [steps, clearTimers]);

  return (
    <div
      data-testid="creating-overlay"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        flex: 1,
        animation: 'fade-in 0.4s ease-out',
      }}
    >
      {/* Spinner */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '3px solid var(--accent-light)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }}
      />

      {/* Title */}
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: 0,
          textAlign: 'center',
        }}
      >
        Creating {projectName}…
      </h2>

      {/* Playbook name */}
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          margin: 0,
        }}
      >
        Using playbook: {playbookName}
      </p>

      {/* Checklist */}
      {steps.length > 0 && (
        <div
          className="glass"
          style={{
            padding: '16px 24px',
            borderRadius: 'var(--radius-md)',
            minWidth: 320,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {steps.map((step, i) => (
            <div
              key={i}
              data-testid={`step-${i}`}
              data-status={statuses[i]}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 14,
                color:
                  statuses[i] === 'pending'
                    ? 'var(--text-tertiary)'
                    : 'var(--text-primary)',
                transition: 'color 0.2s ease, opacity 0.2s ease',
                opacity: statuses[i] === 'pending' ? 0.6 : 1,
              }}
            >
              <span
                data-testid={`step-icon-${i}`}
                style={{
                  fontSize: 16,
                  color: statusColor[statuses[i]],
                  width: 20,
                  textAlign: 'center',
                  fontWeight: 700,
                  transition: 'color 0.2s ease',
                }}
              >
                {statusIcon[statuses[i]]}
              </span>
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
