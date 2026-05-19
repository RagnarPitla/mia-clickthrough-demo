import type { KzkGate, GateRequirement } from '../types/domain';

interface GateCardProps {
  gate: KzkGate;
  onAction?: () => void;
  actionLabel?: string;
}

function parseRequirements(json: string): GateRequirement[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is GateRequirement =>
        typeof r === 'object' && r !== null && typeof r.label === 'string' && typeof r.met === 'boolean'
    );
  } catch {
    return [];
  }
}

export default function GateCard({ gate, onAction, actionLabel }: GateCardProps) {
  const requirements = parseRequirements(gate.kzk_requiredjson);
  const isOpen = gate.kzk_outcome === 'Open';
  const isPassed = gate.kzk_outcome === 'Pass';

  return (
    <div
      data-testid="gate-card"
      className="glass"
      style={{
        border: isPassed ? '1px solid var(--completed)' : undefined,
        borderRadius: 14,
        padding: '14px 16px',
        boxShadow: isPassed ? '0 0 12px rgba(48,209,88,0.15)' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1c1c1e', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          GATE: {gate.kzk_name}
        </span>
        {isPassed && (
          <span style={{ fontSize: 10, color: 'var(--completed)', fontFamily: 'monospace', fontWeight: 600 }}>
            ✓ PASSED
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {requirements.map((req, i) => (
          <div key={i} data-testid={`gate-req-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 13,
              color: req.met ? 'var(--completed)' : 'var(--text-tertiary)',
            }}>
              {req.met ? '✓' : '○'}
            </span>
            <span style={{
              fontSize: 12,
              color: req.met ? 'rgba(60,60,67,0.72)' : '#1c1c1e',
            }}>
              {req.label}
              {!req.met && (
                <span style={{ fontSize: 10, color: 'var(--ready)', marginLeft: 6, fontFamily: 'monospace' }}>
                  ← waiting
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {isOpen && onAction && actionLabel && (
        <button
          data-testid="gate-action-btn"
          onClick={onAction}
          style={{
            marginTop: 12,
            padding: '8px 20px',
            borderRadius: 10,
            background: 'var(--accent)',
            border: 'none',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,122,255,0.3)',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
