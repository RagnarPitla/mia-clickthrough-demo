import type { KzkPlaybook } from '../types/domain';
import { playbookCtaLabel, playbookCtaColor, playbookIconBg, playbookE2ECount } from '../types/domain';
import PublisherBadge from './PublisherBadge';

interface PlaybookCardProps {
  playbook: KzkPlaybook;
  selected?: boolean;
  onSelect: (playbook: KzkPlaybook) => void;
}

function phaseLabel(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['name', 'displayName', 'label', 'title', 'key', 'id']) {
      const label = phaseLabel(record[key]);
      if (label) return label;
    }
  }
  return null;
}

export default function PlaybookCard({ playbook, selected, onSelect }: PlaybookCardProps) {
  const e2eCount = playbookE2ECount(playbook.scopeTrees);
  const cta = playbookCtaLabel(playbook);
  const ctaColor = playbookCtaColor(playbook.layer);
  const iconBg = playbookIconBg(playbook.layer);
  const phases = Array.isArray(playbook.phases)
    ? playbook.phases.map(phaseLabel).filter((label): label is string => Boolean(label))
    : [];

  const statsSegments: string[] = [];
  if (e2eCount > 0) statsSegments.push(`${e2eCount} E2E${e2eCount !== 1 ? 's' : ''}`);
  if (playbook.waveCount > 0) statsSegments.push(`${playbook.waveCount} waves`);
  if (playbook.taskCount > 0) statsSegments.push(`${playbook.taskCount} tasks`);
  const statsLine = statsSegments.join(' · ') || 'No tasks yet';

  return (
    <div
      data-testid={`playbook-card-${playbook.id}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(playbook)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(playbook); } }}
      style={{
        flex: '1 1 0',
        minWidth: 280,
        maxWidth: 380,
        padding: '28px 26px 24px',
        borderRadius: 20,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        transform: selected ? 'translateY(-4px)' : undefined,
        background: '#ffffff',
        border: selected
          ? `2px solid ${ctaColor}`
          : '1px solid rgba(0,0,0,0.08)',
        boxShadow: selected
          ? `0 8px 32px ${ctaColor}25`
          : '0 2px 16px rgba(0,0,0,0.06)',
        outline: 'none',
      }}
    >
      {/* Icon with colored circular background */}
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 30,
          lineHeight: 1,
        }}
      >
        {playbook.iconEmoji}
      </div>

      {/* Publisher badge */}
      <div style={{ alignSelf: 'flex-start' }}>
        <PublisherBadge publisher={playbook.publisher} layer={playbook.layer} />
      </div>

      {/* Display name */}
      <div
        style={{
          fontSize: 19,
          fontWeight: 700,
          color: '#1c1c1e',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          lineHeight: 1.3,
        }}
      >
        {playbook.displayName}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: 13,
          color: 'rgba(60,60,67,0.72)',
          lineHeight: 1.65,
          flex: 1,
          minHeight: 48,
        }}
      >
        {playbook.description}
      </div>

      {/* Phase tags — neutral gray */}
      {phases.length > 0 && (
        <div
          data-testid="phase-tags"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 5,
          }}
        >
          {phases.map(phase => (
            <span
              key={phase}
              style={{
                fontSize: 10,
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(0,0,0,0.05)',
                color: 'rgba(60,60,67,0.55)',
              }}
            >
              {phase}
            </span>
          ))}
        </div>
      )}

      {/* Stats line */}
      <div
        data-testid="stats-line"
        style={{
          fontSize: 11,
          fontWeight: 500,
          fontFamily: "'JetBrains Mono', monospace",
          color: 'rgba(60,60,67,0.42)',
        }}
      >
        {statsLine}
      </div>

      {/* CTA button — solid filled per layer */}
      <button
        data-testid="playbook-cta"
        onClick={e => {
          e.stopPropagation();
          onSelect(playbook);
        }}
        style={{
          padding: '12px 0',
          borderRadius: 12,
          border: 'none',
          background: ctaColor,
          color: '#ffffff',
          fontWeight: 700,
          fontSize: 14,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          cursor: 'pointer',
          transition: 'opacity 0.2s ease, transform 0.1s ease',
          width: '100%',
          opacity: selected ? 1 : 0.92,
        }}
      >
        {cta}
      </button>
    </div>
  );
}
