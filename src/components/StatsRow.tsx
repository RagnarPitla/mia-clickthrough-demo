import type { Wave, Task } from '../types/domain';

interface StatsRowProps {
  waves: Wave[];
  tasks: Task[];
  teamCount: number;
}

export default function StatsRow({ waves, tasks, teamCount }: StatsRowProps) {
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const completionPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const stats = [
    { value: waves.length, label: 'WAVES' },
    { value: tasks.length, label: 'TASKS' },
    { value: `${completionPct}%`, label: 'COMPLETE' },
    { value: teamCount, label: 'TEAM' },
  ];

  return (
    <div
      data-testid="stats-row"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}
    >
      {stats.map(s => (
        <div
          key={s.label}
          data-testid={`stat-${s.label.toLowerCase()}`}
          className="glass"
          style={{
            padding: '16px 20px',
            borderRadius: 14,
            textAlign: 'center' as const,
          }}
        >
          <div style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#007AFF',
            fontFamily: "'Outfit', sans-serif",
            lineHeight: 1.2,
          }}>
            {s.value}
          </div>
          <div style={{
            fontSize: 11,
            color: 'rgba(60,60,67,0.42)',
            textTransform: 'uppercase' as const,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.04em',
            marginTop: 4,
          }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
