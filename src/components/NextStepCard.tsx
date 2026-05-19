import type { E2EProcess, Wave, Task, Project, NavPage } from '../types/domain';

/* ── Next-step state machine ──────────────────────────────────────── */

export type NextStepState =
  | 'review-scope'
  | 'compose-wave'
  | 'monitor-execution'
  | 'review-gate'
  | 'verify-d365'
  | 'loading';

interface StepConfig {
  icon: string;
  title: string;
  body: string;
  buttonLabel: string;
  /** null = external link (Open D365) */
  targetPage: NavPage | null;
}

const STEP_CONFIGS: Record<Exclude<NextStepState, 'loading'>, (ctx: StepContext) => StepConfig> = {
  'review-scope': (ctx) => ({
    icon: '📋',
    title: 'Review proposed scope',
    body: `AI identified ${ctx.processCount} E2E processes from your playbook. Review and adjust before proceeding.`,
    buttonLabel: 'Go to Scope →',
    targetPage: 'process',
  }),
  'compose-wave': () => ({
    icon: '🌊',
    title: 'Compose your first wave',
    body: 'Scope confirmed. Compose Wave 1 to generate the task plan.',
    buttonLabel: 'Go to Waves →',
    targetPage: 'waves',
  }),
  'monitor-execution': (ctx) => ({
    icon: '⚡',
    title: `Monitor Wave ${ctx.activeWaveName} execution`,
    body: `${ctx.completedTasks} of ${ctx.totalTasks} tasks complete. AI is configuring D365.`,
    buttonLabel: 'Go to Waves →',
    targetPage: 'waves',
  }),
  'review-gate': (ctx) => ({
    icon: '🚪',
    title: `Review gate: ${ctx.activeWaveName}`,
    body: 'All tasks done. Approve the gate to advance.',
    buttonLabel: 'Review Gate →',
    targetPage: 'waves',
  }),
  'verify-d365': (ctx) => ({
    icon: '✅',
    title: 'Verify in D365',
    body: `All ${ctx.totalTasks} tasks complete. Open D365 to validate configuration.`,
    buttonLabel: '↗ Open D365',
    targetPage: null,
  }),
};

interface StepContext {
  processCount: number;
  activeWaveName: string;
  completedTasks: number;
  totalTasks: number;
}

/**
 * Pure function: derive the next-step state from project data.
 * Exported for unit testing.
 */
export function deriveNextStep(
  processes: E2EProcess[],
  waves: Wave[],
  tasks: Task[],
  isLoading: boolean,
): NextStepState {
  if (isLoading) return 'loading';

  const scopedProcesses = processes.filter(p => p.isInScope);
  if (scopedProcesses.length === 0) return 'review-scope';
  if (waves.length === 0) return 'compose-wave';

  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const totalTasks = tasks.length;
  const runningTasks = tasks.filter(t => t.status === 'InProgress' || t.status === 'Ready' || t.status === 'WaitingOnChild').length;

  if (totalTasks > 0 && completedTasks === totalTasks) return 'verify-d365';
  if (totalTasks > 0 && completedTasks > 0 && runningTasks === 0 && completedTasks < totalTasks) return 'review-gate';
  if (totalTasks > 0 && runningTasks > 0) return 'monitor-execution';

  return 'compose-wave';
}

/* ── Component ────────────────────────────────────────────────────── */

interface NextStepCardProps {
  processes: E2EProcess[];
  waves: Wave[];
  tasks: Task[];
  project: Project | null;
  isLoading?: boolean;
  onNavigate: (page: NavPage) => void;
  demoMode?: boolean;
}

export default function NextStepCard({
  processes,
  waves,
  tasks,
  project,
  isLoading = false,
  onNavigate,
  demoMode = false,
}: NextStepCardProps) {
  const state = deriveNextStep(processes, waves, tasks, isLoading);

  if (state === 'loading') {
    return (
      <div
        data-testid="next-step-card"
        data-state="loading"
        className="glass"
        style={{
          borderRadius: 14,
          padding: '14px 20px',
          animation: 'slide-up 0.3s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(0,0,0,0.04)', flexShrink: 0,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 14, borderRadius: 7, background: 'rgba(0,0,0,0.04)', width: '40%', marginBottom: 6 }} />
            <div style={{ height: 10, borderRadius: 5, background: 'rgba(0,0,0,0.04)', width: '65%' }} />
          </div>
        </div>
      </div>
    );
  }

  const activeWave = waves.find(w => w.status === 'Released') ?? waves[0];
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;

  const ctx: StepContext = {
    processCount: processes.length,
    activeWaveName: activeWave?.name ?? 'Wave 1',
    completedTasks,
    totalTasks: tasks.length,
  };

  const demoDone = tasks.length > 0 && completedTasks === tasks.length;
  const config = demoMode
    ? {
        icon: demoDone ? '✅' : '▶',
        title: demoDone ? 'Review completed implementation' : 'Run wave playback',
        body: demoDone
          ? `All ${tasks.length} tasks are done. No ERP writes were executed during this run.`
          : 'Use the Waves page to release one wave every 2 seconds.',
        buttonLabel: demoDone ? 'Go to Tasks →' : 'Go to Waves →',
        targetPage: demoDone ? 'tasks' as const : 'waves' as const,
      }
    : STEP_CONFIGS[state](ctx);

  const handleClick = () => {
    if (config.targetPage) {
      onNavigate(config.targetPage);
    } else if (project?.foSandboxUrl) {
      window.open(project.foSandboxUrl, '_blank', 'noopener');
    }
  };

  return (
    <div
      data-testid="next-step-card"
      data-state={state}
      className="glass"
      style={{
        borderRadius: 14,
        padding: '20px 24px',
        animation: 'slide-up 0.3s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Blue gradient icon circle */}
        <div
          data-testid="next-step-icon"
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #007AFF, #5856D6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Middle: label + title + body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const,
              letterSpacing: '0.06em', color: '#007AFF',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              • NEXT STEP
            </span>
            <span style={{
              fontSize: 15, fontWeight: 700, color: '#1c1c1e',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              {config.title}
            </span>
          </div>
          <div style={{
            fontSize: 13, color: 'rgba(60,60,67,0.6)', lineHeight: 1.5, marginTop: 4,
          }}>
            {config.body}
          </div>
        </div>

        {/* CTA button */}
        <button
          data-testid="next-step-cta"
          onClick={handleClick}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            background: '#007AFF',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {config.buttonLabel}
        </button>
      </div>
    </div>
  );
}
