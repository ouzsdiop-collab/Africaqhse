/**
 * Copilot conformité (phase 3) — module isolé.
 * Insère un bloc sous le bandeau « Audit readiness » sur la page ISO.
 */
import './isoCopilotConformiteModule.css';
import {
  AUDITS_TO_SCHEDULE,
  DOCUMENT_ATTENTION,
  getNormById,
  getRequirements
} from '../data/conformityStore.js';
import { showToast } from './toast.js';

/**
 * @typedef {'scroll-docs' | 'filter-nc' | 'filter-partial' | 'filter-gap' | 'scroll-priorities' | 'open-audits' | 'scroll-register'} CopilotAction
 */

/**
 * @typedef {object} CopilotInsight
 * @property {string} id
 * @property {string} label
 * @property {string} icon
 * @property {CopilotAction} action
 */

/**
 * Génère jusqu’à 3 recommandations courtes (documents manquants, NC, audits, filets).
 * @returns {CopilotInsight[]}
 */
export function generateCopilotInsights() {
  /** @type {CopilotInsight[]} */
  const pool = [];

  const missing = DOCUMENT_ATTENTION.missing || [];
  const nMissing = missing.length;
  if (nMissing > 0) {
    const iso14001Hint = missing.some((d) =>
      /14001|environnement|déversement|environnemental/i.test(`${d.name} ${d.note || ''}`)
    );
    pool.push({
      id: 'copilot-missing-docs',
      label: iso14001Hint
        ? `${nMissing} preuve(s) manquante(s) — ISO 14001`
        : `${nMissing} document(s) manquant(s) — consolider les preuves`,
      icon: '📄',
      action: 'scroll-docs'
    });
  }

  const reqs = getRequirements();
  const ncs = reqs.filter((r) => r.status === 'non_conforme');
  if (ncs.length > 0) {
    const first = ncs[0];
    const norm = getNormById(first.normId);
    const code = norm ? norm.code : first.normId;
    const critical =
      ncs.find((r) => /critique|majeur|sécurité|environnement|urgent/i.test(`${r.title} ${r.clause}`)) ||
      first;
    pool.push({
      id: 'copilot-nc',
      label:
        ncs.length === 1
          ? `1 non-conformité à traiter — ${critical.clause} (${code})`
          : `${ncs.length} non-conformité(s) — priorité ${critical.clause}`,
      icon: '⚠️',
      action: 'filter-nc'
    });
  }

  if (AUDITS_TO_SCHEDULE.length > 0) {
    const a = AUDITS_TO_SCHEDULE[0];
    pool.push({
      id: 'copilot-audit',
      label: `Audit interne à planifier — ${a.title}`,
      icon: '📅',
      action: 'open-audits'
    });
  }

  const partials = reqs.filter((r) => r.status === 'partiel').length;
  if (pool.length < 3 && partials > 0 && !pool.some((p) => p.action === 'filter-partial')) {
    pool.push({
      id: 'copilot-partial',
      label: `${partials} exigence(s) partielle(s) — finaliser les preuves`,
      icon: '◇',
      action: 'filter-partial'
    });
  }

  if (pool.length < 3 && reqs.some((r) => r.status !== 'conforme') && !pool.some((p) => p.action === 'filter-gap')) {
    const gaps = reqs.filter((r) => r.status !== 'conforme').length;
    pool.push({
      id: 'copilot-gap',
      label: `${gaps} écart(s) sur le registre — vue filtrée`,
      icon: '◎',
      action: 'filter-gap'
    });
  }

  if (pool.length < 2 && !pool.some((p) => p.action === 'scroll-priorities')) {
    pool.push({
      id: 'copilot-prio',
      label: 'Priorités cockpit — traiter les actions en cours',
      icon: '→',
      action: 'scroll-priorities'
    });
  }

  return pool.slice(0, 3);
}

/**
 * @param {CopilotAction} action
 * @param {ParentNode} [isoRoot]
 */
function runCopilotAction(action, isoRoot = document) {
  const root = isoRoot.querySelector?.('.iso-page') || isoRoot.closest?.('.iso-page') || document;

  const scrollTo = (sel) => {
    const el = root.querySelector(sel) || document.querySelector(sel);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clickFilter = (key) => {
    const btn = root.querySelector(`.iso-req-filter-btn[data-filter="${key}"]`);
    if (btn && typeof btn.click === 'function') {
      btn.click();
      showToast(`Registre : filtre « ${labelForFilter(key)} »`, 'info');
    } else {
      scrollTo('.iso-req-table');
    }
    scrollTo('.iso-table-wrap--req');
  };

  switch (action) {
    case 'scroll-docs':
      scrollTo('.iso-docs-priority');
      showToast('Documentation & preuves', 'info');
      break;
    case 'filter-nc':
      clickFilter('nc');
      break;
    case 'filter-partial':
      clickFilter('partial');
      break;
    case 'filter-gap':
      clickFilter('gap');
      break;
    case 'scroll-priorities':
      scrollTo('.iso-cockpit-priorities');
      showToast('Priorités à traiter', 'info');
      break;
    case 'scroll-register':
      scrollTo('.iso-req-hub-card');
      break;
    case 'open-audits':
      window.location.hash = 'audits';
      showToast('Module Audits', 'info');
      break;
    default:
      scrollTo('.iso-req-table');
  }
}

/**
 * @param {string} key
 */
function labelForFilter(key) {
  const map = {
    nc: 'Non conformes',
    partial: 'Partiels',
    gap: 'Écarts',
    all: 'Toutes',
    ok: 'Conformes'
  };
  return map[key] || 'Filtre';
}

/**
 * @param {HTMLElement} host
 */
function renderInsightsInto(host) {
  const insights = generateCopilotInsights();
  const list = host.querySelector('.iso-copilot-conformite-premium__list');
  if (!list) return;
  list.replaceChildren();

  const isoPage = host.closest('.iso-page') || document.querySelector('.iso-page');

  insights.forEach((ins) => {
    const li = document.createElement('li');
    li.className = 'iso-copilot-conformite-premium__item';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'iso-copilot-conformite-premium__btn';
    btn.setAttribute('data-copilot-insight', ins.id);
    btn.setAttribute(
      'aria-label',
      `${ins.label} — ouvrir la vue correspondante`
    );
    const ic = document.createElement('span');
    ic.className = 'iso-copilot-conformite-premium__icon';
    ic.setAttribute('aria-hidden', 'true');
    ic.textContent = ins.icon;
    const lb = document.createElement('span');
    lb.className = 'iso-copilot-conformite-premium__label';
    lb.textContent = ins.label;
    btn.append(ic, lb);
    btn.addEventListener('click', () => runCopilotAction(ins.action, isoPage || document));
    li.append(btn);
    list.append(li);
  });
}

/**
 * @returns {HTMLElement}
 */
function createCopilotBlock() {
  const host = document.createElement('section');
  host.className = 'iso-copilot-conformite-premium';
  host.setAttribute('aria-labelledby', 'iso-copilot-conformite-title');
  host.setAttribute('data-iso-copilot-conformite-mounted', '1');
  host.innerHTML = `
    <div class="iso-copilot-conformite-premium__head">
      <div>
        <p class="iso-copilot-conformite-premium__kicker">Pilotage intelligent</p>
        <h2 class="iso-copilot-conformite-premium__title" id="iso-copilot-conformite-title">Assistant conformité</h2>
      </div>
      <span class="iso-copilot-conformite-premium__badge">2–3 actions</span>
    </div>
    <ul class="iso-copilot-conformite-premium__list" role="list"></ul>
  `;
  renderInsightsInto(host);
  return host;
}

const MO_OPTS = { childList: true, subtree: true };

const mo = new MutationObserver(() => tryMount());

function resumeIsoCopilotObserve() {
  mo.observe(document.documentElement, MO_OPTS);
}

function pauseIsoCopilotObserve() {
  mo.disconnect();
}

function refreshMountedBlocks() {
  pauseIsoCopilotObserve();
  try {
    document.querySelectorAll('[data-iso-copilot-conformite-mounted]').forEach((host) => {
      if (host instanceof HTMLElement) renderInsightsInto(host);
    });
  } finally {
    resumeIsoCopilotObserve();
  }
}

function tryMount() {
  const ar = document.querySelector('.iso-page .iso-audit-readiness');
  if (!ar || !ar.parentElement) return;
  if (ar.nextElementSibling?.dataset?.isoCopilotConformiteMounted === '1') {
    refreshMountedBlocks();
    return;
  }
  pauseIsoCopilotObserve();
  try {
    const block = createCopilotBlock();
    ar.insertAdjacentElement('afterend', block);
  } finally {
    resumeIsoCopilotObserve();
  }
}

resumeIsoCopilotObserve();
tryMount();

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refreshMountedBlocks();
});
