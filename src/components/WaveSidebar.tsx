import type { Wave, Task } from '../types/domain';

interface WaveSidebarProps {
  waves: Wave[];
  tasks: Task[];
  activeWaveId: string | null;
  onSelectWave: (waveId: string) => void;
}

export default function WaveSidebar({ waves, tasks, activeWaveId, onSelectWave }: WaveSidebarProps) {
  if (waves.length === 0) {
    return (
      <div data-testid="wave-sidebar-empty" style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: 'monospace', fontSize: 12 }}>
        No waves yet
      </div>
    );
  }

  return (
    <div data-testid="wave-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {waves.map(wave => {
        const waveTasks = tasks.filter(t => t.waveId === wave.id);
        const total = waveTasks.length || wave.taskCount;
        const completed = waveTasks.filter(t => t.status === 'Completed').length;
        const pct = total > 0 ? (completed / total) * 100 : 0;
        const isActive = wave.id === activeWaveId;

        return (
          <button
            key={wave.id}
            data-testid={`wave-sidebar-card-${wave.id}`}
            data-active={String(isActive)}
            onClick={() => onSelectWave(wave.id)}
            style={{
              background: isActive ? 'var(--accent-glow)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${isActive ? 'var(--accent-border)' : 'var(--border-glass)'}`,
              borderLeft: isActive ? '3px solid var(--accent)' : undefined,
              borderRadius: 10,
              padding: '10px 12px',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 600, color: isActive ? 'var(--accent)' : '#1c1c1e', marginBottom: 6 }}>
              {wave.name}
            </div>
            <div data-testid={`wave-progress-${wave.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--pending)' }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  borderRadius: 2,
                  background: pct === 100 ? 'var(--completed)' : 'var(--accent)',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                {completed}/{total}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
