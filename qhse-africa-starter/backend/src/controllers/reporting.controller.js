import * as reportingSummaryService from '../services/reportingSummary.service.js';
import { parseSiteIdQuery } from '../lib/siteQueryParam.js';
import { assertQuerySiteAllowed } from '../lib/siteScope.service.js';
import { coalesceQuerySiteIdForList } from '../services/sites.service.js';

/** GET /api/reports/summary — synthèse consolidée (permissions : reports:read). */
export async function getSummary(req, res, next) {
  try {
    const rawSiteId = parseSiteIdQuery(req);
    assertQuerySiteAllowed(req.qhseUser, rawSiteId);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, rawSiteId);
    const data = await reportingSummaryService.getReportingSummary(req.qhseTenantId, siteId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
