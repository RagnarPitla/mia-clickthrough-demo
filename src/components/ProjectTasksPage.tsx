import type { Task, TaskStatus, Wave } from '../types/domain';

interface ProjectTasksPageProps {
  waves: Wave[];
  tasks: Task[];
  loading: boolean;
  selectedTaskId?: string | null;
  onTaskClick?: (taskId: string) => void;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  Completed: 'Done',
  InProgress: 'Running',
  Ready: 'Ready',
  Failed: 'Failed',
  Pending: 'Pending',
  WaitingOnChild: 'Waiting',
  Cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<TaskStatus, { bg: string; fg: string }> = {
  Completed: { bg: 'rgba(48,209,88,0.12)', fg: '#248A3D' },
  InProgress: { bg: 'rgba(0,122,255,0.12)', fg: '#007AFF' },
  Ready: { bg: 'rgba(52,199,89,0.10)', fg: '#248A3D' },
  Failed: { bg: 'rgba(255,59,48,0.10)', fg: '#C01B13' },
  Pending: { bg: 'rgba(142,142,147,0.12)', fg: '#636366' },
  WaitingOnChild: { bg: 'rgba(255,149,0,0.12)', fg: '#C46B00' },
  Cancelled: { bg: 'rgba(142,142,147,0.12)', fg: '#636366' },
};

function skillLabel(raw: string): string {
  if (!raw) return 'No skill';
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(item => item?.name).filter(Boolean).join(', ') || raw;
    if (parsed?.name) return parsed.name;
  } catch {
    // Plain skill names are allowed.
  }
  return raw;
}

export default function ProjectTasksPage({ waves, tasks, loading, selectedTaskId, onTaskClick }: ProjectTasksPageProps) {
  const tasksByWave = new Map<string, Task[]>();
  for (const task of tasks) {
    const waveTasks = tasksByWave.get(task.waveId) ?? [];
    waveTasks.push(task);
    tasksByWave.set(task.waveId, waveTasks);
  }

  const orphanTasks = tasks.filter(task => !waves.some(wave => wave.id === task.waveId));
  const failedCount = tasks.filter(task => task.status === 'Failed').length;
  const runningCount = tasks.filter(task => task.status === 'InProgress').length;

  return (
    <div data-testid="project-tasks-page" className="glass" style={{ borderRadius: 14, padding: 18, overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div>
          <div className="label" style={{ color: 'rgba(60,60,67,0.42)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
            Tasks
          </div>
          <h2 style={{ margin: '4px 0 6px', fontSize: 20, color: '#1c1c1e' }}>Tasks under Waves</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(60,60,67,0.62)' }}>
            Project-level view of every task, grouped by the wave it belongs to.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Metric label="tasks" value={tasks.length} />
          <Metric label="running" value={runningCount} />
          <Metric label="failed" value={failedCount} danger={failedCount > 0} />
        </div>
      </div>

      {loading && tasks.length === 0 ? (
        <div style={{ padding: 32, color: '#007AFF', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
          Loading project tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'rgba(60,60,67,0.62)' }}>
          No tasks found for this project.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {waves.map(wave => (
            <WaveTaskGroup
              key={wave.id}
              wave={wave}
              tasks={tasksByWave.get(wave.id) ?? []}
              selectedTaskId={selectedTaskId}
              onTaskClick={onTaskClick}
            />
          ))}
          {orphanTasks.length > 0 && (
            <WaveTaskGroup
              wave={{ id: 'orphan', name: 'Tasks without Wave', description: '', status: 'Draft', projectId: '', taskCount: orphanTasks.length, errorCount: 0 }}
              tasks={orphanTasks}
              selectedTaskId={selectedTaskId}
              onTaskClick={onTaskClick}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div style={{
      minWidth: 70,
      padding: '8px 10px',
      borderRadius: 12,
      background: danger ? 'rgba(255,59,48,0.08)' : 'rgba(255,255,255,0.58)',
      border: '1px solid rgba(0,0,0,0.06)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: danger ? '#C01B13' : '#1c1c1e' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'rgba(60,60,67,0.48)', fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
    </div>
  );
}

function WaveTaskGroup({ wave, tasks, selectedTaskId, onTaskClick }: {
  wave: Wave;
  tasks: Task[];
  selectedTaskId?: string | null;
  onTaskClick?: (taskId: string) => void;
}) {
  return (
    <section data-testid={`tasks-wave-${wave.id}`} style={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 14, background: 'rgba(255,255,255,0.58)', overflow: 'hidden' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, color: '#1c1c1e', fontSize: 15, fontWeight: 800 }}>{wave.name}</h3>
          <div style={{ marginTop: 3, fontSize: 11, color: 'rgba(60,60,67,0.52)', fontFamily: "'JetBrains Mono', monospace" }}>
            {tasks.length} task{tasks.length === 1 ? '' : 's'} · {wave.status}
          </div>
        </div>
      </header>
      {tasks.length === 0 ? (
        <div style={{ padding: 14, color: 'rgba(60,60,67,0.48)', fontSize: 12 }}>
          No tasks in this wave.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {tasks.map(task => {
            const color = STATUS_COLORS[task.status];
            return (
              <button
                key={task.id}
                data-testid={`project-task-row-${task.id}`}
                onClick={() => onTaskClick?.(task.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(180px, 1fr) 110px minmax(160px, 260px)',
                  gap: 12,
                  alignItems: 'center',
                  textAlign: 'left',
                  padding: '12px 14px',
                  border: 'none',
                  borderBottom: '1px solid rgba(0,0,0,0.04)',
                  background: selectedTaskId === task.id ? 'rgba(0,122,255,0.08)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 750, color: '#1c1c1e' }}>{task.name}</div>
                  {task.description && (
                    <div style={{ marginTop: 3, fontSize: 11, color: 'rgba(60,60,67,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.description}
                    </div>
                  )}
                </div>
                <span style={{ justifySelf: 'start', fontSize: 11, fontWeight: 800, color: color.fg, background: color.bg, padding: '3px 8px', borderRadius: 999 }}>
                  {STATUS_LABELS[task.status]}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(60,60,67,0.62)', fontFamily: "'JetBrains Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {skillLabel(task.skillName)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
