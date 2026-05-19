import { useState, useEffect, useCallback } from 'react';
import type { Task } from '../types/domain';
import type { Skill } from '../services/dataverse';
import SkillPicker from './SkillPicker';
import DependencyPicker from './DependencyPicker';

export interface TaskFormData {
  title: string;
  description: string;
  type: number | undefined;
  assigneeKind: number | undefined;
  assigneeRole: number | undefined;
  skillName: string;
  skillVersion: string;
  skillContext: string;
  dependencyIds: string[];
}

interface TaskEditorPanelProps {
  task: Task | null;
  waveId: string;
  projectId: string;
  skills: Skill[];
  siblingTasks: { id: string; name: string; status: string }[];
  onSave: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  locked?: boolean;
}

const TASK_TYPES: { value: number; label: string }[] = [
  { value: 950000010, label: 'Discovery' },
  { value: 950000020, label: 'DesignDecision' },
  { value: 950000030, label: 'Configuration' },
  { value: 950000040, label: 'Approval' },
  { value: 950000050, label: 'DataMigration' },
  { value: 950000060, label: 'Test' },
  { value: 950000070, label: 'Review' },
  { value: 950000080, label: 'Documentation' },
];

const ROLE_OPTIONS: { value: number; label: string }[] = [
  { value: 950000010, label: 'DA' },
  { value: 950000020, label: 'Consultant' },
  { value: 950000030, label: 'SME' },
];

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'rgba(60,60,67,0.42)',
  marginBottom: 4,
};

const INPUT_STYLE: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid rgba(0,0,0,0.10)',
  borderRadius: 10,
  fontSize: 13,
  width: '100%',
  background: '#fff',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  boxSizing: 'border-box',
};

function parseSkillFromTask(task: Task): { name: string; version: string } {
  if (!task.skillName) return { name: '', version: '' };
  try {
    const arr = JSON.parse(task.skillName);
    if (Array.isArray(arr) && arr.length > 0) {
      return { name: arr[0].name ?? '', version: arr[0].version ?? '' };
    }
  } catch {
    // not JSON — use raw value
  }
  return { name: task.skillName, version: '' };
}

function initForm(task: Task | null): TaskFormData {
  if (!task) {
    return {
      title: '',
      description: '',
      type: undefined,
      assigneeKind: undefined,
      assigneeRole: undefined,
      skillName: '',
      skillVersion: '',
      skillContext: '',
      dependencyIds: [],
    };
  }
  const skill = parseSkillFromTask(task);
  return {
    title: task.name,
    description: (task as any).description ?? '',
    type: (task as any).type ?? undefined,
    assigneeKind: (task as any).assigneeKind ?? undefined,
    assigneeRole: (task as any).assigneeRole ?? undefined,
    skillName: skill.name,
    skillVersion: skill.version,
    skillContext: (task as any).skillContext ?? '',
    dependencyIds: task.predecessorIds ?? [],
  };
}

export default function TaskEditorPanel({
  task,
  waveId: _waveId,
  projectId: _projectId,
  skills,
  siblingTasks,
  onSave,
  onCancel,
  locked,
}: TaskEditorPanelProps) {
  const isEdit = task !== null;
  const [form, setForm] = useState<TaskFormData>(() => initForm(task));
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [assigneeError, setAssigneeError] = useState(false);

  useEffect(() => {
    setForm(initForm(task));
    setTitleError(false);
    setAssigneeError(false);
  }, [task]);

  const set = useCallback(
    <K extends keyof TaskFormData>(key: K, value: TaskFormData[K]) => {
      setForm(prev => ({ ...prev, [key]: value }));
      if (key === 'title') setTitleError(false);
      if (key === 'assigneeKind') setAssigneeError(false);
    },
    [],
  );

  const handleSave = async () => {
    let hasError = false;
    if (!form.title.trim()) {
      setTitleError(true);
      hasError = true;
    }
    if (form.assigneeKind === undefined) {
      setAssigneeError(true);
      hasError = true;
    }
    if (hasError) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const disabled = !!locked || saving;

  return (
    <div
      data-testid="task-editor-panel"
      style={{
        width: '100%',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        overflow: 'auto',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2
          data-testid="editor-title"
          style={{ fontSize: 16, fontWeight: 700, color: '#1c1c1e', margin: 0 }}
        >
          {isEdit ? task.name : 'New Task'}
        </h2>
        <button
          data-testid="btn-close"
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(60,60,67,0.72)',
            cursor: 'pointer',
            fontSize: 18,
          }}
        >
          ✕
        </button>
      </div>

      {/* Locked banner */}
      {locked && (
        <div
          data-testid="locked-banner"
          style={{
            padding: '8px 12px',
            background: 'rgba(255,204,0,0.12)',
            border: '1px solid rgba(255,204,0,0.3)',
            borderRadius: 10,
            fontSize: 12,
            color: '#8a6d00',
            fontWeight: 600,
          }}
        >
          🔒 This wave has tasks in progress
        </div>
      )}

      {/* Title */}
      <div>
        <div style={LABEL_STYLE}>Title</div>
        <input
          data-testid="input-title"
          type="text"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="e.g. Configure Chart of Accounts"
          disabled={disabled}
          style={{
            ...INPUT_STYLE,
            ...(titleError ? { border: '1px solid #ff3b30' } : {}),
          }}
        />
        {titleError && (
          <div data-testid="title-error" style={{ fontSize: 11, color: '#ff3b30', marginTop: 2 }}>
            Title is required
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <div style={LABEL_STYLE}>Description</div>
        <textarea
          data-testid="input-description"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={3}
          disabled={disabled}
          style={{ ...INPUT_STYLE, resize: 'vertical' }}
        />
      </div>

      {/* Type */}
      <div>
        <div style={LABEL_STYLE}>Type</div>
        <select
          data-testid="select-type"
          value={form.type ?? ''}
          onChange={e => set('type', e.target.value ? Number(e.target.value) : undefined)}
          disabled={disabled}
          style={INPUT_STYLE}
        >
          <option value="">— select —</option>
          {TASK_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Assignee */}
      <div>
        <div style={LABEL_STYLE}>Assignee *</div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, cursor: disabled ? 'default' : 'pointer' }}>
            <input
              data-testid="radio-worker"
              type="radio"
              name="assigneeKind"
              value={950000010}
              checked={form.assigneeKind === 950000010}
              onChange={() => {
                set('assigneeKind', 950000010);
                set('assigneeRole', undefined);
              }}
              disabled={disabled}
            />
            Worker
          </label>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, cursor: disabled ? 'default' : 'pointer' }}>
            <input
              data-testid="radio-role"
              type="radio"
              name="assigneeKind"
              value={950000020}
              checked={form.assigneeKind === 950000020}
              onChange={() => set('assigneeKind', 950000020)}
              disabled={disabled}
            />
            Role
          </label>
        </div>
        {assigneeError && (
          <div data-testid="assignee-error" style={{ fontSize: 11, color: '#ff3b30', marginTop: -4, marginBottom: 4 }}>
            Assignee is required — choose Worker or Role
          </div>
        )}
        {form.assigneeKind === 950000020 && (
          <select
            data-testid="select-role"
            value={form.assigneeRole ?? ''}
            onChange={e => set('assigneeRole', e.target.value ? Number(e.target.value) : undefined)}
            disabled={disabled}
            style={INPUT_STYLE}
          >
            <option value="">— select role —</option>
            {ROLE_OPTIONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Skill */}
      <div>
        <div style={LABEL_STYLE}>Skill</div>
        <SkillPicker
          skills={skills}
          selectedSkillName={form.skillName}
          selectedSkillVersion={form.skillVersion}
          onChange={(name, version) => {
            set('skillName', name);
            set('skillVersion', version);
          }}
          disabled={disabled}
        />
      </div>

      {/* Skill Context */}
      <div>
        <div style={LABEL_STYLE}>Skill Context / Prompt</div>
        <textarea
          data-testid="input-context"
          value={form.skillContext}
          onChange={e => set('skillContext', e.target.value)}
          rows={5}
          placeholder="Custom instructions for the Worker..."
          disabled={disabled}
          style={{
            ...INPUT_STYLE,
            resize: 'vertical',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        />
      </div>

      {/* Dependencies */}
      <div>
        <div style={LABEL_STYLE}>Dependencies</div>
        <DependencyPicker
          availableTasks={siblingTasks}
          selectedIds={form.dependencyIds}
          onChange={ids => set('dependencyIds', ids)}
          disabled={disabled}
        />
      </div>

      {/* Buttons */}
      {!locked && (
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
          <button
            data-testid="btn-cancel"
            type="button"
            onClick={onCancel}
            disabled={saving}
            style={{
              flex: 1,
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid rgba(0,0,0,0.10)',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: saving ? 'default' : 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            data-testid="btn-save"
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: '10px 20px',
              background: '#007AFF',
              color: '#fff',
              fontWeight: 700,
              borderRadius: 10,
              border: 'none',
              fontSize: 13,
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.6 : 1,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {saving ? '⏳ Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      )}
    </div>
  );
}
