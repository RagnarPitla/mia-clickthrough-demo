import { useState } from 'react';

interface CreateTaskFormProps {
  onSubmit: (task: { name: string; skillName: string; predecessorIds: string[] }) => void;
  onCancel: () => void;
  availableTaskIds: { id: string; name: string }[];
}

export default function CreateTaskForm({ onSubmit, onCancel, availableTaskIds }: CreateTaskFormProps) {
  const [name, setName] = useState('');
  const [skillName, setSkillName] = useState('');
  const [selectedDeps, setSelectedDeps] = useState<string[]>([]);

  const toggleDep = (id: string) => {
    setSelectedDeps(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), skillName: skillName.trim(), predecessorIds: selectedDeps });
  };

  return (
    <form
      data-testid="create-task-form"
      onSubmit={handleSubmit}
      style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-glass)',
        borderRadius: 8,
        padding: 20,
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>New Task</h3>

      <label style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
        Name
        <input
          data-testid="input-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Configure Chart of Accounts"
          required
          style={{ display: 'block', width: '100%', marginTop: 4, padding: '6px 10px', background: 'var(--bg-deep)', border: '1px solid var(--border-glass)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 13 }}
        />
      </label>

      <label style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
        Skill
        <input
          data-testid="input-skill"
          type="text"
          value={skillName}
          onChange={e => setSkillName(e.target.value)}
          placeholder="e.g. fo-chart-of-accounts@1"
          style={{ display: 'block', width: '100%', marginTop: 4, padding: '6px 10px', background: 'var(--bg-deep)', border: '1px solid var(--border-glass)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 13 }}
        />
      </label>

      {availableTaskIds.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>Dependencies</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {availableTaskIds.map(t => (
              <label key={t.id} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  data-testid={`dep-${t.id}`}
                  checked={selectedDeps.includes(t.id)}
                  onChange={() => toggleDep(t.id)}
                />
                {t.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <button
          type="button"
          data-testid="btn-cancel-create"
          onClick={onCancel}
          style={{ padding: '6px 16px', background: 'transparent', border: '1px solid var(--border-glass)', borderRadius: 4, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}
        >
          Cancel
        </button>
        <button
          type="submit"
          data-testid="btn-submit-create"
          style={{ padding: '6px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
        >
          + Add Task
        </button>
      </div>
    </form>
  );
}
