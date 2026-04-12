/**
 * Panneaux consultation incidents : analytics, journal local, priorités, lignes tableau.
 */

import { activityLogStore } from '../data/activityLog.js';
import {
  buildMonthlyCountSeries,
  createDashboardLineChart,
  createIncidentTypeBreakdown,
  buildTopIncidentTypes
} from './dashboardCharts.js';
import { mapRowToDisplay } from '../utils/incidentsMappers.js';

function severityDsBadgeClass(sev) {
  if (sev === 'faible') return 'ds-badge--ok';
  if (sev === 'critique') return 'ds-badge--danger';
  return 'ds-badge--warn';
}

function buildSeverityBreakdownEntries(list) {
  let c = 0;
  let m = 0;
  let f = 0;
  list.forEach((i) => {
    if (i.severity === 'critique') c += 1;
    else if (i.severity === 'faible') f += 1;
    else m += 1;
  });
  return [
    { type: 'Critique', count: c },
    { type: 'Moyen', count: m },
    { type: 'Faible', count: f }
  ];
}

function buildCauseProxyEntries(list) {
  const map = new Map();
  buildTopIncidentTypes(list, 12).forEach(({ type, count }) => {
    const lbl =
      type === 'Accident'
        ? 'Comportement / geste'
        : type === 'Quasi-accident'
          ? 'Near-miss / vigilance'
          : type === 'Environnement'
            ? 'Environnement / matière'
            : type === 'Engin / circulation'
              ? 'Circulation / engins'
              : 'Autres facteurs';
    map.set(lbl, (map.get(lbl) || 0) + count);
  });
  return [...map.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/**
 * @param {HTMLElement} analyticsGrid
 * @param {{ apiLoadState: string; incidentRecords: object[] }} opts
 */
export function refreshIncidentsAnalytics(analyticsGrid, opts) {
  const { apiLoadState, incidentRecords } = opts;
  analyticsGrid.replaceChildren();
  if (apiLoadState !== 'ok' || !incidentRecords.length) {
    const p = document.createElement('p');
    p.className = 'incidents-detail-muted';
    p.textContent =
      apiLoadState === 'loading'
        ? 'Chargement des graphiques…'
        : 'Aucune donnée incident à analyser sur cette vue.';
    analyticsGrid.append(p);
    return;
  }
  const monthly = buildMonthlyCountSeries(
    incidentRecords,
    (row) => (row.createdAt ? String(row.createdAt) : null),
    6
  );
  const c1 = document.createElement('div');
  c1.className = 'incidents-analytics-cell';
  const t1 = document.createElement('h4');
  t1.className = 'incidents-analytics-cell__title';
  t1.textContent = 'Évolution des déclarations';
  c1.append(
    t1,
    createDashboardLineChart(monthly, {
      lineTheme: 'incidents',
      footText: null,
      ariaLabel: 'Nombre d’incidents déclarés par mois sur six mois.'
    })
  );

  const c2 = document.createElement('div');
  c2.className = 'incidents-analytics-cell';
  const t2 = document.createElement('h4');
  t2.className = 'incidents-analytics-cell__title';
  t2.textContent = 'Répartition par type';
  c2.append(t2, createIncidentTypeBreakdown(buildTopIncidentTypes(incidentRecords)));

  const c3 = document.createElement('div');
  c3.className = 'incidents-analytics-cell';
  const t3 = document.createElement('h4');
  t3.className = 'incidents-analytics-cell__title';
  t3.textContent = 'Gravité';
  c3.append(t3, createIncidentTypeBreakdown(buildSeverityBreakdownEntries(incidentRecords)));

  const c4 = document.createElement('div');
  c4.className = 'incidents-analytics-cell';
  const t4 = document.createElement('h4');
  t4.className = 'incidents-analytics-cell__title';
  t4.textContent = 'Causes apparentes (proxy types)';
  c4.append(t4, createIncidentTypeBreakdown(buildCauseProxyEntries(incidentRecords)));

  analyticsGrid.append(c1, c2, c3, c4);
}

/**
 * @param {HTMLElement} journalBody
 */
export function refreshIncidentsJournalDom(journalBody) {
  journalBody.replaceChildren();
  const items = activityLogStore
    .all()
    .filter((e) => e.module === 'incidents')
    .slice(0, 12);
  if (!items.length) {
    const p = document.createElement('p');
    p.className = 'incidents-journal-empty';
    p.textContent =
      'Aucun événement — le journal se remplit quand vous déclarez ou mettez à jour une fiche.';
    journalBody.append(p);
    return;
  }
  const ul = document.createElement('ul');
  ul.className = 'incidents-journal-list';
  items.forEach((e) => {
    const li = document.createElement('li');
    li.className = 'incidents-journal-li';
    const strong = document.createElement('strong');
    strong.textContent = e.action || '—';
    const detail = document.createElement('span');
    detail.className = 'incidents-journal-li__detail';
    detail.textContent = e.detail ? ` — ${e.detail}` : '';
    const meta = document.createElement('span');
    meta.className = 'incidents-journal-li__meta';
    meta.textContent = ` · ${e.timestamp || ''} · ${e.user || ''}`;
    li.append(strong, detail, meta);
    ul.append(li);
  });
  journalBody.append(ul);
}

/**
 * @param {HTMLElement} prioritiesHost
 * @param {object} opts
 */
export function refreshIncidentsPrioritiesStrip(prioritiesHost, opts) {
  const {
    apiLoadState,
    incidentRecords,
    sortIncidentsForDisplay,
    isStatusClosed,
    onActivateIncident
  } = opts;

  prioritiesHost.replaceChildren();
  if (apiLoadState === 'loading') {
    const p = document.createElement('p');
    p.className = 'incidents-priorities-muted';
    p.textContent = 'Chargement des priorités…';
    prioritiesHost.append(p);
    return;
  }
  if (apiLoadState === 'error' && incidentRecords.length === 0) {
    const p = document.createElement('p');
    p.className = 'incidents-priorities-muted';
    p.textContent = 'Synthèse indisponible.';
    prioritiesHost.append(p);
    return;
  }
  const critRows = sortIncidentsForDisplay(
    incidentRecords.filter((i) => i.severity === 'critique' && !isStatusClosed(i.status))
  ).slice(0, 3);
  const weekAgo = Date.now() - 7 * 86400000;
  const recentRows = sortIncidentsForDisplay(
    incidentRecords.filter((i) => (i.createdAtMs || 0) >= weekAgo)
  ).slice(0, 3);
  const grid = document.createElement('div');
  grid.className = 'incidents-priorities-grid';
  function buildCol(title, rows, emptyMsg) {
    const c = document.createElement('div');
    c.className = 'incidents-priorities-col';
    const h = document.createElement('h3');
    h.className = 'incidents-priorities-col__title';
    h.textContent = title;
    c.append(h);
    if (!rows.length) {
      const e = document.createElement('p');
      e.className = 'incidents-priorities-muted';
      e.textContent = emptyMsg;
      c.append(e);
      return c;
    }
    const ul = document.createElement('ul');
    ul.className = 'incidents-priorities-ul';
    rows.forEach((raw) => {
      const inc = mapRowToDisplay(raw);
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'incidents-priorities-item';
      const refSpan = document.createElement('span');
      refSpan.className = 'incidents-priorities-item__ref';
      refSpan.textContent = inc.ref;
      const titleSpan = document.createElement('span');
      titleSpan.className = 'incidents-priorities-item__title';
      titleSpan.textContent = inc.title;
      b.append(refSpan, titleSpan);
      b.addEventListener('click', () => {
        onActivateIncident(inc.ref);
        document.getElementById('incidents-recent-list')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      });
      li.append(b);
      ul.append(li);
    });
    c.append(ul);
    return c;
  }
  grid.append(
    buildCol('Critiques ouverts', critRows, 'Aucun critique ouvert.'),
    buildCol('Récents (7 j.)', recentRows, 'Aucun incident sur 7 j.')
  );
  prioritiesHost.append(grid);
}

/**
 * Ligne registre incidents — pas de listeners ici : la page attache une délégation
 * sur `.incidents-list-host` (clics re-rendus, z-index / calques).
 *
 * @param {object} inc — ligne affichée (avec title)
 * @param {{
 *   isStatusClosed: (st: string) => boolean;
 *   columnMode?: 'essential' | 'full';
 *   canWriteActions: boolean;
 * }} helpers
 */
export function buildIncidentTableRow(inc, helpers) {
  const { isStatusClosed, canWriteActions } = helpers;
  const columnMode = helpers.columnMode === 'full' ? 'full' : 'essential';

  const tr = document.createElement('tr');
  tr.className = 'incidents-table-row';
  tr.dataset.severity = inc.severity;
  tr.dataset.ref = inc.ref;
  tr.tabIndex = 0;
  if (inc.severity === 'critique') {
    tr.classList.add('incidents-table-row--critique');
  }

  const tdTitle = document.createElement('td');
  tdTitle.className = 'incidents-table-cell incidents-table-cell--title';
  const titleStrong = document.createElement('div');
  titleStrong.className = 'incidents-table-title';
  titleStrong.textContent = inc.title;
  const refSmall = document.createElement('div');
  refSmall.className = 'incidents-table-ref';
  refSmall.textContent = inc.ref;
  tdTitle.append(titleStrong);
  if (inc.severity === 'critique') {
    const crit = document.createElement('span');
    crit.className = 'incidents-crit-badge';
    crit.setAttribute('aria-label', 'Incident critique');
    crit.textContent = 'Critique';
    crit.title = 'Gravité critique — priorité terrain';
    tdTitle.append(crit);
  }
  tdTitle.append(refSmall);
  if (columnMode === 'essential') {
    const sevLabel =
      inc.severity === 'critique'
        ? 'Critique'
        : inc.severity === 'faible'
          ? 'Faible'
          : inc.severity === 'moyen'
            ? 'Moyen'
            : String(inc.severity || '—');
    const meta = document.createElement('div');
    meta.className = 'incidents-table-meta';
    meta.textContent = `${sevLabel} · ${inc.site || '—'}`;
    tdTitle.append(meta);
  }

  const tdSev = document.createElement('td');
  tdSev.className = 'incidents-table-cell';
  const badgeSev = document.createElement('span');
  badgeSev.className = `ds-badge ${severityDsBadgeClass(inc.severity)}`;
  badgeSev.textContent =
    inc.severity.charAt(0).toUpperCase() + inc.severity.slice(1);
  tdSev.append(badgeSev);
  if (columnMode === 'essential') tdSev.classList.add('qhse-col-adv');

  const tdSt = document.createElement('td');
  tdSt.className = 'incidents-table-cell';
  const badgeSt = document.createElement('span');
  badgeSt.className = `ds-badge ${isStatusClosed(inc.status) ? 'ds-badge--ok' : 'ds-badge--info'}`;
  badgeSt.textContent = inc.status;
  tdSt.append(badgeSt);

  const tdDate = document.createElement('td');
  tdDate.className = 'incidents-table-cell incidents-table-cell--num';
  tdDate.textContent = inc.date;

  const tdSite = document.createElement('td');
  tdSite.className = 'incidents-table-cell';
  tdSite.textContent = inc.site;
  if (columnMode === 'essential') tdSite.classList.add('qhse-col-adv');

  const tdAct = document.createElement('td');
  tdAct.className = 'incidents-table-cell incidents-table-cell--acts';
  const btnDetail = document.createElement('button');
  btnDetail.type = 'button';
  btnDetail.className = 'btn btn-secondary btn-sm incidents-table-btn';
  btnDetail.textContent = 'Ouvrir';
  btnDetail.title = 'Afficher la fiche dans le panneau latéral';
  btnDetail.dataset.incidentAction = 'open-detail';
  btnDetail.dataset.incidentRef = String(inc.ref || '');
  const btnAction = document.createElement('button');
  btnAction.type = 'button';
  btnAction.className = 'btn btn-primary btn-sm incidents-table-btn';
  btnAction.textContent = 'Action';
  btnAction.title = 'Créer ou lier une action corrective';
  btnAction.hidden = !canWriteActions;
  btnAction.dataset.incidentAction = 'create-linked-action';
  btnAction.dataset.incidentRef = String(inc.ref || '');
  tdAct.append(btnDetail, btnAction);

  tr.append(tdTitle, tdSev, tdSt, tdDate, tdSite, tdAct);

  return tr;
}
