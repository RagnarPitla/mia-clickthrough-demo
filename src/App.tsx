import { useState, useEffect, useRef } from 'react';
import './theme.css';
import './theme-light.css';
import TaskGraph from './components/TaskGraph';
import TaskList from './components/TaskList';
import TaskDetailPanel from './components/TaskDetailPanel';
import WaveSelector from './components/WaveSelector';
import SettingsPage from './components/SettingsPage';
import ProjectHome from './components/ProjectHome';
import PhasesPage from './components/PhasesPage';
import BusinessProcessPage from './components/BusinessProcessPage';
import TeamPage from './components/TeamPage';
import { useProjects } from './hooks/useProjects';
import { useWaves } from './hooks/useWaves';
import { useTasks } from './hooks/useTasks';
import { usePhases } from './hooks/usePhases';
import { useE2EProcesses } from './hooks/useE2EProcesses';
import { useProjectMembers } from './hooks/useProjectMembers';
import { usePerfLog } from './hooks/usePerfLog';
import { deriveActivityFromTasks } from './services/dashboardHelpers';
import type { NavPage } from './types/domain';

type ViewMode = 'graph' | 'list';

const NAV_PAGES: { id: NavPage; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'process', label: 'Process' },
  { id: 'phases', label: 'Phases' },
  { id: 'waves', label: 'Waves' },
  { id: 'team', label: 'Team' },
  { id: 'settings', label: 'Settings' },
];

const ZEN_KEY = 'kazuki-zen';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [navPage, setNavPage] = useState<NavPage>('home');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [zenMode, setZenMode] = useState(() => {
    try { return localStorage.getItem(ZEN_KEY) === 'true'; } catch { return false; }
  });
  const [showPerf, setShowPerf] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const perfLog = usePerfLog();

  // Live data from Dataverse
  const { projects, activeProjectId, selectProject } = useProjects();
  const activeProject = projects.find(p => p.id === activeProjectId) ?? null;
  const { waves } = useWaves(activeProjectId);
  const { phases, loading: phasesLoading } = usePhases(activeProjectId);
  const { processes, loading: processesLoading } = useE2EProcesses(activeProjectId);
  const { members, loading: membersLoading } = useProjectMembers(activeProjectId);
  const [localProcesses, setLocalProcesses] = useState(processes);
  const WAVE_KEY = 'kazuki-wave';
  const [selectedWaveId, setSelectedWaveId] = useState<string | null>(() => {
    try { return localStorage.getItem(WAVE_KEY); } catch { return null; }
  });

  // Reset wave selection when project changes
  const prevProjectRef = useRef(activeProjectId);
  useEffect(() => {
    if (activeProjectId !== prevProjectRef.current) {
      prevProjectRef.current = activeProjectId;
      setSelectedWaveId(null);
      setSelectedTaskId(null);
    }
  }, [activeProjectId]);

  // Auto-select first wave when waves load and none is selected
  useEffect(() => {
    if (waves.length > 0 && !selectedWaveId) {
      setSelectedWaveId(waves[0].id);
    }
  }, [waves, selectedWaveId]);

  useEffect(() => { setLocalProcesses(processes); }, [processes]);

  const selectWave = (id: string) => {
    setSelectedWaveId(id);
    try { localStorage.setItem(WAVE_KEY, id); } catch {}
  };

  const { tasks, loading: tasksLoading, refresh: refreshTasks } = useTasks(selectedWaveId);
  const allTasks = tasks;
  const selectedTask = tasks.find(t => t.id === selectedTaskId) ?? null;

  const activityEntries = deriveActivityFromTasks(tasks).reverse().slice(0, 8);

  const toggleZen = () => {
    const next = !zenMode;
    setZenMode(next);
    try { localStorage.setItem(ZEN_KEY, String(next)); } catch {}
  };

  const showSidebar = navPage === 'waves' && !zenMode;
  const showPanel = selectedTask && navPage === 'waves' && !zenMode;

  return (
    <div data-testid="app-root" data-theme="light" style={{ height: '100vh', display: 'grid', gridTemplateRows: 'auto 1fr', padding: 12, gap: 12, background: 'var(--bg-base)', color: 'var(--text-primary)', position: 'relative' }}>

      {/* Background mesh */}
      <div className="bg-mesh" />

      {/* Header */}
      <header data-testid="header" className="glass" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px 8px 18px', borderRadius: 18, zIndex: 10, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h1 style={{ fontSize: 15, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)', margin: 0 }}>KAZUKI://</h1>
          {/* Project picker */}
          <div style={{ position: 'relative' }}>
            <button
              data-testid="project-picker"
              onClick={() => setShowProjectPicker(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.04)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--completed)' }} />
              {activeProject?.customerName || activeProject?.name || 'Select Project'}
              <span style={{ fontSize: 10, opacity: 0.5 }}>▾</span>
            </button>
            {showProjectPicker && projects.length > 0 && (
              <div data-testid="project-dropdown" className="glass" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, minWidth: 220, borderRadius: 12, padding: 6, zIndex: 100, background: 'rgba(255,255,255,0.95)' }}>
                {projects.map(p => (
                  <button
                    key={p.id}
                    data-testid={`project-option-${p.id}`}
                    onClick={() => { selectProject(p.id); setShowProjectPicker(false); }}
                    style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, background: p.id === activeProjectId ? 'var(--accent-glow)' : 'transparent', border: 'none', color: p.id === activeProjectId ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: p.id === activeProjectId ? 600 : 400, display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    <span>{p.customerName || p.name}</span>
                    {p.customerName && <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{p.name}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <nav style={{ display: 'flex', gap: 2 }}>
            {NAV_PAGES.map(p => (
              <button
                key={p.id}
                data-testid={`nav-${p.id}`}
                onClick={() => setNavPage(p.id)}
                style={{ padding: '6px 14px', background: navPage === p.id ? 'var(--accent-glow)' : 'transparent', border: navPage === p.id ? '1px solid var(--accent-border)' : '1px solid transparent', borderRadius: 12, color: navPage === p.id ? 'var(--accent)' : 'var(--text-tertiary)', cursor: 'pointer', fontSize: 12.5, fontWeight: navPage === p.id ? 600 : 500, fontFamily: "'DM Sans', sans-serif" }}
              >
                {p.label}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            data-testid="perf-toggle"
            onClick={() => setShowPerf(p => !p)}
            title={showPerf ? 'Hide Perf' : 'Show Perf'}
            style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', background: showPerf ? 'var(--accent-glow)' : 'rgba(0,0,0,0.04)', border: `1px solid ${showPerf ? 'var(--accent-border)' : 'var(--border-glass)'}`, borderRadius: 8, color: showPerf ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer' }}
          >
            ⏱ Perf
          </button>
          <button
            data-testid="refresh-btn"
            onClick={() => {
              const inDemo = (() => {
                try { return localStorage.getItem('kazuki-demo-mode') === 'true'; } catch { return false; }
              })();
              if (inDemo) {
                try {
                  localStorage.removeItem('mia-playback-step');
                  localStorage.removeItem('mia-finance-scm-wave');
                  localStorage.removeItem('mia-scm-pending-intervention');
                  localStorage.removeItem('mia-license-plate-decision');
                } catch {}
                window.location.assign('/?demo=true');
                return;
              }
              refreshTasks();
            }}
            title="Reset demo"
            style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, background: tasksLoading ? 'var(--accent-glow)' : 'rgba(0,0,0,0.04)', border: `1px solid ${tasksLoading ? 'var(--accent-border)' : 'var(--border-glass)'}`, color: tasksLoading ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', animation: tasksLoading ? 'spin 0.8s linear infinite' : 'none', transition: 'background 0.2s' }}
          >
            ↻
          </button>
          <button
            data-testid="zen-toggle"
            onClick={toggleZen}
            title={zenMode ? 'Exit Zen' : 'Zen Mode'}
            style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', background: zenMode ? 'var(--accent-glow)' : 'rgba(0,0,0,0.04)', border: `1px solid ${zenMode ? 'var(--accent-border)' : 'var(--border-glass)'}`, borderRadius: 8, color: zenMode ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer' }}
          >
            {zenMode ? '◉ Zen' : '○ Zen'}
          </button>
        </div>
      </header>

      {/* Perf overlay */}
      {showPerf && (
        <div data-testid="perf-overlay" className="glass" style={{ position: 'fixed', top: 60, right: 20, width: 280, maxHeight: 340, overflow: 'auto', zIndex: 100, borderRadius: 14, padding: '10px 14px', fontSize: 11, fontFamily: 'monospace', background: 'rgba(255,255,255,0.95)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 12 }}>⏱ Perf Timings</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>{perfLog.length} entries</span>
          </div>
          {perfLog.length === 0 ? (
            <div style={{ color: 'var(--text-tertiary)', padding: '8px 0' }}>No data yet — switch waves to see timings</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {perfLog.map((e, i) => {
                const isTotal = e.label.startsWith('⏱');
                const color = e.durationMs > 3000 ? 'var(--failed)' : e.durationMs > 1000 ? 'var(--inprogress)' : 'var(--completed)';
                const ago = Math.round((Date.now() - e.timestamp) / 1000);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isTotal ? '5px 0' : '3px 0', borderBottom: isTotal ? '2px solid var(--accent-border)' : '1px solid var(--border-glass)' }}>
                    <span style={{ color: isTotal ? '#1c1c1e' : 'var(--text-secondary)', fontWeight: isTotal ? 700 : 400, fontSize: isTotal ? 12 : 11 }}>{e.label}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color, fontWeight: 700, fontSize: isTotal ? 13 : 11 }}>{e.durationMs}ms</span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 9 }}>{ago}s ago</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: showSidebar ? (showPanel ? '220px 1fr 320px' : '220px 1fr') : (showPanel ? '1fr 320px' : '1fr'), gap: 12, overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* Sidebar (waves page only) */}
        {showSidebar && (
          <aside className="glass" style={{ borderRadius: 18, padding: 12, overflow: 'auto' }}>
            <WaveSelector waves={waves} activeWaveId={selectedWaveId} onSelectWave={selectWave} />
          </aside>
        )}

        {/* Main content */}
        <main style={{ borderRadius: 18, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          {/* HOME */}
          {navPage === 'home' && (
            <ProjectHome
              project={activeProject}
              phases={phases}
              waves={waves}
              tasks={allTasks}
              activityEntries={activityEntries}
              teamCount={members.length}
              processes={processes}
              processesLoading={processesLoading}
              onNavigate={setNavPage}
            />
          )}

          {/* PROCESS */}
          {navPage === 'process' && (
            <BusinessProcessPage
              processes={localProcesses}
              phases={phases}
              loading={processesLoading}
              onProcessesChange={setLocalProcesses}
            />
          )}

          {/* PHASES */}
          {navPage === 'phases' && (
            <PhasesPage
              phases={phases}
              waves={waves}
              processes={processes}
              loading={phasesLoading}
              onPhaseClick={(phaseId) => { void phaseId; }}
            />
          )}

          {/* WAVES */}
          {navPage === 'waves' && (
            <>
              {!zenMode && (
                <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', margin: '8px 8px 0', borderRadius: 12 }}>
                  <button data-testid="view-graph" onClick={() => setViewMode('graph')} style={{ padding: '4px 11px', fontSize: 11, fontFamily: 'monospace', background: viewMode === 'graph' ? 'var(--accent-glow)' : 'transparent', border: '1px solid var(--border-glass)', borderRadius: 8, color: viewMode === 'graph' ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer' }}>◇ Graph</button>
                  <button data-testid="view-list" onClick={() => setViewMode('list')} style={{ padding: '4px 11px', fontSize: 11, fontFamily: 'monospace', background: viewMode === 'list' ? 'var(--accent-glow)' : 'transparent', border: '1px solid var(--border-glass)', borderRadius: 8, color: viewMode === 'list' ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer' }}>≡ List</button>
                  <span style={{ flex: 1 }} />
                  {tasksLoading && <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'monospace', animation: 'pulse 1.2s ease-in-out infinite' }}>⟳ loading…</span>}
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{tasks.length} tasks</span>
                </div>
              )}
              <div style={{ flex: 1, overflow: 'auto', ...(viewMode === 'list' ? { margin: '8px 8px 8px', borderRadius: 14 } : {}) }} className={viewMode === 'list' ? 'glass' : undefined}>
                {tasksLoading && tasks.length === 0 ? (
                  <div data-testid="tasks-skeleton" className={viewMode === 'graph' ? 'glass' : undefined} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, ...(viewMode === 'graph' ? { margin: 8, borderRadius: 14 } : {}) }}>
                    <div style={{ fontSize: 13, color: 'var(--accent)', fontFamily: 'monospace', fontWeight: 600, animation: 'pulse 1.2s ease-in-out infinite' }}>
                      Fetching tasks from Dataverse…
                    </div>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', animation: `shimmer 1.8s ease-in-out infinite`, animationDelay: `${i * 0.15}s`, opacity: 0.6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--pending)' }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ height: 12, borderRadius: 6, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', width: `${60 + i * 8}%` }} />
                          <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', width: `${30 + i * 5}%` }} />
                        </div>
                        <div style={{ height: 18, width: 60, borderRadius: 6, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  viewMode === 'graph'
                    ? <TaskGraph tasks={tasks} onTaskClick={setSelectedTaskId} />
                    : <TaskList tasks={tasks} onTaskClick={setSelectedTaskId} selectedTaskId={selectedTaskId} />
                )}
              </div>
            </>
          )}

          {/* TEAM */}
          {navPage === 'team' && (
            <TeamPage members={members} loading={membersLoading} />
          )}

          {/* SETTINGS */}
          {navPage === 'settings' && (
            <div className="glass" style={{ borderRadius: 18, overflow: 'auto' }}>
              <SettingsPage bgImage="" onBgImageChange={() => {}} />
            </div>
          )}
        </main>

        {/* Detail Panel (waves page only) */}
        {showPanel && (
          <div className="glass" style={{ borderRadius: 18, overflow: 'hidden' }}>
            <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTaskId(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
