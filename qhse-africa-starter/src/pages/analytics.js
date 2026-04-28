import { getSessionUser } from '../data/sessionUser.js';
import { pageTopbarById } from '../data/navigation.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import { appState } from '../utils/state.js';
import { fetchSitesCatalog } from '../services/sitesCatalog.service.js';
import { fetchUsers } from '../services/users.service.js';
import { showToast } from '../components/toast.js';
import { createEmptyState } from '../utils/designSystem.js';
import { ensureSensitiveAccess } from '../components/sensitiveAccessGate.js';
import { ensureQhsePilotageStyles } from '../components/qhsePilotageStyles.js';
import { ensureDashboardStyles } from '../components/dashboardStyles.js';
import {
  buildAuditScoreSeriesFromAudits,
  createActionsMixChart,
  createAnalyticsKeyCountsBarChart,
  createIncidentTypeBreakdown,
  createKpiMultiLineChart,
  createPilotageLoadMixChart,
  interpretAuditScoreSeries
} from '../components/dashboardCharts.js';
import { createAnalyticsQuadInsightSection } from '../components/analyticsQuadAiInsight.js';
const ANALYTICS_LIST_CAP = 5;

function formatFrDateTime(iso) {
  if (!iso) return 'Non disponible';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Non disponible';
  }
}

function formatFrDate(iso) {
  if (!iso) return 'Non disponible';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return 'Non disponible';
  }
}

function alertBadgeClass(level) {
  if (level === 'critical') return 'red';
  if (level === 'high') return 'amber';
  return 'blue';
}

/** Cible #hash pour une alerte pilotage (aperçu synthèse / période). */
function navigateHashForPilotageAlert(a) {
  const c = String(a?.code || '').toUpperCase();
  if (c.includes('ACTION')) return '#actions';
  if (c.includes('AUDIT')) return '#audits';
  if (c.includes('NC') || c.includes('NON_CONFORM') || c.includes('CONFORM')) {
    return '#iso';
  }
  if (c.includes('INCIDENT') || c.includes('CRIT')) return '#incidents';
  return '#dashboard';
}

function emptyNote(text) {
  const es = createEmptyState('\u25CB', text, '');
  es.classList.add('empty-state--analytics-inline');
  return es;
}

function listOverflowNote(hidden, singular, plural) {
  const p = document.createElement('p');
  p.className = 'analytics-list-overflow';
  p.textContent = `${hidden} ${hidden > 1 ? plural : singular}`;
  return p;
}

/**
 * Ligne type « list-row » analytics (texte uniquement, pas d’HTML injecté).
 * @param {HTMLElement} row
 * @param {{ primary: string; secondary?: string; badgeText: string; badgeTone: string; secondaryLineHeight?: string; navigateHash?: string; navigateLabel?: string }} opts
 */
function mountAnalyticsListRow(row, opts) {
  row.replaceChildren();
  const left = document.createElement('div');
  left.className = 'list-row__main';
  const strong = document.createElement('strong');
  strong.textContent = opts.primary;
  left.append(strong);
  if (opts.secondary != null && opts.secondary !== '') {
    const p = document.createElement('p');
    p.style.margin = '6px 0 0';
    p.style.fontSize = '13px';
    p.style.color = 'var(--text2)';
    if (opts.secondaryLineHeight) p.style.lineHeight = opts.secondaryLineHeight;
    p.textContent = opts.secondary;
    left.append(p);
  }
  const badge = document.createElement('span');
  badge.className = `badge ${opts.badgeTone}`;
  badge.textContent = opts.badgeText;
  const end = document.createElement('div');
  end.className = 'list-row__end';
  end.append(badge);
  const hashRaw = opts.navigateHash;
  if (hashRaw) {
    const h = String(hashRaw).startsWith('#') ? hashRaw : `#${hashRaw}`;
    row.classList.add('list-row--interactive');
    row.setAttribute('role', 'button');
    row.tabIndex = 0;
    row.setAttribute(
      'aria-label',
      opts.navigateLabel ||
        `Ouvrir le module : ${String(opts.primary).slice(0, 120)}`
    );
    const chev = document.createElement('span');
    chev.className = 'list-row__chevron';
    chev.setAttribute('aria-hidden', 'true');
    chev.textContent = '›';
    end.append(chev);
    row.addEventListener('click', () => {
      window.location.hash = h;
    });
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.hash = h;
      }
    });
  }
  row.append(left, end);
}

/**
 * Série principale + lissage 2 points (même données audit, calcul client).
 * @param {{ label: string; value: number }[]} points
 */
function buildAuditMultiSeries(points) {
  if (!Array.isArray(points) || !points.length) {
    return { labels: [], series: [] };
  }
  const labels = points.map((p) => p.label);
  const values = points.map((p) => (Number.isFinite(p.value) ? p.value : 0));
  const smooth = values.map((v, i) => {
    if (i === 0) return v;
    return Math.round(((values[i - 1] + v) / 2) * 10) / 10;
  });
  return {
    labels,
    series: [
      {
        name: 'Score audit (%)',
        color: 'rgb(79, 70, 229)',
        values,
        strokeWidth: 2.15
      },
      {
        name: 'Moyenne mobile (2 mois)',
        color: 'rgb(148, 163, 184)',
        values: smooth,
        lineStyle: 'dashed',
        showDots: false,
        strokeWidth: 1.65
      }
    ]
  };
}

function aggregateCriticalTypes(crit) {
  if (!Array.isArray(crit) || !crit.length) return [];
  const m = new Map();
  crit.forEach((row) => {
    const t = String(row.type || 'Autre').trim() || 'Autre';
    m.set(t, (m.get(t) || 0) + 1);
  });
  return [...m.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function aggregateAuditStatuses(audits) {
  if (!Array.isArray(audits) || !audits.length) return [];
  const m = new Map();
  audits.forEach((a) => {
    const s = String(a.status || 'Non disponible').trim() || 'Non disponible';
    m.set(s, (m.get(s) || 0) + 1);
  });
  return [...m.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function buildSynthesisPhrases(counts, kpis) {
  const out = [];
  if (counts.incidentsCriticalOpen > 0) {
    out.push(
      `${counts.incidentsCriticalOpen} incident(s) critique(s) encore ouvert(s). Priorité sécurité.`
    );
  }
  if (counts.actionsOverdue > 0) {
    out.push(`${counts.actionsOverdue} action(s) en retard. Relancez les porteurs.`);
  }
  if (counts.nonConformitiesOpen >= 5) {
    out.push(
      `${counts.nonConformitiesOpen} NC ouvertes : arbitrer les traitements et les jalons.`
    );
  }
  if (
    kpis.auditScoreAvg != null &&
    !Number.isNaN(kpis.auditScoreAvg) &&
    kpis.auditScoreAvg < 70 &&
    counts.auditsTotal > 0
  ) {
    out.push(
      `Score moyen des audits à ${kpis.auditScoreAvg} %. Renforcez les plans d'amélioration.`
    );
  }
  if (out.length === 0) {
    out.push(
      'Indicateurs stables sur l’échantillon automatique. Poursuivez le pilotage et ouvrez le détail si besoin.'
    );
  }
  return out.slice(0, 3);
}

function buildAnalyticsDecisionPanel(counts, kpis, alerts, layout = 'split') {
  const section = document.createElement('section');
  section.className =
    'analytics-decision-panel' +
    (layout === 'stacked' ? ' analytics-decision-panel--stacked' : '');

  const arr = Array.isArray(alerts) ? alerts : [];
  const hard = arr.filter((a) => a.level === 'critical' || a.level === 'high');
  const toShow = (hard.length ? hard : arr).slice(0, 4);

  const list = document.createElement('div');
  list.className = 'analytics-decision-list';
  list.setAttribute('aria-label', 'Synthèse décisionnelle');

  if (toShow.length) {
    toShow.forEach((a) => {
      const row = document.createElement('div');
      row.className = `analytics-alert-chip analytics-alert-chip--${a.level}`;
      row.textContent = (a.message || a.code || 'Non disponible').trim();
      list.append(row);
    });
  } else {
    const phrases = buildSynthesisPhrases(counts, kpis);
    phrases.forEach((phrase) => {
      const row = document.createElement('div');
      row.className = 'analytics-alert-chip analytics-alert-chip--neutral';
      row.textContent = phrase;
      list.append(row);
    });
  }

  section.append(list);
  return section;
}

function buildAnalyticsPrimaryKpis(counts, kpis) {
  const wrap = document.createElement('div');
  wrap.className = 'analytics-cockpit-header';

  const ncTotal = Math.max(0, Number(counts.nonConformitiesTotal) || 0);
  const ncOpen = Math.max(0, Number(counts.nonConformitiesOpen) || 0);
  const ncClosed = Math.max(0, ncTotal - ncOpen);
  let conformPct = 'Non disponible';
  let conformTone = 'blue';
  if (ncTotal > 0) {
    const p = Math.round((ncClosed / ncTotal) * 100);
    conformPct = `${p} %`;
    if (p >= 75) conformTone = 'green';
    else if (p >= 45) conformTone = 'amber';
    else conformTone = 'red';
  }

  const inc30 = Number(counts.incidentsLast30Days) || 0;
  const specs = [
    {
      label: 'Conformité NC',
      value: conformPct,
      tone: conformTone,
      hint: ncTotal ? `${ncClosed} clôturées / ${ncTotal} enregistrées` : 'Aucune NC en base'
    },
    {
      label: 'Incidents (30 j.)',
      value: String(counts.incidentsLast30Days ?? '0'),
      tone: inc30 >= 10 ? 'amber' : 'blue',
      hint: `${counts.incidentsTotal ?? '0'} total périmètre`
    },
    {
      label: 'Actions en retard',
      value: String(counts.actionsOverdue ?? '0'),
      tone: counts.actionsOverdue > 0 ? 'amber' : 'green',
      hint: `Sur ${counts.actionsTotal ?? '0'} actions`
    },
    {
      label: 'Score audits',
      value:
        kpis.auditScoreAvg != null && !Number.isNaN(kpis.auditScoreAvg)
          ? `${kpis.auditScoreAvg} %`
          : 'Non disponible',
      tone:
        kpis.auditScoreAvg != null && kpis.auditScoreAvg < 70 ? 'amber' : 'green',
      hint:
        kpis.auditScoreMin != null && kpis.auditScoreMax != null
          ? `Fourchette ${kpis.auditScoreMin}–${kpis.auditScoreMax} %`
          : 'Données limitées'
    }
  ];

  specs.forEach((s) => {
    const box = document.createElement('article');
    box.className = 'analytics-cockpit-stat card-soft';
    const lab = document.createElement('div');
    lab.className = 'analytics-cockpit-stat-label';
    lab.textContent = s.label;
    const val = document.createElement('div');
    val.className = `metric-value ${s.tone} analytics-cockpit-stat-value`;
    val.textContent = s.value;
    const hint = document.createElement('div');
    hint.className = 'analytics-cockpit-stat-hint';
    hint.textContent = s.hint;
    box.append(lab, val, hint);
    wrap.append(box);
  });
  return wrap;
}

function wrapAnalyticsChartCard(kicker, title, bodyEl, extraClass = '') {
  const card = document.createElement('article');
  card.className =
    'content-card card-soft dashboard-chart-card-inner analytics-chart-card' +
    (extraClass ? ` ${extraClass}` : '');
  const head = document.createElement('div');
  head.className = 'content-card-head';
  const inner = document.createElement('div');
  const k = document.createElement('div');
  k.className = 'section-kicker';
  k.textContent = kicker;
  const h = document.createElement('h3');
  h.textContent = title;
  inner.append(k, h);
  head.append(inner);
  card.append(head, bodyEl);
  return card;
}

function buildAnalyticsMainTrend(counts, data) {
  const auditSeries = buildAuditScoreSeriesFromAudits(data.recentAudits);
  const { labels, series } = buildAuditMultiSeries(auditSeries);
  const body = document.createElement('div');

  if (!labels.length) {
    body.append(
      emptyNote(
        'Pas assez de scores d’audit datés pour une courbe. Complétez les audits dans le temps.'
      )
    );
  } else {
    const chart = createKpiMultiLineChart(
      labels,
      series,
      `${counts.auditsTotal ?? '0'} audit(s) en base · échelle 0–100 % · réf. 75 % · grille + survol`,
      {
        variant: 'analytics',
        targetYPercent: 75,
        interpretText: interpretAuditScoreSeries(auditSeries)
      }
    );
    body.append(chart);
    const hint = document.createElement('p');
    hint.className = 'analytics-chart-interact-hint';
    hint.textContent =
      'Survolez la courbe : valeurs à 0,1 % près, ligne verticale de lecture. Mobile : glisser le doigt.';
    body.append(hint);
  }

  return wrapAnalyticsChartCard(
    'Vue globale',
    'Évolution des scores d’audit',
    body,
    'analytics-chart-card--main'
  );
}

function buildAnalyticsMainSplit(counts, data, kpis, alerts) {
  const shell = document.createElement('div');
  shell.className = 'analytics-main-split';

  const trendCol = document.createElement('div');
  trendCol.className = 'analytics-main-trend-col';
  trendCol.append(buildAnalyticsMainTrend(counts, data));

  const aside = document.createElement('aside');
  aside.className = 'analytics-aside-col';
  aside.setAttribute('aria-label', 'Synthèse et pression opérationnelle');

  aside.append(buildAnalyticsDecisionPanel(counts, kpis, alerts, 'stacked'));

  const pilotBody = document.createElement('div');
  pilotBody.append(
    createPilotageLoadMixChart(
      {
        criticalIncidents: Math.max(0, Number(counts.incidentsCriticalOpen) || 0),
        overdueActions: Math.max(0, Number(counts.actionsOverdue) || 0),
        ncOpen: Math.max(0, Number(counts.nonConformitiesOpen) || 0)
      },
      { compact: true }
    )
  );
  const pilotCard = wrapAnalyticsChartCard(
    'Pression',
    'Critiques · retards · NC',
    pilotBody,
    'analytics-chart-card--aside'
  );
  aside.append(pilotCard);

  shell.append(trendCol, aside);
  return shell;
}

function buildAnalyticsSecondaryCharts(counts, data) {
  const band = document.createElement('section');
  band.className = 'analytics-charts-band analytics-secondary-band';
  const grid = document.createElement('div');
  grid.className = 'analytics-charts-grid analytics-secondary-grid analytics-secondary-grid--quad';

  const actTotal = Math.max(0, Number(counts.actionsTotal) || 0);
  const actOver = Math.max(0, Number(counts.actionsOverdue) || 0);
  const actionsChart = createActionsMixChart({
    overdue: actOver,
    done: 0,
    other: Math.max(0, actTotal - actOver)
  });

  const typeChart = createIncidentTypeBreakdown(
    aggregateCriticalTypes(data.criticalIncidents)
  );

  const auditBreakdown = createIncidentTypeBreakdown(
    aggregateAuditStatuses(data.recentAudits)
  );

  const volumesChart = createAnalyticsKeyCountsBarChart(counts);

  grid.append(
    wrapAnalyticsChartCard('Actions', 'Retard vs autres', actionsChart, 'analytics-chart-card--cell'),
    wrapAnalyticsChartCard(
      'Volumes',
      'Ordres de grandeur (relatif)',
      volumesChart,
      'analytics-chart-card--cell'
    ),
    wrapAnalyticsChartCard(
      'Incidents',
      'Types (critiques ouverts)',
      typeChart,
      'analytics-chart-card--cell'
    ),
    wrapAnalyticsChartCard(
      'Audits',
      'Statuts (échantillon)',
      auditBreakdown,
      'analytics-chart-card--cell'
    )
  );

  band.append(grid);
  return band;
}

function buildCriticalTriptych(ncStack, actStack, auditStack) {
  const card = document.createElement('article');
  card.className = 'content-card card-soft analytics-critical-cockpit';
  const head = document.createElement('div');
  head.className = 'content-card-head';
  const wrapHead = document.createElement('div');
  const k = document.createElement('div');
  k.className = 'section-kicker';
  k.textContent = 'Points critiques';
  const h = document.createElement('h3');
  h.textContent = 'NC · Actions en retard · Audits récents';
  wrapHead.append(k, h);
  head.append(wrapHead);

  const grid = document.createElement('div');
  grid.className = 'analytics-critical-grid';

  function col(title, host) {
    const d = document.createElement('div');
    d.className = 'analytics-critical-col';
    const ht = document.createElement('h4');
    ht.className = 'analytics-critical-col-title';
    ht.textContent = title;
    d.append(ht, host);
    return d;
  }

  grid.append(
    col('Non-conformités ouvertes', ncStack),
    col('Actions en retard', actStack),
    col('Audits récents', auditStack)
  );
  card.append(head, grid);
  return card;
}

function buildKpiGrid(counts, kpis) {
  const grid = document.createElement('section');
  grid.className = 'kpi-grid dashboard-kpi-grid';

  const items = [
    {
      label: 'Incidents (total)',
      value: String(counts.incidentsTotal ?? '0'),
      tone: 'blue',
      note: `${counts.incidentsLast30Days ?? '0'} sur 30 j.`
    },
    {
      label: 'Incidents critiques ouverts',
      value: String(counts.incidentsCriticalOpen ?? '0'),
      tone: counts.incidentsCriticalOpen > 0 ? 'red' : 'green',
      note: 'Sur les 400 derniers incidents (non clos)'
    },
    {
      label: 'NC ouvertes',
      value: String(counts.nonConformitiesOpen ?? '0'),
      tone: counts.nonConformitiesOpen >= 5 ? 'amber' : 'blue',
      note: `Sur ${counts.nonConformitiesTotal ?? '0'} enregistrées`
    },
    {
      label: 'Actions en retard',
      value: String(counts.actionsOverdue ?? '0'),
      tone: counts.actionsOverdue > 0 ? 'amber' : 'green',
      note: `Sur ${counts.actionsTotal ?? '0'} actions`
    },
    {
      label: 'Audits (total)',
      value: String(counts.auditsTotal ?? '0'),
      tone: 'blue',
      note: 'Référentiel audits'
    },
    {
      label: 'Score moyen audits',
      value:
        kpis.auditScoreAvg != null && !Number.isNaN(kpis.auditScoreAvg)
          ? `${kpis.auditScoreAvg} %`
          : 'Non disponible',
      tone:
        kpis.auditScoreAvg != null && kpis.auditScoreAvg < 70 ? 'amber' : 'green',
      note:
        kpis.auditScoreMin != null && kpis.auditScoreMax != null
          ? `Min ${kpis.auditScoreMin} % · Max ${kpis.auditScoreMax} %`
          : 'Pas assez de données'
    }
  ];

  items.forEach((kpi) => {
    const card = document.createElement('article');
    card.className = `metric-card card-soft dashboard-kpi-card dashboard-kpi-card--tone-${kpi.tone}`;
    const stack = document.createElement('div');
    stack.className = 'dashboard-kpi-card__stack';
    const lbl = document.createElement('div');
    lbl.className = 'metric-label';
    lbl.textContent = kpi.label;
    const val = document.createElement('div');
    val.className = `metric-value ${kpi.tone}`;
    val.textContent = kpi.value;
    const note = document.createElement('p');
    note.className = 'metric-note metric-note--kpi';
    note.textContent = kpi.note;
    stack.append(lbl, val, note);
    card.append(stack);
    grid.append(card);
  });

  return grid;
}

function buildStackSection(title, kicker, host) {
  const card = document.createElement('article');
  card.className = 'content-card card-soft analytics-stack-section';
  const head = document.createElement('div');
  head.className = 'content-card-head';
  const headInner = document.createElement('div');
  const kickerEl = document.createElement('div');
  kickerEl.className = 'section-kicker';
  kickerEl.textContent = kicker;
  const h3 = document.createElement('h3');
  h3.textContent = title;
  headInner.append(kickerEl, h3);
  head.append(headInner);
  card.append(head, host);
  return card;
}

function buildPeriodicSummaryGrid(summary) {
  const grid = document.createElement('section');
  grid.className = 'kpi-grid dashboard-kpi-grid';
  const items = [
    {
      label: 'Incidents créés (période)',
      value: String(summary.incidentsCreated ?? '0'),
      tone: 'blue',
      note: 'Déclarations sur la fenêtre'
    },
    {
      label: 'Audits enregistrés',
      value: String(summary.auditsRecorded ?? '0'),
      tone: 'blue',
      note: 'Créés sur la période'
    },
    {
      label: 'Score moyen audits',
      value:
        summary.auditScoreAvg != null && !Number.isNaN(summary.auditScoreAvg)
          ? `${summary.auditScoreAvg} %`
          : 'Non disponible',
      tone:
        summary.auditScoreAvg != null && summary.auditScoreAvg < 70
          ? 'amber'
          : 'green',
      note: 'Sur les audits de la période'
    },
    {
      label: 'NC créées',
      value: String(summary.nonConformitiesCreated ?? '0'),
      tone: 'amber',
      note: `${summary.nonConformitiesOpenAmongCreated ?? '0'} encore ouvertes`
    },
    {
      label: 'Actions créées',
      value: String(summary.actionsCreated ?? '0'),
      tone: 'blue',
      note: `${summary.actionsCreatedWithClosedLikeStatus ?? '0'} statut terminé/clôturé`
    },
    {
      label: 'Actions en retard (stock)',
      value: String(summary.actionsOverdueStock ?? '0'),
      tone: summary.actionsOverdueStock > 0 ? 'amber' : 'green',
      note: 'À la fin de la période, filtres appliqués'
    },
    {
      label: 'Incidents critiques (période)',
      value: String(summary.criticalIncidentsInPeriod ?? '0'),
      tone: summary.criticalIncidentsOpenInPeriod > 0 ? 'red' : 'green',
      note: `${summary.criticalIncidentsOpenInPeriod ?? '0'} non clôturés`
    }
  ];
  items.forEach((kpi) => {
    const card = document.createElement('article');
    card.className = `metric-card card-soft dashboard-kpi-card dashboard-kpi-card--tone-${kpi.tone}`;
    const stack = document.createElement('div');
    stack.className = 'dashboard-kpi-card__stack';
    const lbl = document.createElement('div');
    lbl.className = 'metric-label';
    lbl.textContent = kpi.label;
    const val = document.createElement('div');
    val.className = `metric-value ${kpi.tone}`;
    val.textContent = kpi.value;
    const note = document.createElement('p');
    note.className = 'metric-note metric-note--kpi';
    note.textContent = kpi.note;
    stack.append(lbl, val, note);
    card.append(stack);
    grid.append(card);
  });
  return grid;
}

function mountPeriodicReportingBlock(periodicCard) {
  let periodicPdfPayload = null;
  const periodSel = periodicCard.querySelector('.analytics-periodic-period');
  const startIn = periodicCard.querySelector('.analytics-periodic-start');
  const endIn = periodicCard.querySelector('.analytics-periodic-end');
  const siteSel = periodicCard.querySelector('.analytics-periodic-site');
  const assigneeSel = periodicCard.querySelector('.analytics-periodic-assignee');
  const loadBtn = periodicCard.querySelector('.analytics-periodic-load');
  const pdfPeriodBtn = periodicCard.querySelector('.analytics-periodic-pdf');
  const resultsHost = periodicCard.querySelector('.analytics-periodic-results');
  const statusLine = periodicCard.querySelector('.analytics-periodic-status');

  pdfPeriodBtn?.addEventListener('click', async () => {
    if (!periodicPdfPayload) {
      showToast('Chargez d’abord le reporting périodique.', 'warning');
      return;
    }
    try {
      await downloadAnalyticsPeriodicPdf(periodicPdfPayload.data, periodicPdfPayload.meta);
    } catch (e) {
      console.error(e);
    }
  });

  (async function fillFilters() {
    siteSel.replaceChildren();
    const siteOpt0 = document.createElement('option');
    siteOpt0.value = '';
    siteOpt0.textContent = 'Tous sites';
    siteSel.append(siteOpt0);
    assigneeSel.replaceChildren();
    const assignOpt0 = document.createElement('option');
    assignOpt0.value = '';
    assignOpt0.textContent = 'Tous responsables';
    assigneeSel.append(assignOpt0);
    try {
      const sites = await fetchSitesCatalog();
      sites.forEach((s) => {
        if (!s?.id) return;
        const o = document.createElement('option');
        o.value = s.id;
        o.textContent = s.code ? `${s.name} (${s.code})` : s.name;
        siteSel.append(o);
      });
    } catch {
      /* ignore */
    }
    if (appState.activeSiteId) {
      siteSel.value = appState.activeSiteId;
    }
    try {
      const users = await fetchUsers();
      users.forEach((u) => {
        if (!u?.id) return;
        const o = document.createElement('option');
        o.value = u.id;
        o.textContent = `${u.name} (${u.role})`;
        assigneeSel.append(o);
      });
    } catch {
      /* ignore */
    }
  })();

  loadBtn.addEventListener('click', async () => {
    const params = new URLSearchParams();
    const sd = (startIn.value || '').trim();
    const ed = (endIn.value || '').trim();
    if ((sd && !ed) || (!sd && ed)) {
      statusLine.textContent =
        'Indiquez la date de début et la date de fin, ou laissez les deux vides.';
      showToast(
        'Période personnalisée : renseigner début et fin, ou utiliser la liste « Période » sans dates.',
        'warning'
      );
      return;
    }
    if (sd && ed) {
      params.set('startDate', sd);
      params.set('endDate', ed);
    } else {
      params.set('period', periodSel.value || 'weekly');
    }
    const sid = (siteSel.value || '').trim();
    if (sid) params.set('siteId', sid);
    const aid = (assigneeSel.value || '').trim();
    if (aid) params.set('assigneeId', aid);

    if (
      !(await ensureSensitiveAccess('export_sensitive', {
        contextLabel: 'chargement du reporting périodique consolidé'
      }))
    ) {
      return;
    }

    loadBtn.disabled = true;
    if (pdfPeriodBtn) pdfPeriodBtn.disabled = true;
    periodicPdfPayload = null;
    statusLine.textContent = 'Chargement…';
    resultsHost.replaceChildren();
    try {
      const res = await qhseFetch(`/api/reports/periodic?${params.toString()}`);
      if (res.status === 403) {
        statusLine.textContent = 'Permission « rapports » requise.';
        showToast('Accès reporting périodique refusé', 'error');
        return;
      }
      if (!res.ok) {
        let msg = `Erreur ${res.status}`;
        try {
          const b = await res.json();
          if (b.error) msg = b.error;
        } catch {
          /* ignore */
        }
        statusLine.textContent = msg;
        showToast(msg, 'error');
        return;
      }
      const data = await res.json();
      const meta = data.meta || {};
      periodicPdfPayload = { data, meta };
      if (pdfPeriodBtn) pdfPeriodBtn.disabled = false;
      statusLine.textContent = `Période : ${formatFrDate(meta.startDate)} → ${formatFrDate(meta.endDate)} · généré ${formatFrDateTime(meta.generatedAt)}`;

      const metaNote = document.createElement('p');
      metaNote.style.margin = '0 0 10px';
      metaNote.style.fontSize = '12px';
      metaNote.style.color = 'var(--text3)';
      metaNote.style.lineHeight = '1.45';
      const lim = Array.isArray(meta.limitations) ? meta.limitations : [];
      metaNote.textContent = lim.length > 0 ? `Limites V1 : ${lim.join(' ')}` : '';

      resultsHost.append(metaNote);
      resultsHost.append(buildPeriodicSummaryGrid(data.summary || {}));

      const alertsStack = document.createElement('div');
      alertsStack.className = 'stack';
      const alerts = Array.isArray(data.alerts) ? data.alerts : [];
      if (alerts.length === 0) {
        alertsStack.append(emptyNote('Aucune alerte.'));
      } else {
        alerts.forEach((a) => {
          const row = document.createElement('article');
          row.className = 'list-row';
          const tone = alertBadgeClass(a.level);
          mountAnalyticsListRow(row, {
            primary: a.code || 'ALERTE',
            secondary: a.message || '',
            badgeText:
              a.level === 'critical' ? 'Critique' : a.level === 'high' ? 'Priorité' : 'Info',
            badgeTone: tone,
            secondaryLineHeight: '1.45',
            navigateHash: navigateHashForPilotageAlert(a)
          });
          alertsStack.append(row);
        });
      }
      resultsHost.append(buildStackSection('Alertes (période)', 'Pilotage', alertsStack));

      const two = document.createElement('div');
      two.className = 'two-column';

      const incStack = document.createElement('div');
      incStack.className = 'stack';
      const incs = Array.isArray(data.incidents?.sample) ? data.incidents.sample : [];
      if (incs.length === 0) {
        incStack.append(emptyNote('Aucun incident sur la période.'));
      } else {
        incs.forEach((inc) => {
          const row = document.createElement('article');
          row.className = 'list-row';
          mountAnalyticsListRow(row, {
            primary: `${inc.ref} : ${inc.type}`,
            secondary: `${inc.site} · ${inc.status}`,
            badgeText: formatFrDate(inc.createdAt),
            badgeTone: 'blue',
            navigateHash: '#incidents'
          });
          incStack.append(row);
        });
      }

      const audStack = document.createElement('div');
      audStack.className = 'stack';
      const auds = Array.isArray(data.audits?.sample) ? data.audits.sample : [];
      if (auds.length === 0) {
        audStack.append(emptyNote('Aucun audit sur la période.'));
      } else {
        auds.forEach((a) => {
          const row = document.createElement('article');
          row.className = 'list-row';
          mountAnalyticsListRow(row, {
            primary: String(a.ref ?? 'Non disponible'),
            secondary: `${a.site} · ${a.status}`,
            badgeText: `${a.score} %`,
            badgeTone: 'blue',
            navigateHash: '#audits'
          });
          audStack.append(row);
        });
      }

      two.append(
        buildStackSection('Incidents (extrait)', 'Période', incStack),
        buildStackSection('Audits (extrait)', 'Période', audStack)
      );
      resultsHost.append(two);

      const two2 = document.createElement('div');
      two2.className = 'two-column';
      const ncStack = document.createElement('div');
      ncStack.className = 'stack';
      const ncs = Array.isArray(data.nonConformities?.sample) ? data.nonConformities.sample : [];
      if (ncs.length === 0) {
        ncStack.append(emptyNote('Aucune NC créée sur la période.'));
      } else {
        ncs.forEach((nc) => {
          const row = document.createElement('article');
          row.className = 'list-row';
          mountAnalyticsListRow(row, {
            primary: String(nc.title ?? 'Non renseigné'),
            secondary: `Audit ${nc.auditRef} · ${nc.status}`,
            badgeText: 'NC',
            badgeTone: 'amber',
            navigateHash: '#iso'
          });
          ncStack.append(row);
        });
      }
      const actStack = document.createElement('div');
      actStack.className = 'stack';
      const acts = Array.isArray(data.actions?.overdueSample) ? data.actions.overdueSample : [];
      if (acts.length === 0) {
        actStack.append(emptyNote('Aucun extrait d’actions en retard (ou liste vide).'));
      } else {
        acts.forEach((act) => {
          const row = document.createElement('article');
          row.className = 'list-row';
          const due = act.dueDate ? formatFrDate(act.dueDate) : 'Non disponible';
          mountAnalyticsListRow(row, {
            primary: String(act.title ?? 'Non renseigné'),
            secondary: `${act.owner || 'Non renseigné'} · Échéance ${due}`,
            badgeText: 'Retard',
            badgeTone: 'amber',
            navigateHash: '#actions'
          });
          actStack.append(row);
        });
      }
      two2.append(
        buildStackSection('NC créées (extrait)', 'Période', ncStack),
        buildStackSection('Actions en retard (extrait)', 'Stock fin période', actStack)
      );
      resultsHost.append(two2);
    } catch (err) {
      console.error('[analytics] periodic', err);
      statusLine.textContent = 'Erreur réseau ou serveur.';
      showToast('Erreur chargement reporting périodique', 'error');
    } finally {
      loadBtn.disabled = false;
    }
  });
}

function mountAutomationBlock(page) {
  const su = getSessionUser();
  const role = String(su?.role ?? '').toUpperCase();
  if (!su || (role !== 'ADMIN' && role !== 'QHSE')) return;

  const card = document.createElement('article');
  card.className = 'content-card card-soft analytics-automation-card';
  const autoHead = document.createElement('div');
  autoHead.className = 'content-card-head';
  const autoHeadInner = document.createElement('div');
  const autoKicker = document.createElement('div');
  autoKicker.className = 'section-kicker';
  autoKicker.textContent = 'Automatisation';
  const autoH3 = document.createElement('h3');
  autoH3.textContent = 'Jobs planifiés (V1)';
  const autoLead = document.createElement('p');
  autoLead.className = 'dashboard-muted-lead';
  autoLead.style.margin = '6px 0 0';
  autoLead.style.fontSize = '12px';
  autoLead.textContent = 'E-mails hebdo + relances actions · SMTP requis côté serveur.';
  autoHeadInner.append(autoKicker, autoH3, autoLead);
  autoHead.append(autoHeadInner);
  const statusEl = document.createElement('p');
  statusEl.className = 'automation-status-line';
  statusEl.style.margin = '0';
  statusEl.style.fontSize = '13px';
  statusEl.style.color = 'var(--text2)';
  const btnRow = document.createElement('div');
  btnRow.style.marginTop = '12px';
  btnRow.style.display = 'flex';
  btnRow.style.flexWrap = 'wrap';
  btnRow.style.gap = '10px';
  btnRow.style.alignItems = 'center';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-primary automation-run-btn';
  btn.style.minHeight = '44px';
  btn.style.fontWeight = '700';
  btn.textContent = 'Exécuter maintenant';
  btnRow.append(btn);
  const resultEl = document.createElement('p');
  resultEl.className = 'automation-run-result';
  resultEl.style.margin = '10px 0 0';
  resultEl.style.fontSize = '12px';
  resultEl.style.color = 'var(--text3)';
  resultEl.style.whiteSpace = 'pre-wrap';
  card.append(autoHead, statusEl, btnRow, resultEl);

  (async function loadStatus() {
    try {
      const res = await qhseFetch('/api/automation/status');
      if (!res.ok) {
        statusEl.textContent = 'Statut indisponible (droits ou API).';
        return;
      }
      const s = await res.json();
      const last =
        s.lastRunAt != null
          ? ` · Dernier passage : ${formatFrDateTime(s.lastRunAt)}`
          : '';
      statusEl.textContent = `SMTP : ${s.smtpConfigured ? 'configuré' : 'non configuré'} · Planificateur serveur : ${s.schedulerEnabled ? 'oui' : 'non'}${last}`;
    } catch {
      statusEl.textContent = 'Impossible de charger le statut.';
    }
  })();

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    resultEl.textContent = 'Exécution…';
    try {
      const res = await qhseFetch('/api/automation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        resultEl.textContent = data.error || `Erreur ${res.status}`;
        showToast(data.error || 'Erreur', 'error');
        return;
      }
      resultEl.textContent = JSON.stringify(data.result ?? data, null, 2);
      showToast('Jobs exécutés', 'info');
      try {
        const sr = await qhseFetch('/api/automation/status');
        if (sr.ok) {
          const s = await sr.json();
          const last =
            s.lastRunAt != null
              ? ` · Dernier passage : ${formatFrDateTime(s.lastRunAt)}`
              : '';
          statusEl.textContent = `SMTP : ${s.smtpConfigured ? 'configuré' : 'non configuré'} · Planificateur serveur : ${s.schedulerEnabled ? 'oui' : 'non'}${last}`;
        }
      } catch {
        /* ignore */
      }
    } catch (e) {
      resultEl.textContent = String(e?.message || e);
      showToast('Erreur réseau', 'error');
    } finally {
      btn.disabled = false;
    }
  });

  page.append(card);
}

export function renderAnalytics() {
  ensureQhsePilotageStyles();
  ensureDashboardStyles();

  /** @type {Record<string, unknown> | null} */
  let lastAnalyticsSummary = null;

  const page = document.createElement('section');
  page.className = 'page-stack page-stack--premium-saas analytics-cockpit-page';

  const aMeta = pageTopbarById.analytics;
  const hero = document.createElement('header');
  hero.className = 'analytics-page-hero';
  const heroTop = document.createElement('div');
  heroTop.className = 'analytics-page-hero__top';
  const heroCopy = document.createElement('div');
  heroCopy.className = 'analytics-page-hero__copy';
  const kicker = document.createElement('p');
  kicker.className = 'section-kicker analytics-page-kicker';
  kicker.textContent = aMeta?.kicker || 'Pilotage';
  const title = document.createElement('h1');
  title.className = 'analytics-page-title';
  title.textContent = aMeta?.title || 'Analyses / Synthèse';
  const lead = document.createElement('p');
  lead.className = 'analytics-page-lead';
  lead.textContent =
    aMeta?.subtitle ||
    'Lecture décisionnelle : conformité, incidents, exécution du plan d’actions et qualité des audits. Même périmètre que la synthèse API.';
  const metaHero = document.createElement('p');
  metaHero.className = 'analytics-page-meta';
  metaHero.setAttribute('aria-live', 'polite');
  metaHero.textContent = 'Chargement…';
  const pdfSummaryBtn = document.createElement('button');
  pdfSummaryBtn.type = 'button';
  pdfSummaryBtn.className = 'btn btn-secondary';
  pdfSummaryBtn.textContent = 'Exporter PDF synthèse';
  pdfSummaryBtn.style.marginTop = '12px';
  pdfSummaryBtn.disabled = true;
  pdfSummaryBtn.addEventListener('click', async () => {
    if (!lastAnalyticsSummary) {
      showToast('Chargez la synthèse d’abord.', 'warning');
      return;
    }
    try {
      const { downloadAnalyticsSummaryPdf } = await import('../services/qhseReportsPdf.service.js');
      await downloadAnalyticsSummaryPdf(lastAnalyticsSummary);
    } catch (e) {
      console.error(e);
    }
  });

  heroCopy.append(kicker, title, lead, pdfSummaryBtn);
  heroTop.append(heroCopy, metaHero);
  hero.append(heroTop);

  const loading = document.createElement('p');
  loading.className = 'analytics-loading-line';
  loading.textContent = 'Chargement de la synthèse…';

  const contentHost = document.createElement('div');
  contentHost.className = 'analytics-content-host';
  contentHost.append(loading);

  const exportHint = document.createElement('article');
  exportHint.className = 'content-card card-soft analytics-periodic-card';
  exportHint.innerHTML = `
    <div class="content-card-head analytics-periodic-card-head">
      <div>
        <div class="section-kicker">Rapport</div>
        <h3>Période et filtres</h3>
        <p class="dashboard-muted-lead analytics-periodic-lead">
          Rapport périodique (API <code>/api/reports/periodic</code>) : hebdo, mois en cours ou plage personnalisée.
        </p>
      </div>
    </div>
    <div class="form-grid analytics-periodic-form">
      <label class="field">
        <span>Période</span>
        <select class="control-select analytics-periodic-period" aria-label="Type de période">
          <option value="weekly">7 derniers jours</option>
          <option value="monthly">Mois en cours (1er → aujourd’hui)</option>
        </select>
      </label>
      <label class="field">
        <span>Début (optionnel)</span>
        <input type="date" class="control-input analytics-periodic-start" />
      </label>
      <label class="field">
        <span>Fin (optionnel)</span>
        <input type="date" class="control-input analytics-periodic-end" />
      </label>
      <label class="field">
        <span>Site</span>
        <select class="control-select analytics-periodic-site" aria-label="Filtrer par site"></select>
      </label>
      <label class="field">
        <span>Responsable (actions)</span>
        <select class="control-select analytics-periodic-assignee" aria-label="Filtrer par assigné"></select>
      </label>
      <button type="button" class="btn btn-primary analytics-periodic-load" style="min-height:44px;font-weight:700">
        Charger le reporting périodique
      </button>
      <button type="button" class="btn btn-secondary analytics-periodic-pdf" disabled style="min-height:44px;font-weight:700">
        Exporter PDF période
      </button>
    </div>
    <p class="analytics-periodic-status" style="margin:10px 0 0;font-size:12px;color:var(--text3)"></p>
    <div class="analytics-periodic-results stack" style="margin-top:12px"></div>
  `;
  mountPeriodicReportingBlock(exportHint);

  const periodicWrap = document.createElement('div');
  periodicWrap.className = 'analytics-periodic-wrap';
  periodicWrap.append(exportHint);

  page.append(hero, contentHost, periodicWrap);
  mountAutomationBlock(page);

  (async function load() {
    try {
      const res = await qhseFetch(withSiteQuery('/api/reports/summary'));
      if (res.status === 403) {
        loading.textContent =
          'Accès refusé : la synthèse nécessite la permission « rapports » (lecture).';
        metaHero.textContent = 'Permission insuffisante';
        showToast('Permission rapports requise pour la synthèse.', 'error');
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      lastAnalyticsSummary = data;
      pdfSummaryBtn.disabled = false;

      metaHero.textContent = `Mise à jour ${formatFrDateTime(data.generatedAt)} · ${data.export?.documentTitle ?? 'Synthèse QHSE'}`;

      contentHost.replaceChildren();

      const counts = data.counts || {};
      const kpis = data.kpis || {};
      const priorityAlerts = Array.isArray(data.priorityAlerts) ? data.priorityAlerts : [];

      const cockpitStack = document.createElement('div');
      cockpitStack.className = 'analytics-cockpit-stack';
      cockpitStack.append(
        buildAnalyticsPrimaryKpis(counts, kpis),
        buildAnalyticsMainSplit(counts, data, kpis, priorityAlerts),
        buildAnalyticsSecondaryCharts(counts, data),
        createAnalyticsQuadInsightSection(counts, data, kpis)
      );
      contentHost.append(cockpitStack);

      const ncStack = document.createElement('div');
      ncStack.className = 'stack';
      const ncs = Array.isArray(data.openNonConformities)
        ? data.openNonConformities
        : [];
      if (ncs.length === 0) {
        ncStack.append(
          emptyNote('Aucune non-conformité ouverte listée (ou échantillon vide).')
        );
      } else {
        const shown = ncs.slice(0, ANALYTICS_LIST_CAP);
        shown.forEach((nc) => {
          const row = document.createElement('article');
          row.className = 'list-row';
          mountAnalyticsListRow(row, {
            primary: String(nc.title ?? 'Non renseigné'),
            secondary: `Audit ${nc.auditRef} · ${nc.status}`,
            badgeText: 'NC',
            badgeTone: 'amber',
            navigateHash: '#iso'
          });
          ncStack.append(row);
        });
        if (ncs.length > ANALYTICS_LIST_CAP) {
          ncStack.append(
            listOverflowNote(
              ncs.length - ANALYTICS_LIST_CAP,
              'autre NC ouverte dans l’échantillon.',
              'autres NC ouvertes dans l’échantillon.'
            )
          );
        }
      }

      const actStack = document.createElement('div');
      actStack.className = 'stack';
      const acts = Array.isArray(data.overdueActions) ? data.overdueActions : [];
      if (acts.length === 0) {
        actStack.append(
          emptyNote('Aucune action en retard dans les extraits récents.')
        );
      } else {
        const shownA = acts.slice(0, ANALYTICS_LIST_CAP);
        shownA.forEach((act) => {
          const row = document.createElement('article');
          row.className = 'list-row';
          const due = act.dueDate ? formatFrDate(act.dueDate) : 'Non disponible';
          mountAnalyticsListRow(row, {
            primary: String(act.title ?? 'Non renseigné'),
            secondary: `${act.owner || 'Non renseigné'} · Échéance ${due}`,
            badgeText: 'Retard',
            badgeTone: 'amber',
            navigateHash: '#actions'
          });
          actStack.append(row);
        });
        if (acts.length > ANALYTICS_LIST_CAP) {
          actStack.append(
            listOverflowNote(
              acts.length - ANALYTICS_LIST_CAP,
              'autre action en retard dans l’échantillon.',
              'autres actions en retard dans l’échantillon.'
            )
          );
        }
      }

      const auditStack = document.createElement('div');
      auditStack.className = 'stack';
      const audits = Array.isArray(data.recentAudits) ? data.recentAudits : [];
      if (audits.length === 0) {
        auditStack.append(emptyNote('Aucun audit enregistré.'));
      } else {
        const shownAud = audits.slice(0, ANALYTICS_LIST_CAP);
        shownAud.forEach((a) => {
          const row = document.createElement('article');
          row.className = 'list-row';
          mountAnalyticsListRow(row, {
            primary: String(a.ref ?? 'Non disponible'),
            secondary: `${a.site} · ${a.status}`,
            badgeText: `${a.score} %`,
            badgeTone: 'blue',
            navigateHash: '#audits'
          });
          auditStack.append(row);
        });
        if (audits.length > ANALYTICS_LIST_CAP) {
          auditStack.append(
            listOverflowNote(
              audits.length - ANALYTICS_LIST_CAP,
              'autre audit dans l’échantillon.',
              'autres audits dans l’échantillon.'
            )
          );
        }
      }

      const critStack = document.createElement('div');
      critStack.className = 'stack';
      const crit = Array.isArray(data.criticalIncidents)
        ? data.criticalIncidents
        : [];
      if (crit.length === 0) {
        critStack.append(
          emptyNote('Aucun incident critique ouvert dans le périmètre analysé.')
        );
      } else {
        crit.forEach((inc) => {
          const row = document.createElement('article');
          row.className = 'list-row';
          mountAnalyticsListRow(row, {
            primary: `${inc.ref} : ${inc.type}`,
            secondary: `${inc.site} · ${inc.status}`,
            badgeText: formatFrDate(inc.createdAt),
            badgeTone: 'red',
            navigateHash: '#incidents'
          });
          critStack.append(row);
        });
      }

      const alertsStack = document.createElement('div');
      alertsStack.className = 'stack';
      if (priorityAlerts.length === 0) {
        alertsStack.append(emptyNote('Aucune alerte renvoyée.'));
      } else {
        priorityAlerts.forEach((a) => {
          const row = document.createElement('article');
          row.className = 'list-row';
          const tone = alertBadgeClass(a.level);
          mountAnalyticsListRow(row, {
            primary: a.code || 'ALERTE',
            secondary: a.message || '',
            badgeText:
              a.level === 'critical' ? 'Critique' : a.level === 'high' ? 'Priorité' : 'Info',
            badgeTone: tone,
            secondaryLineHeight: '1.45',
            navigateHash: navigateHashForPilotageAlert(a)
          });
          alertsStack.append(row);
        });
      }

      contentHost.append(buildCriticalTriptych(ncStack, actStack, auditStack));

      const extended = document.createElement('details');
      extended.className = 'analytics-extended-details';
      extended.setAttribute('open', '');
      const sumExt = document.createElement('summary');
      sumExt.textContent = 'Indicateurs détaillés, incidents critiques et alertes (listes)';
      extended.append(sumExt);
      const extInner = document.createElement('div');
      extInner.className = 'analytics-extended-details-inner stack';
      extInner.append(buildKpiGrid(counts, kpis));
      extInner.append(
        buildStackSection('Incidents critiques (aperçu)', 'Sécurité', critStack)
      );
      extInner.append(
        buildStackSection('Alertes prioritaires (liste)', 'Pilotage', alertsStack)
      );
      extended.append(extInner);
      contentHost.append(extended);
    } catch (err) {
      console.error('[analytics] /api/reports/summary', err);
      loading.textContent =
        'Impossible de charger la synthèse. Vérifiez l’API et la console.';
      metaHero.textContent = 'Erreur de chargement';
      showToast('Erreur chargement synthèse reporting', 'error');
    }
  })();

  return page;
}
