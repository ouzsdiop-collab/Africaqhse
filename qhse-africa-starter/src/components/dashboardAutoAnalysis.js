/**
 * Analyse automatique — jusqu’à 2 sujets actionnables (titres courts + donnée clé + CTA).
 */

import { computeIncidentWeekMetrics } from '../utils/dashboardIncidentMetrics.js';
import { createDashboardBlockActions, goDashboardPage } from '../utils/dashboardBlockActions.js';

const MAX_INSIGHTS = 2;

/** @typedef {'actions' | 'incidents' | 'compliance' | 'calm'} InsightAccent */

function isNcOpen(row) {
  const s = String(row?.status || '').toLowerCase();
  if (!s) return true;
  if (/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(s)) return false;
  return true;
}

/**
 * @typedef {{ label: string; pageId: string }} InsightLink
 * @typedef {{
 *   message: string;
 *   recommendation: string;
 *   see: InsightLink;
 *   apply: InsightLink;
 *   accent: InsightAccent;
 * }} Insight
 */

/**
 * @param {{
 *   stats?: { overdueActions?: number; incidents?: number; actions?: number };
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

  if (od >= 2) {
    items.push({
      accent: 'actions',
      message: 'Retards',
      recommendation: `${od} actions en retard`,
      see: { label: 'Actions', pageId: 'actions' },
      apply: { label: 'Traiter', pageId: 'actions' }
    });
  } else if (od === 1) {
    items.push({
      accent: 'actions',
      message: 'Retard',
      recommendation: '1 action en retard',
      see: { label: 'Actions', pageId: 'actions' },
      apply: { label: 'Traiter', pageId: 'actions' }
    });
  }

  if (spike || last7 >= 4) {
    items.push({
      accent: 'incidents',
      message: spike ? 'Pic' : 'Activité 7 j',
      recommendation: spike ? `${last7} en 7 j` : `${last7} · 7 j`,
      see: { label: 'Incidents', pageId: 'incidents' },
      apply: { label: 'Voir', pageId: 'incidents' }
    });
  }

  if (openNc >= 1) {
    items.push({
      accent: 'compliance',
      message: 'NC ouvertes',
      recommendation: openNc >= 3 ? `${openNc} ouvertes` : `${openNc} ouverte`,
      see: { label: 'NC', pageId: 'audits' },
      apply: { label: 'Actions', pageId: 'actions' }
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
      see: { label: 'Incidents', pageId: 'incidents' },
      apply: { label: 'Audits', pageId: 'audits' }
    });
  }

  return items.slice(0, MAX_INSIGHTS);
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
    b.addEventListener('click', () => goDashboardPage(link.pageId));
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
          { label: 'Incidents', pageId: 'incidents' },
          { label: 'Audits', pageId: 'audits' }
        ],
        { className: 'dashboard-block-actions dashboard-block-actions--tight' }
      );
      if (bar) actWrap.append(bar);
      if (actWrap.childNodes.length) card.append(actWrap);
    }
  }

  return { root: card, update };
}
