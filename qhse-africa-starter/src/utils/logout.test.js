import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('logoutAndClear', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('nettoie toujours localement même si /api/auth/logout échoue', async () => {
    const nativeFetch = vi.fn(async () => {
      throw new Error('network');
    });
    const clearSession = vi.fn();
    const clearAuthSession = vi.fn();

    vi.doMock('../config.js', () => ({
      getApiBase: () => 'http://api.local'
    }));

    vi.doMock('../data/sessionUser.js', () => ({
      nativeFetch,
      clearSession,
      clearAuthSession
    }));

    const { logoutAndClear } = await import('./logout.js');
    await logoutAndClear(); // redirectToLogin=true par défaut → clearSession

    expect(nativeFetch).toHaveBeenCalledTimes(1);
    expect(clearSession).toHaveBeenCalledTimes(1);
    expect(clearAuthSession).not.toHaveBeenCalled();
  });

  it('redirectToLogin=false → clearAuthSession (sans redirection)', async () => {
    const nativeFetch = vi.fn(async () => new Response(null, { status: 204 }));
    const clearSession = vi.fn();
    const clearAuthSession = vi.fn();

    vi.doMock('../config.js', () => ({
      getApiBase: () => 'http://api.local'
    }));

    vi.doMock('../data/sessionUser.js', () => ({
      nativeFetch,
      clearSession,
      clearAuthSession
    }));

    const { logoutAndClear } = await import('./logout.js');
    await logoutAndClear({ redirectToLogin: false });

    expect(nativeFetch).toHaveBeenCalledTimes(1);
    expect(clearAuthSession).toHaveBeenCalledTimes(1);
    expect(clearSession).not.toHaveBeenCalled();
  });

  it('purge les clés localStorage scoped dashboard/risks au logout', async () => {
    const nativeFetch = vi.fn(async () => new Response(null, { status: 204 }));
    const clearSession = vi.fn();
    const clearAuthSession = vi.fn();
    const storageMap = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
      setItem: (k, v) => storageMap.set(k, String(v)),
      removeItem: (k) => storageMap.delete(k),
      clear: () => storageMap.clear(),
      key: (i) => Array.from(storageMap.keys())[i] ?? null,
      get length() {
        return storageMap.size;
      }
    });
    globalThis.localStorage.setItem('qhse.dashboard.intent:t1:u1', '{"x":1}');
    globalThis.localStorage.setItem('qhse.cache.risks.list.v1:t1:u1', '{"rows":[]}');
    globalThis.localStorage.setItem('qhse.theme', 'dark');

    vi.doMock('../config.js', () => ({
      getApiBase: () => 'http://api.local'
    }));

    vi.doMock('../data/sessionUser.js', () => ({
      nativeFetch,
      clearSession,
      clearAuthSession
    }));

    const { logoutAndClear } = await import('./logout.js');
    await logoutAndClear();

    expect(globalThis.localStorage.getItem('qhse.dashboard.intent:t1:u1')).toBeNull();
    expect(globalThis.localStorage.getItem('qhse.cache.risks.list.v1:t1:u1')).toBeNull();
    expect(globalThis.localStorage.getItem('qhse.theme')).toBe('dark');
  });
});
