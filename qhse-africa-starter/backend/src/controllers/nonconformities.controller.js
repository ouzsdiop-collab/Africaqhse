import * as nonconformitiesService from '../services/nonconformities.service.js';
import { parseSiteIdQuery } from '../lib/siteQueryParam.js';
import { coalesceQuerySiteIdForList } from '../services/sites.service.js';
import {
  clampTrimString,
  FIELD_LIMITS,
  parseListLimit
} from '../lib/validation.js';
import { auditUserIdFromRequest, writeAuditLog } from '../services/auditLog.service.js';

export async function getAll(req, res, next) {
  try {
    const rawSiteId = parseSiteIdQuery(req);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, rawSiteId);
    const limit = parseListLimit(req.query.limit);
    const items = await nonconformitiesService.findAllNonConformities(req.qhseTenantId, {
      siteId,
      limit
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { title, detail, auditRef, siteId } = req.body;
    const t = clampTrimString(title, FIELD_LIMITS.ncTitle);
    const ar = clampTrimString(auditRef, FIELD_LIMITS.auditRef);
    const d =
      detail == null || detail === ''
        ? null
        : clampTrimString(detail, FIELD_LIMITS.ncDetail) || null;

    if (!t || !ar) {
      return res.status(400).json({
        error: 'Champs requis : title, auditRef'
      });
    }

    const result = await nonconformitiesService.createNonConformityWithAction(req.qhseTenantId, {
      title: t,
      detail: d,
      auditRef: ar,
      siteId
    });
    void writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'nonconformities',
      resourceId: String(result.nonConformity.id),
      action: 'create',
      metadata: {
        auditRef: result.nonConformity.auditRef,
        auditId: result.nonConformity.auditId ?? null,
        actionId: result.action?.id ?? null
      }
    });
    res.status(201).json(result);
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}
