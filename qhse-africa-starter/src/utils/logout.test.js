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
});

