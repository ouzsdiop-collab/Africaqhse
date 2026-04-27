import { describe, it, expect, beforeEach, vi } from 'vitest';

const getReportingSummaryMock = vi.fn();
const coalesceMock = vi.fn();

vi.mock('../services/reportingSummary.service.js', () => ({
  getReportingSummary: (...args) => getReportingSummaryMock(...args)
}));

vi.mock('../services/sites.service.js', () => ({
  coalesceQuerySiteIdForList: (...args) => coalesceMock(...args)
}));

import { getSummary } from './reporting.controller.js';

describe('reporting.controller getSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getReportingSummaryMock.mockResolvedValue({ ok: true });
    coalesceMock.mockResolvedValue(null);
  });

  it('passe req.qhseTenantId à coalesceQuerySiteIdForList et getReportingSummary', async () => {
    const req = {
      qhseTenantId: 'org-tenant-1',
      qhseUser: { role: 'ADMIN' },
      query: {}
    };
    const res = { json: vi.fn() };
    const next = vi.fn();

    await getSummary(req, res, next);

    expect(coalesceMock).toHaveBeenCalledWith('org-tenant-1', null);
    expect(getReportingSummaryMock).toHaveBeenCalledWith(
      'org-tenant-1',
      null,
      expect.objectContaining({})
    );
    expect(getReportingSummaryMock).not.toHaveBeenCalledWith(
      null,
      expect.anything(),
      expect.anything()
    );
    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(next).not.toHaveBeenCalled();
  });

  it('propage siteId coalescé avec le même tenant', async () => {
    coalesceMock.mockResolvedValueOnce('site-xyz');
    const req = {
      qhseTenantId: 'org-tenant-1',
      qhseUser: { role: 'ADMIN' },
      query: { siteId: 'site-xyz' }
    };
    const res = { json: vi.fn() };
    await getSummary(req, res, vi.fn());
    expect(coalesceMock).toHaveBeenCalledWith('org-tenant-1', 'site-xyz');
    expect(getReportingSummaryMock).toHaveBeenCalledWith('org-tenant-1', 'site-xyz', expect.any(Object));
  });
});
