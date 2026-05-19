import { useState } from 'react';
import type { Wave, Phase } from '../types/domain';
import CreateWaveForm from './CreateWaveForm';
import { MIA_COWORK_DECISION_KEY, MIA_SCM_DECISION_URL, MIA_SCM_PENDING_KEY } from '../services/miaDemoData';

const INVENTORY_TO_DELIVER_WAVE_ID = 'mia-wave-inventory-to-deliver';

function hasPendingScmDecision(wave: Wave) {
  const isInventoryToDeliver =
    wave.id === INVENTORY_TO_DELIVER_WAVE_ID || /inventory to deliver/i.test(wave.name);
  if (!isInventoryToDeliver || wave.status === 'Draft') return false;
  try {
    return typeof localStorage !== 'undefined'
      && localStorage.getItem(MIA_SCM_PENDING_KEY) === 'true'
      && localStorage.getItem(MIA_COWORK_DECISION_KEY) !== 'complete';
  } catch {
    return false;
  }
}

interface WaveCardProps {
  wave: Wave;
  isActive: boolean;
  onClick: () => void;
  onRelease?: () => void;
  canRelease?: boolean;
  releaseOnCardClick?: boolean;
}

function WaveCard({ wave, isActive, onClick, onRelease, canRelease, releaseOnCardClick }: WaveCardProps) {
  const isDraft = wave.status === 'Draft';
  const isInProgress = wave.status === 'InProgress';
  const isCompleted = !isDraft && !isInProgress;
  const showDecisionIcon = hasPendingScmDecision(wave);

  // In click-through mode, the entire card is the release affordance.
  const cardClickHandler = () => {
    if (releaseOnCardClick && isDraft && canRelease && onRelease) {
      onRelease();
    } else {
      onClick();
    }
  };

  const badgeColors = isInProgress
    ? { bg: 'rgba(124,58,237,0.14)', fg: '#7c3aed' }
    : isDraft
      ? { bg: 'rgba(142,142,147,0.12)', fg: '#8E8E93' }
      : { bg: 'rgba(48,209,88,0.14)', fg: '#1f8c3a' };

  return (
    <button
      data-testid={`wave-card-${wave.id}`}
      onClick={cardClickHandler}
      title={releaseOnCardClick && isDraft && canRelease ? 'Click to release this wave' : undefined}
      style={{
        background: isInProgress
          ? 'rgba(124,58,237,0.10)'
          : isActive ? 'rgba(124,58,237,0.08)' : '#fff',
        border: `1px solid ${isInProgress ? 'rgba(124,58,237,0.45)' : isActive ? 'rgba(124,58,237,0.20)' : 'rgba(0,0,0,0.06)'}`,
        borderLeft: isActive || isInProgress ? '3px solid #7c3aed' : '1px solid rgba(0,0,0,0.06)',
        borderRadius: 10,
        padding: '10px 14px',
        cursor: 'pointer',
        textAlign: 'left' as const,
        transition: 'all 0.12s ease',
        width: '100%',
        boxShadow: isInProgress ? '0 0 0 4px rgba(124,58,237,0.15)' : 'none',
        animation: isInProgress ? 'wave-pulse 0.9s ease-in-out infinite' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 13, fontWeight: isActive || isInProgress ? 700 : 600, color: isActive || isInProgress ? '#7c3aed' : '#1c1c1e', flex: 1 }}>{wave.name}</span>
        {showDecisionIcon && (
          <a
            data-testid={`wave-decision-icon-${wave.id}`}
            href={MIA_SCM_DECISION_URL}
            onClick={(e) => e.stopPropagation()}
            title="Human intervention assigned to you"
            aria-label="Open assigned SCM human intervention"
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '0 0 auto',
              background: 'rgba(255,159,10,0.18)',
              border: '1px solid rgba(255,159,10,0.55)',
              color: '#7A4500',
              fontSize: 14,
              textDecoration: 'none',
              boxShadow: '0 0 0 4px rgba(255,159,10,0.16)',
              animation: 'human-decision-pulse 1.1s ease-in-out infinite',
            }}
          >
            👤
          </a>
        )}
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
          background: badgeColors.bg,
          color: badgeColors.fg,
          letterSpacing: '0.02em',
        }}>
          {isInProgress ? 'Releasing…' : isCompleted ? 'Released' : wave.status}
        </span>
      </div>
      <div style={{ fontSize: 10, color: 'rgba(60,60,67,0.42)', fontFamily: "'JetBrains Mono', monospace", marginBottom: isDraft && canRelease && !releaseOnCardClick && isActive ? 6 : 0 }}>
        {wave.taskCount} tasks
      </div>
      {/* Live (non-demo) projects: keep the explicit release button on the selected card. */}
      {isDraft && canRelease && isActive && !releaseOnCardClick && (
        <button
          data-testid={`wave-release-${wave.id}`}
          onClick={(e) => { e.stopPropagation(); onRelease?.(); }}
          style={{
            width: '100%', padding: '5px 0', marginTop: 4,
            background: '#7c3aed', color: '#fff', fontSize: 11, fontWeight: 700,
            borderRadius: 7, border: 'none', cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          🚀 Release Wave
        </button>
      )}
    </button>
  );
}

interface WaveSelectorProps {
  waves: Wave[];
  activeWaveId: string | null;
  onSelectWave: (waveId: string) => void;
  phases?: Phase[];
  onCreateWave?: (data: { name: string; phaseId: string; description: string }) => Promise<void>;
  onReleaseWave?: (waveId: string) => void;
  // Optional batch release used by the per-phase "Release {Phase}" button.
  // Falls back to calling onReleaseWave per wave when not provided.
  onReleaseWavesInPhase?: (waveIds: string[]) => void;
  onReleaseAllWaves?: () => void;
  releaseAllCount?: number;
  onRunDemo?: () => void;
  onResetDemo?: () => void;
  demoProgress?: number;
  demoTotal?: number;
  demoRunning?: boolean;
  demoComplete?: boolean;
  // When true, clicking a Draft wave card releases just that wave (click-through demo).
  releaseOnCardClick?: boolean;
  // When true, render the Manual / Autopilot toggle (narrative-only).
  showAutopilotToggle?: boolean;
  createWaveDefaultPhaseId?: string;
  createWaveNamePlaceholder?: string;
  createWaveTitle?: string;
  createWaveSubmitLabel?: string;
}

export default function WaveSelector({
  waves,
  activeWaveId,
  onSelectWave,
  phases = [],
  onCreateWave,
  onReleaseWave,
  onReleaseWavesInPhase,
  onReleaseAllWaves,
  releaseAllCount = 0,
  onRunDemo,
  onResetDemo,
  demoProgress = 0,
  demoTotal = 0,
  demoRunning = false,
  demoComplete = false,
  releaseOnCardClick = false,
  showAutopilotToggle = false,
  createWaveDefaultPhaseId,
  createWaveNamePlaceholder,
  createWaveTitle,
  createWaveSubmitLabel,
}: WaveSelectorProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [autopilot, setAutopilot] = useState<'manual' | 'autopilot'>('manual');

  const handleCreate = async (data: { name: string; phaseId: string; description: string }) => {
    await onCreateWave?.(data);
    setShowCreate(false);
  };

  return (
    <div data-testid="wave-selector" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Header with + button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const,
          letterSpacing: '0.06em', color: 'rgba(60,60,67,0.42)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          WAVES
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {onRunDemo && (
            <button
              data-testid="wave-run-demo-btn"
              onClick={onRunDemo}
              disabled={demoRunning}
              title="Release all waves"
              style={{
                padding: '5px 11px',
                borderRadius: 8,
                background: demoRunning
                  ? 'linear-gradient(135deg, rgba(234,88,12,0.55), rgba(249,115,22,0.55))'
                  : 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)',
                border: '1px solid rgba(234,88,12,0.4)',
                color: '#fff',
                cursor: demoRunning ? 'default' : 'pointer',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.02em',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                boxShadow: demoRunning ? '0 0 0 3px rgba(234,88,12,0.25)' : '0 1px 2px rgba(234,88,12,0.25)',
                transition: 'all 0.12s ease',
              }}
            >
              {demoRunning
                ? `Releasing ${demoProgress}/${demoTotal}`
                : demoComplete
                  ? '↻ Release again'
                  : '⚡ Release Waves'}
            </button>
          )}
          {onResetDemo && demoProgress > 0 && !demoRunning && (
            <button
              data-testid="wave-reset-demo-btn"
              onClick={onResetDemo}
              title="Reset wave playback"
              style={{
                padding: '4px 8px',
                borderRadius: 7,
                background: 'rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.08)',
                color: 'rgba(60,60,67,0.72)',
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Reset
            </button>
          )}
          {onReleaseAllWaves && releaseAllCount > 0 && (
            <button
              data-testid="wave-release-all-btn"
              onClick={onReleaseAllWaves}
              title="Release all draft waves"
              style={{
                padding: '4px 8px',
                borderRadius: 7,
                background: 'rgba(0,122,255,0.10)',
                border: '1px solid rgba(0,122,255,0.20)',
                color: '#007AFF',
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Release all
            </button>
          )}
          {onCreateWave && (
            <button
              data-testid="wave-add-btn"
              onClick={() => setShowCreate(s => !s)}
              title="Create new wave"
              style={{
                height: 24, borderRadius: 7,
                padding: '0 9px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: showCreate ? 'rgba(0,122,255,0.10)' : 'rgba(0,0,0,0.04)',
                border: `1px solid ${showCreate ? 'rgba(0,122,255,0.20)' : 'rgba(0,0,0,0.06)'}`,
                color: showCreate ? '#007AFF' : 'rgba(60,60,67,0.72)',
                cursor: 'pointer', fontSize: 11, fontWeight: 800,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {showCreate ? '×' : '+ Add Wave'}
            </button>
          )}
        </div>
      </div>

      {/* Manual / Autopilot toggle — narrative-only for the click-through. */}
      {showAutopilotToggle && (
        <div
          data-testid="autopilot-toggle"
          style={{
            display: 'flex', alignItems: 'center', gap: 0,
            padding: 3, borderRadius: 9,
            background: 'rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.06)',
            marginBottom: 4,
          }}
        >
          <button
            data-testid="autopilot-mode-manual"
            onClick={() => setAutopilot('manual')}
            title="Release waves manually one phase at a time"
            style={{
              flex: 1, padding: '5px 0', borderRadius: 6,
              background: autopilot === 'manual' ? '#fff' : 'transparent',
              border: 'none', cursor: 'pointer',
              boxShadow: autopilot === 'manual' ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
              color: autopilot === 'manual' ? '#1c1c1e' : 'rgba(60,60,67,0.62)',
              fontSize: 11, fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              letterSpacing: '0.02em',
            }}
          >
            ✋ Manual
          </button>
          <button
            data-testid="autopilot-mode-autopilot"
            onClick={() => setAutopilot('autopilot')}
            title="Agents would release waves at the appropriate time"
            style={{
              flex: 1, padding: '5px 0', borderRadius: 6,
              background: autopilot === 'autopilot'
                ? 'linear-gradient(135deg, #7c3aed, #5b21b6)'
                : 'transparent',
              border: 'none', cursor: 'pointer',
              boxShadow: autopilot === 'autopilot' ? '0 1px 3px rgba(124,58,237,0.30)' : 'none',
              color: autopilot === 'autopilot' ? '#fff' : 'rgba(60,60,67,0.62)',
              fontSize: 11, fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              letterSpacing: '0.02em',
            }}
          >
            🤖 Autopilot
          </button>
        </div>
      )}
      {showAutopilotToggle && autopilot === 'autopilot' && (
        <div
          data-testid="autopilot-hint"
          style={{
            padding: '6px 10px', borderRadius: 8,
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.18)',
            color: '#5b21b6', fontSize: 10, fontWeight: 600,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            lineHeight: 1.4, marginBottom: 2,
          }}
        >
          Agents will release each wave at the appropriate time. Switch back to Manual to drive each release yourself.
        </div>
      )}

      {/* Create wave popup */}
      {showCreate && onCreateWave && (
        <div
          data-testid="create-wave-dialog"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowCreate(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'rgba(0,0,0,0.28)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(420px, 100%)' }}>
            <CreateWaveForm
              phases={phases}
              onSubmit={handleCreate}
              onCancel={() => setShowCreate(false)}
              defaultPhaseId={createWaveDefaultPhaseId}
              namePlaceholder={createWaveNamePlaceholder}
              title={createWaveTitle}
              submitLabel={createWaveSubmitLabel}
            />
          </div>
        </div>
      )}

      {/* Wave list — grouped by phase when phases are available */}
      {waves.length === 0 && !showCreate ? (
        <div data-testid="wave-empty" style={{ padding: 20, textAlign: 'center', color: 'rgba(60,60,67,0.42)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
          No waves yet
        </div>
      ) : phases.length > 0 ? (
        // Grouped rendering: phase header + waves under it. Includes any
        // un-mapped (phaseless) waves at the bottom under "Other".
        (() => {
          const visibleWaves = waves;
          const groups: { id: string; name: string; waves: Wave[] }[] = phases
            .map(p => ({
              id: p.id,
              name: p.name,
              waves: visibleWaves.filter(w => w.phaseId === p.id),
            }))
            .filter(g => g.waves.length > 0);
          const orphans = visibleWaves.filter(w => !phases.some(p => p.id === w.phaseId));
          if (orphans.length > 0) {
            groups.push({ id: '__other__', name: 'Other', waves: orphans });
          }
          return groups.map(group => {
            const draftWavesInPhase = group.waves.filter(w => w.status === 'Draft' && w.taskCount > 0);
            const canReleasePhase = onReleaseWave && draftWavesInPhase.length > 0;
            return (
              <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 6 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  padding: '6px 2px 4px', borderBottom: '1px solid rgba(15,98,254,0.12)',
                  marginTop: 4,
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
                    textTransform: 'uppercase' as const, color: '#0F62FE',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>
                    {group.name}
                  </span>
                  {canReleasePhase && (
                    <button
                      data-testid={`phase-release-${group.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const ids = draftWavesInPhase.map(w => w.id);
                        if (onReleaseWavesInPhase) {
                          onReleaseWavesInPhase(ids);
                        } else {
                          ids.forEach(id => onReleaseWave?.(id));
                        }
                      }}
                      title={`Release ${draftWavesInPhase.length} wave${draftWavesInPhase.length === 1 ? '' : 's'} in ${group.name}`}
                      style={{
                        padding: '3px 9px', borderRadius: 6,
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(124,58,237,0.18))',
                        border: '1px solid rgba(124,58,237,0.30)',
                        color: '#7c3aed', cursor: 'pointer',
                        fontSize: 10, fontWeight: 800, letterSpacing: '0.02em',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        whiteSpace: 'nowrap' as const,
                      }}
                    >
                      🚀 Release {group.name}
                    </button>
                  )}
                </div>
                {group.waves.map(w => (
                  <WaveCard
                    key={w.id}
                    wave={w}
                    isActive={w.id === activeWaveId}
                    onClick={() => onSelectWave(w.id)}
                    onRelease={() => onReleaseWave?.(w.id)}
                    canRelease={Boolean(onReleaseWave) && w.taskCount > 0}
                    releaseOnCardClick={releaseOnCardClick}
                  />
                ))}
              </div>
            );
          });
        })()
      ) : (
        waves.map(w => (
          <WaveCard
            key={w.id}
            wave={w}
            isActive={w.id === activeWaveId}
            onClick={() => onSelectWave(w.id)}
            onRelease={() => onReleaseWave?.(w.id)}
            canRelease={Boolean(onReleaseWave) && w.taskCount > 0}
            releaseOnCardClick={releaseOnCardClick}
          />
        ))
      )}
    </div>
  );
}
