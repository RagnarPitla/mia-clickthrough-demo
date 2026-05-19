import type { ActivityFeedEntry } from '../types/domain';
import { sanitizeOutput } from '../utils/sanitizeOutput';

interface ActivityTimelineProps {
  entries: ActivityFeedEntry[];
}

const ICON_MAP: Record<string, { symbol: string; color: string }> = {
  '✓': { symbol: '✓', color: '#30D158' },
  '✗': { symbol: '✗', color: '#FF3B30' },
  '▶': { symbol: '⚡', color: '#007AFF' },
  '🤖': { symbol: '⚡', color: '#007AFF' },
  '📋': { symbol: '📋', color: '#8E8E93' },
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function ActivityTimeline({ entries }: ActivityTimelineProps) {
  if (entries.length === 0) {
    return (
      <div
        data-testid="activity-timeline-empty"
        style={{
          padding: 24,
          textAlign: 'center',
          color: 'rgba(60,60,67,0.42)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
        }}
      >
        No activity yet
      </div>
    );
  }

  return (
    <div
      data-testid="activity-timeline"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        maxHeight: 280,
        overflowY: 'auto',
      }}
    >
      {entries.map(e => {
        const iconInfo = ICON_MAP[e.icon] ?? { symbol: e.icon, color: '#8E8E93' };
        const cleanMessage = sanitizeOutput(e.message, 200);

        return (
          <div
            key={e.id}
            data-testid={`timeline-entry-${e.id}`}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 12,
              padding: '8px 16px',
              borderBottom: '1px solid rgba(0,0,0,0.04)',
            }}
          >
            <span
              data-testid={`timeline-ts-${e.id}`}
              style={{
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'rgba(60,60,67,0.30)',
                minWidth: 60,
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {formatTime(e.timestamp)}
            </span>

            <span
              data-testid={`timeline-icon-${e.id}`}
              style={{
                fontSize: 14,
                color: iconInfo.color,
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              {iconInfo.symbol}
            </span>

            <span
              data-testid={`timeline-message-${e.id}`}
              style={{
                fontSize: 13,
                color: '#1c1c1e',
                fontWeight: 500,
                flex: 1,
              }}
            >
              {cleanMessage}
            </span>
          </div>
        );
      })}
    </div>
  );
}
