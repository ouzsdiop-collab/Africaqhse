import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getRiskStats } from './risks.stats.service.js';
import { countRisksCriticalForKpi, isCriticalRisk } from './kpiCore.service.js';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    risk: { findMany: vi.fn() }
  }
}));

vi.mock('../db.js', () => ({
  prisma: prismaMock
}));

vi.mock('./risks.service.js', () => ({
  findAllRisks: vi.fn()
}));

import { findAllRisks } from './risks.service.js';

describe('risks.stats.service — alignement critique avec kpiCore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getRiskStats.critical === filtre isCriticalRisk sur les lignes renvoyées', async () => {
    const rows = [
      { status: 'open', category: 'A', severity: 'Critique', gravity: 2, probability: 2, gp: 4 },
      { status: 'open', category: 'B', severity: 2, gravity: 4, probability: 4, gp: 15 },
      { status: 'open', category: 'C', severity: 3, gravity: 3, probability: 3, gp: 9 }
    ];
    findAllRisks.mockResolvedValueOnce(rows);
    const stats = await getRiskStats('tenant_t', {});
    const expected = rows.filter(isCriticalRisk).length;
    expect(stats.critical).toBe(expected);
    expect(stats.critical).toBe(2);
  });

  it('countRisksCriticalForKpi (dashboard) même résultat que getRiskStats sans filtres status/cat', async () => {
    const dbRows = [
      { gp: 15, severity: 2, probability: 2, gravity: 2 },
      { gp: 9, severity: 3, probability: 3, gravity: 3 },
      { gp: 4, severity: 4, probability: 1, gravity: 4 }
    ];
    prismaMock.risk.findMany.mockResolvedValueOnce(dbRows);
    findAllRisks.mockResolvedValueOnce(
      dbRows.map((r) => ({
        status: 'open',
        category: 'Z',
        ...r,
        gravity: r.gravity ?? r.severity ?? null,
        gp: r.gp ?? (r.probability != null && r.gravity != null ? r.probability * r.gravity : null)
      }))
    );
    const a = await countRisksCriticalForKpi('tenant_t', null);
    const b = await getRiskStats('tenant_t', {});
    expect(a).toBe(b.critical);
  });
});
