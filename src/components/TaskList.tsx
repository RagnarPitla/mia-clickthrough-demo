import type { Task, TaskStatus } from '../types/domain';
import { MIA_SCM_DECISION_URL } from '../services/miaDemoData';

const STATUS_LABELS: Record<TaskStatus, string> = {
  Completed: '✓ Done',
  InProgress: '▶ Running',
  Ready: '● Ready',
  Failed: '✗ Failed',
  Pending: '○ Pending',
  WaitingOnChild: '◐ Waiting',
  Cancelled: '⊘ Cancelled',
};

interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (taskId: string) => void;
  selectedTaskId?: string | null;
}

export default function TaskList({ tasks, onTaskClick, selectedTaskId }: TaskListProps) {
  if (tasks.length === 0) {
    return <div data-testid="task-list-empty" />;
  }

  return (
    <table data-testid="task-list" style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'rgba(60,60,67,0.42)', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <th style={{ padding: '8px 12px' }}>Task</th>
          <th style={{ padding: '8px 12px' }}>Status</th>
          <th style={{ padding: '8px 12px' }}>Skill</th>
          <th style={{ padding: '8px 12px' }}>Attempt</th>
          <th style={{ padding: '8px 12px' }}>Output</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map(t => (
          <tr
            key={t.id}
            data-testid={`task-row-${t.id}`}
            onClick={() => onTaskClick?.(t.id)}
            style={{
              borderBottom: '1px solid var(--border-glass)',
              cursor: 'pointer',
              background: t.awaitingUser
                ? 'rgba(255,159,10,0.10)'
                : selectedTaskId === t.id ? 'var(--accent-glow)' : 'transparent',
              boxShadow: t.awaitingUser ? 'inset 3px 0 0 #FF9F0A' : undefined,
              transition: 'background 0.15s',
            }}
            >
            <td style={{ padding: '10px 12px', fontWeight: t.awaitingUser ? 700 : 500, color: '#1c1c1e' }}>
              {t.name}
              {t.awaitingUser && (
                <a
                  data-testid={`awaiting-pill-${t.id}`}
                  href={MIA_SCM_DECISION_URL}
                  onClick={(e) => e.stopPropagation()}
                  title="Open the SCM human intervention to make this decision"
                  style={{
                    marginLeft: 10, padding: '4px 10px', borderRadius: 6,
                    background: 'rgba(255,159,10,0.18)', color: '#7A4500',
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.04em',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    display: 'inline-block', textDecoration: 'none',
                    border: '1px solid rgba(255,159,10,0.5)',
                    animation: 'wave-pulse 1.4s ease-in-out infinite',
                    cursor: 'pointer',
                  }}
                >
                  🟠 Open human intervention →
                </a>
              )}
            </td>
            <td style={{ padding: '10px 12px' }}>
              <span data-testid={`status-${t.id}`} style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: t.awaitingUser ? '#B26A00' : undefined }}>
                {t.awaitingUser ? '⏸ Awaiting user' : STATUS_LABELS[t.status]}
              </span>
            </td>
            <td style={{ padding: '10px 12px', color: 'rgba(60,60,67,0.72)', fontFamily: 'monospace', fontSize: 11 }}>{t.skillName}</td>
            <td style={{ padding: '10px 12px', color: 'rgba(60,60,67,0.72)', fontFamily: 'monospace', textAlign: 'center' }}>{t.attempt || '—'}</td>
            <td style={{ padding: '10px 12px', color: 'rgba(60,60,67,0.42)', fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.outputSummary ?? '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
