import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { vi } from 'vitest';

/**
 * Route-level smoke tests: verifies controllers use req.qhseTenantId in the call chain
 * (by asserting service layer is called with the tenant id).
 *
 * This is intentionally lightweight to avoid refactors and DB setup.
 */

vi.mock('../services/risks.service.js', () => ({
  findAllRisks: vi.fn(async () => []),
  findRiskById: vi.fn(async () => null),
  getRiskStats: vi.fn(async () => ({})),
  createRisk: vi.fn(async () => ({})),
  updateRiskById: vi.fn(async () => ({})),
  deleteRiskById: vi.fn(async () => ({}))
}));

vi.mock('../services/incidents.service.js', () => ({
  findAllIncidents: vi.fn(async () => []),
  createIncident: vi.fn(async () => ({})),
  updateIncidentByRef: vi.fn(async () => ({})),
  computeTfTg: vi.fn(async () => ({}))
}));

vi.mock('../services/actions.service.js', () => ({
  findAllActions: vi.fn(async () => []),
  createAction: vi.fn(async () => ({})),
  updateActionFields: vi.fn(async () => ({})),
  assignAction: vi.fn(async () => ({}))
}));

vi.mock('../services/audits.service.js', () => ({
  findAllAudits: vi.fn(async () => []),
  createAudit: vi.fn(async () => ({}))
}));

vi.mock('../services/controlledDocument.service.js', () => ({
  parseListFilters: vi.fn(() => ({})),
  listControlledDocuments: vi.fn(async () => []),
  canAccessControlledDocument: vi.fn(() => true),
  normalizeClassification: vi.fn(() => 'public'),
  toPublicControlledDocument: vi.fn((x) => x),
  getControlledDocumentById: vi.fn(async () => null),
  getControlledDocumentByIdUnscoped: vi.fn(async () => null),
  createControlledDocument: vi.fn(async () => ({})),
  updateControlledDocumentMeta: vi.fn(async () => ({}))
}));

async function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.qhseUser = { id: 'u', role: 'ADMIN', name: 'U', email: 'u@test' };
    req.qhseTenantId = 'tenant-A';
    next();
  });
  const [
    { default: risksRouter },
    { default: incidentsRouter },
    { default: actionsRouter },
    { default: auditsRouter },
    { default: controlledDocsRouter }
  ] = await Promise.all([
    import('../routes/risks.routes.js'),
    import('../routes/incidents.routes.js'),
    import('../routes/actions.routes.js'),
    import('../routes/audits.routes.js'),
    import('../routes/controlledDocuments.routes.js')
  ]);
  app.use('/api/risks', risksRouter);
  app.use('/api/incidents', incidentsRouter);
  app.use('/api/actions', actionsRouter);
  app.use('/api/audits', auditsRouter);
  app.use('/api/controlled-documents', controlledDocsRouter);
  return app;
}

describe('tenant isolation — controllers pass req.qhseTenantId', () => {
  let app;

  beforeAll(
    async () => {
    app = await buildApp();
    },
    20000
  );

  it('GET /api/risks calls service with tenant id', async () => {
    const mod = await import('../services/risks.service.js');
    const spy = mod.findAllRisks;
    await request(app).get('/api/risks').expect(200);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toBe('tenant-A');
  });

  it('GET /api/incidents calls service with tenant id', async () => {
    const mod = await import('../services/incidents.service.js');
    const spy = mod.findAllIncidents;
    await request(app).get('/api/incidents').expect(200);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toBe('tenant-A');
  });

  it('GET /api/actions calls service with tenant id', async () => {
    const mod = await import('../services/actions.service.js');
    const spy = mod.findAllActions;
    await request(app).get('/api/actions').expect(200);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toBe('tenant-A');
  });

  it('GET /api/audits calls service with tenant id', async () => {
    const mod = await import('../services/audits.service.js');
    const spy = mod.findAllAudits;
    await request(app).get('/api/audits').expect(200);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toBe('tenant-A');
  });

  it('GET /api/controlled-documents calls service with tenant id', async () => {
    const mod = await import('../services/controlledDocument.service.js');
    const spy = mod.listControlledDocuments;
    await request(app).get('/api/controlled-documents').expect(200);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toBe('tenant-A');
  });
});

