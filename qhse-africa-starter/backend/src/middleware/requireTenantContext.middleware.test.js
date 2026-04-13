import { describe, it, expect, vi } from 'vitest';
import { TENANT_CONTEXT_REQUIRED_MESSAGE } from '../lib/tenantConstants.js';
import {
  requireTenantContext,
  isApiTenantOptionalPath
} from './requireTenantContext.middleware.js';

function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

describe('isApiTenantOptionalPath', () => {
  it('retourne true pour health, auth, docs', () => {
    expect(isApiTenantOptionalPath('/api/health')).toBe(true);
    expect(isApiTenantOptionalPath('/api/health/ready')).toBe(true);
    expect(isApiTenantOptionalPath('/api/auth/login')).toBe(true);
    expect(isApiTenantOptionalPath('/api/docs')).toBe(true);
    expect(isApiTenantOptionalPath('/api/docs.json')).toBe(true);
  });

  it('retourne true pour stream document contrôlé, FDS analyze, automation', () => {
    expect(isApiTenantOptionalPath('/api/controlled-documents/stream')).toBe(true);
    expect(isApiTenantOptionalPath('/api/controlled-documents/stream/')).toBe(true);
    expect(isApiTenantOptionalPath('/api/fds/analyze')).toBe(true);
    expect(isApiTenantOptionalPath('/api/automation/run')).toBe(true);
  });

  it('retourne false pour une route métier classique', () => {
    expect(isApiTenantOptionalPath('/api/incidents')).toBe(false);
    expect(isApiTenantOptionalPath('/api/controlled-documents/products/fds')).toBe(false);
  });
});

describe('requireTenantContext', () => {
  it('laisse passer les chemins hors /api', () => {
    const next = vi.fn();
    const req = {
      originalUrl: '/',
      qhseUser: { id: 'u1' },
      qhseTenantId: null
    };
    requireTenantContext(req, mockRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('laisse passer /api/health sans tenant', () => {
    const next = vi.fn();
    requireTenantContext(
      { originalUrl: '/api/health', qhseUser: null, qhseTenantId: null },
      mockRes(),
      next
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it('laisse passer /api/auth même sans tenant', () => {
    const next = vi.fn();
    requireTenantContext(
      {
        originalUrl: '/api/auth/refresh?foo=1',
        qhseUser: { id: 'u1' },
        qhseTenantId: null
      },
      mockRes(),
      next
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it('laisse passer /api/docs même sans tenant', () => {
    const next = vi.fn();
    requireTenantContext(
      {
        originalUrl: '/api/docs.json',
        qhseUser: { id: 'u1' },
        qhseTenantId: null
      },
      mockRes(),
      next
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it('laisse passer /api/fds/analyze sans tenant', () => {
    const next = vi.fn();
    requireTenantContext(
      { originalUrl: '/api/fds/analyze', qhseUser: null, qhseTenantId: null },
      mockRes(),
      next
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it('laisse passer /api/controlled-documents/stream sans tenant', () => {
    const next = vi.fn();
    requireTenantContext(
      { originalUrl: '/api/controlled-documents/stream', qhseUser: null, qhseTenantId: null },
      mockRes(),
      next
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it('laisse passer /api/automation sans tenant', () => {
    const next = vi.fn();
    requireTenantContext(
      { originalUrl: '/api/automation/status', qhseUser: null, qhseTenantId: null },
      mockRes(),
      next
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it('laisse passer une route métier avec tenant', () => {
    const next = vi.fn();
    requireTenantContext(
      {
        originalUrl: '/api/incidents',
        qhseUser: { id: 'u1' },
        qhseTenantId: 'tenant-abc'
      },
      mockRes(),
      next
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it('répond 403 sans tenant sur une route métier (avec ou sans utilisateur)', () => {
    const next = vi.fn();
    const res = mockRes();
    requireTenantContext(
      {
        originalUrl: '/api/dashboard',
        qhseUser: { id: 'u1' },
        qhseTenantId: null
      },
      res,
      next
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: TENANT_CONTEXT_REQUIRED_MESSAGE });

    const next2 = vi.fn();
    const res2 = mockRes();
    requireTenantContext(
      {
        originalUrl: '/api/risks',
        qhseUser: null,
        qhseTenantId: null
      },
      res2,
      next2
    );
    expect(next2).not.toHaveBeenCalled();
    expect(res2.status).toHaveBeenCalledWith(403);
  });

  it('utilise req.url si originalUrl est absent', () => {
    const next = vi.fn();
    const res = mockRes();
    requireTenantContext(
      { url: '/api/sites', originalUrl: undefined, qhseUser: null, qhseTenantId: null },
      res,
      next
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
