export interface PlaybookTask {
  name: string;
  skillName: string;
  dependsOn: string[];
}

export interface Playbook {
  id: string;
  name: string;
  description: string;
  tasks: PlaybookTask[];
}

interface PlaybooksPageProps {
  playbooks: Playbook[];
  onComposeWave?: (playbookId: string) => void;
}

export default function PlaybooksPage({ playbooks, onComposeWave }: PlaybooksPageProps) {
  if (playbooks.length === 0) {
    return (
      <div data-testid="playbooks-empty" style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
        No playbooks available
      </div>
    );
  }

  return (
    <div data-testid="playbooks-page" style={{ padding: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: 'var(--text-primary)' }}>Playbooks</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {playbooks.map(pb => (
          <div
            key={pb.id}
            data-testid={`playbook-card-${pb.id}`}
            style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-glass)',
              borderRadius: 8,
              padding: 16,
              backdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{pb.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{pb.description}</div>

            {/* Mini DAG preview */}
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
              {pb.tasks.map((t, i) => (
                <div key={i} data-testid={`task-preview-${pb.id}-${i}`}>
                  {t.dependsOn.length > 0 ? `${t.dependsOn.join(', ')} → ` : ''}{t.name}
                </div>
              ))}
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
              {pb.tasks.length} tasks
            </div>

            <button
              data-testid={`compose-${pb.id}`}
              onClick={() => onComposeWave?.(pb.id)}
              style={{
                marginTop: 'auto',
                padding: '6px 14px',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 12,
                alignSelf: 'flex-start',
              }}
            >
              ⚡ Compose Wave
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
