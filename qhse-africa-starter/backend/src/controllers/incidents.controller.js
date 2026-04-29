import * as incidentsService from '../services/incidents.service.js';
import { parseSiteIdQuery } from '../lib/siteQueryParam.js';
import { coalesceQuerySiteIdForList } from '../services/sites.service.js';
import {
  clampTrimString,
  FIELD_LIMITS,
  parseIncidentCauseCategory,
  parseIncidentPhotosJson,
  parseListLimit
} from '../lib/validation.js';
import { auditUserIdFromRequest, writeAuditLog } from '../services/auditLog.service.js';
import { emitBusinessEvent } from '../services/businessEvents.service.js';

function serializeIncidentPhotosJsonForApi(raw) {
  if (raw == null) return null;
  if (typeof raw === 'string') return raw; // compat (ancien stockage String)
  try {
    return JSON.stringify(raw);
  } catch {
    return null;
  }
}

function normalizeIncidentForApi(row) {
  if (!row || typeof row !== 'object') return row;
  return {
    ...row,
    photosJson: serializeIncidentPhotosJsonForApi(row.photosJson)
  };
}

export async function getAll(req, res, next) {
  try {
    const rawSiteId = parseSiteIdQuery(req);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, rawSiteId);
    const limit = parseListLimit(req.query.limit);
    const items = await incidentsService.findAllIncidents(req.qhseTenantId, { siteId, limit });
    res.json(items.map(normalizeIncidentForApi));
  } catch (err) {
    next(err);
  }
}

/** GET /api/incidents/kpi/tf-tg — taux de fréquence et de gravité (mining / pétrole). */
export async function getTfTgKpi(req, res, next) {
  try {
    const rawSiteId = parseSiteIdQuery(req);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, rawSiteId);

    const qy = req.query.year;
    const year =
      qy !== undefined && qy !== null && String(qy).trim() !== ''
        ? Math.floor(Number(qy))
        : null;

    const qd = req.query.periodDays;
    const periodDays =
      qd !== undefined && qd !== null && String(qd).trim() !== ''
        ? Math.floor(Number(qd))
        : null;

    const qh = req.query.heuresTravaillees;
    const heuresTravaillees =
      qh !== undefined && qh !== null && String(qh).trim() !== ''
        ? Number(qh)
        : null;

    const qoTf = req.query.objectifTF;
    const objectifTF =
      qoTf !== undefined && qoTf !== null && String(qoTf).trim() !== ''
        ? Number(qoTf)
        : null;

    const qoTg = req.query.objectifTG;
    const objectifTG =
      qoTg !== undefined && qoTg !== null && String(qoTg).trim() !== ''
        ? Number(qoTg)
        : null;

    if (year != null && Number.isNaN(year)) {
      return res.status(400).json({ error: 'year invalide' });
    }
    if (periodDays != null && Number.isNaN(periodDays)) {
      return res.status(400).json({ error: 'periodDays invalide' });
    }

    const payload = await incidentsService.computeTfTg(req.qhseTenantId, siteId, {
      year: Number.isFinite(year) ? year : null,
      periodDays: Number.isFinite(periodDays) ? periodDays : null,
      heuresTravaillees: Number.isFinite(heuresTravaillees) ? heuresTravaillees : null,
      objectifTF: Number.isFinite(objectifTF) ? objectifTF : null,
      objectifTG: Number.isFinite(objectifTG) ? objectifTG : null
    });

    res.json({
      tf: payload.tf,
      tg: payload.tg,
      accidentsAvecArret: payload.accidentsAvecArret,
      joursPerdus: payload.joursPerdus,
      heuresTravaillees: payload.heuresTravaillees,
      periode: payload.periode,
      objectifTF: payload.objectifTF,
      objectifTG: payload.objectifTG,
      tfPrev: payload.tfPrev,
      tgPrev: payload.tgPrev,
      prevPeriode: payload.prevPeriode
    });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const {
      ref,
      type,
      site,
      severity,
      description,
      status,
      siteId,
      location,
      causes,
      causeCategory,
      photosJson,
      responsible
    } = req.body;
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

    const loc =
      location == null || location === ''
        ? null
        : clampTrimString(location, FIELD_LIMITS.incidentLocation) || null;
    const cau =
      causes == null || causes === ''
        ? null
        : clampTrimString(causes, FIELD_LIMITS.incidentCauses) || null;
    const cat = parseIncidentCauseCategory(
      causeCategory,
      FIELD_LIMITS.incidentCauseCategory
    );
    if (cat === '__invalid__') {
      return res.status(400).json({
        error: 'causeCategory : humain, materiel, organisation ou mixte uniquement'
      });
    }
    const resp =
      responsible == null || responsible === ''
        ? null
        : clampTrimString(responsible, FIELD_LIMITS.incidentResponsible) || null;

    const photosRes = parseIncidentPhotosJson(
      photosJson,
      FIELD_LIMITS.incidentPhotosJson
    );
    if (!photosRes.ok) {
      return res.status(400).json({ error: photosRes.error });
    }

    const created = await incidentsService.createIncident(req.qhseTenantId, {
      ref: r,
      type: ty,
      site: si,
      severity: sev,
      description: desc,
      status: st,
      siteId,
      location: loc,
      causes: cau,
      causeCategory: cat,
      photosJson: photosRes.value,
      responsible: resp
    });
    void writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'incidents',
      resourceId: created.id,
      action: 'create',
      metadata: { ref: created.ref, type: created.type }
    });
    void emitBusinessEvent('incident.created', {
      tenantId: req.qhseTenantId,
      incidentId: created.id,
      ref: created.ref,
      siteId: created.siteId ?? null,
      site: created.site,
      severity: created.severity,
      description: created.description ?? null,
      userId: auditUserIdFromRequest(req)
    });
    res.status(201).json(normalizeIncidentForApi(created));
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    if (err.statusCode === 403) {
      return res.status(403).json({ error: err.message });
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
    if (!rawRef) {
      return res.status(400).json({ error: 'Référence incident requise' });
    }
    const {
      status,
      causes,
      causeCategory,
      location,
      responsible,
      photosJson
    } = req.body;

    const patch = {};
    if (status != null && String(status).trim() !== '') {
      patch.status = clampTrimString(status, FIELD_LIMITS.incidentStatus);
    }
    if ('causes' in req.body) {
      patch.causes =
        causes == null || causes === ''
          ? null
          : clampTrimString(causes, FIELD_LIMITS.incidentCauses) || null;
    }
    if ('causeCategory' in req.body) {
      const cat = parseIncidentCauseCategory(
        causeCategory,
        FIELD_LIMITS.incidentCauseCategory
      );
      if (cat === '__invalid__') {
        return res.status(400).json({
          error: 'causeCategory : humain, materiel, organisation ou mixte uniquement'
        });
      }
      patch.causeCategory = cat;
    }
    if ('location' in req.body) {
      patch.location =
        location == null || location === ''
          ? null
          : clampTrimString(location, FIELD_LIMITS.incidentLocation) || null;
    }
    if ('responsible' in req.body) {
      patch.responsible =
        responsible == null || responsible === ''
          ? null
          : clampTrimString(responsible, FIELD_LIMITS.incidentResponsible) || null;
    }
    if ('photosJson' in req.body) {
      const pr = parseIncidentPhotosJson(
        photosJson,
        FIELD_LIMITS.incidentPhotosJson
      );
      if (!pr.ok) {
        return res.status(400).json({ error: pr.error });
      }
      patch.photosJson = pr.value;
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({
        error: 'Fournir au moins un champ : status, causes, causeCategory, location, responsible, photosJson'
      });
    }

    const updated = await incidentsService.updateIncidentByRef(req.qhseTenantId, rawRef, patch);
    void writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'incidents',
      resourceId: updated.id,
      action: 'update',
      metadata: { ref: updated.ref, status: updated.status }
    });
    res.json(normalizeIncidentForApi(updated));
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Incident introuvable' });
    }
    next(err);
  }
}
