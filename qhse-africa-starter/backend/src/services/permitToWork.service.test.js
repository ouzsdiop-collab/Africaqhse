import { describe, it, expect, beforeEach, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    permitToWork: {
      findMany: vi.fn(),
      create: vi.fn()
    }
  }
}));

vi.mock('../db.js', () => ({ prisma: prismaMock }));

import * as svc from './permitToWork.service.js';

describe('permitToWork.service tenant isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createPermitToWork refuse tenantId manquant (403)', async () => {
    await expect(svc.createPermitToWork('', { type: 'permis' })).rejects.toMatchObject({
      statusCode: 403
    });
    expect(prismaMock.permitToWork.create).not.toHaveBeenCalled();
  });

  it('createPermitToWork crée avec tenantId non-null', async () => {
    prismaMock.permitToWork.findMany.mockResolvedValueOnce([]); // nextRef
    prismaMock.permitToWork.create.mockResolvedValueOnce({
      id: 'p1',
      ref: 'PTW-2026-001',
      type: 'permis',
      status: 'pending',
      siteId: null,
      assignedTo: null,
      validFrom: null,
      validUntil: null,
      signaturesJson: [],
      payload: {},
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z')
    });

    const out = await svc.createPermitToWork('tA', { type: 'permis' });
    expect(out?.ref).toMatch(/^PTW-\d{4}-\d{3}$/);
    expect(prismaMock.permitToWork.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: 'tA' })
      })
    );
  });
});

