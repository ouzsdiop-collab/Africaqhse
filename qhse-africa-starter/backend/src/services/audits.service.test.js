import { describe, it, expect, beforeEach, vi } from 'vitest';

const { prismaMock, assertSiteMock } = vi.hoisted(() => ({
  prismaMock: {
    audit: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    }
  },
  assertSiteMock: vi.fn()
}));

vi.mock('../db.js', () => ({ prisma: prismaMock }));
vi.mock('./sites.service.js', () => ({
  assertSiteExistsOrNull: assertSiteMock
}));

import * as auditsService from './audits.service.js';

const TENANT = 't_org_1';

describe('audits.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertSiteMock.mockResolvedValue(null);
  });

  describe('createAudit', () => {
    it('crée un audit avec checklist optionnelle', async () => {
      assertSiteMock.mockResolvedValueOnce('s1');
      const created = {
        id: 'aud-1',
        ref: 'AUD-1',
        site: 'Site',
        siteId: 's1',
        score: 85,
        status: 'draft',
        checklist: { a: 1 }
      };
      prismaMock.audit.create.mockResolvedValueOnce(created);

      const out = await auditsService.createAudit(TENANT, {
        ref: 'AUD-1',
        site: 'Site',
        siteId: 's1',
        score: '85',
        status: 'draft',
        checklist: { a: 1 }
      });

      expect(out).toEqual(created);
      expect(prismaMock.audit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ref: 'AUD-1',
          site: 'Site',
          siteId: 's1',
          score: 85,
          status: 'draft',
          checklist: { a: 1 }
        })
      });
    });

    it('rejette si le site est invalide', async () => {
      const err = new Error('Site introuvable');
      err.statusCode = 404;
      assertSiteMock.mockRejectedValueOnce(err);

      await expect(
        auditsService.createAudit(TENANT, {
          ref: 'A',
          site: 'S',
          siteId: 'x',
          score: 1,
          status: 'ok'
        })
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(prismaMock.audit.create).not.toHaveBeenCalled();
    });
  });

  describe('findAllAudits', () => {
    it('liste sans siteId', async () => {
      prismaMock.audit.findMany.mockResolvedValueOnce([]);
      await auditsService.findAllAudits(TENANT);
      expect(prismaMock.audit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: TENANT }
        })
      );
    });

    it('filtre par siteId', async () => {
      prismaMock.audit.findMany.mockResolvedValueOnce([]);
      await auditsService.findAllAudits(TENANT, { siteId: 'z1' });
      expect(prismaMock.audit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: TENANT, siteId: 'z1' }
        })
      );
    });
  });

  describe('updateAuditScore', () => {
    it('met à jour le score quand l’audit existe', async () => {
      prismaMock.audit.findFirst.mockResolvedValueOnce({ id: 'aud-1' });
      prismaMock.audit.update.mockResolvedValueOnce({
        id: 'aud-1',
        score: 72
      });

      const out = await auditsService.updateAuditScore(TENANT, 'aud-1', 71.6);
      expect(out.score).toBe(72);
      expect(prismaMock.audit.update).toHaveBeenCalledWith({
        where: { id: 'aud-1' },
        data: { score: 72 }
      });
    });

    it('rejette un score non numérique', async () => {
      await expect(
        auditsService.updateAuditScore(TENANT, 'aud-1', 'abc')
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(prismaMock.audit.findFirst).not.toHaveBeenCalled();
    });

    it('rejette un id vide', async () => {
      await expect(
        auditsService.updateAuditScore(TENANT, '  ', 10)
      ).rejects.toMatchObject({ code: 'P2025' });
    });

    it('rejette si l’audit n’existe pas pour le tenant', async () => {
      prismaMock.audit.findFirst.mockResolvedValueOnce(null);
      await expect(
        auditsService.updateAuditScore(TENANT, 'nope', 50)
      ).rejects.toMatchObject({ code: 'P2025' });
      expect(prismaMock.audit.update).not.toHaveBeenCalled();
    });
  });
});
