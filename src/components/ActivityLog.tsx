export interface ActivityEntry {
  id: string;
  timestamp: string;
  taskName: string;
  action: string;
  detail?: string;
}

interface ActivityLogProps {
  entries: ActivityEntry[];
}

export default function ActivityLog({ entries }: ActivityLogProps) {
  if (entries.length === 0) {
    return (
      <div data-testid="activity-empty" style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: 'monospace', fontSize: 12 }}>
        No activity yet
      </div>
    );
  }

  return (
    <div data-testid="activity-log" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {entries.map(e => (
        <div
          key={e.id}
          data-testid={`activity-${e.id}`}
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            gap: 12,
            alignItems: 'baseline',
          }}
        >
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
            {new Date(e.timestamp).toLocaleTimeString()}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {e.taskName}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-primary)' }}>
            {e.action}
          </span>
          {e.detail && (
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
              {e.detail}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
