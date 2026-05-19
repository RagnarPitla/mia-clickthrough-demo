interface Props {
  show: boolean;
  onDismiss: () => void;
  totalWaves: number;
  totalTasks: number;
}

/**
 * Click-through demo finale: renders a centered modal celebrating that all
 * Mia waves and their tasks have been released. Shown only when the playback
 * actually crosses from running -> complete during a session (not on a direct
 * `?step=11` deep link).
 */
export default function FnoConfigCompleteCard({ show, onDismiss, totalWaves, totalTasks }: Props) {
  if (!show) return null;
  return (
    <div
      data-testid="fno-complete-overlay"
      onClick={onDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 11, 33, 0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        data-testid="fno-complete-card"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(520px, 92vw)',
          padding: '28px 28px 22px',
          borderRadius: 18,
          background: 'linear-gradient(135deg, #ffffff 0%, #f7f4ff 100%)',
          border: '1px solid rgba(124,58,237,0.25)',
          boxShadow: '0 30px 60px -20px rgba(124,58,237,0.45), 0 8px 20px rgba(0,0,0,0.18)',
          textAlign: 'center',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          animation: 'fno-pop 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.2) both',
        }}
      >
        <div
          aria-hidden
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 34,
            margin: '0 auto 14px',
            boxShadow: '0 0 0 6px rgba(124,58,237,0.18)',
          }}
        >
          ✓
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: '#7c3aed', marginBottom: 6,
        }}>
          Implementation complete
        </div>
        <h2 style={{
          fontSize: 24, fontWeight: 800, color: '#1c1c1e',
          margin: '0 0 8px', letterSpacing: '-0.01em',
        }}>
          F&amp;O Configuration Complete
        </h2>
        <p style={{
          fontSize: 13, lineHeight: 1.55, color: 'rgba(60,60,67,0.74)',
          margin: '0 0 16px',
        }}>
          All <b style={{ color: '#1c1c1e' }}>{totalWaves} waves</b> and{' '}
          <b style={{ color: '#1c1c1e' }}>{totalTasks} tasks</b> have been released for the
          Zava (US Legal Entity) playbook. Your D365 Finance &amp; Operations sandbox is now
          configured end-to-end via Mia.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          margin: '0 0 18px',
          padding: '12px 0',
          borderTop: '1px solid rgba(124,58,237,0.15)',
          borderBottom: '1px solid rgba(124,58,237,0.15)',
        }}>
          <Stat label="Waves" value={String(totalWaves)} />
          <Stat label="Tasks" value={String(totalTasks)} />
          <Stat label="Errors" value="0" tone="ok" />
        </div>
        <button
          data-testid="fno-complete-dismiss"
          onClick={onDismiss}
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
            color: '#fff',
            border: 'none',
            padding: '10px 24px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '0.02em',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(124,58,237,0.45)',
          }}
        >
          Continue exploring
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = 'brand' }: { label: string; value: string; tone?: 'brand' | 'ok' }) {
  const color = tone === 'ok' ? '#1f8c3a' : '#7c3aed';
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'rgba(60,60,67,0.55)', marginTop: 2,
      }}>
        {label}
      </div>
    </div>
  );
}
