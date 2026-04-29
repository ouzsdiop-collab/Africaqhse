import * as reportingSummaryService from '../services/reportingSummary.service.js';
import { parseSiteIdQuery } from '../lib/siteQueryParam.js';
import { assertQuerySiteAllowed } from '../lib/siteScope.service.js';
import { coalesceQuerySiteIdForList } from '../services/sites.service.js';
import * as dashboardService from '../services/dashboard.service.js';
import { getStandardCompliance } from '../services/compliancePack.service.js';
import { listIsoEvidence } from '../services/isoEvidence.service.js';

function stripLongDashes(s) {
  return String(s || '').replaceAll('—', '-').replaceAll('–', '-');
}

function evidenceStatusFromCounts(validatedCount, pendingCount) {
  if (validatedCount > 0) return 'conforme';
  if (pendingCount > 0) return 'partiel';
  return 'non conforme';
}

function normalizeDataQuality(v) {
  const s = String(v || '').toLowerCase();
  if (s === 'complete') return 'complete';
  if (s === 'partial') return 'partial';
  return 'unavailable';
}

const ISO_PREMIUM_ALLOWED_STANDARDS = new Set(['iso-45001', 'iso-14001', 'iso-9001']);

function isoPremiumDomainLabel(standard) {
  const s = String(standard || '').toLowerCase();
  if (s === 'iso-45001') return 'Santé et sécurité au travail';
  if (s === 'iso-14001') return 'Environnement';
  if (s === 'iso-9001') return 'Qualité';
  return 'ISO';
}

/**
 * @param {import('express').Request} req
 */
function parseIsoPremiumStandardQuery(req) {
  const raw = req.query?.standard;
  const s = Array.isArray(raw) ? String(raw[0] || '') : String(raw || '');
  const norm = s.trim().toLowerCase();
  if (!ISO_PREMIUM_ALLOWED_STANDARDS.has(norm)) {
    const allowed = [...ISO_PREMIUM_ALLOWED_STANDARDS].join(', ');
    const err = new Error(`Norme non supportée. Valeurs possibles : ${allowed}.`);
    // @ts-ignore
    err.statusCode = 400;
    // @ts-ignore
    err.code = 'REPORT_ISO_PREMIUM_STANDARD_NOT_SUPPORTED';
    throw err;
  }
  return norm;
}

/**
 * Construit le payload premium ISO (backend-only) pour une norme donnée.
 * Respecte tenant + scope site (via siteId dashboard).
 *
 * @param {{
 *  tenantId: string;
 *  siteId: string|null;
 *  standard: 'iso-45001'|'iso-14001'|'iso-9001';
 * }} ctx
 */
async function buildIsoPremiumPayload(ctx) {
  const [dash, isoStd, evidences] = await Promise.all([
    dashboardService.getDashboardStats(ctx.tenantId, ctx.siteId),
    getStandardCompliance(ctx.standard),
    listIsoEvidence(ctx.tenantId)
  ]);

  /** @type {Map<string, any[]>} */
  const byReq = new Map();
  (Array.isArray(evidences) ? evidences : []).forEach((e) => {
    const rid = String(e?.requirementId || '').trim();
    if (!rid) return;
    if (!byReq.has(rid)) byReq.set(rid, []);
    byReq.get(rid).push(e);
  });

  const pilotageEssential =
    dash?.pilotageEssential && typeof dash.pilotageEssential === 'object' ? dash.pilotageEssential : null;
  const pilotageExpert =
    dash?.pilotageExpert && typeof dash.pilotageExpert === 'object' ? dash.pilotageExpert : null;

  const score = Number(pilotageEssential?.score);
  const topPriorities = Array.isArray(pilotageEssential?.topPriorities)
    ? pilotageEssential.topPriorities.slice(0, 3)
    : [];
  const executiveSummary = stripLongDashes(String(pilotageEssential?.executiveSummary || '').trim());
  const recommendedActions = Array.isArray(pilotageEssential?.recommendedActions)
    ? pilotageEssential.recommendedActions.slice(0, 5)
    : [];

  const subScores =
    pilotageExpert?.subScores && typeof pilotageExpert.subScores === 'object' ? pilotageExpert.subScores : null;

  const dqRaw =
    pilotageExpert?.dataQuality && typeof pilotageExpert.dataQuality === 'object'
      ? pilotageExpert.dataQuality
      : pilotageEssential?.dataQuality && typeof pilotageEssential.dataQuality === 'object'
        ? pilotageEssential.dataQuality
        : null;

  const dataQuality = dqRaw
    ? {
        incidents: normalizeDataQuality(dqRaw.incidents),
        actions: normalizeDataQuality(dqRaw.actions),
        audits: normalizeDataQuality(dqRaw.audits),
        risks: normalizeDataQuality(dqRaw.risks)
      }
    : { incidents: 'unavailable', actions: 'unavailable', audits: 'unavailable', risks: 'unavailable' };

  const reqs = Array.isArray(isoStd?.requirements) ? isoStd.requirements : [];
  const requirementStatuses = reqs.map((r) => {
    const rid = String(r?.id || '').trim();
    const list = rid && byReq.has(rid) ? byReq.get(rid) : [];
    const validatedCount = (list || []).filter((e) => String(e?.status || '').toLowerCase() === 'validated').length;
    const pendingCount = (list || []).filter((e) => String(e?.status || '').toLowerCase() === 'pending').length;
    const status = evidenceStatusFromCounts(validatedCount, pendingCount);
    return {
      id: rid,
      title: String(r?.title || '').trim(),
      summary: stripLongDashes(String(r?.summary || '').trim()),
      priority: String(r?.priority || 'medium'),
      status,
      evidence: { validatedCount, pendingCount }
    };
  });

  const mainRequirements = requirementStatuses.slice(0, 12);

  const criticalRequirements = requirementStatuses
    .filter((r) => r.status !== 'conforme')
    .sort((a, b) => {
      const pr = (x) => (String(x || '').toLowerCase() === 'high' ? 2 : 1);
      return pr(b.priority) - pr(a.priority);
    })
    .slice(0, 5);

  return {
    meta: {
      standard: ctx.standard,
      domainLabel: isoPremiumDomainLabel(ctx.standard),
      generatedAt: new Date().toISOString(),
      siteId: dash?.siteId ?? null
    },
    pilotage: {
      score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null,
      topPriorities,
      executiveSummary,
      recommendedActions,
      subScores: subScores
        ? {
            actions: Number(subScores.actions) || 0,
            incidents: Number(subScores.incidents) || 0,
            conformity: Number(subScores.conformity) || 0,
            risks: Number(subScores.risks) || 0
          }
        : null,
      dataQuality
    },
    iso: {
      standard: ctx.standard,
      label: String(isoStd?.label || '').trim() || ctx.standard.toUpperCase(),
      mainRequirements,
      criticalRequirements
    },
    disclaimer:
      'Document indicatif. Les statuts de conformité sont basés sur les preuves enregistrées dans l’application et doivent être validés par un auditeur habilité.'
  };
}

/**
 * GET /api/reports/iso-45001-pilotage-premium
 * Payload backend-only (pilotage + packs + preuves ISO).
 */
export async function getIso45001PilotagePremium(req, res, next) {
  try {
    const rawSiteId = parseSiteIdQuery(req);
    assertQuerySiteAllowed(req.qhseUser, rawSiteId);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, rawSiteId);

    const payload = await buildIsoPremiumPayload({
      tenantId: req.qhseTenantId,
      siteId,
      standard: 'iso-45001'
    });

    // Compat: garder la clé iso45001 pour les clients existants.
    res.json({
      meta: payload.meta,
      pilotage: payload.pilotage,
      iso45001: {
        label: payload.iso?.label || 'ISO 45001',
        mainRequirements: payload.iso?.mainRequirements || [],
        criticalRequirements: payload.iso?.criticalRequirements || []
      },
      disclaimer: payload.disclaimer
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reports/iso-premium?standard=iso-45001|iso-14001|iso-9001
 * Payload backend-only (pilotage + pack norme + preuves ISO).
 */
export async function getIsoPremium(req, res, next) {
  try {
    const rawSiteId = parseSiteIdQuery(req);
    assertQuerySiteAllowed(req.qhseUser, rawSiteId);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, rawSiteId);
    const standard = parseIsoPremiumStandardQuery(req);

    const payload = await buildIsoPremiumPayload({
      tenantId: req.qhseTenantId,
      siteId,
      // @ts-ignore - validé par parseIsoPremiumStandardQuery
      standard
    });
    res.json(payload);
  } catch (err) {
    next(err);
  }
}

/**
 * Période glissante (jours) — optionnel, défaut côté service = 30.
 * @param {import('express').Request} req
 */
function parsePeriodDaysQuery(req) {
  const v = req.query?.periodDays;
  if (v === undefined || v === null) return undefined;
  const s = Array.isArray(v) ? String(v[0]) : String(v);
  const n = Number(s.trim());
  return Number.isFinite(n) ? n : undefined;
}

/** GET /api/reports/summary — synthèse consolidée (permissions : reports:read). */
export async function getSummary(req, res, next) {
  try {
    const rawSiteId = parseSiteIdQuery(req);
    assertQuerySiteAllowed(req.qhseUser, rawSiteId);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, rawSiteId);
    const periodDays = parsePeriodDaysQuery(req);

    const data = await reportingSummaryService.getReportingSummary(req.qhseTenantId, siteId, {
      ...(periodDays !== undefined ? { periodDays } : {})
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}
