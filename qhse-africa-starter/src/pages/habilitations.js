/**
 * Module Habilitations — pilotage conformité opérationnelle (terrain / industrie).
 * Liste chargée via GET /api/habilitations ; exports locaux CSV / PDF.
 */

import { ensureHabilitationsStyles } from '../components/habilitationsStyles.js';
import {
  HABILITATIONS_STATUS_LABEL as STATUS_LABEL,
  computeHabilitationsKpis,
  computeHabilitationsBySite,
  computeHabilitationsByService,
  habDaysUntil
} from '../data/habilitationsDemo.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import {
  sortHabilitationsByCriticality,
  habRowIsBlockedCritical
} from '../utils/habilitationsCriticality.js';
import {
  formatHabilitationsFiltersSummary,
  downloadHabilitationsCsv,
  downloadHabilitationsPdf,
  downloadHabilitationsConformitePdf
} from '../services/habilitationsExport.service.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { createEmptyState } from '../utils/designSystem.js';

/**
 * @param {unknown} raw
 * @returns {Record<string, unknown>[]}
 */
function normalizeHabilitationsPayload(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const o = /** @type {Record<string, unknown>} */ (raw);
    const nested = o.items ?? o.data ?? o.habilitations ?? o.rows;
    if (Array.isArray(nested)) return nested;
  }
  return [];
}

/**
 * @param {Record<string, unknown>} api
 */
function mapApiHabilitation(api) {
  const user = api.user && typeof api.user === 'object' ? api.user : {};
  const site = api.siteRecord && typeof api.siteRecord === 'object' ? api.siteRecord : null;
  const uid = typeof user.id === 'string' ? user.id : '';
  const vf = api.validFrom ? String(api.validFrom).slice(0, 10) : '';
  const vu = api.validUntil ? String(api.validUntil).slice(0, 10) : '';
  const until = api.validUntil ? new Date(String(api.validUntil)) : null;
  const untilOk = until && !Number.isNaN(until.getTime()) ? until : null;
  const days =
    untilOk != null
      ? Math.ceil((untilOk.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 9999;

  let statut = 'valide';
  const st = String(api.status ?? 'active').toLowerCase();
  if (st === 'expiree' || st === 'expired') statut = 'expiree';
  else if (st === 'suspendue' || st === 'suspended') statut = 'suspendue';
  else if (st === 'en_attente' || st === 'pending') statut = 'en_attente';
  else if (st === 'incomplete') statut = 'incomplete';
  else if (st === 'expire_bientot') statut = 'expire_bientot';
  else if (st === 'active' || st === 'valide') {
    if (untilOk && untilOk < new Date()) statut = 'expiree';
    else if (days >= 0 && days <= 30) statut = 'expire_bientot';
    else statut = 'valide';
  }

  const hasDoc =
    api.justificatif === true ||
    api.hasDocument === true ||
    (typeof api.documentUrl === 'string' && api.documentUrl.length > 0);

  return {
    id: String(api.id ?? ''),
    _userId: uid,
    collaborateur:
      (typeof user.name === 'string' && user.name) ||
      (typeof user.email === 'string' && user.email) ||
      '—',
    entreprise: '—',
    matricule: uid.length >= 8 ? uid.slice(-8) : uid || '—',
    poste: typeof user.role === 'string' && user.role ? user.role : '—',
    service: '—',
    site: site && typeof site.name === 'string' ? site.name : '—',
    type: typeof api.type === 'string' ? api.type : '—',
    niveau: api.level != null ? String(api.level) : '',
    delivrance: vf || '—',
    expiration: vu || '—',
    organisme: typeof api.organisme === 'string' ? api.organisme : '',
    justificatif: hasDoc,
    statut,
    remarques: typeof api.remarques === 'string' ? api.remarques : typeof api.notes === 'string' ? api.notes : ''
  };
}

function daysUntil(dateIso) {
  return habDaysUntil(dateIso);
}

/**
 * @param {string} expirationStr
 * @param {number} d — jours jusqu’à expiration (`habDaysUntil`)
 */
function getDateClass(expirationStr, d) {
  const s = String(expirationStr ?? '').trim();
  if (!s || s === '—') return '';
  if (d < 0) return 'hab-date--expired';
  if (d <= 30) return 'hab-date--warning';
  return 'hab-date--ok';
}

function computeKpis(rows) {
  return computeHabilitationsKpis(rows);
}

function statusClass(st) {
  if (st === 'expire_bientot') return 'expire-bientot';
  if (st === 'expiree') return 'expiree';
  if (st === 'en_attente') return 'en-attente';
  if (st === 'suspendue') return 'suspendue';
  if (st === 'incomplete') return 'incomplete';
  return 'valide';
}

/** Icône lisible + statut (badges pilotage terrain). */
function statusIcon(statut) {
  if (statut === 'expiree') return '⛔';
  if (statut === 'expire_bientot') return '⏱';
  if (statut === 'incomplete') return '◆';
  if (statut === 'suspendue') return '⏸';
  if (statut === 'en_attente') return '◷';
  return '✓';
}

function rowTableClass(r) {
  if (r.statut === 'expiree' || daysUntil(r.expiration) < 0) return 'hab-tr--critical';
  const d = daysUntil(r.expiration);
  if (d <= 30 || r.statut === 'expire_bientot' || !r.justificatif || r.statut === 'suspendue')
    return 'hab-tr--warn';
  return '';
}

function mobileCardClass(r) {
  const t = rowTableClass(r);
  if (t === 'hab-tr--critical') return 'hab-mobile-card--critical';
  if (t === 'hab-tr--warn') return 'hab-mobile-card--warn';
  return '';
}

export function renderHabilitations() {
  ensureHabilitationsStyles();
  const page = document.createElement('section');
  page.className = 'page-stack page-stack--premium-saas habilitations-page';

  const dataState = { rows: [], loading: true, error: null };

  function allRows() {
    return dataState.rows;
  }

  async function loadHabilitations() {
    dataState.loading = true;
    dataState.error = null;
    render();
    try {
      const res = await qhseFetch(withSiteQuery('/api/habilitations'));
      const rawBody = res.ok
        ? await res.json().catch(() => [])
        : await res.json().catch(() => ({}));

      if (!res.ok) {
        const j = rawBody && typeof rawBody === 'object' ? /** @type {Record<string, unknown>} */ (rawBody) : {};
        const apiMsg = typeof j.error === 'string' && j.error.trim() ? j.error.trim() : '';
        let msg = apiMsg || `Erreur serveur (${res.status})`;
        if (res.status === 401) msg = 'Session expirée — reconnectez-vous pour voir les habilitations.';
        if (res.status === 403) msg = 'Accès au registre des habilitations refusé pour ce profil.';
        dataState.error = new Error(msg);
        dataState.rows = [];
        showToast(msg, res.status === 401 || res.status === 403 ? 'warning' : 'error');
        return;
      }

      const list = normalizeHabilitationsPayload(rawBody);
      dataState.rows = list.map((item) =>
        mapApiHabilitation(item && typeof item === 'object' ? /** @type {Record<string, unknown>} */ (item) : {})
      );
      if (!state.selectedId && dataState.rows[0]) {
        state.selectedId = dataState.rows[0].id;
      }
    } catch (e) {
      const msg =
        e instanceof Error && e.message
          ? e.message
          : 'Réseau indisponible — impossible de charger les habilitations.';
      dataState.error = e instanceof Error ? e : new Error(msg);
      dataState.rows = [];
      showToast(msg, 'error');
    } finally {
      dataState.loading = false;
      render();
    }
  }

  /** En-tête éditorial — un seul bloc titre, hiérarchie SaaS */
  const pageHead = document.createElement('header');
  pageHead.className = 'hab-page-head';
  pageHead.innerHTML = `
    <div class="hab-page-head__top">
      <p class="section-kicker hab-page-head__kicker">Conformité opérationnelle</p>
      <span class="hab-page-head__badge" data-hab-scope-badge>Périmètre : toutes les lignes</span>
    </div>
    <h1 class="hab-page-head__title">Habilitations</h1>
    <p class="hab-page-head__lead">
      Pilotage terrain : priorités opérationnelles, exposition multi-sites et registre audit-ready — sans changer vos flux métier.
    </p>
  `;

  const state = {
    tab: 'registre',
    q: '',
    site: '',
    service: '',
    statut: '',
    entreprise: '',
    type: '',
    expiration: '',
    subcontractorOnly: false,
    selectedId: null
  };

  try {
    const intentRaw = localStorage.getItem('qhse.dashboard.intent');
    if (intentRaw) {
      const intent = JSON.parse(intentRaw);
      if (intent?.module === 'habilitations' && intent?.filter) {
        if (intent.filter === 'expired') state.statut = 'expiree';
        if (intent.filter === 'expiring_30') state.statut = 'expire_bientot';
        if (intent.filter === 'subcontractors_incomplete') {
          state.subcontractorOnly = true;
          state.tab = 'alertes';
        }
      }
      localStorage.removeItem('qhse.dashboard.intent');
    }
  } catch {
    /* ignore */
  }

  /** A / B / C regroupés dans un seul « cockpit » visuel (niveau premium) */
  const riskBand = document.createElement('section');
  riskBand.id = 'habilitations-cockpit-anchor';
  riskBand.className = 'hab-cockpit__block hab-cockpit__block--risk';
  riskBand.setAttribute('aria-labelledby', 'hab-cockpit-risk-title');

  const kpiSecondary = document.createElement('section');
  kpiSecondary.className = 'hab-cockpit__block hab-cockpit__block--kpi';
  kpiSecondary.setAttribute('aria-labelledby', 'hab-cockpit-kpi-title');

  const expoBand = document.createElement('section');
  expoBand.className = 'hab-cockpit__block hab-cockpit__block--expo';
  expoBand.setAttribute('aria-labelledby', 'hab-cockpit-expo-title');

  const cockpit = document.createElement('article');
  cockpit.className = 'content-card card-soft hab-cockpit';
  cockpit.append(riskBand, kpiSecondary, expoBand);

  const exportBar = document.createElement('div');
  exportBar.className = 'hab-export-bar hab-export-bar--inline';

  const tabs = document.createElement('div');
  tabs.className = 'hab-tabs hab-tabs--segmented';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Vues du module habilitations');
  const views = [
    { id: 'registre', label: 'Registre' },
    { id: 'fiche', label: 'Fiche' },
    { id: 'conformite', label: 'Conformité' },
    { id: 'alertes', label: 'Alertes' }
  ];
  views.forEach((v) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `hab-tab-btn${state.tab === v.id ? ' is-active' : ''}`;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', state.tab === v.id ? 'true' : 'false');
    b.setAttribute('id', `hab-tab-${v.id}`);
    b.setAttribute('aria-controls', `hab-panel-${v.id}`);
    b.textContent = v.label;
    b.addEventListener('click', () => {
      state.tab = v.id;
      render();
    });
    tabs.append(b);
  });

  const viewHost = document.createElement('div');
  viewHost.className = 'hab-main-host';

  /** Barre de commande : navigation + exports sur une ligne */
  const commandBar = document.createElement('div');
  commandBar.className = 'hab-command-bar';
  commandBar.append(tabs, exportBar);

  function currentRows() {
    return allRows().filter((r) => {
      const text = `${r.collaborateur} ${r.entreprise} ${r.poste} ${r.type} ${r.site}`.toLowerCase();
      if (state.q && !text.includes(state.q.toLowerCase())) return false;
      if (state.site && r.site !== state.site) return false;
      if (state.service && r.service !== state.service) return false;
      if (state.statut && r.statut !== state.statut) return false;
      if (state.entreprise && r.entreprise !== state.entreprise) return false;
      if (state.type && r.type !== state.type) return false;
      const d = daysUntil(r.expiration);
      if (state.expiration === 'expired' && d >= 0) return false;
      if (state.expiration === 'lt30' && !(d >= 0 && d <= 30)) return false;
      if (state.expiration === '30_90' && !(d > 30 && d <= 90)) return false;
      if (state.expiration === 'gt90' && !(d > 90)) return false;
      if (state.subcontractorOnly && r.entreprise === 'QHSE Africa') return false;
      if (state.subcontractorOnly && !['incomplete', 'expiree', 'suspendue'].includes(r.statut)) {
        return false;
      }
      return true;
    });
  }

  function filtersText() {
    return formatHabilitationsFiltersSummary(state);
  }

  function resetHabilitationsFilters() {
    state.q = '';
    state.site = '';
    state.service = '';
    state.statut = '';
    state.entreprise = '';
    state.type = '';
    state.expiration = '';
    state.subcontractorOnly = false;
    render();
  }

  /** Badge périmètre : distinguer « tout le registre » vs filtres actifs */
  function habFiltersActive() {
    return !!(
      state.q ||
      state.site ||
      state.service ||
      state.statut ||
      state.entreprise ||
      state.type ||
      state.expiration ||
      state.subcontractorOnly
    );
  }

  function rowChipHtml(r) {
    return `<span class="hab-chip hab-chip--${statusClass(r.statut)}"><span class="hab-chip-ic" aria-hidden="true">${statusIcon(r.statut)}</span>${STATUS_LABEL[r.statut]}</span>`;
  }

  function renderRiskOperational(rows) {
    const k = computeKpis(rows);
    const blocked = rows.filter((r) => habRowIsBlockedCritical(r)).length;
    riskBand.innerHTML = `
        <div class="hab-section-head hab-section-head--risk">
          <h2 id="hab-cockpit-risk-title" class="hab-section-head__title">Risque opérationnel immédiat</h2>
          <p class="hab-section-head__desc">À traiter en premier sur le périmètre filtré — avant le détail du registre.</p>
        </div>
        <div class="hab-risk-grid">
          <div class="hab-risk-card">
            <span class="hab-risk-card__dot hab-risk-card__dot--crit" aria-hidden="true"></span>
            <span class="hab-risk-card__k">Habilitations expirées</span>
            <strong class="hab-risk-card__v">${k.expirees}</strong>
            <span class="hab-risk-card__hint">Levée de blocage selon procédure site</span>
          </div>
          <div class="hab-risk-card hab-risk-card--warn">
            <span class="hab-risk-card__dot hab-risk-card__dot--warn" aria-hidden="true"></span>
            <span class="hab-risk-card__k">Expiration sous 30 jours</span>
            <strong class="hab-risk-card__v hab-risk-card__v--warn">${k.exp30}</strong>
            <span class="hab-risk-card__hint">Recyclage / renouvellement</span>
          </div>
          <div class="hab-risk-card">
            <span class="hab-risk-card__dot hab-risk-card__dot--crit" aria-hidden="true"></span>
            <span class="hab-risk-card__k">Collaborateurs non conformes</span>
            <strong class="hab-risk-card__v">${k.nonConformes}</strong>
            <span class="hab-risk-card__hint">Expiré, suspendu ou incomplet</span>
          </div>
          <div class="hab-risk-card">
            <span class="hab-risk-card__dot hab-risk-card__dot--crit" aria-hidden="true"></span>
            <span class="hab-risk-card__k">Activités critiques bloquées</span>
            <strong class="hab-risk-card__v">${blocked}</strong>
            <span class="hab-risk-card__hint">Bloquées sur périmètre sélectionné</span>
          </div>
          <div class="hab-risk-card hab-risk-card--warn">
            <span class="hab-risk-card__dot hab-risk-card__dot--warn" aria-hidden="true"></span>
            <span class="hab-risk-card__k">Justificatifs manquants</span>
            <strong class="hab-risk-card__v hab-risk-card__v--warn">${k.missingDocs}</strong>
            <span class="hab-risk-card__hint">Preuve avant audit terrain</span>
          </div>
          <div class="hab-risk-card hab-risk-card--warn">
            <span class="hab-risk-card__dot hab-risk-card__dot--warn" aria-hidden="true"></span>
            <span class="hab-risk-card__k">Sous-traitants incomplets</span>
            <strong class="hab-risk-card__v hab-risk-card__v--warn">${k.sousTraitantsIncomplets}</strong>
            <span class="hab-risk-card__hint">Contrôle documentaire prioritaire</span>
          </div>
        </div>
    `;
  }

  function renderKpisSecondary(rows) {
    const k = computeKpis(rows);
    kpiSecondary.innerHTML = `
      <div class="hab-section-head">
        <h3 id="hab-cockpit-kpi-title" class="hab-section-head__title hab-section-head__title--sm">Vue d’ensemble</h3>
        <p class="hab-section-head__desc">Indicateurs agrégés sur le même périmètre que les cartes ci-dessus.</p>
      </div>
      <div class="hab-kpis hab-kpis--secondary">
        <div class="hab-kpi hab-kpi--lite"><span class="hab-kpi__k">Habilitations actives</span><strong class="hab-kpi__v hab-kpi__v--green">${k.actifs}</strong></div>
        <div class="hab-kpi hab-kpi--lite"><span class="hab-kpi__k">Taux conformité</span><strong class="hab-kpi__v ${k.taux >= 80 ? 'hab-kpi__v--green' : 'hab-kpi__v--orange'}">${k.taux}%</strong></div>
        <div class="hab-kpi hab-kpi--lite"><span class="hab-kpi__k">Suspensions</span><strong class="hab-kpi__v hab-kpi__v--orange">${rows.filter((r) => r.statut === 'suspendue').length}</strong></div>
        <div class="hab-kpi hab-kpi--lite"><span class="hab-kpi__k">En attente validation</span><strong class="hab-kpi__v">${rows.filter((r) => r.statut === 'en_attente').length}</strong></div>
      </div>
    `;
  }

  function renderExpositionTerrain(rows) {
    const bySite = computeHabilitationsBySite(rows);
    const atRiskSites = bySite.filter((b) => b.score < 70 && b.total > 0);
    const nonConfSites = bySite.filter((b) => b.nonConf > 0);
    const blocked = rows.filter((r) => habRowIsBlockedCritical(r)).length;
    const k = computeKpis(rows);
    const topRisky =
      nonConfSites.length > 0
        ? nonConfSites
            .sort((a, b) => a.score - b.score)
            .slice(0, 3)
            .map((s) => `${s.site} (${s.nonConf} NC)`)
            .join(' · ')
        : 'Aucun écart consolidé sur ce filtre';
    expoBand.innerHTML = `
      <div class="hab-section-head">
        <h3 id="hab-cockpit-expo-title" class="hab-section-head__title hab-section-head__title--accent">Exposition terrain</h3>
        <p class="hab-section-head__desc">Lecture par site et sous-traitance, alignée aux revues QHSE terrain.</p>
      </div>
      <div class="hab-expo-grid">
        <div class="hab-expo-card">
          <span class="hab-expo-card__k">Équipes / sites non conformes</span>
          <span class="hab-expo-card__main">${nonConfSites.length} site(s) avec écarts</span>
          <div class="hab-expo-pill">${nonConfSites.length ? topRisky : 'RAS filtre actuel'}</div>
        </div>
        <div class="hab-expo-card">
          <span class="hab-expo-card__k">Activités critiques bloquées</span>
          <span class="hab-expo-card__main">${blocked} dossier(s)</span>
          <div class="hab-expo-pill hab-expo-pill--orange">Vérifier levées / retraits</div>
        </div>
        <div class="hab-expo-card">
          <span class="hab-expo-card__k">Sous-traitants incomplets</span>
          <span class="hab-expo-card__main">${k.sousTraitantsIncomplets} à finaliser</span>
          <div class="hab-expo-pill hab-expo-pill--orange">Contrôles documentaires</div>
        </div>
        <div class="hab-expo-card">
          <span class="hab-expo-card__k">Zones / sites à risque (&lt; 70 %)</span>
          <span class="hab-expo-card__main">${atRiskSites.length} site(s)</span>
          <div class="hab-expo-pill">${atRiskSites.length ? atRiskSites.map((s) => `${s.site} ${s.score}%`).join(' · ') : 'Scores OK sur filtre'}</div>
        </div>
      </div>
    `;
  }

  function bindExportBar() {
    exportBar.replaceChildren();
    const label = document.createElement('span');
    label.className = 'hab-export-bar__label';
    label.textContent = 'Exports';
    const g1 = document.createElement('div');
    g1.className = 'hab-export-group';
    const g2 = document.createElement('div');
    g2.className = 'hab-export-group';
    const mk = (txt, cls, fn) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `btn ${cls}`;
      b.textContent = txt;
      b.addEventListener('click', () => void fn());
      return b;
    };
    const rows = currentRows();
    const ft = filtersText();

    g1.append(
      mk('CSV registre', 'btn-secondary', async () => {
        try {
          downloadHabilitationsCsv(rows, `habilitations_registre_${Date.now()}`);
          showToast('Export CSV téléchargé.', 'info');
        } catch {
          showToast('Échec export CSV.', 'warning');
        }
      }),
      mk('PDF registre', 'btn-primary', async () => {
        try {
          await downloadHabilitationsPdf({
            title: 'Registre habilitations',
            subtitle: 'Synthèse opérationnelle — périmètre filtré',
            filtersText: ft,
            rows,
            filename: `habilitations_registre_${Date.now()}`
          });
        } catch (e) {
          console.error(e);
        }
      })
    );

    const expired = rows.filter((r) => r.statut === 'expiree' || daysUntil(r.expiration) < 0);
    const lt30 = rows.filter((r) => {
      const d = daysUntil(r.expiration);
      return d >= 0 && d <= 30;
    });

    g2.append(
      mk('CSV expirées', 'btn-ghost', () => {
        downloadHabilitationsCsv(expired, `habilitations_expirees_${Date.now()}`);
        showToast('Export expirées (CSV).', 'info');
      }),
      mk('CSV < 30 j', 'btn-ghost', async () => {
        downloadHabilitationsCsv(lt30, `habilitations_exp30_${Date.now()}`);
        showToast('Export échéances < 30 j (CSV).', 'info');
      }),
      mk('PDF alertes', 'btn-ghost', async () => {
        try {
          const enriched = buildAlertRowList(rows);
          await downloadHabilitationsPdf({
            title: 'Rapport alertes habilitations',
            filtersText: ft,
            rows: enriched,
            filename: `habilitations_alertes_${Date.now()}`
          });
        } catch (e) {
          console.error(e);
        }
      }),
      mk('PDF conformité', 'btn-ghost', async () => {
        try {
          const k = computeKpis(rows);
          await downloadHabilitationsConformitePdf({
            filtersText: ft,
            kpis: k,
            bySite: computeHabilitationsBySite(rows),
            rows,
            filename: `conformite_hab_${Date.now()}`
          });
        } catch (e) {
          console.error(e);
        }
      }),
      mk('PDF fiche', 'btn-ghost', async () => {
        try {
          const hit =
            allRows().find((r) => r.id === state.selectedId) || rows[0] || allRows()[0];
          if (!hit) return;
          const pr = allRows().filter((r) => r._userId === hit._userId);
          await downloadHabilitationsPdf({
            title: `Fiche habilitations — ${hit.collaborateur}`,
            subtitle: `${hit.poste} · ${hit.entreprise} · ${hit.site}`,
            filtersText: `${ft} · Fiche matricule ${hit.matricule}`,
            rows: pr,
            filename: `fiche_${hit.matricule}_${Date.now()}`
          });
        } catch (e) {
          console.error(e);
        }
      })
    );

    exportBar.append(label, g1, g2);
  }

  /** Lignes « alertes » aplaties pour export PDF (mêmes colonnes). */
  function buildAlertRowList(rows) {
    const enriched = rows.map((r) => ({ ...r, d: daysUntil(r.expiration) }));
    const expired = enriched.filter((r) => r.statut === 'expiree' || r.d < 0);
    const lt7 = enriched.filter((r) => r.d >= 0 && r.d <= 7);
    const lt30 = enriched.filter((r) => r.d > 7 && r.d <= 30);
    const noDoc = enriched.filter((r) => !r.justificatif);
    const merged = [...expired, ...lt7, ...lt30, ...noDoc];
    const seen = new Set();
    return merged.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }

  function renderFilters() {
    const rows = allRows();
    const sites = [...new Set(rows.map((r) => r.site))];
    const services = [...new Set(rows.map((r) => r.service))];
    const entreprises = [...new Set(rows.map((r) => r.entreprise))];
    const types = [...new Set(rows.map((r) => r.type))];
    return `
      <div class="hab-filters">
        <input class="control-input" data-hab-filter="q" placeholder="Nom, poste, habilitation…" value="${state.q.replace(/"/g, '&quot;')}" />
        <select class="control-select" data-hab-filter="site"><option value="">Tous sites</option>${sites.map((s) => `<option value="${s.replace(/"/g, '&quot;')}" ${state.site === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
        <select class="control-select" data-hab-filter="service"><option value="">Tous services</option>${services.map((s) => `<option value="${s.replace(/"/g, '&quot;')}" ${state.service === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
        <select class="control-select" data-hab-filter="statut"><option value="">Tous statuts</option>${Object.entries(STATUS_LABEL).map(([k, v]) => `<option value="${k}" ${state.statut === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
        <select class="control-select" data-hab-filter="entreprise"><option value="">Toutes entreprises</option>${entreprises.map((e) => `<option value="${e.replace(/"/g, '&quot;')}" ${state.entreprise === e ? 'selected' : ''}>${e}</option>`).join('')}</select>
        <select class="control-select" data-hab-filter="type"><option value="">Tous types</option>${types.map((t) => `<option value="${t.replace(/"/g, '&quot;')}" ${state.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
        <select class="control-select" data-hab-filter="expiration"><option value="">Toutes expirations</option><option value="expired" ${state.expiration === 'expired' ? 'selected' : ''}>Expirées</option><option value="lt30" ${state.expiration === 'lt30' ? 'selected' : ''}>Expire &lt; 30 jours</option><option value="30_90" ${state.expiration === '30_90' ? 'selected' : ''}>Expire 30–90 jours</option><option value="gt90" ${state.expiration === 'gt90' ? 'selected' : ''}>Valide &gt; 90 jours</option></select>
      </div>
    `;
  }

  function attachFilterListeners(card) {
    card.querySelectorAll('[data-hab-filter]').forEach((el) => {
      el.addEventListener('input', () => {
        const k = el.getAttribute('data-hab-filter');
        state[k] = el.value || '';
        render();
      });
      el.addEventListener('change', () => {
        const k = el.getAttribute('data-hab-filter');
        state[k] = el.value || '';
        render();
      });
    });
  }

  function renderRegistre(rows) {
    const sorted = sortHabilitationsByCriticality(rows);
    const card = document.createElement('article');
    card.className = 'content-card card-soft';

    let tbodyRows = '';
    if (dataState.loading) {
      tbodyRows = `<tr class="hab-tr--loading"><td colspan="11"><p class="ptw-mini">Chargement des habilitations…</p></td></tr>`;
    } else if (dataState.error && !allRows().length) {
      tbodyRows = `<tr class="hab-tr--error"><td colspan="11"><p class="ptw-mini">${
        dataState.error instanceof Error ? escapeHtml(dataState.error.message) : 'Registre indisponible.'
      }</p></td></tr>`;
    } else if (!sorted.length) {
      const storeEmpty = allRows().length === 0;
      const narrowedByFilters = !storeEmpty && habFiltersActive();
      if (storeEmpty || narrowedByFilters) {
        tbodyRows = `<tr class="hab-tr--empty"><td colspan="11" class="hab-empty-cell" data-hab-empty-desktop></td></tr>`;
      } else {
        tbodyRows = `<tr><td colspan="11"><p class="ptw-mini">Aucune habilitation sur ce périmètre.</p></td></tr>`;
      }
    } else {
      tbodyRows = sorted
        .map((r) => {
          const alertIc =
            r.statut === 'expiree' || daysUntil(r.expiration) < 0
              ? '<span class="hab-alert-ic" title="Critique">⚠</span>'
              : !r.justificatif
                ? '<span class="hab-alert-ic" title="Justificatif">📄</span>'
                : '';
          return `
              <tr class="${rowTableClass(r)}">
                <td>${alertIc}</td>
                <td><button type="button" class="hab-row-btn" data-hab-open="${escapeHtml(r.id)}">${escapeHtml(r.collaborateur)}</button></td>
                <td>${escapeHtml(r.entreprise)}</td>
                <td>${escapeHtml(r.poste)}</td>
                <td>${escapeHtml(r.site)}</td>
                <td>${escapeHtml(r.type)}</td>
                <td>${escapeHtml(r.niveau)}</td>
                <td class="${getDateClass(r.expiration, daysUntil(r.expiration))}">${escapeHtml(r.expiration)}</td>
                <td><span class="hab-status-cell">${rowChipHtml(r)}</span></td>
                <td><strong>${r.justificatif ? '✓ OK' : '✕ Manquant'}</strong></td>
                <td><div class="hab-actions"><button type="button" class="btn btn-secondary" data-hab-open="${escapeHtml(r.id)}">Voir fiche</button></div></td>
              </tr>`;
        })
        .join('');
    }

    let mobileBlocks = '';
    if (dataState.loading) {
      mobileBlocks = `<article class="hab-mobile-card"><p class="ptw-mini">Chargement des habilitations…</p></article>`;
    } else if (dataState.error && !allRows().length) {
      mobileBlocks = `<article class="hab-mobile-card"><p class="ptw-mini">${
        dataState.error instanceof Error ? escapeHtml(dataState.error.message) : 'Registre indisponible.'
      }</p></article>`;
    } else if (!sorted.length) {
      const storeEmpty = allRows().length === 0;
      const narrowedByFilters = !storeEmpty && habFiltersActive();
      if (storeEmpty || narrowedByFilters) {
        mobileBlocks = `<article class="hab-mobile-card hab-mobile-card--empty" data-hab-empty-mobile></article>`;
      } else {
        mobileBlocks = `<article class="hab-mobile-card"><p class="ptw-mini">Aucune habilitation sur ce périmètre.</p></article>`;
      }
    } else {
      mobileBlocks = sorted
        .map((r) => {
          const warn = rowTableClass(r) !== '';
          return `
          <article class="hab-mobile-card ${mobileCardClass(r)}">
            <div class="hab-mobile-head">
              <div>${warn ? '<span class="hab-mobile-warn-ic" aria-hidden="true">⚠</span>' : ''}<button type="button" class="hab-row-btn" data-hab-open="${escapeHtml(r.id)}">${escapeHtml(r.collaborateur)}</button></div>
              ${rowChipHtml(r)}
            </div>
            <div class="hab-mobile-meta">
              <div><strong>Entreprise:</strong> ${escapeHtml(r.entreprise)}</div>
              <div><strong>Poste:</strong> ${escapeHtml(r.poste)}</div>
              <div><strong>Site:</strong> ${escapeHtml(r.site)}</div>
              <div><strong>Type:</strong> ${escapeHtml(r.type)}</div>
              <div><strong>Niveau:</strong> ${escapeHtml(r.niveau)}</div>
              <div><strong>Expiration:</strong> <span class="${getDateClass(r.expiration, daysUntil(r.expiration))}">${escapeHtml(r.expiration)}</span></div>
            </div>
            <div class="hab-actions">
              <span class="hab-pill">${r.justificatif ? 'Justificatif OK' : 'Justificatif manquant'}</span>
              <button type="button" class="btn btn-primary" data-hab-open="${escapeHtml(r.id)}">Voir fiche</button>
            </div>
          </article>`;
        })
        .join('');
    }

    card.innerHTML = `
      <div class="content-card-head"><div><div class="section-kicker">Registre</div><h3>Habilitations terrain & sous-traitants</h3><p class="ptw-mini">Tri par criticité par défaut (expiré et urgence calendaire en tête).</p></div></div>
      ${renderFilters()}
      <div class="hab-table-wrap">
        <table class="hab-table">
          <thead><tr><th></th><th>Collaborateur</th><th>Entreprise</th><th>Poste</th><th>Site</th><th>Habilitation</th><th>Niveau</th><th>Expiration</th><th>Statut</th><th>Justificatif</th><th>Actions</th></tr></thead>
          <tbody>
            ${tbodyRows}
          </tbody>
        </table>
      </div>
      <div class="hab-mobile-list">
        ${mobileBlocks}
      </div>
    `;
    card.querySelectorAll('[data-hab-open]').forEach((b) => {
      b.addEventListener('click', () => {
        state.selectedId = b.getAttribute('data-hab-open');
        state.tab = 'fiche';
        render();
      });
    });
    const desktopEmpty = card.querySelector('[data-hab-empty-desktop]');
    const mobileEmpty = card.querySelector('[data-hab-empty-mobile]');
    if (desktopEmpty || mobileEmpty) {
      const storeEmpty = allRows().length === 0;
      const desktopEs = storeEmpty
        ? createEmptyState(
            '\u{1F4CB}',
            'Aucune habilitation enregistrée',
            'Le registre est vide pour ce périmètre ou les données ne sont pas encore synchronisées.',
            'Actualiser le registre',
            () => void loadHabilitations()
          )
        : createEmptyState(
            '\u25CE',
            'Aucun résultat sur ce périmètre',
            'Élargissez la recherche ou réinitialisez les filtres pour afficher à nouveau les lignes du registre.',
            'Réinitialiser les filtres',
            resetHabilitationsFilters
          );
      const mobileEs = storeEmpty
        ? createEmptyState(
            '\u{1F4CB}',
            'Aucune habilitation enregistrée',
            'Le registre est vide pour ce périmètre ou les données ne sont pas encore synchronisées.',
            'Actualiser le registre',
            () => void loadHabilitations()
          )
        : createEmptyState(
            '\u25CE',
            'Aucun résultat sur ce périmètre',
            'Élargissez la recherche ou réinitialisez les filtres pour afficher à nouveau les lignes du registre.',
            'Réinitialiser les filtres',
            resetHabilitationsFilters
          );
      desktopEmpty?.append(desktopEs);
      mobileEmpty?.append(mobileEs);
    }
    attachFilterListeners(card);
    return card;
  }

  function renderFiche(rows) {
    const hit =
      allRows().find((r) => r.id === state.selectedId) || rows[0] || allRows()[0];
    if (!hit) {
      const empty = document.createElement('div');
      empty.className = 'content-card card-soft';
      empty.innerHTML =
        '<p class="ptw-mini">Aucune habilitation chargée — vérifiez l’API ou les droits d’accès.</p>';
      return empty;
    }
    const personRows = allRows().filter((r) => r._userId === hit._userId);
    const personAlerts = personRows.filter(
      (r) => r.statut === 'expiree' || r.statut === 'expire_bientot' || r.statut === 'incomplete' || !r.justificatif
    );
    const card = document.createElement('article');
    card.className = 'content-card card-soft';
    card.innerHTML = `
      <div class="content-card-head hab-list-title">
        <div><div class="section-kicker">Fiche collaborateur</div><h3>${hit.collaborateur}</h3><p class="ptw-mini">${hit.poste} · ${hit.service} · ${hit.site}</p></div>
        <button type="button" class="btn btn-secondary" data-hab-export-fiche-pdf>Exporter PDF fiche</button>
      </div>
      <div class="hab-profile">
        <div class="hab-profile-row">
          <div class="hab-profile-item"><div class="hab-profile-k">Entreprise / sous-traitant</div><strong>${hit.entreprise}</strong></div>
          <div class="hab-profile-item"><div class="hab-profile-k">Matricule</div><strong>${hit.matricule}</strong></div>
        </div>
        <div class="hab-profile-row">
          <div class="hab-profile-item"><div class="hab-profile-k">Type d’habilitation</div><strong>${hit.type}</strong></div>
          <div class="hab-profile-item"><div class="hab-profile-k">Niveau</div><strong>${hit.niveau}</strong></div>
        </div>
        <div class="hab-profile-row">
          <div class="hab-profile-item"><div class="hab-profile-k">Date délivrance</div><strong>${hit.delivrance}</strong></div>
          <div class="hab-profile-item"><div class="hab-profile-k">Date expiration</div><strong class="${getDateClass(hit.expiration, daysUntil(hit.expiration))}">${escapeHtml(hit.expiration)}</strong></div>
        </div>
        <div class="hab-profile-row">
          <div class="hab-profile-item"><div class="hab-profile-k">Organisme</div><strong>${hit.organisme}</strong></div>
          <div class="hab-profile-item"><div class="hab-profile-k">Statut</div>${rowChipHtml(hit)}</div>
        </div>
        <div class="hab-profile-item"><div class="hab-profile-k">Remarques</div><strong>${hit.remarques || '—'}</strong></div>
        <div class="hab-profile-item"><div class="hab-profile-k">Justificatif</div><strong>${hit.justificatif ? 'Présent' : 'Manquant'}</strong></div>
      </div>
      <div class="hab-list-title"><h4>Liste des habilitations</h4><span class="hab-pill">${personRows.length} habilitation(s)</span></div>
      <div class="hab-table-wrap">
        <table class="hab-mini-table">
          <thead><tr><th>Type</th><th>Niveau</th><th>Expiration</th><th>Statut</th><th>Justificatif</th></tr></thead>
          <tbody>
            ${sortHabilitationsByCriticality(personRows)
              .map(
                (r) =>
                  `<tr class="${rowTableClass(r)}"><td>${escapeHtml(r.type)}</td><td>${escapeHtml(r.niveau)}</td><td class="${getDateClass(r.expiration, daysUntil(r.expiration))}">${escapeHtml(r.expiration)}</td><td>${rowChipHtml(r)}</td><td>${r.justificatif ? 'OK' : 'Manquant'}</td></tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
      <div class="hab-alert-list">
        ${personAlerts.length ? personAlerts.map((r) => `<article class="hab-alert ${r.statut === 'expiree' || !r.justificatif ? 'hab-alert--high' : 'hab-alert--med'}"><strong>${r.type}</strong> · ${STATUS_LABEL[r.statut]}${!r.justificatif ? ' · justificatif manquant' : ''}</article>`).join('') : '<p class="ptw-mini">Aucune alerte active pour ce collaborateur.</p>'}
      </div>
    `;
    card.querySelector('[data-hab-export-fiche-pdf]')?.addEventListener('click', async () => {
      try {
        await downloadHabilitationsPdf({
          title: `Fiche habilitations — ${hit.collaborateur}`,
          subtitle: `${hit.poste} · ${hit.entreprise}`,
          filtersText: filtersText(),
          rows: personRows,
          filename: `fiche_${hit.matricule}_${Date.now()}`
        });
      } catch (e) {
        console.error(e);
      }
    });
    return card;
  }

  function renderConformite(rows) {
    const card = document.createElement('article');
    card.className = 'content-card card-soft';
    const bars = computeHabilitationsBySite(rows);
    const byService = computeHabilitationsByService(rows);
    const k = computeKpis(rows);
    card.innerHTML = `
      <div class="content-card-head"><div><div class="section-kicker">Conformité globale</div><h3>Vue multi-sites habilitations</h3></div></div>
      <div class="hab-summary-grid">
        <article class="hab-summary-card"><strong>Taux conformité global:</strong> ${k.taux}%</article>
        <article class="hab-summary-card"><strong>Non conformes:</strong> ${k.nonConformes}</article>
        <article class="hab-summary-card"><strong>Justificatifs manquants:</strong> ${k.missingDocs}</article>
        <article class="hab-summary-card"><strong>Sous-traitants incomplets:</strong> ${k.sousTraitantsIncomplets}</article>
      </div>
      <h4>Conformité par site</h4>
      <div class="hab-bars">
        ${bars.map((b) => `
          <div class="hab-bar">
            <div class="hab-bar-top"><span>${b.site}</span><strong>${b.score}%</strong></div>
            <div class="hab-bar-track"><div class="hab-bar-fill" style="width:${b.score}%"></div></div>
          </div>
        `).join('')}
      </div>
      <h4>Conformité par service</h4>
      <div class="hab-bars">
        ${byService.map((b) => `
          <div class="hab-bar">
            <div class="hab-bar-top"><span>${b.service}</span><strong>${b.score}%</strong></div>
            <div class="hab-bar-track"><div class="hab-bar-fill" style="width:${b.score}%"></div></div>
          </div>
        `).join('')}
      </div>
    `;
    return card;
  }

  function renderAlertes(rows) {
    const enriched = rows.map((r) => ({ ...r, d: daysUntil(r.expiration) }));
    const expired = sortHabilitationsByCriticality(enriched.filter((r) => r.statut === 'expiree' || r.d < 0));
    const lt7 = sortHabilitationsByCriticality(
      enriched.filter((r) => r.d >= 0 && r.d <= 7 && r.statut !== 'expiree')
    );
    const lt30only = sortHabilitationsByCriticality(enriched.filter((r) => r.d > 7 && r.d <= 30));
    const missingDocs = sortHabilitationsByCriticality(enriched.filter((r) => !r.justificatif));

    function alertItem(a, tone) {
      const cls = tone === 'high' ? 'hab-alert--high' : tone === 'med' ? 'hab-alert--med' : 'hab-alert--low';
      return `
        <article class="hab-alert ${cls}">
          <strong>${a.collaborateur}</strong> · ${a.site} · ${a.type}
          <div class="ptw-mini">${a.entreprise} · ${STATUS_LABEL[a.statut]} · J-${a.d}${!a.justificatif ? ' · justificatif manquant' : ''}</div>
        </article>`;
    }

    const card = document.createElement('article');
    card.className = 'content-card card-soft';
    card.innerHTML = `
      <div class="content-card-head"><div><div class="section-kicker">Alertes priorisées</div><h3>Échéances & conformité</h3><p class="ptw-mini">Lecture obligatoire terrain : expiré → 7 j → 30 j → preuve manquante.</p></div></div>
      <div class="hab-alert-section">
        <h4 class="hab-alert-section__title hab-alert-section__title--crit">⛔ Expirées / dépassées (${expired.length})</h4>
        <div class="hab-alert-list">${expired.length ? expired.map((a) => alertItem(a, 'high')).join('') : '<p class="ptw-mini">Aucune habilitation expirée sur ce périmètre.</p>'}</div>
      </div>
      <div class="hab-alert-section">
        <h4 class="hab-alert-section__title hab-alert-section__title--urg">⏱ Expirent sous 7 jours (${lt7.length})</h4>
        <div class="hab-alert-list">${lt7.length ? lt7.map((a) => alertItem(a, 'high')).join('') : '<p class="ptw-mini">Aucune échéance critique sous 7 jours.</p>'}</div>
      </div>
      <div class="hab-alert-section">
        <h4 class="hab-alert-section__title hab-alert-section__title--urg">⌛ Expirent entre 8 et 30 jours (${lt30only.length})</h4>
        <div class="hab-alert-list">${lt30only.length ? lt30only.map((a) => alertItem(a, 'med')).join('') : '<p class="ptw-mini">Aucune échéance dans cette fenêtre.</p>'}</div>
      </div>
      <div class="hab-alert-section">
        <h4 class="hab-alert-section__title hab-alert-section__title--std">📄 Sans justificatif (${missingDocs.length})</h4>
        <div class="hab-alert-list">${missingDocs.length ? missingDocs.map((a) => alertItem(a, 'med')).join('') : '<p class="ptw-mini">Tous les dossiers ont un justificatif.</p>'}</div>
      </div>
    `;
    return card;
  }

  function render() {
    tabs.querySelectorAll('.hab-tab-btn').forEach((b, i) => {
      const active = views[i].id === state.tab;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    const rows = currentRows();
    const scopeBadge = pageHead.querySelector('[data-hab-scope-badge]');
    if (scopeBadge) {
      if (dataState.loading) {
        scopeBadge.textContent = 'Chargement du registre…';
      } else if (dataState.error) {
        scopeBadge.textContent = 'Registre indisponible — données non chargées';
      } else {
        scopeBadge.textContent = habFiltersActive()
          ? `${rows.length} résultat(s) — ${filtersText()}`
          : `${rows.length} habilitation(s) — registre affiché`;
      }
    }
    renderRiskOperational(rows);
    renderKpisSecondary(rows);
    renderExpositionTerrain(rows);
    bindExportBar();

    viewHost.replaceChildren();
    const panel = document.createElement('div');
    panel.className = 'hab-tab-panel';
    panel.id = `hab-panel-${state.tab}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `hab-tab-${state.tab}`);

    if (state.tab === 'registre') panel.append(renderRegistre(rows));
    else if (state.tab === 'fiche') panel.append(renderFiche(rows));
    else if (state.tab === 'conformite') panel.append(renderConformite(rows));
    else panel.append(renderAlertes(rows));

    viewHost.append(panel);
  }

  page.append(pageHead, cockpit, commandBar, viewHost);
  render();
  void loadHabilitations();
  return page;
}
