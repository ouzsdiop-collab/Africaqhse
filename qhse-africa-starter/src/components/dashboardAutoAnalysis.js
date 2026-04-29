/**
 * Analyse automatique : jusqu’à 2 sujets actionnables (titres courts + donnée clé + CTA).
 * Compteurs : `stats` / listes chargées. Les courbes de tendance du dashboard passent par
 * `stats.timeseries` (voir chartsSection / decisionPanel / audit chart block).
 */

import { computeIncidentWeekMetrics } from '../utils/dashboardIncidentMetrics.js';
import { createDashboardBlockActions, goDashboardPage } from '../utils/dashboardBlockActions.js';
import { qhseNavigate } from '../utils/qhseNavigate.js';

const MAX_INSIGHTS = 2;

/** @typedef {'actions' | 'incidents' | 'compliance' | 'calm'} InsightAccent */

function isNcOpen(row) {
  const s = String(row?.status || '').toLowerCase();
  if (!s) return true;
  if (/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(s)) return false;
  return true;
}

/**
 * @typedef {{ label: string; pageId: string; intent?: Record<string, unknown> }} InsightLink
 * @typedef {{
 *   message: string;
 *   recommendation: string;
 *   reason: string;
 *   see: InsightLink;
 *   apply: InsightLink;
 *   accent: InsightAccent;
 *   source: 'heuristic' | 'deterministic' | 'ai';
 *   confidence: 'low' | 'medium' | 'high';
 *   dataQuality: 'complete' | 'partial' | 'unavailable';
 *   severity?: 'low' | 'medium' | 'high' | 'critical';
 *   label?: string;
 *   recommendedAction?: string;
 * }} Insight
 */

/**
 * @param {Record<string, unknown>} stats
 * @returns {Record<string, unknown>}
 */
function buildOverdueActionsIntent(stats) {
  const overdue = Array.isArray(stats?.overdueActionItems) ? stats.overdueActionItems : [];
  const row = overdue[0];
  /** @type {Record<string, unknown>} */
  const base = {
    actionsColumnFilter: 'overdue',
    scrollToId: 'qhse-actions-col-overdue'
  };
  if (!row || typeof row !== 'object') return base;
  const aid = row.id != null ? String(row.id).trim() : '';
  const ttl = String(row.title || '').trim().slice(0, 240);
  if (aid) base.focusActionId = aid;
  if (ttl) base.focusActionTitle = ttl;
  return base;
}

/**
 * @param {unknown[]} incidents
 * @param {Record<string, unknown>} stats
 * @param {number} now
 * @returns {Record<string, unknown>}
 */
function buildIncidentsWeekIntent(incidents, stats, now) {
  const cutoff = now - 7 * 86400000;
  const list = Array.isArray(incidents) ? incidents : [];
  /** @type {Record<string, unknown>} */
  const base = { dashboardIncidentPeriodPreset: '7' };
  for (const row of list) {
    if (!row || typeof row !== 'object') continue;
    const t = row.createdAt ? new Date(row.createdAt).getTime() : 0;
    if (!Number.isFinite(t) || t < cutoff) continue;
    const ref = row.ref != null ? String(row.ref).trim() : '';
    const iid = row.id != null ? String(row.id).trim() : '';
    const hint = String(row.title || row.type || '').trim().slice(0, 240);
    if (ref || iid || hint) {
      /** @type {Record<string, unknown>} */
      const out = { ...base };
      if (ref) out.focusIncidentRef = ref;
      if (iid) out.focusIncidentId = iid;
      if (hint) out.focusIncidentHintTitle = hint;
      return out;
    }
  }
  const crit = Array.isArray(stats?.criticalIncidents) ? stats.criticalIncidents : [];
  if (crit.length) {
    const row = crit[0];
    const ref = row.ref != null ? String(row.ref).trim() : '';
    const iid = row.id != null ? String(row.id).trim() : '';
    const hint = String(row.title || row.type || '').trim().slice(0, 240);
    return {
      ...base,
      incidentSeverityFilter: 'critique',
      ...(ref ? { focusIncidentRef: ref } : {}),
      ...(iid ? { focusIncidentId: iid } : {}),
      ...(hint ? { focusIncidentHintTitle: hint } : {})
    };
  }
  return base;
}

/**
 * @param {unknown | null | undefined} firstNc
 * @returns {Record<string, unknown>}
 */
function buildAuditsNcIntent(firstNc) {
  /** @type {Record<string, unknown>} */
  const base = { scrollToId: 'audit-cockpit-tier-critical' };
  if (!firstNc || typeof firstNc !== 'object') return base;
  const aref = firstNc.auditRef != null ? String(firstNc.auditRef).trim() : '';
  const aid = firstNc.auditId != null ? String(firstNc.auditId).trim() : '';
  const ttl = String(firstNc.title || '').trim().slice(0, 120);
  return {
    ...base,
    ...(aref ? { focusAuditRef: aref } : {}),
    ...(aid ? { focusAuditId: aid } : {}),
    ...(ttl ? { linkedNonConformity: ttl } : {})
  };
}

/**
 * @param {{
 *   stats?: {
 *     overdueActions?: number;
 *     incidents?: number;
 *     actions?: number;
 *     overdueActionItems?: unknown[];
 *     criticalIncidents?: unknown[];
 *   };
 *   incidents?: unknown[];
 *   ncs?: unknown[];
 * }} input
 * @returns {Insight[]}
 */
export function computeAutoAnalysisInsights(input) {
  const stats = input?.stats || {};
  const incidents = Array.isArray(input?.incidents) ? input.incidents : [];
  const ncs = Array.isArray(input?.ncs) ? input.ncs : [];

  const od = Math.max(0, Number(stats.overdueActions) || 0);
  const openNc = ncs.filter(isNcOpen).length;

  const now = Date.now();
  const { last7, spike } = computeIncidentWeekMetrics(incidents, now);

  /** @type {Insight[]} */
  const items = [];

  const dqOverdue =
    Array.isArray(stats?.overdueActionItems) && stats.overdueActionItems.length
      ? 'complete'
      : Number.isFinite(Number(stats?.overdueActions))
        ? 'partial'
        : 'unavailable';
  const dqIncidents =
    Number.isFinite(Number(stats?.incidents)) ? 'complete' : incidents.length ? 'partial' : 'unavailable';
  const dqNc =
    Number.isFinite(Number(stats?.nonConformities)) ? 'partial' : ncs.length ? 'partial' : 'unavailable';

  if (od >= 2) {
    const actIntent = buildOverdueActionsIntent(stats);
    items.push({
      accent: 'actions',
      message: 'Retards',
      recommendation: `${od} actions en retard`,
      reason: `${od} action(s) dépassent leur échéance. Traitez, réassignez ou replanifiez.`,
      see: { label: 'Actions', pageId: 'actions', intent: actIntent },
      apply: { label: 'Traiter', pageId: 'actions', intent: actIntent },
      source: 'heuristic',
      confidence: od >= 4 ? 'high' : 'medium',
      dataQuality: dqOverdue,
      severity: od >= 6 ? 'critical' : od >= 3 ? 'high' : 'medium',
      label: 'Actions en retard',
      recommendedAction: 'Ouvrir le plan d’actions et traiter les retards.'
    });
  } else if (od === 1) {
    const actIntent = buildOverdueActionsIntent(stats);
    items.push({
      accent: 'actions',
      message: 'Retard',
      recommendation: '1 action en retard',
      reason: "Une action a dépassé son échéance. À traiter en priorité pour éviter l’accumulation.",
      see: { label: 'Actions', pageId: 'actions', intent: actIntent },
      apply: { label: 'Traiter', pageId: 'actions', intent: actIntent },
      source: 'heuristic',
      confidence: 'medium',
      dataQuality: dqOverdue,
      severity: 'medium',
      label: 'Action en retard',
      recommendedAction: 'Ouvrir le plan d’actions et clôturer ou replanifier.'
    });
  }

  if (spike || last7 >= 4) {
    const incIntent = buildIncidentsWeekIntent(incidents, stats, now);
    items.push({
      accent: 'incidents',
      message: spike ? 'Pic' : 'Activité 7 j',
      recommendation: spike ? `${last7} en 7 j` : `${last7} · 7 j`,
      reason: spike
        ? `Pic d’incidents sur 7 jours (${last7}). Vérifiez les causes récurrentes.`
        : `Activité incidents élevée sur 7 jours (${last7}). À analyser.`,
      see: { label: 'Incidents', pageId: 'incidents', intent: incIntent },
      apply: { label: 'Voir', pageId: 'incidents', intent: incIntent },
      source: 'heuristic',
      confidence: spike ? 'high' : 'medium',
      dataQuality: dqIncidents,
      severity: spike ? 'high' : 'medium',
      label: 'Incidents (7 jours)',
      recommendedAction: 'Ouvrir les incidents récents et vérifier les causes récurrentes.'
    });
  }

  if (openNc >= 1) {
    const firstNc = ncs.find(isNcOpen);
    const auditsIntent = buildAuditsNcIntent(firstNc);
    const applyActionsIntent = buildOverdueActionsIntent(stats);
    items.push({
      accent: 'compliance',
      message: 'NC ouvertes',
      recommendation: openNc >= 3 ? `${openNc} ouvertes` : `${openNc} ouverte`,
      reason: `Des non-conformités sont ouvertes (${openNc}). Priorisez celles qui bloquent la conformité et la clôture.`,
      see: { label: 'NC', pageId: 'audits', intent: auditsIntent },
      apply: { label: 'Actions', pageId: 'actions', intent: applyActionsIntent },
      source: 'heuristic',
      confidence: openNc >= 3 ? 'high' : 'medium',
      dataQuality: dqNc,
      severity: openNc >= 5 ? 'high' : 'medium',
      label: 'Non-conformités ouvertes',
      recommendedAction: 'Ouvrir les audits/NC et définir un plan de clôture.'
    });
  }

  const totalInc = Number(stats.incidents);
  const totalAct = Number(stats.actions);
  const aggLow =
    Number.isFinite(totalInc) &&
    Number.isFinite(totalAct) &&
    totalInc === 0 &&
    totalAct === 0 &&
    od === 0 &&
    openNc === 0 &&
    last7 === 0;

  if (aggLow && items.length < MAX_INSIGHTS) {
    items.push({
      accent: 'calm',
      message: 'Sous contrôle',
      recommendation: 'RAS sur les seuils',
      reason: 'Aucun signal fort sur la période (retards, incidents, NC). Maintenez le suivi.',
      see: { label: 'Incidents', pageId: 'incidents', intent: { dashboardIncidentPeriodPreset: '30' } },
      apply: { label: 'Audits', pageId: 'audits', intent: { scrollToId: 'audit-cockpit-tier-score' } },
      source: 'heuristic',
      confidence: 'medium',
      dataQuality: dqIncidents
    });
  }

  return items.slice(0, MAX_INSIGHTS);
}

/**
 * @param {InsightLink} link
 */
function navigateInsightLink(link) {
  const pid = String(link.pageId || '').trim();
  if (!pid) return;
  const raw = link.intent && typeof link.intent === 'object' ? { ...link.intent } : {};
  delete raw.source;
  const keys = Object.keys(raw).filter((k) => raw[k] !== undefined && raw[k] !== '');
  if (keys.length > 0) {
    qhseNavigate(pid, { ...raw, source: 'dashboard_auto_analysis' });
  } else {
    goDashboardPage(pid);
  }
}

/**
 * @param {HTMLElement} parent
 * @param {InsightLink} see
 * @param {InsightLink} apply
 */
function appendInsightActions(parent, see, apply) {
  const row = document.createElement('div');
  row.className = 'dashboard-auto-analysis-item-acts';

  const mk = (link, cls) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `dashboard-auto-analysis-act ${cls}`;
    b.textContent = link.label;
    b.addEventListener('click', () => navigateInsightLink(link));
    return b;
  };

  if (see.pageId === apply.pageId) {
    row.append(mk(see, 'dashboard-auto-analysis-act--see'));
  } else {
    row.append(mk(see, 'dashboard-auto-analysis-act--see'));
    row.append(mk(apply, 'dashboard-auto-analysis-act--apply'));
  }
  parent.append(row);
}

export function createDashboardAutoAnalysis() {
  const card = document.createElement('article');
  card.className = 'content-card card-soft dashboard-auto-analysis-card';

  const strip = document.createElement('div');
  strip.className = 'dashboard-auto-analysis-strip';
  const stripBadge = document.createElement('span');
  stripBadge.className = 'dashboard-auto-analysis-strip-badge';
  stripBadge.textContent = 'À traiter';
  const stripText = document.createElement('p');
  stripText.className = 'dashboard-auto-analysis-strip-text';
  strip.append(stripBadge, stripText);

  const host = document.createElement('div');
  host.className = 'dashboard-auto-analysis-host';
  card.append(strip, host);

  function update(payload) {
    card.querySelector('.dashboard-auto-analysis-actions')?.remove();
    const insights = computeAutoAnalysisInsights(payload || {});

    stripBadge.textContent = insights.length ? 'Priorité' : 'Veille';
    stripBadge.classList.toggle('dashboard-auto-analysis-strip-badge--idle', !insights.length);
    stripText.textContent =
      insights.length === 0
        ? 'Rien à trancher.'
        : `${insights.length} point${insights.length > 1 ? 's' : ''} max.`;

    host.replaceChildren();

    if (!insights.length) {
      const block = document.createElement('div');
      block.className = 'dashboard-auto-analysis-empty-block';
      const icon = document.createElement('div');
      icon.className = 'dashboard-auto-analysis-empty-icon';
      icon.setAttribute('aria-hidden', 'true');
      const check = document.createElement('span');
      check.className = 'dashboard-auto-analysis-empty-check';
      check.textContent = '✓';
      icon.append(check);
      const copy = document.createElement('div');
      copy.className = 'dashboard-auto-analysis-empty-copy';
      const p = document.createElement('p');
      p.className = 'dashboard-auto-analysis-empty-lead';
      p.textContent = 'Seuils OK.';
      copy.append(p);
      block.append(icon, copy);
      host.append(block);
    } else {
      const list = document.createElement('ul');
      list.className = 'dashboard-auto-analysis-list';
      insights.forEach(({ message, recommendation, see, apply, accent }) => {
        const li = document.createElement('li');
        li.className = `dashboard-auto-analysis-item dashboard-auto-analysis-item--accent-${accent}`;

        const body = document.createElement('div');
        body.className = 'dashboard-auto-analysis-item-body';

        const title = document.createElement('p');
        title.className = 'dashboard-auto-analysis-msg dashboard-auto-analysis-msg--title';
        title.textContent = message;

        const key = document.createElement('p');
        key.className = 'dashboard-auto-analysis-rec dashboard-auto-analysis-rec--key';
        key.textContent = recommendation;

        body.append(title, key);
        appendInsightActions(body, see, apply);
        li.append(body);
        list.append(li);
      });
      host.append(list);
    }

    if (!insights.length) {
      const actWrap = document.createElement('div');
      actWrap.className = 'dashboard-auto-analysis-actions';
      const bar = createDashboardBlockActions(
        [
          {
            label: 'Incidents',
            pageId: 'incidents',
            intent: { dashboardIncidentPeriodPreset: '30', source: 'dashboard_auto_analysis' }
          },
          {
            label: 'Audits',
            pageId: 'audits',
            intent: { scrollToId: 'audit-cockpit-tier-score', source: 'dashboard_auto_analysis' }
          }
        ],
        { className: 'dashboard-block-actions dashboard-block-actions--tight' }
      );
      if (bar) actWrap.append(bar);
      if (actWrap.childNodes.length) card.append(actWrap);
    }
  }

  return { root: card, update };
}
