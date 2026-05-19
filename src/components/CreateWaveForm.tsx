import { useState } from 'react';
import type { Phase } from '../types/domain';

interface CreateWaveFormProps {
  phases: Phase[];
  onSubmit: (data: { name: string; phaseId: string; description: string }) => Promise<void>;
  onCancel: () => void;
  defaultPhaseId?: string;
  namePlaceholder?: string;
  title?: string;
  submitLabel?: string;
}

export default function CreateWaveForm({
  phases,
  onSubmit,
  onCancel,
  defaultPhaseId = '',
  namePlaceholder = 'Wave name...',
  title = 'New Wave',
  submitLabel = 'Create',
}: CreateWaveFormProps) {
  const [name, setName] = useState('');
  const [phaseId, setPhaseId] = useState(defaultPhaseId);
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      await onSubmit({ name: name.trim(), phaseId, description: description.trim() });
    } finally {
      setCreating(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px',
    border: '1px solid rgba(0,0,0,0.10)',
    borderRadius: 8,
    fontSize: 12,
    width: '100%',
    background: '#fff',
    boxSizing: 'border-box',
  };

  return (
    <form
      data-testid="create-wave-form"
      onSubmit={handleSubmit}
      style={{
        padding: 12,
        borderRadius: 12,
        background: 'rgba(0,122,255,0.04)',
        border: '1px solid rgba(0,122,255,0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: '#007AFF' }}>{title}</div>

      <input
        data-testid="input-wave-name"
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder={namePlaceholder}
        required
        style={inputStyle}
      />

      <select
        data-testid="select-phase"
        value={phaseId}
        onChange={e => setPhaseId(e.target.value)}
        style={inputStyle}
      >
        <option value="">— Select phase —</option>
        {phases.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <textarea
        data-testid="input-description"
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Optional description..."
        rows={2}
        style={{ ...inputStyle, resize: 'none' }}
      />

      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button
          type="button"
          data-testid="btn-cancel-wave"
          onClick={onCancel}
          style={{
            padding: '6px 14px',
            background: 'transparent',
            color: 'rgba(60,60,67,0.72)',
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.10)',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          data-testid="btn-create-wave"
          disabled={creating}
          style={{
            padding: '6px 14px',
            background: '#007AFF',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 8,
            border: 'none',
            cursor: creating ? 'default' : 'pointer',
            opacity: creating ? 0.7 : 1,
          }}
        >
          {creating ? 'Creating...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
