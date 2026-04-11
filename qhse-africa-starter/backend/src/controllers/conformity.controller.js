import * as conformityService from '../services/conformity.service.js';
import { auditUserIdFromRequest } from '../services/auditLog.service.js';

export async function list(req, res, next) {
  try {
    const items = await conformityService.listConformityStatuses(req.qhseTenantId);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function patchByRequirementId(req, res, next) {
  try {
    const requirementId =
      typeof req.params.requirementId === 'string' ? req.params.requirementId.trim() : '';
    if (!requirementId) {
      return res.status(400).json({ error: 'Identifiant d’exigence requis' });
    }
    const { status, siteId: siteIdRaw } = req.body;
    const siteId =
      siteIdRaw === undefined || siteIdRaw === '' || siteIdRaw === null ? null : String(siteIdRaw).trim();
    const row = await conformityService.upsertConformityStatus(req.qhseTenantId, requirementId, {
      status,
      siteId: siteId || null,
      userId: auditUserIdFromRequest(req)
    });
    res.json(row);
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}
