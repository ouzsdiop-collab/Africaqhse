import { describe, it, expect, beforeEach, vi } from 'vitest';

function jsonRes(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

describe('qhseFetch — auth/session/refresh', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('mauvais token API → tentative refresh max 1 fois', async () => {
    const nativeFetch = vi.fn(async (_url, init) => {
      const auth = init?.headers instanceof Headers ? init.headers.get('Authorization') : '';
      if (auth?.includes('old-token')) return jsonRes(401, { error: 'expired' });
      if (auth?.includes('new-token')) return jsonRes(200, []);
      return jsonRes(500, { error: 'unexpected' });
    });

    const refreshAccessToken = vi.fn(async () => 'new-token');
    const clearSession = vi.fn();

    vi.doMock('../data/sessionUser.js', () => ({
      nativeFetch,
      getSessionUserId: () => '',
      setSessionUser: vi.fn(),
      getAuthToken: () => '',
      getSessionUser: () => ({ id: 'u1', role: 'ADMIN' }),
      clearSession,
      clearAuthSession: vi.fn(),
      getPasswordSetupToken: () => ''
    }));

    vi.doMock('./auth.js', () => ({
      getAccessTokenForRequest: () => 'old-token',
      refreshAccessToken
    }));

    const { qhseFetch } = await import('./qhseFetch.js');
    const res = await qhseFetch('/api/risks');
    expect(res.status).toBe(200);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(nativeFetch).toHaveBeenCalledTimes(2);
    expect(clearSession).not.toHaveBeenCalled();
  });

  it('refresh échoué → clear session complet + redirect login (via clearSession)', async () => {
    const nativeFetch = vi.fn(async () => jsonRes(401, { error: 'expired' }));
    const refreshAccessToken = vi.fn(async () => null);
    const clearSession = vi.fn();

    vi.doMock('../data/sessionUser.js', () => ({
      nativeFetch,
      getSessionUserId: () => '',
      setSessionUser: vi.fn(),
      getAuthToken: () => '',
      getSessionUser: () => ({ id: 'u1', role: 'ADMIN' }),
      clearSession,
      clearAuthSession: vi.fn(),
      getPasswordSetupToken: () => ''
    }));

    vi.doMock('./auth.js', () => ({
      getAccessTokenForRequest: () => 'old-token',
      refreshAccessToken
    }));

    const { qhseFetch } = await import('./qhseFetch.js');
    const res = await qhseFetch('/api/actions');
    expect(res.status).toBe(401);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(nativeFetch).toHaveBeenCalledTimes(1);
    expect(clearSession).toHaveBeenCalledTimes(1);
  });

  it('profil en session mais token absent → refresh échoue → clearSession (pas de semi-connecté)', async () => {
    const nativeFetch = vi.fn(async () => jsonRes(200, { ok: true }));
    const refreshAccessToken = vi.fn(async () => null);
    const clearSession = vi.fn();

    vi.doMock('../data/sessionUser.js', () => ({
      nativeFetch,
      getSessionUserId: () => '',
      setSessionUser: vi.fn(),
      getAuthToken: () => '',
      getSessionUser: () => ({ id: 'u1', role: 'ADMIN' }),
      clearSession,
      clearAuthSession: vi.fn(),
      getPasswordSetupToken: () => ''
    }));

    vi.doMock('./auth.js', () => ({
      getAccessTokenForRequest: () => '',
      refreshAccessToken
    }));

    const { qhseFetch } = await import('./qhseFetch.js');
    const res = await qhseFetch('/api/risks');
    expect(res.status).toBe(401);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(clearSession).toHaveBeenCalledTimes(1);
    expect(nativeFetch).not.toHaveBeenCalled();
  });

  it('MUST_CHANGE_PASSWORD → redirect first-password seulement si setup token présent', async () => {
    const nativeFetch = vi.fn(async () =>
      jsonRes(403, {
        error: 'Vous devez d’abord définir un nouveau mot de passe.',
        code: 'MUST_CHANGE_PASSWORD'
      })
    );

    const clearAuthSession = vi.fn();
    const clearSession = vi.fn();

    vi.doMock('../data/sessionUser.js', () => ({
      nativeFetch,
      getSessionUserId: () => '',
      setSessionUser: vi.fn(),
      getAuthToken: () => 't',
      getSessionUser: () => ({ id: 'u1', role: 'ADMIN' }),
      clearSession,
      clearAuthSession,
      getPasswordSetupToken: () => ''
    }));

    vi.doMock('./auth.js', () => ({
      getAccessTokenForRequest: () => 't',
      refreshAccessToken: vi.fn(async () => null)
    }));

    const { qhseFetch } = await import('./qhseFetch.js');
    await qhseFetch('/api/anything');
    expect(clearAuthSession).toHaveBeenCalledWith({ keepPasswordSetupContext: false });

    vi.resetModules();
    vi.doMock('../data/sessionUser.js', () => ({
      nativeFetch,
      getSessionUserId: () => '',
      setSessionUser: vi.fn(),
      getAuthToken: () => 't',
      getSessionUser: () => ({ id: 'u1', role: 'ADMIN' }),
      clearSession,
      clearAuthSession,
      getPasswordSetupToken: () => 'pwd-setup'
    }));
    vi.doMock('./auth.js', () => ({
      getAccessTokenForRequest: () => 't',
      refreshAccessToken: vi.fn(async () => null)
    }));

    const { qhseFetch: qhseFetch2 } = await import('./qhseFetch.js');
    await qhseFetch2('/api/anything');
    expect(clearAuthSession).toHaveBeenCalledWith({ keepPasswordSetupContext: true });
  });
});

