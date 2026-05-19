/**
 * Click-through demo mode for the Mia Console web app.
 *
 * When the built `dist/` is hosted as a static web app (Azure SWA, GitHub Pages,
 * any static host) there is no Power Apps host injecting the Dataverse runtime, so
 * Power Apps SDK calls hang or fail. This module exposes a tiny URL-flag contract
 * that switches the app to a fully self-contained click-through demo backed by the
 * existing Mia demo data in `miaDemoData.ts`.
 *
 * Activation contract:
 *   ?demo=true       — enable demo mode (Mia data, no Dataverse calls)
 *   ?present=true    — alias for ?demo=true (matches Config-Azure-Demo/3009-APP)
 *   ?webapp=true     — alias for ?demo=true
 *   ?step=N          — when in demo mode, set initial Mia wave progress (0..MIA_DEMO_WAVE_COUNT)
 *   ?tour=true       — show guided tour overlay
 *   localStorage 'kazuki-demo-mode' = 'true' — persistent activation, set by URL flag
 *   ?demo=false      — explicitly disable demo mode and clear the persistent flag
 */

export const DEMO_MODE_KEY = 'kazuki-demo-mode';
export const DEMO_FLAGS = ['demo', 'present', 'webapp'] as const;

interface DemoOptions {
  search?: string;
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
}

function getSearchString(opts?: DemoOptions): string {
  if (opts?.search !== undefined) return opts.search;
  if (typeof window === 'undefined') return '';
  return window.location.search;
}

function getStorage(opts?: DemoOptions): DemoOptions['storage'] | null {
  if (opts?.storage) return opts.storage;
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readParam(search: string, name: string): string | null {
  try {
    return new URLSearchParams(search).get(name);
  } catch {
    return null;
  }
}

function isTruthy(value: string | null): boolean {
  if (value === null) return false;
  if (value === '') return true;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Returns true if any of the demo URL flags are present and truthy.
 */
export function hasDemoUrlFlag(opts?: DemoOptions): boolean {
  const search = getSearchString(opts);
  return DEMO_FLAGS.some(flag => isTruthy(readParam(search, flag)));
}

/**
 * Returns true if any demo URL flag is present and explicitly disabled
 * (e.g. `?demo=false`). Only `false`/`0` count — absent flags do not.
 */
export function hasDemoUrlOptOut(opts?: DemoOptions): boolean {
  const search = getSearchString(opts);
  return DEMO_FLAGS.some(flag => {
    const raw = readParam(search, flag);
    if (raw === null) return false;
    const lower = raw.toLowerCase();
    return lower === 'false' || lower === '0';
  });
}

/**
 * Returns true if demo mode is currently active (URL flag, or persistent storage flag).
 * URL opt-out (`?demo=false`) overrides any persistent flag.
 */
export function isDemoMode(opts?: DemoOptions): boolean {
  if (hasDemoUrlOptOut(opts)) return false;
  if (hasDemoUrlFlag(opts)) return true;
  const storage = getStorage(opts);
  if (!storage) return false;
  try {
    return storage.getItem(DEMO_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Returns the requested initial Mia wave progress from `?step=N`, clamped to
 * [0, max]. Returns null when no `?step` is present or it is not a number.
 */
export function getDemoStep(max: number, opts?: DemoOptions): number | null {
  const search = getSearchString(opts);
  const raw = readParam(search, 'step');
  if (raw === null || raw === '') return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(max, parsed));
}

/**
 * Returns true when `?tour=true` is present.
 */
export function isTourEnabled(opts?: DemoOptions): boolean {
  const search = getSearchString(opts);
  return isTruthy(readParam(search, 'tour'));
}

/**
 * Persist (or clear) the demo flag based on the current URL. Call this once on
 * app bootstrap before React renders so first paint already reflects demo state.
 */
export function persistDemoFlagFromUrl(opts?: DemoOptions): boolean {
  const storage = getStorage(opts);
  if (!storage) return hasDemoUrlFlag(opts);
  try {
    if (hasDemoUrlOptOut(opts)) {
      storage.removeItem(DEMO_MODE_KEY);
      return false;
    }
    if (hasDemoUrlFlag(opts)) {
      storage.setItem(DEMO_MODE_KEY, 'true');
      return true;
    }
    return storage.getItem(DEMO_MODE_KEY) === 'true';
  } catch {
    return hasDemoUrlFlag(opts);
  }
}
