import { prisma } from '../db.js';
import { isRequireAuthEnabled } from '../lib/securityConfig.js';
import * as reportingSummaryService from '../services/reportingSummary.service.js';
import { parseSiteIdQuery } from '../lib/siteQueryParam.js';
import { assertQuerySiteAllowed } from '../lib/siteScope.service.js';
import { coalesceQuerySiteIdForList } from '../services/sites.service.js';

/**
 * Période glissante (jours) — optionnel, défaut côté service = 30.
 * @param {import('express').Request} req
 */
function parsePeriodDaysQuery(req) {
  const v = req.query?.periodDays;
  if (v === undefined || v === null) return undefined;
  const s = Array.isArray(v) ? String(v[0]) : String(v);
  const n = Number(s.trim());
  return Number.isFinite(n) ? n : undefined;
}

/** GET /api/reports/summary — synthèse consolidée (permissions : reports:read). */
export async function getSummary(req, res, next) {
  try {
    let tenantId = req.qhseTenantId;
    if (!tenantId && !isRequireAuthEnabled()) {
      const row = await prisma.tenant.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true }
      });
      tenantId = row?.id ?? null;
    }

    const rawSiteId = parseSiteIdQuery(req);
    assertQuerySiteAllowed(req.qhseUser, rawSiteId);
    const siteId = await coalesceQuerySiteIdForList(tenantId, rawSiteId);
    const periodDays = parsePeriodDaysQuery(req);

    const data = await reportingSummaryService.getReportingSummary(tenantId, siteId, {
      emptyIfNoTenant: !tenantId && !isRequireAuthEnabled(),
      ...(periodDays !== undefined ? { periodDays } : {})
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}
