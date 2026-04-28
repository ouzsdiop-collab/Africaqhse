import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDashboardStats, buildDashboardTimeseries } from './dashboard.service.js';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    incident: { count: vi.fn(), findMany: vi.fn() },
    risk: { count: vi.fn(), findMany: vi.fn() },
    action: { count: vi.fn(), findMany: vi.fn() },
    audit: { groupBy: vi.fn(), findMany: vi.fn() },
    nonConformity: { findMany: vi.fn() },
    product: { findMany: vi.fn() }
  }
}));

vi.mock('../db.js', () => ({
  prisma: prismaMock
}));

vi.mock('./kpiCore.service.js', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    countNonConformitiesOpenHeuristic: vi.fn(async () => 0)
  };
});

describe('dashboard.service — overdueActionItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.incident.count.mockResolvedValue(0);
    prismaMock.risk.count.mockResolvedValue(0);
    prismaMock.risk.findMany.mockResolvedValue([]);
    prismaMock.action.count.mockResolvedValue(0);
    prismaMock.audit.groupBy.mockResolvedValue([]);
    prismaMock.incident.findMany.mockResolvedValue([]);
    prismaMock.audit.findMany.mockResolvedValue([]);
    prismaMock.nonConformity.findMany.mockResolvedValue([]);
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.action.findMany.mockResolvedValue([
      {
        id: 'action_cuid_1',
        title: 'Corriger balisage',
        detail: null,
        status: 'En cours',
        owner: 'HSE',
        dueDate: new Date(Date.now() - 2 * 86400000),
        createdAt: new Date(),
        siteId: 'site_abc'
      }
    ]);
  });

  it('chaque entrée overdueActionItems inclut id, champs navigation et ref/priority null si absents', async () => {
    const out = await getDashboardStats('tenant_test', null);
    expect(out.overdueActionItems.length).toBeGreaterThan(0);
    const first = out.overdueActionItems[0];
    expect(first.id).toBe('action_cuid_1');
    expect(first.title).toBe('Corriger balisage');
    expect(first.status).toBe('En cours');
    expect(first.siteId).toBe('site_abc');
    expect(first.ref).toBeNull();
    expect(first.priority).toBeNull();
    expect(first).toHaveProperty('dueDate');
    expect(first).toHaveProperty('createdAt');
  });

  it('expose timeseries avec 6 mois (valeurs à 0 si aucune donnée)', async () => {
    const out = await getDashboardStats('tenant_test', null);
    expect(out.timeseries).toBeDefined();
    expect(out.timeseries.monthCount).toBe(6);
    expect(out.timeseries.incidentsByMonth).toHaveLength(6);
    expect(out.timeseries.incidentsByMonth.every((x) => x.value === 0)).toBe(true);
    expect(out.timeseries.auditsScoreByMonth).toHaveLength(6);
    expect(out.timeseries.nonConformitiesByMonth.major).toHaveLength(6);
    expect(out.timeseries.nonConformitiesByMonth.minor).toHaveLength(6);
  });

  it('expose intelligence (additif) avec score/alerts/anomalies/insights', async () => {
    const out = await getDashboardStats('tenant_test', null);
    expect(out.intelligence).toBeDefined();
    expect(typeof out.intelligence.score).toBe('number');
    expect(Array.isArray(out.intelligence.alerts)).toBe(true);
    expect(Array.isArray(out.intelligence.anomalies)).toBe(true);
    expect(Array.isArray(out.intelligence.insights)).toBe(true);
    expect(typeof out.intelligence.generatedAt).toBe('string');
    expect(out.intelligence.dataSource).toBe('api_stats');
  });
});

describe('dashboard.service — timeseries isolation tenant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.incident.findMany.mockResolvedValue([]);
    prismaMock.audit.findMany.mockResolvedValue([]);
    prismaMock.nonConformity.findMany.mockResolvedValue([]);
  });

  it('les requêtes Prisma timeseries filtrent par tenantId (A ≠ B)', async () => {
    const tA = 'tenant_aaaa';
    const tB = 'tenant_bbbb';
    const d1 = new Date('2026-03-15T12:00:00.000Z');
    prismaMock.incident.findMany.mockImplementation((args) => {
      const w = args?.where;
      if (w?.tenantId === tA) {
        return Promise.resolve([{ createdAt: d1 }]);
      }
      return Promise.resolve([]);
    });

    const a = await buildDashboardTimeseries(tA, null, 6);
    const b = await buildDashboardTimeseries(tB, null, 6);

    const hitA = a.incidentsByMonth.some((x) => x.value > 0);
    const hitB = b.incidentsByMonth.some((x) => x.value > 0);
    expect(hitA).toBe(true);
    expect(hitB).toBe(false);
  });

  it('mois sans enregistrement incident : valeur 0 sur la série', async () => {
    const tid = 'tenant_z';
    const dMar = new Date('2026-03-10T00:00:00.000Z');
    prismaMock.incident.findMany.mockResolvedValue([{ createdAt: dMar }]);

    const out = await buildDashboardTimeseries(tid, null, 6);
    const idxWithData = out.incidentsByMonth.findIndex((x) => x.value > 0);
    expect(idxWithData).toBeGreaterThanOrEqual(0);
    expect(out.incidentsByMonth.some((x) => x.value === 0)).toBe(true);
  });
});
