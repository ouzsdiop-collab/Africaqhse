/**
 * Bloc « État du système QHSE » — synthèse direction à partir des données dashboard existantes (pas d’API dédiée).
 */

import { buildIncidentMonthlySeries, classifyActionsForMix } from './dashboardCharts.js';
import { createDashboardBlockActions } from '../utils/dashboardBlockActions.js';

function isNcOpen(row) {
  const s = String(row?.status || '').toLowerCase();
  if (!s) return true;
  if (/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(s)) return false;
  return true;
}

/** @param {{ label: string; value: number }[]} series */
function incidentTrendNote(series) {
  if (!Array.isArray(series) || series.length < 4) {
    return 'Vue incidents en cours de consolidation';
  }
  const n = series.length;
  const recent = (series[n - 1]?.value || 0) + (series[n - 2]?.value || 0);
  const older = (series[n - 3]?.value || 0) + (series[n - 4]?.value || 0);
  if (recent > older + 1) return 'Activité récente en hausse';
  if (older > recent + 1) return 'Activité récente en baisse';
  return 'Activité récente stable';
}

/**
 * @param {{
 *   criticalN: number;
 *   overdueAgg: number;
 *   openNc: number;
 *   avgScore: number | null;
 *   series: { label: string; value: number }[];
 * }} p
 */
function pickLevel(p) {
  const { criticalN, overdueAgg, openNc, avgScore, series } = p;
  const hotIncidents =
    Array.isArray(series) &&
    series.length >= 4 &&
    (series[series.length - 1]?.value || 0) + (series[series.length - 2]?.value || 0) >
      (series[series.length - 3]?.value || 0) + (series[series.length - 4]?.value || 0) + 2;

  if (criticalN > 0 || overdueAgg >= 4 || openNc >= 6) {
    return {
      level: 'fix',
      headline: 'Des écarts nécessitent une correction',
      hint: 'Prioriser les sujets listés dans les alertes.'
    };
  }
  if (
    overdueAgg >= 1 ||
    openNc >= 1 ||
    (avgScore != null && avgScore < 68) ||
    hotIncidents
  ) {
    return {
      level: 'watch',
      headline: 'Système sous vigilance',
      hint: 'Surveiller les indicateurs et le suivi des plans.'
    };
  }
  return {
    level: 'stable',
    headline: 'Système globalement stable',
    hint: 'Maintenir le pilotage et les revues prévues.'
  };
}

export function createDashboardSystemStatus() {
  const article = document.createElement('article');
  article.className = 'content-card card-soft dashboard-sys-status';
  article.setAttribute('aria-live', 'polite');

  article.innerHTML = `
    <div class="dashboard-sys-status__strip" data-sys-strip></div>
    <div class="dashboard-sys-status__body">
      <p class="dashboard-sys-status__headline" data-sys-headline></p>
      <p class="dashboard-sys-status__hint" data-sys-hint></p>
      <div class="dashboard-sys-status__grid" data-sys-grid></div>
      <div class="dashboard-sys-status__actions" data-sys-actions hidden></div>
    </div>
  `;

  const strip = article.querySelector('[data-sys-strip]');
  const headlineEl = article.querySelector('[data-sys-headline]');
  const hintEl = article.querySelector('[data-sys-hint]');
  const gridEl = article.querySelector('[data-sys-grid]');
  const actionsEl = article.querySelector('[data-sys-actions]');

  function renderCell(label, value) {
    const cell = document.createElement('div');
    cell.className = 'dashboard-sys-status__cell';
    const lb = document.createElement('span');
    lb.className = 'dashboard-sys-status__label';
    lb.textContent = label;
    const val = document.createElement('span');
    val.className = 'dashboard-sys-status__value';
    val.textContent = value;
    cell.append(lb, val);
    return cell;
  }

  /**
   * @param {{
   *   stats: object;
   *   incidents?: unknown[];
   *   actions?: unknown[];
   *   audits?: unknown[];
   *   ncs?: unknown[];
   * }} payload
   */
  function update(payload) {
    const stats = payload.stats || {};
    const incidents = Array.isArray(payload.incidents) ? payload.incidents : [];
    const actions = Array.isArray(payload.actions) ? payload.actions : [];
    const audits = Array.isArray(payload.audits) ? payload.audits : [];
    const ncs = Array.isArray(payload.ncs) ? payload.ncs : [];

    const criticalN = Array.isArray(stats.criticalIncidents) ? stats.criticalIncidents.length : 0;
    const overdueAgg = Number(stats.overdueActions);
    const od = Number.isFinite(overdueAgg) ? overdueAgg : 0;
    const openNc = ncs.filter(isNcOpen).length;

    const scores = audits.map((a) => Number(a.score)).filter((n) => Number.isFinite(n));
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

    const series = buildIncidentMonthlySeries(incidents);
    const mix = classifyActionsForMix(actions);
    const denom = mix.done + mix.overdue + mix.other;
    const closurePct = denom > 0 ? Math.round((mix.done / denom) * 100) : null;

    const { level, headline, hint } = pickLevel({
      criticalN,
      overdueAgg: od,
      openNc,
      avgScore,
      series
    });

    article.className = `content-card card-soft dashboard-sys-status dashboard-sys-status--${level}`;
    strip.className = `dashboard-sys-status__strip dashboard-sys-status__strip--${level}`;
    headlineEl.textContent = headline;
    hintEl.textContent = hint;

    gridEl.replaceChildren(
      renderCell('Performance audits', avgScore != null ? `${avgScore} %` : '—'),
      renderCell(
        'Avancement des actions',
        closurePct != null ? `${closurePct} % traitées` : '—'
      ),
      renderCell('NC ouvertes', String(openNc)),
      renderCell('Tendance incidents', incidentTrendNote(series))
    );

    if (actionsEl) {
      actionsEl.replaceChildren();
      const quick = createDashboardBlockActions(
        [
          { label: 'Piloter les actions', pageId: 'actions' },
          { label: 'Voir les audits', pageId: 'audits' }
        ],
        { className: 'dashboard-block-actions dashboard-block-actions--tight' }
      );
      if (quick) {
        actionsEl.append(quick);
        actionsEl.hidden = false;
      } else {
        actionsEl.hidden = true;
      }
    }
  }

  return { root: article, update };
}
