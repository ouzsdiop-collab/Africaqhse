import * as actionsService from '../services/actions.service.js';
import { parseSiteIdQuery } from '../lib/siteQueryParam.js';
import { coalesceQuerySiteIdForList } from '../services/sites.service.js';
import {
  clampTrimString,
  FIELD_LIMITS,
  parseListLimit
} from '../lib/validation.js';
import { auditUserIdFromRequest, writeAuditLog } from '../services/auditLog.service.js';
import { emitBusinessEvent } from '../services/businessEvents.service.js';

function isTerrainRole(qhseUser) {
  if (!qhseUser?.role) return false;
  return String(qhseUser.role).trim().toUpperCase() === 'TERRAIN';
}

function queryStringFirst(value) {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) return queryStringFirst(value[0]);
  if (typeof value === 'string') return value;
  return String(value);
}

export async function getAll(req, res, next) {
  try {
    const unRaw = queryStringFirst(req.query.unassigned);
    const unassigned =
      unRaw === '1' || unRaw === 'true' || unRaw === 'yes';

    const aidRaw = queryStringFirst(req.query.assigneeId);
    const assigneeId =
      typeof aidRaw === 'string' && aidRaw.trim() ? aidRaw.trim() : null;

    const rawSiteId = parseSiteIdQuery(req);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, rawSiteId);

    if (unassigned && assigneeId) {
      return res.status(400).json({
        error: 'Ne pas combiner unassigned et assigneeId'
      });
    }

    let effAssigneeId = assigneeId;
    let effUnassigned = unassigned;
    if (isTerrainRole(req.qhseUser)) {
      effAssigneeId = req.qhseUser.id;
      effUnassigned = false;
    }

    const limit = parseListLimit(req.query.limit);

    const items = await actionsService.findAllActions(req.qhseTenantId, {
      assigneeId: effAssigneeId,
      unassigned: effUnassigned,
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
    const { title, status, owner, dueDate, assigneeId, siteId, detail, incidentId } =
      req.body;
    const t = clampTrimString(title, FIELD_LIMITS.actionTitle);
    const st = clampTrimString(status, FIELD_LIMITS.actionStatus);
    const ow = clampTrimString(owner, FIELD_LIMITS.actionOwner);
    const det =
      detail == null || detail === ''
        ? undefined
        : clampTrimString(detail, FIELD_LIMITS.actionDetail) || undefined;
    const aid =
      assigneeId != null && assigneeId !== ''
        ? String(assigneeId).trim()
        : null;

    if (!t || !st) {
      return res.status(400).json({
        error: 'Champs requis : title, status (owner ou assigneeId requis)'
      });
    }
    if (!ow && !aid) {
      return res.status(400).json({
        error: 'Indiquer owner (texte) ou assigneeId (utilisateur connu)'
      });
    }

    let due = null;
    if (dueDate != null && dueDate !== '') {
      const d = new Date(dueDate);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ error: 'dueDate invalide (ISO attendu)' });
      }
      due = d;
    }

    const iid =
      incidentId != null && incidentId !== ''
        ? String(incidentId).trim()
        : undefined;
    const created = await actionsService.createAction(req.qhseTenantId, {
      title: t,
      detail: det,
      status: st,
      owner: ow || undefined,
      dueDate: due,
      assigneeId: aid,
      siteId,
      incidentId: iid
    });
    void emitBusinessEvent('action.created', {
      tenantId: req.qhseTenantId,
      actionId: created.id,
      siteId: created.siteId ?? null,
      userId: auditUserIdFromRequest(req)
    });
    res.status(201).json(created);
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

export async function patchById(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    if (!id) {
      return res.status(400).json({ error: 'Identifiant action invalide' });
    }
    const status = clampTrimString(req.body?.status, FIELD_LIMITS.actionStatus);
    if (!status) {
      return res.status(400).json({ error: 'Champ status requis' });
    }
    const updated = await actionsService.updateActionFields(req.qhseTenantId, id, {
      status
    });
    void writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'actions',
      resourceId: updated.id,
      action: 'update',
      metadata: { status: updated.status }
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Action introuvable' });
    }
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

export async function assign(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    if (!id) {
      return res.status(400).json({ error: 'Identifiant action invalide' });
    }

    const raw = req.body?.assigneeId;
    const normalized =
      raw === null || raw === undefined || raw === ''
        ? null
        : String(raw).trim();
    const assigneeForService = normalized === '' ? null : normalized;

    const updated = await actionsService.assignAction(
      req.qhseTenantId,
      id,
      assigneeForService
    );
    void writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'actions',
      resourceId: updated.id,
      action: 'assign',
      metadata: { assigneeId: updated.assigneeId ?? null }
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Action introuvable' });
    }
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}
