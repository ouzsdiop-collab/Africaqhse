import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const store = [];

function applyFilters(items, filters) {
  return items.filter((r) => {
    if (filters.status && r.status !== filters.status) return false;
    if (filters.category && r.category !== filters.category) return false;
    return true;
  });
}

vi.mock('../services/sites.service.js', () => ({
  coalesceQuerySiteIdForList: vi.fn(async (siteId) => siteId ?? null),
  assertSiteExistsOrNull: vi.fn(async (siteId) => siteId ?? null)
}));

vi.mock('../services/auditLog.service.js', () => ({
  auditUserIdFromRequest: vi.fn(() => null),
  writeAuditLog: vi.fn(async () => {})
}));

vi.mock('../services/riskAnalyze.service.js', () => ({
  analyzeRiskDescription: vi.fn((description) => ({
    category: String(description).includes('chute') ? 'Sécurité' : 'Autre',
    severity: 'moyenne',
    probability: 'moyenne',
    suggestedActions: ['Action démo']
  }))
}));

vi.mock('../services/risks.service.js', () => ({
  findAllRisks: vi.fn(async (filters = {}) => applyFilters(store, filters)),
  findRiskById: vi.fn(async (id) => store.find((x) => x.id === id) || null),
  getRiskStats: vi.fn(async () => {
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
  createRisk: vi.fn(async (data) => {
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
  updateRiskById: vi.fn(async (id, patch) => {
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
  deleteRiskById: vi.fn(async (id) => {
    const idx = store.findIndex((x) => x.id === id);
    if (idx < 0) {
      const err = new Error('not found');
      err.code = 'P2025';
      throw err;
    }
    store.splice(idx, 1);
    return { deleted: true };
  })
}));

const { app } = await import('../server.js');

describe('risks routes', () => {
  beforeEach(() => {
    store.splice(0, store.length);
  });

  it('GET /api/risks retourne un tableau', async () => {
    const res = await request(app).get('/api/risks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/risks filtre par status et category', async () => {
    store.push(
      { id: '1', title: 'a', status: 'ouvert', category: 'Sécurité', gravity: 3, probability: 3, gp: 9 },
      { id: '2', title: 'b', status: 'ferme', category: 'Qualité', gravity: 2, probability: 2, gp: 4 }
    );
    const resStatus = await request(app).get('/api/risks?status=ouvert');
    expect(resStatus.status).toBe(200);
    expect(resStatus.body).toHaveLength(1);
    const resCat = await request(app).get('/api/risks?category=Sécurité');
    expect(resCat.status).toBe(200);
    expect(resCat.body).toHaveLength(1);
  });

  it('POST /api/risks creation valide', async () => {
    const res = await request(app).post('/api/risks').send({
      title: 'Risque test',
      category: 'Sécurité',
      severity: 4,
      probability: 3
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'Risque test', ref: 'RSK-101', gp: 12 });
  });

  it('POST /api/risks sans title -> 400', async () => {
    const res = await request(app).post('/api/risks').send({ category: 'Sécurité' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('title');
  });

  it('POST /api/risks invalide probability/gravity -> 400', async () => {
    const p = await request(app).post('/api/risks').send({ title: 'R', probability: 6, gravity: 3 });
    expect(p.status).toBe(400);
    const g = await request(app).post('/api/risks').send({ title: 'R', probability: 3, gravity: 0 });
    expect(g.status).toBe(400);
  });

  it('GET /api/risks/:id existant et inexistant', async () => {
    store.push({ id: 'x1', title: 'R1', status: 'open', gravity: 2, probability: 2, gp: 4 });
    const ok = await request(app).get('/api/risks/x1');
    expect(ok.status).toBe(200);
    const ko = await request(app).get('/api/risks/missing');
    expect(ko.status).toBe(404);
  });

  it('PATCH /api/risks/:id met a jour statut', async () => {
    store.push({ id: 'x2', title: 'R2', status: 'ouvert', gravity: 2, probability: 2, gp: 4 });
    const res = await request(app).patch('/api/risks/x2').send({ status: 'en_traitement' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('en_traitement');
  });

  it('PATCH /api/risks/:id statut invalide -> 400', async () => {
    store.push({ id: 'x3', title: 'R3', status: 'open', gravity: 2, probability: 2, gp: 4 });
    const res = await request(app).patch('/api/risks/x3').send({ status: 'invalid_status' });
    expect(res.status).toBe(400);
  });

  it('DELETE /api/risks/:id supprime ou 404', async () => {
    store.push({ id: 'x4', title: 'R4', status: 'open', gravity: 2, probability: 2, gp: 4 });
    const ok = await request(app).delete('/api/risks/x4');
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ deleted: true });
    const ko = await request(app).delete('/api/risks/missing');
    expect(ko.status).toBe(404);
  });

  it('GET /api/risks/stats retourne une synthese coherente', async () => {
    store.push(
      { id: 'c1', title: 'c1', status: 'open', category: 'Sécurité', gravity: 5, probability: 3, gp: 15 },
      { id: 'c2', title: 'c2', status: 'open', category: 'Qualité', gravity: 2, probability: 2, gp: 4 }
    );
    const res = await request(app).get('/api/risks/stats');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.critical).toBe(1);
    expect(res.body.byStatus.open).toBe(2);
  });

  it('POST /api/risks/analyze avec et sans description', async () => {
    const ok = await request(app).post('/api/risks/analyze').send({ description: 'Risque de chute' });
    expect(ok.status).toBe(200);
    expect(ok.body.category).toBe('Sécurité');
    const ko = await request(app).post('/api/risks/analyze').send({ description: '' });
    expect(ko.status).toBe(400);
  });
});
