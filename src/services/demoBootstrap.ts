/**
 * Bootstraps the click-through demo on app startup.
 *
 * Runs BEFORE React renders so first paint already reflects demo state:
 *   - persists the demo flag from URL flags into localStorage,
 *   - when in demo mode, forces the active project to the Mia demo project,
 *   - applies ?step=N to the Mia playback progress key,
 *   - tags `window.__kazukiDemoMode` so service code can detect demo mode without
 *     re-parsing the URL on every call.
 *
 * Used both by the live web app (main.tsx) and by callers that want to opt
 * specific tests into the demo bootstrap.
 */
import {
  isDemoMode,
  getDemoStep,
  persistDemoFlagFromUrl,
} from './demoMode';
import {
  MIA_COWORK_DECISION_KEY,
  MIA_DEMO_PLAYBACK_KEY,
  MIA_DEMO_PROJECT_ID,
  MIA_DEMO_WAVE_COUNT,
  MIA_SCM_PENDING_KEY,
} from './miaDemoData';

const PROJECT_KEY = 'kazuki-project';

declare global {
  interface Window {
    __kazukiDemoMode?: boolean;
  }
}

export function bootstrapDemoMode(): boolean {
  if (typeof window === 'undefined') return false;

  const scmDashboardRequest = isScmDashboardRequest();
  const persistent = persistDemoFlagFromUrl();
  const active = persistent || isDemoMode() || scmDashboardRequest;
  window.__kazukiDemoMode = active;

  if (!active) return false;

  try {
    // Force the active project to the Mia demo so the dashboard loads demo data.
    localStorage.setItem(PROJECT_KEY, MIA_DEMO_PROJECT_ID);

    if (scmDashboardRequest) {
      localStorage.setItem(
        MIA_DEMO_PLAYBACK_KEY,
        Array.from({ length: MIA_DEMO_WAVE_COUNT }, (_, index) => String(index)).join(','),
      );
      localStorage.setItem('kazuki-wave', 'mia-wave-inventory-to-deliver');
      localStorage.removeItem(MIA_COWORK_DECISION_KEY);
      localStorage.setItem(MIA_SCM_PENDING_KEY, 'true');
    }

    // Apply ?step=N to the Mia playback progress when present.
    const step = getDemoStep(MIA_DEMO_WAVE_COUNT);
    if (step !== null) {
      localStorage.setItem(MIA_DEMO_PLAYBACK_KEY, String(step));
    }
  } catch {
    // localStorage unavailable (private browsing, sandboxed iframe, ...) — demo
    // mode still works because dataverse.ts also consults isDemoMode() directly.
  }

  return true;
}

function isScmDashboardRequest(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('from') === 'mia'
      && params.get('task') === 'warehouse'
      && params.get('assigned') === 'decision'
      && window.location.hash.includes('/dashboard');
  } catch {
    return false;
  }
}

/**
 * Synchronous read of the cached demo-mode flag set by bootstrapDemoMode.
 * Falls back to isDemoMode() when bootstrap has not yet run (e.g. in tests).
 */
export function isDemoModeCached(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.__kazukiDemoMode === 'boolean') return window.__kazukiDemoMode;
  return isDemoMode();
}
