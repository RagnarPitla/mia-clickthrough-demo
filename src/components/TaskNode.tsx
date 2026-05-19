import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { TaskStatus } from '../types/domain';
import { sanitizeOutput } from '../utils/sanitizeOutput';
import { MIA_SCM_DECISION_URL } from '../services/miaDemoData';

export interface TaskNodeData extends Record<string, unknown> {
  label: string;
  status: TaskStatus;
  skillName: string;
  attempt: number;
  outputSummary?: string;
  awaitingUser?: boolean;
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  Completed: 'var(--completed)',
  InProgress: 'var(--inprogress)',
  Ready: 'var(--ready)',
  Failed: 'var(--failed)',
  Pending: 'var(--pending)',
  WaitingOnChild: 'var(--inprogress)',
  Cancelled: 'var(--pending)',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  Completed: '✓ DONE',
  InProgress: '▶ RUN',
  Ready: '● READY',
  Failed: '✗ FAIL',
  Pending: '○ WAIT',
  WaitingOnChild: '◐ CHILD',
  Cancelled: '⊘ CANCEL',
};

function TaskNode({ data, selected }: NodeProps & { data: TaskNodeData }) {
  const color = STATUS_COLORS[data.status];
  const isActive = data.status === 'InProgress';
  const isAwaiting = !!data.awaitingUser;

  return (
    <div
      data-testid="task-node"
      className={`task-node ${selected ? 'selected' : ''} ${isActive ? 'active' : ''} ${isAwaiting ? 'awaiting-user' : ''}`}
      style={{
        border: `1px solid ${isAwaiting ? '#FF9F0A' : selected ? 'var(--accent)' : 'var(--border-glass)'}`,
        borderLeft: `3px solid ${isAwaiting ? '#FF9F0A' : color}`,
        borderRadius: 8,
        padding: '8px 12px',
        minWidth: 180,
        maxWidth: 260,
        background: isAwaiting ? 'rgba(255,159,10,0.08)' : 'var(--bg-glass)',
        backdropFilter: 'blur(12px)',
        boxShadow: isAwaiting
          ? '0 0 0 4px rgba(255,159,10,0.18), 0 0 18px rgba(255,159,10,0.30)'
          : selected ? `0 0 12px var(--accent-glow)` : 'none',
        animation: isAwaiting ? 'wave-pulse 1.4s ease-in-out infinite' : undefined,
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: color }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1c1c1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {data.label}
        </span>
        <span
          data-testid="status-badge"
          style={{ fontSize: 10, fontWeight: 700, color: isAwaiting ? '#B26A00' : color, marginLeft: 8, whiteSpace: 'nowrap', fontFamily: 'monospace' }}
        >
          {isAwaiting ? '⏸ AWAITING' : STATUS_LABELS[data.status]}
        </span>
      </div>

      <div style={{ fontSize: 11, color: 'rgba(60,60,67,0.42)', fontFamily: 'monospace' }}>
        {data.skillName && <span data-testid="skill-tag">⚙ {data.skillName}</span>}
        {data.attempt > 1 && <span style={{ marginLeft: 8 }}>↻{data.attempt}</span>}
      </div>

      {isAwaiting && (
        <a
          data-testid="awaiting-user-pill"
          href={MIA_SCM_DECISION_URL}
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: 6, padding: '4px 10px', borderRadius: 6,
            background: 'rgba(255,159,10,0.18)', color: '#7A4500',
            fontSize: 10, fontWeight: 800, letterSpacing: '0.04em',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            display: 'inline-block', textDecoration: 'none',
            border: '1px solid rgba(255,159,10,0.5)',
            cursor: 'pointer',
          }}
          title="Open the SCM human intervention to make this decision"
        >
          🟠 Open human intervention →
        </a>
      )}

      {data.outputSummary && !isAwaiting && (
        <div
          data-testid="output-preview"
          style={{ fontSize: 10, color: 'rgba(60,60,67,0.72)', marginTop: 4, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {'>'} {sanitizeOutput(data.outputSummary, 80)}
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: color }} />
    </div>
  );
}

export default memo(TaskNode);
