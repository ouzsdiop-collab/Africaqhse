import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import supertest from 'supertest';
import { prisma } from '../db.js';
import { TENANT_CONTEXT_REQUIRED_MESSAGE } from '../lib/tenantConstants.js';

const store = [];

function applyFilters(items, filters) {
  return items.filter((r) => {
    if (filters.status && r.status !== filters.status) return false;
    if (filters.category && r.category !== filters.category) return false;
    return true;
  });
}

vi.mock('../services/sites.service.js', () => ({
  coalesceQuerySiteIdForList: vi.fn(async (_tenantId, rawSiteId) => rawSiteId ?? null),
  assertSiteExistsOrNull: vi.fn(async (_tenantId, siteId) => siteId ?? null)
}));

vi.mock('../services/auditLog.service.js', () => ({
  auditUserIdFromRequest: vi.fn(() => null),
  writeAuditLog: vi.fn(async () => {})
}));

vi.mock('../services/riskAnalyze.service.js', () => {
  const build = (description) => ({
    category: String(description).includes('chute') ? 'Sécurité' : 'Autre',
    severity: 'moyenne',
    probability: 'moyenne',
    suggestedActions: ['Action suggérée (test)'],
    causes: 'Causes (test).',
    impacts: 'Impacts (test).'
  });
  return {
    analyzeRiskDescription: vi.fn((description) => build(description)),
    analyzeRiskDescriptionAsync: vi.fn(async (description) => ({
      ...build(description),
      provider: 'rules'
    }))
  };
});

vi.mock('../services/tenantAuth.service.js', () => ({
  assertUserTenantAccess: vi.fn(async () => ({
    id: 'tenant-test',
    slug: 'default',
    name: 'Test Org'
  })),
  listTenantsForUser: vi.fn(async () => []),
  getFirstTenantForUser: vi.fn(async () => ({
    id: 'tenant-test',
    slug: 'default',
    name: 'Test Org'
  })),
  resolveTenantForLogin: vi.fn()
}));

vi.mock('../services/risks.service.js', () => ({
  findAllRisks: vi.fn(async (_tenantId, filters = {}) => applyFilters(store, filters)),
  findRiskById: vi.fn(async (_tenantId, id) => store.find((x) => x.id === id) || null),
  getRiskStats: vi.fn(async (_tenantId, _filters = {}) => {
    const byStatus = {};
    const byCategory = {};
    let critical = 0;
    store.forEach((x) => {
      byStatus[x.status] = (byStatus[x.status] || 0) + 1;
      byCategory[x.category || 'Autre'] = (byCategory[x.category || 'Autre'] || 0) + 1;
      if (Number(x.gp || 0) >= 15) critical += 1;
    });
    return { total: store.length, critical, byStatus, byCategory };
  }),
  createRisk: vi.fn(async (_tenantId, data) => {
    const row = {
      id: `risk_${store.length + 1}`,
      ref: `RSK-${100 + store.length + 1}`,
      title: data.title,
      description: data.description ?? null,
      category: data.category ?? null,
      severity: Number(data.severity ?? 1),
      gravity: Number(data.gravity ?? data.severity ?? 1),
      probability: Number(data.probability ?? 1),
      gp:
        data.probability == null || data.gravity == null
          ? null
          : Number(data.probability) * Number(data.gravity),
      status: data.status ?? 'open',
      owner: data.owner ?? null
    };
    store.push(row);
    return row;
  }),
  updateRiskById: vi.fn(async (_tenantId, id, patch) => {
    const hit = store.find((x) => x.id === id);
    if (!hit) {
      const err = new Error('not found');
      err.code = 'P2025';
      throw err;
    }
    Object.assign(hit, patch);
    if ('probability' in patch || 'gravity' in patch) {
      hit.gp =
        hit.probability == null || hit.gravity == null ? null : Number(hit.probability) * Number(hit.gravity);
    }
    return hit;
  }),
  deleteRiskById: vi.fn(async (_tenantId, id) => {
    const idx = store.findIndex((x) => x.id === id);
    if (idx < 0) {
      const err = new Error('not found');
      err.code = 'P2025';
      throw err;
    }
    const removed = store[idx];
    store.splice(idx, 1);
    return { deleted: true, id: removed.id };
  })
}));

const { app } = await import('../server.js');

const API_REQ_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

/** supertest v7 : `supertest(app)` expose get/post/… — pas de `.set` sur la racine. */
function apiReq() {
  const st = supertest(app);
  const out = { del: (url) => st.delete(url).set('X-User-Id', 'test-api-user') };
  for (const m of API_REQ_METHODS) {
    out[m] = (url) => st[m](url).set('X-User-Id', 'test-api-user');
  }
  return out;
}

describe('risks routes', () => {
  beforeEach(() => {
    store.splice(0, store.length);
    vi.mocked(prisma.user.findUnique).mockImplementation(async ({ where }) => {
      if (where?.id === 'test-api-user') {
        return {
          id: 'test-api-user',
          name: 'API Test',
          email: 'api@test.local',
          role: 'ADMIN',
          isActive: true,
          mustChangePassword: false
        };
      }
      return null;
    });
  });

  it('GET /api/risks retourne un tableau', async () => {
    const res = await apiReq().get('/api/risks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/risks filtre par status et category', async () => {
    store.push(
      { id: '1', title: 'a', status: 'ouvert', category: 'Sécurité', gravity: 3, probability: 3, gp: 9 },
      { id: '2', title: 'b', status: 'ferme', category: 'Qualité', gravity: 2, probability: 2, gp: 4 }
    );
    const resStatus = await apiReq().get('/api/risks?status=ouvert');
    expect(resStatus.status).toBe(200);
    expect(resStatus.body).toHaveLength(1);
    const resCat = await apiReq().get('/api/risks?category=Sécurité');
    expect(resCat.status).toBe(200);
    expect(resCat.body).toHaveLength(1);
  });

  it('POST /api/risks creation valide', async () => {
    const res = await apiReq().post('/api/risks').send({
      title: 'Risque test',
      category: 'Sécurité',
      severity: 4,
      probability: 3
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'Risque test', ref: 'RSK-101', gp: 12 });
  });

  it('POST /api/risks sans title -> 422 (validation Zod)', async () => {
    const res = await apiReq().post('/api/risks').send({ category: 'Sécurité' });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(res.body.details ?? {})).toMatch(/title/i);
  });

  it('POST /api/risks invalide probability/gravity -> 422', async () => {
    const p = await apiReq().post('/api/risks').send({ title: 'RR', probability: 6, gravity: 3 });
    expect(p.status).toBe(422);
    const g = await apiReq().post('/api/risks').send({ title: 'RR', probability: 3, gravity: 0 });
    expect(g.status).toBe(422);
  });

  it('GET /api/risks/:id existant et inexistant', async () => {
    store.push({ id: 'x1', title: 'R1', status: 'open', gravity: 2, probability: 2, gp: 4 });
    const ok = await apiReq().get('/api/risks/x1');
    expect(ok.status).toBe(200);
    const ko = await apiReq().get('/api/risks/missing');
    expect(ko.status).toBe(404);
  });

  it('PATCH /api/risks/:id met a jour statut', async () => {
    store.push({ id: 'x2', title: 'R2', status: 'ouvert', gravity: 2, probability: 2, gp: 4 });
    const res = await apiReq().patch('/api/risks/x2').send({ status: 'en_traitement' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('en_traitement');
  });

  it('PATCH /api/risks/:id statut invalide -> 400', async () => {
    store.push({ id: 'x3', title: 'R3', status: 'open', gravity: 2, probability: 2, gp: 4 });
    const res = await apiReq().patch('/api/risks/x3').send({ status: 'invalid_status' });
    expect(res.status).toBe(400);
  });

  it('DELETE /api/risks/:id supprime ou 404', async () => {
    store.push({ id: 'x4', title: 'R4', status: 'open', gravity: 2, probability: 2, gp: 4 });
    const ok = await apiReq().delete('/api/risks/x4');
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ deleted: true });
    const ko = await apiReq().delete('/api/risks/missing');
    expect(ko.status).toBe(404);
  });

  it('GET /api/risks/stats retourne une synthese coherente', async () => {
    store.push(
      { id: 'c1', title: 'c1', status: 'open', category: 'Sécurité', gravity: 5, probability: 3, gp: 15 },
      { id: 'c2', title: 'c2', status: 'open', category: 'Qualité', gravity: 2, probability: 2, gp: 4 }
    );
    const res = await apiReq().get('/api/risks/stats');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.critical).toBe(1);
    expect(res.body.byStatus.open).toBe(2);
  });

  it('POST /api/risks/analyze avec et sans description', async () => {
    const ok = await apiReq().post('/api/risks/analyze').send({ description: 'Risque de chute' });
    expect(ok.status).toBe(200);
    expect(ok.body.category).toBe('Sécurité');
    expect(ok.body.provider).toBe('rules');
    const ko = await apiReq().post('/api/risks/analyze').send({ description: '' });
    expect(ko.status).toBe(400);
  });

  it('sans en-tête utilisateur — 403 contexte organisation (middleware global)', async () => {
    const res = await supertest(app).get('/api/risks');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: TENANT_CONTEXT_REQUIRED_MESSAGE });
  });

  it('GET /api/health sans tenant — toujours autorisé', async () => {
    const res = await supertest(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('GET /api/dashboard/stats sans tenant — 403 (autre monture que /risks)', async () => {
    const res = await supertest(app).get('/api/dashboard/stats');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: TENANT_CONTEXT_REQUIRED_MESSAGE });
  });

  it('POST /api/fds/analyze sans tenant — pas 403 (route exemptée, échec aval attendu)', async () => {
    const res = await supertest(app).post('/api/fds/analyze').send({});
    expect(res.status).not.toBe(403);
  });

  it('GET /api/audit-logs sans tenant — 403 (middleware global)', async () => {
    const res = await supertest(app).get('/api/audit-logs');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: TENANT_CONTEXT_REQUIRED_MESSAGE });
  });

  it.each([
    ['get', '/api/dashboard'],
    ['get', '/api/ai-suggestions'],
    ['get', '/api/sites'],
    ['get', '/api/users'],
    ['get', '/api/notifications'],
    ['get', '/api/conformity'],
    ['get', '/api/reports/summary'],
    ['get', '/api/nonconformities'],
    ['get', '/api/imports'],
    ['get', '/api/habilitations'],
    ['get', '/api/ptw'],
    ['get', '/api/settings/email-notifications'],
    ['get', '/api/controlled-documents'],
    ['get', '/api/export/risks'],
    ['get', '/api/export/actions'],
    ['get', '/api/export/audits'],
    ['post', '/api/compliance/analyze-assist', {}]
  ])('%s %s sans tenant — 403', async (method, path, body) => {
    const st = supertest(app);
    const res =
      method === 'post' ? await st.post(path).send(body ?? {}) : await st.get(path);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: TENANT_CONTEXT_REQUIRED_MESSAGE });
  });
});

describe('ALLOW_X_USER_ID=false — X-User-Id ignoré par attachRequestUser', () => {
  const savedAllow = process.env.ALLOW_X_USER_ID;

  beforeAll(() => {
    process.env.ALLOW_X_USER_ID = 'false';
  });

  afterAll(() => {
    if (savedAllow === undefined) delete process.env.ALLOW_X_USER_ID;
    else process.env.ALLOW_X_USER_ID = savedAllow;
  });

  it('GET /api/risks avec X-User-Id sans JWT — 403 contexte organisation', async () => {
    const res = await supertest(app).get('/api/risks').set('X-User-Id', 'test-api-user');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: TENANT_CONTEXT_REQUIRED_MESSAGE });
  });
});
