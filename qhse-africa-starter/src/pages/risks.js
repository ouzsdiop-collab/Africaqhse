import {
  createRiskMatrixPanel,
  parseRiskMatrixGp,
  riskCriticalityFromMeta,
  riskTierFromGp,
  riskLevelLabelFromTier
} from '../components/riskMatrixPanel.js';
import { createRiskRegisterRow } from '../components/riskRegisterRow.js';
import { ensureQhsePilotageStyles } from '../components/qhsePilotageStyles.js';
import { showToast } from '../components/toast.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import { getMergedIncidentsForRisk } from '../utils/riskMockIncidentLinks.js';
import { createRiskManagerReadingCard } from '../components/riskManagerReading.js';
import { activityLogStore } from '../data/activityLog.js';
import { appState } from '../utils/state.js';
import { createSimpleModeGuide } from '../utils/simpleModeGuide.js';
import { buildActionDefaultsFromCriticalRisk } from '../utils/qhseAssistantFormSuggestions.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { createPermit } from '../services/ptw.service.js';
import { linkModules } from '../services/moduleLinks.service.js';
import { createSkeletonCard, createEmptyState } from '../utils/designSystem.js';
import { isOnline } from '../utils/networkStatus.js';

export { openRiskCreateDialog } from '../components/riskFormDialog.js';
export { openRiskDialog } from '../components/riskSheetModal.js';
export { openRiskDetail } from '../components/riskDetailPanel.js';

const DASHBOARD_INTENT_KEY = 'qhse.dashboard.intent';

function consumeDashboardIntent() {
  try {
    const raw = localStorage.getItem(DASHBOARD_INTENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    localStorage.removeItem(DASHBOARD_INTENT_KEY);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** Série locale pour graphique évolution (hors API). */
const RISK_EVOLUTION_SERIES = [
  { m: 'Déc', crit: 1, avgScore: 14 },
  { m: 'Jan', crit: 2, avgScore: 15 },
  { m: 'Fév', crit: 2, avgScore: 16 },
  { m: 'Mar', crit: 3, avgScore: 17 },
  { m: 'Avr', crit: 2, avgScore: 16 }
];

const RISK_DOCS_MOCK = [
  { label: 'PV revue des risques — 28/03/2026', kind: 'Document' },
  { label: 'Contrôle rétention hydrocarbures — constat', kind: 'Contrôle' },
  { label: 'Export matrice G×P — version consolidée', kind: 'Document' }
];

function countRiskLevels(list) {
  let critique = 0;
  let eleve = 0;
  let modere = 0;
  list.forEach((r) => {
    const crit = riskCriticalityFromMeta(r.meta);
    if (crit) {
      if (crit.tier >= 5) critique += 1;
      else if (crit.tier >= 3) eleve += 1;
      else modere += 1;
      return;
    }
    const s = String(r.status).toLowerCase();
    if (s.includes('critique')) critique += 1;
    else if (s.includes('très') && s.includes('élev')) eleve += 1;
    else if (s.includes('élevé') || s.includes('eleve')) eleve += 1;
    else modere += 1;
  });
  return { critique, eleve, modere };
}

/** @typedef {'critique'|'eleve'|'modere'} RiskTierBucket */

/** @param {{ meta?: string, status?: string }} r */
function riskTierBucket(r) {
  const crit = riskCriticalityFromMeta(r.meta);
  if (crit) {
    if (crit.tier >= 5) return 'critique';
    if (crit.tier >= 3) return 'eleve';
    return 'modere';
  }
  const s = String(r.status).toLowerCase();
  if (s.includes('critique')) return 'critique';
  if (s.includes('très') && s.includes('élev')) return 'eleve';
  if (s.includes('élevé') || s.includes('eleve')) return 'eleve';
  return 'modere';
}

/** @param {Array<{ title?: string, meta?: string, status?: string }>} list */
function countRisksWithoutGp(list) {
  return list.filter((r) => !parseRiskMatrixGp(r.meta)).length;
}

function hasActionLinked(r) {
  return r?.actionLinked != null && typeof r.actionLinked === 'object';
}

/** @param {Array<object>} list */
function countRiskElevesOnly(list) {
  return list.filter((r) => riskTierBucket(r) === 'eleve').length;
}

function countRiskMaitrises(list) {
  return list.filter((r) => r.pilotageState === 'traite').length;
}

function countRiskSansAction(list) {
  return list.filter((r) => !hasActionLinked(r)).length;
}

/**
 * Analyse globale (lecture seule — pas d’écriture).
 * @param {Array<{ title?: string, meta?: string, status?: string, pilotageState?: string, trend?: string }>} list
 */
function computeGlobalRiskAnalysis(list) {
  /** @type {{ level: 'info'|'warn'|'err', text: string }[]} */
  const findings = [];
  const sans = countRiskSansAction(list);
  if (sans > 0) {
    findings.push({
      level: 'warn',
      text: `${sans} risque(s) sans action liée — prioriser le rattachement au registre actions.`
    });
  }
  const unplaced = countRisksWithoutGp(list);
  if (unplaced > 0) {
    findings.push({
      level: 'info',
      text: `${unplaced} fiche(s) sans position G×P explicite sur la matrice.`
    });
  }
  list.forEach((r) => {
    const gp = parseRiskMatrixGp(r.meta);
    const crit = riskCriticalityFromMeta(r.meta);
    const st = String(r.status || '').toLowerCase();
    if (gp && crit && crit.tier >= 4 && (st.includes('faible') || st.includes('modéré') || st.includes('modere'))) {
      findings.push({
        level: 'err',
        text: `Incohérence possible : « ${r.title || 'Sans titre'} » — palier ${crit.label} vs libellé de statut modeste.`
      });
    }
    if (gp) {
      const prod = gp.g * gp.p;
      if (prod >= 16 && r.trend === 'stable' && r.pilotageState === 'actif' && crit && crit.tier >= 4) {
        findings.push({
          level: 'warn',
          text: `Sous-évaluation / veille : « ${r.title || 'Sans titre'} » — score G×P ${prod} mais tendance stable ; confirmer le pilotage.`
        });
      }
    }
  });
  const seen = new Set();
  return findings.filter((f) => {
    if (seen.has(f.text)) return false;
    seen.add(f.text);
    return true;
  });
}

/** @param {Array<{ title?: string, meta?: string, status?: string }>} list */
function sortRisksByPriority(list) {
  return [...list].sort((a, b) => {
    const ca = riskCriticalityFromMeta(a.meta);
    const cb = riskCriticalityFromMeta(b.meta);
    const ta = ca?.tier ?? 0;
    const tb = cb?.tier ?? 0;
    if (tb !== ta) return tb - ta;
    const pa = ca?.product ?? 0;
    const pb = cb?.product ?? 0;
    return pb - pa;
  });
}

function levelToNum(v) {
  const s = String(v || '').toLowerCase();
  if (s.includes('élev') || s.includes('elev') || s === '5' || s === '4') return 5;
  if (s.includes('faible') || s === '1' || s === '2') return 2;
  return 3;
}

function numToLevel(n) {
  const x = Number(n) || 3;
  if (x >= 4) return 'élevée';
  if (x <= 2) return 'faible';
  return 'moyenne';
}

function mapApiRiskToUi(row) {
  const gRaw = Number(row?.gravity ?? row?.severity ?? row?.level ?? 3);
  const pRaw = Number(row?.probability ?? 3);
  const g = Number.isFinite(gRaw) && gRaw > 0 ? Math.max(1, Math.min(5, Math.round(gRaw))) : 3;
  const p = Number.isFinite(pRaw) && pRaw > 0 ? Math.max(1, Math.min(5, Math.round(pRaw))) : 3;
  /* Ne pas utiliser row.gp (produit G×P, ex. 15) comme meta : le parseur attend « G3 × P5 ». */
  const meta = `G${g} × P${p}`;
  const tier = riskTierFromGp(g, p);
  const statusLabel = row?.status ? String(row.status) : riskLevelLabelFromTier(tier);
  return {
    id: row?.id || null,
    title: String(row?.title || 'Sans titre'),
    type: String(row?.category || ''),
    detail: String(row?.description || ''),
    status: statusLabel,
    tone: tier >= 5 ? 'red' : tier >= 3 ? 'amber' : 'blue',
    meta,
    responsible: String(row?.responsible || row?.owner || 'À désigner'),
    actionLinked: row?.actionLinked ?? null,
    pilotageState: /clos|ferm|trait|ma[iî]tris/i.test(statusLabel) ? 'traite' : 'actif',
    updatedAt: row?.updatedAt ? String(row.updatedAt).slice(0, 10) : new Date().toISOString().slice(0, 10),
    trend: row?.trend || 'stable'
  };
}

function attachRiskMistralMitigationSection(inner, risk) {
  inner.querySelectorAll('[data-qhse-mistral-risk]').forEach((el) => el.remove());
  const host = document.createElement('div');
  host.setAttribute('data-qhse-mistral-risk', '1');
  host.style.marginTop = '12px';

  const aiBtn = document.createElement('button');
  aiBtn.type = 'button';
  aiBtn.textContent = 'Suggestions de prevention IA';
  aiBtn.className = 'btn btn-primary btn-sm';
  aiBtn.style.marginTop = '12px';

  let aiLoading = false;
  aiBtn.addEventListener('click', async () => {
    if (aiLoading) return;
    aiLoading = true;
    aiBtn.textContent = 'Analyse en cours...';
    aiBtn.disabled = true;
    const gp = parseRiskMatrixGp(risk.meta);
    const payload = {
      title: risk.title,
      category: risk.type || '',
      probability: gp?.p ?? 'N/A',
      severity: gp?.g ?? 'N/A',
      description: String(risk.detail || '').trim() || 'Non precise'
    };
    try {
      const res = await qhseFetch('/api/ai/risk-mitigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
  inner.append(host);
}

async function fetchRisksApi(filters = {}) {
  const qs = new URLSearchParams();
  qs.set('limit', '500');
  if (filters.status) qs.set('status', String(filters.status));
  if (filters.category) qs.set('category', String(filters.category));
  if (filters.q) qs.set('q', String(filters.q));
  const res = await qhseFetch(withSiteQuery(`/api/risks?${qs.toString()}`));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const list = await res.json().catch(() => []);
  return Array.isArray(list) ? list.map(mapApiRiskToUi) : [];
}

const RISKS_LIST_CACHE_KEY = 'qhse.cache.risks.list.v1';

function readRisksListCache() {
  try {
    const raw = localStorage.getItem(RISKS_LIST_CACHE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw);
    return Array.isArray(j?.rows) ? j.rows : null;
  } catch {
    return null;
  }
}

function saveRisksListCache(rows) {
  try {
    localStorage.setItem(RISKS_LIST_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), rows }));
  } catch {
    /* ignore */
  }
}

export function renderRisks() {
  ensureQhsePilotageStyles();

  const page = document.createElement('section');
  page.className = 'page-stack risks-page risks-page--premium';

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

  let localRisks = [];
  let risksLoading = true;

  /** @type {Array<{ description?: string, ref?: string, type?: string, status?: string, createdAt?: string }>} */
  let incidentRowsRaw = [];

  async function refreshIncidentLinks() {
    if (!isOnline()) {
      incidentRowsRaw = [];
      return;
    }
    try {
      const res = await qhseFetch(withSiteQuery('/api/incidents?limit=500'));
      if (res.ok) {
        const data = await res.json();
        incidentRowsRaw = Array.isArray(data) ? data : [];
      } else {
        incidentRowsRaw = [];
      }
    } catch (err) {
      console.error('[risks] GET incidents for liaison', err);
      incidentRowsRaw = [];
    }
  }

  async function openPreventiveActionFromRisks(riskTitle) {
    const preset = riskTitle != null ? String(riskTitle).trim() : '';
    const linked =
      preset || window.prompt('Libellé du risque (comme dans le registre) :', '') || '';
    if (!String(linked).trim()) return;
    const t = String(linked).trim();
    const [{ openActionCreateDialog }, { fetchUsers }] = await Promise.all([
      import('../components/actionCreateDialog.js'),
      import('../services/users.service.js')
    ]);
    let users = [];
    try {
      users = await fetchUsers();
    } catch {
      showToast('Utilisateurs indisponibles.', 'warning');
    }
    const riskRow = localRisks.find((r) => String(r.title || '').trim() === t);
    const defaults = riskRow
      ? buildActionDefaultsFromCriticalRisk(riskRow)
      : {
          actionType: 'preventive',
          origin: 'risk',
          linkedRisk: t,
          title: `Prévention — ${t}`
        };
    openActionCreateDialog({
      users,
      defaults,
      onCreated: () => {
        linkModules({
          fromModule: 'risks',
          fromId: t,
          toModule: 'actions',
          toId: `action_for_${t}`,
          kind: 'risk_to_action',
          label: 'Action préventive'
        });
        showToast('Action préventive créée — suivi dans Plan d’actions.', 'success');
        activityLogStore.add({
          module: 'risks',
          action: 'Création action préventive',
          detail: t,
          user: 'Pilotage QHSE'
        });
      }
    });
  }

  function createPtwFromRisk(riskTitle) {
    const t = String(riskTitle || '').trim();
    if (!t) return;
    const type = /électri/i.test(t)
      ? 'électrique'
      : /chaud|feu/i.test(t)
        ? 'travaux à chaud'
        : /confin/i.test(t)
          ? 'espace confiné'
          : 'travail en hauteur';
    const permit = createPermit({
      type,
      description: `PTW généré depuis risque: ${t}`,
      zone: appState.currentSite || 'Zone opérationnelle',
      date: new Date().toISOString().slice(0, 10),
      team: 'Responsable terrain',
      checklist: [],
      epi: ['Casque', 'Gants'],
      safetyConditions: ['Balisage en place'],
      status: 'pending'
    });
    linkModules({
      fromModule: 'risks',
      fromId: t,
      toModule: 'permits',
      toId: permit.id,
      kind: 'risk_to_ptw',
      label: 'PTW lié'
    });
    showToast('PTW créé depuis le risque.', 'success');
    activityLogStore.add({
      module: 'risks',
      action: 'Création PTW liée',
      detail: t,
      user: 'Pilotage QHSE'
    });
    window.location.hash = 'permits';
  }

  async function createRiskRemote(data) {
    const gp = parseRiskMatrixGp(data.meta) || { g: levelToNum('moyenne'), p: levelToNum('moyenne') };
    const payload = {
      title: String(data.title || '').trim(),
      description: String(data.detail || '').trim(),
      category: String(data.type || '').trim() || 'Sécurité',
      level: gp.g,
      gravity: gp.g,
      severity: gp.g,
      probability: gp.p,
      status: String(data.status || 'open'),
      responsible: String(data.responsible || '').trim() || null,
      owner: String(data.responsible || '').trim() || null,
      siteId: appState.activeSiteId || null
    };
    const res = await qhseFetch('/api/risks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || `Erreur création (${res.status})`);
    }
    return mapApiRiskToUi(await res.json());
  }

  async function patchRiskStatusRemote(risk, status) {
    if (!risk?.id) {
      showToast('Risque sans identifiant API, action impossible.', 'warning');
      return;
    }
    const res = await qhseFetch(`/api/risks/${encodeURIComponent(String(risk.id))}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || `Erreur mise à jour (${res.status})`);
    }
    showToast('Statut risque mis à jour.', 'success');
    await refreshAll();
  }

  async function deleteRiskRemote(risk) {
    if (!risk?.id) {
      showToast('Risque sans identifiant API, suppression impossible.', 'warning');
      return;
    }
    const ok = window.confirm(`Supprimer le risque « ${String(risk.title || 'Sans titre')} » ?`);
    if (!ok) return;
    const res = await qhseFetch(`/api/risks/${encodeURIComponent(String(risk.id))}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || `Erreur suppression (${res.status})`);
    }
    showToast('Risque supprimé.', 'success');
    await refreshAll();
  }

  const listStack = document.createElement('tbody');
  listStack.className = 'risks-register-premium-table__body';

  /** @type {{ g: number, p: number } | null} */
  let matrixFilter = null;
  /** @type {RiskTierBucket | null} */
  let tierFilter = null;
  /** @type {'critique'|'eleve'|'maitrise'|'sans_action'|null} — filtres cartes KPI */
  let bannerKpiFilter = null;
  let dashboardKeywordFilter = '';
  const dashboardIntent = consumeDashboardIntent();

  function deriveApiFilters() {
    let status = null;
    if (bannerKpiFilter === 'maitrise') status = 'clos';
    let category = null;
    const kw = String(dashboardKeywordFilter || '').trim();
    if (kw) category = kw;
    return { status, category, q: null };
  }

  const matrixPanel = createRiskMatrixPanel({
    variant: 'default',
    showRiskDots: true,
    onFilterChange: (f) => {
      matrixFilter = f;
      bannerKpiFilter = null;
      updateMatrixStatusLine();
      updateActiveFiltersBar();
      renderList();
      renderPilot();
    },
    onCellActivate: () => {
      requestAnimationFrame(() => {
        document
          .querySelector('.risks-register-premium-table')
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  });

  const managerHost = document.createElement('div');
  managerHost.className = 'risks-manager-reading-host';

  function renderManagerReading() {
    managerHost.replaceChildren();
    managerHost.append(
      createRiskManagerReadingCard(localRisks, {
        onScrollToTitle: (title) => {
          const safe = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(title) : String(title).replace(/"/g, '\\"');
          const row = document.querySelector(`tr[data-risk-title="${safe}"]`);
          if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            return;
          }
          document
            .querySelector('.risks-register-premium-table')
            ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      })
    );
  }

  const pilotHost = document.createElement('div');
  pilotHost.className = 'risks-pilot-banner-host';

  const matrixStatusLine = document.createElement('p');
  matrixStatusLine.className = 'risks-matrix-card-prominent__status';
  matrixStatusLine.setAttribute('role', 'status');

  function renderPilot() {
    const nCrit = localRisks.filter((r) => riskTierBucket(r) === 'critique').length;
    const nElev = countRiskElevesOnly(localRisks);
    const nMait = countRiskMaitrises(localRisks);
    const nSans = countRiskSansAction(localRisks);
    pilotHost.replaceChildren();
    const art = document.createElement('article');
    art.className = 'content-card card-soft risks-pilot-banner risks-pilot-banner--qhse-hub';
    const head = document.createElement('div');
    head.className = 'risks-pilot-banner__head';
    head.innerHTML = `
      <div>
        <div class="section-kicker">Pilotage QHSE</div>
        <h3 class="risks-pilot-banner__title">Registre des risques opérationnels</h3>
        <p class="risks-pilot-banner__lead">Aligné ISO 45001 &amp; 14001 — matrice G×P, terrain et actions. Cliquez une carte pour filtrer le tableau.</p>
      </div>`;
    const kpis = document.createElement('div');
    kpis.className = 'risks-pilot-banner__kpis risks-pilot-banner__kpis--four';
    kpis.setAttribute('aria-label', 'Indicateurs registre risques — filtres');
    const cards = [
      ['Critiques', String(nCrit), 'Palier critique', 'risks-pilot-banner__kpi--crit', 'critique'],
      ['Élevés', String(nElev), 'Hors palier critique', 'risks-pilot-banner__kpi--elev', 'eleve'],
      ['Maîtrisés', String(nMait), 'Clôture locale (pilotage)', 'risks-pilot-banner__kpi--ok', 'maitrise'],
      ['Sans action', String(nSans), 'Sans action liée', 'risks-pilot-banner__kpi--action', 'sans_action']
    ];
    cards.forEach(([lbl, val, hint, cls, key]) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = `risks-pilot-banner__kpi ${cls} risks-pilot-banner__kpi--click`;
      if (bannerKpiFilter === key) d.classList.add('risks-pilot-banner__kpi--filter-on');
      d.dataset.kpiFilter = key;
      d.innerHTML = `<span class="risks-pilot-banner__kpi-val">${escapeHtml(val)}</span><span class="risks-pilot-banner__kpi-lbl">${escapeHtml(lbl)}</span><span class="risks-pilot-banner__kpi-hint">${escapeHtml(hint)}</span>`;
      d.addEventListener('click', () => {
        bannerKpiFilter = bannerKpiFilter === key ? null : key;
        tierFilter = null;
        syncTierPills();
        updateActiveFiltersBar();
        void refreshAll();
        renderPilot();
      });
      kpis.append(d);
    });
    art.append(head, kpis);
    pilotHost.append(art);
  }

  const priorityHost = document.createElement('section');
  priorityHost.className = 'risks-priority-premium';

  function miniRiskLine(r) {
    const gp = parseRiskMatrixGp(r.meta);
    const gpTxt = gp ? `G${gp.g}×P${gp.p}` : 'G×P ?';
    const crit = riskCriticalityFromMeta(r.meta);
    const badge = crit ? crit.label : String(r.status || '—');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'risks-priority-premium__line';
    b.innerHTML = `<span class="risks-priority-premium__line-title">${escapeHtml(String(r.title || ''))}</span><span class="risks-priority-premium__line-sub">${escapeHtml(gpTxt)} · ${escapeHtml(String(badge))}</span>`;
    b.addEventListener('click', () => {
      document
        .querySelector('.risks-register-premium-table')
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    return b;
  }

  function renderPriority() {
    priorityHost.replaceChildren();
    const card = document.createElement('article');
    card.className = 'content-card card-soft risks-priority-premium__card';
    const h = document.createElement('div');
    h.className = 'content-card-head content-card-head--tight';
    h.innerHTML =
      '<div><div class="section-kicker">Priorités</div><h3>Risques à surveiller</h3><p class="content-card-lead risks-priority-premium__lead">Raccourcis vers le registre — critiques, récents, dérive.</p></div>';
    const grid = document.createElement('div');
    grid.className = 'risks-priority-premium__grid';

    function col(title, nodes) {
      const c = document.createElement('div');
      c.className = 'risks-priority-premium__col';
      const t = document.createElement('h4');
      t.className = 'risks-priority-premium__col-title';
      t.textContent = title;
      const list = document.createElement('div');
      list.className = 'risks-priority-premium__col-body';
      if (!nodes.length) {
        const p = document.createElement('p');
        p.className = 'risks-priority-premium__empty';
        p.textContent = 'Aucune entrée.';
        list.append(p);
      } else nodes.forEach((n) => list.append(n));
      c.append(t, list);
      return c;
    }

    const critLines = sortRisksByPriority(
      localRisks.filter((r) => riskTierBucket(r) === 'critique')
    ).map(miniRiskLine);
    const recentLines = [...localRisks]
      .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
      .slice(0, 4)
      .map(miniRiskLine);
    const upLines = localRisks
      .filter((r) => r.trend === 'up' || r.pilotageState === 'derive')
      .map(miniRiskLine);

    grid.append(
      col('Critiques', critLines),
      col('Récents', recentLines),
      col('En augmentation / dérive', upLines)
    );
    card.append(h, grid);
    priorityHost.append(card);
  }

  const evolutionHost = document.createElement('section');

  function renderEvolution() {
    evolutionHost.replaceChildren();
    const art = document.createElement('article');
    art.className = 'content-card card-soft risks-evolution-card';
    art.innerHTML = `
      <div class="content-card-head content-card-head--tight">
        <div>
          <div class="section-kicker">Évolution</div>
          <h3>Tendance</h3>
          <p class="content-card-lead risks-evolution-card__lead">Risques critiques et score moyen G×P — évolution sur la période affichée (indicateurs alimentés par vos données).</p>
        </div>
      </div>
      <div class="risks-evolution-chart" data-risks-evolution-chart></div>
    `;
    const chartHost = art.querySelector('[data-risks-evolution-chart]');
    const maxCrit = Math.max(...RISK_EVOLUTION_SERIES.map((x) => x.crit), 1);
    const maxAvg = Math.max(...RISK_EVOLUTION_SERIES.map((x) => x.avgScore), 1);
    RISK_EVOLUTION_SERIES.forEach((pt) => {
      const row = document.createElement('div');
      row.className = 'risks-evolution-chart__row';
      const hCrit = (pt.crit / maxCrit) * 100;
      const hAvg = (pt.avgScore / maxAvg) * 100;
      row.innerHTML = `
        <span class="risks-evolution-chart__lbl">${escapeHtml(pt.m)}</span>
        <div class="risks-evolution-chart__bars">
          <div class="risks-evolution-chart__bar-wrap" title="Critiques : ${pt.crit}">
            <span class="risks-evolution-chart__bar risks-evolution-chart__bar--crit" style="height:${hCrit}%"></span>
            <span class="risks-evolution-chart__bar-val">${pt.crit}</span>
          </div>
          <div class="risks-evolution-chart__bar-wrap" title="Score moyen G×P : ${pt.avgScore}">
            <span class="risks-evolution-chart__bar risks-evolution-chart__bar--avg" style="height:${hAvg}%"></span>
            <span class="risks-evolution-chart__bar-val">${pt.avgScore}</span>
          </div>
        </div>`;
      chartHost.append(row);
    });
    const leg = document.createElement('div');
    leg.className = 'risks-evolution-chart__legend';
    leg.innerHTML =
      '<span><i class="risks-evolution-chart__dot risks-evolution-chart__dot--crit"></i>Critiques</span><span><i class="risks-evolution-chart__dot risks-evolution-chart__dot--avg"></i>Score moyen G×P</span>';
    chartHost.append(leg);
    evolutionHost.append(art);
  }

  const proofsHost = document.createElement('section');

  function renderProofs() {
    proofsHost.replaceChildren();
    const art = document.createElement('article');
    art.className = 'content-card card-soft risks-proofs-card';
    const h = document.createElement('div');
    h.className = 'content-card-head content-card-head--tight';
    h.innerHTML =
      '<div><div class="section-kicker">Preuves & contrôles</div><h3>Documents liés</h3><p class="content-card-lead risks-proofs-card__lead">Pièces et contrôles rattachés à la fiche risque (référentiel documentaire).</p></div>';
    const ul = document.createElement('ul');
    ul.className = 'risks-proofs-list';
    RISK_DOCS_MOCK.forEach((d) => {
      const li = document.createElement('li');
      li.className = 'risks-proofs-item';
      li.innerHTML = `<span class="risks-proofs-item__kind">${escapeHtml(d.kind)}</span><span class="risks-proofs-item__label">${escapeHtml(d.label)}</span>`;
      ul.append(li);
    });
    art.append(h, ul);
    proofsHost.append(art);
  }

  const iaHost = document.createElement('article');
  iaHost.className = 'content-card card-soft risks-ia-premium';
  iaHost.innerHTML = `
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">IA risques</div>
        <h3>Assistant (validation humaine)</h3>
        <p class="content-card-lead risks-ia-premium__lead">Suggestions locales + analyse API dans « Ajouter un risque ». Aucune écriture sans validation explicite.</p>
      </div>
    </div>
    <div class="risks-ia-premium__actions" data-risks-ia-actions></div>
    <div class="risks-ia-premium__result" data-risks-ia-result hidden></div>
  `;
  const iaActionsHost = iaHost.querySelector('[data-risks-ia-actions]');
  const iaResultEl = iaHost.querySelector('[data-risks-ia-result]');

  function showIaAssistantResult(title, lines) {
    if (!iaResultEl) return;
    iaResultEl.hidden = false;
    const ul = lines.map((t) => `<li>${escapeHtml(t)}</li>`).join('');
    iaResultEl.innerHTML = `<strong class="risks-ia-premium__result-title">${escapeHtml(title)}</strong><ul class="risks-ia-premium__result-list">${ul}</ul><p class="risks-ia-premium__result-hint">Aucune écriture automatique — validez manuellement dans le registre ou les actions.</p>`;
  }

  const iaBtnSpecs = [
    {
      label: 'Synthèse risques critiques',
      key: 'ia_crit',
      run: () => {
        const crits = sortRisksByPriority(
          localRisks.filter((r) => riskTierBucket(r) === 'critique')
        );
        if (!crits.length) {
          showIaAssistantResult('Risques critiques', ['Aucune fiche en palier critique actuellement.']);
          return;
        }
        showIaAssistantResult(
          'Risques critiques (à confirmer)',
          crits.map((r) => {
            const gp = parseRiskMatrixGp(r.meta);
            const gpt = gp ? `G${gp.g}×P${gp.p}` : 'G×P ?';
            return `${r.title || 'Sans titre'} — ${gpt} — ${r.status || '—'}`;
          })
        );
      }
    },
    {
      label: 'Pistes d’actions (sans action liée)',
      key: 'ia_actions',
      run: () => {
        const need = localRisks.filter((r) => !hasActionLinked(r));
        if (!need.length) {
          showIaAssistantResult('Actions recommandées', ['Toutes les fiches visibles ont une action liée.']);
          return;
        }
        showIaAssistantResult(
          'Pistes à valider — rattacher une action',
          need.map(
            (r) =>
              `« ${r.title || 'Sans titre'} » : lancer revue courte, désigner un pilote, créer une action dans le module Actions.`
          )
        );
      }
    },
    {
      label: 'Détecter incohérences',
      key: 'ia_incoh',
      run: () => {
        const findings = computeGlobalRiskAnalysis(localRisks).filter((f) => f.level === 'err');
        if (!findings.length) {
          showIaAssistantResult('Incohérences', ['Aucune incohérence majeure détectée par les règles locales.']);
          return;
        }
        showIaAssistantResult('Incohérences détectées (à vérifier)', findings.map((f) => f.text));
      }
    }
  ];
  iaBtnSpecs.forEach(({ label, key, run }) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-secondary risks-ia-premium__btn';
    b.textContent = label;
    b.addEventListener('click', () => {
      run();
      activityLogStore.add({
        module: 'risks',
        action: 'Assistant risques (suggestion)',
        detail: key,
        user: 'Utilisateur'
      });
    });
    iaActionsHost?.append(b);
  });

  const matrixCard = document.createElement('article');
  matrixCard.className = 'content-card card-soft risks-matrix-card-prominent';
  const matrixHead = document.createElement('div');
  matrixHead.className = 'content-card-head content-card-head--tight';
  matrixHead.innerHTML =
    '<div><div class="section-kicker">Matrice centrale</div><h3>Gravité × Probabilité</h3><p class="content-card-lead risks-matrix-card-prominent__lead">Survol : aperçu des fiches · Clic sur une case remplie : filtre le registre. <abbr title="Produit Gravité × Probabilité (1–25), priorisation relative ISO.">G×P</abbr> explicite sur chaque fiche.</p></div>';
  matrixCard.append(matrixHead, matrixStatusLine, matrixPanel.element);

  function updateMatrixStatusLine() {
    const placed = localRisks.filter((r) => parseRiskMatrixGp(r.meta)).length;
    const unplaced = countRisksWithoutGp(localRisks);
    let s = `${placed}/${localRisks.length} fiche(s) positionnée(s) sur la matrice`;
    if (unplaced > 0) s += ` · ${unplaced} sans G×P`;
    if (matrixFilter) {
      const lv = riskLevelLabelFromTier(riskTierFromGp(matrixFilter.g, matrixFilter.p));
      const sc = matrixFilter.g * matrixFilter.p;
      s += ` · Filtre actif G${matrixFilter.g}×P${matrixFilter.p} (${lv}, score ${sc})`;
    }
    matrixStatusLine.textContent = s;
  }

  const insightsHost = document.createElement('div');
  insightsHost.className = 'risks-page__insights';

  const activeFiltersBar = document.createElement('div');
  activeFiltersBar.className = 'risks-page__active-filters';
  activeFiltersBar.hidden = true;

  function updateActiveFiltersBar() {
    const hasTier = tierFilter != null;
    const hasMatrix = matrixFilter != null;
    const hasBanner = bannerKpiFilter != null;
    const hasKeyword = Boolean(dashboardKeywordFilter);
    activeFiltersBar.hidden = !hasTier && !hasMatrix && !hasBanner && !hasKeyword;
    activeFiltersBar.replaceChildren();
    if (activeFiltersBar.hidden) return;
    const label = document.createElement('span');
    label.className = 'risks-page__active-filters-label';
    label.textContent = 'Filtres actifs';
    const actions = document.createElement('div');
    actions.className = 'risks-page__active-filters-actions';
    if (hasBanner) {
      const map = {
        critique: 'Carte : Critiques',
        eleve: 'Carte : Élevés',
        maitrise: 'Carte : Maîtrisés',
        sans_action: 'Carte : Sans action'
      };
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-secondary risks-page__active-filters-btn';
      b.textContent = `Retirer : ${map[bannerKpiFilter] || 'KPI'}`;
      b.addEventListener('click', () => {
        bannerKpiFilter = null;
        updateActiveFiltersBar();
        void refreshAll();
        renderPilot();
      });
      actions.append(b);
    }
    if (hasTier) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-secondary risks-page__active-filters-btn';
      b.textContent =
        tierFilter === 'critique'
          ? 'Retirer : Critiques'
          : tierFilter === 'eleve'
            ? 'Retirer : Élevés'
            : 'Retirer : Modérés & faibles';
      b.addEventListener('click', () => {
        tierFilter = null;
        syncTierPills();
        updateActiveFiltersBar();
        void refreshAll();
      });
      actions.append(b);
    }
    if (hasMatrix) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-secondary risks-page__active-filters-btn';
      b.textContent = `Retirer : G${matrixFilter.g}×P${matrixFilter.p}`;
      b.addEventListener('click', () => {
        matrixPanel.clearFilter();
      });
      actions.append(b);
    }
    if (hasKeyword) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-secondary risks-page__active-filters-btn';
      b.textContent = `Retirer : type « ${dashboardKeywordFilter} »`;
      b.addEventListener('click', () => {
        dashboardKeywordFilter = '';
        updateActiveFiltersBar();
        void refreshAll();
      });
      actions.append(b);
    }
    const clearAll = document.createElement('button');
    clearAll.type = 'button';
    clearAll.className = 'btn btn-secondary risks-page__active-filters-btn risks-page__active-filters-btn--ghost';
    clearAll.textContent = 'Tout afficher';
    clearAll.addEventListener('click', () => {
      tierFilter = null;
      bannerKpiFilter = null;
      dashboardKeywordFilter = '';
      matrixPanel.clearFilter();
      syncTierPills();
      updateActiveFiltersBar();
      void refreshAll();
      renderPilot();
    });
    actions.append(clearAll);
    activeFiltersBar.append(label, actions);
  }

  function renderInsights() {
    const { critique, eleve, modere } = countRiskLevels(localRisks);
    const n = localRisks.length;
    const unplaced = countRisksWithoutGp(localRisks);
    const pct = (x) => (n > 0 ? Math.round((x / n) * 100) : 0);

    insightsHost.replaceChildren();

    const head = document.createElement('div');
    head.className = 'risks-insights__head risks-insights__head--compact';
    head.innerHTML = `
      <div class="risks-insights__intro">
        <div class="section-kicker">Pilotage</div>
        <h3 class="risks-insights__title">Répartition & filtres registre</h3>
        <p class="risks-insights__lead">${unplaced} fiche(s) sans G×P — paliers ci-dessous pour filtrer le tableau.</p>
      </div>
  `;

    const barWrap = document.createElement('div');
    barWrap.className = 'risks-insights__bar-wrap';
    barWrap.setAttribute('aria-label', 'Répartition par criticité');
    const bar = document.createElement('div');
    bar.className = 'risks-insights__bar';
    if (n === 0) {
      bar.innerHTML = '<div class="risks-insights__bar-seg risks-insights__bar-seg--empty" style="width:100%"></div>';
    } else {
      bar.innerHTML = `
        <div class="risks-insights__bar-seg risks-insights__bar-seg--crit" style="width:${pct(critique)}%" title="Critiques : ${critique}"></div>
        <div class="risks-insights__bar-seg risks-insights__bar-seg--elev" style="width:${pct(eleve)}%" title="Élevés : ${eleve}"></div>
        <div class="risks-insights__bar-seg risks-insights__bar-seg--mod" style="width:${pct(modere)}%" title="Modérés / faibles : ${modere}"></div>
      `;
    }
    const barLegend = document.createElement('div');
    barLegend.className = 'risks-insights__bar-legend';
    barLegend.innerHTML = `
      <span><i class="risks-insights__dot risks-insights__dot--crit"></i>Critiques <strong>${critique}</strong></span>
      <span><i class="risks-insights__dot risks-insights__dot--elev"></i>Élevés <strong>${eleve}</strong></span>
      <span><i class="risks-insights__dot risks-insights__dot--mod"></i>Modérés &amp; faibles <strong>${modere}</strong></span>
    `;
    barWrap.append(bar, barLegend);

    const tierRow = document.createElement('div');
    tierRow.className = 'risks-insights__tier-row';
    tierRow.setAttribute('role', 'group');
    tierRow.setAttribute('aria-label', 'Filtrer le registre par palier');
    const tierLabel = document.createElement('span');
    tierLabel.className = 'risks-insights__tier-label';
    tierLabel.textContent = 'Filtrer le registre';
    const tierPills = document.createElement('div');
    tierPills.className = 'risks-insights__tier-pills';

    /** @param {string} key @param {string} text */
    function addTierPill(key, text) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'risks-tier-pill';
      btn.dataset.tierKey = key;
      btn.textContent = text;
      btn.addEventListener('click', () => {
        bannerKpiFilter = null;
        if (key === 'all') tierFilter = null;
        else if (key === 'critique') tierFilter = 'critique';
        else if (key === 'eleve') tierFilter = 'eleve';
        else tierFilter = 'modere';
        syncTierPills();
        updateActiveFiltersBar();
        void refreshAll();
        renderPilot();
      });
      tierPills.append(btn);
    }
    addTierPill('all', 'Tout');
    addTierPill('critique', `Critiques (${critique})`);
    addTierPill('eleve', `Élevés (${eleve})`);
    addTierPill('modere', `Modérés & faibles (${modere})`);
    tierRow.append(tierLabel, tierPills);

    insightsHost.append(head, barWrap, tierRow);
  }

  /** @param {HTMLButtonElement} btn */
  function setTierPillActive(btn, on) {
    btn.classList.toggle('risks-tier-pill--active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function syncTierPills() {
    const pills = insightsHost.querySelectorAll('.risks-tier-pill');
    pills.forEach((btn) => {
      const key = btn.dataset.tierKey;
      const on =
        (key === 'all' && tierFilter == null) ||
        (key === 'critique' && tierFilter === 'critique') ||
        (key === 'eleve' && tierFilter === 'eleve') ||
        (key === 'modere' && tierFilter === 'modere');
      setTierPillActive(btn, Boolean(on));
    });
  }

  function renderList() {
    listStack.replaceChildren();
    if (risksLoading) {
      const tr = document.createElement('tr');
      tr.className = 'risks-register-empty-row';
      const td = document.createElement('td');
      td.colSpan = 6;
      td.className = 'risks-page__list-empty-td';
      const stack = document.createElement('div');
      stack.className = 'risks-register-skeleton-stack';
      for (let i = 0; i < 4; i++) stack.append(createSkeletonCard(4));
      td.append(stack);
      tr.append(td);
      listStack.append(tr);
      return;
    }
    let rows = localRisks;
    if (bannerKpiFilter === 'critique') {
      rows = rows.filter((r) => riskTierBucket(r) === 'critique');
    } else if (bannerKpiFilter === 'eleve') {
      rows = rows.filter((r) => riskTierBucket(r) === 'eleve');
    } else if (bannerKpiFilter === 'maitrise') {
      rows = rows.filter((r) => r.pilotageState === 'traite');
    } else if (bannerKpiFilter === 'sans_action') {
      rows = rows.filter((r) => !hasActionLinked(r));
    } else if (tierFilter != null) {
      rows = rows.filter((r) => riskTierBucket(r) === tierFilter);
    }
    if (matrixFilter != null) {
      rows = rows.filter((r) => {
        const gp = parseRiskMatrixGp(r.meta);
        return gp && gp.g === matrixFilter.g && gp.p === matrixFilter.p;
      });
    }
    if (dashboardKeywordFilter) {
      const kw = dashboardKeywordFilter.toLowerCase();
      rows = rows.filter((r) =>
        `${String(r.title || '')} ${String(r.status || '')} ${String(r.meta || '')}`
          .toLowerCase()
          .includes(kw)
      );
    }
    if (rows.length === 0) {
      const tr = document.createElement('tr');
      tr.className = 'risks-register-empty-row';
      const td = document.createElement('td');
      td.colSpan = 6;
      td.className = 'risks-page__list-empty-td';
      if (localRisks.length === 0) {
        const es = createEmptyState(
          '△',
          'Registre des risques vide',
          'Ajoutez votre premier risque'
        );
        es.classList.add('risks-register-empty-state');
        td.append(es);
        tr.append(td);
        listStack.append(tr);
        return;
      }
      const wrap = document.createElement('div');
      wrap.className = 'risks-page__list-empty';
      const t = document.createElement('p');
      t.className = 'risks-page__list-empty-title';
      const s = document.createElement('p');
      s.className = 'risks-page__list-empty-sub';
      if (tierFilter != null && matrixFilter != null) {
        t.textContent = 'Aucun résultat pour cette combinaison de filtres';
        s.textContent =
          'Élargissez le palier ou réinitialisez le filtre matrice via « Tout afficher ».';
      } else if (bannerKpiFilter != null) {
        t.textContent = 'Aucune fiche pour ce filtre carte';
        s.textContent = 'Cliquez à nouveau la carte du bandeau ou « Tout afficher ».';
      } else if (tierFilter != null) {
        t.textContent = 'Aucune fiche pour ce palier';
        s.textContent = 'Choisissez un autre filtre ou cliquez « Tout » ci-dessus.';
      } else {
        t.textContent = 'Aucune fiche pour cette case G×P';
        s.textContent = 'Choisissez une autre case ou « Tout afficher » sur la matrice.';
      }
      wrap.append(t, s);
      td.append(wrap);
      tr.append(td);
      listStack.append(tr);
      return;
    }
    const incidentsLinkNote = appState.activeSiteId
      ? 'Périmètre : site sélectionné dans la barre principale — aligné sur la liste du module Incidents.'
      : 'Périmètre : tous les sites visibles par l’API sur cette requête.';

    rows.forEach((r) => {
      const frag = createRiskRegisterRow(r, {
        linkedIncidents: getMergedIncidentsForRisk(String(r.title || ''), incidentRowsRaw),
        incidentsLinkNote,
        onRefresh: () => void refreshAll(),
        onCreatePreventiveAction: (title) => {
          void openPreventiveActionFromRisks(title);
        },
        onCreatePtwFromRisk: (title) => createPtwFromRisk(title),
        onSheetBodyReady: (innerEl, riskRow) => attachRiskMistralMitigationSection(innerEl, riskRow)
      });
      const tr = frag.firstElementChild;
      const tdAction = tr?.querySelector('.risk-register-table-row__action');
      if (tdAction && r?.id) {
        const bTreat = document.createElement('button');
        bTreat.type = 'button';
        bTreat.className = 'risk-register-table-row__act-nav';
        bTreat.textContent = 'En traitement';
        bTreat.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            await patchRiskStatusRemote(r, 'en_traitement');
          } catch (err) {
            showToast(err instanceof Error ? err.message : 'Mise à jour impossible', 'error');
          }
        });
        const bClose = document.createElement('button');
        bClose.type = 'button';
        bClose.className = 'risk-register-table-row__act-nav';
        bClose.textContent = 'Clore';
        bClose.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            await patchRiskStatusRemote(r, 'clos');
          } catch (err) {
            showToast(err instanceof Error ? err.message : 'Mise à jour impossible', 'error');
          }
        });
        const bDel = document.createElement('button');
        bDel.type = 'button';
        bDel.className = 'risk-register-table-row__act-nav';
        bDel.textContent = 'Supprimer';
        bDel.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            await deleteRiskRemote(r);
          } catch (err) {
            showToast(err instanceof Error ? err.message : 'Suppression impossible', 'error');
          }
        });
        tdAction.append(bTreat, bClose, bDel);
      }
      listStack.append(frag);
    });
  }

  const analysisHost = document.createElement('section');
  analysisHost.className = 'risks-analysis-premium';

  function renderAnalysis() {
    const findings = computeGlobalRiskAnalysis(localRisks);
    analysisHost.replaceChildren();
    const art = document.createElement('article');
    art.className = 'content-card card-soft risks-analysis-premium__card';
    const h = document.createElement('div');
    h.className = 'content-card-head content-card-head--tight';
    h.innerHTML =
      '<div><div class="section-kicker">Analyse globale</div><h3>Veille & cohérence</h3><p class="content-card-lead risks-analysis-premium__lead">Lecture seule : actions manquantes, G×P, incohérences — à valider métier.</p></div>';
    const ul = document.createElement('ul');
    ul.className = 'risks-analysis-premium__list';
    if (!findings.length) {
      const li = document.createElement('li');
      li.className = 'risks-analysis-premium__item risks-analysis-premium__item--info';
      li.textContent =
        'Aucun écart flaggé par les règles locales — poursuivre revues et terrain.';
      ul.append(li);
    } else {
      findings.forEach((f) => {
        const li = document.createElement('li');
        li.className = `risks-analysis-premium__item risks-analysis-premium__item--${f.level}`;
        li.textContent = f.text;
        ul.append(li);
      });
    }
    art.append(h, ul);
    analysisHost.append(art);
  }

  async function refreshAll() {
    if (!isOnline()) {
      offlineCacheBanner.hidden = false;
      risksLoading = false;
      const cached = readRisksListCache();
      localRisks = cached?.length ? cached : [];
      await refreshIncidentLinks();
      renderManagerReading();
      renderPilot();
      renderPriority();
      renderEvolution();
      renderProofs();
      renderInsights();
      renderAnalysis();
      syncTierPills();
      updateMatrixStatusLine();
      updateActiveFiltersBar();
      matrixPanel.setRisks(localRisks);
      renderList();
      return;
    }
    offlineCacheBanner.hidden = true;
    try {
      risksLoading = true;
      renderList();
      localRisks = await fetchRisksApi(deriveApiFilters());
      saveRisksListCache(localRisks);
    } catch (err) {
      console.error('[risks] GET /api/risks', err);
      const fallback = readRisksListCache();
      if (fallback?.length) {
        offlineCacheBanner.hidden = false;
        localRisks = fallback;
      } else {
        localRisks = [];
        showToast(
          'Impossible de charger le registre des risques depuis le serveur.',
          'error'
        );
      }
    } finally {
      risksLoading = false;
    }
    await refreshIncidentLinks();
    renderManagerReading();
    renderPilot();
    renderPriority();
    renderEvolution();
    renderProofs();
    renderInsights();
    renderAnalysis();
    syncTierPills();
    updateMatrixStatusLine();
    updateActiveFiltersBar();
    matrixPanel.setRisks(localRisks);
    renderList();
  }

  if (dashboardIntent?.source === 'dashboard' && dashboardIntent?.chart === 'risk_distribution') {
    dashboardKeywordFilter = String(dashboardIntent?.riskType || '').trim();
    if (dashboardKeywordFilter) {
      showToast(`Filtre auto Dashboard appliqué : risque « ${dashboardKeywordFilter} ».`, 'info');
    }
  }

  void refreshAll();

  function openFdsDialog() {
    const dialog = document.createElement('dialog');
    dialog.style.cssText =
      'background:var(--surface-1, #ffffff);color:var(--text-primary, #1e293b);border:1px solid var(--border-color, #e2e8f0);border-radius:12px;padding:24px;max-width:500px;width:100%';
    dialog.innerHTML = `
    <h3 style="margin:0 0 16px;font-size:16px">Analyser une Fiche de Donnees de Securite</h3>
    <p style="font-size:13px;color:var(--text-secondary,#64748b);margin-bottom:16px">
      Uploadez un PDF de FDS pour extraire automatiquement les risques chimiques
      et les EPI requis.
    </p>
    <input type="file" id="fds-upload" accept="application/pdf"
      style="margin-bottom:16px;color:var(--text-primary,#1e293b)">
    <div id="fds-result" style="display:none;border-radius:8px;
      padding:16px;margin-bottom:16px;font-size:13px;line-height:1.6"></div>
    <div style="display:flex;gap:12px;justify-content:flex-end;flex-wrap:wrap">
      <button type="button" id="fds-cancel" class="btn btn-ghost btn-sm">Annuler</button>
      <button type="button" id="fds-analyze" class="btn btn-primary btn-sm">Analyser</button>
      <button type="button" id="fds-create" class="btn btn-success btn-sm" style="display:none">
        Ajouter au registre des risques
      </button>
    </div>`;

    dialog.querySelector('#fds-cancel').addEventListener('click', () => dialog.close());
    dialog.querySelector('#fds-analyze').addEventListener('click', async () => {
      const file = dialog.querySelector('#fds-upload').files[0];
      if (!file) return;
      const analyzeBtn = dialog.querySelector('#fds-analyze');
      analyzeBtn.textContent = 'Analyse en cours...';
      analyzeBtn.disabled = true;
      try {
        const formData = new FormData();
        formData.append('fds', file);
        const res = await qhseFetch('/api/fds/analyze', { method: 'POST', body: formData });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(typeof body.error === 'string' ? body.error : 'analyse');
        const parsedData = body;
        const resultZone = dialog.querySelector('#fds-result');
        resultZone.style.display = 'block';
        resultZone.style.background = 'var(--surface-2, #f8fafc)';
        resultZone.style.border = '1px solid var(--border-color, #e2e8f0)';
        resultZone.style.color = 'var(--text-primary, #1e293b)';
        resultZone.innerHTML = `
        <strong>${escapeHtml(parsedData.productName)}</strong>
        ${parsedData.casNumber ? `<span style="color:var(--text-muted,#64748b)"> — CAS ${escapeHtml(String(parsedData.casNumber))}</span>` : ''}
        <br><br>
        <strong>Dangers detectes :</strong><br>
        ${
          parsedData.dangerLabelsFound?.length
            ? parsedData.dangerLabelsFound
                .map(
                  (d) =>
                    `<span style="background:#ef444420;color:#ef4444;border-radius:4px;padding:2px 8px;margin:2px;display:inline-block">${escapeHtml(d)}</span>`
                )
                .join('')
            : '<span style="color:#10b981">Aucun danger specifique detecte</span>'
        }
        <br><br>
        <strong>EPI requis :</strong><br>
        ${
          parsedData.episRequired?.length
            ? parsedData.episRequired.map((e) => `• ${escapeHtml(e)}`).join('<br>')
            : 'A determiner'
        }
        <br><br>
        <strong>Cotation automatique :</strong> P=${escapeHtml(String(parsedData.probability))} × G=${escapeHtml(String(parsedData.severity))} = GP ${escapeHtml(String(parsedData.probability * parsedData.severity))}`;
        dialog.querySelector('#fds-create').style.display = 'inline-block';
        analyzeBtn.style.display = 'none';
      } catch {
        analyzeBtn.textContent = 'Erreur — Reessayer';
        analyzeBtn.disabled = false;
      }
    });

    dialog.querySelector('#fds-create').addEventListener('click', async () => {
      const createBtn = dialog.querySelector('#fds-create');
      createBtn.textContent = 'Creation en cours...';
      createBtn.disabled = true;
      try {
        const file = dialog.querySelector('#fds-upload').files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('fds', file);
        const res = await qhseFetch('/api/fds/analyze-and-create', { method: 'POST', body: formData });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(typeof body.error === 'string' ? body.error : 'create');
        dialog.close();
        window.location.reload();
      } catch {
        createBtn.textContent = 'Erreur — Reessayer';
        createBtn.disabled = false;
      }
    });

    document.body.appendChild(dialog);
    dialog.showModal();
    dialog.addEventListener('close', () => dialog.remove());
  }

  const register = document.createElement('article');
  register.className = 'content-card card-soft risks-page__panel risks-page__panel--register';
  register.innerHTML = `
    <div class="risks-page__panel-head content-card-head content-card-head--split">
      <div class="risks-page__panel-intro">
        <div class="section-kicker">Registre des risques</div>
        <h3>Tableau compact</h3>
        <p class="content-card-lead risks-page__panel-lead">
          Ligne = synthèse · clic = fiche (modal). Filtres : cartes du haut, paliers ci-dessous ou matrice G×P.
        </p>
      </div>
      <div class="risks-page__panel-actions">
        <button type="button" class="btn btn-secondary risks-preventive-action-btn">
          Créer action préventive
        </button>
        <button type="button" class="btn btn-primary risks-add-btn btn--pilotage-cta">
          + Ajouter un risque
        </button>
      </div>
    </div>
    <div class="risks-page__list-region"></div>
  `;
  const listRegion = register.querySelector('.risks-page__list-region');
  const table = document.createElement('table');
  table.className = 'risks-register-premium-table';
  const caption = document.createElement('caption');
  caption.className = 'risks-register-premium-table__caption';
  caption.textContent = 'Registre des risques — clic sur une ligne pour ouvrir la fiche';
  const colgroup = document.createElement('colgroup');
  colgroup.innerHTML = `
    <col class="risks-register-col risks-register-col--risk" />
    <col class="risks-register-col risks-register-col--crit" />
    <col class="risks-register-col risks-register-col--gp" />
    <col class="risks-register-col risks-register-col--status" />
    <col class="risks-register-col risks-register-col--owner" />
    <col class="risks-register-col risks-register-col--action" />
  `;
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th scope="col">Risque</th>
      <th scope="col">Criticité</th>
      <th scope="col">G×P</th>
      <th scope="col">Statut</th>
      <th scope="col">Responsable</th>
      <th scope="col">Action</th>
    </tr>
  `;
  table.append(caption, colgroup, thead, listStack);
  listRegion.append(activeFiltersBar, table);

  register.querySelector('.risks-preventive-action-btn').addEventListener('click', () => {
    void openPreventiveActionFromRisks('');
  });

  register.querySelector('.risks-add-btn').addEventListener('click', () => {
    openRiskCreateDialog({
      onSaved: async (data) => {
        const created = await createRiskRemote(data);
        localRisks.unshift(created);
        matrixPanel.clearFilter();
        await refreshAll();
        showToast('Risque créé et synchronisé avec le backend.', 'success');
      }
    });
  });

  const fdsBtn = document.createElement('button');
  fdsBtn.type = 'button';
  fdsBtn.textContent = 'Analyser une FDS';
  fdsBtn.className = 'btn btn-secondary btn-sm';
  fdsBtn.addEventListener('click', () => openFdsDialog());
  register.querySelector('.risks-page__panel-actions')?.append(fdsBtn);

  const exportBtnRisks = document.createElement('button');
  exportBtnRisks.type = 'button';
  exportBtnRisks.textContent = 'Export Excel';
  exportBtnRisks.className = 'btn btn-secondary btn-sm';
  exportBtnRisks.addEventListener('click', async () => {
    try {
      const res = await qhseFetch(withSiteQuery('/api/export/risks'));
      if (!res.ok) {
        showToast('Export impossible', 'error');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'risques-export.xlsx';
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Erreur réseau', 'error');
    }
  });
  register.querySelector('.risks-page__panel-actions')?.append(exportBtnRisks);

  const matrixSection = document.createElement('section');
  matrixSection.className = 'risks-page__matrix-section risks-page__matrix-section--hero';
  matrixSection.append(matrixCard);

  const secondaryDetails = document.createElement('details');
  secondaryDetails.className = 'risks-page__secondary';
  const secondarySum = document.createElement('summary');
  secondarySum.className = 'risks-page__secondary-summary';
  secondarySum.innerHTML =
    '<span class="risks-page__secondary-title">Tendances & documents</span><span class="risks-page__secondary-badge">local</span>';
  const secondaryBody = document.createElement('div');
  secondaryBody.className = 'risks-page__secondary-body';
  secondaryBody.append(evolutionHost, proofsHost);
  secondaryDetails.append(secondarySum, secondaryBody);

  page.append(
    offlineCacheBanner,
    createSimpleModeGuide({
      title: 'Risques — prioriser avant la matrice',
      hint: 'Les indicateurs du haut et le bloc « Risques à surveiller » regroupent l’urgence ; la matrice sert ensuite à affiner.',
      nextStep: 'Ensuite : cliquez une ligne prioritaire, puis consultez le tableau pour le détail.'
    }),
    managerHost,
    pilotHost,
    matrixSection,
    insightsHost,
    analysisHost,
    register,
    priorityHost,
    secondaryDetails,
    iaHost
  );
  return page;
}
