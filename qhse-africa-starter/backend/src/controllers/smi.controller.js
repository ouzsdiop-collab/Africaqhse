import { parseSiteIdQuery } from '../lib/siteQueryParam.js';
import { assertQuerySiteAllowed } from '../lib/siteScope.service.js';
import { coalesceQuerySiteIdForList } from '../services/sites.service.js';
import { getSmiOverview } from '../services/smi.service.js';

/**
 * GET /api/smi/overview
 * Retour minimal SMI: scoreGlobal + scoresParNorme.
 */
export async function getOverview(req, res, next) {
  try {
    const rawSiteId = parseSiteIdQuery(req);
    assertQuerySiteAllowed(req.qhseUser, rawSiteId);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, rawSiteId);
    const data = await getSmiOverview({ tenantId: req.qhseTenantId, siteId });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

