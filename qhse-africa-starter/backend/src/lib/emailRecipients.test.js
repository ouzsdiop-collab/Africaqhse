import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db.js', () => ({
  prisma: {
    tenantMember: {
      findMany: vi.fn()
    }
  }
}));

import { prisma } from '../db.js';
import { fetchPilotageRecipientEmailsForTenant } from './emailRecipients.js';

describe('fetchPilotageRecipientEmailsForTenant', () => {
  beforeEach(() => {
    vi.mocked(prisma.tenantMember.findMany).mockReset();
  });

  it('ne interroge pas la base si tenant vide', async () => {
    await expect(fetchPilotageRecipientEmailsForTenant('')).resolves.toEqual([]);
    await expect(fetchPilotageRecipientEmailsForTenant(null)).resolves.toEqual([]);
    expect(prisma.tenantMember.findMany).not.toHaveBeenCalled();
  });

  it('ne retient que les rôles pilotage (User.role)', async () => {
    vi.mocked(prisma.tenantMember.findMany).mockResolvedValue([
      { user: { email: 'admin@org.fr', name: 'A', role: 'ADMIN' } },
      { user: { email: 'mem@org.fr', name: 'M', role: 'MEMBER' } },
      { user: { email: 'qhse@org.fr', name: 'Q', role: 'QHSE' } }
    ]);
    const r = await fetchPilotageRecipientEmailsForTenant('tenant-1');
    expect(prisma.tenantMember.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      include: { user: { select: { email: true, name: true, role: true } } }
    });
    expect(r.map((x) => x.email).sort()).toEqual(['admin@org.fr', 'qhse@org.fr']);
  });
});
