import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { KzkPlaybook } from '../types/domain';
import { usePlaybooks } from '../hooks/usePlaybooks';
import { fetchProjects } from '../services/dataverse';
import PlaybookCard from '../components/PlaybookCard';
import { isDemoModeCached } from '../services/demoBootstrap';
import {
  MIA_ABC_PARTNER_PLAYBOOK,
  MIA_COWORK_DECISION_KEY,
  MIA_DEMO_PLAYBACK_KEY,
  MIA_DEMO_PROJECT_ID,
  MIA_DEMO_WAVE_COUNT,
  MIA_FINANCE_SCM_WAVE_KEY,
  MIA_SCM_PENDING_KEY,
  MIA_SBD_PLAYBOOK,
} from '../services/miaDemoData';
import { isDemoPlaybookId } from '../services/demoPlaybooks';

interface WelcomePageProps {
  onClose?: () => void;
  onSelectPlaybook?: (pb: KzkPlaybook) => void;
}

export default function WelcomePage({ onClose, onSelectPlaybook }: WelcomePageProps = {}) {
  const { playbooks, loading, error } = usePlaybooks();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasProjects, setHasProjects] = useState(false);
  const [demoView, setDemoView] = useState<'categories' | 'detail'>('categories');
  const navigate = useNavigate();
  const demoMode = isDemoModeCached();

  useEffect(() => {
    fetchProjects()
      .then(list => setHasProjects(list.length > 0))
      .catch(() => {});
  }, []);

  function openFullyReleasedFinanceDemo() {
    try {
      localStorage.setItem('kazuki-project', MIA_DEMO_PROJECT_ID);
      localStorage.removeItem('kazuki-wave');
      localStorage.removeItem(MIA_FINANCE_SCM_WAVE_KEY);
      localStorage.setItem(MIA_COWORK_DECISION_KEY, 'complete');
      localStorage.removeItem(MIA_SCM_PENDING_KEY);
      localStorage.setItem(
        MIA_DEMO_PLAYBACK_KEY,
        Array.from({ length: MIA_DEMO_WAVE_COUNT }, (_, index) => String(index)).join(','),
      );
    } catch {}
    navigate('/dashboard');
  }

  function openScmDemo() {
    try {
      localStorage.setItem('kazuki-project', MIA_DEMO_PROJECT_ID);
      localStorage.setItem('kazuki-wave', 'mia-wave-inventory-to-deliver');
      localStorage.removeItem(MIA_COWORK_DECISION_KEY);
      localStorage.setItem(MIA_SCM_PENDING_KEY, 'true');
      localStorage.setItem(
        MIA_DEMO_PLAYBACK_KEY,
        Array.from({ length: MIA_DEMO_WAVE_COUNT }, (_, index) => String(index)).join(','),
      );
    } catch {}
    window.location.assign('/SCM?from=mia&task=warehouse&assigned=decision#/dashboard');
  }

  function handleSelect(pb: KzkPlaybook) {
    // Click-through demo flow:
    //   stage 1 ("categories"): show Finance / SCM / Contact Center cards.
    //     Clicking any of them drills into stage 2 (the SBD/Partner detail).
    //     Clicking Blank Project skips straight to setup.
    //   stage 2 ("detail"): show MIA_SBD_PLAYBOOK + MIA_ABC_PARTNER_PLAYBOOK.
    //     Clicking either card kicks off the setup → creating → dashboard
    //     flow. Both route through the SBD demo data so the click-through
    //     stays self-contained; the ABC Partner card exists to tell the
    //     extensibility story.
    if (demoMode) {
      if (demoView === 'categories' && pb.id === 'demo-playbook-d365-finance') {
        openFullyReleasedFinanceDemo();
        return;
      }
      if (demoView === 'categories' && pb.id === 'demo-playbook-d365-scm') {
        openScmDemo();
        return;
      }
      if (demoView === 'categories' && isDemoPlaybookId(pb.id)) {
        setDemoView('detail');
        return;
      }
      const target = pb.id === MIA_ABC_PARTNER_PLAYBOOK.id ? MIA_SBD_PLAYBOOK : pb;
      if (onSelectPlaybook) {
        onSelectPlaybook(target);
      } else {
        navigate('/setup', { state: { playbook: target } });
      }
      return;
    }
    if (selectedId === pb.id) {
      if (onSelectPlaybook) {
        onSelectPlaybook(pb);
      } else {
        navigate('/setup', { state: { playbook: pb } });
      }
    } else {
      setSelectedId(pb.id);
    }
  }

  // In demo mode + detail view, show the SBD (Microsoft) and ABC Partner
  // playbooks side by side — Microsoft-published + Partner-published — to
  // tell the extensibility story. Outside demo mode (or in categories view)
  // we use the playbooks returned by usePlaybooks.
  const visiblePlaybooks =
    demoMode && demoView === 'detail'
      ? [MIA_SBD_PLAYBOOK, MIA_ABC_PARTNER_PLAYBOOK]
      : playbooks;
  const allCards = visiblePlaybooks;

  // Show the close button whenever the user has somewhere to go back to —
  // either a real dashboard with projects, an explicit onClose handler, or
  // (in click-through demo) the categories stage we drilled out of.
  const showCloseButton =
    hasProjects || !!onClose || (demoMode && demoView === 'detail');
  const isDetailView = demoMode && demoView === 'detail';

  return (
    <div
      data-testid="welcome-page"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        animation: 'fade-in 0.4s ease-out',
        padding: '32px 16px',
        position: 'relative',
      }}
    >
      {/* X close button — shown when projects exist or when we can navigate
          back to the demo categories view */}
      {showCloseButton && (
        <button
          data-testid="close-welcome"
          onClick={() => {
            if (isDetailView) {
              setDemoView('categories');
              return;
            }
            if (onClose) onClose();
            else navigate('/dashboard');
          }}
          title={isDetailView ? 'Back to playbook categories' : 'Back to projects'}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '1px solid var(--glass-border)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(12px)',
            color: 'var(--text-secondary)',
            fontSize: 18,
            fontWeight: 300,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s, color 0.2s',
            zIndex: 10,
          }}
        >
          ✕
        </button>
      )}

      {/* Floating Microsoft logo */}
      <div
        data-testid="kazuki-logo"
        aria-label="Microsoft"
        style={{
          width: 64,
          height: 64,
          borderRadius: 'var(--radius-md)',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
          animation: 'float 3s ease-in-out infinite',
        }}
      >
        <svg width="40" height="40" viewBox="0 0 21 21" aria-hidden="true">
          <rect width="10" height="10" fill="#f25022"/>
          <rect x="11" width="10" height="10" fill="#7fba00"/>
          <rect y="11" width="10" height="10" fill="#00a4ef"/>
          <rect x="11" y="11" width="10" height="10" fill="#ffb900"/>
        </svg>
      </div>

      <h1
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: 0,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        Welcome to Mia
      </h1>

      <p
        style={{
          fontSize: 15,
          color: 'var(--text-secondary)',
          maxWidth: 520,
          textAlign: 'center',
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        Create a Dynamics 365 implementation workspace.
        Start with customer documents and Mia will map scope, waves, and tasks.
      </p>

      {/* Playbook cards grid */}
      <div
        data-testid="playbook-area"
        style={{
          display: 'flex',
          gap: 20,
          marginTop: 28,
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 1200,
          width: '100%',
          padding: '0 20px',
        }}
      >
        {loading && playbooks.length === 0 && (
          <div
            data-testid="playbook-loading"
            style={{
              color: 'var(--text-tertiary)',
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              padding: 40,
            }}
          >
            Loading playbooks…
          </div>
        )}

        {error && playbooks.length === 0 && (
          <div
            data-testid="playbook-error"
            className="glass"
            style={{
              padding: '20px 28px',
              borderRadius: 'var(--radius-md)',
              color: 'var(--failed)',
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {error && playbooks.length > 0 && (
          <div
            data-testid="playbook-warning"
            className="glass"
            style={{
              width: '100%',
              maxWidth: 720,
              padding: '12px 18px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: 12,
              textAlign: 'center',
            }}
          >
            Showing the FastTrack playbook while live Dataverse playbooks finish loading.
          </div>
        )}

        {!loading && !error && playbooks.length === 0 && (
          <div
            data-testid="playbook-empty"
            className="glass"
            style={{
              width: 300,
              padding: '28px 20px',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: 13,
            }}
          >
            No playbooks available
          </div>
        )}

        {playbooks.length > 0 &&
          allCards.map(pb => (
            <PlaybookCard
              key={pb.id}
              playbook={pb}
              selected={selectedId === pb.id}
              onSelect={handleSelect}
            />
          ))}
      </div>

      {/* Footer */}
      <p
        data-testid="welcome-footer"
        style={{
          fontSize: 12,
          color: 'var(--text-tertiary)',
          maxWidth: 500,
          textAlign: 'center',
          lineHeight: 1.5,
          marginTop: 20,
        }}
      >
        Each playbook defines the phases, tasks, and best practices for your Dynamics 365 project.
        Select a proven template to begin.
      </p>

      {/* Marketplace teaser */}
      <div
        data-testid="marketplace-teaser"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 4,
          padding: '8px 18px',
          borderRadius: 20,
          background: 'rgba(0,0,0,0.03)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <span style={{ fontSize: 16 }}>🏪</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Playbook Marketplace
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '2px 8px',
            borderRadius: 6,
            background: 'rgba(175,82,222,0.10)',
            color: '#AF52DE',
          }}
        >
          Coming Soon
        </span>
      </div>
    </div>
  );
}
