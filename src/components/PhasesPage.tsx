import type { Phase, Wave, E2EProcess } from '../types/domain';

interface PhasesPageProps {
  phases: Phase[];
  waves: Wave[];
  processes: E2EProcess[];
  loading: boolean;
  onPhaseClick?: (phaseId: string) => void;
}

const PHASE_ICONS = ['🎯', '🔍', '✏️', '⚙️', '🚀', '📈'];

const glass = {
  background: '#fff',
  border: '1px solid rgba(0,0,0,0.08)',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

export default function PhasesPage({ phases, waves, processes, loading, onPhaseClick }: PhasesPageProps) {
  const sorted = [...phases].sort((a, b) => a.order - b.order);
  const inScopeProcesses = processes.filter(p => p.isInScope);

  if (loading && phases.length === 0) {
    return (
      <div data-testid="phases-page" style={{ padding: 24, borderRadius: 18, ...glass }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 600, marginBottom: 12, color: '#1a1a2e' }}>
          Implementation Phases
        </h2>
        <div style={{ fontSize: 13, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", animation: 'pulse 1.2s ease-in-out infinite' }}>
          Loading phases…
        </div>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div data-testid="phases-page" style={{ padding: 24, borderRadius: 18, ...glass }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 600, marginBottom: 12, color: '#1a1a2e' }}>
          Implementation Phases
        </h2>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace" }}>
          No phases configured for this project
        </div>
      </div>
    );
  }

  return (
    <div data-testid="phases-page" style={{ padding: 24, borderRadius: 18, ...glass }}>
      <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 600, marginBottom: 20, color: '#1a1a2e' }}>
        Implementation Phases
      </h2>

      {/* Horizontal scrollable row of phase cards with gate badges */}
      <div data-testid="phases-row" style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 8, alignItems: 'stretch' }}>
        {sorted.map((phase, i) => {
          const icon = PHASE_ICONS[i] ?? '📋';
          const isActive = phase.status === 'Active';
          const isDone = phase.status === 'Completed';
          const phaseWaves = waves.filter(w => w.phaseId === phase.id);
          const waveCount = phaseWaves.length;
          // POC: task count is sum of wave taskCounts
          const taskCount = phaseWaves.reduce((sum, w) => sum + (w.taskCount ?? 0), 0);
          const progressPct = waveCount > 0 ? Math.min(100, Math.round((phaseWaves.filter(w => w.status === 'Completed' || w.status === 'Approved').length / waveCount) * 100)) : 0;

          const borderColor = isActive ? 'var(--accent)' : isDone ? 'var(--completed)' : 'rgba(0,0,0,0.10)';

          return (
            <div key={phase.id} style={{ display: 'flex', alignItems: 'center' }}>
              {/* Phase card */}
              <button
                data-testid={`phase-card-${phase.id}`}
                onClick={() => onPhaseClick?.(phase.id)}
                style={{
                  minWidth: 180, maxWidth: 210, padding: '18px 16px', borderRadius: 14,
                  background: '#f9fafb',
                  border: `1.5px solid ${borderColor}`,
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  transition: 'all 0.25s ease',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}
              >
                {/* Icon + status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 24 }}>{icon}</span>
                  {isDone && <span style={{ fontSize: 14, color: 'var(--completed)', fontWeight: 700 }}>✓</span>}
                  {isActive && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 6, background: 'rgba(61,154,255,0.15)', border: '1px solid rgba(61,154,255,0.3)', color: 'var(--accent)', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>ACTIVE</span>}
                </div>

                {/* Name + description */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isActive ? '#1a1a2e' : '#4b5563', marginBottom: 2 }}>{phase.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{phase.description || '—'}</div>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  <div data-testid={`phase-progress-${phase.id}`} style={{ width: `${progressPct}%`, height: '100%', borderRadius: 2, background: isDone ? 'var(--completed)' : 'var(--accent)', transition: 'width 0.4s ease' }} />
                </div>

                {/* Wave + task counts */}
                <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace" }}>
                  <span>{waveCount} waves</span>
                  <span>{taskCount} tasks</span>
                </div>

                {/* Show in-scope processes only on the active phase (where work is happening) */}
                {isActive && inScopeProcesses.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 8 }}>
                    <span style={{ fontSize: 9, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em' }}>In Progress</span>
                    {inScopeProcesses.map(proc => (
                      <div key={proc.id} style={{ fontSize: 10, color: '#4b5563', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--inprogress)', flexShrink: 0 }} />
                        {proc.name}
                      </div>
                    ))}
                  </div>
                )}
                {/* Completed phase — show processes that passed through */}
                {isDone && inScopeProcesses.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 8 }}>
                    <span style={{ fontSize: 9, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em' }}>Completed</span>
                    {inScopeProcesses.map(proc => (
                      <div key={proc.id} style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--completed)', flexShrink: 0 }} />
                        {proc.name}
                      </div>
                    ))}
                  </div>
                )}
              </button>

              {/* Gate badge between cards */}
              {i < sorted.length - 1 && (
                <div data-testid={`gate-badge-${i + 1}`} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  padding: '0 8px', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 16, color: isDone ? 'var(--completed)' : 'var(--inprogress)', lineHeight: 1 }}>◆</span>
                  <span style={{ fontSize: 8, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                    Gate {i + 1} · {isDone ? 'Passed' : 'Open'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
