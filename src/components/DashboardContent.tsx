import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import TaskGraph from './TaskGraph';
import TaskList from './TaskList';
import TaskDetailPanel from './TaskDetailPanel';
import TaskEditorPanel from './TaskEditorPanel';
import type { TaskFormData } from './TaskEditorPanel';
import WaveSelector from './WaveSelector';
import SettingsPage from './SettingsPage';
import ProjectHome from './ProjectHome';
import PhasesPage from './PhasesPage';
import BusinessProcessPage from './BusinessProcessPage';
import TeamPage from './TeamPage';
import WatchDogPage from './WatchDogPage';
import CustomerDataPage from './CustomerDataPage';
import SkillsPage from './SkillsPage';
import ProjectTasksPage from './ProjectTasksPage';
import DashboardShell from './DashboardShell';
import DashboardSidebar from './DashboardSidebar';
import { useProjects } from '../hooks/useProjects';
import { useWaves } from '../hooks/useWaves';
import { useTasks } from '../hooks/useTasks';
import { useProjectTasks } from '../hooks/useProjectTasks';
import { usePhases } from '../hooks/usePhases';
import { useE2EProcesses } from '../hooks/useE2EProcesses';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { useWatchdogSchedules } from '../hooks/useWatchdogSchedules';
import { useMiaDemoPlayback } from '../hooks/useMiaDemoPlayback';
import { deriveActivityFromTasks } from '../services/dashboardHelpers';
import {
  getMiaDemoActivity,
  getMiaDemoPhases,
  getMiaDemoTasks,
  getMiaDemoWaves,
  isMiaDemoProjectId,
  MIA_DEMO_CUSTOMER_DATA,
  MIA_DEMO_MEMBERS,
  MIA_DEMO_PROCESSES,
  MIA_DEMO_PROJECT,
  MIA_DEMO_WAVE_COUNT,
} from '../services/miaDemoData';
import {
  createWave, createTask, updateTask, createDependency,
  releaseWave, releaseAllDraftWaves, fetchSkills, completeHumanApprovalTask,
} from '../services/dataverse';
import type { Skill } from '../services/dataverse';
import type { NavPage } from '../types/domain';
import type { AppShellOutletContext } from './AppShell';

type ViewMode = 'graph' | 'list';

const WAVE_KEY = 'kazuki-wave';

function getStoredWaveId(): string | null {
  try { return localStorage.getItem(WAVE_KEY); } catch { return null; }
}

function storeWaveId(id: string) {
  try { localStorage.setItem(WAVE_KEY, id); } catch {}
}

export default function DashboardContent() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [navPage, setNavPage] = useState<NavPage>('home');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedWaveId, setSelectedWaveId] = useState<string | null>(() => getStoredWaveId());

  /* ── Wave filters ── */
  type WaveFilter = 'all' | 'Released' | 'Draft' | 'errors';
  const [waveStatusFilter, setWaveStatusFilter] = useState<WaveFilter>('all');
  const [wavePhaseFilter, setWavePhaseFilter] = useState<string>('all');

  /* ── Project data ── */
  const { projects, activeProjectId, selectProject } = useProjects();
  const isMiaDemoProject = isMiaDemoProjectId(activeProjectId);
  const dataProjectId = isMiaDemoProject ? null : activeProjectId;
  const demoPlayback = useMiaDemoPlayback(isMiaDemoProject);
  const activeProject = isMiaDemoProject ? MIA_DEMO_PROJECT : projects.find(p => p.id === activeProjectId) ?? null;

  /* ── Waves ── */
  const { waves: liveWaves, refreshWaves } = useWaves(dataProjectId);
  const waves = isMiaDemoProject ? getMiaDemoWaves(demoPlayback.released, demoPlayback.runningIndex) : liveWaves;

  // Auto-select first wave — runs exactly once when waves first populate
  const didAutoSelect = useRef(false);
  if (waves.length > 0 && !didAutoSelect.current) {
    didAutoSelect.current = true;
    const valid = selectedWaveId && waves.some(w => w.id === selectedWaveId);
    if (!valid) {
      // Schedule state update for next microtask to avoid setState-during-render
      const firstId = waves[0].id;
      queueMicrotask(() => {
        setSelectedWaveId(firstId);
        storeWaveId(firstId);
      });
    }
  }

  const selectWave = (id: string) => {
    setSelectedWaveId(id);
    storeWaveId(id);
    setSelectedTaskId(null);
  };

  /* ── Filtered waves for sidebar ── */
  const filteredWaves = waves.filter(w => {
    if (waveStatusFilter === 'Released' && w.status !== 'Released') return false;
    if (waveStatusFilter === 'Draft' && w.status !== 'Draft') return false;
    if (waveStatusFilter === 'errors' && w.errorCount === 0) return false;
    if (wavePhaseFilter !== 'all' && w.phaseId !== wavePhaseFilter) return false;
    return true;
  });

  // When project changes, reset everything
  const prevProjectRef = useRef(activeProjectId);
  if (activeProjectId !== prevProjectRef.current) {
    prevProjectRef.current = activeProjectId;
    didAutoSelect.current = false;
    // These will take effect on next render
    queueMicrotask(() => {
      setSelectedWaveId(null);
      setSelectedTaskId(null);
      try { localStorage.removeItem(WAVE_KEY); } catch {}
    });
  }

  /* ── Tasks ── */
  const { tasks: liveWaveTasks, loading: liveTasksLoading, refresh: refreshTasks } = useTasks(isMiaDemoProject ? null : selectedWaveId);
  const { tasks: liveProjectTasks, loading: liveProjectTasksLoading, refresh: refreshProjectTasks } = useProjectTasks(dataProjectId);
  const projectTasks = isMiaDemoProject ? getMiaDemoTasks(demoPlayback.released) : liveProjectTasks;
  const waveTasks = isMiaDemoProject
    ? projectTasks.filter(task => task.waveId === selectedWaveId)
    : liveWaveTasks;
  const tasksLoading = isMiaDemoProject ? false : liveTasksLoading;
  const projectTasksLoading = isMiaDemoProject ? false : liveProjectTasksLoading;
  const visibleTasks = navPage === 'tasks' ? projectTasks : waveTasks;
  const selectedTask = visibleTasks.find(t => t.id === selectedTaskId) ?? null;

  /* ── Other data ── */
  const { phases: livePhases, loading: livePhasesLoading } = usePhases(dataProjectId);
  const { processes: liveProcesses, loading: liveProcessesLoading } = useE2EProcesses(dataProjectId);
  const { members: liveMembers, loading: liveMembersLoading } = useProjectMembers(dataProjectId);
  const phases = isMiaDemoProject ? getMiaDemoPhases(demoPlayback.released) : livePhases;
  const processes = isMiaDemoProject ? MIA_DEMO_PROCESSES : liveProcesses;
  const members = isMiaDemoProject ? MIA_DEMO_MEMBERS : liveMembers;
  const phasesLoading = isMiaDemoProject ? false : livePhasesLoading;
  const processesLoading = isMiaDemoProject ? false : liveProcessesLoading;
  const membersLoading = isMiaDemoProject ? false : liveMembersLoading;
  const watchdog = useWatchdogSchedules(!isMiaDemoProject);
  const [localProcesses, setLocalProcesses] = useState(processes);
  useEffect(() => { setLocalProcesses(processes); }, [processes]);

  /* ── Register refresh with AppShell header ── */
  const outletContext = useOutletContext<AppShellOutletContext | null>();
  const refreshDemo = useCallback(() => {}, []);
  const refreshRef = useRef(refreshTasks);
  refreshRef.current = isMiaDemoProject ? refreshDemo : navPage === 'tasks' ? refreshProjectTasks : refreshTasks;
  useEffect(() => {
    outletContext?.registerRefresh(() => refreshRef.current());
    return () => outletContext?.registerRefresh(null);
  }, [outletContext]);

  /* ── Authoring state ── */
  const [editorMode, setEditorMode] = useState<'view' | 'create' | 'edit'>('view');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [releaseConfirm, setReleaseConfirm] = useState<string | null>(null);
  const [releaseAllConfirm, setReleaseAllConfirm] = useState(false);

  // Load skills once
  useEffect(() => {
    if (isMiaDemoProject) {
      setSkills([]);
      return;
    }
    fetchSkills().then(setSkills);
  }, [isMiaDemoProject]);

  // Is the wave locked (any task InProgress)?
  const activeWave = waves.find(w => w.id === selectedWaveId);
  const waveLocked = waveTasks.some(t => t.status === 'InProgress' || t.status === 'Completed' || t.status === 'WaitingOnChild');

  const handleCreateWave = useCallback(async (data: { name: string; phaseId: string; description: string }) => {
    if (!activeProjectId || isMiaDemoProject) return;
    const newId = await createWave({ name: data.name, projectId: activeProjectId, phaseId: data.phaseId || undefined, description: data.description });
    if (newId) { selectWave(newId); }
    refreshWaves();
  }, [activeProjectId, isMiaDemoProject, selectWave, refreshWaves]);

  const handleReleaseWave = useCallback(async (waveId: string) => {
    setReleaseConfirm(waveId);
  }, []);

  const confirmRelease = useCallback(async () => {
    if (!releaseConfirm || isMiaDemoProject) return;
    await releaseWave(releaseConfirm);
    setReleaseConfirm(null);
    refreshWaves();
  }, [isMiaDemoProject, releaseConfirm, refreshWaves]);

  const draftWaveCount = waves.filter(w => w.status === 'Draft' && w.taskCount > 0).length;

  const confirmReleaseAll = useCallback(async () => {
    if (!activeProjectId || isMiaDemoProject) return;
    await releaseAllDraftWaves(activeProjectId);
    setReleaseAllConfirm(false);
    refreshWaves();
  }, [activeProjectId, isMiaDemoProject, refreshWaves]);

  const handleSaveTask = useCallback(async (formData: TaskFormData) => {
    if (!selectedWaveId || !activeProjectId || isMiaDemoProject) return;
    const skillsJson = formData.skillName
      ? JSON.stringify([{ name: formData.skillName, version: formData.skillVersion || '1' }])
      : '[]';

    if (editorMode === 'create') {
      const taskId = await createTask({
        title: formData.title,
        description: formData.description,
        type: formData.type,
        assigneeKind: formData.assigneeKind,
        assigneeRole: formData.assigneeRole,
        requiredSkills: skillsJson,
        skillContext: formData.skillContext,
        waveId: selectedWaveId,
        projectId: activeProjectId,
        hasDependencies: formData.dependencyIds.length > 0,
      });
      // Create dependency records
      for (const predId of formData.dependencyIds) {
        await createDependency(taskId, predId);
      }
    } else if (editorMode === 'edit' && editingTask) {
      await updateTask(editingTask, {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        assigneeKind: formData.assigneeKind,
        assigneeRole: formData.assigneeRole,
        requiredSkills: skillsJson,
        skillContext: formData.skillContext,
        status: formData.dependencyIds.length > 0 ? 950000010 : 950000020, // Reset to Pending/Ready
      });
    }
    setEditorMode('view');
    setEditingTask(null);
    refreshTasks();
    refreshProjectTasks();
  }, [selectedWaveId, activeProjectId, isMiaDemoProject, editorMode, editingTask, refreshTasks, refreshProjectTasks]);

  const openCreateTask = () => { setEditorMode('create'); setSelectedTaskId(null); setEditingTask(null); };
  const openEditTask = (taskId: string) => { setEditorMode('edit'); setEditingTask(taskId); setSelectedTaskId(taskId); };
  const closeEditor = () => { setEditorMode('view'); setEditingTask(null); };

  const handleApproveGate = useCallback(async (taskId: string) => {
    if (!activeProjectId || isMiaDemoProject) return;
    const existing = visibleTasks.find(t => t.id === taskId);
    const isDaApprovalGate = existing
      && existing.assigneeKind === 'Role'
      && existing.assigneeRole === 'DA'
      && existing.type === 'Approval'
      && existing.status === 'Ready';
    if (!existing || !isDaApprovalGate) {
      console.warn('approve gate ignored: selected task is not a Ready DA approval gate', taskId);
      return;
    }

    await completeHumanApprovalTask(taskId, activeProjectId);
    refreshTasks();
    refreshProjectTasks();
  }, [activeProjectId, isMiaDemoProject, visibleTasks, refreshTasks, refreshProjectTasks]);

  const activityEntries = isMiaDemoProject
    ? getMiaDemoActivity(demoPlayback.released)
    : deriveActivityFromTasks(projectTasks.length ? projectTasks : waveTasks).reverse().slice(0, 8);
  const scopeBadge = processes.filter(p => p.isInScope).length || undefined;
  const showWaveSidebar = navPage === 'waves';
  const showEditor = !isMiaDemoProject && navPage === 'waves' && editorMode !== 'view';
  const showPanel = !showEditor && selectedTask && (navPage === 'waves' || navPage === 'tasks');

  const sidebar = (
    <DashboardSidebar
      activePage={navPage}
      onNavigate={setNavPage}
      scopeBadge={scopeBadge}
      projects={projects}
      activeProjectId={activeProjectId}
      onSelectProject={selectProject}
      onNewProject={() => navigate('/new')}
    />
  );

  return (
    <DashboardShell sidebar={sidebar}>
      {/*
        The auto-popping "F&O Configuration Complete" card was removed: the
        demo's real climax is the human-in-loop license-plate decision in
        Cowork (Dataverse audit + "Continue in Project Mia" return). A
        success card claiming "0 errors" on top of that pause undermines the
        human-step beat.
      */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: showWaveSidebar
            ? ((showPanel || showEditor) ? '220px 1fr 340px' : '220px 1fr')
            : ((showPanel || showEditor) ? '1fr 340px' : '1fr'),
          gap: 12,
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Wave sidebar (waves page only) */}
        {showWaveSidebar && (
          <aside className="glass" style={{ borderRadius: 14, padding: 12, overflow: 'auto' }}>
            <WaveSelector
              waves={filteredWaves}
              activeWaveId={selectedWaveId}
              onSelectWave={selectWave}
              phases={phases}
              onCreateWave={isMiaDemoProject ? undefined : handleCreateWave}
              onReleaseWave={
                isMiaDemoProject
                  ? (waveId: string) => {
                      const idx = waves.findIndex(w => w.id === waveId);
                      if (idx >= 0) demoPlayback.releaseWaveAt(idx);
                    }
                  : handleReleaseWave
              }
              onReleaseWavesInPhase={
                isMiaDemoProject
                  ? (waveIds: string[]) => {
                      const indexes = waveIds
                        .map(id => waves.findIndex(w => w.id === id))
                        .filter(i => i >= 0);
                      if (indexes.length > 0) demoPlayback.releaseWavesAt(indexes);
                    }
                  : undefined
              }
              onReleaseAllWaves={isMiaDemoProject ? undefined : () => setReleaseAllConfirm(true)}
              releaseAllCount={isMiaDemoProject ? 0 : draftWaveCount}
              onRunDemo={isMiaDemoProject ? demoPlayback.startPlayback : undefined}
              onResetDemo={isMiaDemoProject ? demoPlayback.resetPlayback : undefined}
              demoProgress={demoPlayback.progress}
              demoTotal={MIA_DEMO_WAVE_COUNT}
              demoRunning={demoPlayback.running}
              demoComplete={demoPlayback.complete}
              releaseOnCardClick={isMiaDemoProject}
              showAutopilotToggle={isMiaDemoProject}
            />
          </aside>
        )}

        {/* Main content */}
        <main style={{ borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          {navPage === 'home' && (
            <ProjectHome
              project={activeProject}
              phases={phases}
              waves={waves}
              tasks={projectTasks.length ? projectTasks : waveTasks}
              activityEntries={activityEntries}
              teamCount={members.length}
              processes={processes}
              processesLoading={processesLoading}
              onNavigate={setNavPage}
              demoMode={isMiaDemoProject}
            />
          )}

          {navPage === 'process' && (
            <BusinessProcessPage
              processes={localProcesses}
              phases={phases}
              loading={processesLoading}
              onProcessesChange={setLocalProcesses}
              readOnly={isMiaDemoProject}
            />
          )}

          {navPage === 'phases' && (
            <PhasesPage
              phases={phases}
              waves={waves}
              processes={processes}
              loading={phasesLoading}
              onPhaseClick={() => {}}
            />
          )}

          {navPage === 'waves' && (
            <>
              {/* ── Wave filters ── */}
              <div
                className="glass"
                data-testid="wave-filters"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  margin: '0 0 4px',
                  borderRadius: 12,
                  flexWrap: 'wrap',
                }}
              >
                {(['all', 'Released', 'Draft', 'errors'] as WaveFilter[]).map(f => {
                  const label = f === 'all' ? 'All' : f === 'errors' ? '⚠ Errors' : f;
                  const isActive = waveStatusFilter === f;
                  const errorCount = waves.filter(w => w.errorCount > 0).length;
                  const badge = f === 'errors' && errorCount > 0 ? ` (${errorCount})` : '';
                  return (
                    <button
                      key={f}
                      data-testid={`wave-filter-${f}`}
                      onClick={() => setWaveStatusFilter(f)}
                      style={{
                        padding: '4px 11px',
                        fontSize: 11,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: isActive ? 700 : 500,
                        background: isActive
                          ? f === 'errors' ? 'rgba(255,59,48,0.10)' : 'rgba(0,122,255,0.10)'
                          : 'transparent',
                        border: '1px solid rgba(0,0,0,0.06)',
                        borderRadius: 8,
                        color: isActive
                          ? f === 'errors' ? '#FF3B30' : '#007AFF'
                          : 'rgba(60,60,67,0.72)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {label}{badge}
                    </button>
                  );
                })}
                <span style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.08)', margin: '0 4px' }} />
                <select
                  data-testid="wave-phase-filter"
                  value={wavePhaseFilter}
                  onChange={e => setWavePhaseFilter(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 8,
                    background: wavePhaseFilter !== 'all' ? 'rgba(0,122,255,0.06)' : 'rgba(255,255,255,0.6)',
                    color: wavePhaseFilter !== 'all' ? '#007AFF' : 'rgba(60,60,67,0.72)',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="all">All Phases</option>
                  {phases.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 10, color: 'rgba(60,60,67,0.42)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {filteredWaves.length}/{waves.length} waves
                </span>
              </div>

              {/* ── View toggle toolbar ── */}
              <div
                className="glass"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px',
                  margin: '0 0 8px',
                  borderRadius: 12,
                }}
              >
                <button
                  data-testid="view-graph"
                  onClick={() => setViewMode('graph')}
                  style={{
                    padding: '4px 11px',
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
                    background: viewMode === 'graph' ? 'rgba(0,122,255,0.10)' : 'transparent',
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: 8,
                    color: viewMode === 'graph' ? '#007AFF' : 'rgba(60,60,67,0.72)',
                    cursor: 'pointer',
                  }}
                >
                  ◇ Graph
                </button>
                <button
                  data-testid="view-list"
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '4px 11px',
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
                    background: viewMode === 'list' ? 'rgba(0,122,255,0.10)' : 'transparent',
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: 8,
                    color: viewMode === 'list' ? '#007AFF' : 'rgba(60,60,67,0.72)',
                    cursor: 'pointer',
                  }}
                >
                  ≡ List
                </button>
                <span style={{ flex: 1 }} />
                {tasksLoading && (
                  <span style={{ fontSize: 11, color: '#007AFF', fontFamily: "'JetBrains Mono', monospace" }}>
                    ⟳ loading…
                  </span>
                )}
                <span style={{ fontSize: 11, color: 'rgba(60,60,67,0.42)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {waveTasks.length} tasks
                </span>
                {!isMiaDemoProject && !waveLocked && (
                  <button
                    data-testid="add-task-btn"
                    onClick={openCreateTask}
                    style={{
                      padding: '4px 12px', fontSize: 11, fontWeight: 600,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      background: '#007AFF', color: '#fff',
                      border: 'none', borderRadius: 8, cursor: 'pointer',
                    }}
                  >
                    + Task
                  </button>
                )}
              </div>
              <div
                style={{
                  flex: 1,
                  overflow: 'auto',
                  ...(viewMode === 'list' ? { borderRadius: 14 } : {}),
                }}
                className={viewMode === 'list' ? 'glass' : undefined}
              >
                {tasksLoading && waveTasks.length === 0 ? (
                  <div
                    data-testid="tasks-skeleton"
                    className="glass"
                    style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, borderRadius: 14 }}
                  >
                    <div style={{ fontSize: 13, color: '#007AFF', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                      Fetching tasks from Dataverse…
                    </div>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', opacity: 0.6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(0,0,0,0.08)' }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ height: 12, borderRadius: 6, background: 'rgba(0,0,0,0.04)', width: `${60 + i * 8}%` }} />
                          <div style={{ height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.04)', width: `${30 + i * 5}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !tasksLoading && waveTasks.length === 0 ? (
                  <div
                    data-testid="tasks-empty"
                    className="glass"
                    style={{
                      padding: 40, borderRadius: 14, textAlign: 'center',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 32 }}>📋</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1c1c1e' }}>
                      No tasks in this wave
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(60,60,67,0.6)', maxWidth: 280 }}>
                      Add tasks to define what Workers should do, then release the wave.
                    </div>
                    {!isMiaDemoProject && !waveLocked && (
                      <button
                        data-testid="empty-add-task-btn"
                        onClick={openCreateTask}
                        style={{
                          padding: '10px 24px', fontSize: 13, fontWeight: 700,
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          background: '#007AFF', color: '#fff',
                          border: 'none', borderRadius: 10, cursor: 'pointer', marginTop: 4,
                        }}
                      >
                        + Add your first task
                      </button>
                    )}
                  </div>
                ) : (
                  viewMode === 'graph'
                    ? <TaskGraph tasks={waveTasks} onTaskClick={setSelectedTaskId} />
                    : <TaskList tasks={waveTasks} onTaskClick={setSelectedTaskId} selectedTaskId={selectedTaskId} />
                )}
              </div>
            </>
          )}

          {navPage === 'tasks' && (
            <ProjectTasksPage
              waves={waves}
              tasks={projectTasks}
              loading={projectTasksLoading}
              selectedTaskId={selectedTaskId}
              onTaskClick={setSelectedTaskId}
            />
          )}

          {navPage === 'customerData' && (
            <CustomerDataPage
              projectId={activeProjectId}
              demoFiles={isMiaDemoProject ? MIA_DEMO_CUSTOMER_DATA : undefined}
            />
          )}

          {navPage === 'skills' && (
            <SkillsPage />
          )}

          {navPage === 'team' && (
            <TeamPage members={members} loading={membersLoading} />
          )}

          {navPage === 'watchdog' && (
            <WatchDogPage
              schedules={watchdog.schedules}
              activity={watchdog.activity}
              loading={watchdog.loading}
              error={watchdog.error}
              onCreateSchedule={watchdog.create}
              onUpdateSchedule={watchdog.update}
              onDeleteSchedule={watchdog.remove}
              onToggleSchedule={(id, enabled) => watchdog.update(id, { enabled })}
              onRefresh={watchdog.refresh}
            />
          )}

          {navPage === 'settings' && (
            <div className="glass" style={{ borderRadius: 14, overflow: 'auto' }}>
              <SettingsPage bgImage="" onBgImageChange={() => {}} />
            </div>
          )}
        </main>

        {showEditor && selectedWaveId && activeProjectId && (
          <div className="glass" style={{ borderRadius: 14, overflow: 'hidden' }}>
            <TaskEditorPanel
              task={editorMode === 'edit' ? selectedTask : null}
              waveId={selectedWaveId}
              projectId={activeProjectId}
              skills={skills}
              siblingTasks={waveTasks.filter(t => t.id !== editingTask).map(t => ({ id: t.id, name: t.name, status: t.status }))}
              onSave={handleSaveTask}
              onCancel={closeEditor}
              locked={waveLocked && selectedTask?.status !== 'Failed'}
            />
          </div>
        )}

        {showPanel && (
          <div className="glass" style={{ borderRadius: 14, overflow: 'hidden' }}>
            <TaskDetailPanel
              task={selectedTask}
              onClose={() => setSelectedTaskId(null)}
              onEdit={isMiaDemoProject ? undefined : (taskId) => openEditTask(taskId)}
              onRetry={isMiaDemoProject ? undefined : (taskId) => {
                // Retry as-is: reset status to Ready without editing
                updateTask(taskId, { status: 950000020 }).then(() => { refreshTasks(); refreshProjectTasks(); });
              }}
              onResubmit={isMiaDemoProject ? undefined : (taskId) => {
                const ts = new Date().toISOString().slice(11, 19);
                updateTask(taskId, {
                  status: 950000020,
                  output: '',
                  checkpoint: `[${ts}] **Resubmitted** — Agent=Kazuki Console; action=resubmit_hosted_agent; status=Ready; task requeued for Dispatcher/Worker`,
                }).then(() => { refreshTasks(); refreshProjectTasks(); });
              }}
              onRerun={isMiaDemoProject ? undefined : (taskId, feedback) => {
                const existing = visibleTasks.find(t => t.id === taskId);
                const prevContext = existing?.skillContext ?? '';
                const newContext = prevContext
                  ? `${prevContext}\n\n--- DA Feedback ---\n${feedback}`
                  : `--- DA Feedback ---\n${feedback}`;
                updateTask(taskId, {
                  status: 950000020,
                  skillContext: newContext,
                  output: '',
                  checkpoint: `[${new Date().toISOString().slice(11, 19)}] **Resubmitted** — Agent=Kazuki Console; action=resubmit_hosted_agent_with_feedback; status=Ready; task requeued for Dispatcher/Worker`,
                }).then(() => { refreshTasks(); refreshProjectTasks(); });
              }}
              onApproveGate={isMiaDemoProject ? undefined : handleApproveGate}
              onCancel={isMiaDemoProject ? undefined : (taskId) => {
                updateTask(taskId, { status: 950000070 }).then(() => { refreshTasks(); refreshProjectTasks(); });
              }}
            />
          </div>
        )}
      </div>

      {/* Release confirmation dialog */}
      {releaseConfirm && (
        <div
          data-testid="release-dialog-overlay"
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setReleaseConfirm(null)}
        >
          <div
            data-testid="release-dialog"
            className="glass"
            style={{
              padding: '24px 28px', borderRadius: 16, maxWidth: 400, width: '90%',
              background: 'rgba(255,255,255,0.98)', boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1c1c1e', margin: '0 0 8px' }}>
              🚀 Release Wave?
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(60,60,67,0.72)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Release <strong>{activeWave?.name}</strong> with {waveTasks.length} tasks?
              The Dispatcher will check for eligible Ready tasks within 60 seconds.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                data-testid="release-cancel"
                onClick={() => setReleaseConfirm(null)}
                style={{
                  padding: '8px 18px', fontSize: 13, borderRadius: 10,
                  background: 'transparent', border: '1px solid rgba(0,0,0,0.10)',
                  color: 'rgba(60,60,67,0.72)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                data-testid="release-confirm"
                onClick={confirmRelease}
                style={{
                  padding: '8px 18px', fontSize: 13, fontWeight: 700, borderRadius: 10,
                  background: '#007AFF', border: 'none', color: '#fff', cursor: 'pointer',
                }}
              >
                Release Wave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Release all confirmation dialog */}
      {releaseAllConfirm && (
        <div
          data-testid="release-all-dialog-overlay"
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setReleaseAllConfirm(false)}
        >
          <div
            data-testid="release-all-dialog"
            className="glass"
            style={{
              padding: '24px 28px', borderRadius: 16, maxWidth: 430, width: '90%',
              background: 'rgba(255,255,255,0.98)', boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1c1c1e', margin: '0 0 8px' }}>
              🚀 Release all draft waves?
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(60,60,67,0.72)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Release {draftWaveCount} draft waves for <strong>{activeProject?.name ?? 'this project'}</strong>?
              Dependencies still control task promotion, so downstream Worker tasks wait until predecessors complete.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                data-testid="release-all-cancel"
                onClick={() => setReleaseAllConfirm(false)}
                style={{
                  padding: '8px 18px', fontSize: 13, borderRadius: 10,
                  background: 'transparent', border: '1px solid rgba(0,0,0,0.10)',
                  color: 'rgba(60,60,67,0.72)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                data-testid="release-all-confirm"
                onClick={confirmReleaseAll}
                style={{
                  padding: '8px 18px', fontSize: 13, fontWeight: 700, borderRadius: 10,
                  background: '#007AFF', border: 'none', color: '#fff', cursor: 'pointer',
                }}
              >
                Release all waves
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
