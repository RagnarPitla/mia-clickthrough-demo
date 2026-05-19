import { describe, expect, it } from 'vitest';
import {
  DEMO_MODE_KEY,
  getDemoStep,
  hasDemoUrlFlag,
  hasDemoUrlOptOut,
  isDemoMode,
  isTourEnabled,
  persistDemoFlagFromUrl,
} from './demoMode';

function memoryStorage(seed: Record<string, string> = {}): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> & { dump(): Record<string, string> } {
  const map = new Map(Object.entries(seed));
  return {
    getItem(key) { return map.has(key) ? (map.get(key) as string) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
    dump() { return Object.fromEntries(map.entries()); },
  };
}

describe('demoMode URL parsing', () => {
  it('detects demo=true', () => {
    expect(hasDemoUrlFlag({ search: '?demo=true' })).toBe(true);
    expect(hasDemoUrlFlag({ search: '?demo' })).toBe(true);
    expect(hasDemoUrlFlag({ search: '?demo=1' })).toBe(true);
  });

  it('treats present and webapp as demo aliases', () => {
    expect(hasDemoUrlFlag({ search: '?present=true' })).toBe(true);
    expect(hasDemoUrlFlag({ search: '?webapp=true' })).toBe(true);
  });

  it('returns false when no flag is present', () => {
    expect(hasDemoUrlFlag({ search: '' })).toBe(false);
    expect(hasDemoUrlFlag({ search: '?other=true' })).toBe(false);
  });

  it('detects opt-out demo=false', () => {
    expect(hasDemoUrlOptOut({ search: '?demo=false' })).toBe(true);
    expect(hasDemoUrlOptOut({ search: '?demo=0' })).toBe(true);
    expect(hasDemoUrlOptOut({ search: '?demo=true' })).toBe(false);
    expect(hasDemoUrlOptOut({ search: '' })).toBe(false);
  });
});

describe('demoMode isDemoMode', () => {
  it('is true when URL flag is present, regardless of storage', () => {
    const storage = memoryStorage();
    expect(isDemoMode({ search: '?demo=true', storage })).toBe(true);
  });

  it('is true when persistent storage flag is set, even with no URL flag', () => {
    const storage = memoryStorage({ [DEMO_MODE_KEY]: 'true' });
    expect(isDemoMode({ search: '', storage })).toBe(true);
  });

  it('opt-out URL flag overrides persistent storage', () => {
    const storage = memoryStorage({ [DEMO_MODE_KEY]: 'true' });
    expect(isDemoMode({ search: '?demo=false', storage })).toBe(false);
  });

  it('is false by default', () => {
    expect(isDemoMode({ search: '', storage: memoryStorage() })).toBe(false);
  });
});

describe('demoMode getDemoStep', () => {
  it('returns clamped numeric step', () => {
    expect(getDemoStep(11, { search: '?step=3' })).toBe(3);
    expect(getDemoStep(11, { search: '?step=20' })).toBe(11);
    expect(getDemoStep(11, { search: '?step=-2' })).toBe(0);
  });

  it('returns null when missing or non-numeric', () => {
    expect(getDemoStep(11, { search: '' })).toBeNull();
    expect(getDemoStep(11, { search: '?step=abc' })).toBeNull();
  });
});

describe('demoMode isTourEnabled', () => {
  it('detects ?tour=true', () => {
    expect(isTourEnabled({ search: '?tour=true' })).toBe(true);
    expect(isTourEnabled({ search: '?tour=1' })).toBe(true);
    expect(isTourEnabled({ search: '?tour=false' })).toBe(false);
    expect(isTourEnabled({ search: '' })).toBe(false);
  });
});

describe('demoMode persistDemoFlagFromUrl', () => {
  it('writes the flag when URL has demo=true', () => {
    const storage = memoryStorage();
    expect(persistDemoFlagFromUrl({ search: '?demo=true', storage })).toBe(true);
    expect(storage.getItem(DEMO_MODE_KEY)).toBe('true');
  });

  it('clears the flag when URL has demo=false', () => {
    const storage = memoryStorage({ [DEMO_MODE_KEY]: 'true' });
    expect(persistDemoFlagFromUrl({ search: '?demo=false', storage })).toBe(false);
    expect(storage.getItem(DEMO_MODE_KEY)).toBeNull();
  });

  it('returns the persisted flag when URL is empty', () => {
    const storage = memoryStorage({ [DEMO_MODE_KEY]: 'true' });
    expect(persistDemoFlagFromUrl({ search: '', storage })).toBe(true);
  });
});
