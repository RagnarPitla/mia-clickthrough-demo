import { useEffect, useRef, useState } from 'react';
import { isTourEnabled } from '../services/demoMode';

interface TourStep {
  /** CSS selector matched against `document.querySelector` */
  selector: string;
  text: string;
  position: 'top' | 'right' | 'bottom' | 'left';
}

const STEPS: TourStep[] = [
  {
    selector: '[data-testid="welcome-page"] [data-testid="kazuki-logo"]',
    text: 'This is the Mia Console &mdash; a guided walkthrough of the Dynamics 365 implementation co-pilot.',
    position: 'bottom',
  },
  {
    selector: '[data-testid="playbook-area"]',
    text: 'Pick a <b>playbook</b> to scaffold a project. Click a card once to focus, twice to open setup.',
    position: 'top',
  },
  {
    selector: '[data-testid="shell-new-project"]',
    text: 'Use <b>+ New</b> any time to start another playbook from the dashboard.',
    position: 'left',
  },
];

/**
 * Lightweight click-through guided tour. Mirrors the
 * Config-Azure-Demo/3009-APP/demo-tour.js style: a dim overlay with a pulsing
 * highlight ring around the next-step element and a tooltip explaining the action.
 *
 * Activated by `?tour=true` on top of `?demo=true`. Exits on the last step or
 * when the user clicks outside the highlighted element.
 */
export default function DemoTour() {
  const [enabled] = useState(() => isTourEnabled());
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (stepIndex >= STEPS.length) return;

    let cancelled = false;
    let frame = 0;

    function locate() {
      if (cancelled) return;
      const step = STEPS[stepIndex];
      const el = document.querySelector(step.selector) as HTMLElement | null;
      if (!el) {
        frame = window.setTimeout(locate, 200);
        return;
      }
      setRect(el.getBoundingClientRect());
    }

    locate();
    const onResize = () => locate();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      cancelled = true;
      if (frame) window.clearTimeout(frame);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [enabled, stepIndex]);

  if (!enabled || stepIndex >= STEPS.length || !rect) return null;

  const step = STEPS[stepIndex];
  const pad = 6;
  const tipWidth = 280;
  const tipGap = 16;
  let tipLeft = rect.left + rect.width / 2 - tipWidth / 2;
  let tipTop = rect.bottom + tipGap;
  if (step.position === 'top') tipTop = rect.top - tipGap - 80;
  else if (step.position === 'right') {
    tipLeft = rect.right + tipGap;
    tipTop = rect.top + rect.height / 2 - 40;
  } else if (step.position === 'left') {
    tipLeft = rect.left - tipGap - tipWidth;
    tipTop = rect.top + rect.height / 2 - 40;
  }

  function next() { setStepIndex(s => s + 1); }
  function skip() { setStepIndex(STEPS.length); }

  return (
    <div data-testid="demo-tour" style={{ position: 'fixed', inset: 0, zIndex: 10010, pointerEvents: 'none' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: rect.left - pad,
          top: rect.top - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          borderRadius: 10,
          boxShadow: '0 0 0 4000px rgba(15,23,42,0.45), 0 0 0 4px rgba(0,122,255,0.6)',
          transition: 'all 0.25s ease',
          pointerEvents: 'none',
          animation: 'kazuki-tour-pulse 1.6s ease-in-out infinite',
        }}
      />
      <div
        ref={tipRef}
        style={{
          position: 'absolute',
          left: Math.max(12, tipLeft),
          top: Math.max(12, tipTop),
          width: tipWidth,
          background: '#fff',
          color: '#1f2937',
          padding: '14px 18px',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 13,
          lineHeight: 1.5,
          pointerEvents: 'auto',
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: step.text }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <button
            type="button"
            onClick={skip}
            style={{
              fontSize: 11,
              padding: '4px 10px',
              borderRadius: 6,
              background: 'transparent',
              border: '1px solid rgba(0,0,0,0.08)',
              color: '#6b7280',
              cursor: 'pointer',
            }}
          >
            Skip tour
          </button>
          <button
            type="button"
            onClick={next}
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: 6,
              background: '#007AFF',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {stepIndex === STEPS.length - 1 ? 'Done' : `Next (${stepIndex + 1}/${STEPS.length})`}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes kazuki-tour-pulse {
          0%, 100% { box-shadow: 0 0 0 4000px rgba(15,23,42,0.45), 0 0 0 4px rgba(0,122,255,0.6); }
          50%      { box-shadow: 0 0 0 4000px rgba(15,23,42,0.45), 0 0 0 10px rgba(0,122,255,0.35); }
        }
      `}</style>
    </div>
  );
}
