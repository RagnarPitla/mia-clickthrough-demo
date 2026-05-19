import { useState } from 'react';
import type { WatchdogSchedule, Task, WatchdogScheduleStatus } from '../types/domain';
import { sanitizeOutput } from '../utils/sanitizeOutput';
import { parseSkillNames } from '../services/dataverse';

export interface WatchDogPageProps {
  schedules: WatchdogSchedule[];
  activity: Task[];
  loading: boolean;
  error: string | null;
  onCreateSchedule: (input: ScheduleFormData) => Promise<void>;
  onUpdateSchedule: (id: string, fields: Partial<ScheduleFormData>) => Promise<void>;
  onDeleteSchedule: (id: string) => Promise<void>;
  onToggleSchedule: (id: string, enabled: boolean) => Promise<void>;
  onRefresh: () => void;
}

export interface ScheduleFormData {
  name: string;
  cronExpression: string;
  skillName: string;
  promptText: string;
  toolsAllowed: string;
  enabled: boolean;
}

const EMPTY_FORM: ScheduleFormData = {
  name: '',
  cronExpression: '',
  skillName: '',
  promptText: '',
  toolsAllowed: '',
  enabled: true,
};

const glass = {
  background: '#fff',
  border: '1px solid rgba(0,0,0,0.08)',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const sectionTitle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'rgba(60,60,67,0.42)',
  margin: 0,
};

const STATUS_COLORS: Record<WatchdogScheduleStatus, string> = {
  Success: '#30D158',
  Failed: '#FF3B30',
  Running: '#007AFF',
};

const ACTIVITY_ICONS: Record<string, { symbol: string; color: string }> = {
  Completed: { symbol: '✓', color: '#30D158' },
  Failed: { symbol: '✗', color: '#FF3B30' },
  InProgress: { symbol: '⚡', color: '#007AFF' },
  Pending: { symbol: '○', color: '#8E8E93' },
  Ready: { symbol: '○', color: '#8E8E93' },
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function WatchDogPage({
  schedules,
  activity,
  loading,
  error,
  onCreateSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onToggleSchedule,
  onRefresh,
}: WatchDogPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (schedule: WatchdogSchedule) => {
    setForm({
      name: schedule.name,
      cronExpression: schedule.cronExpression,
      skillName: schedule.skillName,
      promptText: schedule.promptText,
      toolsAllowed: schedule.toolsAllowed,
      enabled: schedule.enabled,
    });
    setEditingId(schedule.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const submitForm = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await onUpdateSchedule(editingId, form);
      } else {
        await onCreateSchedule(form);
      }
      cancelForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await onDeleteSchedule(id);
    setDeleteConfirm(null);
  };

  if (loading && schedules.length === 0) {
    return (
      <div data-testid="watchdog-page" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ padding: 24, borderRadius: 18, ...glass }}>
          <h2 style={sectionTitle}>Schedules</h2>
          <div
            data-testid="watchdog-loading"
            style={{
              fontSize: 13,
              color: '#007AFF',
              fontFamily: "'JetBrains Mono', monospace",
              animation: 'pulse 1.2s ease-in-out infinite',
              marginTop: 12,
            }}
          >
            Loading watchdog schedules…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="watchdog-page" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 0 }}>
      {/* Error banner */}
      {error && (
        <div
          data-testid="watchdog-error"
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            background: 'rgba(255,59,48,0.08)',
            color: '#FF3B30',
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {error}
        </div>
      )}

      {/* ── SECTION A: Schedule Management ── */}
      <div
        data-testid="watchdog-schedules-card"
        className="glass"
        style={{ borderRadius: 18, padding: '20px 24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={sectionTitle}>Schedules</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              data-testid="watchdog-refresh-btn"
              onClick={onRefresh}
              style={{
                padding: '4px 10px',
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                background: 'transparent',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 8,
                color: 'rgba(60,60,67,0.72)',
                cursor: 'pointer',
              }}
            >
              ⟳ Refresh
            </button>
            <button
              data-testid="watchdog-add-btn"
              onClick={startCreate}
              style={{
                padding: '4px 12px',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: '#007AFF',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              + Add Schedule
            </button>
          </div>
        </div>

        {/* Inline form */}
        {showForm && (
          <div
            data-testid="watchdog-schedule-form"
            style={{
              padding: 16,
              borderRadius: 12,
              background: 'rgba(0,0,0,0.02)',
              border: '1px solid rgba(0,0,0,0.06)',
              marginBottom: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1c1c1e' }}>
              {editingId ? 'Edit Schedule' : 'New Schedule'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input
                data-testid="schedule-name-input"
                placeholder="Name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={inputStyle}
              />
              <input
                data-testid="schedule-cron-input"
                placeholder="Cron expression (e.g. 0 */6 * * *)"
                value={form.cronExpression}
                onChange={e => setForm(f => ({ ...f, cronExpression: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <input
              data-testid="schedule-skill-input"
              placeholder="Skill name"
              value={form.skillName}
              onChange={e => setForm(f => ({ ...f, skillName: e.target.value }))}
              style={inputStyle}
            />
            <textarea
              data-testid="schedule-prompt-input"
              placeholder="Prompt text"
              value={form.promptText}
              onChange={e => setForm(f => ({ ...f, promptText: e.target.value }))}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <input
              data-testid="schedule-tools-input"
              placeholder="Tools allowed (comma-separated)"
              value={form.toolsAllowed}
              onChange={e => setForm(f => ({ ...f, toolsAllowed: e.target.value }))}
              style={inputStyle}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#1c1c1e' }}>
              <input
                data-testid="schedule-enabled-input"
                type="checkbox"
                checked={form.enabled}
                onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
              />
              Enabled
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                data-testid="schedule-cancel-btn"
                onClick={cancelForm}
                style={{
                  padding: '6px 14px',
                  fontSize: 11,
                  borderRadius: 8,
                  background: 'transparent',
                  border: '1px solid rgba(0,0,0,0.10)',
                  color: 'rgba(60,60,67,0.72)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                data-testid="schedule-save-btn"
                onClick={submitForm}
                disabled={saving || !form.name || !form.skillName}
                style={{
                  padding: '6px 14px',
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 8,
                  background: saving || !form.name || !form.skillName ? 'rgba(0,122,255,0.4)' : '#007AFF',
                  border: 'none',
                  color: '#fff',
                  cursor: saving ? 'wait' : 'pointer',
                }}
              >
                {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        )}

        {/* Schedule list */}
        {schedules.length === 0 && !loading ? (
          <div
            data-testid="watchdog-empty"
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: 'rgba(60,60,67,0.42)',
              fontSize: 13,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>🐕</div>
            No watchdog schedules configured yet.
          </div>
        ) : (
          <div data-testid="watchdog-schedule-list" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {schedules.map(schedule => (
              <div
                key={schedule.id}
                data-testid={`schedule-row-${schedule.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: '1px solid rgba(0,0,0,0.04)',
                }}
              >
                {/* Enable/disable toggle */}
                <button
                  data-testid={`schedule-toggle-${schedule.id}`}
                  onClick={() => onToggleSchedule(schedule.id, !schedule.enabled)}
                  style={{
                    width: 36,
                    height: 20,
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    background: schedule.enabled ? '#30D158' : 'rgba(0,0,0,0.12)',
                    position: 'relative',
                    flexShrink: 0,
                    transition: 'background 0.2s',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: schedule.enabled ? 18 : 2,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transition: 'left 0.2s',
                    }}
                  />
                </button>

                {/* Name + cron */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1c1c1e' }}>
                    {schedule.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(60,60,67,0.42)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {schedule.cronExpression}
                  </div>
                </div>

                {/* Skill name */}
                <div style={{ fontSize: 11, color: 'rgba(60,60,67,0.72)', fontFamily: "'JetBrains Mono', monospace", minWidth: 80 }}>
                  {schedule.skillName}
                </div>

                {/* Last status badge */}
                {schedule.lastStatus && (
                  <span
                    data-testid={`schedule-status-${schedule.id}`}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: STATUS_COLORS[schedule.lastStatus],
                      background: `${STATUS_COLORS[schedule.lastStatus]}18`,
                    }}
                  >
                    {schedule.lastStatus}
                  </span>
                )}

                {/* Last run time */}
                {schedule.lastRunTime && (
                  <span style={{ fontSize: 10, color: 'rgba(60,60,67,0.42)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {formatTime(schedule.lastRunTime)}
                  </span>
                )}

                {/* Actions */}
                <button
                  data-testid={`schedule-edit-${schedule.id}`}
                  onClick={() => startEdit(schedule)}
                  style={actionBtnStyle}
                >
                  ✎
                </button>
                <button
                  data-testid={`schedule-delete-${schedule.id}`}
                  onClick={() => setDeleteConfirm(schedule.id)}
                  style={{ ...actionBtnStyle, color: '#FF3B30' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION B: Activity Feed ── */}
      <div
        data-testid="watchdog-activity-card"
        className="glass"
        style={{ borderRadius: 18, padding: '20px 24px' }}
      >
        <h2 style={{ ...sectionTitle, marginBottom: 12 }}>Recent Activity</h2>

        {activity.length === 0 ? (
          <div
            data-testid="watchdog-activity-empty"
            style={{
              textAlign: 'center',
              padding: '24px 16px',
              color: 'rgba(60,60,67,0.42)',
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            No recent watchdog activity
          </div>
        ) : (
          <div
            data-testid="watchdog-activity-list"
            style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 400, overflowY: 'auto' }}
          >
            {activity.map(task => {
              const iconInfo = ACTIVITY_ICONS[task.status] ?? { symbol: '○', color: '#8E8E93' };
              const skillDisplay = parseSkillNames(task.skillName).join(', ') || task.skillName;

              return (
                <div
                  key={task.id}
                  data-testid={`activity-entry-${task.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 12,
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                  }}
                >
                  <span style={{
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'rgba(60,60,67,0.30)',
                    minWidth: 100,
                    flexShrink: 0,
                  }}>
                    {formatTime(task.modifiedOn)}
                  </span>
                  <span style={{ fontSize: 14, color: iconInfo.color, flexShrink: 0 }}>
                    {iconInfo.symbol}
                  </span>
                  <span style={{ fontSize: 12, color: '#007AFF', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                    {skillDisplay}
                  </span>
                  <span style={{ fontSize: 12, color: '#1c1c1e', flex: 1 }}>
                    {sanitizeOutput(task.outputSummary ?? task.name, 120)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div
          data-testid="delete-dialog-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            data-testid="delete-dialog"
            className="glass"
            style={{
              padding: '24px 28px',
              borderRadius: 16,
              maxWidth: 400,
              width: '90%',
              background: 'rgba(255,255,255,0.98)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1c1c1e', margin: '0 0 8px' }}>
              Delete Schedule?
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(60,60,67,0.72)', margin: '0 0 20px' }}>
              This will permanently remove this watchdog schedule.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                data-testid="delete-cancel-btn"
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '8px 18px',
                  fontSize: 13,
                  borderRadius: 10,
                  background: 'transparent',
                  border: '1px solid rgba(0,0,0,0.10)',
                  color: 'rgba(60,60,67,0.72)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                data-testid="delete-confirm-btn"
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  borderRadius: 10,
                  background: '#FF3B30',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 12,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  borderRadius: 8,
  border: '1px solid rgba(0,0,0,0.10)',
  background: '#fff',
  color: '#1c1c1e',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const actionBtnStyle: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: 13,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: 'rgba(60,60,67,0.42)',
  borderRadius: 6,
  flexShrink: 0,
};
