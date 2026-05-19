import { useState } from 'react';
import type { Task, TaskStatus } from '../types/domain';
import { sanitizeOutputFull } from '../utils/sanitizeOutput';

const STATUS_LABELS: Record<TaskStatus, string> = {
  Completed: '✓ Completed',
  InProgress: '▶ In Progress',
  Ready: '● Ready',
  Failed: '✗ Failed',
  Pending: '○ Pending',
  WaitingOnChild: '◐ Waiting on Child',
  Cancelled: '⊘ Cancelled',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  Completed: '#30D158',
  InProgress: '#FF9500',
  Ready: '#007AFF',
  Failed: '#FF3B30',
  Pending: '#8E8E93',
  WaitingOnChild: '#AF52DE',
  Cancelled: '#8E8E93',
};

const LABEL: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.06em', color: 'rgba(60,60,67,0.42)',
  fontFamily: "'JetBrains Mono', monospace", marginBottom: 3,
};

const STAGE_ICONS: Record<string, string> = {
  Pending: '○',
  Promoted: '↑',
  Dispatched: '→',
  Bootstrap: '⚡',
  Repo: '📂',
  MCP: '🔌',
  Execute: '▶',
  Review: '🔍',
  Summarize: '📝',
  Verdict: '⚖️',
  Complete: '✅',
  Error: '✗',
};

const STAGE_COLORS: Record<string, string> = {
  Pending: '#8E8E93',
  Promoted: '#007AFF',
  Dispatched: '#5856D6',
  Bootstrap: '#FF9500',
  Repo: '#FF9500',
  MCP: '#FF9500',
  Execute: '#AF52DE',
  Review: '#AF52DE',
  Summarize: '#AF52DE',
  Verdict: '#5856D6',
  Complete: '#30D158',
  Error: '#FF3B30',
};

interface CheckpointEntry {
  time: string;
  stage: string;
  message: string;
}

export function parseCheckpoint(raw: string): CheckpointEntry[] {
  if (!raw) return [];
  return raw.split('\n').filter(l => l.trim()).map(line => {
    // Format: [HH:MM:SS] **Stage** — Message
    const match = line.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*\*{0,2}(\w+)\*{0,2}\s*[-—–]\s*(.+)$/);
    if (match) return { time: match[1], stage: match[2], message: match[3].trim() };
    // Fallback: treat entire line as message
    return { time: '', stage: '', message: line.trim() };
  });
}

function stageIcon(stage: string): string {
  if (!stage) return '•';
  // Handle "Execute ✓" or messages containing completion markers
  return STAGE_ICONS[stage] ?? '•';
}

function stageColor(stage: string): string {
  if (!stage) return '#8E8E93';
  return STAGE_COLORS[stage] ?? '#8E8E93';
}

function parseSkillDisplay(raw: string): string {
  if (!raw) return '—';
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.map((s: any) => `${s.name}@${s.version || '1'}`).join(', ');
  } catch { /* raw string */ }
  return raw;
}

function formatTime(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

interface TaskDetailPanelProps {
  task: Task | null;
  onClose: () => void;
  onRetry?: (taskId: string) => void;
  onCancel?: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
  onResubmit?: (taskId: string) => void;
  onApproveGate?: (taskId: string) => void;
  onRerun?: (taskId: string, feedback: string) => void;
}

export default function TaskDetailPanel({ task, onClose, onRetry, onCancel, onEdit, onResubmit, onApproveGate, onRerun }: TaskDetailPanelProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (!task) return null;

  const canRetry = task.status === 'Failed';
  const canCancel = task.status === 'Ready' || task.status === 'Pending';
  const canEdit = task.status === 'Failed' || task.status === 'Ready' || task.status === 'Pending';
  const canResubmit = !!onResubmit && task.assigneeKind === 'Worker';
  const canRerun = !!onRerun && task.assigneeKind === 'Worker';
  const canApproveGate = !!onApproveGate
    && task.assigneeKind === 'Role'
    && task.assigneeRole === 'DA'
    && task.type === 'Approval'
    && task.status === 'Ready';

  return (
    <aside
      data-testid="task-detail-panel"
      style={{
        width: '100%',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h2 data-testid="panel-title" style={{ fontSize: 16, fontWeight: 700, color: '#1c1c1e', margin: 0, lineHeight: 1.3, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {task.name}
        </h2>
        <button data-testid="panel-close" onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'rgba(60,60,67,0.5)', cursor: 'pointer', fontSize: 18, flexShrink: 0, marginLeft: 8 }}>
          ✕
        </button>
      </div>

      {/* Status badge */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span data-testid="panel-status" style={{
          padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
          background: `${STATUS_COLORS[task.status]}15`, color: STATUS_COLORS[task.status],
        }}>
          {STATUS_LABELS[task.status]}
        </span>
        {task.type && (
          <span style={{
            padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
            background: 'rgba(0,0,0,0.04)', color: 'rgba(60,60,67,0.72)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            {task.type}
          </span>
        )}
        {task.assigneeKind && (
          <span style={{
            padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
            background: task.assigneeKind === 'Worker' ? 'rgba(175,82,222,0.08)' : 'rgba(0,122,255,0.08)',
            color: task.assigneeKind === 'Worker' ? '#AF52DE' : '#007AFF',
          }}>
            {task.assigneeKind === 'Worker' ? '🤖 Worker' : `👤 ${task.assigneeRole || 'Role'}`}
          </span>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <div>
          <div style={LABEL}>Description</div>
          <div data-testid="panel-description" style={{
            fontSize: 13, color: '#1c1c1e', lineHeight: 1.5,
            background: 'rgba(0,0,0,0.02)', borderRadius: 10, padding: '10px 12px',
            border: '1px solid rgba(0,0,0,0.04)',
          }}>
            {task.description}
          </div>
        </div>
      )}

      {/* Skill */}
      <div>
        <div style={LABEL}>Skill</div>
        <div data-testid="panel-skill" style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
          color: '#007AFF', fontWeight: 600,
        }}>
          {parseSkillDisplay(task.skillName)}
        </div>
      </div>

      {/* Skill Context */}
      {task.skillContext && (
        <div>
          <div style={LABEL}>Skill Context / Prompt</div>
          <pre data-testid="panel-context" style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            color: 'rgba(60,60,67,0.72)', background: 'rgba(0,0,0,0.02)',
            padding: 10, borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)',
            whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto', margin: 0,
          }}>
            {task.skillContext}
          </pre>
        </div>
      )}

      {/* Dependencies */}
      {task.predecessorIds.length > 0 && (
        <div>
          <div style={LABEL}>Dependencies</div>
          <div data-testid="panel-deps" style={{ fontSize: 12, color: 'rgba(60,60,67,0.72)' }}>
            {task.predecessorIds.length} predecessor(s)
          </div>
        </div>
      )}

      {/* Timestamps */}
      {(task.claimedAt || task.completedAt || task.modifiedOn) && (
        <div>
          <div style={LABEL}>Timeline</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'rgba(60,60,67,0.6)' }}>
            {task.modifiedOn && <div>📝 Modified: {formatTime(task.modifiedOn)}</div>}
            {task.claimedAt && <div>🤖 Claimed: {formatTime(task.claimedAt)}</div>}
            {task.completedAt && <div>✅ Completed: {formatTime(task.completedAt)}</div>}
          </div>
        </div>
      )}

      {/* Checkpoint Timeline */}
      {task.checkpoint && parseCheckpoint(task.checkpoint).length > 0 && (
        <div>
          <div style={LABEL}>Worker Progress</div>
          <div
            data-testid="panel-checkpoint"
            style={{
              background: 'rgba(0,0,0,0.02)',
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: 10,
              padding: '10px 12px',
              maxHeight: 260,
              overflow: 'auto',
            }}
          >
            {parseCheckpoint(task.checkpoint).map((entry, i, arr) => {
              const isLast = i === arr.length - 1;
              const color = stageColor(entry.stage);
              const icon = stageIcon(entry.stage);
              const isComplete = entry.message.includes('✓') || entry.stage === 'Complete';

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 10,
                    minHeight: 28,
                    position: 'relative',
                  }}
                >
                  {/* Vertical line + dot */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: 20,
                    flexShrink: 0,
                  }}>
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: isLast ? color : `${color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      flexShrink: 0,
                      border: isLast ? `2px solid ${color}` : 'none',
                    }}>
                      <span style={{ fontSize: 9 }}>{icon}</span>
                    </div>
                    {!isLast && (
                      <div style={{
                        width: 1.5,
                        flex: 1,
                        background: `${color}30`,
                        minHeight: 8,
                      }} />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, paddingBottom: isLast ? 0 : 6 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                      {entry.stage && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          {entry.stage}
                        </span>
                      )}
                      {entry.time && (
                        <span style={{
                          fontSize: 9,
                          color: 'rgba(60,60,67,0.35)',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          {entry.time}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: isComplete ? '#30D158' : 'rgba(60,60,67,0.72)',
                      lineHeight: 1.4,
                      marginTop: 1,
                    }}>
                      {entry.message}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Output */}
      {task.outputSummary && (
        <div>
          <div style={LABEL}>Output</div>
          <pre data-testid="panel-output" style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            color: 'rgba(60,60,67,0.72)', background: 'rgba(0,0,0,0.02)',
            padding: 12, borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)',
            whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', margin: 0,
          }}>
            {sanitizeOutputFull(task.outputSummary)}
          </pre>
        </div>
      )}

      {/* Task ID */}
      <div>
        <div style={LABEL}>Task ID</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(60,60,67,0.35)' }}>
          {task.id}
        </div>
      </div>

      {canApproveGate && (
        <div
          data-testid="approval-gate-hint"
          style={{
            background: 'rgba(48,209,88,0.08)',
            border: '1px solid rgba(48,209,88,0.20)',
            borderRadius: 10,
            padding: '10px 12px',
            color: 'rgba(28,28,30,0.78)',
            fontSize: 12,
            lineHeight: 1.45,
          }}
        >
          This is a DA approval gate. Approving it marks the gate complete so the Dispatcher can promote downstream released work.
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8, flexWrap: 'wrap' }}>
        {canApproveGate && (
          <button data-testid="btn-approve-gate" onClick={() => onApproveGate!(task.id)}
            style={{ flex: '1 1 100%', padding: '10px 16px', background: '#30D158', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            ✅ Approve gate & continue
          </button>
        )}
        {canEdit && onEdit && (
          <button data-testid="btn-edit" onClick={() => onEdit(task.id)}
            style={{ flex: 1, padding: '8px 16px', background: '#007AFF', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            ✏️ {canRetry ? 'Edit & Resubmit' : 'Edit'}
          </button>
        )}
        {canRetry && onRetry && (
          <button data-testid="btn-retry" onClick={() => onRetry(task.id)}
            style={{ flex: 1, padding: '8px 16px', background: 'rgba(0,122,255,0.08)', color: '#007AFF', border: '1px solid rgba(0,122,255,0.2)', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            ↻ Retry as-is
          </button>
        )}
        {canResubmit && (
          <button data-testid="btn-resubmit" onClick={() => onResubmit!(task.id)}
            style={{ flex: 1, padding: '8px 16px', background: 'rgba(0,122,255,0.08)', color: '#007AFF', border: '1px solid rgba(0,122,255,0.2)', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            🚀 Resubmit hosted agent
          </button>
        )}
        {canRerun && (
          <button data-testid="btn-rerun" onClick={() => setShowFeedback(!showFeedback)}
            style={{ flex: 1, padding: '8px 16px', background: showFeedback ? 'rgba(175,82,222,0.12)' : 'rgba(175,82,222,0.08)', color: '#AF52DE', border: '1px solid rgba(175,82,222,0.25)', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            🔄 Resubmit with feedback
          </button>
        )}
        {canCancel && onCancel && (
          <button data-testid="btn-cancel" onClick={() => onCancel(task.id)}
            style={{ padding: '8px 16px', background: 'transparent', color: '#FF3B30', border: '1px solid #FF3B30', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            ⊘ Cancel
          </button>
        )}
      </div>

      {/* Rerun Feedback Panel */}
      {showFeedback && canRerun && (
        <div data-testid="rerun-feedback" style={{
          background: 'rgba(175,82,222,0.04)',
          border: '1px solid rgba(175,82,222,0.15)',
          borderRadius: 10,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{ ...LABEL, color: '#AF52DE' }}>Feedback for Worker</div>
          <textarea
            data-testid="rerun-feedback-input"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. Use 7-year straight-line depreciation for vehicles instead of 5-year…"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              padding: 10,
              borderRadius: 8,
              border: '1px solid rgba(175,82,222,0.2)',
              background: 'rgba(255,255,255,0.8)',
              resize: 'vertical',
              minHeight: 60,
              outline: 'none',
              color: '#1c1c1e',
              lineHeight: 1.5,
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              data-testid="rerun-submit"
              disabled={!feedback.trim()}
              onClick={() => {
                onRerun!(task.id, feedback.trim());
                setFeedback('');
                setShowFeedback(false);
              }}
              style={{
                flex: 1,
                padding: '8px 16px',
                background: feedback.trim() ? '#AF52DE' : 'rgba(175,82,222,0.3)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: feedback.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 700,
                fontSize: 12,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              ▶ Rerun Now
            </button>
            <button
              data-testid="rerun-cancel"
              onClick={() => { setShowFeedback(false); setFeedback(''); }}
              style={{
                padding: '8px 12px',
                background: 'transparent',
                color: 'rgba(60,60,67,0.6)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
