import type { Phase } from '../types/domain';

interface PhaseStepperV2Props {
  phases: Phase[];
}

export default function PhaseStepperV2({ phases }: PhaseStepperV2Props) {
  const sorted = [...phases].sort((a, b) => a.order - b.order);

  return (
    <div
      data-testid="phase-stepper-v2"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        padding: '12px 16px',
        flexWrap: 'wrap',
      }}
    >
      {sorted.map((phase, i) => {
        const state: 'completed' | 'active' | 'future' =
          phase.status === 'Completed' ? 'completed'
            : phase.status === 'Active' ? 'active'
              : 'future';

        const isCompleted = state === 'completed';
        const isActive = state === 'active';

        const pillBg = isCompleted
          ? 'rgba(48,209,88,0.10)'
          : isActive
            ? 'rgba(0,122,255,0.10)'
            : 'rgba(0,0,0,0.04)';

        const pillColor = isCompleted
          ? '#30D158'
          : isActive
            ? '#007AFF'
            : 'rgba(60,60,67,0.35)';

        const prefix = isCompleted ? '✓ ' : isActive ? '● ' : '';

        return (
          <div key={phase.id} style={{ display: 'flex', alignItems: 'center' }}>
            <span
              data-testid={`phase-pill-${i}`}
              data-state={state}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 14px',
                borderRadius: 20,
                background: pillBg,
                color: pillColor,
                fontSize: 13,
                fontWeight: isActive ? 700 : isCompleted ? 600 : 500,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                whiteSpace: 'nowrap',
                transition: 'all 0.3s ease',
                animation: isActive ? 'pulse-phase 2s ease-in-out infinite' : 'none',
              }}
            >
              {prefix}{phase.name}
            </span>

            {i < sorted.length - 1 && (
              <div
                data-testid={`gate-diamond-${i}`}
                data-completed={String(isCompleted)}
                title={`Gate: ${phase.name} → ${sorted[i + 1].name}`}
                style={{
                  width: 12,
                  height: 12,
                  transform: 'rotate(45deg)',
                  background: isCompleted ? '#30D158' : 'rgba(0,0,0,0.12)',
                  margin: '0 8px',
                  flexShrink: 0,
                  transition: 'background 0.3s ease',
                  borderRadius: 2,
                }}
              />
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes pulse-phase {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,122,255,0.2); }
          50% { box-shadow: 0 0 0 4px rgba(0,122,255,0.08); }
        }
      `}</style>
    </div>
  );
}
