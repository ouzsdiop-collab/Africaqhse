import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { prismaMock, assertSiteMock } = vi.hoisted(() => ({
  prismaMock: {
    action: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn()
    },
    tenantMember: {
      findUnique: vi.fn()
    },
    user: {
      findUnique: vi.fn()
    },
    incident: {
      findFirst: vi.fn()
    }
  },
  assertSiteMock: vi.fn()
}));

vi.mock('../db.js', () => ({ prisma: prismaMock }));
vi.mock('./sites.service.js', () => ({
  assertSiteExistsOrNull: assertSiteMock
}));

import * as actionsService from './actions.service.js';

const TENANT = 't_org_1';

describe('actions.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertSiteMock.mockResolvedValue(null);
  });

  describe('createAction', () => {
    it('crée une action sans assigné ni incident', async () => {
      const row = {
        id: 'a1',
        title: 'T',
        status: 'À lancer',
        assignee: null,
        incident: null
      };
      prismaMock.action.create.mockResolvedValueOnce(row);

      const out = await actionsService.createAction(TENANT, {
        title: 'T',
        detail: '',
        status: 'À lancer'
      });

      expect(out).toEqual(row);
      expect(prismaMock.action.create).toHaveBeenCalled();
    });

    it('résout assigneeId et enrichit owner depuis l’utilisateur', async () => {
      prismaMock.tenantMember.findUnique.mockResolvedValueOnce({
        user: { id: 'u1', name: 'Alice', email: 'a@test', role: 'QHSE' }
      });
      prismaMock.action.create.mockResolvedValueOnce({
        id: 'a2',
        assignee: { id: 'u1', name: 'Alice', email: 'a@test', role: 'QHSE' },
        incident: null
      });

      await actionsService.createAction(TENANT, {
        title: 'T',
        status: 'À lancer',
        assigneeId: 'u1'
      });

      expect(prismaMock.tenantMember.findUnique).toHaveBeenCalled();
      expect(prismaMock.action.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ assigneeId: 'u1', owner: 'Alice' })
        })
      );
    });

    it('rejette un assigné inexistant', async () => {
      prismaMock.tenantMember.findUnique.mockResolvedValueOnce(null);
      await expect(
        actionsService.createAction(TENANT, {
          title: 'T',
          status: 'À lancer',
          assigneeId: 'ghost'
        })
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(prismaMock.action.create).not.toHaveBeenCalled();
    });

    it('vérifie l’incident lié via Prisma', async () => {
      prismaMock.incident.findFirst.mockResolvedValueOnce({ id: 'inc-1' });
      prismaMock.action.create.mockResolvedValueOnce({
        id: 'a3',
        assignee: null,
        incident: { id: 'inc-1', ref: 'INC-1' }
      });

      await actionsService.createAction(TENANT, {
        title: 'T',
        status: 'À lancer',
        incidentId: 'inc-1'
      });

      expect(prismaMock.incident.findFirst).toHaveBeenCalled();
      expect(prismaMock.action.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ incidentId: 'inc-1' })
        })
      );
    });
  });

  describe('findOverdueActions', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('retourne les actions dont l’échéance est dépassée (Date mockée)', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-10T12:00:00.000Z'));

      prismaMock.action.findMany.mockResolvedValueOnce([
        {
          id: 'late',
          status: 'À lancer',
          dueDate: new Date('2026-04-01T00:00:00.000Z'),
          assignee: null,
          incident: null
        },
        {
          id: 'ok',
          status: 'À lancer',
          dueDate: new Date('2026-05-01T00:00:00.000Z'),
          assignee: null,
          incident: null
        }
      ]);

      const out = await actionsService.findOverdueActions(TENANT, { limit: 50 });
      expect(out.map((r) => r.id)).toEqual(['late']);
    });

    it('inclut une action ouverte avec statut contenant « retard »', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-10T12:00:00.000Z'));

      prismaMock.action.findMany.mockResolvedValueOnce([
        {
          id: 'st',
          status: 'En retard',
          dueDate: null,
          assignee: null,
          incident: null
        }
      ]);

      const out = await actionsService.findOverdueActions(TENANT);
      expect(out).toHaveLength(1);
    });
  });

  describe('updateAction (updateActionFields)', () => {
    it('met à jour le statut', async () => {
      prismaMock.action.findFirst.mockResolvedValueOnce({ id: 'a1' });
      prismaMock.action.updateMany.mockResolvedValueOnce({ count: 1 });
      prismaMock.action.findFirst.mockResolvedValueOnce({
        id: 'a1',
        status: 'Terminé',
        assignee: null,
        incident: null
      });

      const out = await actionsService.updateActionFields(TENANT, 'a1', {
        status: 'Terminé'
      });

      expect(out.status).toBe('Terminé');
      expect(prismaMock.action.updateMany).toHaveBeenCalled();
    });

    it('rejette si aucun champ à mettre à jour', async () => {
      prismaMock.action.findFirst.mockResolvedValueOnce({ id: 'a1' });
      await expect(
        actionsService.updateActionFields(TENANT, 'a1', {})
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(prismaMock.action.updateMany).not.toHaveBeenCalled();
    });

    it('rejette si l’action n’existe pas dans le tenant', async () => {
      prismaMock.action.findFirst.mockResolvedValueOnce(null);
      await expect(
        actionsService.updateActionFields(TENANT, 'missing', { status: 'X' })
      ).rejects.toMatchObject({ code: 'P2025' });
    });

    it('rejette proprement si updateMany count=0 (write non effectué)', async () => {
      prismaMock.action.findFirst.mockResolvedValueOnce({ id: 'a1' });
      prismaMock.action.updateMany.mockResolvedValueOnce({ count: 0 });
      await expect(
        actionsService.updateActionFields(TENANT, 'a1', { status: 'X' })
      ).rejects.toMatchObject({ code: 'P2025' });
    });
  });
});
