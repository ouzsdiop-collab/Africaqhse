import { asDashboardCount, isNcOpen } from '../../utils/reconcileDashboardStats.js';
import { toneByValue, formatDashboardCount } from '../../utils/dashboardMetrics.js';

export const KPI_TONE_CLASSES = [
  'dashboard-kpi-card--tone-blue',
  'dashboard-kpi-card--tone-red',
  'dashboard-kpi-card--tone-amber',
  'dashboard-kpi-card--tone-green',
  'dashboard-kpi-card--tone-success'
];

/**
 * @param {{ kpiPriorityLine: HTMLElement }} refs
 * @param {{ stats?: object, ncListForKpi?: unknown[] }} state
 */
export function updateKpiPriorityLine(refs, state) {
  const { kpiPriorityLine } = refs;
  const { stats = {}, ncListForKpi = [] } = state || {};
  const crit = Array.isArray(stats.criticalIncidents) ? stats.criticalIncidents.length : 0;
  const od = asDashboardCount(stats.overdueActions);
  const ncOpen = ncListForKpi.filter(isNcOpen).length;
  const n = crit + od + ncOpen;
  const scalarsQuiet =
    asDashboardCount(stats.incidents) === 0 &&
    asDashboardCount(stats.actions) === 0 &&
    asDashboardCount(stats.overdueActions) === 0 &&
    asDashboardCount(stats.nonConformities) === 0;
  if (n === 0 && scalarsQuiet) {
    kpiPriorityLine.textContent =
      'Aucune donnée sur ce périmètre — vérifiez le filtre site ou élargissez la vue.';
    kpiPriorityLine.className = 'dashboard-kpi-priority-line dashboard-kpi-priority-line--ok';
  } else if (n === 0) {
    kpiPriorityLine.textContent = 'Aucun élément critique à traiter en priorité aujourd’hui.';
    kpiPriorityLine.className = 'dashboard-kpi-priority-line dashboard-kpi-priority-line--ok';
  } else {
    kpiPriorityLine.textContent = `${n} élément${n > 1 ? 's' : ''} critique${n > 1 ? 's' : ''} à traiter aujourd’hui`;
    kpiPriorityLine.className = 'dashboard-kpi-priority-line dashboard-kpi-priority-line--attention';
  }
}

/**
 * @param {object} refs
 * @param {Record<string, HTMLElement>} refs.kpiValues
 * @param {Record<string, HTMLElement | undefined>} refs.kpiEmptyHints
 * @param {HTMLElement} refs.kpiPriorityLine
 * @param {() => string} refs.getScopeEmptyLabel
 * @param {() => unknown[]} refs.getNcListForKpi
 * @param {object} data — stats dashboard (même objet qu’avant : `lastStats` / payload normalisé)
 */
export function applyStatsToKpis(refs, data) {
  const scopeHint = refs.getScopeEmptyLabel();
  const emptyHints = refs.kpiEmptyHints ?? {};

  const incN = asDashboardCount(data.incidents);
  refs.kpiValues.incidents.textContent = formatDashboardCount(data.incidents);
  const incHint = emptyHints.incidents;
  if (incHint) {
    incHint.hidden = incN !== 0;
    incHint.textContent = incN === 0 ? scopeHint : '';
  }

  const lateN = asDashboardCount(data.overdueActions);
  const lateCard = refs.kpiValues.actionsLate?.closest('.dashboard-kpi-card');
  const lateDefault = lateCard?.querySelector('.dashboard-kpi-default');
  const lateSuccess = lateCard?.querySelector('.dashboard-kpi-zero-success');
  const lateNote = lateCard?.querySelector('.metric-note');
  if (lateSuccess && lateDefault && lateCard && refs.kpiValues.actionsLate) {
    if (lateN === 0) {
      lateDefault.hidden = true;
      if (lateNote) lateNote.hidden = true;
      lateSuccess.hidden = false;
      KPI_TONE_CLASSES.forEach((c) => lateCard.classList.remove(c));
      lateCard.classList.add('dashboard-kpi-card--tone-success');
    } else {
      lateDefault.hidden = false;
      if (lateNote) lateNote.hidden = false;
      lateSuccess.hidden = true;
      KPI_TONE_CLASSES.forEach((c) => lateCard.classList.remove(c));
      lateCard.classList.add('dashboard-kpi-card--tone-red');
      refs.kpiValues.actionsLate.textContent = formatDashboardCount(data.overdueActions);
    }
  } else if (refs.kpiValues.actionsLate) {
    refs.kpiValues.actionsLate.textContent = formatDashboardCount(data.overdueActions);
  }

  const lateTone = toneByValue(data.overdueActions, 1, 3);
  const incTone = toneByValue(data.incidents, 3, 8);
  [refs.kpiValues.actionsLate?.parentElement, refs.kpiValues.incidents?.parentElement].forEach((el) => {
    if (!el) return;
    el.classList.remove('dashboard-kpi-card--crit');
  });
  if (lateN > 0 && lateTone === 'red')
    refs.kpiValues.actionsLate?.parentElement?.classList.add('dashboard-kpi-card--crit');
  if (incTone === 'red') refs.kpiValues.incidents?.parentElement?.classList.add('dashboard-kpi-card--crit');

  updateKpiPriorityLine(
    { kpiPriorityLine: refs.kpiPriorityLine },
    { stats: data, ncListForKpi: refs.getNcListForKpi() }
  );
}

/**
 * @param {object} refs
 * @param {Record<string, HTMLElement>} refs.kpiValues
 * @param {Record<string, HTMLElement | undefined>} refs.kpiEmptyHints
 * @param {Record<string, HTMLElement | undefined>} [refs.kpiNotes]
 * @param {() => string} refs.getScopeEmptyLabel
 */
export function applyEnrichmentKpis(refs, ncList, auditList, ncTotalAggregate) {
  const scopeHint = refs.getScopeEmptyLabel();
  const emptyHints = refs.kpiEmptyHints ?? {};
  if (Array.isArray(ncList)) {
    const n = ncList.filter(isNcOpen).length;
    refs.kpiValues.ncOpen.textContent = String(n);
    const ncHint = emptyHints.ncOpen;
    if (ncHint) {
      ncHint.hidden = n !== 0;
      ncHint.textContent = n === 0 ? scopeHint : '';
    }
    if (refs.kpiNotes?.ncOpen) {
      const agg =
        ncTotalAggregate != null && Number.isFinite(Number(ncTotalAggregate))
          ? `${formatDashboardCount(Number(ncTotalAggregate))} NC au total (API)`
          : 'total API indisponible';
      refs.kpiNotes.ncOpen.textContent = `${n} ouvertes · ${agg}`;
    }
  }
  if (auditList && auditList.length) {
    const scores = auditList
      .map((a) => Number(a.score))
      .filter((n) => Number.isFinite(n));
    if (scores.length) {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      refs.kpiValues.auditScore.textContent = `${avg}%`;
    } else {
      refs.kpiValues.auditScore.textContent = '—';
    }
    refs.kpiValues.auditsN.textContent = String(auditList.length);
    const audHint = emptyHints.auditsN;
    if (audHint) {
      audHint.hidden = true;
      audHint.textContent = '';
    }
  } else {
    refs.kpiValues.auditScore.textContent = '—';
    refs.kpiValues.auditsN.textContent = '0';
    const audHint = emptyHints.auditsN;
    if (audHint) {
      audHint.hidden = false;
      audHint.textContent = scopeHint;
    }
  }
}

/**
 * Retire la couche squelette KPI (même sélecteur que `renderKpiCards`).
 * @param {HTMLElement | null | undefined} kpiStickyWrap
 */
export function dismissKpiSkeleton(kpiStickyWrap) {
  const layer = kpiStickyWrap?.querySelector('.dashboard-kpi-skeleton-layer');
  if (layer?.isConnected) layer.remove();
}
