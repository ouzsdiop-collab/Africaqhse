import { analyzeRiskDescriptionAsync } from '../services/riskAnalyze.service.js';
import * as risksService from '../services/risks.service.js';
import { parseSiteIdQuery } from '../lib/siteQueryParam.js';
import { coalesceQuerySiteIdForList } from '../services/sites.service.js';
import { clampTrimString, FIELD_LIMITS, parseListLimit } from '../lib/validation.js';
import { auditUserIdFromRequest, writeAuditLog } from '../services/auditLog.service.js';
const ALLOWED_RISK_STATUS = new Set(['open', 'ouvert', 'en_traitement', 'clos', 'closed']);

function parseBoundedInt(value, field, res) {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1 || n > 5) {
    res.status(400).json({ error: `${field} doit être entre 1 et 5` });
    return null;
  }
  return Math.round(n);
}

export async function getAll(req, res, next) {
  try {
    const rawSiteId = parseSiteIdQuery(req);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, rawSiteId);
    const limit = parseListLimit(req.query.limit);
    const q =
      req.query.q != null && String(req.query.q).trim()
        ? String(req.query.q).trim()
        : null;
    const status =
      req.query.status != null && String(req.query.status).trim()
        ? String(req.query.status).trim()
        : null;
    const category =
      req.query.category != null && String(req.query.category).trim()
        ? String(req.query.category).trim()
        : null;
    const items = await risksService.findAllRisks(req.qhseTenantId, {
      siteId,
      limit,
      q,
      status,
      category
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    if (!id) return res.status(400).json({ error: 'Identifiant risque requis' });
    const row = await risksService.findRiskById(req.qhseTenantId, id);
    if (!row) return res.status(404).json({ error: 'Risque introuvable' });
    res.json(row);
  } catch (err) {
    next(err);
  }
}

export async function getStats(req, res, next) {
  try {
    const rawSiteId = parseSiteIdQuery(req);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, rawSiteId);
    const status =
      req.query.status != null && String(req.query.status).trim()
        ? String(req.query.status).trim()
        : null;
    const category =
      req.query.category != null && String(req.query.category).trim()
        ? String(req.query.category).trim()
        : null;
    const stats = await risksService.getRiskStats(req.qhseTenantId, { siteId, status, category });
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const title = clampTrimString(req.body?.title, FIELD_LIMITS.riskTitle);
    if (!title) return res.status(400).json({ error: 'Champ title requis' });
    const description =
      req.body?.description == null || req.body.description === ''
        ? null
        : clampTrimString(req.body.description, FIELD_LIMITS.riskDescription) || null;
    const category =
      req.body?.category == null || req.body.category === ''
        ? null
        : clampTrimString(req.body.category, 120) || null;
    const status =
      req.body?.status == null || req.body.status === ''
        ? 'open'
        : clampTrimString(req.body.status, 80) || 'open';
    if (!ALLOWED_RISK_STATUS.has(status)) {
      return res.status(400).json({ error: 'status invalide' });
    }
    const probability = parseBoundedInt(req.body?.probability, 'probability', res);
    if (probability === null) return;
    const gravity = parseBoundedInt(req.body?.gravity ?? req.body?.severity, 'gravity', res);
    if (gravity === null) return;
    const owner =
      req.body?.owner == null || req.body.owner === ''
        ? null
        : clampTrimString(req.body.owner, 200) || null;
    const created = await risksService.createRisk(req.qhseTenantId, {
      title,
      description,
      category,
      severity: gravity,
      gravity,
      probability,
      status,
      owner,
      siteId: req.body?.siteId
    });
    void writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'risks',
      resourceId: created.id,
      action: 'create',
      metadata: { title: created.title, status: created.status }
    });
    res.status(201).json(created);
  } catch (err) {
    if (err.statusCode === 400) return res.status(400).json({ error: err.message });
    if (err.statusCode === 403) return res.status(403).json({ error: err.message });
    next(err);
  }
}

export async function patchById(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    if (!id) return res.status(400).json({ error: 'Identifiant risque requis' });

    /** @type {Record<string, unknown>} */
    const patch = {};
    if ('title' in req.body) {
      const t = clampTrimString(req.body.title, FIELD_LIMITS.riskTitle);
      if (t) patch.title = t;
    }
    if ('description' in req.body) {
      patch.description =
        req.body.description == null || req.body.description === ''
          ? null
          : clampTrimString(req.body.description, FIELD_LIMITS.riskDescription) || null;
    }
    if ('category' in req.body) {
      patch.category =
        req.body.category == null || req.body.category === ''
          ? null
          : clampTrimString(req.body.category, 120) || null;
    }
    if ('severity' in req.body) patch.severity = req.body.severity;
    if ('gravity' in req.body) patch.gravity = req.body.gravity;
    if ('probability' in req.body) patch.probability = req.body.probability;
    if ('status' in req.body) {
      const st = clampTrimString(req.body.status, 80);
      if (st) {
        if (!ALLOWED_RISK_STATUS.has(st)) return res.status(400).json({ error: 'status invalide' });
        patch.status = st;
      }
    }
    if ('owner' in req.body) {
      patch.owner =
        req.body.owner == null || req.body.owner === ''
          ? null
          : clampTrimString(req.body.owner, 200) || null;
    }
    if ('siteId' in req.body) patch.siteId = req.body.siteId;

    const updated = await risksService.updateRiskById(req.qhseTenantId, id, patch);
    void writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'risks',
      resourceId: updated.id,
      action: 'update',
      metadata: { title: updated.title, status: updated.status }
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Risque introuvable' });
    if (err.statusCode === 400) return res.status(400).json({ error: err.message });
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    if (!id) return res.status(400).json({ error: 'Identifiant risque requis' });
    const deleted = await risksService.deleteRiskById(req.qhseTenantId, id);
    void writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'risks',
      resourceId: deleted.id ?? id,
      action: 'delete',
      metadata: {}
    });
    res.status(200).json(deleted);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Risque introuvable' });
    next(err);
  }
}

/**
 * POST /api/risks/analyze — suggestions uniquement (aucune persistance).
 */
export async function analyze(req, res, next) {
  try {
    const raw = req.body?.description;
    const description = clampTrimString(raw, FIELD_LIMITS.riskDescription);
    if (!description) {
      return res.status(400).json({
        error: 'Champ « description » requis (texte non vide, max. 8000 caractères).'
      });
    }
    const result = await analyzeRiskDescriptionAsync(description);
    const responseBody = { ...result };
    const llmErr = responseBody.llmError;
    delete responseBody.llmError;
    void writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'risks',
      resourceId: 'analyze',
      action: 'assist_analyze',
      metadata: {
        length: description.length,
        provider: result.provider,
        ...(llmErr ? { llmError: String(llmErr).slice(0, 200) } : {})
      }
    });
    res.json(responseBody);
  } catch (err) {
    next(err);
  }
}
