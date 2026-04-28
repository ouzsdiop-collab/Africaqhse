import { appState } from '../../utils/state.js';
import {
  buildIncidentMonthlySeries,
  buildNcMajorMinorMonthlySeries,
  buildTopIncidentTypes,
  buildAuditScoreSeriesFromAudits,
  DASHBOARD_TREND_EMPTY_MSG
} from '../../components/dashboardCharts.js';
import { isDemoMode } from '../../services/demoMode.service.js';
import { asDashboardCount } from '../../utils/reconcileDashboardStats.js';
import {
  toneByValue,
  guessImpactedSite,
  computeDeltaLabel,
  trimTrailingZeroAuditScores,
  buildOperationalTiles
} from '../../utils/dashboardMetrics.js';
import { Chart } from 'chart.js';
import { pushDashboardIntent } from '../../utils/dashboardNavigationIntent.js';
import { qhseNavigate } from '../../utils/qhseNavigate.js';
import { isActionOverdueDashboardRow } from '../../utils/actionOverdueDashboard.js';
import { listPermits } from '../../services/ptw.service.js';
import {
  HABILITATIONS_DEMO_ROWS,
  computeHabilitationsBySite,
  computeHabilitationsKpis
} from '../../data/habilitationsDemo.js';

const DC_CHART_FONT = 'Inter, system-ui, sans-serif';

function getCssVar(name, fallback = '') {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function dashboardKpiScopeEmptyLabel() {
  return appState.activeSiteId ? 'Aucun sur ce site' : 'Aucune donnée';
}

/**
 * @param {object | null} ts
 * @returns {{ label: string; value: number }[] | null}
 */
function monthlyIncidentsFromTimeseries(ts) {
  if (!ts || !Array.isArray(ts.incidentsByMonth) || !ts.incidentsByMonth.length) return null;
  if (!ts.incidentsByMonth.every((x) => x && typeof x === 'object')) return null;
  return ts.incidentsByMonth.map((x) => ({
    label: String(/** @type {{ label?: unknown }} */ (x).label ?? 'Non disponible'),
    value: Math.max(0, Number(/** @type {{ value?: unknown }} */ (x).value) || 0)
  }));
}

/**
 * @param {object | null} ts
 * @returns {{ labels: string[]; major: number[]; minor: number[] } | null}
 */
function ncStackFromTimeseries(ts) {
  if (!ts) return null;
  const nc = ts.nonConformitiesByMonth;
  if (!nc || typeof nc !== 'object') return null;
  const major = Array.isArray(nc.major) ? nc.major : [];
  const minor = Array.isArray(nc.minor) ? nc.minor : [];
  const m = Math.min(major.length, minor.length);
  if (m < 1) return null;
  const labels =
    Array.isArray(ts.labels) && ts.labels.length >= m
      ? ts.labels.slice(0, m).map((l) => String(l))
      : major.slice(0, m).map((_, i) => `M${i + 1}`);
  return {
    labels,
    major: major.slice(0, m).map((n) => Math.max(0, Number(n) || 0)),
    minor: minor.slice(0, m).map((n) => Math.max(0, Number(n) || 0))
  };
}

/**
 * @param {object | null} ts
 * @returns {{ label: string; value: number }[] | null}
 */
function auditScoreBarsFromTimeseries(ts) {
  if (!ts || !Array.isArray(ts.auditsScoreByMonth) || !ts.auditsScoreByMonth.length) return null;
  return ts.auditsScoreByMonth.map((b) => {
    const x = b && typeof b === 'object' ? b : {};
    return {
      label: String(/** @type {{ label?: unknown }} */ (x).label ?? 'Non disponible'),
      value: Math.max(0, Math.min(100, Number(/** @type {{ value?: unknown }} */ (x).value) || 0))
    };
  });
}

export function updateDecisionAlerts(refs, stats, data) {
  const {
    decisionAlerts,
    opsGrid,
    habSummaryCard,
    habSiteCard,
    iaList,
    prioList,
    decisionCharts,
    decisionChartCard,
    renderKpiFilteredModal
  } = refs;
  const { incidents, actions, ncs, audits, docs = [], risks = [] } = data;

  const rawTs = stats?.timeseries;
  const ts =
    rawTs != null && typeof rawTs === 'object' && !Array.isArray(rawTs) ? rawTs : null;
  const allowDemo = isDemoMode();

  const monthlyFromApi = monthlyIncidentsFromTimeseries(ts);
  const monthly = monthlyFromApi
    ? monthlyFromApi
    : allowDemo
      ? buildIncidentMonthlySeries(incidents)
      : [];
  const crit = Array.isArray(stats?.criticalIncidents) ? stats.criticalIncidents.length : 0;
  const late = asDashboardCount(stats?.overdueActions);
  const ncOpen = asDashboardCount(stats?.nonConformities);
  const scopeEmpty = dashboardKpiScopeEmptyLabel();
  const cards = [
    { k: 'Incidents critiques', v: crit, tone: toneByValue(crit, 1, 2), kpi: 'incidents', impact: guessImpactedSite(incidents) },
    { k: 'Actions en retard', v: late, tone: toneByValue(late, 1, 3), kpi: 'actionsLate', impact: guessImpactedSite(actions) },
    { k: 'NC ouvertes', v: ncOpen, tone: toneByValue(ncOpen, 1, 3), kpi: 'ncOpen', impact: guessImpactedSite(ncs) }
  ];
  decisionAlerts.replaceChildren();
  for (const c of cards) {
    const art = document.createElement('article');
    art.setAttribute('role', 'button');
    art.setAttribute('tabindex', '0');
    art.dataset.kpiOpen = c.kpi;
    const kEl = document.createElement('div');
    kEl.className = 'dashboard-decision-alert__k';
    kEl.textContent = c.k;
    if (c.kpi === 'actionsLate' && c.v === 0) {
      art.className = 'dashboard-decision-alert dashboard-decision-alert--zero-success';
      const ok = document.createElement('div');
      ok.className = 'dashboard-decision-alert__success-msg';
      ok.textContent = 'Aucune action en retard';
      art.append(kEl, ok);
    } else {
      art.className = `dashboard-decision-alert dashboard-decision-alert--${c.tone}`;
      const vEl = document.createElement('div');
      vEl.className = 'dashboard-decision-alert__v';
      vEl.textContent = String(c.v);
      art.append(kEl, vEl);
      if (c.v === 0) {
        const hint = document.createElement('div');
        hint.className = 'dashboard-decision-alert__empty-hint';
        hint.textContent = scopeEmpty;
        art.append(hint);
      }
      const sub = document.createElement('div');
      sub.className = 'dashboard-kpi-subline';
      const s1 = document.createElement('span');
      s1.textContent = computeDeltaLabel(c.v);
      const s2 = document.createElement('span');
      s2.textContent = c.impact;
      sub.append(s1, s2);
      art.append(sub);
    }
    decisionAlerts.append(art);
  }
  decisionAlerts.querySelectorAll('[data-kpi-open]').forEach((el) => {
    const open = () => renderKpiFilteredModal(el.getAttribute('data-kpi-open') || 'incidents');
    el.addEventListener('click', open);
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        open();
      }
    });
  });

  const ncStackCtx = decisionChartCard.querySelector('[data-dc-nc-stack]');
  const riskCtx = decisionChartCard.querySelector('[data-dc-risk]');
  const scoreCtx = decisionChartCard.querySelector('[data-dc-score]');
  const ncFromTs = ncStackFromTimeseries(ts);
  const ncSeries = ncFromTs
    ? ncFromTs
    : allowDemo
      ? buildNcMajorMinorMonthlySeries(ncs, 6)
      : { labels: ['Non disponible'], major: [0], minor: [0] };
  const riskTypes = buildTopIncidentTypes(incidents).slice(0, 5);
  const auditFromTs = auditScoreBarsFromTimeseries(ts);
  const auditScores = auditFromTs
    ? trimTrailingZeroAuditScores(auditFromTs)
    : allowDemo
      ? trimTrailingZeroAuditScores(buildAuditScoreSeriesFromAudits(audits).slice(-6))
      : [{ label: 'Non disponible', value: 0 }];
  const dcTick = getCssVar('--text-secondary', '#64748b');
  const dcGrid = `color-mix(in srgb, ${getCssVar('--border-color', '#e2e8f0')} 50%, transparent)`;
  const sliceBorder = getCssVar('--border-color', '#e2e8f0');
  if (decisionCharts.ncStack) decisionCharts.ncStack.destroy();
  if (decisionCharts.risk) decisionCharts.risk.destroy();
  if (decisionCharts.score) decisionCharts.score.destroy();
  if (ncStackCtx instanceof HTMLCanvasElement) {
    const ncLabels = ncSeries.labels;
    const ncMajor = ncSeries.major;
    const ncMinor = ncSeries.minor;
    decisionCharts.ncStack = new Chart(ncStackCtx, {
      type: 'bar',
      data: {
        labels: ncLabels,
        datasets: [
          {
            label: 'Autres NC',
            data: ncMinor,
            stack: 'nc',
            backgroundColor: (ctx) => {
              const c = ctx.chart.ctx;
              const h = ctx.chart.height || 160;
              const g = c.createLinearGradient(0, 0, 0, h);
              g.addColorStop(0, 'rgba(99, 102, 241, 0.55)');
              g.addColorStop(1, 'rgba(129, 140, 248, 0.88)');
              return g;
            },
            borderColor: getCssVar('--border-color', '#e2e8f0'),
            borderWidth: 0,
            borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 10, bottomRight: 10 },
            borderSkipped: false,
            maxBarThickness: 36
          },
          {
            label: 'NC prioritaires',
            data: ncMajor,
            stack: 'nc',
            backgroundColor: (ctx) => {
              const c = ctx.chart.ctx;
              const h = ctx.chart.height || 160;
              const g = c.createLinearGradient(0, 0, 0, h);
              g.addColorStop(0, 'rgba(252, 165, 165, 0.95)');
              g.addColorStop(1, 'rgba(220, 38, 38, 0.92)');
              return g;
            },
            borderColor: getCssVar('--border-color', '#e2e8f0'),
            borderWidth: 0,
            borderRadius: { topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 },
            borderSkipped: false,
            maxBarThickness: 36
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        animation: { duration: 620, easing: 'easeOutQuart' },
        layout: { padding: { top: 8, bottom: 4 } },
        font: DC_CHART_FONT,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: dcTick,
              boxWidth: 10,
              boxHeight: 10,
              padding: 12,
              usePointStyle: true,
              pointStyle: 'rectRounded',
              font: DC_CHART_FONT
            }
          },
          tooltip: {
            backgroundColor: getCssVar('--surface-2', '#f1f5f9'),
            titleColor: getCssVar('--text-primary', '#1e293b'),
            bodyColor: getCssVar('--text-muted', '#64748b'),
            borderColor: getCssVar('--border-color', '#e2e8f0'),
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              title: (ctx) => `Période : ${ctx?.[0]?.label || 'N/A'}`,
              footer: (items) => {
                if (!items?.length) return '';
                let sum = 0;
                items.forEach((it) => {
                  sum += Number(it.parsed.y) || 0;
                });
                return `Total NC : ${sum}`;
              },
              label: (ctx) => {
                const v = ctx.parsed.y ?? 0;
                return `${ctx.dataset.label} : ${v}`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: dcTick, font: DC_CHART_FONT, maxRotation: 0, autoSkipPadding: 8 }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: dcGrid, drawBorder: false },
            ticks: { color: dcTick, font: DC_CHART_FONT, precision: 0 }
          }
        },
        onHover: (e, elements) => {
          if (e?.native?.target) e.native.target.style.cursor = elements?.length ? 'pointer' : 'default';
        },
        onClick: (_evt, elements) => {
          const el = elements?.[0];
          const idx = el?.index;
          const period = idx != null ? ncLabels[idx] : null;
          const tier =
            el?.datasetIndex === 1 ? 'prioritaire' : el?.datasetIndex === 0 ? 'autre' : null;
          pushDashboardIntent({
            source: 'dashboard',
            chart: 'nc_major_minor_trend',
            period,
            tier
          });
          window.location.hash = 'audits';
        }
      }
    });
  }
  if (riskCtx instanceof HTMLCanvasElement) {
    decisionCharts.risk = new Chart(riskCtx, {
      type: 'doughnut',
      data: {
        labels: riskTypes.map((r) => r.type),
        datasets: [
          {
            data: riskTypes.map((r) => r.count),
            backgroundColor: ['#ef4444', '#f97316', '#fbbf24', '#34d399', '#38bdf8'],
            borderColor: sliceBorder,
            borderWidth: 2,
            hoverOffset: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        animation: { duration: 520, easing: 'easeOutQuart' },
        layout: { padding: { bottom: 4 } },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: dcTick,
              boxWidth: 10,
              boxHeight: 10,
              padding: 14,
              usePointStyle: true,
              pointStyle: 'rectRounded',
              font: DC_CHART_FONT
            }
          },
          tooltip: {
            backgroundColor: getCssVar('--surface-2', '#f1f5f9'),
            titleColor: getCssVar('--text-primary', '#1e293b'),
            bodyColor: getCssVar('--text-muted', '#64748b'),
            borderColor: getCssVar('--border-color', '#e2e8f0'),
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: (ctx) => `${ctx.label} : ${ctx.parsed} cas`
            }
          }
        },
        onHover: (e, elements) => {
          if (e?.native?.target) e.native.target.style.cursor = elements?.length ? 'pointer' : 'default';
        },
        onClick: (_evt, elements) => {
          const idx = elements?.[0]?.index;
          const riskType = idx != null ? riskTypes[idx]?.type : null;
          pushDashboardIntent({ source: 'dashboard', chart: 'risk_distribution', riskType });
          window.location.hash = 'risks';
        }
      }
    });
  }
  if (scoreCtx instanceof HTMLCanvasElement) {
    decisionCharts.score = new Chart(scoreCtx, {
      type: 'bar',
      data: {
        labels: auditScores.map((a) => a.label),
        datasets: [
          {
            label: 'Score QHSE',
            data: auditScores.map((a) => a.value),
            backgroundColor: auditScores.map((a) =>
              a.value >= 80 ? 'rgba(34, 197, 94, 0.88)' : a.value >= 60 ? 'rgba(245, 158, 11, 0.9)' : 'rgba(239, 68, 68, 0.88)'
            ),
            borderRadius: 8,
            borderSkipped: false
          }
        ]
      },
      options: {
        maintainAspectRatio: false,
        animation: { duration: 520, easing: 'easeOutQuart' },
        layout: { padding: { top: 6 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: getCssVar('--surface-2', '#f1f5f9'),
            titleColor: getCssVar('--text-primary', '#1e293b'),
            bodyColor: getCssVar('--text-muted', '#64748b'),
            borderColor: getCssVar('--border-color', '#e2e8f0'),
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: (ctx) => `Score QHSE : ${ctx.parsed.y}%`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: dcTick, font: DC_CHART_FONT, maxRotation: 0, autoSkipPadding: 10 }
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: dcGrid, drawBorder: false },
            ticks: { color: dcTick, font: DC_CHART_FONT, callback: (v) => `${v}%` }
          }
        },
        onHover: (e, elements) => {
          if (e?.native?.target) e.native.target.style.cursor = elements?.length ? 'pointer' : 'default';
        },
        onClick: (_evt, elements) => {
          const idx = elements?.[0]?.index;
          const period = idx != null ? auditScores[idx]?.label : null;
          pushDashboardIntent({ source: 'dashboard', chart: 'qhse_score', period });
          window.location.hash = 'audits';
        }
      }
    });
  }

  const trendDelta =
    monthly.length >= 2 ? monthly[monthly.length - 1].value - monthly[0].value : 0;
  const noTsTrend = !ts && !allowDemo;
  const iaMsgs = [
    noTsTrend
      ? DASHBOARD_TREND_EMPTY_MSG
      : trendDelta > 1
        ? `Dérive incidents en hausse (${trendDelta > 0 ? '+' : ''}${trendDelta})`
        : 'Incidents stables sur la période',
    late > 0 ? `Recommandation: traiter ${late} action(s) en retard sous 48h.` : 'Aucun retard critique détecté.',
    ncOpen > 2 ? `Recommandation: lancer revue NC ciblée (top ${Math.min(3, ncOpen)}).` : 'Niveau NC sous contrôle.'
  ];
  if (iaList) {
    iaList.replaceChildren();
    for (const m of iaMsgs) {
      const li = document.createElement('li');
      li.textContent = m;
      iaList.append(li);
    }
  }

  const priorities = [
    ...actions.filter((a) => isActionOverdueDashboardRow(a)).slice(0, 3).map((a) => `Action: ${a.title || 'Sans titre'}`),
    ...incidents.filter((i) => String(i?.severity || '').toLowerCase().includes('critique')).slice(0, 2).map((i) => `Incident critique: ${i.title || i.type || 'Sans titre'}`)
  ].slice(0, 5);
  if (prioList) {
    prioList.replaceChildren();
    if (priorities.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Aucune action prioritaire immédiate.';
      prioList.append(li);
    } else {
      for (const p of priorities) {
        const li = document.createElement('li');
        li.textContent = p;
        prioList.append(li);
      }
    }
  }

  const permits = listPermits().slice(0, 400);
  const tiles = buildOperationalTiles({
    stats,
    incidents,
    actions,
    audits,
    ncs,
    permits,
    docs,
    risks
  });
  const opsScopeEmpty = dashboardKpiScopeEmptyLabel();
  const opsImpact = guessImpactedSite([...(incidents || []), ...(actions || []), ...(audits || [])]);
  opsGrid.replaceChildren();
  /** @type {Record<string, string>} */
  const kpiDrawerKeyByPage = {
    incidents: 'incidents',
    actions: 'actionsLate',
    audits: 'auditsN',
    risks: 'risksCritique'
  };

  for (const t of tiles) {
    const kpiDrawerKey = kpiDrawerKeyByPage[t.page] || '';
    const art = document.createElement('article');
    art.setAttribute('role', 'button');
    art.setAttribute('tabindex', '0');
    art.setAttribute('aria-label', `Ouvrir ${t.k}`);
    art.dataset.opsGo = t.page;
    if (kpiDrawerKey) art.dataset.kpiOpen = kpiDrawerKey;
    const kEl = document.createElement('div');
    kEl.className = 'dashboard-ops-card__k';
    kEl.textContent = t.k;
    if (t.k === 'Actions en retard' && t.v === 0) {
      art.className = 'dashboard-ops-card dashboard-ops-card--zero-success';
      const ok = document.createElement('div');
      ok.className = 'dashboard-ops-card__success-msg';
      ok.textContent = 'Aucune action en retard';
      art.append(kEl, ok);
    } else if (t.k === 'Risques critiques' && t.v === 0) {
      art.className = 'dashboard-ops-card dashboard-ops-card--zero-success';
      const ok = document.createElement('div');
      ok.className = 'dashboard-ops-card__success-msg';
      ok.textContent = 'Aucun risque critique';
      art.append(kEl, ok);
    } else {
      art.className = `dashboard-ops-card dashboard-ops-card--${t.tone}`;
      const vEl = document.createElement('div');
      vEl.className = 'dashboard-ops-card__v';
      vEl.textContent = String(t.v);
      art.append(kEl, vEl);
      if (t.v === 0) {
        const hint = document.createElement('div');
        hint.className = 'dashboard-ops-card__empty-hint';
        hint.textContent = opsScopeEmpty;
        art.append(hint);
      }
      const dEl = document.createElement('div');
      dEl.className = 'dashboard-ops-card__d';
      dEl.textContent = t.d;
      const sub = document.createElement('div');
      sub.className = 'dashboard-kpi-subline';
      const s1 = document.createElement('span');
      s1.textContent = computeDeltaLabel(t.v);
      const s2 = document.createElement('span');
      s2.textContent = opsImpact;
      sub.append(s1, s2);
      art.append(dEl, sub);
    }
    opsGrid.append(art);
  }
  opsGrid.querySelectorAll('[data-ops-go]').forEach((el) => {
    const go = () => {
      const key = el.getAttribute('data-kpi-open');
      if (key) {
        renderKpiFilteredModal(key);
        return;
      }
      const target = el.getAttribute('data-ops-go');
      if (!target) return;
      if (target === 'products') {
        qhseNavigate('products', { productsFdsValidity: 'review', source: 'dashboard_ops_grid' });
        return;
      }
      if (target === 'iso') {
        qhseNavigate('iso', { scrollToId: 'iso-cockpit-priorities-anchor', source: 'dashboard_ops_grid' });
        return;
      }
      qhseNavigate(target);
    };
    el.addEventListener('click', go);
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        go();
      }
    });
  });

  const habRows = allowDemo ? HABILITATIONS_DEMO_ROWS : [];
  const habKpi = computeHabilitationsKpis(habRows);
  habSummaryCard.replaceChildren();
  const habKick = document.createElement('div');
  habKick.className = 'section-kicker';
  habKick.textContent = 'Alertes habilitations';
  const habH3 = document.createElement('h3');
  habH3.style.margin = '4px 0 8px';
  habH3.textContent = 'Postes critiques & conformité';
  if (!allowDemo) {
    const note = document.createElement('p');
    note.className = 'dashboard-chart-foot dashboard-chart-foot--tight';
    note.textContent = 'Données insuffisantes pour afficher les habilitations (module démo uniquement).';
    habSummaryCard.append(habKick, habH3, note);
  }
  const habList = document.createElement('div');
  habList.className = 'dashboard-hab-list';
  function habItem(label, value) {
    const art = document.createElement('article');
    art.className = 'dashboard-hab-item';
    const strong = document.createElement('strong');
    strong.textContent = `${label}:`;
    art.append(strong, document.createTextNode(` ${value}`));
    return art;
  }
  habList.append(
    habItem('Habilitations expirées', String(habKpi.expirees)),
    habItem('Expirations sous 30 jours', String(habKpi.exp30)),
    habItem('Taux de conformité', `${habKpi.taux}%`),
    habItem('Postes critiques non conformes', String(habKpi.blocCrit)),
    habItem('Sous-traitants incomplets', String(habKpi.sousTraitantsIncomplets))
  );
  const habAct1 = document.createElement('div');
  habAct1.className = 'dashboard-hab-actions';
  const b1 = document.createElement('button');
  b1.type = 'button';
  b1.className = 'btn btn-secondary';
  b1.dataset.habIntent = 'expired';
  b1.textContent = 'Voir expirées';
  const b2 = document.createElement('button');
  b2.type = 'button';
  b2.className = 'btn btn-secondary';
  b2.dataset.habIntent = 'expiring_30';
  b2.textContent = 'Voir < 30 jours';
  const b3 = document.createElement('button');
  b3.type = 'button';
  b3.className = 'btn btn-secondary';
  b3.dataset.habIntent = 'subcontractors_incomplete';
  b3.textContent = 'Voir sous-traitants';
  habAct1.append(b1, b2, b3);
  if (!allowDemo) {
    b1.disabled = true;
    b2.disabled = true;
    b3.disabled = true;
  }
  habSummaryCard.append(habKick, habH3, habList, habAct1);

  const bySite = computeHabilitationsBySite(habRows);
  habSiteCard.replaceChildren();
  const siteKick = document.createElement('div');
  siteKick.className = 'section-kicker';
  siteKick.textContent = 'Vue multi-sites';
  const siteH3 = document.createElement('h3');
  siteH3.style.margin = '4px 0 8px';
  siteH3.textContent = 'Conformité par site';
  const siteBar = document.createElement('div');
  siteBar.className = 'dashboard-hab-sitebar';
  if (!bySite.length) {
    const row = document.createElement('div');
    row.className = 'dashboard-hab-sitebar-row';
    const top = document.createElement('div');
    top.className = 'dashboard-hab-sitebar-top';
    const sp = document.createElement('span');
    sp.textContent = 'Non disponible';
    const strong = document.createElement('strong');
    strong.textContent = '0%';
    top.append(sp, strong);
    const track = document.createElement('div');
    track.className = 'dashboard-hab-sitebar-track';
    const fill = document.createElement('div');
    fill.className = 'dashboard-hab-sitebar-fill';
    fill.style.width = '0%';
    track.append(fill);
    row.append(top, track);
    siteBar.append(row);
  }
  for (const s of bySite) {
    const row = document.createElement('div');
    row.className = 'dashboard-hab-sitebar-row';
    const top = document.createElement('div');
    top.className = 'dashboard-hab-sitebar-top';
    const sp = document.createElement('span');
    sp.textContent = s.site;
    const strong = document.createElement('strong');
    strong.textContent = `${s.score}%`;
    top.append(sp, strong);
    const track = document.createElement('div');
    track.className = 'dashboard-hab-sitebar-track';
    const fill = document.createElement('div');
    fill.className = 'dashboard-hab-sitebar-fill';
    fill.style.width = `${Math.max(0, Math.min(100, Number(s.score) || 0))}%`;
    track.append(fill);
    row.append(top, track);
    siteBar.append(row);
  }
  const habAct2 = document.createElement('div');
  habAct2.className = 'dashboard-hab-actions';
  const bOpen = document.createElement('button');
  bOpen.type = 'button';
  bOpen.className = 'btn btn-primary';
  bOpen.dataset.habIntent = 'open_module';
  bOpen.textContent = 'Ouvrir Habilitations';
  habAct2.append(bOpen);
  if (!allowDemo) {
    bOpen.disabled = true;
  }
  habSiteCard.append(siteKick, siteH3, siteBar, habAct2);

  const openHab = (filter) => {
    pushDashboardIntent({ module: 'habilitations', filter });
    window.location.hash = 'habilitations';
  };
  if (allowDemo) {
    [...habSummaryCard.querySelectorAll('[data-hab-intent]'), ...habSiteCard.querySelectorAll('[data-hab-intent]')].forEach((btn) => {
      btn.addEventListener('click', () => {
        const intent = btn.getAttribute('data-hab-intent') || 'open_module';
        openHab(intent);
      });
    });
  }
}
