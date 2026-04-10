import { describe, it, expect, beforeEach, vi } from 'vitest';

const { prismaMock, assertSiteMock } = vi.hoisted(() => ({
  prismaMock: {
    incident: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  },
  assertSiteMock: vi.fn()
}));

vi.mock('../db.js', () => ({ prisma: prismaMock }));
vi.mock('./sites.service.js', () => ({
  assertSiteExistsOrNull: assertSiteMock
}));

import * as incidentsService from './incidents.service.js';

const TENANT = 't_org_1';

describe('incidents.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertSiteMock.mockResolvedValue(null);
  });

  describe('createIncident', () => {
    it('crée un incident avec des données valides', async () => {
      assertSiteMock.mockResolvedValueOnce('site-1');
      const created = {
        id: 'inc-1',
        ref: 'INC-201',
        type: 'blessure',
        site: 'Site A',
        siteId: 'site-1',
        severity: 'high',
        status: 'Nouveau'
      };
      prismaMock.incident.create.mockResolvedValueOnce(created);

      const out = await incidentsService.createIncident(TENANT, {
        ref: 'INC-201',
        type: 'blessure',
        site: 'Site A',
        siteId: 'site-1',
        severity: 'high',
        description: 'desc',
        status: 'Nouveau'
      });

      expect(out).toEqual(created);
      expect(assertSiteMock).toHaveBeenCalledWith(TENANT, 'site-1');
      expect(prismaMock.incident.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: TENANT,
          ref: 'INC-201',
          type: 'blessure',
          site: 'Site A',
          siteId: 'site-1',
          severity: 'high',
          description: 'desc',
          status: 'Nouveau'
        })
      });
    });

    it('rejette si le site est invalide (assertSiteExistsOrNull)', async () => {
      const err = new Error('Site introuvable');
      err.statusCode = 404;
      assertSiteMock.mockRejectedValueOnce(err);

      await expect(
        incidentsService.createIncident(TENANT, {
          ref: 'INC-1',
          type: 'x',
          site: 'S',
          siteId: 'bad',
          severity: 'low'
        })
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(prismaMock.incident.create).not.toHaveBeenCalled();
    });

    it('propage une erreur Prisma si la création échoue (données manquantes côté DB)', async () => {
      assertSiteMock.mockResolvedValueOnce(null);
      const dbErr = new Error('Required field missing');
      dbErr.code = 'P2002';
      prismaMock.incident.create.mockRejectedValueOnce(dbErr);

      await expect(
        incidentsService.createIncident(TENANT, {
          ref: '',
          type: '',
          site: '',
          severity: ''
        })
      ).rejects.toMatchObject({ code: 'P2002' });
    });
  });

  describe('findAllIncidents', () => {
    it('liste sans filtre siteId', async () => {
      prismaMock.incident.findMany.mockResolvedValueOnce([]);
      await incidentsService.findAllIncidents(TENANT, {});
      expect(prismaMock.incident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: TENANT },
          orderBy: { createdAt: 'desc' }
        })
      );
    });

    it('filtre par siteId lorsque fourni', async () => {
      prismaMock.incident.findMany.mockResolvedValueOnce([]);
      await incidentsService.findAllIncidents(TENANT, { siteId: '  sid  ' });
      expect(prismaMock.incident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: TENANT, siteId: 'sid' }
        })
      );
    });
  });

  describe('updateIncident (updateIncidentByRef)', () => {
    it('met à jour le statut pour un tenant', async () => {
      const updated = { id: '1', ref: 'INC-1', status: 'Clos' };
      prismaMock.incident.update.mockResolvedValueOnce(updated);

      const out = await incidentsService.updateIncidentByRef(TENANT, 'INC-1', {
        status: 'Clos'
      });

      expect(out).toEqual(updated);
      expect(prismaMock.incident.update).toHaveBeenCalledWith({
        where: { tenantId_ref: { tenantId: TENANT, ref: 'INC-1' } },
        data: { status: 'Clos' }
      });
    });

    it('met à jour plusieurs champs', async () => {
      prismaMock.incident.update.mockResolvedValueOnce({});
      await incidentsService.updateIncidentByRef(TENANT, 'INC-2', {
        status: 'En cours',
        causes: 'Racine',
        causeCategory: 'humain',
        location: 'L1',
        responsible: 'Bob',
        photosJson: '[]'
      });
      expect(prismaMock.incident.update).toHaveBeenCalledWith({
        where: { tenantId_ref: { tenantId: TENANT, ref: 'INC-2' } },
        data: {
          status: 'En cours',
          causes: 'Racine',
          causeCategory: 'humain',
          location: 'L1',
          responsible: 'Bob',
          photosJson: '[]'
        }
      });
    });

    it('rejette une causeCategory invalide', async () => {
      await expect(
        incidentsService.updateIncidentByRef(TENANT, 'INC-1', {
          causeCategory: 'invalide'
        })
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(prismaMock.incident.update).not.toHaveBeenCalled();
    });

    it('rejette si aucun champ valide', async () => {
      await expect(
        incidentsService.updateIncidentByRef(TENANT, 'INC-1', {})
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('sans tenant : incident introuvable si aucune ligne', async () => {
      prismaMock.incident.findMany.mockResolvedValueOnce([]);
      await expect(
        incidentsService.updateIncidentByRef('', 'INC-99', { status: 'X' })
      ).rejects.toMatchObject({ code: 'P2025' });
    });

    it('sans tenant : conflit si plusieurs lignes même ref', async () => {
      prismaMock.incident.findMany.mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }]);
      await expect(
        incidentsService.updateIncidentByRef('', 'INC-dup', { status: 'X' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('deleteIncident', () => {
    it('supprime par ref avec tenant', async () => {
      prismaMock.incident.delete.mockResolvedValueOnce({ id: '1', ref: 'INC-1' });
      const out = await incidentsService.deleteIncident(TENANT, 'INC-1');
      expect(out).toEqual({ id: '1', ref: 'INC-1' });
      expect(prismaMock.incident.delete).toHaveBeenCalledWith({
        where: { tenantId_ref: { tenantId: TENANT, ref: 'INC-1' } }
      });
    });

    it('rejette une ref vide', async () => {
      await expect(incidentsService.deleteIncident(TENANT, '  ')).rejects.toMatchObject({
        statusCode: 400
      });
      expect(prismaMock.incident.delete).not.toHaveBeenCalled();
    });

    it('sans tenant : introuvable', async () => {
      prismaMock.incident.findMany.mockResolvedValueOnce([]);
      await expect(incidentsService.deleteIncident('', 'INC-x')).rejects.toMatchObject({
        code: 'P2025'
      });
    });
  });
});
