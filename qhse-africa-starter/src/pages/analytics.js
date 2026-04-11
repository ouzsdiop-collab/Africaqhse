import { getSessionUser } from '../data/sessionUser.js';
import { pageTopbarById } from '../data/navigation.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import { appState } from '../utils/state.js';
import { fetchSitesCatalog } from '../services/sitesCatalog.service.js';
import { fetchUsers } from '../services/users.service.js';
import { showToast } from '../components/toast.js';
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
import { escapeHtml } from '../utils/escapeHtml.js';

const ANALYTICS_LIST_CAP = 5;

function formatFrDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
}

function formatFrDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
}

function alertBadgeClass(level) {
  if (level === 'critical') return 'red';
  if (level === 'high') return 'amber';
  return 'blue';
}

function emptyNote(text) {
  const p = document.createElement('p');
  p.style.margin = '0';
  p.style.fontSize = '13px';
  p.style.color = 'var(--text3)';
  p.textContent = text;
  return p;
}

function listOverflowNote(hidden, singular, plural) {
  const p = document.createElement('p');
  p.className = 'analytics-list-overflow';
  p.textContent = `${hidden} ${hidden > 1 ? plural : singular}`;
  return p;
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
    const s = String(a.status || '—').trim() || '—';
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
      `${counts.incidentsCriticalOpen} incident(s) critique(s) encore ouvert(s) — priorité sécurité.`
    );
  }
  if (counts.actionsOverdue > 0) {
    out.push(`${counts.actionsOverdue} action(s) en retard — relancer les porteurs.`);
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
      `Score moyen des audits à ${kpis.auditScoreAvg} % — renforcer les plans d'amélioration.`
    );
  }
  if (out.length === 0) {
    out.push(
      'Indicateurs stables sur l’échantillon automatique — poursuivre le pilotage et ouvrir le détail si besoin.'
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
      row.textContent = (a.message || a.code || '—').trim();
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
  let conformPct = '—';
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
      value: String(counts.incidentsLast30Days ?? '—'),
      tone: inc30 >= 10 ? 'amber' : 'blue',
      hint: `${counts.incidentsTotal ?? '—'} total périmètre`
    },
    {
      label: 'Actions en retard',
      value: String(counts.actionsOverdue ?? '—'),
      tone: counts.actionsOverdue > 0 ? 'amber' : 'green',
      hint: `Sur ${counts.actionsTotal ?? '—'} actions`
    },
    {
      label: 'Score audits',
      value:
        kpis.auditScoreAvg != null && !Number.isNaN(kpis.auditScoreAvg)
          ? `${kpis.auditScoreAvg} %`
          : '—',
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
        'Pas assez de scores d’audit datés pour une courbe — complétez les audits dans le temps.'
      )
    );
  } else {
    const chart = createKpiMultiLineChart(
      labels,
      series,
      `${counts.auditsTotal ?? '—'} audit(s) en base · échelle 0–100 % · réf. 75 % · grille + survol`,
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
      value: String(counts.incidentsTotal ?? '—'),
      tone: 'blue',
      note: `${counts.incidentsLast30Days ?? '—'} sur 30 j.`
    },
    {
      label: 'Incidents critiques ouverts',
      value: String(counts.incidentsCriticalOpen ?? '—'),
      tone: counts.incidentsCriticalOpen > 0 ? 'red' : 'green',
      note: 'Sur les 400 derniers incidents (non clos)'
    },
    {
      label: 'NC ouvertes',
      value: String(counts.nonConformitiesOpen ?? '—'),
      tone: counts.nonConformitiesOpen >= 5 ? 'amber' : 'blue',
      note: `Sur ${counts.nonConformitiesTotal ?? '—'} enregistrées`
    },
    {
      label: 'Actions en retard',
      value: String(counts.actionsOverdue ?? '—'),
      tone: counts.actionsOverdue > 0 ? 'amber' : 'green',
      note: `Sur ${counts.actionsTotal ?? '—'} actions`
    },
    {
      label: 'Audits (total)',
      value: String(counts.auditsTotal ?? '—'),
      tone: 'blue',
      note: 'Référentiel audits'
    },
    {
      label: 'Score moyen audits',
      value:
        kpis.auditScoreAvg != null && !Number.isNaN(kpis.auditScoreAvg)
          ? `${kpis.auditScoreAvg} %`
          : '—',
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
    card.innerHTML = `
      <div class="dashboard-kpi-card__stack">
        <div class="metric-label">${escapeHtml(kpi.label)}</div>
        <div class="metric-value ${kpi.tone}">${escapeHtml(kpi.value)}</div>
        <p class="metric-note metric-note--kpi">${escapeHtml(kpi.note)}</p>
      </div>
    `;
    grid.append(card);
  });

  return grid;
}

function buildStackSection(title, kicker, host) {
  const card = document.createElement('article');
  card.className = 'content-card card-soft';
  const head = document.createElement('div');
  head.className = 'content-card-head';
  head.innerHTML = `
    <div>
      <div class="section-kicker">${escapeHtml(kicker)}</div>
      <h3>${escapeHtml(title)}</h3>
    </div>
  `;
  card.append(head, host);
  return card;
}

function buildPeriodicSummaryGrid(summary) {
  const grid = document.createElement('section');
  grid.className = 'kpi-grid dashboard-kpi-grid';
  const items = [
    {
      label: 'Incidents créés (période)',
      value: String(summary.incidentsCreated ?? '—'),
      tone: 'blue',
      note: 'Déclarations sur la fenêtre'
    },
    {
      label: 'Audits enregistrés',
      value: String(summary.auditsRecorded ?? '—'),
      tone: 'blue',
      note: 'Créés sur la période'
    },
    {
      label: 'Score moyen audits',
      value:
        summary.auditScoreAvg != null && !Number.isNaN(summary.auditScoreAvg)
          ? `${summary.auditScoreAvg} %`
          : '—',
      tone:
        summary.auditScoreAvg != null && summary.auditScoreAvg < 70
          ? 'amber'
          : 'green',
      note: 'Sur les audits de la période'
    },
    {
      label: 'NC créées',
      value: String(summary.nonConformitiesCreated ?? '—'),
      tone: 'amber',
      note: `${summary.nonConformitiesOpenAmongCreated ?? '—'} encore ouvertes`
    },
    {
      label: 'Actions créées',
      value: String(summary.actionsCreated ?? '—'),
      tone: 'blue',
      note: `${summary.actionsCreatedWithClosedLikeStatus ?? '—'} statut terminé/clôturé`
    },
    {
      label: 'Actions en retard (stock)',
      value: String(summary.actionsOverdueStock ?? '—'),
      tone: summary.actionsOverdueStock > 0 ? 'amber' : 'green',
      note: 'À la fin de la période, filtres appliqués'
    },
    {
      label: 'Incidents critiques (période)',
      value: String(summary.criticalIncidentsInPeriod ?? '—'),
      tone: summary.criticalIncidentsOpenInPeriod > 0 ? 'red' : 'green',
      note: `${summary.criticalIncidentsOpenInPeriod ?? '—'} non clôturés`
    }
  ];
  items.forEach((kpi) => {
    const card = document.createElement('article');
    card.className = `metric-card card-soft dashboard-kpi-card dashboard-kpi-card--tone-${kpi.tone}`;
    card.innerHTML = `
      <div class="dashboard-kpi-card__stack">
        <div class="metric-label">${escapeHtml(kpi.label)}</div>
        <div class="metric-value ${kpi.tone}">${escapeHtml(kpi.value)}</div>
        <p class="metric-note metric-note--kpi">${escapeHtml(kpi.note)}</p>
      </div>
    `;
    grid.append(card);
  });
  return grid;
}

function mountPeriodicReportingBlock(periodicCard) {
  const periodSel = periodicCard.querySelector('.analytics-periodic-period');
  const startIn = periodicCard.querySelector('.analytics-periodic-start');
  const endIn = periodicCard.querySelector('.analytics-periodic-end');
  const siteSel = periodicCard.querySelector('.analytics-periodic-site');
  const assigneeSel = periodicCard.querySelector('.analytics-periodic-assignee');
  const loadBtn = periodicCard.querySelector('.analytics-periodic-load');
  const resultsHost = periodicCard.querySelector('.analytics-periodic-results');
  const statusLine = periodicCard.querySelector('.analytics-periodic-status');

  (async function fillFilters() {
    siteSel.innerHTML = '<option value="">— Tous sites —</option>';
    assigneeSel.innerHTML = '<option value="">— Tous responsables —</option>';
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
          row.innerHTML = `
            <div>
              <strong>${escapeHtml(a.code || 'ALERTE')}</strong>
              <p style="margin:6px 0 0;font-size:13px;line-height:1.45;color:var(--text2)">${escapeHtml(a.message || '')}</p>
            </div>
            <span class="badge ${tone}">${a.level === 'critical' ? 'Critique' : a.level === 'high' ? 'Priorité' : 'Info'}</span>
          `;
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
          row.innerHTML = `
            <div>
              <strong>${escapeHtml(inc.ref)} — ${escapeHtml(inc.type)}</strong>
              <p style="margin:6px 0 0;font-size:13px;color:var(--text2)">${escapeHtml(inc.site)} · ${escapeHtml(inc.status)}</p>
            </div>
            <span class="badge blue">${escapeHtml(formatFrDate(inc.createdAt))}</span>
          `;
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
          row.innerHTML = `
            <div>
              <strong>${escapeHtml(a.ref)}</strong>
              <p style="margin:6px 0 0;font-size:13px;color:var(--text2)">${escapeHtml(a.site)} · ${escapeHtml(a.status)}</p>
            </div>
            <span class="badge blue">${escapeHtml(a.score)} %</span>
          `;
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
          row.innerHTML = `
            <div>
              <strong>${escapeHtml(nc.title)}</strong>
              <p style="margin:6px 0 0;font-size:13px;color:var(--text2)">Audit ${escapeHtml(nc.auditRef)} · ${escapeHtml(nc.status)}</p>
            </div>
            <span class="badge amber">NC</span>
          `;
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
          const due = act.dueDate ? formatFrDate(act.dueDate) : '—';
          row.innerHTML = `
            <div>
              <strong>${escapeHtml(act.title)}</strong>
              <p style="margin:6px 0 0;font-size:13px;color:var(--text2)">${escapeHtml(act.owner || '—')} · Échéance ${escapeHtml(due)}</p>
            </div>
            <span class="badge amber">Retard</span>
          `;
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
  card.innerHTML = `
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Automatisation</div>
        <h3>Jobs planifiés (V1)</h3>
        <p class="dashboard-muted-lead" style="margin:6px 0 0;font-size:12px">
          E-mails hebdo + relances actions · SMTP requis côté serveur.
        </p>
      </div>
    </div>
    <p class="automation-status-line" style="margin:0;font-size:13px;color:var(--text2)"></p>
    <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:10px;align-items:center">
      <button type="button" class="btn btn-primary automation-run-btn" style="min-height:44px;font-weight:700">Exécuter maintenant</button>
    </div>
    <p class="automation-run-result" style="margin:10px 0 0;font-size:12px;color:var(--text3);white-space:pre-wrap"></p>
  `;

  const statusEl = card.querySelector('.automation-status-line');
  const resultEl = card.querySelector('.automation-run-result');
  const btn = card.querySelector('.automation-run-btn');

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

  const page = document.createElement('section');
  page.className = 'page-stack analytics-cockpit-page';

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
  title.textContent = aMeta?.title || 'Analytics / Synthèse';
  const lead = document.createElement('p');
  lead.className = 'analytics-page-lead';
  lead.textContent =
    aMeta?.subtitle ||
    'Lecture décisionnelle : conformité, incidents, exécution du plan d’actions et qualité des audits — même périmètre que la synthèse API.';
  const metaHero = document.createElement('p');
  metaHero.className = 'analytics-page-meta';
  metaHero.setAttribute('aria-live', 'polite');
  metaHero.textContent = 'Chargement…';
  heroCopy.append(kicker, title, lead);
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
          Rapport périodique (API <code>/api/reports/periodic</code>) — hebdo, mois en cours ou plage personnalisée.
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
          row.innerHTML = `
            <div>
              <strong>${escapeHtml(nc.title)}</strong>
              <p style="margin:6px 0 0;font-size:13px;color:var(--text2)">Audit ${escapeHtml(nc.auditRef)} · ${escapeHtml(nc.status)}</p>
            </div>
            <span class="badge amber">NC</span>
          `;
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
          const due = act.dueDate ? formatFrDate(act.dueDate) : '—';
          row.innerHTML = `
            <div>
              <strong>${escapeHtml(act.title)}</strong>
              <p style="margin:6px 0 0;font-size:13px;color:var(--text2)">${escapeHtml(act.owner || '—')} · Échéance ${escapeHtml(due)}</p>
            </div>
            <span class="badge amber">Retard</span>
          `;
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
          row.innerHTML = `
            <div>
              <strong>${escapeHtml(a.ref)}</strong>
              <p style="margin:6px 0 0;font-size:13px;color:var(--text2)">${escapeHtml(a.site)} · ${escapeHtml(a.status)}</p>
            </div>
            <span class="badge blue">${escapeHtml(a.score)} %</span>
          `;
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
          row.innerHTML = `
            <div>
              <strong>${escapeHtml(inc.ref)} — ${escapeHtml(inc.type)}</strong>
              <p style="margin:6px 0 0;font-size:13px;color:var(--text2)">${escapeHtml(inc.site)} · ${escapeHtml(inc.status)}</p>
            </div>
            <span class="badge red">${escapeHtml(formatFrDate(inc.createdAt))}</span>
          `;
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
          row.innerHTML = `
            <div>
              <strong>${escapeHtml(a.code || 'ALERTE')}</strong>
              <p style="margin:6px 0 0;font-size:13px;line-height:1.45;color:var(--text2)">${escapeHtml(a.message || '')}</p>
            </div>
            <span class="badge ${tone}">${a.level === 'critical' ? 'Critique' : a.level === 'high' ? 'Priorité' : 'Info'}</span>
          `;
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
