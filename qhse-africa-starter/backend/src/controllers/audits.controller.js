import { prisma } from '../db.js';
import * as auditsService from '../services/audits.service.js';
import * as auditAutoReport from '../services/auditAutoReport.service.js';
import { isFinalAuditStatus } from '../services/auditAutoReport.service.js';
import { parseSiteIdQuery } from '../lib/siteQueryParam.js';
import {
  assertSiteExistsOrNull,
  coalesceQuerySiteIdForList
} from '../services/sites.service.js';
import {
  clampTrimString,
  FIELD_LIMITS,
  parseAuditScore,
  parseListLimit
} from '../lib/validation.js';
import { auditUserIdFromRequest, writeAuditLog } from '../services/auditLog.service.js';
import { emitBusinessEvent } from '../services/businessEvents.service.js';

export async function getAll(req, res, next) {
  try {
    const rawSiteId = parseSiteIdQuery(req);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, rawSiteId);
    const limit = parseListLimit(req.query.limit);
    const items = await auditsService.findAllAudits(req.qhseTenantId, { siteId, limit });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { ref, site, score, status, checklist, siteId } = req.body;
    const r = clampTrimString(ref, FIELD_LIMITS.auditRef);
    const si = clampTrimString(site, FIELD_LIMITS.auditSite);
    const st = clampTrimString(status, FIELD_LIMITS.auditStatus);
    const parsed = parseAuditScore(score);
    if (!r || !si || !st) {
      return res.status(400).json({
        error: 'Champs requis : ref, site, score, status (textes valides).'
      });
    }
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }
    const scoreInt = Math.round(Number(parsed.value));
    const created = await auditsService.createAudit(req.qhseTenantId, {
      ref: r,
      site: si,
      score: scoreInt,
      status: st,
      checklist,
      siteId
    });
    const delivery = await auditAutoReport.trySendFinalAuditReport(null, created);
    const payload =
      delivery.sent && delivery.audit ? delivery.audit : created;
    void writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'audits',
      resourceId: payload.id,
      action: 'create',
      metadata: { ref: payload.ref, score: payload.score }
    });
    const participantEmails = Array.isArray(req.body?.participantEmails)
      ? req.body.participantEmails
      : null;
    void emitBusinessEvent('audit.scheduled', {
      tenantId: req.qhseTenantId,
      auditId: payload.id,
      ref: payload.ref,
      site: payload.site,
      siteId: payload.siteId ?? null,
      status: payload.status,
      score: payload.score,
      userId: auditUserIdFromRequest(req),
      participantEmails
    });
    res.status(201).json({
      ...payload,
      autoReportDelivery: {
        sent: delivery.sent,
        reason: delivery.reason ?? null,
        recipients: delivery.recipients ?? null,
        detail: process.env.NODE_ENV === 'production' ? null : (delivery.detail ?? null)
      }
    });
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    if (err.statusCode === 403) {
      return res.status(403).json({ error: err.message });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Référence audit déjà utilisée' });
    }
    next(err);
  }
}

/**
 * PATCH /api/audits/:id — mise à jour partielle (ex. clôture → envoi auto rapport si statut final).
 */
export async function patch(req, res, next) {
  try {
    const param = String(req.params.id ?? '').trim();
    if (!param) {
      return res.status(400).json({ error: 'Identifiant requis' });
    }

    const existing = await prisma.audit.findFirst({
      where: {
        tenantId: req.qhseTenantId,
        OR: [{ id: param }, { ref: param }]
      }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Audit introuvable' });
    }

    const { status, score, site, checklist, siteId } = req.body || {};
    if (
      status === undefined &&
      score === undefined &&
      site === undefined &&
      checklist === undefined &&
      siteId === undefined
    ) {
      return res.status(400).json({
        error:
          'Aucun champ à mettre à jour (status, score, site, siteId, checklist)'
      });
    }

    const data = {};
    if (status !== undefined) data.status = String(status).trim();
    if (score !== undefined) {
      const parsed = parseAuditScore(score);
      if (!parsed.ok) {
        return res.status(400).json({ error: parsed.error });
      }
      data.score = Math.round(Number(parsed.value));
    }
    if (site !== undefined) data.site = String(site).trim();
    if (checklist !== undefined) data.checklist = checklist;
    if (siteId !== undefined) {
      if (siteId === null || siteId === '') {
        data.siteId = null;
      } else {
        try {
          data.siteId = await assertSiteExistsOrNull(req.qhseTenantId, siteId);
        } catch (e) {
          if (e.statusCode === 400) {
            return res.status(400).json({ error: e.message });
          }
          throw e;
        }
      }
    }

    const upd = await prisma.audit.updateMany({
      where: { id: existing.id, tenantId: req.qhseTenantId },
      data
    });
    if (!upd?.count) {
      return res.status(404).json({ error: 'Audit introuvable' });
    }
    const updated = await prisma.audit.findFirst({
      where: { id: existing.id, tenantId: req.qhseTenantId }
    });
    if (!updated) {
      return res.status(404).json({ error: 'Audit introuvable' });
    }

    const delivery = await auditAutoReport.trySendFinalAuditReport(
      existing,
      updated
    );
    const payload =
      delivery.sent && delivery.audit ? delivery.audit : updated;

    void writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'audits',
      resourceId: payload.id,
      action: 'update',
      metadata: { ref: payload.ref, status: payload.status }
    });

    if (
      isFinalAuditStatus(payload.status) &&
      !isFinalAuditStatus(existing.status)
    ) {
      void emitBusinessEvent('audit.validated', {
        tenantId: req.qhseTenantId,
        auditId: payload.id,
        ref: payload.ref,
        siteId: payload.siteId ?? null,
        userId: auditUserIdFromRequest(req)
      });
    }

    res.json({
      ...payload,
      autoReportDelivery: {
        sent: delivery.sent,
        reason: delivery.reason ?? null,
        recipients: delivery.recipients ?? null,
        detail: process.env.NODE_ENV === 'production' ? null : (delivery.detail ?? null)
      }
    });
  } catch (err) {
    next(err);
  }
}
