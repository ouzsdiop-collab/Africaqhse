import { normalizeTenantId } from '../lib/tenantScope.js';
import { isActionOverdueDashboardRow, isCriticalRisk, RISK_CRITICAL_GP_MIN } from './kpiCore.service.js';

/**
 * @typedef {{
 *  id?: string,
 *  ref?: string,
 *  type?: string,
 *  site?: string,
 *  siteId?: string|null,
 *  severity?: string|number|null,
 *  status?: string|null,
 *  createdAt?: Date|string|null,
 *  description?: string|null,
 *  workUnit?: string|null,
 *  workUnitId?: string|null
 * }} IncidentLike
 *
 * @typedef {{
 *  id?: string,
 *  ref?: string|null,
 *  title?: string,
 *  category?: string|null,
 *  severity?: number|string|null,
 *  gravity?: number|string|null,
 *  probability?: number|string|null,
 *  gp?: number|string|null,
 *  status?: string|null,
 *  owner?: string|null
 * }} RiskLike
 *
 * @typedef {{
 *  id?: string,
 *  title?: string,
 *  detail?: string|null,
 *  status?: string|null,
 *  dueDate?: Date|string|null,
 *  owner?: string|null,
 *  siteId?: string|null
 * }} ActionLike
 *
 * @typedef {{
 *  id?: string,
 *  status?: string|null,
 *  score?: number|string|null,
 *  createdAt?: Date|string|null
 * }} AuditLike
 *
 * @typedef {{
 *  id?: string,
 *  name?: string,
 *  fdsFileUrl?: string|null,
 *  casNumber?: string|null,
 *  hStatements?: unknown
 * }} ProductLike
 *
 * @typedef {{
 *  id?: string,
 *  name?: string,
 *  type?: string,
 *  expiresAt?: Date|string|null,
 *  fdsProductRef?: string|null,
 *  productId?: string|null,
 *  siteId?: string|null
 * }} FdsDocumentLike
 */

function assertTenant(tenantId) {
  const t = normalizeTenantId(tenantId);
  if (!t) {
    const err = new Error('Contexte organisation requis');
    err.statusCode = 403;
    throw err;
  }
  return t;
}

function toTimeMs(x) {
  if (x == null || x === '') return null;
  const t = new Date(x).getTime();
  return Number.isFinite(t) ? t : null;
}

function nowIso(d = new Date()) {
  return d.toISOString();
}

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0.5;
  return Math.max(0, Math.min(1, x));
}

function toIntOrNull(n) {
  if (n == null || n === '') return null;
  const x = Number(n);
  return Number.isFinite(x) ? Math.round(x) : null;
}

function normText(x) {
  return String(x ?? '')
    .toLowerCase()
    .trim();
}

function isRiskLikelyOpen(status) {
  const s = normText(status);
  if (!s) return true;
  if (s.includes('clos') || s.includes('clôt') || s.includes('fer')) return false;
  if (s.includes('archive')) return false;
  return true;
}

function isIncidentCriticalSeverity(severity) {
  const s = normText(severity);
  if (!s) return false;
  if (s.includes('crit')) return true;
  if (s.includes('majeur') || s.includes('major') || s.includes('grave')) return true;
  return false;
}

function groupKeyIncident(inc) {
  const type = normText(inc?.type || 'incident');
  const site = normText(inc?.site || inc?.siteId || '');
  const unit = normText(inc?.workUnit || inc?.workUnitId || '');
  const sev = normText(inc?.severity || '');
  return `${type}::${site}::${unit}::${sev}`;
}

function newAlertId(prefix, sourceId, fallbackIdx) {
  const s = String(sourceId || '').trim();
  return `${prefix}:${s || String(fallbackIdx || 0)}`;
}

function makeAlert({
  id,
  type,
  severity,
  title,
  description,
  sourceModule,
  sourceId,
  suggestedActionTitle,
  suggestedDueInDays,
  confidence
}) {
  return {
    id,
    type,
    severity,
    title,
    description,
    sourceModule,
    sourceId: sourceId ?? null,
    suggestedActionTitle: suggestedActionTitle ?? null,
    suggestedDueInDays: typeof suggestedDueInDays === 'number' ? suggestedDueInDays : null,
    confidence: clamp01(confidence),
    humanValidationRequired: true
  };
}

function productRequiresFds(p) {
  // Heuristique prudente: on ne dit "FDS manquante" que si le produit ressemble à un produit chimique
  // (CAS ou H-statements non vides). Sinon, pas d'alerte manquante.
  const cas = String(p?.casNumber || '').trim();
  if (cas) return true;
  const hs = p?.hStatements;
  if (Array.isArray(hs) && hs.length) return true;
  if (typeof hs === 'string' && hs.trim()) return true;
  return false;
}

function bestExpiryMsForDocs(docs) {
  let best = null;
  for (const d of docs || []) {
    const t = toTimeMs(d?.expiresAt);
    if (t == null) continue;
    if (best == null || t > best) best = t;
  }
  return best;
}

/**
 * 1) Situations critiques (alertes)
 * - risque critique sans action → alerte
 * - incidents répétés → alerte
 * - actions en retard massives → alerte
 *
 * @param {{
 *  tenantId?: string|null,
 *  incidents?: IncidentLike[],
 *  risks?: RiskLike[],
 *  actions?: ActionLike[],
 *  audits?: AuditLike[],
 *  products?: ProductLike[],
 *  now?: Date
 * }} input
 */
export function detectCriticalSituations(input) {
  const {
    tenantId,
    incidents = [],
    risks = [],
    actions = [],
    audits = [],
    products = [],
    fdsDocuments = [],
    now = new Date()
  } = input || {};
  assertTenant(tenantId);

  /** @type {Array<Record<string, unknown>>} */
  const alerts = [];

  // Actions en retard massives
  const overdue = actions.filter((a) => isActionOverdueDashboardRow(a));
  if (overdue.length >= 10) {
    alerts.push(
      makeAlert({
        id: newAlertId('actions_overdue_massive', null, 0),
        type: 'actions_overdue_massive',
        severity: 'critical',
        title: 'Actions en retard massives',
        description: `${overdue.length} action(s) en retard. Risque de non-maîtrise du système QHSE.`,
        sourceModule: 'actions',
        sourceId: null,
        suggestedActionTitle: 'Arbitrer et replanifier les actions critiques',
        suggestedDueInDays: 3,
        confidence: 0.74
      })
    );
  } else if (overdue.length >= 5) {
    alerts.push(
      makeAlert({
        id: newAlertId('actions_overdue_high', null, 0),
        type: 'actions_overdue_high',
        severity: 'high',
        title: 'Actions en retard élevées',
        description: `${overdue.length} action(s) en retard. Prioriser les retards à impact sécurité.`,
        sourceModule: 'actions',
        sourceId: null,
        suggestedActionTitle: 'Revue des retards + réaffectation',
        suggestedDueInDays: 7,
        confidence: 0.66
      })
    );
  }

  // Risques critiques sans action (heuristique: aucun lien DB, on utilise un proxy texte)
  // Règle pratique: si risque critique ouvert et backlog actions overdue/ ouvertes = 0 → alerte,
  // sinon si risque critique ouvert et aucune action mentionnant "risque" / ref / titre → alerte.
  const openRisks = risks.filter((r) => isRiskLikelyOpen(r.status));
  const criticalOpenRisks = openRisks.filter((r) => isCriticalRisk(r));
  const actionCorpus = actions
    .map((a) => `${a?.title || ''} ${a?.status || ''} ${a?.detail || ''}`)
    .join(' ')
    .toLowerCase();

  /** @type {Set<string>} */
  const explicitRiskIds = new Set(
    actions
      .map((a) => (a?.riskId != null && String(a.riskId).trim() ? String(a.riskId).trim() : ''))
      .filter(Boolean)
  );
  for (const r of criticalOpenRisks.slice(0, 30)) {
    const ref = String(r?.ref || '').trim();
    const title = String(r?.title || '').trim();
    const rid = r?.id != null && String(r.id).trim() ? String(r.id).trim() : '';

    // 1) lien explicite: Action.riskId
    if (rid && explicitRiskIds.has(rid)) {
      continue;
    }

    // 2) fallback heuristique (texte/ref)
    const hit =
      (ref && actionCorpus.includes(ref.toLowerCase())) ||
      (title && title.length >= 6 && actionCorpus.includes(title.toLowerCase().slice(0, 18)));
    if (!hit) {
      alerts.push(
        makeAlert({
          id: newAlertId('critical_risk_without_action', ref || title, alerts.length + 1),
          type: 'critical_risk_without_action',
          severity: 'high',
          title: 'Risque critique sans action liée (à confirmer)',
          description: `Risque critique détecté${ref ? ` (${ref})` : ''}${title ? `: ${title}` : ''} — aucune action ne semble le couvrir.`,
          sourceModule: 'risks',
          sourceId: ref || null,
          suggestedActionTitle: 'Créer une action de maîtrise prioritaire',
          suggestedDueInDays: 14,
          confidence: 0.62
        })
      );
    }
  }

  // Incidents répétés (sur fenêtre glissante 30j)
  const cutMs = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const recent = incidents.filter((i) => {
    const t = toTimeMs(i?.createdAt);
    return t == null ? true : t >= cutMs;
  });
  /** @type {Map<string, IncidentLike[]>} */
  const byKey = new Map();
  for (const inc of recent) {
    const k = groupKeyIncident(inc);
    const arr = byKey.get(k) || [];
    arr.push(inc);
    byKey.set(k, arr);
  }
  for (const [k, arr] of byKey.entries()) {
    if (arr.length >= 3) {
      const sample = arr[0] || {};
      alerts.push(
        makeAlert({
          id: newAlertId('repeated_incidents', sample?.ref || sample?.id, alerts.length + 1),
          type: 'repeated_incidents',
          severity: isIncidentCriticalSeverity(sample.severity) ? 'critical' : 'high',
          title: 'Incidents répétés',
          description: `${arr.length} incidents similaires sur ~30 jours (type/site/unité/gravité).`,
          sourceModule: 'incidents',
          sourceId: sample?.ref || sample?.id || null,
          suggestedActionTitle: 'Analyse causes racines (5M) + action collective',
          suggestedDueInDays: 7,
          confidence: 0.68
        })
      );
    }
  }

  // Audits: score < 80
  const auditScores = audits
    .map((a) => Number(String(a?.score ?? '').trim().replace(',', '.')))
    .filter((x) => Number.isFinite(x));
  const lowAudits = auditScores.filter((s) => s < 80);
  if (lowAudits.length) {
    const min = Math.min(...lowAudits);
    alerts.push(
      makeAlert({
        id: newAlertId('audit_score_low', null, alerts.length + 1),
        type: 'audit_score_low',
        severity: min < 60 ? 'critical' : 'high',
        title: 'Score audit sous 80',
        description: `Au moins un audit a un score < 80 (min: ${Math.round(min)}).`,
        sourceModule: 'audits',
        sourceId: null,
        suggestedActionTitle: 'Plan de correction audit + suivi des écarts',
        suggestedDueInDays: 14,
        confidence: 0.66
      })
    );
  }

  // FDS: conformité basée uniquement sur ControlledDocument (fiable via expiresAt).
  // Important (prudent): pas d'alerte globale "FDS manquante" sur docs non liés; manquante seulement par produit si produitRequiresFds.
  const fdsDocs = Array.isArray(fdsDocuments) ? fdsDocuments : [];
  if (fdsDocs.length) {
    const nowMs = now.getTime();
    const expired = [];
    const renewSoon = [];
    for (const d of fdsDocs) {
      const exp = toTimeMs(d?.expiresAt);
      if (exp == null) continue; // pas d'échéance → pas d'alerte expiration
      const days = Math.round((exp - nowMs) / 86400000);
      if (days < 0) expired.push(d);
      else if (days <= 30) renewSoon.push(d);
    }
    if (expired.length) {
      const first = expired[0] || {};
      alerts.push(
        makeAlert({
          id: newAlertId('fds_expired', first?.id, alerts.length + 1),
          type: 'fds_expired',
          severity: 'high',
          title: 'FDS expirée',
          description: `${expired.length} document(s) FDS expiré(s) (échéance dépassée).`,
          sourceModule: 'controlled_documents',
          sourceId: first?.id ?? null,
          suggestedActionTitle: 'Mettre à jour les FDS expirées',
          suggestedDueInDays: 14,
          confidence: first?.fdsProductRef ? 0.55 : 0.62
        })
      );
    }
    if (renewSoon.length) {
      const first = renewSoon[0] || {};
      alerts.push(
        makeAlert({
          id: newAlertId('fds_renew_soon', first?.id, alerts.length + 1),
          type: 'fds_renew_soon',
          severity: 'medium',
          title: 'FDS à renouveler',
          description: `${renewSoon.length} document(s) FDS à renouveler (≤30 jours).`,
          sourceModule: 'controlled_documents',
          sourceId: first?.id ?? null,
          suggestedActionTitle: 'Planifier le renouvellement des FDS',
          suggestedDueInDays: 30,
          confidence: first?.fdsProductRef ? 0.52 : 0.6
        })
      );
    }
  }

  // FDS par produit (lien explicite productId)
  const productsArr = Array.isArray(products) ? products : [];
  if (productsArr.length) {
    /** @type {Map<string, FdsDocumentLike[]>} */
    const docsByProductId = new Map();
    for (const d of fdsDocs) {
      const pid = d?.productId != null && String(d.productId).trim() ? String(d.productId).trim() : '';
      if (!pid) continue;
      const arr = docsByProductId.get(pid) || [];
      arr.push(d);
      docsByProductId.set(pid, arr);
    }
    for (const p of productsArr.slice(0, 500)) {
      const pid = p?.id != null && String(p.id).trim() ? String(p.id).trim() : '';
      if (!pid) continue;
      if (!productRequiresFds(p)) continue;
      const docs = docsByProductId.get(pid) || [];
      if (!docs.length) {
        alerts.push(
          makeAlert({
            id: newAlertId('fds_missing_product', pid, alerts.length + 1),
            type: 'fds_missing_product',
            severity: 'high',
            title: 'FDS manquante (produit)',
            description: `Aucune FDS liée au produit "${String(p?.name || '').slice(0, 200)}".`,
            sourceModule: 'products',
            sourceId: pid,
            suggestedActionTitle: 'Associer une FDS au produit',
            suggestedDueInDays: 7,
            confidence: 0.72
          })
        );
        continue;
      }
      const bestExp = bestExpiryMsForDocs(docs);
      if (bestExp == null) {
        // docs présents mais pas d'échéance fiable → pas d'alerte expiration
        continue;
      }
      const days = Math.round((bestExp - now.getTime()) / 86400000);
      if (days < 0) {
        alerts.push(
          makeAlert({
            id: newAlertId('fds_expired_product', pid, alerts.length + 1),
            type: 'fds_expired_product',
            severity: 'high',
            title: 'FDS expirée (produit)',
            description: `La FDS liée au produit "${String(p?.name || '').slice(0, 200)}" est expirée.`,
            sourceModule: 'products',
            sourceId: pid,
            suggestedActionTitle: 'Mettre à jour la FDS du produit',
            suggestedDueInDays: 14,
            confidence: 0.74
          })
        );
      } else if (days <= 30) {
        alerts.push(
          makeAlert({
            id: newAlertId('fds_renew_soon_product', pid, alerts.length + 1),
            type: 'fds_renew_soon_product',
            severity: 'medium',
            title: 'FDS à renouveler (produit)',
            description: `La FDS liée au produit "${String(p?.name || '').slice(0, 200)}" expire dans ${days} jour(s).`,
            sourceModule: 'products',
            sourceId: pid,
            suggestedActionTitle: 'Planifier le renouvellement FDS du produit',
            suggestedDueInDays: Math.max(1, days),
            confidence: 0.7
          })
        );
      }
    }
  }

  return {
    alerts,
    metrics: { overdueCount: overdue.length, criticalRisksOpen: criticalOpenRisks.length }
  };
}

/**
 * 2) Anomalies / incohérences métier
 * - incohérence G/P/GP → alerte/anomalie
 *
 * @param {{
 *  tenantId?: string|null,
 *  incidents?: IncidentLike[],
 *  risks?: RiskLike[],
 *  actions?: ActionLike[],
 *  audits?: AuditLike[]
 * }} input
 */
export function detectAnomalies(input) {
  const { tenantId, risks = [], actions = [], audits = [] } = input || {};
  assertTenant(tenantId);

  /** @type {Array<Record<string, unknown>>} */
  const anomalies = [];

  // Risques: GP incohérent ou hors bornes
  for (const r of risks.slice(0, 1000)) {
    const p = toIntOrNull(r?.probability);
    const g = toIntOrNull(r?.gravity ?? r?.severity);
    const gp = toIntOrNull(r?.gp);
    const expected = p != null && g != null ? p * g : null;
    if (gp != null && (gp < 1 || gp > 25)) {
      anomalies.push({
        code: 'risk_gp_out_of_range',
        severity: 'high',
        title: 'GP risque hors bornes',
        detail: `GP=${gp} (attendu 1..25).`,
        evidence: { riskRef: r?.ref ?? null, gp, probability: p, gravity: g }
      });
      continue;
    }
    if (expected != null && gp != null && Math.abs(gp - expected) >= 3) {
      anomalies.push({
        code: 'risk_gp_inconsistent',
        severity: 'high',
        title: 'Incohérence gravité/probabilité vs GP',
        detail: `Incohérence: G=${g}, P=${p} ⇒ GP attendu ${expected}, mais GP stocké ${gp}.`,
        evidence: { riskRef: r?.ref ?? null, expectedGp: expected, storedGp: gp, probability: p, gravity: g }
      });
    }
    if (expected != null && gp == null) {
      anomalies.push({
        code: 'risk_gp_missing',
        severity: 'medium',
        title: 'GP manquant',
        detail: `G=${g}, P=${p} ⇒ GP calculable (${expected}) mais GP absent.`,
        evidence: { riskRef: r?.ref ?? null, expectedGp: expected, probability: p, gravity: g }
      });
    }
  }

  // Actions: en retard mais "clôturé" (rare, mais incohérent si dueDate < now et status clos sans 'retard')
  const now = Date.now();
  for (const a of actions.slice(0, 2000)) {
    const due = toTimeMs(a?.dueDate);
    if (due != null && due < now) {
      const overdue = isActionOverdueDashboardRow(a);
      const closedLike = /termin|clos|ferm|fait|complete|réalis|realis|clôtur|clotur|résolu|resolu|done|effectu/i.test(
        String(a?.status || '')
      );
      if (closedLike && overdue) {
        anomalies.push({
          code: 'action_closed_but_overdue',
          severity: 'medium',
          title: 'Action clôturée mais détectée en retard',
          detail: `Statut="${String(a?.status || '')}" avec dueDate passée.`,
          evidence: { actionId: a?.id ?? null, dueDate: a?.dueDate ?? null, status: a?.status ?? null }
        });
      }
    }
  }

  // Audits: score incohérent
  for (const a of audits.slice(0, 1000)) {
    const sc = Number(String(a?.score ?? '').trim().replace(',', '.'));
    if (a?.score != null && a.score !== '' && (!Number.isFinite(sc) || sc < 0 || sc > 100)) {
      anomalies.push({
        code: 'audit_score_invalid',
        severity: 'medium',
        title: 'Score audit invalide',
        detail: `score="${String(a?.score)}" attendu 0..100.`,
        evidence: { auditId: a?.id ?? null, score: a?.score ?? null }
      });
    }
  }

  return { anomalies };
}

/**
 * 3) Score QHSE (0..100) — heuristique explicable, basé sur signaux existants.
 *
 * @param {{
 *  tenantId?: string|null,
 *  incidents?: IncidentLike[],
 *  risks?: RiskLike[],
 *  actions?: ActionLike[],
 *  audits?: AuditLike[],
 *  now?: Date
 * }} input
 */
export function computeQhseScore(input) {
  const { tenantId, incidents = [], risks = [], actions = [], audits = [], now = new Date() } = input || {};
  assertTenant(tenantId);

  // Base 100, on applique des pénalités.
  let score = 100;
  const penalties = [];

  const overdueCount = actions.filter((a) => isActionOverdueDashboardRow(a)).length;
  if (overdueCount > 0) {
    const p = Math.min(35, overdueCount * 3);
    score -= p;
    penalties.push({ code: 'overdue_actions', points: p, evidence: { overdueCount } });
  }

  const openRisks = risks.filter((r) => isRiskLikelyOpen(r.status));
  const criticalOpenRisks = openRisks.filter((r) => isCriticalRisk(r)).length;
  if (criticalOpenRisks > 0) {
    const p = Math.min(30, criticalOpenRisks * 4);
    score -= p;
    penalties.push({ code: 'critical_risks', points: p, evidence: { criticalOpenRisks } });
  }

  // Incidents récents (30j), critique pénalise plus.
  const cutMs = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const recent = incidents.filter((i) => {
    const t = toTimeMs(i?.createdAt);
    return t == null ? true : t >= cutMs;
  });
  const criticalInc = recent.filter((i) => isIncidentCriticalSeverity(i?.severity)).length;
  if (recent.length > 0) {
    const p = Math.min(25, recent.length * 2 + criticalInc * 3);
    score -= p;
    penalties.push({ code: 'recent_incidents', points: p, evidence: { recentIncidents: recent.length, criticalInc } });
  }

  // Audit score moyen (si dispo)
  const scores = audits
    .map((a) => Number(String(a?.score ?? '').trim().replace(',', '.')))
    .filter((x) => Number.isFinite(x) && x >= 0 && x <= 100);
  if (scores.length) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg < 60) {
      const p = Math.min(20, Math.round((60 - avg) * 0.4));
      score -= p;
      penalties.push({ code: 'low_audit_score', points: p, evidence: { avgAuditScore: Math.round(avg * 10) / 10 } });
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, penalties };
}

/**
 * 4) Insights priorisés — transforme alertes/anomalies en cartes actionnables.
 *
 * @param {{
 *  tenantId?: string|null,
 *  incidents?: IncidentLike[],
 *  risks?: RiskLike[],
 *  actions?: ActionLike[],
 *  audits?: AuditLike[],
 *  now?: Date
 * }} input
 */
export function buildPriorityInsights(input) {
  const { tenantId } = input || {};
  assertTenant(tenantId);

  const { alerts } = detectCriticalSituations(input);
  const { anomalies } = detectAnomalies(input);
  const { score } = computeQhseScore(input);

  /** @type {Array<Record<string, unknown>>} */
  const insights = [];

  // Insights à partir des alertes (top 6)
  for (const a of alerts.slice(0, 6)) {
    insights.push({
      kind: 'alert',
      priority: a.severity,
      title: a.title,
      summary: a.description,
      recommendedNextStep: a.suggestedActionTitle || null,
      humanValidationRequired: true,
      evidence: { sourceModule: a.sourceModule, sourceId: a.sourceId }
    });
  }

  // Anomalies (top 6)
  for (const an of anomalies.slice(0, 6)) {
    insights.push({
      kind: 'anomaly',
      priority: an.severity === 'high' ? 'high' : 'medium',
      title: an.title,
      summary: an.detail,
      recommendedNextStep: 'Vérifier les champs source (gravité/probabilité/GP) et corriger si nécessaire.',
      humanValidationRequired: true,
      evidence: an.evidence || {}
    });
  }

  // Score insight
  insights.unshift({
    kind: 'score',
    priority: score < 40 ? 'critical' : score < 60 ? 'high' : score < 80 ? 'medium' : 'low',
    title: 'Score QHSE (heuristique)',
    summary: `Score estimé: ${score}/100 — basé sur retards d’actions, risques critiques, incidents récents, audits.`,
    humanValidationRequired: true,
    evidence: { score }
  });

  return { insights };
}

/**
 * Point d’entrée pratique (optionnel): renvoie `{ alerts, anomalies, score, insights }`.
 *
 * @param {{
 *  tenantId?: string|null,
 *  incidents?: IncidentLike[],
 *  risks?: RiskLike[],
 *  actions?: ActionLike[],
 *  audits?: AuditLike[],
 *  now?: Date
 * }} input
 */
export function buildQhseIntelligenceSnapshot(input) {
  const { tenantId } = input || {};
  assertTenant(tenantId);
  const now = input?.now instanceof Date ? input.now : new Date();
  const base = { ...(input || {}), now };
  const { alerts } = detectCriticalSituations(base);
  const { anomalies } = detectAnomalies(base);
  const { score } = computeQhseScore(base);
  const { insights } = buildPriorityInsights(base);
  return {
    score,
    alerts,
    anomalies,
    insights,
    generatedAt: nowIso(now),
    dataSource: 'api_stats'
  };
}

