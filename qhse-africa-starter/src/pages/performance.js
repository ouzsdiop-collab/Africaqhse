import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import { appState, setActiveSiteContext } from '../utils/state.js';
import { fetchSitesCatalog } from '../services/sitesCatalog.service.js';
import { showToast } from '../components/toast.js';
import { ensureDashboardStyles } from '../components/dashboardStyles.js';
import {
  buildMonthlyAuditScoreAvgSeries,
  createDashboardLineChart,
  createPilotageLoadMixChart,
  interpretAuditScoreSeries
} from '../components/dashboardCharts.js';
import { createKpiDetailDrawer } from '../components/kpiDetailDrawer.js';
import {
  buildActivityTimelineEntries,
  buildCockpitRecommendations,
  computeAbsolutePriority,
  computeGlobalQhseCockpitLevel,
  createAbsolutePrioritySection,
  createCockpitFreshnessIndicator,
  createGlobalScoreSection,
  createPrimaryCtaBar,
  createRecommendationsSection,
  createTimelineSection
} from '../components/performanceCockpitPremium.js';
import { createPerformanceTfTgBlock } from '../components/tfTgKpi.js';

const SNAPSHOT_KEY = 'qhse-performance-kpi-snapshot-v1';

/** Objectifs affichés (référence pilotage, pas de persistance serveur). */
const GOALS = {
  conformity: 85,
  auditScore: 80,
  actionsOverdue: 0,
  incidents30: 5,
  ncTreatmentRate: 75,
  actionOnTrackPct: 92
};

function sanitizeClassToken(value, fallback = 'neutral') {
  const token = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '');
  return token || fallback;
}

function snapshotStorageKey(months) {
  const sid = appState.activeSiteId || 'groupe';
  return `${sid}|m${months}`;
}

function readSnapshot(months) {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    return o[snapshotStorageKey(months)] || null;
  } catch {
    return null;
  }
}

function writeSnapshot(months, payload) {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY);
    const o = raw ? JSON.parse(raw) : {};
    o[snapshotStorageKey(months)] = payload;
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(o));
  } catch {
    /* ignore */
  }
}

function computeGlobalConformity(counts, kpis) {
  const audit = Number(kpis?.auditScoreAvg);
  const auditBase = Number.isFinite(audit) ? audit : 72;
  const ncTot = Math.max(0, Number(counts?.nonConformitiesTotal) || 0);
  const ncOpen = Math.max(0, Number(counts?.nonConformitiesOpen) || 0);
  const ncPen =
    ncTot > 0 ? (ncOpen / ncTot) * 28 : ncOpen > 0 ? 14 : 0;
  const actTot = Math.max(0, Number(counts?.actionsTotal) || 0);
  const actOd = Math.max(0, Number(counts?.actionsOverdue) || 0);
  const actPen = actTot > 0 ? (actOd / actTot) * 22 : actOd > 0 ? 11 : 0;
  const inc30 = Math.max(0, Number(counts?.incidentsLast30Days) || 0);
  const incPen = Math.min(18, inc30 * 1.4);
  const v = auditBase - ncPen - actPen - incPen;
  return Math.round(Math.max(0, Math.min(100, v)));
}

function formatDelta(prev, cur) {
  if (prev == null || Number.isNaN(Number(prev))) return 'Non disponible';
  const d = Math.round((Number(cur) - Number(prev)) * 10) / 10;
  if (Math.abs(d) < 0.05) return '=';
  return (d > 0 ? '+' : '') + String(d);
}

function toneVsGoal(value, goal, lowerIsBetter = false) {
  if (lowerIsBetter) {
    if (value > goal) return 'red';
    if (value > goal * 0.5 && goal > 0) return 'amber';
    return 'green';
  }
  if (value < goal - 8) return 'red';
  if (value < goal - 3) return 'amber';
  return 'green';
}

function formatEcartVsObjectif(value, goal, lowerIsBetter, unit = 'pt') {
  if (value == null || goal == null || Number.isNaN(Number(value))) return 'Non disponible';
  const v = Number(value);
  const g = Number(goal);
  if (lowerIsBetter) {
    if (g === 0) {
      if (v <= 0) return 'À la cible';
      return `${v} hors cible`;
    }
    const raw = g - v;
    if (Math.abs(raw) < 0.05) return 'À la cible';
    if (raw > 0) return `Marge +${Math.round(raw * 10) / 10}${unit === 'pt' ? '' : unit}`;
    return `Dépassement ${Math.round(raw * 10) / 10}${unit === 'pt' ? '' : unit}`;
  }
  const raw = v - g;
  if (Math.abs(raw) < 0.05) return 'À la cible';
  if (raw >= 0) return `+${Math.round(raw * 10) / 10} ${unit}`;
  return `${Math.round(raw * 10) / 10} ${unit}`;
}

function vigilanceLevel(conformity, counts, kpis) {
  const crit = Number(counts?.incidentsCriticalOpen) || 0;
  const od = Number(counts?.actionsOverdue) || 0;
  const avg = kpis?.auditScoreAvg;
  if (crit > 0 || od > 12 || (avg != null && avg < 65) || conformity < 55) {
    return { label: 'Alerte', tone: 'red', hint: 'Décisions rapides attendues.' };
  }
  if (od > 5 || (avg != null && avg < GOALS.auditScore) || conformity < GOALS.conformity) {
    return { label: 'Vigilance', tone: 'amber', hint: 'Serrer le suivi des écarts.' };
  }
  return { label: 'Maîtrise', tone: 'green', hint: 'Cap soutenable. Consolider.' };
}

function trendArrowFromDelta(deltaStr) {
  if (deltaStr === 'Non disponible' || deltaStr === '=') return '→';
  if (String(deltaStr).startsWith('+')) return '↑';
  if (String(deltaStr).startsWith('-')) return '↓';
  return '→';
}

/**
 * @param {object} counts
 * @param {object} kpis
 */
function buildPilotagePrioritiesStructured(counts, kpis) {
  /** @type {{ text: string; kpiKey: string; preset?: Record<string, string> | null }[]} */
  const out = [];
  const od = Number(counts?.actionsOverdue) || 0;
  const nc = Number(counts?.nonConformitiesOpen) || 0;
  const crit = Number(counts?.incidentsCriticalOpen) || 0;
  const avg = kpis?.auditScoreAvg;
  if (crit > 0) {
    out.push({
      text: 'Clôturer les incidents critiques.',
      kpiKey: 'incidentsCritical',
      preset: { severity: 'critique' }
    });
  }
  if (od > 0) {
    out.push({
      text: `Débloquer ${od} action(s) en retard.`,
      kpiKey: 'actionsLate'
    });
  }
  if (nc >= 4) {
    out.push({
      text: `Réduire les NC ouvertes (${nc}).`,
      kpiKey: 'ncOpen'
    });
  }
  if (avg != null && !Number.isNaN(avg) && avg < GOALS.auditScore) {
    out.push({
      text: `Rehausser le score audit (cible ${GOALS.auditScore} %).`,
      kpiKey: 'auditScore'
    });
  }
  if (out.length === 0) {
    out.push({
      text: 'Préparer revue direction et preuves.',
      kpiKey: 'conformity'
    });
  }
  return out.slice(0, 3);
}

/**
 * Lecture métier courte sous chaque KPI (ton = red | amber | green | blue).
 * @param {string} kind
 * @param {string} tone
 */
function kpiBusinessInsight(kind, tone) {
  const map = {
    conformity: {
      red: 'Conformité très inférieure à l’objectif. Plan d’action prioritaire.',
      amber: 'Écart notable vs cible. Activez les leviers NC, retards et sécurité.',
      green: 'Indice sous contrôle par rapport au repère. Consolidez les pratiques.',
      blue: 'Indicateur composite. Ouvrez le détail pour prioriser les leviers.'
    },
    auditScore: {
      red: 'Score audit sous le seuil. Audits et plans d’amélioration à renforcer.',
      amber: 'Marge vs objectif serrée. Suivez les écarts par site et norme.',
      green: 'Performance audit alignée sur la cible.',
      blue: 'Données score incomplètes. Complétez les audits notés.'
    },
    incidentsCritical: {
      red: 'Incidents critiques encore ouverts. Risque élevé, arbitrage attendu.',
      amber: 'Points critiques à traiter sans délai.',
      green: 'Aucun critique ouvert sur le périmètre chargé.',
      blue: 'Synthèse incidents. Ouvrez le détail pour filtrer par gravité.'
    },
    ncRate: {
      red: 'Taux de traitement NC sous la cible. Goulot sur la clôture.',
      amber: 'NC : progression à sécuriser (jalons, preuves).',
      green: 'Traitement NC dans les tolérances affichées.',
      blue: 'Données NC partielles. Fiabilisez le référentiel.'
    },
    execution: {
      red: 'Respect des échéances fragile. Désengorgez les files d’actions.',
      amber: 'Retards ponctuels. Relancez les porteurs.',
      green: 'Exécution globalement dans les temps.',
      blue: 'Indicateur d’adhérence. Croisez avec les retards réels.'
    },
    actionsLate: {
      red: 'Actions en retard impactent fortement la performance globale.',
      amber: 'Retards à traiter en priorité sur la période.',
      green: 'Aucun retard signalé sur les actions suivies.',
      blue: 'File actions. Filtrez par statut et responsable.'
    }
  };
  const row = map[kind] || {};
  return row[tone] || row.blue || 'Non disponible';
}

function navigateHash(id) {
  const x = String(id || '').replace(/^#/, '');
  if (x) window.location.hash = x;
}

function elKpiMain(opts) {
  const {
    title,
    valueText,
    deltaText,
    goalText,
    gapText,
    tone,
    statusTone,
    insight,
    kpiKey,
    onOpenDetail
  } = opts;
  const art = document.createElement('article');
  const safeStatusTone = sanitizeClassToken(statusTone || 'blue', 'blue');
  const safeTone = sanitizeClassToken(tone || 'blue', 'blue');
  art.className = `kpi-perf-main-card metric-card card-soft kpi-perf-main-card--${safeStatusTone} kpi-perf-main-card--tone-${safeTone}`;
  art.tabIndex = 0;
  art.setAttribute('role', 'button');
  art.setAttribute(
    'aria-label',
    `${title} : ouvrir le détail (${kpiKey || ''})`
  );
  art.addEventListener('click', () => onOpenDetail?.(kpiKey));
  art.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenDetail?.(kpiKey);
    }
  });
  const lbl = document.createElement('div');
  lbl.className = 'metric-label';
  lbl.textContent = title;
  const val = document.createElement('div');
  val.className = `metric-value ${safeTone} kpi-perf-main-value`;
  val.textContent = valueText;
  const meta = document.createElement('div');
  meta.className = 'kpi-perf-main-meta';
  const deltaSp = document.createElement('span');
  deltaSp.className = 'kpi-perf-delta';
  deltaSp.textContent = `Tendance ${deltaText}`;
  const goalSp = document.createElement('span');
  goalSp.className = 'kpi-perf-goal';
  goalSp.textContent = `Obj. ${goalText}`;
  meta.append(deltaSp, goalSp);
  art.append(lbl, val, meta);
  if (gapText && String(gapText).trim()) {
    const gapEl = document.createElement('div');
    gapEl.className = `kpi-perf-main-gap kpi-perf-main-gap--${safeTone}`;
    gapEl.textContent = gapText;
    art.append(gapEl);
  }
  if (insight && String(insight).trim()) {
    const ins = document.createElement('p');
    ins.className = `kpi-perf-main-insight kpi-perf-main-insight--${safeTone}`;
    ins.textContent = insight;
    art.append(ins);
  }
  return art;
}

function elPerfCockpitHero(conformity, prev, counts, kpis, onOpenConformityDetail) {
  const v = vigilanceLevel(conformity, counts, kpis);
  const safeVigilTone = sanitizeClassToken(v.tone, 'amber');
  const dConf = prev ? formatDelta(prev.conformity, conformity) : 'Non disponible';
  const arrow = trendArrowFromDelta(dConf);
  const section = document.createElement('section');
  section.className = 'kpi-perf-cockpit-hero';
  const scoreWrap = document.createElement('div');
  scoreWrap.className = 'kpi-perf-hero-score';
  scoreWrap.setAttribute('data-kpi-hero-score', '');
  const heroK = document.createElement('span');
  heroK.className = 'kpi-perf-hero-k';
  heroK.textContent = 'Indice de maîtrise QHSE';
  const valRow = document.createElement('div');
  valRow.className = 'kpi-perf-hero-val-row';
  const heroVal = document.createElement('span');
  heroVal.className = `kpi-perf-hero-val metric-value ${toneVsGoal(conformity, GOALS.conformity)}`;
  heroVal.textContent = String(conformity);
  const pct = document.createElement('span');
  pct.className = 'kpi-perf-hero-pct';
  pct.textContent = '%';
  const trend = document.createElement('span');
  trend.className = 'kpi-perf-hero-trend';
  trend.setAttribute('aria-hidden', 'true');
  trend.textContent = arrow;
  valRow.append(heroVal, pct, trend);
  const subP = document.createElement('p');
  subP.className = 'kpi-perf-hero-sub';
  const dStrong = document.createElement('strong');
  dStrong.textContent = dConf;
  subP.append(document.createTextNode('vs dernière visite : '), dStrong, document.createTextNode(' pts · '));
  const hint = document.createElement('span');
  hint.className = 'kpi-perf-hero-hint';
  hint.textContent = 'cliquer pour le détail des leviers';
  subP.append(hint);
  scoreWrap.append(heroK, valRow, subP);

  const vigil = document.createElement('div');
  vigil.className = `kpi-perf-hero-vigil kpi-perf-hero-vigil--${safeVigilTone}`;
  const vk = document.createElement('span');
  vk.className = 'kpi-perf-hero-vigil-k';
  vk.textContent = 'Niveau de vigilance';
  const vl = document.createElement('span');
  vl.className = 'kpi-perf-hero-vigil-l';
  vl.textContent = v.label;
  const vh = document.createElement('p');
  vh.className = 'kpi-perf-hero-vigil-h';
  vh.textContent = v.hint;
  vigil.append(vk, vl, vh);
  section.append(scoreWrap, vigil);
  const scoreEl = section.querySelector('[data-kpi-hero-score]');
  if (onOpenConformityDetail && scoreEl) {
    scoreEl.classList.add('kpi-perf-hero-score--interactive');
    scoreEl.setAttribute('role', 'button');
    scoreEl.tabIndex = 0;
    scoreEl.setAttribute('aria-label', 'Ouvrir le détail conformité : leviers croisés');
    scoreEl.addEventListener('click', (e) => {
      e.stopPropagation();
      onOpenConformityDetail();
    });
    scoreEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpenConformityDetail();
      }
    });
  }
  return section;
}

function elGoalVsRealCard(rows) {
  const card = document.createElement('article');
  card.className = 'content-card card-soft kpi-perf-chart-card kpi-perf-chart-card--goalvs';
  const head = document.createElement('div');
  head.className = 'content-card-head';
  const headInner = document.createElement('div');
  const gvk = document.createElement('div');
  gvk.className = 'kpi-perf-dx-kicker';
  gvk.textContent = 'Écart';
  const gvh2 = document.createElement('h2');
  gvh2.className = 'kpi-perf-h2 kpi-perf-h2--small';
  gvh2.textContent = 'Objectif vs réel';
  headInner.append(gvk, gvh2);
  head.append(headInner);
  const body = document.createElement('div');
  body.className = 'kpi-perf-goalvs-body';
  rows.forEach((r) => {
    const pct = Math.max(0, Math.min(100, Number(r.pctReal) || 0));
    const pctG = Math.max(0, Math.min(100, Number(r.pctGoal) || 0));
    const row = document.createElement('div');
    row.className = 'kpi-perf-goalvs-row';
    const lab = document.createElement('div');
    lab.className = 'kpi-perf-goalvs-label';
    lab.textContent = r.label;
    const track = document.createElement('div');
    track.className = 'kpi-perf-goalvs-track';
    track.setAttribute('role', 'presentation');
    const fill = document.createElement('div');
    fill.className = 'kpi-perf-goalvs-fill';
    fill.style.width = `${pct}%`;
    const marker = document.createElement('div');
    marker.className = 'kpi-perf-goalvs-marker';
    marker.style.left = `${pctG}%`;
    track.append(fill, marker);
    const vals = document.createElement('div');
    vals.className = 'kpi-perf-goalvs-vals';
    const realSp = document.createElement('span');
    realSp.className = 'kpi-perf-goalvs-real';
    realSp.textContent = r.realText;
    const goalSp = document.createElement('span');
    goalSp.className = 'kpi-perf-goalvs-goal';
    goalSp.textContent = `cible ${r.goalText}`;
    vals.append(realSp, goalSp);
    row.append(lab, track, vals);
    body.append(row);
  });
  const foot = document.createElement('p');
  foot.className = 'kpi-perf-goalvs-foot';
  foot.textContent = 'Réel (barre) · objectif (trait). Échelle normalisée par ligne.';
  card.append(head, body, foot);
  return card;
}

function elGapsCard(groups, summaryLine) {
  const card = document.createElement('section');
  card.className = 'kpi-perf-gaps';
  const gapsTitle = document.createElement('h2');
  gapsTitle.className = 'kpi-perf-gaps-title';
  gapsTitle.textContent = 'Écarts à l’objectif';
  const grid = document.createElement('div');
  grid.className = 'kpi-perf-gaps-grid';
  function gapsCol(extraCls, kicker) {
    const col = document.createElement('div');
    col.className = `kpi-perf-gaps-col ${extraCls}`;
    const sk = document.createElement('span');
    sk.className = 'kpi-perf-gaps-col-k';
    sk.textContent = kicker;
    const ul = document.createElement('ul');
    ul.className = 'kpi-perf-gaps-list';
    col.append(sk, ul);
    return col;
  }
  grid.append(
    gapsCol('kpi-perf-gaps-col--below', 'Sous la cible'),
    gapsCol('kpi-perf-gaps-col--watch', 'À surveiller'),
    gapsCol('kpi-perf-gaps-col--ok', 'À la cible')
  );
  card.append(gapsTitle, grid);
  if (summaryLine && String(summaryLine).trim()) {
    const sub = document.createElement('p');
    sub.className = 'kpi-perf-gaps-sub';
    sub.textContent = summaryLine;
    gapsTitle.after(sub);
  }
  const cols = card.querySelectorAll('.kpi-perf-gaps-col');
  const lists = [cols[0].querySelector('ul'), cols[1].querySelector('ul'), cols[2].querySelector('ul')];
  (groups.below || []).forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    lists[0].append(li);
  });
  (groups.watch || []).forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    lists[1].append(li);
  });
  (groups.ok || []).forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    lists[2].append(li);
  });
  [0, 1, 2].forEach((i) => {
    if (!lists[i].children.length) {
      const li = document.createElement('li');
      li.className = 'kpi-perf-gaps-empty';
      li.textContent = 'Non disponible';
      lists[i].append(li);
    }
  });
  return card;
}

/**
 * @param {{ text: string; kpiKey: string; preset?: Record<string, string> | null }[]} items
 * @param {(k: string, p?: Record<string, string> | null) => void} onPick
 */
function elPrioritiesCard(items, onPick) {
  const card = document.createElement('section');
  card.className = 'kpi-perf-priorities';
  const h = document.createElement('h2');
  h.className = 'kpi-perf-priorities-title';
  h.textContent = 'Priorités de pilotage';
  const ol = document.createElement('ol');
  ol.className = 'kpi-perf-priorities-list';
  items.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'kpi-perf-priorities-li';
    const idx = document.createElement('span');
    idx.className = 'kpi-perf-priorities-idx';
    idx.textContent = String(i + 1);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'kpi-perf-priorities-btn';
    btn.textContent = item.text;
    btn.setAttribute('aria-label', `Ouvrir la liste : ${item.text}`);
    btn.addEventListener('click', () => onPick(item.kpiKey, item.preset || null));
    li.append(idx, btn);
    ol.append(li);
  });
  card.append(h, ol);
  return card;
}

function classifyGapGroups(metrics) {
  const below = [];
  const watch = [];
  const ok = [];
  metrics.forEach((m) => {
    if (m.zone === 'below') below.push(m.label);
    else if (m.zone === 'watch') watch.push(m.label);
    else ok.push(m.label);
  });
  return { below, watch, ok };
}

export function renderPerformance() {
  ensureDashboardStyles();

  /** @type {{ incidents: unknown[]; actions: unknown[]; audits: unknown[]; ncs: unknown[] }} */
  let perfLists = { incidents: [], actions: [], audits: [], ncs: [] };
  const kpiDrawer = createKpiDetailDrawer({
    getData: () => perfLists
  });

  function openPerfKpi(kpiKey, preset) {
    if (!kpiKey) return;
    kpiDrawer.open(kpiKey, preset ?? null);
  }

  const page = document.createElement('section');
  page.className = 'page-stack page-stack--premium-saas kpi-performance-page';
  page.append(kpiDrawer.element);

  const header = document.createElement('header');
  header.className = 'kpi-perf-header kpi-perf-header--toolbar-only';

  const toolbar = document.createElement('div');
  toolbar.className = 'kpi-perf-toolbar';

  const periodWrap = document.createElement('label');
  periodWrap.className = 'field kpi-perf-field';
  const periodLbl = document.createElement('span');
  periodLbl.textContent = 'Période';
  periodWrap.append(periodLbl);
  const periodSel = document.createElement('select');
  periodSel.className = 'control-select';
  periodSel.setAttribute('aria-label', 'Nombre de mois sur le graphique');
  [
    { v: '3', t: '3 mois' },
    { v: '6', t: '6 mois' },
    { v: '12', t: '12 mois' }
  ].forEach((o) => {
    const opt = document.createElement('option');
    opt.value = o.v;
    opt.textContent = o.t;
    periodSel.append(opt);
  });
  periodSel.value = '6';
  periodWrap.append(periodSel);

  /** @type {null | Record<string, unknown>} */
  let lastPerfPdfContext = null;

  const pdfPerfBtn = document.createElement('button');
  pdfPerfBtn.type = 'button';
  pdfPerfBtn.className = 'btn btn-secondary';
  pdfPerfBtn.textContent = 'Export PDF';
  pdfPerfBtn.title = 'Rapport de performance QHSE (PDF premium)';
  pdfPerfBtn.addEventListener('click', async () => {
    if (!lastPerfPdfContext) {
      showToast('Chargez d’abord les indicateurs.', 'warning');
      return;
    }
    try {
      const { downloadPerformanceQhsePdf } = await import('../services/qhseReportsPdf.service.js');
      await downloadPerformanceQhsePdf(lastPerfPdfContext);
    } catch (e) {
      console.error(e);
    }
  });

  const siteWrap = document.createElement('label');
  siteWrap.className = 'field kpi-perf-field';
  const siteLbl = document.createElement('span');
  siteLbl.textContent = 'Site';
  siteWrap.append(siteLbl);
  const siteSel = document.createElement('select');
  siteSel.className = 'control-select';
  siteSel.setAttribute('aria-label', 'Filtrer par site');
  siteWrap.append(siteSel);

  const yearWrap = document.createElement('label');
  yearWrap.className = 'field kpi-perf-field';
  const yearLbl = document.createElement('span');
  yearLbl.textContent = 'Année (TF/TG)';
  yearWrap.append(yearLbl);
  const yearSel = document.createElement('select');
  yearSel.className = 'control-select';
  yearSel.setAttribute('aria-label', 'Année pour les indicateurs TF et TG');
  const currentY = new Date().getFullYear();
  for (let y = currentY + 1; y >= currentY - 6; y--) {
    const opt = document.createElement('option');
    opt.value = String(y);
    opt.textContent = String(y);
    yearSel.append(opt);
  }
  yearSel.value = String(currentY);
  yearWrap.append(yearSel);

  toolbar.append(periodWrap, siteWrap, yearWrap, pdfPerfBtn);
  header.append(toolbar);
  page.append(header);

  const loading = document.createElement('p');
  loading.className = 'kpi-perf-loading';
  loading.textContent = 'Chargement des indicateurs…';

  const tfTgBlock = createPerformanceTfTgBlock({
    getYear: () => yearSel.value
  });

  const content = document.createElement('div');
  content.className = 'kpi-perf-content stack';
  content.append(tfTgBlock.root, loading);

  page.append(content);

  (async function fillSites() {
    siteSel.replaceChildren();
    const siteOpt0 = document.createElement('option');
    siteOpt0.value = '';
    siteOpt0.textContent = 'Vue groupe (tous sites)';
    siteSel.append(siteOpt0);
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
  })();

  let reload = () => {};

  siteSel.addEventListener('change', () => {
    const v = siteSel.value || '';
    const opt = siteSel.selectedOptions[0];
    const label = opt ? opt.textContent : 'Vue groupe (tous sites)';
    setActiveSiteContext(v || null, label);
    reload();
  });

  periodSel.addEventListener('change', () => reload());

  yearSel.addEventListener('change', () => reload());

  reload = async function loadPerformanceData() {
    const months = Math.max(3, Math.min(12, parseInt(periodSel.value, 10) || 6));
    loading.style.display = 'block';
    const tfRoot = tfTgBlock.root;
    [...content.children].forEach((n) => {
      if (n.classList.contains('kpi-perf-loading')) return;
      if (n === tfRoot) return;
      n.remove();
    });
    const tfTgPromise = tfTgBlock.refresh();
    try {
      const [sumRes, incRes, audRes, actRes, ncRes] = await Promise.all([
        qhseFetch(withSiteQuery('/api/reports/summary')),
        qhseFetch(withSiteQuery('/api/incidents?limit=500')),
        qhseFetch(withSiteQuery('/api/audits?limit=500')),
        qhseFetch(withSiteQuery('/api/actions?limit=500')),
        qhseFetch(withSiteQuery('/api/nonconformities?limit=300'))
      ]);

      if (sumRes.status === 403) {
        loading.textContent =
          'Permission « rapports » requise pour les KPI consolidés.';
        showToast('Permission rapports requise pour Performance QHSE.', 'error');
        return;
      }
      if (!sumRes.ok) throw new Error(`summary ${sumRes.status}`);
      const summary = await sumRes.json();
      const incidents = incRes.ok ? await incRes.json().catch(() => []) : [];
      const audits = audRes.ok ? await audRes.json().catch(() => []) : [];
      const actions = actRes.ok ? await actRes.json().catch(() => []) : [];
      const ncs = ncRes.ok ? await ncRes.json().catch(() => []) : [];
      perfLists = { incidents, actions, audits, ncs };

      const counts = summary.counts || {};
      const kpis = summary.kpis || {};
      const conformity = computeGlobalConformity(counts, kpis);
      const prev = readSnapshot(months);

      const auditAvg =
        kpis.auditScoreAvg != null && !Number.isNaN(kpis.auditScoreAvg)
          ? kpis.auditScoreAvg
          : null;
      const inc30 = Number(counts.incidentsLast30Days) || 0;
      const actOd = Number(counts.actionsOverdue) || 0;
      const actTot = Math.max(0, Number(counts.actionsTotal) || 0);
      const ncTot = Math.max(0, Number(counts.nonConformitiesTotal) || 0);
      const ncOpen = Math.max(0, Number(counts.nonConformitiesOpen) || 0);
      const critOpen = Number(counts.incidentsCriticalOpen) || 0;
      const closeRate =
        ncTot > 0
          ? Math.round(((ncTot - ncOpen) / ncTot) * 1000) / 10
          : null;
      const actOnTrackPct =
        actTot > 0
          ? Math.round(((actTot - actOd) / actTot) * 1000) / 10
          : null;

      const seriesScore = buildMonthlyAuditScoreAvgSeries(audits, months);
      const lineSeries = seriesScore.map((p) => ({
        label: p.label,
        value: Math.max(0, Math.min(100, Math.round(Number(p.value) || 0)))
      }));

      const progressionChart = createDashboardLineChart(lineSeries, {
        lineTheme: 'audits',
        ariaLabel: 'Score moyen des audits par mois.',
        footText: `Moyenne mensuelle (audits datés, 0–100 %) · objectif ${GOALS.auditScore} %.`,
        interpretText: interpretAuditScoreSeries(lineSeries),
        valueTitle: (p) => `${p.label} : ${p.value} %`,
        targetYPercent: GOALS.auditScore,
        targetLabel: `Objectif ${GOALS.auditScore} %`
      });

      const goalVsRows = [
        {
          label: 'Conformité (indice)',
          pctReal: conformity,
          pctGoal: GOALS.conformity,
          realText: `${conformity} %`,
          goalText: `${GOALS.conformity} %`
        },
        {
          label: 'Score audit moyen',
          pctReal: auditAvg != null ? auditAvg : 0,
          pctGoal: GOALS.auditScore,
          realText: auditAvg != null ? `${auditAvg} %` : 'Non disponible',
          goalText: `${GOALS.auditScore} %`
        },
        {
          label: 'NC traitées (%)',
          pctReal: closeRate != null ? closeRate : 0,
          pctGoal: GOALS.ncTreatmentRate,
          realText: closeRate != null ? `${closeRate} %` : 'Non disponible',
          goalText: `${GOALS.ncTreatmentRate} %`
        },
        {
          label: 'Actions hors retard',
          pctReal: actOnTrackPct != null ? actOnTrackPct : 0,
          pctGoal: GOALS.actionOnTrackPct,
          realText: actOnTrackPct != null ? `${actOnTrackPct} %` : 'Non disponible',
          goalText: `${GOALS.actionOnTrackPct} %`
        },
        {
          label: 'Pression retards (inv.)',
          pctReal: actTot > 0 ? Math.min(100, (actOd / actTot) * 100) : actOd > 0 ? 100 : 0,
          pctGoal: 0,
          realText: `${actOd} / ${actTot || 'Non disponible'}`,
          goalText: '0 retard'
        }
      ];

      const zoneFor = (tone) => {
        if (tone === 'red') return 'below';
        if (tone === 'amber') return 'watch';
        return 'ok';
      };

      const gapMetrics = [
        {
          label: `Conformité globale (${conformity} %)`,
          zone: zoneFor(toneVsGoal(conformity, GOALS.conformity))
        },
        {
          label:
            closeRate != null
              ? `Taux traitement NC (${closeRate} %)`
              : 'Taux traitement NC (données insuffisantes)',
          zone:
            closeRate == null
              ? 'watch'
              : zoneFor(toneVsGoal(closeRate, GOALS.ncTreatmentRate))
        },
        {
          label: `Incidents critiques (${critOpen})`,
          zone: zoneFor(toneVsGoal(critOpen, GOALS.actionsOverdue, true))
        },
        {
          label:
            auditAvg != null
              ? `Score audit (${auditAvg} %)`
              : 'Score audit (non disponible)',
          zone:
            auditAvg == null
              ? 'watch'
              : zoneFor(toneVsGoal(auditAvg, GOALS.auditScore))
        },
        {
          label:
            actOnTrackPct != null
              ? `Exécution actions (${actOnTrackPct} % hors retard)`
              : 'Exécution actions (non disponible)',
          zone:
            actOnTrackPct == null
              ? 'watch'
              : zoneFor(toneVsGoal(actOnTrackPct, GOALS.actionOnTrackPct))
        },
        {
          label: `Actions en retard (${actOd})`,
          zone: zoneFor(toneVsGoal(actOd, GOALS.actionsOverdue, true))
        }
      ];

      const chargeBody = document.createElement('div');
      chargeBody.className = 'kpi-perf-charge-body';
      chargeBody.append(
        createPilotageLoadMixChart(
          {
            criticalIncidents: critOpen,
            overdueActions: actOd,
            ncOpen
          },
          { compact: true }
        )
      );
      const auditsNote = document.createElement('p');
      auditsNote.className = 'kpi-perf-charge-audits';
      auditsNote.textContent = `Audits en base : ${counts.auditsTotal ?? 'Non disponible'}.`;

      const chargeCard = document.createElement('article');
      chargeCard.className = 'content-card card-soft kpi-perf-chart-card kpi-perf-chart-card--charge';
      const chHead = document.createElement('div');
      chHead.className = 'content-card-head';
      const chInner = document.createElement('div');
      const chk = document.createElement('div');
      chk.className = 'kpi-perf-dx-kicker';
      chk.textContent = 'Pression';
      const chh2 = document.createElement('h2');
      chh2.className = 'kpi-perf-h2 kpi-perf-h2--small';
      chh2.textContent = 'Charge critique';
      chInner.append(chk, chh2);
      chHead.append(chInner);
      chargeCard.append(chHead, chargeBody, auditsNote);

      const progCard = document.createElement('article');
      progCard.className = 'content-card card-soft kpi-perf-chart-card kpi-perf-chart-card--progress';
      const ph = document.createElement('div');
      ph.className = 'content-card-head';
      const phInner = document.createElement('div');
      const phk = document.createElement('div');
      phk.className = 'kpi-perf-dx-kicker';
      phk.textContent = 'Trajectoire';
      const phh2 = document.createElement('h2');
      phh2.className = 'kpi-perf-h2 kpi-perf-h2--small';
      phh2.textContent = 'Score audit par mois';
      phInner.append(phk, phh2);
      ph.append(phInner);
      progCard.append(ph, progressionChart);

      const chartsBand = document.createElement('div');
      chartsBand.className = 'kpi-perf-band kpi-perf-band--charts';
      const chartsBank = document.createElement('div');
      chartsBank.className = 'kpi-perf-charts-bank';
      chartsBank.append(
        elGoalVsRealCard(goalVsRows),
        chargeCard,
        progCard
      );
      chartsBand.append(chartsBank);

      loading.style.display = 'none';

      const tierStrat = document.createElement('section');
      tierStrat.className =
        'kpi-perf-main-grid kpi-grid dashboard-kpi-grid kpi-perf-main-grid--tier-strat';
      const tierOps = document.createElement('section');
      tierOps.className =
        'kpi-perf-main-grid kpi-grid dashboard-kpi-grid kpi-perf-main-grid--tier-ops';

      const dConf = prev ? formatDelta(prev.conformity, conformity) : 'Non disponible';
      const toneConf = toneVsGoal(conformity, GOALS.conformity);
      tierStrat.append(
        elKpiMain({
          title: 'Conformité globale',
          valueText: `${conformity} %`,
          deltaText: dConf,
          goalText: `${GOALS.conformity} %`,
          gapText: formatEcartVsObjectif(conformity, GOALS.conformity, false, 'pts'),
          tone: toneConf,
          statusTone: toneConf,
          kpiKey: 'conformity',
          insight: kpiBusinessInsight('conformity', toneConf),
          onOpenDetail: openPerfKpi
        })
      );

      const scoreDisp = auditAvg != null ? `${auditAvg} %` : 'Non disponible';
      const dScore =
        prev && auditAvg != null && prev.auditScore != null
          ? formatDelta(prev.auditScore, auditAvg)
          : 'Non disponible';
      const toneAud =
        auditAvg != null ? toneVsGoal(auditAvg, GOALS.auditScore) : 'blue';
      tierStrat.append(
        elKpiMain({
          title: 'Score audit moyen',
          valueText: scoreDisp,
          deltaText: dScore,
          goalText: `${GOALS.auditScore} %`,
          gapText:
            auditAvg != null
              ? formatEcartVsObjectif(auditAvg, GOALS.auditScore, false, 'pts')
              : 'Non disponible',
          tone: toneAud,
          statusTone: toneAud,
          kpiKey: 'auditScore',
          insight: kpiBusinessInsight('auditScore', toneAud),
          onOpenDetail: openPerfKpi
        })
      );

      const dCrit = prev ? formatDelta(prev.critOpen, critOpen) : 'Non disponible';
      const toneCrit = toneVsGoal(critOpen, 0, true);
      tierStrat.append(
        elKpiMain({
          title: 'Incidents critiques ouverts',
          valueText: String(critOpen),
          deltaText: dCrit,
          goalText: '0',
          gapText: formatEcartVsObjectif(critOpen, 0, true, ''),
          tone: toneCrit,
          statusTone: toneCrit,
          kpiKey: 'incidentsCritical',
          insight: kpiBusinessInsight('incidentsCritical', toneCrit),
          onOpenDetail: openPerfKpi
        })
      );

      const dNc =
        prev && closeRate != null && prev.ncCloseRate != null
          ? formatDelta(prev.ncCloseRate, closeRate)
          : 'Non disponible';
      const toneNc =
        closeRate != null ? toneVsGoal(closeRate, GOALS.ncTreatmentRate) : 'blue';
      tierOps.append(
        elKpiMain({
          title: 'Taux de traitement NC',
          valueText: closeRate != null ? `${closeRate} %` : 'Non disponible',
          deltaText: dNc,
          goalText: `${GOALS.ncTreatmentRate} %`,
          gapText:
            closeRate != null
              ? formatEcartVsObjectif(closeRate, GOALS.ncTreatmentRate, false, 'pts')
              : 'Non disponible',
          tone: toneNc,
          statusTone: toneNc,
          kpiKey: 'ncTreated',
          insight: kpiBusinessInsight('ncRate', toneNc),
          onOpenDetail: openPerfKpi
        })
      );

      const dActPct =
        prev && actOnTrackPct != null && prev.actOnTrackPct != null
          ? formatDelta(prev.actOnTrackPct, actOnTrackPct)
          : 'Non disponible';
      const toneExe =
        actOnTrackPct != null
          ? toneVsGoal(actOnTrackPct, GOALS.actionOnTrackPct)
          : 'blue';
      tierOps.append(
        elKpiMain({
          title: 'Respect des échéances',
          valueText: actOnTrackPct != null ? `${actOnTrackPct} %` : 'Non disponible',
          deltaText: dActPct,
          goalText: `${GOALS.actionOnTrackPct} %`,
          gapText:
            actOnTrackPct != null
              ? formatEcartVsObjectif(actOnTrackPct, GOALS.actionOnTrackPct, false, 'pts')
              : 'Non disponible',
          tone: toneExe,
          statusTone: toneExe,
          kpiKey: 'actionsOnTrack',
          insight: kpiBusinessInsight('execution', toneExe),
          onOpenDetail: openPerfKpi
        })
      );

      const dOd = prev ? formatDelta(prev.actionsOverdue, actOd) : 'Non disponible';
      const toneOd = toneVsGoal(actOd, GOALS.actionsOverdue, true);
      tierOps.append(
        elKpiMain({
          title: 'Actions en retard',
          valueText: String(actOd),
          deltaText: dOd,
          goalText: String(GOALS.actionsOverdue),
          gapText: formatEcartVsObjectif(actOd, GOALS.actionsOverdue, true, ''),
          tone: toneOd,
          statusTone: toneOd,
          kpiKey: 'actionsLate',
          insight: kpiBusinessInsight('actionsLate', toneOd),
          onOpenDetail: openPerfKpi
        })
      );

      const kpiBlock = document.createElement('div');
      kpiBlock.className = 'kpi-perf-kpi-block kpi-perf-kpi-block--muted';
      const kpiSk = document.createElement('p');
      kpiSk.className = 'kpi-perf-section-k';
      kpiSk.textContent = 'Indicateurs clés';
      kpiBlock.append(kpiSk, tierStrat, tierOps);

      const cockpitLevel = computeGlobalQhseCockpitLevel(conformity, counts, kpis, {
        conformity: GOALS.conformity
      });
      const recos = buildCockpitRecommendations(
        counts,
        kpis,
        conformity,
        GOALS.conformity,
        GOALS.auditScore
      );
      const recoSection = createRecommendationsSection(recos, openPerfKpi, {
        assistant: true,
        title: 'Assistant QHSE',
        subtitle: 'Jusqu’à 3 actions suggérées, cliquer pour traiter'
      });
      const globalScoreSection = createGlobalScoreSection(cockpitLevel, () =>
        openPerfKpi('conformity')
      );
      const topPriority = computeAbsolutePriority(
        counts,
        kpis,
        conformity,
        GOALS.conformity,
        GOALS.auditScore
      );
      const prioritySection = createAbsolutePrioritySection(topPriority, openPerfKpi);
      const primaryCtaBar = createPrimaryCtaBar({
        navigateHash,
        openKpi: openPerfKpi,
        critOpen,
        actOd,
        ncOpen
      });
      const freshnessIndicator = createCockpitFreshnessIndicator(new Date());
      const timelineEntries = buildActivityTimelineEntries(
        incidents,
        actions,
        audits,
        ncs,
        12
      );
      const timelineSection = createTimelineSection(timelineEntries, openPerfKpi);

      const cockpitPremium = document.createElement('div');
      cockpitPremium.className = 'kpi-perf-cockpit-premium';
      cockpitPremium.append(
        prioritySection,
        primaryCtaBar,
        freshnessIndicator,
        globalScoreSection,
        recoSection
      );

      const hero = elPerfCockpitHero(conformity, prev, counts, kpis, () =>
        openPerfKpi('conformity')
      );
      const heroSurface = document.createElement('div');
      heroSurface.className = 'kpi-perf-hero-surface';
      heroSurface.append(hero);
      const gapGroups = classifyGapGroups(gapMetrics);
      const nBelow = gapMetrics.filter((m) => m.zone === 'below').length;
      const nWatch = gapMetrics.filter((m) => m.zone === 'watch').length;
      const nOk = gapMetrics.filter((m) => m.zone === 'ok').length;
      const gapsCard = elGapsCard(
        gapGroups,
        `${nBelow} sous cible · ${nWatch} à surveiller · ${nOk} à la cible`
      );
      const prioritiesCard = elPrioritiesCard(
        buildPilotagePrioritiesStructured(counts, kpis),
        openPerfKpi
      );

      const alerts = Array.isArray(summary.priorityAlerts)
        ? summary.priorityAlerts.slice(0, 3)
        : [];
      const alertWrap = document.createElement('div');
      alertWrap.className = 'kpi-perf-alerts-wrap';
      const det = document.createElement('details');
      det.className = 'kpi-perf-alerts-details';
      det.open = alerts.some((a) => a.level === 'critical' || a.level === 'high');
      const sum = document.createElement('summary');
      sum.className = 'kpi-perf-alerts-summary';
      sum.textContent =
        alerts.length === 0
          ? 'Alertes automatiques : aucune'
          : `Alertes automatiques (${alerts.length})`;
      det.append(sum);
      const alStack = document.createElement('div');
      alStack.className = 'stack kpi-perf-alerts-stack';
      if (alerts.length === 0) {
        const p = document.createElement('p');
        p.className = 'kpi-perf-muted';
        p.textContent = 'Aucune alerte moteur.';
        alStack.append(p);
      } else {
        alerts.forEach((a) => {
          const row = document.createElement('button');
          row.type = 'button';
          const level =
            a.level === 'critical' ? 'critical' : a.level === 'high' ? 'high' : 'info';
          row.className = `kpi-perf-alert kpi-perf-alert--${level}`;
          const ico = document.createElement('span');
          ico.className = 'kpi-perf-alert__ico';
          ico.setAttribute('aria-hidden', 'true');
          ico.textContent = level === 'critical' ? '⚠' : level === 'high' ? '◆' : 'ⓘ';
          const msg = document.createElement('span');
          msg.className = 'kpi-perf-alert__msg';
          msg.textContent = a.message || a.code || 'Non disponible';
          row.append(ico, msg);
          row.addEventListener('click', () => {
            if (level === 'critical') {
              openPerfKpi('incidentsCritical', { severity: 'critique' });
            } else if (level === 'high') {
              openPerfKpi('actionsLate');
            } else {
              openPerfKpi('conformity');
            }
          });
          alStack.append(row);
        });
      }
      const ana = document.createElement('button');
      ana.type = 'button';
      ana.className = 'btn btn-secondary kpi-perf-link-analytics';
      ana.textContent = 'Ouvrir Analyses / Synthèse';
      ana.addEventListener('click', () => navigateHash('analytics'));
      alStack.append(ana);
      det.append(alStack);
      alertWrap.append(det);

      const pilotageRow = document.createElement('div');
      pilotageRow.className = 'kpi-perf-pilotage-row kpi-perf-pilotage-row--muted';
      pilotageRow.append(gapsCard, prioritiesCard);

      const foot = document.createElement('p');
      foot.className = 'kpi-perf-foot';
      const nInc = Array.isArray(incidents) ? incidents.length : 0;
      const nAud = Array.isArray(audits) ? audits.length : 0;
      foot.textContent = `KPI cliquables → détail filtrable (recherche, tri, ➕). Tendance = dernière visite. Données : ${nInc} incidents · ${actions.length} actions · ${nAud} audits · ${ncs.length} NC. Objectifs = repères locaux.`;

      const analysesStack = document.createElement('div');
      analysesStack.className = 'kpi-perf-analyses-stack';
      analysesStack.append(heroSurface, kpiBlock, pilotageRow, chartsBand);

      content.append(cockpitPremium, timelineSection, analysesStack, alertWrap, foot);

      const siteLabel =
        siteSel.selectedOptions[0]?.textContent?.trim() || 'Vue groupe (tous sites)';
      lastPerfPdfContext = {
        periodMonths: months,
        siteLabel,
        conformity,
        counts,
        kpis,
        auditLineSeries: lineSeries,
        goalRows: goalVsRows.map((r) => ({
          label: r.label,
          realText: r.realText,
          goalText: r.goalText
        }))
      };

      writeSnapshot(months, {
        conformity,
        actionsOverdue: actOd,
        incidents30: inc30,
        auditScore: auditAvg != null ? auditAvg : null,
        ncCloseRate: closeRate != null ? closeRate : null,
        actOnTrackPct: actOnTrackPct != null ? actOnTrackPct : null,
        critOpen
      });
    } catch (err) {
      console.error('[performance]', err);
      loading.textContent = 'Impossible de charger les KPI.';
      showToast('Erreur chargement Performance QHSE', 'error');
    } finally {
      await tfTgPromise.catch(() => {});
    }
  };

  reload();

  return page;
}
