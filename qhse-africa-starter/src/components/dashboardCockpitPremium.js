/**
 * Cockpit direction premium — lecture synthétique, sans logique API.
 */

import { appState } from '../utils/state.js';
import { buildIncidentMonthlySeries } from './dashboardCharts.js';
import { ensureDashboardCockpitPremiumStyles } from './dashboardCockpitPremiumStyles.js';
import { isActionOverdueDashboardRow } from '../utils/actionOverdueDashboard.js';

function safeArr(v) {
  return Array.isArray(v) ? v : [];
}

function asNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isClosedStatus(st) {
  return /(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(String(st || ''));
}

function isNcOpenRow(row) {
  const s = String(row?.status || '').toLowerCase();
  if (!s) return true;
  return !/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(s);
}

function isCritiqueSeverity(s) {
  return String(s || '').toLowerCase().includes('critique');
}

function criticalOpenCount(incidents) {
  return safeArr(incidents).filter(
    (i) => isCritiqueSeverity(i?.severity) && !isClosedStatus(i?.status)
  ).length;
}

function computeHeaderStatus(incidents, overdueCount) {
  const criticalCount = criticalOpenCount(incidents);
  const o = asNum(overdueCount);
  if (criticalCount >= 4 || o >= 10) {
    return { label: 'ACTION URGENTE', color: 'danger' };
  }
  if (criticalCount >= 2 || o >= 5) {
    return { label: 'VIGILANCE REQUISE', color: 'warning' };
  }
  return { label: 'SITUATION STABLE', color: 'success' };
}

function incidentsThisMonthCount(incidents) {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return safeArr(incidents).filter((i) => {
    if (!i?.createdAt) return false;
    const d = new Date(i.createdAt);
    return !Number.isNaN(d.getTime()) && d.getTime() > cutoff;
  }).length;
}

function overdueDays(row) {
  if (!row?.dueDate) return 0;
  const due = new Date(row.dueDate);
  if (Number.isNaN(due.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - due.getTime()) / (24 * 60 * 60 * 1000)));
}

function countCriticalOverdue(actions) {
  return safeArr(actions).filter((a) => {
    if (!isActionOverdueDashboardRow(a)) return false;
    const blob = `${a?.detail || ''} ${a?.title || ''} ${a?.status || ''}`.toLowerCase();
    return blob.includes('critique');
  }).length;
}

function avgAuditScore(audits) {
  const scores = safeArr(audits)
    .map((a) => Number(a?.score))
    .filter((n) => Number.isFinite(n));
  if (!scores.length) return null;
  return Math.round(scores.reduce((x, y) => x + y, 0) / scores.length);
}

function auditDeltaPts(audits) {
  const withScores = safeArr(audits).filter((a) => Number.isFinite(Number(a?.score)));
  if (withScores.length < 2) return null;
  const last = Number(withScores[0].score);
  const prev = Number(withScores[1].score);
  if (!Number.isFinite(last) || !Number.isFinite(prev)) return null;
  const d = last - prev;
  if (d === 0) return '0';
  return d > 0 ? `+ ${d} pts` : `${d} pts`;
}

function ncOpenCount(ncs, fallbackTotal) {
  const arr = safeArr(ncs);
  if (arr.length) return arr.filter(isNcOpenRow).length;
  return asNum(fallbackTotal);
}

function hasMajeureNc(ncs) {
  return safeArr(ncs).some((r) => {
    const t = `${r?.title || ''} ${r?.detail || ''}`.toLowerCase();
    return t.includes('majeure');
  });
}

function truncate(s, n) {
  const str = String(s || '').trim();
  if (str.length <= n) return str;
  return `${str.slice(0, Math.max(0, n - 1))}…`;
}

function formatDelayFr(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const days = Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
    if (days <= 0) return "aujourd'hui";
    if (days === 1) return 'il y a 1j';
    return `il y a ${days}j`;
  } catch {
    return '';
  }
}

function formatTodayFr() {
  try {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
}

function siteLabelFrom(sessionUser) {
  const u = sessionUser && typeof sessionUser === 'object' ? sessionUser : null;
  const name = u?.defaultSite?.name || u?.siteName;
  if (name && String(name).trim()) return String(name).trim();
  const st = appState?.currentSite;
  if (st && String(st).trim()) return String(st).trim();
  return 'Tous sites';
}

function kpiToneIncidents(n) {
  if (n > 5) return 'danger';
  if (n > 2) return 'warning';
  return 'info';
}

function kpiToneOverdue(n) {
  if (n > 5) return 'danger';
  if (n > 0) return 'warning';
  return 'success';
}

function kpiToneNc(n) {
  if (n > 0) return 'warning';
  return 'success';
}

function kpiToneAudit(score) {
  if (score == null) return 'info';
  if (score < 70) return 'danger';
  if (score < 80) return 'warning';
  return 'success';
}

function confFillClass(pct) {
  if (pct < 70) return 'dcp-conf-fill dcp-conf-fill--low';
  if (pct < 85) return 'dcp-conf-fill dcp-conf-fill--mid';
  return 'dcp-conf-fill dcp-conf-fill--high';
}

function buildKpiCard(label, valueText, deltaText, tone) {
  const card = document.createElement('div');
  card.className = `dcp-kpi-card dcp-kpi-card--${tone}`;
  const val = document.createElement('div');
  val.className = 'dcp-kpi-value';
  val.textContent = valueText;
  const lab = document.createElement('div');
  lab.className = 'dcp-kpi-label';
  lab.textContent = label;
  const delta = document.createElement('div');
  delta.className = 'dcp-kpi-delta';
  delta.textContent = deltaText;
  card.append(val, lab, delta);
  return card;
}

/**
 * @param {{
 *   data: object;
 *   incidents?: unknown[];
 *   actions?: unknown[];
 *   audits?: unknown[];
 *   ncs?: unknown[];
 *   sessionUser?: object | null;
 * }} opts
 */
export function createDashboardCockpitPremium(opts = {}) {
  ensureDashboardCockpitPremiumStyles();

  let previousDataRefreshMs = null;

  const wrap = document.createElement('div');
  wrap.className = 'dashboard-band dashboard-band--cockpit-premium';

  const root = document.createElement('article');
  root.className = 'dcp-cockpit';
  root.setAttribute('aria-label', 'Cockpit QHSE premium');

  const headerEl = document.createElement('header');
  const kpiEl = document.createElement('div');
  const midEl = document.createElement('div');
  const bottomEl = document.createElement('div');
  const footEl = document.createElement('footer');

  headerEl.className = 'dcp-header';
  kpiEl.className = 'dcp-kpi-grid';
  midEl.className = 'dcp-mid-grid';
  bottomEl.className = 'dcp-bottom-grid';
  footEl.className = 'dcp-footer';

  root.append(headerEl, kpiEl, midEl, bottomEl, footEl);
  wrap.append(root);

  function render(payload) {
    const data = payload?.data && typeof payload.data === 'object' ? payload.data : {};
    const incidents = safeArr(payload?.incidents);
    const actions = safeArr(payload?.actions);
    const audits = safeArr(payload?.audits);
    const ncs = safeArr(payload?.ncs);
    const sessionUser = payload?.sessionUser ?? null;

    const nowMs = Date.now();
    const wasFirstSync = previousDataRefreshMs == null;
    const ageMs = wasFirstSync ? 0 : nowMs - previousDataRefreshMs;
    const syncMins = Math.floor(ageMs / 60000);
    previousDataRefreshMs = nowMs;

    const overdueCount = asNum(data.overdueActions);
    const status = computeHeaderStatus(incidents, overdueCount);

    headerEl.replaceChildren();
    const main = document.createElement('div');
    main.className = 'dcp-header-main';
    const dateP = document.createElement('p');
    dateP.className = 'dcp-date';
    dateP.textContent = formatTodayFr();
    const h1 = document.createElement('h2');
    h1.className = 'dcp-title';
    h1.textContent = 'Cockpit QHSE';
    const siteP = document.createElement('p');
    siteP.className = 'dcp-site';
    siteP.textContent = `Site actif · ${siteLabelFrom(sessionUser)}`;
    main.append(dateP, h1, siteP);

    const pill = document.createElement('div');
    pill.className = `dcp-status-pill dcp-status-pill--${status.color}`;
    const dot = document.createElement('span');
    dot.className = 'dcp-status-dot';
    dot.setAttribute('aria-hidden', 'true');
    const pillTxt = document.createElement('span');
    pillTxt.textContent = status.label;
    pill.append(dot, pillTxt);
    headerEl.append(main, pill);

    const incTotal = asNum(data.incidents);
    const incMonth = incidentsThisMonthCount(incidents);
    kpiEl.replaceChildren(
      buildKpiCard(
        'Incidents',
        String(incTotal),
        `${incMonth} ce mois`,
        kpiToneIncidents(incTotal)
      ),
      buildKpiCard(
        'Actions en retard',
        String(overdueCount),
        `${countCriticalOverdue(actions)} critiques`,
        kpiToneOverdue(overdueCount)
      ),
      buildKpiCard(
        'NC ouvertes',
        String(ncOpenCount(ncs, data.nonConformities)),
        hasMajeureNc(ncs) ? 'majeure' : 'stable',
        kpiToneNc(ncOpenCount(ncs, data.nonConformities))
      ),
      (() => {
        const avg = avgAuditScore(audits);
        const scoreTxt = avg != null ? `${avg}%` : '—';
        const delta = auditDeltaPts(audits);
        const deltaTxt = delta != null ? delta : '—';
        return buildKpiCard('Score audits', scoreTxt, deltaTxt, kpiToneAudit(avg));
      })()
    );

    midEl.replaceChildren();

    const cardLeft = document.createElement('div');
    cardLeft.className = 'dcp-card';
    const tL = document.createElement('h3');
    tL.className = 'dcp-card-title';
    tL.textContent = 'À traiter maintenant';
    cardLeft.append(tL);

    const critList = incidents
      .filter((i) => isCritiqueSeverity(i?.severity) && !isClosedStatus(i?.status))
      .sort((a, b) => {
        const ta = new Date(a?.createdAt || 0).getTime();
        const tb = new Date(b?.createdAt || 0).getTime();
        return tb - ta;
      })
      .slice(0, 3);

    if (!critList.length) {
      const ok = document.createElement('p');
      ok.className = 'dcp-empty-ok';
      ok.textContent = 'Aucune alerte critique — situation maîtrisée';
      cardLeft.append(ok);
    } else {
      critList.forEach((inc) => {
        const row = document.createElement('div');
        row.className = 'dcp-alert-item';
        const dotEl = document.createElement('span');
        dotEl.className = `dcp-alert-dot ${isCritiqueSeverity(inc?.severity) ? 'dcp-alert-dot--critique' : 'dcp-alert-dot--moyen'}`;
        const body = document.createElement('div');
        body.className = 'dcp-alert-body';
        const title = document.createElement('div');
        title.className = 'dcp-alert-title';
        title.textContent = truncate(inc?.description || inc?.type || inc?.ref || 'Incident', 55);
        const meta = document.createElement('div');
        meta.className = 'dcp-alert-meta';
        const delay = inc?.createdAt
          ? formatDelayFr(inc.createdAt)
          : '';
        meta.textContent = [inc?.site || '—', delay].filter(Boolean).join(' · ');
        body.append(title, meta);
        const badge = document.createElement('span');
        badge.className = `dcp-badge ${isCritiqueSeverity(inc?.severity) ? 'dcp-badge--critique' : 'dcp-badge--moyen'}`;
        badge.textContent = isCritiqueSeverity(inc?.severity) ? 'Critique' : 'Moyen';
        row.append(dotEl, body, badge);
        cardLeft.append(row);
      });
    }

    const cardRight = document.createElement('div');
    cardRight.className = 'dcp-card';
    const tR = document.createElement('h3');
    tR.className = 'dcp-card-title';
    tR.textContent = 'Actions en retard';
    cardRight.append(tR);

    const overdueActs = actions.filter(isActionOverdueDashboardRow).slice(0, 3);
    if (!overdueActs.length) {
      const p = document.createElement('p');
      p.className = 'dcp-sync';
      p.textContent = 'Aucune action en retard sur cet aperçu.';
      cardRight.append(p);
    } else {
      overdueActs.forEach((a) => {
        const row = document.createElement('div');
        row.className = 'dcp-action-item';
        const title = document.createElement('div');
        title.className = 'dcp-action-title';
        title.textContent = truncate(a?.title || 'Action', 80);
        const meta = document.createElement('div');
        meta.className = 'dcp-action-meta';
        meta.textContent = a?.owner || a?.assignee?.name || '—';
        const badge = document.createElement('span');
        badge.className = 'dcp-overdue-badge';
        const d = overdueDays(a);
        badge.textContent = `${d}j retard`;
        row.append(title, meta, badge);
        cardRight.append(row);
      });
    }

    midEl.append(cardLeft, cardRight);

    bottomEl.replaceChildren();

    const trendCard = document.createElement('div');
    trendCard.className = 'dcp-card';
    const tT = document.createElement('h3');
    tT.className = 'dcp-card-title';
    tT.textContent = 'Tendance incidents (6 mois)';
    trendCard.append(tT);

    const series = buildIncidentMonthlySeries(incidents);
    const vals = series.map((p) => asNum(p.value));
    const max = Math.max(1, ...vals);
    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = vals.length ? sum / vals.length : 0;
    const currentIdx = series.length - 1;

    const barsWrap = document.createElement('div');
    barsWrap.className = 'dcp-trend-bars';
    series.forEach((p, i) => {
      const v = asNum(p.value);
      const hPct = max ? Math.round((v / max) * 100) : 0;
      const wrap = document.createElement('div');
      wrap.className = 'dcp-trend-bar-wrap';
      const bar = document.createElement('div');
      bar.className = 'dcp-trend-bar';
      if (i === currentIdx) bar.classList.add('dcp-trend-bar--current');
      if (avg > 0 && v > avg * 1.5) bar.classList.add('dcp-trend-bar--spike');
      bar.style.height = `${Math.max(8, hPct)}%`;
      const lab = document.createElement('span');
      lab.className = 'dcp-trend-label';
      lab.textContent = p.label || '';
      wrap.append(bar, lab);
      barsWrap.append(wrap);
    });
    trendCard.append(barsWrap);

    const cur = vals[currentIdx] ?? 0;
    const prev = vals[currentIdx - 1] ?? 0;
    const deltaM = cur - prev;
    const foot = document.createElement('p');
    foot.className = 'dcp-trend-footer';
    foot.textContent = `${cur} incidents ce mois · ${deltaM >= 0 ? '+' : ''}${deltaM} vs mois précédent`;
    trendCard.append(foot);

    const confCard = document.createElement('div');
    confCard.className = 'dcp-card';
    const tC = document.createElement('h3');
    tC.className = 'dcp-card-title';
    tC.textContent = 'Conformité (aperçu)';
    confCard.append(tC);

    const base = avgAuditScore(audits);
    const proxy = base != null ? base : 72;
    const rows = [
      { label: 'ISO 45001', pct: Math.min(100, Math.max(0, proxy)) },
      { label: 'ISO 14001', pct: Math.min(100, Math.max(0, proxy - 2)) },
      { label: 'ISO 9001', pct: Math.min(100, Math.max(0, proxy - 4)) },
      { label: 'Cadre minier (réf.)', pct: Math.min(100, Math.max(0, proxy - 6)) }
    ];
    rows.forEach((r) => {
      const item = document.createElement('div');
      item.className = 'dcp-conf-item';
      const head = document.createElement('div');
      head.className = 'dcp-conf-head';
      const lab = document.createElement('span');
      lab.textContent = r.label;
      const pct = document.createElement('span');
      pct.className = 'dcp-conf-pct';
      pct.textContent = `${Math.round(r.pct)}%`;
      head.append(lab, pct);
      const track = document.createElement('div');
      track.className = 'dcp-conf-track';
      const fill = document.createElement('div');
      fill.className = confFillClass(r.pct);
      fill.style.width = `${Math.round(r.pct)}%`;
      track.append(fill);
      item.append(head, track);
      confCard.append(item);
    });

    bottomEl.append(trendCard, confCard);

    footEl.replaceChildren();
    const btns = document.createElement('div');
    btns.className = 'dcp-footer-btns';
    const b1 = document.createElement('button');
    b1.type = 'button';
    b1.className = 'dcp-btn dcp-btn--primary';
    b1.textContent = '+ Déclarer un incident';
    b1.addEventListener('click', () => {
      window.location.hash = 'incidents';
    });
    const b2 = document.createElement('button');
    b2.type = 'button';
    b2.className = 'dcp-btn';
    b2.textContent = "Plan d'actions";
    b2.addEventListener('click', () => {
      window.location.hash = 'actions';
    });
    const b3 = document.createElement('button');
    b3.type = 'button';
    b3.className = 'dcp-btn';
    b3.textContent = 'Voir les audits';
    b3.addEventListener('click', () => {
      window.location.hash = 'audits';
    });
    btns.append(b1, b2, b3);
    const sync = document.createElement('p');
    sync.className = 'dcp-sync';
    if (wasFirstSync) {
      sync.textContent = 'Sync à l’instant';
    } else if (syncMins < 1) {
      sync.textContent = 'Sync il y a moins d’1 min';
    } else {
      sync.textContent = `Sync il y a ${syncMins} min`;
    }
    footEl.append(btns, sync);
  }

  function update(payload) {
    try {
      render(payload || {});
    } catch (e) {
      console.warn('[dashboardCockpitPremium] render', e);
    }
  }

  update({
    data: opts.data || {},
    incidents: opts.incidents,
    actions: opts.actions,
    audits: opts.audits,
    ncs: opts.ncs,
    sessionUser: opts.sessionUser
  });

  return {
    root: wrap,
    update
  };
}
