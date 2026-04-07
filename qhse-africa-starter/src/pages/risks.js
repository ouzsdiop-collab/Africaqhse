import { risks as mockRisks } from '../data/mock.js';
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
import { pushCustomRiskTitle } from '../utils/riskIncidentLinks.js';
import { getMergedIncidentsForRisk } from '../utils/riskMockIncidentLinks.js';
import { createRiskManagerReadingCard } from '../components/riskManagerReading.js';
import { activityLogStore } from '../data/activityLog.js';
import { appState } from '../utils/state.js';
import { createSimpleModeGuide } from '../utils/simpleModeGuide.js';
import {
  suggestRiskCausesImpacts,
  buildActionDefaultsFromCriticalRisk
} from '../utils/qhseAssistantFormSuggestions.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { createPermit } from '../services/ptw.service.js';
import { linkModules } from '../services/moduleLinks.service.js';

const CATEGORY_OPTIONS = ['Sécurité', 'Environnement', 'Qualité'];
const LEVEL_OPTIONS = [
  { value: 'élevée', label: 'Élevée' },
  { value: 'moyenne', label: 'Moyenne' },
  { value: 'faible', label: 'Faible' }
];

const RISK_AI_DISCLAIMER =
  'Suggestions basées sur analyse automatique — à vérifier avant toute décision.';

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

/** @param {string} severity @param {string} probability */
function levelsToRegisterMeta(severity, probability) {
  const gMap = { élevée: 5, moyenne: 3, faible: 2 };
  const pMap = { élevée: 4, moyenne: 3, faible: 2 };
  const G = gMap[severity] ?? 3;
  const P = pMap[probability] ?? 3;
  const tier = riskTierFromGp(G, P);
  const status = riskLevelLabelFromTier(tier);
  const tone = tier >= 5 ? 'red' : tier >= 3 ? 'amber' : 'blue';
  return { meta: `G${G} × P${P}`, tone, status };
}

function defaultTitleFromDescription(text) {
  const t = text.trim().replace(/\s+/g, ' ');
  if (!t) return 'Nouveau risque';
  return t.length <= 72 ? t : `${t.slice(0, 69)}…`;
}

/**
 * Suggestion locale si l’API d’analyse est indisponible — toujours validée par l’utilisateur.
 * @param {string} description
 */
function mockAnalyzeRisk(description) {
  const d = String(description).toLowerCase();
  let category = 'Sécurité';
  if (/hydrocarbure|pollution|eau|déchets|bassin|rétention|environnement/.test(d)) {
    category = 'Environnement';
  } else if (/qualité|non-conform|procédure|lot|conditionnement|contrôle/.test(d)) {
    category = 'Qualité';
  }
  return {
    category,
    severity: 'moyenne',
    probability: 'moyenne',
    suggestedActions: [
      'Consigner la mesure de maîtrise dans le registre après validation terrain.',
      'Vérifier la cohérence avec les exigences ISO 45001 / 14001 applicables au site.'
    ],
    causes: 'À préciser après observation (suggestion automatique — non contractuelle).',
    impacts: 'À évaluer selon le contexte opérationnel local (suggestion automatique).'
  };
}

/**
 * @param {object} opts
 * @param {(data: { title: string, detail: string, status: string, tone: string, meta: string }) => void} opts.onSaved — liste locale (pas d’API persistance)
 * @param {{ title?: string, description?: string, category?: string }} [opts.defaults]
 */
export function openRiskCreateDialog({ onSaved, defaults = {} } = {}) {
  const dialog = document.createElement('dialog');
  dialog.className = 'risks-create-dialog';

  const inner = document.createElement('div');
  inner.className = 'risks-create-dialog__inner';

  inner.innerHTML = `
    <h2 class="risks-create-dialog__head">Nouvelle fiche risque</h2>
    <p class="risks-create-dialog__lead">
      Registre QHSE (ISO 45001 / ISO 14001) — décrivez le risque opérationnel. Suggestion automatique (mock / API) : vous validez toujours avant enregistrement.
    </p>
    <form class="risks-form-grid" id="risks-create-form">
      <label>Type *
        <select name="category" required>${CATEGORY_OPTIONS.map(
          (c) => `<option value="${c}">${c}</option>`
        ).join('')}</select>
      </label>
      <label>Libellé court
        <input type="text" name="title" autocomplete="off" maxlength="240" placeholder="Ex. Chute hauteur zone concassage" />
      </label>
      <label>Description du risque *
        <textarea name="description" required placeholder="Contexte, exposition, situation terrain…"></textarea>
      </label>
      <div class="risks-form-actions-row">
        <button type="button" class="btn btn-secondary" data-action="analyze">Suggestion automatique (causes / impacts / G·P)</button>
        <button type="button" class="btn btn-secondary" data-action="assistant-causes">Causes &amp; impacts (assistant local)</button>
      </div>
      <div class="risks-ai-panel" id="risks-ai-panel" hidden>
        <p class="risks-ai-panel__disclaimer" id="risks-ai-disclaimer"></p>
        <div class="risks-ai-panel__kv" id="risks-ai-kv"></div>
        <ul class="risks-ai-panel__list" id="risks-ai-actions"></ul>
        <div class="risks-ai-panel__actions">
          <button type="button" class="btn btn-primary" data-action="apply-suggestions">Copier dans le formulaire (validation requise)</button>
          <button type="button" class="btn btn-secondary" data-action="ignore-suggestions">Masquer</button>
        </div>
      </div>
      <label>Gravité estimée
        <select name="severity">${LEVEL_OPTIONS.map(
          (o) => `<option value="${o.value}">${o.label}</option>`
        ).join('')}</select>
      </label>
      <label>Probabilité estimée
        <select name="probability">${LEVEL_OPTIONS.map(
          (o) => `<option value="${o.value}">${o.label}</option>`
        ).join('')}</select>
      </label>
      <label>Actions recommandées (modifiable)
        <textarea name="actions" placeholder="Une mesure par ligne (vous pouvez compléter ou supprimer)."></textarea>
      </label>
      <label class="risks-form-confirm-row">
        <input type="checkbox" name="confirm_review" value="1" />
        <span>Je confirme avoir relu les champs et suggestions avant validation</span>
      </label>
      <div class="risks-form-actions-row" style="margin-top:18px">
        <button type="submit" class="btn btn-primary">Valider et ajouter au registre (local)</button>
        <button type="button" class="btn btn-secondary" data-action="close">Annuler</button>
      </div>
    </form>
  `;

  dialog.append(inner);
  document.body.append(dialog);

  const form = inner.querySelector('#risks-create-form');
  const d = defaults;
  if (d.title != null && String(d.title).trim()) {
    form.querySelector('[name="title"]').value = String(d.title).trim();
  }
  if (d.description != null && String(d.description).trim()) {
    form.querySelector('[name="description"]').value = String(d.description).trim();
  }
  if (d.category && CATEGORY_OPTIONS.includes(d.category)) {
    form.querySelector('[name="category"]').value = d.category;
  }
  const panel = inner.querySelector('#risks-ai-panel');
  const disclaimerEl = inner.querySelector('#risks-ai-disclaimer');
  const kvHost = inner.querySelector('#risks-ai-kv');
  const actionsList = inner.querySelector('#risks-ai-actions');

  /** @type {{ category: string, severity: string, probability: string, suggestedActions: string[], causes?: string, impacts?: string } | null} */
  let pendingSuggestion = null;

  function hidePanel() {
    panel.hidden = true;
    panel.classList.remove('risks-ai-panel--loading');
    pendingSuggestion = null;
    if (disclaimerEl) disclaimerEl.textContent = RISK_AI_DISCLAIMER;
    kvHost.replaceChildren();
    actionsList.replaceChildren();
  }

  function renderSuggestion(data) {
    pendingSuggestion = data;
    if (disclaimerEl) disclaimerEl.textContent = RISK_AI_DISCLAIMER;
    const sevOk = LEVEL_OPTIONS.some((o) => o.value === data.severity);
    const probOk = LEVEL_OPTIONS.some((o) => o.value === data.probability);
    const metaReg = levelsToRegisterMeta(
      sevOk ? data.severity : 'moyenne',
      probOk ? data.probability : 'moyenne'
    );
    const extraCauses =
      data.causes != null
        ? `<div><span>Causes (suggestion)</span><strong>${escapeHtml(String(data.causes))}</strong></div>`
        : '';
    const extraImpacts =
      data.impacts != null
        ? `<div><span>Impacts (suggestion)</span><strong>${escapeHtml(String(data.impacts))}</strong></div>`
        : '';
    kvHost.innerHTML = `
      <div><span>Type suggéré</span><strong>${escapeHtml(data.category)}</strong></div>
      <div><span>Gravité (suggestion)</span><strong>${escapeHtml(levelLabel(data.severity))}</strong></div>
      <div><span>Probabilité (suggestion)</span><strong>${escapeHtml(levelLabel(data.probability))}</strong></div>
      <div><span>Criticité indicielle</span><strong>${escapeHtml(metaReg.status)} · ${escapeHtml(metaReg.meta)}</strong></div>
      ${extraCauses}${extraImpacts}
    `;
    actionsList.replaceChildren();
    (data.suggestedActions || []).forEach((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      actionsList.append(li);
    });
    panel.hidden = false;
  }

  inner.querySelector('[data-action="assistant-causes"]')?.addEventListener('click', () => {
    const cat = form.category.value;
    const titleEl = form.querySelector('[name="title"]');
    const title = titleEl?.value?.trim() || 'Risque';
    const desc = form.description.value.trim();
    const { causes, impacts } = suggestRiskCausesImpacts(cat, title, desc);
    const block = `\n\n— Causes (assistant local) —\n${causes}\n\n— Impacts (assistant local) —\n${impacts}`;
    form.description.value = desc ? `${desc}${block}` : block.trim();
    showToast('Causes et impacts ajoutés dans la description — relisez avant validation.', 'info');
  });

  inner.querySelector('[data-action="analyze"]').addEventListener('click', async () => {
    const desc = form.description.value.trim();
    if (!desc) {
      showToast('Saisissez une description pour lancer l’analyse.', 'info');
      form.description.focus();
      return;
    }
    panel.hidden = false;
    panel.classList.add('risks-ai-panel--loading');
    if (disclaimerEl) disclaimerEl.textContent = 'Analyse en cours…';
    kvHost.replaceChildren();
    actionsList.replaceChildren();
    try {
      const res = await qhseFetch('/api/risks/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        panel.classList.remove('risks-ai-panel--loading');
        renderSuggestion(mockAnalyzeRisk(desc));
        showToast('Suggestion locale — serveur indisponible (à valider).', 'info');
        return;
      }
      if (
        !body.category ||
        !body.severity ||
        !body.probability ||
        !Array.isArray(body.suggestedActions)
      ) {
        panel.classList.remove('risks-ai-panel--loading');
        renderSuggestion(mockAnalyzeRisk(desc));
        showToast('Réponse incomplète — suggestion locale affichée.', 'info');
        return;
      }
      panel.classList.remove('risks-ai-panel--loading');
      renderSuggestion(body);
    } catch (err) {
      console.error('[risks] POST /api/risks/analyze', err);
      panel.classList.remove('risks-ai-panel--loading');
      renderSuggestion(mockAnalyzeRisk(desc));
      showToast('Mode hors ligne : suggestion locale (à valider).', 'info');
    }
  });

  inner.querySelector('[data-action="apply-suggestions"]').addEventListener('click', () => {
    if (!pendingSuggestion) {
      showToast('Lancez d’abord une analyse.', 'info');
      return;
    }
    const { category, severity, probability, suggestedActions } = pendingSuggestion;
    form.category.value = CATEGORY_OPTIONS.includes(category) ? category : 'Sécurité';
    form.severity.value = LEVEL_OPTIONS.some((o) => o.value === severity) ? severity : 'moyenne';
    form.probability.value = LEVEL_OPTIONS.some((o) => o.value === probability)
      ? probability
      : 'moyenne';
    form.actions.value = suggestedActions.join('\n');
    showToast('Suggestions copiées dans le formulaire — contrôle humain obligatoire avant validation.', 'info');
  });

  inner.querySelector('[data-action="ignore-suggestions"]').addEventListener('click', () => {
    hidePanel();
  });

  inner.querySelector('[data-action="close"]').addEventListener('click', () => {
    dialog.close();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.confirm_review.checked) {
      showToast('Cochez la confirmation de relecture pour enregistrer la fiche.', 'info');
      return;
    }
    const description = form.description.value.trim();
    if (!description) {
      showToast('La description est obligatoire.', 'info');
      return;
    }
    let title = form.title.value.trim();
    if (!title) title = defaultTitleFromDescription(description);

    const severity = form.severity.value;
    const probability = form.probability.value;
    const actionsText = form.actions.value.trim();
    const cat = form.category.value;
    let detail = description;
    if (cat) detail = `${description}\n\n(Type : ${cat})`;
    if (actionsText.length > 0) {
      detail = `${detail}\n\n— Mesures envisagées —\n${actionsText}`;
    }

    const { meta, tone, status } = levelsToRegisterMeta(severity, probability);
    const rowData = {
      title,
      type: cat,
      detail,
      status,
      tone,
      meta,
      responsible: 'À désigner',
      actionLinked: null,
      pilotageState: 'actif',
      updatedAt: new Date().toISOString().slice(0, 10),
      trend: 'stable'
    };
    pushCustomRiskTitle(title);
    onSaved(rowData);
    dialog.close();
    showToast('Fiche ajoutée au registre (session courante). Enregistrement serveur : à brancher si besoin.', 'success');
  });

  dialog.addEventListener('close', () => {
    dialog.remove();
  });

  dialog.showModal();
}

function levelLabel(v) {
  const o = LEVEL_OPTIONS.find((x) => x.value === v);
  return o ? o.label : v;
}

export function renderRisks() {
  ensureQhsePilotageStyles();

  const page = document.createElement('section');
  page.className = 'page-stack risks-page risks-page--premium';

  const localRisks = [...mockRisks];

  /** @type {Array<{ description?: string, ref?: string, type?: string, status?: string, createdAt?: string }>} */
  let incidentRowsRaw = [];

  async function refreshIncidentLinks() {
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

  const listStack = document.createElement('tbody');
  listStack.className = 'risks-register-premium-table__body';

  /** @type {{ g: number, p: number } | null} */
  let matrixFilter = null;
  /** @type {RiskTierBucket | null} */
  let tierFilter = null;
  /** @type {'critique'|'eleve'|'maitrise'|'sans_action'|null} — filtres cartes KPI */
  let bannerKpiFilter = null;

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
        renderList();
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
          <h3>Tendance (maquette)</h3>
          <p class="content-card-lead risks-evolution-card__lead">Risques critiques et score moyen G×P — série locale, à relier aux indicateurs SI.</p>
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
      '<div><div class="section-kicker">Preuves & contrôles</div><h3>Documents liés</h3><p class="content-card-lead risks-proofs-card__lead">Pièces et contrôles associés au dispositif risques (maquette).</p></div>';
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
          showIaAssistantResult('Actions recommandées', ['Toutes les fiches ont une action liée (maquette).']);
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
    activeFiltersBar.hidden = !hasTier && !hasMatrix && !hasBanner;
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
        renderList();
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
        renderList();
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
    const clearAll = document.createElement('button');
    clearAll.type = 'button';
    clearAll.className = 'btn btn-secondary risks-page__active-filters-btn risks-page__active-filters-btn--ghost';
    clearAll.textContent = 'Tout afficher';
    clearAll.addEventListener('click', () => {
      tierFilter = null;
      bannerKpiFilter = null;
      matrixPanel.clearFilter();
      syncTierPills();
      updateActiveFiltersBar();
      renderList();
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
        renderList();
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
    if (rows.length === 0) {
      const tr = document.createElement('tr');
      tr.className = 'risks-register-empty-row';
      const td = document.createElement('td');
      td.colSpan = 6;
      td.className = 'risks-page__list-empty-td';
      const wrap = document.createElement('div');
      wrap.className = 'risks-page__list-empty';
      const t = document.createElement('p');
      t.className = 'risks-page__list-empty-title';
      const s = document.createElement('p');
      s.className = 'risks-page__list-empty-sub';
      if (localRisks.length === 0) {
        t.textContent = 'Aucune fiche dans le registre';
        s.textContent =
          'Ajoutez un risque pour alimenter le portefeuille et la matrice G×P.';
      } else if (tierFilter != null && matrixFilter != null) {
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

    rows.forEach((r) =>
      listStack.append(
        createRiskRegisterRow(r, {
          linkedIncidents: getMergedIncidentsForRisk(String(r.title || ''), incidentRowsRaw),
          incidentsLinkNote,
          onRefresh: () => void refreshAll(),
          onCreatePreventiveAction: (title) => {
            void openPreventiveActionFromRisks(title);
          },
          onCreatePtwFromRisk: (title) => createPtwFromRisk(title)
        })
      )
    );
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

  void refreshAll();

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
      onSaved: (data) => {
        localRisks.unshift(data);
        matrixPanel.clearFilter();
        void refreshAll();
      }
    });
  });

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
