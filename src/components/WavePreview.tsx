import type { PlaybookTaskPreview } from '../types/domain';

interface WavePreviewProps {
  waveName: string;
  tasks: PlaybookTaskPreview[];
  gateRequirements?: string[];
}

export default function WavePreview({ waveName, tasks, gateRequirements }: WavePreviewProps) {
  return (
    <div data-testid="wave-preview">
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
          color: 'var(--text-secondary)',
          marginBottom: 4,
        }}
      >
        Kick-off Wave (auto-created)
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 12,
        }}
      >
        {waveName}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map((task) => (
          <div
            key={task.id}
            data-testid={`wave-task-${task.id}`}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-xs)',
              background: 'rgba(255,255,255,0.4)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                }}
              >
                {task.id} {task.title}
              </span>
              <span
                data-testid={`wave-task-assignee-${task.id}`}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "'JetBrains Mono', monospace",
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-xs)',
                  background: task.assigneeKind === 'Worker' ? 'var(--accent-light)' : 'rgba(175,82,222,0.10)',
                  color: task.assigneeKind === 'Worker' ? 'var(--accent)' : 'var(--purple)',
                }}
              >
                {task.assigneeKind === 'Worker' ? 'AI Worker' : `You (${task.assigneeRole ?? 'DA'})`}
              </span>
            </div>
            {task.skillName && (
              <div
                data-testid={`wave-task-skill-${task.id}`}
                style={{
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--text-tertiary)',
                }}
              >
                ⚙ {task.skillName}
              </div>
            )}
          </div>
        ))}
      </div>

      {gateRequirements && gateRequirements.length > 0 && (
        <div
          data-testid="wave-gate"
          style={{
            marginTop: 12,
            padding: '10px 12px',
            borderRadius: 'var(--radius-xs)',
            background: 'rgba(48,209,88,0.06)',
            border: '1px solid rgba(48,209,88,0.15)',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              color: 'var(--completed)',
              marginBottom: 6,
            }}
          >
            Gate
          </div>
          {gateRequirements.map((req, i) => (
            <div
              key={i}
              data-testid={`gate-req-${i}`}
              style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '2px 0' }}
            >
              ○ {req}
            </div>
          ))}
        </div>
      )}

      <div
        data-testid="wave-task-count"
        style={{
          marginTop: 8,
          fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace",
          color: 'var(--text-tertiary)',
        }}
      >
        Wave 0: {tasks.length} tasks
      </div>
    </div>
  );
}
