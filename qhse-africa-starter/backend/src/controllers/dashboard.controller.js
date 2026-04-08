import * as dashboardService from '../services/dashboard.service.js';
import { parseSiteIdQuery } from '../lib/siteQueryParam.js';
import { assertQuerySiteAllowed } from '../lib/siteScope.service.js';
import { coalesceQuerySiteIdForList } from '../services/sites.service.js';

export async function getStats(req, res, next) {
  try {
    const rawSiteId = parseSiteIdQuery(req);
    assertQuerySiteAllowed(req.qhseUser, rawSiteId);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, rawSiteId);
    const data = await dashboardService.getDashboardStats(req.qhseTenantId, siteId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
