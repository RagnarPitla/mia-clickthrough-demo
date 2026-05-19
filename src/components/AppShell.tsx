import { useState, useCallback, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import '../theme-light.css';
import { useProjects } from '../hooks/useProjects';
import WelcomePage from '../pages/WelcomePage';
import SetupPage from '../pages/SetupPage';
import CreatingPage from '../pages/CreatingPage';
import DemoTour from './DemoTour';
import type { KzkPlaybook } from '../types/domain';

export interface AppShellOutletContext {
  registerRefresh: (fn: (() => void) | null) => void;
}

interface NewProjectFlow {
  step: 'welcome' | 'setup' | 'creating';
  playbook?: KzkPlaybook;
  formData?: {
    projectName: string;
    customerName: string;
    description: string;
    devopsUrl: string;
    uploadedFiles: string[];
    playbook: KzkPlaybook;
  };
}

export default function AppShell() {
  const { projects, activeProjectId } = useProjects();
  const activeProject = projects.find(p => p.id === activeProjectId) ?? null;
  const [refreshFn, setRefreshFn] = useState<(() => void) | null>(null);
  const [flow, setFlow] = useState<NewProjectFlow | null>(null);
  const registerRefresh = useCallback((fn: (() => void) | null) => {
    setRefreshFn(() => fn);
  }, []);
  const outletContext = useMemo(
    () => ({ registerRefresh } satisfies AppShellOutletContext),
    [registerRefresh],
  );

  return (
    <div
      data-testid="app-shell"
      data-theme="light"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-base)',
      }}
    >
      <DemoTour />

      {/* Background mesh */}
      <div className="bg-mesh" />

      {/* Top nav bar */}
      <header
        data-testid="shell-header"
        className="glass"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          margin: '12px 12px 0',
          borderRadius: 'var(--radius-lg)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Left: Logo */}
        <div
          data-testid="shell-logo"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span
            aria-label="Microsoft"
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 5,
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 21 21" aria-hidden="true">
              <rect width="10" height="10" fill="#f25022"/>
              <rect x="11" width="10" height="10" fill="#7fba00"/>
              <rect y="11" width="10" height="10" fill="#00a4ef"/>
              <rect x="11" y="11" width="10" height="10" fill="#ffb900"/>
            </svg>
          </span>
          <span
            data-testid="shell-project-name"
            style={{
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: 'var(--text-primary)',
            }}
          >
            Mia Console
          </span>
        </div>

        {/* Center: spacer */}
        <div style={{ flex: 1 }} />

        {/* Right: Playbook badge + User avatar */}
        <div
          data-testid="shell-avatar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {/* Playbook badge */}
          {activeProject && (
            <span
              data-testid="shell-playbook-badge"
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 8,
                background: 'rgba(0,122,255,0.06)',
                border: '1px solid rgba(0,122,255,0.10)',
                color: '#007AFF',
                whiteSpace: 'nowrap',
              }}
            >
              📘 Success by Design
            </span>
          )}

          {/* + New Project button */}
          <button
            data-testid="shell-new-project"
            onClick={() => setFlow({ step: 'welcome' })}
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: 8,
              background: '#007AFF',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              whiteSpace: 'nowrap',
            }}
          >
            + New
          </button>

          {/* Refresh button (registered by dashboard) */}
          {refreshFn && (
            <button
              data-testid="shell-refresh"
              onClick={refreshFn}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.06)',
                cursor: 'pointer',
                fontSize: 14,
                color: 'rgba(60,60,67,0.72)',
                transition: 'background 0.15s',
              }}
              title="Refresh"
            >
              🔄
            </button>
          )}

          {/* User avatar */}
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'var(--accent-light)',
              border: '1px solid var(--accent-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--accent)',
            }}
          >
            U
          </div>
        </div>
      </header>

      {/* Page content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '12px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {flow?.step === 'welcome' && (
          <WelcomePage
            onClose={() => setFlow(null)}
            onSelectPlaybook={(pb) => setFlow({ step: 'setup', playbook: pb })}
          />
        )}
        {flow?.step === 'setup' && flow.playbook && (
          <SetupPage
            playbook={flow.playbook}
            onBack={() => setFlow({ step: 'welcome' })}
            onSubmit={(formData) => setFlow({ step: 'creating', playbook: flow.playbook, formData })}
          />
        )}
        {flow?.step === 'creating' && flow.formData && (
          <CreatingPage
            creatingState={flow.formData}
            onComplete={() => {
              setFlow(null);
              window.location.hash = '#/dashboard';
              window.location.reload();
            }}
          />
        )}
        {!flow && <Outlet context={outletContext} />}
      </main>

    </div>
  );
}
