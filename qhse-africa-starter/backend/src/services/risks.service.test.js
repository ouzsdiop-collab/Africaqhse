import { describe, it, expect, beforeEach, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    risk: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
}));

vi.mock('../db.js', () => ({
  prisma: prismaMock
}));

vi.mock('./sites.service.js', () => ({
  assertSiteExistsOrNull: vi.fn(async (v) => (v ? String(v) : null))
}));

import * as risksService from './risks.service.js';

describe('risks.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('findAllRisks construit where/take correctement', async () => {
    prismaMock.risk.findMany.mockResolvedValueOnce([]);
    await risksService.findAllRisks({ status: 'open', category: 'Sécurité', limit: 9999 });
    expect(prismaMock.risk.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 500,
        where: expect.objectContaining({ status: 'open', category: 'Sécurité' })
      })
    );
  });

  it('createRisk normalise severity/probability et persiste', async () => {
    prismaMock.risk.findMany.mockResolvedValueOnce([]);
    prismaMock.risk.create.mockResolvedValueOnce({
      id: 'r1',
      title: 'R1',
      ref: 'RSK-101',
      gravity: 5,
      severity: 5,
      probability: 1,
      gp: 5
    });
    const out = await risksService.createRisk({
      title: 'R1',
      category: 'Sécurité',
      gravity: 5,
      probability: 1
    });
    expect(out.id).toBe('r1');
    expect(prismaMock.risk.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ severity: 5, probability: 1, gp: 5, ref: 'RSK-101' })
      })
    );
  });

  it('updateRiskById met a jour le statut', async () => {
    prismaMock.risk.findUnique.mockResolvedValueOnce({ id: 'r1', probability: 3, gravity: 4, severity: 4 });
    prismaMock.risk.update.mockResolvedValueOnce({ id: 'r1', status: 'en_traitement' });
    const out = await risksService.updateRiskById('r1', { status: 'en_traitement' });
    expect(out.status).toBe('en_traitement');
  });

  it('updateRiskById rejette un patch vide', async () => {
    await expect(risksService.updateRiskById('r1', {})).rejects.toMatchObject({ statusCode: 400 });
  });

  it('deleteRiskById supprime un risque', async () => {
    prismaMock.risk.delete.mockResolvedValueOnce({ id: 'r1', title: 'R1' });
    const out = await risksService.deleteRiskById('r1');
    expect(out).toEqual({ deleted: true });
  });
});
