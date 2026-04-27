import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TENANT_CONTEXT_REQUIRED_MESSAGE } from '../lib/tenantConstants.js';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    incident: {
      count: vi.fn(),
      findMany: vi.fn()
    },
    nonConformity: {
      count: vi.fn(),
      findMany: vi.fn()
    },
    action: {
      count: vi.fn(),
      findMany: vi.fn()
    },
    audit: {
      count: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn()
    }
  }
}));

vi.mock('../db.js', () => ({ prisma: prismaMock }));

import * as reportingSummaryService from './reportingSummary.service.js';

const TENANT_A = 'tenant_a';
const TENANT_B = 'tenant_b';

function stubSuccessfulSummaryPipeline() {
  prismaMock.incident.count.mockResolvedValue(0);
  prismaMock.nonConformity.count.mockResolvedValue(0);
  prismaMock.nonConformity.findMany.mockResolvedValue([]);
  prismaMock.action.count.mockResolvedValue(0);
  prismaMock.action.findMany.mockResolvedValue([]);
  prismaMock.audit.count.mockResolvedValue(0);
  prismaMock.audit.aggregate.mockResolvedValue({
    _avg: { score: null },
    _max: { score: null },
    _min: { score: null }
  });
  prismaMock.audit.findMany.mockResolvedValue([]);
  prismaMock.incident.findMany.mockResolvedValue([]);
}

describe('reportingSummary.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubSuccessfulSummaryPipeline();
  });

  it('rejette tenantId absent (403) sauf emptyIfNoTenant', async () => {
    await expect(reportingSummaryService.getReportingSummary(null)).rejects.toMatchObject({
      statusCode: 403,
      message: TENANT_CONTEXT_REQUIRED_MESSAGE
    });
    await expect(reportingSummaryService.getReportingSummary('')).rejects.toMatchObject({
      statusCode: 403
    });

    const empty = await reportingSummaryService.getReportingSummary(null, null, {
      emptyIfNoTenant: true
    });
    expect(empty.counts.incidentsTotal).toBe(0);
  });

  it('chaque count/findMany/aggregate inclut tenantId dans where (vue groupe)', async () => {
    await reportingSummaryService.getReportingSummary(TENANT_A, null);

    expect(prismaMock.incident.count).toHaveBeenCalledWith({
      where: { tenantId: TENANT_A }
    });
    expect(prismaMock.incident.count).toHaveBeenCalledWith({
      where: { tenantId: TENANT_A, createdAt: expect.any(Object) }
    });
    expect(prismaMock.nonConformity.count).toHaveBeenCalledWith({
      where: { tenantId: TENANT_A }
    });
    expect(prismaMock.nonConformity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: TENANT_A }
      })
    );
    expect(prismaMock.action.count).toHaveBeenCalledWith({
      where: { tenantId: TENANT_A }
    });
    expect(prismaMock.action.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: TENANT_A }
      })
    );
    expect(prismaMock.audit.count).toHaveBeenCalledWith({
      where: { tenantId: TENANT_A }
    });
    expect(prismaMock.audit.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: TENANT_A }
      })
    );
    expect(prismaMock.audit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: TENANT_A }
      })
    );
    expect(prismaMock.incident.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: TENANT_A }
      })
    );
  });

  it('filtre optionnel siteId + tenantId (pas de scope vide)', async () => {
    await reportingSummaryService.getReportingSummary(TENANT_A, 'site-1');

    expect(prismaMock.incident.count).toHaveBeenCalledWith({
      where: { tenantId: TENANT_A, siteId: 'site-1' }
    });
  });

  it('vue groupe (siteId null après coalesce hors-tenant) : where toujours borné par tenantId', async () => {
    await reportingSummaryService.getReportingSummary(TENANT_A, null);
    const models = [
      prismaMock.incident,
      prismaMock.nonConformity,
      prismaMock.action,
      prismaMock.audit
    ];
    for (const m of models) {
      for (const [method, fn] of Object.entries(m)) {
        if (typeof fn?.mock?.calls !== 'object') continue;
        for (const call of fn.mock.calls) {
          const arg0 = call[0];
          if (arg0 && typeof arg0 === 'object' && 'where' in arg0) {
            expect(arg0.where.tenantId).toBe(TENANT_A);
          }
        }
      }
    }
  });

  it('tenant B n’utilise pas le filtre tenant A', async () => {
    await reportingSummaryService.getReportingSummary(TENANT_B, null);
    expect(prismaMock.incident.count).toHaveBeenCalledWith({
      where: { tenantId: TENANT_B }
    });
    expect(prismaMock.incident.count).not.toHaveBeenCalledWith({
      where: { tenantId: TENANT_A }
    });
  });
});
