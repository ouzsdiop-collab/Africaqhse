import { siteOptions, pageTopbarById } from '../data/navigation.js';
import { appState } from '../utils/state.js';
import { showToast } from '../components/toast.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { ensureDashboardStyles } from '../components/dashboardStyles.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { setupIncidentDeclareFlow } from '../components/incidentFormDialog.js';
import {
  mountIncidentDetailEmpty,
  mountIncidentDetailPanel
} from '../components/incidentDetailPanel.js';
import { openIncidentAiAnalysis as openIncidentAiAnalysisPanel } from '../components/incidentAiAnalysisPanel.js';
import { createSimpleModeGuide } from '../utils/simpleModeGuide.js';
import { mountPageViewModeSwitch } from '../utils/pageViewMode.js';
import {
  ensureUsersCached,
  getCachedUsersForActionsList,
  createLinkedAction
} from '../utils/incidentsActions.js';
import { mapApiIncident as mapApiIncidentBase, mapRowToDisplay } from '../utils/incidentsMappers.js';
import {
  refreshIncidentsAnalytics,
  refreshIncidentsJournalDom,
  refreshIncidentsPrioritiesStrip,
  buildIncidentTableRow
} from '../components/incidentsConsultationPanels.js';
import { createSkeletonCard, createEmptyState } from '../utils/designSystem.js';
import { isOnline } from '../utils/networkStatus.js';
/* Intent filtre depuis le tableau de bord — clé partagée dans dashboardNavigationIntent.js */
import { consumeDashboardIntent } from '../utils/dashboardNavigationIntent.js';

const LIST_SUB_DEFAULT =
  'Tri : criticité puis date. Clic ligne ou « Ouvrir » → détail à droite.';

const LS_INCIDENTS_TABLE_COLS = 'qhse.incidents.tableCols';

function readIncidentsTableColumnMode() {
  try {
    const v = localStorage.getItem(LS_INCIDENTS_TABLE_COLS);
    return v === 'full' ? 'full' : 'essential';
  } catch {
    return 'essential';
  }
}

const INCIDENTS_STATES_STYLE_ID = 'qhse-incidents-states-styles';

function ensureIncidentsStatesStyles() {
  if (document.getElementById(INCIDENTS_STATES_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = INCIDENTS_STATES_STYLE_ID;
  el.textContent = `
.incidents-list-host .incidents-empty{
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  gap:8px;padding:36px 20px;text-align:center;
}
.incidents-list-host .incidents-empty__title{
  margin:0;font-size:15px;font-weight:600;
  color:var(--text,rgba(255,255,255,.88));
}
.incidents-list-host .incidents-empty__sub{
  margin:0;font-size:13px;line-height:1.5;
  color:var(--text2,rgba(255,255,255,.5));
  max-width:34ch;
}
.incidents-list-host .incidents-empty__cta{margin-top:6px;}
`;
  document.head.append(el);
}

let incidentRecords = [];

function mapApiIncident(row) {
  const m = mapApiIncidentBase(row);
  if (!m) return null;
  const id = typeof row.id === 'string' ? row.id : row.id != null ? String(row.id) : '';
  return { ...m, id };
}

const INCIDENTS_LIST_CACHE_KEY = 'qhse.cache.incidents.list.v1';

function readIncidentsListCache() {
  try {
    const raw = localStorage.getItem(INCIDENTS_LIST_CACHE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (!j || !Array.isArray(j.rows)) return null;
    return j.rows;
  } catch {
    return null;
  }
}

function saveIncidentsListCache(rows) {
  try {
    localStorage.setItem(
      INCIDENTS_LIST_CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), rows })
    );
  } catch {
    /* ignore */
  }
}

function severityOrder(sev) {
  if (sev === 'critique') return 0;
  if (sev === 'moyen') return 1;
  if (sev === 'faible') return 2;
  return 3;
}

function sortIncidentsForDisplay(list) {
  return [...list].sort((a, b) => {
    const da = severityOrder(a.severity);
    const db = severityOrder(b.severity);
    if (da !== db) return da - db;
    return (b.createdAtMs || 0) - (a.createdAtMs || 0);
  });
}

function isStatusClosed(st) {
  return /clos|ferm|termin|clôtur|résolu|resolu|done|complete/i.test(String(st));
}

function countCriticalOpenIncidents(list) {
  return list.filter((i) => i.severity === 'critique' && !isStatusClosed(i.status)).length;
}

function countInvestigationOpenIncidents(list) {
  return list.filter((i) => {
    if (isStatusClosed(i.status)) return false;
    const s = String(i.status || '').toLowerCase();
    return s.includes('investigation') || s.includes('investig');
  }).length;
}

function computeIncidentsInsight(list) {
  if (!list.length) return '';
  const bySite = {};
  for (const i of list) {
    const s = i.site || '—';
    bySite[s] = (bySite[s] || 0) + 1;
  }
  const sorted = Object.entries(bySite).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  if (!top) return '';
  const [topSite, n] = top;
  const total = list.length;
  if (n >= 2 && total >= 4 && n / total >= 0.35) {
    return `Fort volume sur le site « ${topSite} » (${n} incidents) — prioriser la veille terrain.`;
  }
  const weekAgo = Date.now() - 7 * 86400000;
  const recent = list.filter((i) => (i.createdAtMs || 0) >= weekAgo).length;
  if (recent >= 3) {
    return `${recent} incident(s) sur les 7 derniers jours — rythme à surveiller.`;
  }
  return '';
}

function countIncidentsLastDays(list, days) {
  const d = Math.max(1, Number(days) || 7);
  const cut = Date.now() - d * 86400000;
  return list.filter((i) => (i.createdAtMs || 0) >= cut).length;
}

/** Âge moyen (jours) des dossiers encore ouverts — proxy sans date de clôture en base. */
function computeMeanOpenDays(list) {
  const open = list.filter((i) => !isStatusClosed(i.status));
  if (!open.length) return null;
  const sum = open.reduce((acc, i) => {
    const t = i.createdAtMs || Date.now();
    return acc + (Date.now() - t) / 86400000;
  }, 0);
  return Math.round((sum / open.length) * 10) / 10;
}

function attachMistralIncidentCausesButton(detailRoot, incident) {
  detailRoot.querySelectorAll('[data-qhse-mistral-incident]').forEach((el) => el.remove());
  const host = document.createElement('div');
  host.setAttribute('data-qhse-mistral-incident', '1');
  host.style.marginTop = '12px';

  const aiBtn = document.createElement('button');
  aiBtn.type = 'button';
  aiBtn.textContent = 'Analyser avec IA';
  aiBtn.className = 'btn btn-primary btn-sm';
  aiBtn.style.marginTop = '12px';

  let aiLoading = false;
  aiBtn.addEventListener('click', async () => {
    if (aiLoading) return;
    aiLoading = true;
    aiBtn.textContent = 'Analyse en cours...';
    aiBtn.disabled = true;
    try {
      const res = await qhseFetch('/api/ai/incident-causes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incident)
      });
      if (!res.ok) throw new Error('api');
      const { suggestion } = await res.json();
      const box = document.createElement('div');
      box.style.cssText =
        'margin-top:12px;padding:16px;background:var(--surface-2,#eff6ff);border-left:3px solid var(--color-primary,#3b82f6);border-radius:8px;font-size:13px;line-height:1.6;color:var(--text-primary,#1e293b);white-space:pre-wrap';
      box.textContent = suggestion;
      aiBtn.parentNode.insertBefore(box, aiBtn.nextSibling);
      aiBtn.style.display = 'none';
    } catch {
      aiBtn.textContent = 'Erreur — Reessayer';
      aiBtn.disabled = false;
      aiLoading = false;
    }
  });

  host.append(aiBtn);
  detailRoot.append(host);
}

export function renderIncidents(onAddLog) {
  ensureDashboardStyles();
  /* Évite liste / compteurs obsolètes quand on revient sur la page (variable module). */
  incidentRecords = [];

  const page = document.createElement('section');
  page.className = 'page-stack page-stack--premium-saas incidents-page incidents-page--premium';

  const { bar: incidentsPageViewBar } = mountPageViewModeSwitch({
    pageId: 'incidents',
    pageRoot: page,
    hintEssential:
      'Essentiel : en-tête, déclaration, priorités et registre — analytics, journal et blocs avancés masqués.',
    hintAdvanced:
      'Expert : tuiles synthèse, tendances, journal local et options étendues du registre.'
  });

  if (!isOnline()) {
    const banner = document.createElement('div');
    banner.style.cssText =
      'background:#f59e0b22;border:1px solid #f59e0b;border-radius:8px;padding:10px 16px;margin-bottom:16px;color:#f59e0b;font-size:13px;font-weight:600';
    banner.textContent = 'Mode hors connexion — affichage des dernieres donnees en cache';
    page.prepend(banner);
  }

  const offlineCacheBanner = document.createElement('p');
  offlineCacheBanner.className = 'content-card card-soft qhse-offline-cache-banner';
  offlineCacheBanner.dataset.qhseOfflineCacheBanner = '';
  offlineCacheBanner.hidden = true;
  offlineCacheBanner.setAttribute('role', 'status');
  offlineCacheBanner.style.cssText =
    'margin:0 0 14px;padding:12px 16px;font-weight:600;font-size:14px;border:1px solid var(--color-border-info, #38bdf8);';
  offlineCacheBanner.textContent = '📡 Mode hors connexion — données en cache';

  let panelFilterStatus = 'all';
  let filterDateRange = 'all';
  let filterSeverity = '';
  let filterStatus = '';
  let filterSite = '';
  let filterText = '';
  let incidentsTableColumnMode = readIncidentsTableColumnMode();
  const dashboardIntent = consumeDashboardIntent();

  function renderFilteredList() {
    refreshList();
  }

  let selectedRef = null;

  const siteLabel = appState.currentSite || 'Tous sites';

  const pageIntro = document.createElement('header');
  pageIntro.className = 'incidents-page-header incidents-page-header--intro';

  const introTitles = document.createElement('div');
  introTitles.className = 'incidents-page-header__titles';
  const incMeta = pageTopbarById.incidents ?? {
    kicker: 'Opérations',
    title: 'Incidents terrain',
    subtitle: 'Suivi des événements, investigations et plans de correction.'
  };
  const kicker = document.createElement('div');
  kicker.className = 'section-kicker incidents-page-header__kicker';
  kicker.textContent = `${incMeta.kicker} · ${siteLabel}`;
  const hTitle = document.createElement('h1');
  hTitle.className = 'incidents-page-header__title';
  hTitle.textContent = incMeta.title;
  const subTitle = document.createElement('p');
  subTitle.className = 'incidents-page-header__subtitle';
  subTitle.textContent = incMeta.subtitle;
  introTitles.append(kicker, hTitle, subTitle);
  pageIntro.append(introTitles);

  const pilotageBlock = document.createElement('section');
  pilotageBlock.className = 'incidents-pilotage-block qhse-page-advanced-only';
  pilotageBlock.setAttribute('aria-labelledby', 'incidents-pilotage-heading');

  const pilotageHead = document.createElement('div');
  pilotageHead.className = 'incidents-pilotage-block__head';
  const pilotageKicker = document.createElement('div');
  pilotageKicker.className = 'incidents-section-kicker';
  pilotageKicker.textContent = 'Pilotage';
  const pilotageTitle = document.createElement('h2');
  pilotageTitle.id = 'incidents-pilotage-heading';
  pilotageTitle.className = 'incidents-pilotage-block__title';
  pilotageTitle.textContent = 'Vue opérationnelle';
  const pilotageLead = document.createElement('p');
  pilotageLead.className = 'incidents-pilotage-block__lead';
  pilotageLead.textContent =
    'Indicateurs calculés sur le périmètre chargé — pour le détail, utilisez le registre ci-dessous.';
  pilotageHead.append(pilotageKicker, pilotageTitle, pilotageLead);

  const statsRow = document.createElement('div');
  statsRow.className = 'incidents-pilotage-block__stats incidents-synth';
  function makeSynthTile(label, extraClass = '', titleHint = '') {
    const box = document.createElement('div');
    box.className = `incidents-synth-tile ${extraClass}`.trim();
    if (titleHint) box.title = titleHint;
    const lb = document.createElement('div');
    lb.className = 'incidents-synth-tile__label';
    lb.textContent = label;
    const val = document.createElement('div');
    val.className = 'incidents-synth-tile__value';
    val.textContent = '—';
    box.append(lb, val);
    return { box, val };
  }
  const stTotal = makeSynthTile(
    'Total incidents',
    '',
    'Nombre de fiches chargées sur le périmètre courant'
  );
  const stCrit = makeSynthTile(
    'Critiques ouverts',
    'incidents-synth-tile--alert',
    'Gravité critique et statut encore ouvert'
  );
  const stRecent = makeSynthTile(
    'Récents (7 j.)',
    '',
    'Nouvelles déclarations sur les 7 derniers jours'
  );
  const stInv = makeSynthTile(
    'En investigation',
    '',
    'Dossiers ouverts dont le statut indique une investigation en cours'
  );
  const stMean = makeSynthTile(
    'Délai moyen traitement (j)',
    '',
    'Proxy : ancienneté moyenne des dossiers encore ouverts (pas de date de clôture serveur)'
  );
  statsRow.append(stTotal.box, stCrit.box, stRecent.box, stInv.box, stMean.box);

  const insightBar = document.createElement('div');
  insightBar.className = 'incidents-insight incidents-pilotage-block__insight';
  insightBar.setAttribute('role', 'status');
  insightBar.hidden = true;

  pilotageBlock.append(pilotageHead, statsRow, insightBar);

  const quickActionsCard = document.createElement('article');
  quickActionsCard.className =
    'content-card card-soft incidents-premium-card incidents-quick-actions-card incidents-terrain-card';
  const quickActionsInner = document.createElement('div');
  quickActionsInner.className = 'incidents-quick-actions-card__inner';
  const quickActionsCopy = document.createElement('div');
  quickActionsCopy.className = 'incidents-quick-actions-card__copy';
  const qaKicker = document.createElement('div');
  qaKicker.className = 'incidents-section-kicker';
  qaKicker.textContent = 'Action';
  const qaTitle = document.createElement('h2');
  qaTitle.className = 'incidents-quick-actions-card__title';
  qaTitle.textContent = 'Déclaration & raccourcis';
  const qaLead = document.createElement('p');
  qaLead.className = 'incidents-quick-actions-card__lead';
  qaLead.textContent =
    'Ouvrez l’assistant guidé pour une déclaration structurée. Le registre en dessous sert à la consultation.';
  quickActionsCopy.append(qaKicker, qaTitle, qaLead);
  const quickActionsBtns = document.createElement('div');
  quickActionsBtns.className = 'incidents-quick-actions-card__buttons';
  const btnDeclare = document.createElement('button');
  btnDeclare.type = 'button';
  btnDeclare.className = 'btn btn-primary incidents-page-header__cta incidents-terrain-cta-main';
  btnDeclare.textContent = 'Déclarer un incident';
  const btnTerrain = document.createElement('button');
  btnTerrain.type = 'button';
  btnTerrain.className = 'btn btn-secondary incidents-quick-actions-card__terrain incidents-terrain-cta-sub';
  btnTerrain.textContent = 'Déclaration rapide';
  btnTerrain.title = 'Assistant condensé, gros boutons — idéal mobile ou saisie express';
  const btnDash = document.createElement('button');
  btnDash.type = 'button';
  btnDash.className = 'incidents-page-header__linkish';
  btnDash.textContent = 'Tableau de bord';
  btnDash.addEventListener('click', () => {
    window.location.hash = 'dashboard';
  });
  quickActionsBtns.append(btnDeclare, btnTerrain, btnDash);
  quickActionsInner.append(quickActionsCopy, quickActionsBtns);
  quickActionsCard.append(quickActionsInner);

  const prioritiesCard = document.createElement('article');
  prioritiesCard.className =
    'content-card card-soft incidents-premium-card incidents-priorities-card';
  const prioritiesHead = document.createElement('div');
  prioritiesHead.className = 'incidents-priorities-card__head';
  prioritiesHead.innerHTML = `
    <div>
      <div class="incidents-section-kicker">Lecture rapide</div>
      <h2 class="incidents-priorities-card__title">Priorités</h2>
      <p class="incidents-priorities-card__lead">Aperçu des fiches à traiter en premier — cliquez pour ouvrir le détail.</p>
    </div>`;
  const prioritiesHost = document.createElement('div');
  prioritiesHost.className = 'incidents-priorities-card__host';
  prioritiesCard.append(prioritiesHead, prioritiesHost);

  function filterIncidents(list) {
    return list.filter((inc) => {
      const q = filterText.trim().toLowerCase();
      if (q) {
        const hay = `${inc.ref || ''} ${inc.title || ''} ${inc.type || ''} ${inc.site || ''} ${inc.status || ''} ${inc.description || ''}`
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterSeverity && inc.severity !== filterSeverity) return false;
      if (filterStatus && String(inc.status || '').trim() !== filterStatus) {
        return false;
      }
      if (filterSite && String(inc.site || '').trim() !== filterSite) {
        return false;
      }
      if (panelFilterStatus === 'all') return true;
      const st = String(inc.status).toLowerCase();
      if (panelFilterStatus === 'nouveau') {
        return st.includes('nouveau') || st.includes('new');
      }
      if (panelFilterStatus === 'clos') {
        return isStatusClosed(st);
      }
      return true;
    });
  }

  function getFilteredSortedRows() {
    let rows = filterIncidents(incidentRecords);
    if (filterDateRange !== 'all') {
      const days = parseInt(filterDateRange, 10);
      const cutoff = Date.now() - days * 86400000;
      rows = rows.filter((inc) => {
        const t = inc.createdAtMs;
        return Number.isFinite(t) && t >= cutoff;
      });
    }
    return sortIncidentsForDisplay(rows);
  }

  function incidentsFiltersSummaryForPdf() {
    const parts = [];
    if (filterText.trim()) parts.push(`Recherche : « ${filterText.trim()} »`);
    if (filterSeverity) parts.push(`Gravité : ${filterSeverity}`);
    if (filterStatus) parts.push(`Statut : ${filterStatus}`);
    if (filterSite) parts.push(`Site : ${filterSite}`);
    if (filterDateRange !== 'all') parts.push(`Fenêtre : ${filterDateRange} derniers jours`);
    return parts.length ? parts.join(' · ') : 'Registre filtré — vue liste affichée';
  }

  function updateHeaderStats() {
    const dash = '—';
    if (apiLoadState === 'loading' || apiLoadState === 'error') {
      stTotal.val.textContent = dash;
      stCrit.val.textContent = dash;
      stRecent.val.textContent = dash;
      stInv.val.textContent = dash;
      stMean.val.textContent = dash;
      insightBar.hidden = true;
      return;
    }
    stTotal.val.textContent = String(incidentRecords.length);
    stCrit.val.textContent = String(countCriticalOpenIncidents(incidentRecords));
    stRecent.val.textContent = String(countIncidentsLastDays(incidentRecords, 7));
    stInv.val.textContent = String(countInvestigationOpenIncidents(incidentRecords));
    const mean = computeMeanOpenDays(incidentRecords);
    stMean.val.textContent = mean != null ? String(mean) : '—';
    const insight = computeIncidentsInsight(incidentRecords);
    if (insight) {
      insightBar.textContent = insight;
      insightBar.hidden = false;
    } else {
      insightBar.hidden = true;
    }
  }

  const compactFilters = document.createElement('div');
  compactFilters.className = 'incidents-compact-filters';

  const filterStrip = document.createElement('div');
  filterStrip.className = 'qhse-filter-strip';

  const primaryRow = document.createElement('div');
  primaryRow.className = 'qhse-filter-strip__primary';

  const searchLab = document.createElement('label');
  searchLab.className = 'qhse-filter-search';
  const searchLabSpan = document.createElement('span');
  searchLabSpan.textContent = 'Recherche';
  const searchInp = document.createElement('input');
  searchInp.type = 'search';
  searchInp.className = 'control-input';
  searchInp.placeholder = 'Réf., titre, type, site…';
  searchInp.setAttribute('aria-label', 'Filtrer le registre incidents');
  searchInp.autocomplete = 'off';
  searchInp.addEventListener('input', () => {
    filterText = searchInp.value;
    renderFilteredList();
  });
  searchLab.append(searchLabSpan, searchInp);

  const statusLab = document.createElement('label');
  const statusLabSpan = document.createElement('span');
  statusLabSpan.textContent = 'Vue statut';
  const statusSel = document.createElement('select');
  statusSel.className = 'control-select';
  [
    ['all', 'Tous'],
    ['nouveau', 'Nouveau'],
    ['clos', 'Clos / terminé']
  ].forEach(([v, t]) => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = t;
    statusSel.append(o);
  });
  statusSel.addEventListener('change', () => {
    panelFilterStatus = statusSel.value;
    refreshList();
  });
  statusLab.append(statusLabSpan, statusSel);

  const dateLab = document.createElement('label');
  const dateLabSpan = document.createElement('span');
  dateLabSpan.textContent = 'Période';
  const dateSel = document.createElement('select');
  dateSel.className = 'control-select';
  [
    ['all', 'Toutes'],
    ['7', '7 derniers jours'],
    ['30', '30 derniers jours']
  ].forEach(([v, t]) => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = t;
    dateSel.append(o);
  });
  dateSel.addEventListener('change', () => {
    filterDateRange = dateSel.value;
    refreshList();
  });
  dateLab.append(dateLabSpan, dateSel);

  const filSevLab = document.createElement('label');
  const filSevLabSpan = document.createElement('span');
  filSevLabSpan.textContent = 'Gravité';
  const filSevSel = document.createElement('select');
  filSevSel.className = 'control-select incidents-filter-severity';
  [
    ['', 'Toutes gravités'],
    ['critique', 'Critique'],
    ['moyen', 'Moyen'],
    ['faible', 'Faible']
  ].forEach(([v, t]) => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = t;
    filSevSel.append(o);
  });
  filSevSel.addEventListener('change', () => {
    filterSeverity = filSevSel.value;
    renderFilteredList();
  });
  filSevLab.append(filSevLabSpan, filSevSel);

  const filStLab = document.createElement('label');
  const filStLabSpan = document.createElement('span');
  filStLabSpan.textContent = 'Statut';
  const filStSel = document.createElement('select');
  filStSel.className = 'control-select incidents-filter-status';
  [
    ['', 'Tous statuts'],
    ['Nouveau', 'Nouveau'],
    ['En cours', 'En cours'],
    ['Investigation', 'Investigation'],
    ['Clôturé', 'Clôturé']
  ].forEach(([v, t]) => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = t;
    filStSel.append(o);
  });
  filStSel.addEventListener('change', () => {
    filterStatus = filStSel.value;
    renderFilteredList();
  });
  filStLab.append(filStLabSpan, filStSel);

  const filSiteLab = document.createElement('label');
  const filSiteLabSpan = document.createElement('span');
  filSiteLabSpan.textContent = 'Site';
  const filSiteSel = document.createElement('select');
  filSiteSel.className = 'control-select incidents-filter-site';
  const optSiteAll = document.createElement('option');
  optSiteAll.value = '';
  optSiteAll.textContent = 'Tous les sites';
  filSiteSel.append(optSiteAll);
  filSiteSel.addEventListener('change', () => {
    filterSite = filSiteSel.value;
    renderFilteredList();
  });
  filSiteLab.append(filSiteLabSpan, filSiteSel);

  if (dashboardIntent?.source === 'dashboard' && dashboardIntent?.chart === 'incidents_trend') {
    filterDateRange = '30';
    dateSel.value = '30';
    showToast('Filtre auto Dashboard appliqué : incidents récents (30 jours).', 'info');
  }

  const exportBtnInc = document.createElement('button');
  exportBtnInc.type = 'button';
  exportBtnInc.textContent = 'Export CSV';
  exportBtnInc.className = 'btn btn-secondary btn-sm';
  exportBtnInc.setAttribute('aria-label', 'Exporter le registre incidents');
  exportBtnInc.addEventListener('click', async () => {
    try {
      const res = await qhseFetch(withSiteQuery('/api/export/incidents'));
      if (!res.ok) {
        showToast('Export impossible', 'error');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'incidents-export.csv';
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Erreur réseau', 'error');
    }
  });

  const exportBtnPdf = document.createElement('button');
  exportBtnPdf.type = 'button';
  exportBtnPdf.textContent = 'Export PDF';
  exportBtnPdf.className = 'btn btn-secondary btn-sm';
  exportBtnPdf.setAttribute('aria-label', 'Exporter le registre incidents en PDF');
  exportBtnPdf.addEventListener('click', async () => {
    try {
      const { downloadIncidentsRegisterPdf } = await import('../services/qhseReportsPdf.service.js');
      await downloadIncidentsRegisterPdf(getFilteredSortedRows(), {
        filtersSummary: incidentsFiltersSummaryForPdf()
      });
    } catch (e) {
      console.error(e);
    }
  });

  const exportWrap = document.createElement('div');
  exportWrap.className = 'incidents-filter-export-slot';
  exportWrap.append(exportBtnInc, exportBtnPdf);

  primaryRow.append(searchLab, statusLab, dateLab, exportWrap);

  const advDetails = document.createElement('details');
  advDetails.className = 'qhse-filter-advanced';
  const advSummary = document.createElement('summary');
  advSummary.className = 'qhse-filter-advanced__summary';
  advSummary.textContent = 'Filtres précis (gravité, statut catalogue, site)';
  const advBody = document.createElement('div');
  advBody.className = 'qhse-filter-advanced__body';
  advBody.append(filSevLab, filStLab, filSiteLab);
  advDetails.append(advSummary, advBody);

  filterStrip.append(primaryRow, advDetails);
  compactFilters.append(filterStrip);

  let slideOver;
  let quick;

  const split = document.createElement('div');
  split.className = 'incidents-split incidents-split--register-stacked';

  const listCol = document.createElement('div');
  listCol.className =
    'incidents-split__list incidents-split__list--consult content-card card-soft incidents-premium-card';
  listCol.id = 'incidents-recent-list';

  const listColHead = document.createElement('div');
  listColHead.className = 'incidents-split-list-head';
  const listTitleRow = document.createElement('div');
  listTitleRow.className = 'incidents-split-list-head__row';
  const listHeading = document.createElement('h2');
  listHeading.className = 'incidents-list-heading';
  listHeading.textContent = 'Consultation — registre';
  const listCount = document.createElement('span');
  listCount.className = 'incidents-list-count';
  listTitleRow.append(listHeading, listCount);
  const listLead = document.createElement('p');
  listLead.className = 'incidents-registry-lead';
  listLead.textContent = LIST_SUB_DEFAULT;

  const tableToolbar = document.createElement('div');
  tableToolbar.className = 'qhse-table-toolbar';
  const tableToolbarMeta = document.createElement('span');
  tableToolbarMeta.className = 'qhse-table-toolbar__meta';
  tableToolbarMeta.textContent =
    'Vue par défaut : colonnes Incident, Statut, Date et actions — gravité et site regroupés sous le titre.';
  const tableToolbarActions = document.createElement('div');
  tableToolbarActions.className = 'qhse-table-toolbar__actions';
  const colToggleBtn = document.createElement('button');
  colToggleBtn.type = 'button';
  colToggleBtn.className = 'btn btn-secondary btn-sm';
  colToggleBtn.setAttribute(
    'aria-pressed',
    incidentsTableColumnMode === 'full' ? 'true' : 'false'
  );
  colToggleBtn.textContent =
    incidentsTableColumnMode === 'full' ? 'Vue compacte' : 'Colonnes complètes';
  colToggleBtn.title = 'Afficher gravité et site en colonnes dédiées (export visuel complet)';
  colToggleBtn.addEventListener('click', () => {
    incidentsTableColumnMode = incidentsTableColumnMode === 'full' ? 'essential' : 'full';
    try {
      localStorage.setItem(LS_INCIDENTS_TABLE_COLS, incidentsTableColumnMode);
    } catch {
      /* ignore */
    }
    colToggleBtn.setAttribute(
      'aria-pressed',
      incidentsTableColumnMode === 'full' ? 'true' : 'false'
    );
    colToggleBtn.textContent =
      incidentsTableColumnMode === 'full' ? 'Vue compacte' : 'Colonnes complètes';
    refreshList();
  });
  tableToolbarActions.append(colToggleBtn);
  tableToolbar.append(tableToolbarMeta, tableToolbarActions);

  listColHead.append(listTitleRow, listLead, tableToolbar);

  const listHost = document.createElement('div');
  listHost.className = 'incidents-list-host';

  ensureIncidentsStatesStyles();

  listCol.append(listColHead, listHost);

  const detailCol = document.createElement('aside');
  detailCol.className = 'incidents-split__detail content-card card-soft incidents-premium-card';
  detailCol.setAttribute('aria-label', 'Détail incident');

  const detailInner = document.createElement('div');
  detailInner.className = 'incidents-detail-panel';
  detailCol.append(detailInner);

  split.append(listCol, detailCol);

  let apiLoadState = 'loading';

  const canWriteIncidents = canResource(getSessionUser()?.role, 'incidents', 'write');
  const canWriteActions = canResource(getSessionUser()?.role, 'actions', 'write');
  const canUseAiSuggest = canResource(getSessionUser()?.role, 'ai_suggestions', 'write');

  function incidentByRef(ref) {
    const key = String(ref ?? '').trim();
    if (!key) return undefined;
    return incidentRecords.find((r) => String(r.ref ?? '').trim() === key);
  }

  /** Registre : délégation — composedPath + comparaison ref en string (API peut envoyer nombre). */
  listHost.addEventListener('click', (e) => {
    const path = typeof e.composedPath === 'function' ? e.composedPath() : [];

    let actionBtn = null;
    for (const n of path) {
      if (n === listHost) break;
      if (n instanceof Element && n.hasAttribute('data-incident-action')) {
        actionBtn = n;
        break;
      }
    }

    if (actionBtn) {
      e.preventDefault();
      e.stopPropagation();
      const ref = actionBtn.dataset.incidentRef;
      const action = actionBtn.dataset.incidentAction;
      const raw = incidentByRef(ref);
      if (!raw) return;
      if (action === 'open-detail') {
        activateIncidentRow(raw);
      } else if (action === 'create-linked-action' && canWriteActions) {
        void createLinkedAction(raw);
      }
      return;
    }

    let row = null;
    for (const n of path) {
      if (n === listHost) break;
      if (n instanceof Element && n.matches?.('tr.incidents-table-row')) {
        row = n;
        break;
      }
    }
    if (!row) return;
    const rowIdx = path.indexOf(row);
    for (let i = 0; i < rowIdx; i++) {
      const n = path[i];
      if (n instanceof Element && n.matches?.('button, a, input, select, textarea, label')) {
        return;
      }
    }
    const raw = incidentByRef(row.dataset.ref);
    if (raw) activateIncidentRow(raw);
  });

  listHost.addEventListener('keydown', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const row = t.closest('tr.incidents-table-row');
    if (!row || t !== row) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    const raw = incidentByRef(row.dataset.ref);
    if (raw) activateIncidentRow(raw);
  });

  const analyticsCard = document.createElement('article');
  analyticsCard.className =
    'content-card card-soft incidents-premium-card incidents-analytics-card';
  const analyticsHead = document.createElement('div');
  analyticsHead.className = 'content-card-head';
  analyticsHead.innerHTML = `
    <div>
      <div class="section-kicker">Tendances</div>
      <h3>Analyses</h3>
      <p class="incidents-form-lead incidents-analytics-card__lead">
        Tendances sur le périmètre chargé — même source que le registre.
      </p>
    </div>`;
  const analyticsGrid = document.createElement('div');
  analyticsGrid.className = 'incidents-analytics-grid';
  analyticsCard.append(analyticsHead, analyticsGrid);

  const journalCard = document.createElement('article');
  journalCard.className =
    'content-card card-soft incidents-premium-card incidents-journal-card qhse-page-advanced-only';
  const journalHead = document.createElement('div');
  journalHead.className = 'content-card-head content-card-head--tight';
  journalHead.innerHTML = `
    <div>
      <div class="section-kicker">Traçabilité</div>
      <h3>Journal incidents (local)</h3>
      <p class="incidents-form-lead incidents-journal-card__lead">
        Dernières actions enregistrées dans cette session — déclarations, statuts, analyses.
      </p>
    </div>`;
  const journalBody = document.createElement('div');
  journalBody.className = 'incidents-journal-body';
  journalCard.append(journalHead, journalBody);

  function refreshIncidentJournal() {
    refreshIncidentsJournalDom(journalBody);
  }

  const registryShell = document.createElement('div');
  registryShell.className = 'incidents-registry-shell incidents-registry-shell--secondary';
  const registryZoneTitle = document.createElement('div');
  registryZoneTitle.className = 'incidents-registry-zone-title';
  registryZoneTitle.innerHTML = `
    <p class="incidents-registry-zone-kicker">Consultation</p>
    <h2 class="incidents-registry-zone-heading">Registre incidents</h2>
  `;
  registryShell.append(registryZoneTitle, compactFilters, split);

  const incidentsModeGuide = createSimpleModeGuide({
    title: 'Incidents — lire vite, agir sûr',
    hint: 'En-tête : pilotage et priorités ; déclarez depuis le bloc action ; le registre sert à parcourir les fiches.',
    nextStep: 'Déclarer si besoin, sinon parcourir les priorités puis le tableau de consultation.'
  });
  incidentsModeGuide.classList.add('qhse-page-advanced-only');

  page.append(
    offlineCacheBanner,
    incidentsPageViewBar,
    incidentsModeGuide,
    pageIntro,
    pilotageBlock,
    quickActionsCard,
    prioritiesCard,
    analyticsCard,
    journalCard,
    registryShell
  );

  refreshIncidentJournal();

  function refreshAnalytics() {
    refreshIncidentsAnalytics(analyticsGrid, { apiLoadState, incidentRecords });
  }

  const detailPanelCtx = {
    getIncidentRecords: () => incidentRecords,
    canWriteIncidents,
    canWriteActions,
    canUseAiSuggest,
    patchIncidentStatus,
    onAddLog,
    refreshIncidentJournal,
    openIncidentAiAnalysis: (inc) =>
      openIncidentAiAnalysisPanel(inc, {
        canWriteActions,
        onAddLog,
        ensureUsersCached,
        getActionUsers: () => getCachedUsersForActionsList()
      })
  };

  function renderDetailEmpty(message) {
    mountIncidentDetailEmpty(detailInner, message);
  }

  async function renderDetailForIncident(inc) {
    await mountIncidentDetailPanel(detailInner, inc, detailPanelCtx);
    attachMistralIncidentCausesButton(detailInner, inc);
  }

  function syncListSelectionVisual() {
    const sel = String(selectedRef ?? '').trim();
    listHost.querySelectorAll('.incidents-table-row').forEach((row) => {
      row.classList.toggle(
        'incidents-table-row--selected',
        String(row.dataset.ref ?? '').trim() === sel
      );
    });
  }

  function activateIncidentRow(inc) {
    selectedRef = inc.ref;
    syncListSelectionVisual();
    void renderDetailForIncident(inc).then(() => {
      requestAnimationFrame(() => {
        detailCol.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function refreshPrioritiesStrip() {
    refreshIncidentsPrioritiesStrip(prioritiesHost, {
      apiLoadState,
      incidentRecords,
      sortIncidentsForDisplay,
      isStatusClosed,
      onActivateIncident: (ref) => {
        const fresh = incidentByRef(ref);
        if (fresh) activateIncidentRow(fresh);
      }
    });
  }

  async function patchIncidentStatus(inc, newStatus, selectEl) {
    selectEl.disabled = true;
    try {
      const res = await qhseFetch(
        `/api/incidents/${encodeURIComponent(inc.ref)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        }
      );
      if (!res.ok) {
        let msg = 'Mise à jour impossible';
        try {
          const b = await res.json();
          if (b.error) msg = b.error;
        } catch {
          /* ignore */
        }
        showToast(msg, 'error');
        selectEl.value = inc.status;
        return;
      }
      const updated = await res.json();
      const entry = mapApiIncident(updated);
      if (!entry) {
        showToast('Réponse serveur inattendue', 'error');
        selectEl.value = inc.status;
        return;
      }
      const idx = incidentRecords.findIndex(
        (r) => String(r.ref ?? '').trim() === String(entry.ref ?? '').trim()
      );
      if (idx >= 0) incidentRecords[idx] = entry;
      else incidentRecords = [entry, ...incidentRecords];
      showToast(`Statut : ${newStatus}`, 'info');
      if (typeof onAddLog === 'function') {
        onAddLog({
          module: 'incidents',
          action: 'Statut incident',
          detail: `${inc.ref} → ${newStatus}`,
          user: getSessionUser()?.name || 'Responsable QHSE'
        });
      }
      refreshIncidentJournal();
      refreshList();
    } catch (err) {
      console.error('[incidents] PATCH', err);
      showToast('Erreur réseau', 'error');
      selectEl.value = inc.status;
    } finally {
      selectEl.disabled = !canWriteIncidents;
    }
  }

  function refreshList() {
    const rows = getFilteredSortedRows();
    updateHeaderStats();

    if (apiLoadState === 'ok') {
      const keepSite = filterSite;
      filSiteSel.querySelectorAll('option:not([value=""])').forEach((o) => o.remove());
      const seenSites = new Set();
      incidentRecords.forEach((r) => {
        const s = String(r.site || '').trim();
        if (s && !seenSites.has(s)) {
          seenSites.add(s);
          const o = document.createElement('option');
          o.value = s;
          o.textContent = s;
          filSiteSel.append(o);
        }
      });
      siteOptions.forEach((s) => {
        if (s && !seenSites.has(s)) {
          seenSites.add(s);
          const o = document.createElement('option');
          o.value = s;
          o.textContent = s;
          filSiteSel.append(o);
        }
      });
      if (keepSite && [...filSiteSel.options].some((o) => o.value === keepSite)) {
        filSiteSel.value = keepSite;
      } else {
        filterSite = '';
        filSiteSel.value = '';
      }
    }

    const n = rows.length;
    const total = incidentRecords.length;
    if (apiLoadState === 'loading') {
      listHeading.textContent = 'Chargement du registre…';
      listCount.textContent = '';
      listCount.hidden = true;
    } else if (apiLoadState === 'error') {
      listHeading.textContent = 'Registre indisponible';
      listCount.textContent = '';
      listCount.hidden = true;
    } else {
      listHeading.textContent = 'Consultation — registre';
      listCount.hidden = false;
      listCount.textContent =
        n === total
          ? `${n} affiché${n !== 1 ? 's' : ''}`
          : `${n} affiché${n !== 1 ? 's' : ''} / ${total}`;
    }

    listHost.replaceChildren();

    if (apiLoadState === 'loading') {
      const wrap = document.createElement('div');
      wrap.className = 'incidents-skeleton-host';
      for (let i = 0; i < 3; i++) wrap.append(createSkeletonCard(3));
      listHost.append(wrap);
      refreshAnalytics();
      refreshPrioritiesStrip();
      return;
    }

    if (apiLoadState === 'error' && incidentRecords.length === 0) {
      const wrap = document.createElement('div');
      wrap.className = 'incidents-empty';
      const t = document.createElement('p');
      t.className = 'incidents-empty__title';
      t.textContent = 'Liste indisponible';
      const s = document.createElement('p');
      s.className = 'incidents-empty__sub';
      s.textContent =
        'Vérifiez que l’API tourne et que le navigateur peut l’atteindre (ex. http://localhost:5173 avec backend actif).';
      wrap.append(t, s);
      listHost.append(wrap);
      refreshAnalytics();
      refreshPrioritiesStrip();
      return;
    }

    if (apiLoadState === 'ok' && incidentRecords.length === 0) {
      const wrap = createEmptyState(
        '!',
        'Aucun incident enregistré',
        'Déclarez votre premier incident via le bouton +',
        'Déclarer un incident',
        () => slideOver.open(quick)
      );
      wrap.classList.add('incidents-empty');
      listHost.append(wrap);
      refreshAnalytics();
      refreshPrioritiesStrip();
      return;
    }

    if (apiLoadState === 'ok' && rows.length === 0 && incidentRecords.length > 0) {
      const wrap = createEmptyState(
        '◎',
        'Aucun résultat sur ce périmètre',
        'Ajustez la recherche, la période, la vue statut ou les filtres précis (gravité, statut catalogue, site).',
        'Réinitialiser les filtres',
        resetIncidentsFilters
      );
      wrap.classList.add('incidents-empty');
      listHost.append(wrap);
      refreshAnalytics();
      refreshPrioritiesStrip();
      return;
    }

    const displayRows = rows.map((r) => mapRowToDisplay(r));
    const scroll = document.createElement('div');
    scroll.className = 'incidents-table-scroll';
    const table = document.createElement('table');
    table.className =
      'incidents-table-premium qhse-data-table' +
      (incidentsTableColumnMode === 'full' ? ' qhse-data-table--full' : ' qhse-data-table--essential');
    const thead = document.createElement('thead');
    const thr = document.createElement('tr');
    [
      { t: 'Incident', adv: false },
      { t: 'Gravité', adv: true },
      { t: 'Statut', adv: false },
      { t: 'Date', adv: false },
      { t: 'Site', adv: true },
      { t: '', adv: false }
    ].forEach(({ t, adv }) => {
      const th = document.createElement('th');
      th.textContent = t;
      if (adv) th.classList.add('qhse-col-adv');
      thr.append(th);
    });
    thead.append(thr);
    const tbody = document.createElement('tbody');
    displayRows.forEach((inc) => {
      tbody.append(
        buildIncidentTableRow(inc, {
          isStatusClosed,
          columnMode: incidentsTableColumnMode,
          canWriteActions
        })
      );
    });
    table.append(thead, tbody);
    scroll.append(table);
    listHost.append(scroll);
    syncListSelectionVisual();
    if (selectedRef) {
      const fresh = incidentByRef(selectedRef);
      if (fresh) {
        renderDetailForIncident(mapRowToDisplay(fresh));
      } else {
        selectedRef = null;
        renderDetailEmpty('Sélectionnez un incident');
      }
    }
    refreshAnalytics();
    refreshPrioritiesStrip();
    refreshIncidentJournal();
  }

  function resetIncidentsFilters() {
    filterText = '';
    searchInp.value = '';
    filterSeverity = '';
    filSevSel.value = '';
    filterStatus = '';
    filStSel.value = '';
    filterSite = '';
    filSiteSel.value = '';
    filterDateRange = 'all';
    dateSel.value = 'all';
    panelFilterStatus = 'all';
    statusSel.value = 'all';
    refreshList();
  }

  try {
    renderDetailEmpty('Sélectionnez un incident');
    refreshList();
  } catch (err) {
    console.error('[incidents] rendu initial du registre', err);
  }

  (async function loadIncidentsFromApi() {
    if (!isOnline()) {
      offlineCacheBanner.hidden = false;
      const cached = readIncidentsListCache();
      if (cached?.length) {
        incidentRecords = cached;
        apiLoadState = 'ok';
        refreshList();
        return;
      }
      incidentRecords = [];
      apiLoadState = 'error';
      refreshList();
      return;
    }
    offlineCacheBanner.hidden = true;
    try {
      const res = await qhseFetch(withSiteQuery('/api/incidents?limit=500'));
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const rows = Array.isArray(data) ? data : [];
      incidentRecords = rows.map(mapApiIncident).filter(Boolean);
      apiLoadState = 'ok';
      saveIncidentsListCache(incidentRecords);
      refreshList();
    } catch (err) {
      console.error('[incidents] GET /api/incidents', err);
      showToast('Erreur serveur', 'error');
      const fallback = readIncidentsListCache();
      if (fallback?.length) {
        offlineCacheBanner.hidden = false;
        incidentRecords = fallback;
        apiLoadState = 'ok';
      } else {
      incidentRecords = [];
      apiLoadState = 'error';
      }
      refreshList();
    }
  })();

  const incFlow = setupIncidentDeclareFlow({
    btnDeclare,
    btnTerrain,
    getIncidentRecords: () => incidentRecords,
    onDeclared: (entry) => {
      incidentRecords = [entry, ...incidentRecords.filter((r) => r.ref !== entry.ref)];
      apiLoadState = 'ok';
      refreshList();
    },
    refreshList,
    refreshIncidentJournal,
    onAddLog
  });
  slideOver = incFlow.slideOver;
  quick = incFlow.quick;

  ensureUsersCached().catch(() => {});
  return page;
}
