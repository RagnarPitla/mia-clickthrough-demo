/**
 * Integration test for the demo bootstrap. Drives the same flow that runs in
 * `main.tsx` before React renders and asserts the storage shape expected by
 * downstream code (useProjects, useMiaDemoPlayback, dataverse.ts short-circuit).
 *
 * We avoid asserting on `window.localStorage` directly because jsdom in this
 * project does not provide a fully-shimmed Storage. Instead we observe the
 * bootstrap's return value and `window.__kazukiDemoMode` cache flag, which is
 * what real callers consume.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { bootstrapDemoMode, isDemoModeCached } from './demoBootstrap';

function setSearch(value: string) {
  window.history.replaceState({}, '', '/' + value);
}

function clearAll() {
  delete (window as unknown as { __kazukiDemoMode?: boolean }).__kazukiDemoMode;
  window.history.replaceState({}, '', '/');
}

describe('demoBootstrap integration', () => {
  beforeEach(clearAll);
  afterEach(clearAll);

  it('does nothing when no demo flag is present', () => {
    setSearch('');
    expect(bootstrapDemoMode()).toBe(false);
    expect((window as unknown as { __kazukiDemoMode?: boolean }).__kazukiDemoMode).toBe(false);
    expect(isDemoModeCached()).toBe(false);
  });

  it('activates demo mode when ?demo=true', () => {
    setSearch('?demo=true');
    expect(bootstrapDemoMode()).toBe(true);
    expect(isDemoModeCached()).toBe(true);
  });

  it('treats ?present=true and ?webapp=true as demo aliases', () => {
    setSearch('?present=true');
    expect(bootstrapDemoMode()).toBe(true);

    clearAll();

    setSearch('?webapp=true');
    expect(bootstrapDemoMode()).toBe(true);
  });

  it('returns false on ?demo=false even after a previous demo activation', () => {
    setSearch('?demo=true');
    bootstrapDemoMode();

    setSearch('?demo=false');
    expect(bootstrapDemoMode()).toBe(false);
    expect(isDemoModeCached()).toBe(false);
  });

  it('handles ?step=N without throwing when storage is unavailable', () => {
    setSearch('?demo=true&step=4');
    expect(() => bootstrapDemoMode()).not.toThrow();
  });
});

