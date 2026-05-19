import { useState } from 'react';
import { isDemoModeCached } from '../services/demoBootstrap';

/**
 * Click-through demo banner. Renders only when demo mode is active so the
 * user always knows they are in a click-through (no live data, no ERP writes).
 * The Exit demo control lives in Settings → Demo Mode.
 */
export default function DemoBanner() {
  const [active] = useState(() => isDemoModeCached());

  if (!active) return null;

  return (
    <div
      data-testid="demo-banner"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'linear-gradient(90deg, rgba(0,122,255,0.14), rgba(175,82,222,0.14))',
        borderBottom: '1px solid rgba(0,122,255,0.20)',
        backdropFilter: 'blur(12px)',
        color: 'var(--text-primary)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 12,
        fontWeight: 600,
        padding: '6px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      <span aria-hidden style={{ fontSize: 14 }}>▶</span>
      <span>Sample workspace &mdash; no live ERP writes.</span>
    </div>
  );
}
