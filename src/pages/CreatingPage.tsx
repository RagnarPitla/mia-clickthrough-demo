import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { KzkPlaybook } from '../types/domain';
import { Kzk_projectsService } from '../generated/services/Kzk_projectsService';
import { Kzk_wavesService } from '../generated/services/Kzk_wavesService';
import { Kzk_tasksService } from '../generated/services/Kzk_tasksService';
import { uploadProjectDocuments } from '../services/dataverse';
import { popFiles } from '../utils/fileStash';
import { isMiaDemoPlaybook, MIA_COWORK_DECISION_KEY, MIA_DEMO_PLAYBACK_KEY, MIA_DEMO_PROJECT_ID } from '../services/miaDemoData';
import { isDemoModeCached } from '../services/demoBootstrap';
import { isScm2DemoPlaybookId } from '../services/demoPlaybooks';

interface LogEntry {
  sequence: number;
  level: string;
  message: string;
  toolName?: string;
  timestamp: string;
}

interface CreatingState {
  projectName: string;
  customerName: string;
  description: string;
  devopsUrl?: string;
  uploadedFiles: string[];
  playbook: KzkPlaybook;
}

type Phase = 'writing' | 'initializing' | 'done' | 'error';

/* ── Step milestone definitions ── */
interface Step { label: string; key: string; }
const STEPS: Step[] = [
  { label: 'Creating project', key: 'project' },
  { label: 'Preparing workspace', key: 'workspace' },
  { label: 'AI Worker initializing', key: 'worker' },
  { label: 'Project ready', key: 'ready' },
];

const DEMO_STEPS: Step[] = [
  { label: 'Reading documents', key: 'documents' },
  { label: 'Mapping scope', key: 'scope' },
  { label: 'Creating waves', key: 'waves' },
  { label: 'Mia ready', key: 'ready' },
];

interface CreatingPageProps {
  creatingState?: CreatingState;
  onComplete?: () => void;
}

export default function CreatingPage({ creatingState, onComplete }: CreatingPageProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const state = creatingState ?? (location.state as CreatingState | null);

  const [phase, setPhase] = useState<Phase>('writing');
  const [initTaskId, setInitTaskId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMiaDemo = isMiaDemoPlaybook(state?.playbook);
  const isScm2Demo = isScm2DemoPlaybookId(state?.playbook?.id);
  const isDemoMode = isMiaDemo || isDemoModeCached();
  const steps = isDemoMode ? DEMO_STEPS : STEPS;

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Step 1: Create project + trigger task on mount
  useEffect(() => {
    if (!state) return;
    let cancelled = false;

    async function createAndTrigger() {
      try {
        if (isDemoMode) {
          const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
          try {
            localStorage.setItem('kazuki-project', MIA_DEMO_PROJECT_ID);
            localStorage.removeItem('kazuki-wave');
            localStorage.removeItem(MIA_DEMO_PLAYBACK_KEY);
            localStorage.removeItem(MIA_COWORK_DECISION_KEY);
          } catch {}

          const playbookLabel = state!.playbook?.displayName || state!.playbook?.name || 'playbook';
          const customerLabel = state!.customerName || 'the customer';
          const docsLabel = state!.uploadedFiles?.length
            ? `${state!.uploadedFiles.length} documents`
            : 'customer documents';

          if (isScm2Demo) {
            addLog('info', 'Reading ATL warehouse footprint and policy brief');
          } else if (isMiaDemo) {
            addLog('info', 'Reading uploaded Zava customer documents');
          } else {
            addLog('info', `Reading uploaded ${customerLabel} documents`);
          }
          await wait(650);
          if (cancelled) return;
          setActiveStep(1);
          if (isScm2Demo) {
            addLog('done', 'Documents staged: ATL footprint, policy brief, site master, WHSAdmin evidence, and cutover plan');
          } else if (isMiaDemo) {
            addLog('done', 'Documents staged: SOW, business goals, legal entities, COA, customers, products, and inventory');
          } else {
            addLog('done', `Documents staged: ${docsLabel} ready for ${playbookLabel}`);
          }

          await wait(650);
          if (cancelled) return;
          setActiveStep(2);
          if (isScm2Demo) {
            addLog('info', 'Mapping warehouse footprint to W01-W03 dependency layers');
            addLog('done', 'Mia selected 5 SCM steps: warehouse, zones, 480 locations, profiles, and dock defaults');
          } else if (isMiaDemo) {
            addLog('info', 'Mapping documents to Success by Design processes');
            addLog('done', 'Mia selected 4 E2Es: Record to Report, Order to Cash, Inventory to Deliver, Design to Retire');
          } else {
            addLog('info', `Mapping documents to ${playbookLabel} scope`);
            addLog('done', `Scope locked in for ${state!.projectName}`);
          }

          await wait(650);
          if (cancelled) return;
          addLog('info', 'Creating waves and tasks');
          addLog(
            'done',
            isScm2Demo
              ? 'Workspace ready: 3 waves and 7 SCM tasks prepared for DC-Atlanta playback'
              : 'Workspace ready: 11 waves and 27 tasks prepared for click-through playback',
          );

          await wait(650);
          if (cancelled) return;
          setActiveStep(DEMO_STEPS.length - 1);
          setPhase('done');
          return;
        }

        addLog('info', `Creating project: ${state!.projectName}`);

        const playbookGuid = state!.playbook.id;
        const isRealPlaybook = playbookGuid && playbookGuid !== '__blank__';
        const projPayload: Record<string, unknown> = {
          kzk_name: state!.projectName,
          kzk_customername: state!.customerName,
          kzk_scopesummary: state!.description || undefined,
          kzk_devopsurl: state!.devopsUrl || undefined,
          kzk_autopilot: false,
          kzk_status: 950000010,
        };
        if (isRealPlaybook) {
          projPayload['kzk_PlaybookId@odata.bind'] = `/kzk_playbooks(${playbookGuid})`;
        }
        const projResult = await Kzk_projectsService.create(projPayload as any);
        const pId = projResult.data?.kzk_projectid;
        if (!pId || cancelled) return;
        // Pre-select this project in the dashboard
        try { localStorage.setItem('kazuki-project', pId); } catch {}
        setActiveStep(1);
        addLog('done', `Project created: ${pId.slice(0, 8)}…`);

        // Upload documents as project annotations
        const pendingFiles = popFiles();
        if (pendingFiles.length > 0) {
          addLog('info', `Uploading ${pendingFiles.length} documents to project…`);
          const uploaded = await uploadProjectDocuments(pId, pendingFiles);
          addLog('done', `${uploaded}/${pendingFiles.length} documents uploaded as project annotations`);
        }

        const waveResult = await Kzk_wavesService.create({
          kzk_name: 'Bootstrap',
          kzk_status: 950000020,
          'kzk_ProjectId@odata.bind': `/kzk_projects(${pId})`,
        } as any);
        const wId = waveResult.data?.kzk_waveid;
        if (!wId || cancelled) return;

        const taskResult = await Kzk_tasksService.create({
          kzk_title: 'Initialize project from playbook',
          kzk_status: 950000020,
          kzk_type: 950000010,
          kzk_assigneekind: 950000010,
          kzk_requiredskills: 'project-initialize',
          'kzk_WaveId@odata.bind': `/kzk_waves(${wId})`,
          'kzk_ProjectId@odata.bind': `/kzk_projects(${pId})`,
        } as any);
        const tId = taskResult.data?.kzk_taskid;
        if (!tId || cancelled) return;
        setInitTaskId(tId);
        setActiveStep(2);

        addLog('info', 'Trigger task submitted — Worker will pick it up shortly');
        setPhase('initializing');
      } catch (err: any) {
        if (!cancelled) {
          setPhase('error');
          setErrorMsg(err?.message ?? 'Failed to create project');
        }
      }
    }

    createAndTrigger();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 2: Poll task log + task status
  useEffect(() => {
    if (phase !== 'initializing' || !initTaskId) return;

    const poll = async () => {
      try {
        const taskResult = await Kzk_tasksService.get(initTaskId, {
          select: ['kzk_status', 'kzk_output', 'kzk_checkpoint'],
        });
        const task = taskResult.data;
        if (!task) return;
        const status = task.kzk_status as unknown as number;

        const checkpoint = (task as any).kzk_checkpoint as string | undefined;
        if (checkpoint && !logs.some(l => l.message === checkpoint)) {
          addLog('info', checkpoint);
        }

        if (status === 950000050) {
          addLog('done', 'Project initialization complete');
          setActiveStep(3);
          setPhase('done');
        } else if (status === 950000060) {
          setPhase('error');
          setErrorMsg((task as any).kzk_output ?? 'Worker failed');
        }
      } catch { /* network blip, keep polling */ }
    };

    pollRef.current = setInterval(poll, 3000);
    poll();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [phase, initTaskId]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  function addLog(level: string, message: string) {
    setLogs(prev => [...prev, {
      sequence: prev.length + 1,
      level,
      message,
      timestamp: new Date().toLocaleTimeString(),
    }]);
  }

  /* ── No state fallback ── */
  if (!state) {
    return (
      <div data-testid="creating-page" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(60,60,67,0.72)' }}>No project data. <a href="#/" style={{ color: '#007AFF' }}>Start over</a></p>
      </div>
    );
  }

  const isDone = phase === 'done';
  const isError = phase === 'error';
  const accentColor = isDone ? '#30D158' : isError ? '#FF3B30' : '#007AFF';

  return (
    <div data-testid="creating-page" style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start', padding: '48px 20px 40px',
      animation: 'fade-in 0.5s ease-out', gap: 0,
    }}>

      {/* ═══ HERO: Animated indicator ═══ */}
      <div style={{
        position: 'relative', width: 80, height: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        {/* Glow ring behind */}
        <div style={{
          position: 'absolute', inset: -8, borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
          animation: isDone || isError ? 'none' : 'pulse 2s ease-in-out infinite',
        }} />

        {/* Outer ring */}
        {!isDone && !isError && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '2.5px solid rgba(0,122,255,0.12)',
            borderTopColor: '#007AFF', borderRightColor: '#AF52DE',
            animation: 'spin 1.2s linear infinite',
          }} />
        )}

        {/* Inner circle */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: isDone
            ? 'linear-gradient(135deg, #30D158, #34C759)'
            : isError
            ? 'linear-gradient(135deg, #FF3B30, #FF6961)'
            : 'linear-gradient(135deg, #007AFF, #5856D6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 20px ${accentColor}30`,
          transition: 'background 0.4s ease, box-shadow 0.4s ease',
        }}>
          {isDone ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'fade-in 0.3s ease-out' }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : isError ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <span style={{
              color: '#fff', fontSize: 22, fontWeight: 800,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>{isDemoMode ? 'M' : 'K'}</span>
          )}
        </div>
      </div>

      {/* ═══ TITLE ═══ */}
      <h2 style={{
        fontSize: 24, fontWeight: 800, color: '#1c1c1e', margin: '0 0 4px',
        fontFamily: "'Plus Jakarta Sans', sans-serif", textAlign: 'center',
        letterSpacing: '-0.02em',
      }}>
        {isScm2Demo
          ? isDone ? 'SCM workspace ready!' : isError ? 'Setup Failed' : 'Mia is reading SCM documents'
          : isMiaDemo
          ? isDone ? 'Mia workspace ready!' : isError ? 'Setup Failed' : 'Mia is reading customer documents'
          : isDemoMode
          ? isDone ? `${state.projectName} ready!` : isError ? 'Setup Failed' : `Setting up ${state.projectName}`
          : isDone ? 'Project Ready!' : isError ? 'Initialization Failed' : `Setting up ${state.projectName}`}
      </h2>
      <p style={{
        fontSize: 14, color: 'rgba(60,60,67,0.55)', margin: '0 0 28px',
        fontFamily: "'Plus Jakarta Sans', sans-serif", textAlign: 'center',
      }}>
        {isScm2Demo
          ? isDone ? 'Your DC-Atlanta warehouse workspace is ready'
            : isError ? 'Something went wrong during setup'
            : 'Building the DC-Atlanta SCM workspace from warehouse footprint and policy documents'
          : isMiaDemo
          ? isDone ? 'Your FastTrack workspace is ready'
            : isError ? 'Something went wrong during setup'
            : 'Building your Success by Design workspace from the uploaded customer documents'
          : isDemoMode
          ? isDone ? `${state.playbook.displayName} workspace is ready`
            : isError ? 'Something went wrong during setup'
            : `Reading ${state.customerName || 'customer'} documents and mapping ${state.playbook.displayName} scope`
          : isDone ? 'Your project has been initialized successfully'
            : isError ? 'Something went wrong during setup'
            : `Using ${state.playbook.displayName} playbook`}
      </p>

      {/* ═══ STEP INDICATORS ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        marginBottom: 28, maxWidth: 560, width: '100%',
        justifyContent: 'center',
      }}>
        {steps.map((step, i) => {
          const done = i < activeStep || (i === activeStep && isDone);
          const active = i === activeStep && !isDone && !isError;

          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'center' }}>
              {/* Step dot + label */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 80 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  background: done ? '#30D158' : active ? '#007AFF' : 'rgba(0,0,0,0.06)',
                  color: done || active ? '#fff' : 'rgba(60,60,67,0.35)',
                  transition: 'all 0.3s ease',
                  boxShadow: active ? '0 2px 8px rgba(0,122,255,0.25)' : done ? '0 2px 6px rgba(48,209,88,0.20)' : 'none',
                  ...(active ? { animation: 'pulse 2s ease-in-out infinite' } : {}),
                }}>
                  {done ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600, textAlign: 'center',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: done ? '#30D158' : active ? '#007AFF' : 'rgba(60,60,67,0.35)',
                  letterSpacing: '-0.01em', lineHeight: 1.3,
                  transition: 'color 0.3s ease',
                }}>
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div style={{
                  width: 40, height: 2, margin: '0 4px',
                  marginBottom: 22,
                  background: done
                    ? 'linear-gradient(90deg, #30D158, #30D158)'
                    : active
                    ? 'linear-gradient(90deg, #007AFF, rgba(0,0,0,0.08))'
                    : 'rgba(0,0,0,0.08)',
                  borderRadius: 1,
                  transition: 'background 0.4s ease',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ LIVE LOG TERMINAL ═══ */}
      <div className="glass" style={{
        width: '100%', maxWidth: 580,
        borderRadius: 16, overflow: 'hidden',
        marginBottom: 20,
        border: `1px solid ${isDone ? 'rgba(48,209,88,0.20)' : isError ? 'rgba(255,59,48,0.20)' : 'rgba(0,122,255,0.15)'}`,
        transition: 'border-color 0.4s ease',
      }}>
        {/* Terminal header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'rgba(0,0,0,0.03)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: isError ? '#FF3B30' : '#FF5F56' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: isDone ? '#30D158' : '#27C93F' }} />
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase',
            color: 'rgba(60,60,67,0.40)',
          }}>
            Live Progress
          </span>
          <div style={{ width: 40 }} />
        </div>

        {/* Log content */}
        <div style={{
          padding: '14px 18px', maxHeight: 200, overflow: 'auto',
          background: 'rgba(248,248,250,0.5)',
        }}>
          {logs.length === 0 && (
            <div style={{
              fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
              color: 'rgba(60,60,67,0.35)', padding: '8px 0',
            }}>
              Waiting for events…
            </div>
          )}
          {logs.map((log, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, padding: '5px 0',
              fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
              animation: 'slide-up 0.3s ease-out',
              alignItems: 'flex-start',
            }}>
              <span style={{
                color: 'rgba(60,60,67,0.30)', whiteSpace: 'nowrap',
                fontSize: 10, minWidth: 58, paddingTop: 2,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {log.timestamp}
              </span>
              <span style={{
                width: 16, height: 16, borderRadius: '50%',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 800, flexShrink: 0,
                background: log.level === 'done' ? 'rgba(48,209,88,0.12)' : log.level === 'error' ? 'rgba(255,59,48,0.12)' : 'rgba(0,122,255,0.10)',
                color: log.level === 'done' ? '#30D158' : log.level === 'error' ? '#FF3B30' : '#007AFF',
              }}>
                {log.level === 'done' ? '✓' : log.level === 'error' ? '✗' : '▸'}
              </span>
              <span style={{
                color: log.level === 'done' ? '#248A3D' : log.level === 'error' ? '#D70015' : '#1c1c1e',
                lineHeight: 1.5, flex: 1,
                fontWeight: log.level === 'done' ? 600 : 400,
              }}>
                {log.message}
              </span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* ═══ ERROR DETAIL ═══ */}
      {errorMsg && (
        <div style={{
          maxWidth: 580, width: '100%', padding: '14px 18px',
          borderRadius: 12, marginBottom: 16,
          background: 'rgba(255,59,48,0.05)', border: '1px solid rgba(255,59,48,0.12)',
          fontSize: 12, color: '#D70015', fontFamily: "'JetBrains Mono', monospace",
          lineHeight: 1.6,
        }}>
          {errorMsg}
        </div>
      )}

      {/* ═══ PROJECT SUMMARY CARD ═══ */}
      <div className="glass" style={{
        maxWidth: 580, width: '100%', marginBottom: 20,
        borderRadius: 16, padding: '18px 22px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px',
      }}>
        {[
          { label: 'Project', value: state.projectName },
          { label: 'Customer', value: state.customerName },
          { label: 'Playbook', value: `📘 ${state.playbook.displayName}` },
        ].map(item => (
          <div key={item.label}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(60,60,67,0.40)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1c1c1e', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {item.value || '—'}
            </div>
          </div>
        ))}
      </div>

      {/* ═══ NOTIFICATION CARD ═══ */}
      {!isDone && (
        <div style={{
          maxWidth: 480, width: '100%', marginBottom: 20,
          padding: '20px 24px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(0,122,255,0.04) 0%, rgba(175,82,222,0.04) 50%, rgba(48,209,88,0.03) 100%)',
          border: '1px solid rgba(0,122,255,0.10)',
          textAlign: 'center',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(0,122,255,0.10), rgba(175,82,222,0.10))',
            marginBottom: 12, fontSize: 20,
          }}>
            ✉️
          </div>
          <p style={{
            fontSize: 15, color: '#1c1c1e', margin: '0 0 6px', fontWeight: 700,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            You'll be notified when your project is ready
          </p>
          <p style={{
            fontSize: 13, color: 'rgba(60,60,67,0.55)', margin: 0, lineHeight: 1.6,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            {isMiaDemo
              ? 'Mia is preparing your workspace. No live ERP writes are running yet.'
              : 'The AI Worker is initializing your project in the background. You can safely close this page or go to the dashboard.'}
          </p>
        </div>
      )}

      {/* ═══ SUCCESS CELEBRATION ═══ */}
      {isDone && (
        <div style={{
          maxWidth: 480, width: '100%', marginBottom: 20,
          padding: '20px 24px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(48,209,88,0.06) 0%, rgba(52,199,89,0.04) 100%)',
          border: '1px solid rgba(48,209,88,0.15)',
          textAlign: 'center',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(48,209,88,0.12)', marginBottom: 12, fontSize: 20,
          }}>
            🎉
          </div>
          <p style={{
            fontSize: 15, color: '#1c1c1e', margin: '0 0 6px', fontWeight: 700,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            {isScm2Demo ? 'All set! Your SCM scenario is ready to go' : isMiaDemo ? 'All set! Your implementation is ready to go' : 'All set! Your project is ready to go'}
          </p>
          <p style={{
            fontSize: 13, color: 'rgba(60,60,67,0.55)', margin: 0, lineHeight: 1.6,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            {isScm2Demo
              ? 'Open the SCM scenario to review the W01-W03 task plan, make the warehouse decisions, and watch the Dataverse tracker complete.'
              : isMiaDemo
              ? 'Open the dashboard to review customer data, scope, and phases — then release waves to drive every task to completion.'
              : isDemoMode
              ? `Open the dashboard to walk through ${state.playbook.displayName} — then release waves to drive every task to completion.`
              : 'E2E processes, waves, and tasks have been created. Head to the dashboard to start working.'}
          </p>
        </div>
      )}

      {/* ═══ ACTION BUTTONS ═══ */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => onComplete ? onComplete() : navigate('/')}
          style={{
            padding: '12px 24px', borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.08)',
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(12px)',
            color: 'rgba(60,60,67,0.72)', fontSize: 14, fontWeight: 600,
            fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.85)';
            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.6)';
            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)';
          }}
        >
          ← Back to Playbooks
        </button>
        <button
          onClick={() => {
            if (onComplete) {
              onComplete();
              return;
            }
            if (isScm2Demo) {
              window.location.assign('/SCM?from=mia&task=warehouse&assigned=decision');
              return;
            }
            navigate('/dashboard');
          }}
          style={{
            padding: '12px 32px', borderRadius: 12, border: 'none',
            background: isDone
              ? 'linear-gradient(135deg, #30D158, #34C759)'
              : 'linear-gradient(135deg, #007AFF, #5856D6)',
            color: '#fff', fontSize: 14, fontWeight: 700,
            fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer',
            boxShadow: isDone
              ? '0 4px 16px rgba(48,209,88,0.30)'
              : '0 4px 16px rgba(0,122,255,0.25)',
            transition: 'all 0.2s ease, transform 0.1s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = isDone
              ? '0 6px 24px rgba(48,209,88,0.40)'
              : '0 6px 24px rgba(0,122,255,0.35)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isDone
              ? '0 4px 16px rgba(48,209,88,0.30)'
              : '0 4px 16px rgba(0,122,255,0.25)';
          }}
        >
          {isScm2Demo ? 'Open SCM Scenario →' : isMiaDemo ? 'Open Dashboard →' : isDone ? '✓ Open Dashboard →' : 'Go to Dashboard →'}
        </button>
      </div>
    </div>
  );
}
