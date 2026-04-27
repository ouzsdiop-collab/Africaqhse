import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TENANT_CONTEXT_REQUIRED_MESSAGE } from '../lib/tenantConstants.js';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    importHistory: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn()
    }
  }
}));

vi.mock('../db.js', () => ({ prisma: prismaMock }));

import * as importHistoryService from './importHistory.service.js';

const TENANT = 'tenant_import_1';

const baseSuccessPayload = {
  fileName: 'doc.pdf',
  fileType: 'pdf',
  detectedDocumentType: 'fds',
  suggestedModule: 'risks',
  suggestedModuleLabel: 'Risques',
  confidence: 0.9,
  userId: 'u1',
  userName: 'Test'
};

describe('importHistory.service — création analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createAnalysisSuccessRecord sans tenant → 403', async () => {
    await expect(
      importHistoryService.createAnalysisSuccessRecord({
        ...baseSuccessPayload,
        tenantId: null
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      message: TENANT_CONTEXT_REQUIRED_MESSAGE
    });
    await expect(
      importHistoryService.createAnalysisSuccessRecord({
        ...baseSuccessPayload,
        tenantId: ''
      })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.importHistory.create).not.toHaveBeenCalled();
  });

  it('createAnalysisFailedRecord sans tenant → 403', async () => {
    await expect(
      importHistoryService.createAnalysisFailedRecord({
        tenantId: undefined,
        fileName: 'x.xlsx',
        fileType: 'xlsx',
        errorMessage: 'boom'
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      message: TENANT_CONTEXT_REQUIRED_MESSAGE
    });
    expect(prismaMock.importHistory.create).not.toHaveBeenCalled();
  });

  it('createAnalysisSuccessRecord avec tenant → create avec tenantId non-null', async () => {
    prismaMock.importHistory.create.mockResolvedValueOnce({
      id: 'hist-1',
      tenantId: TENANT
    });
    await importHistoryService.createAnalysisSuccessRecord({
      ...baseSuccessPayload,
      tenantId: TENANT
    });
    expect(prismaMock.importHistory.create).toHaveBeenCalledTimes(1);
    const arg = prismaMock.importHistory.create.mock.calls[0][0];
    expect(arg.data.tenantId).toBe(TENANT);
    expect(arg.data.tenantId).not.toBeNull();
  });

  it('createAnalysisFailedRecord avec tenant → create avec tenantId non-null', async () => {
    prismaMock.importHistory.create.mockResolvedValueOnce({
      id: 'hist-2',
      tenantId: TENANT
    });
    await importHistoryService.createAnalysisFailedRecord({
      tenantId: TENANT,
      fileName: 'bad.pdf',
      fileType: 'pdf',
      errorMessage: 'parse error'
    });
    expect(prismaMock.importHistory.create).toHaveBeenCalledTimes(1);
    const arg = prismaMock.importHistory.create.mock.calls[0][0];
    expect(arg.data.tenantId).toBe(TENANT);
    expect(arg.data.tenantId).not.toBeNull();
  });
});
