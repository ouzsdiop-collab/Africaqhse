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
    const rawSiteId = parseSiteIdQuery(req);
    assertQuerySiteAllowed(req.qhseUser, rawSiteId);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, rawSiteId);
    const periodDays = parsePeriodDaysQuery(req);

    const data = await reportingSummaryService.getReportingSummary(req.qhseTenantId, siteId, {
      ...(periodDays !== undefined ? { periodDays } : {})
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}
