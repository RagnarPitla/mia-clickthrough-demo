import type { Project, Phase, Wave, Task, E2EProcess, NavPage, ActivityFeedEntry } from '../types/domain';
import PhaseStepperV2 from './PhaseStepperV2';
import NextStepCard from './NextStepCard';
import StatsRow from './StatsRow';
import ActivityTimeline from './ActivityTimeline';

interface ProjectHomeProps {
  project: Project | null;
  phases: Phase[];
  waves: Wave[];
  tasks: Task[];
  activityEntries: ActivityFeedEntry[];
  teamCount: number;
  processes: E2EProcess[];
  processesLoading?: boolean;
  onNavigate: (page: NavPage) => void;
  demoMode?: boolean;
}

const PHASE_DEFAULTS = [
  { name: 'Kick-off', desc: 'Alignment & setup' },
  { name: 'Discover', desc: 'Scope & reqs' },
  { name: 'Design', desc: 'CRP & fit-gap' },
  { name: 'Implement', desc: 'Config & data' },
  { name: 'Prepare', desc: 'Cutover' },
  { name: 'Operate', desc: 'Hypercare' },
];

export default function ProjectHome({
  project,
  phases,
  waves,
  tasks,
  activityEntries,
  teamCount,
  processes,
  processesLoading = false,
  onNavigate,
  demoMode = false,
}: ProjectHomeProps) {
  // Phase fallback: synthesize defaults when Dataverse has no phases yet
  const displayPhases = phases.length > 0
    ? [...phases].sort((a, b) => a.order - b.order)
    : PHASE_DEFAULTS.map((d, i) => ({
        id: `default-${i}`,
        name: d.name,
        description: d.desc,
        order: i + 1,
        status: 'NotStarted' as const,
        projectId: '',
      }));

  const activePhase = displayPhases.find(p => p.status === 'Active')
    ?? [...displayPhases].reverse().find(p => p.status === 'Completed')
    ?? displayPhases[0];

  // Extract unique modules from in-scope processes for tags
  const scopeModules = [...new Set(
    processes
      .filter(p => p.isInScope)
      .flatMap(p => p.modules.split(',').map(m => m.trim()).filter(Boolean))
  )].sort().slice(0, 4);

  return (
    <div data-testid="project-home" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 0 }}>

      {/* Hero card */}
      <div data-testid="hero-card" className="glass" style={{
        borderRadius: 18, padding: '24px 28px',
        display: 'grid', gridTemplateColumns: '1fr auto', gap: 20,
      }}>
        <div>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 800,
            margin: 0, marginBottom: 4, color: '#1c1c1e',
          }}>
            {project?.customerName || project?.name || 'New Project'}
          </h2>
          <div style={{ fontSize: 14, color: 'rgba(60,60,67,0.72)', marginBottom: 16 }}>
            {`D365 ${project?.products || 'Finance'} · ${scopeModules.length > 0 ? scopeModules.join(', ') : 'Fixed Assets'} · AI-assisted implementation`}
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {/* PLAYBOOK label */}
            <div>
              <div style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const,
                letterSpacing: '0.06em', color: 'rgba(60,60,67,0.42)',
                fontFamily: "'JetBrains Mono', monospace", marginBottom: 2,
              }}>PLAYBOOK</div>
              <div data-testid="hero-playbook-value" style={{ fontSize: 13, fontWeight: 600, color: '#007AFF' }}>Document-Driven</div>
            </div>
            {/* PHASE label */}
            <div>
              <div style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const,
                letterSpacing: '0.06em', color: 'rgba(60,60,67,0.42)',
                fontFamily: "'JetBrains Mono', monospace", marginBottom: 2,
              }}>PHASE</div>
              <div data-testid="hero-phase-value" style={{ fontSize: 13, fontWeight: 600, color: '#007AFF' }}>{activePhase?.name ?? (demoMode ? 'Operate' : 'Kick-off')}</div>
            </div>
            {/* AUTOPILOT label */}
            <div>
              <div style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const,
                letterSpacing: '0.06em', color: 'rgba(60,60,67,0.42)',
                fontFamily: "'JetBrains Mono', monospace", marginBottom: 2,
              }}>AUTOPILOT</div>
              <div data-testid="hero-autopilot-value" style={{
                fontSize: 13, fontWeight: 600,
                color: project?.autopilot ? '#AF52DE' : 'rgba(60,60,67,0.42)',
              }}>
                {project?.autopilot ? 'On' : 'Disabled'}
              </div>
            </div>
          </div>
        </div>
        {/* Right side: status + module tags */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          <span data-testid="hero-status" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: 'rgba(48,209,88,0.10)', color: '#30D158',
          }}>
            ● Active
          </span>
          {scopeModules.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {scopeModules.map((mod) => (
                <span key={mod} data-testid="hero-module-tag" style={{
                  padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 500,
                  border: '1px solid rgba(0,0,0,0.10)', color: 'rgba(60,60,67,0.72)',
                  background: 'transparent',
                }}>
                  {mod}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Next Step CTA */}
      <NextStepCard
        processes={processes}
        waves={waves}
        tasks={tasks}
        project={project}
        isLoading={processesLoading}
        onNavigate={onNavigate}
        demoMode={demoMode}
      />

      {/* Phase stepper */}
      <div className="glass" style={{ borderRadius: 14 }}>
        <PhaseStepperV2 phases={displayPhases} />
      </div>

      {/* Stats row */}
      <StatsRow waves={waves} tasks={tasks} teamCount={teamCount} />

      {/* Recent activity */}
      <div data-testid="recent-activity" className="glass" style={{ borderRadius: 14, padding: '16px 20px' }}>
        <div style={{
          fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const,
          letterSpacing: '0.06em', color: 'rgba(60,60,67,0.42)',
          fontFamily: "'JetBrains Mono', monospace", marginBottom: 10,
        }}>
          RECENT ACTIVITY
        </div>
        <ActivityTimeline entries={activityEntries.slice(0, 8)} />
      </div>
    </div>
  );
}
