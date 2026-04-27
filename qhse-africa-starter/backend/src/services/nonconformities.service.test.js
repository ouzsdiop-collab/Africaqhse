import { describe, it, expect, beforeEach, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
    audit: { findFirst: vi.fn() },
    nonConformity: { create: vi.fn() },
    action: { create: vi.fn() }
  }
}));

vi.mock('../db.js', () => ({ prisma: prismaMock }));

vi.mock('./sites.service.js', () => ({
  assertSiteExistsOrNull: vi.fn(async () => null)
}));

import * as svc from './nonconformities.service.js';

describe('nonconformities.service tenant isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createNonConformityWithAction refuse tenantId manquant (403)', async () => {
    await expect(
      svc.createNonConformityWithAction(null, {
        title: 'x',
        detail: null,
        auditRef: 'AUD-001',
        siteId: null
      })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('createNonConformityWithAction crée NC + action avec tenantId (pas de null)', async () => {
    prismaMock.$transaction.mockImplementation(async (fn) =>
      fn({
        audit: { findFirst: prismaMock.audit.findFirst },
        nonConformity: { create: prismaMock.nonConformity.create },
        action: { create: prismaMock.action.create }
      })
    );
    prismaMock.audit.findFirst.mockResolvedValueOnce({ id: 'a1', siteId: null });
    prismaMock.nonConformity.create.mockResolvedValueOnce({ id: 'nc1', tenantId: 'tA' });
    prismaMock.action.create.mockResolvedValueOnce({ id: 'act1', tenantId: 'tA' });

    const out = await svc.createNonConformityWithAction('tA', {
      title: 'Titre',
      detail: null,
      auditRef: 'AUD-001',
      siteId: null
    });

    expect(out?.nonConformity?.id).toBe('nc1');
    expect(prismaMock.nonConformity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: 'tA' })
      })
    );
    expect(prismaMock.action.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: 'tA' })
      })
    );
  });
});

