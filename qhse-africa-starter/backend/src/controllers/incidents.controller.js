import * as incidentsService from '../services/incidents.service.js';
import { parseSiteIdQuery } from '../lib/siteQueryParam.js';
import { coalesceQuerySiteIdForList } from '../services/sites.service.js';
import {
  clampTrimString,
  FIELD_LIMITS,
  parseListLimit
} from '../lib/validation.js';
import { auditUserIdFromRequest, writeAuditLog } from '../services/auditLog.service.js';
import { emitBusinessEvent } from '../services/businessEvents.service.js';

export async function getAll(req, res, next) {
  try {
    const rawSiteId = parseSiteIdQuery(req);
    const siteId = await coalesceQuerySiteIdForList(rawSiteId);
    const limit = parseListLimit(req.query.limit);
    const items = await incidentsService.findAllIncidents({ siteId, limit });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { ref, type, site, severity, description, status, siteId } = req.body;
    const r = clampTrimString(ref, FIELD_LIMITS.incidentRef);
    const ty = clampTrimString(type, FIELD_LIMITS.incidentType);
    const si = clampTrimString(site, FIELD_LIMITS.incidentSiteLabel);
    const sev = clampTrimString(severity, FIELD_LIMITS.incidentSeverity);
    if (!r || !ty || !si || !sev) {
      return res.status(400).json({
        error:
          'Champs requis : ref, type, site, severity (textes non vides, longueurs limitées).'
      });
    }
    const desc =
      description == null || description === ''
        ? null
        : clampTrimString(description, FIELD_LIMITS.incidentDescription) || null;
    const st =
      status == null || status === ''
        ? undefined
        : clampTrimString(status, FIELD_LIMITS.incidentStatus);

    const created = await incidentsService.createIncident({
      ref: r,
      type: ty,
      site: si,
      severity: sev,
      description: desc,
      status: st,
      siteId
    });
    void writeAuditLog({
      userId: auditUserIdFromRequest(req),
      resource: 'incidents',
      resourceId: created.id,
      action: 'create',
      metadata: { ref: created.ref, type: created.type }
    });
    void emitBusinessEvent('incident.created', {
      incidentId: created.id,
      ref: created.ref,
      siteId: created.siteId ?? null,
      userId: auditUserIdFromRequest(req)
    });
    res.status(201).json(created);
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Référence incident déjà utilisée' });
    }
    next(err);
  }
}

export async function patchByRef(req, res, next) {
  try {
    const rawRef =
      typeof req.params.ref === 'string' ? decodeURIComponent(req.params.ref).trim() : '';
    const { status } = req.body;
    const st = clampTrimString(status, FIELD_LIMITS.incidentStatus);
    if (!rawRef || !st) {
      return res.status(400).json({
        error: 'Référence incident et statut requis (textes non vides).'
      });
    }
    const updated = await incidentsService.updateIncidentByRef(rawRef, { status: st });
    void writeAuditLog({
      userId: auditUserIdFromRequest(req),
      resource: 'incidents',
      resourceId: updated.id,
      action: 'update',
      metadata: { ref: updated.ref, status: updated.status }
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Incident introuvable' });
    }
    next(err);
  }
}
