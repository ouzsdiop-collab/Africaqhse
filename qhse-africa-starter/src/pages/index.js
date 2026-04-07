import { getSessionUser } from '../data/sessionUser.js';
import { canAccessNavPage } from '../utils/permissionsUi.js';

/** @param {unknown} err */
function buildRenderErrorView(err) {
  console.error('[QHSE] Rendu page', err);
  const wrap = document.createElement('div');
  wrap.className = 'page-stack';
  const article = document.createElement('article');
  article.className = 'content-card card-soft';
  article.style.padding = '1.5rem';
  article.style.maxWidth = '42rem';
  const h = document.createElement('h2');
  h.style.margin = '0 0 10px';
  h.textContent = 'Impossible d’afficher cette page';
  const p = document.createElement('p');
  p.style.margin = '0 0 8px';
  p.style.color = 'var(--text2)';
  p.style.lineHeight = '1.5';
  p.textContent =
    'Une erreur technique a interrompu l’affichage. Ouvrez la console (F12) pour le détail.';
  const em = document.createElement('p');
  em.style.margin = '0 0 16px';
  em.style.fontSize = '13px';
  em.style.wordBreak = 'break-word';
  em.style.opacity = '0.9';
  em.textContent = err instanceof Error ? err.message : String(err);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-primary';
  btn.textContent = 'Retour tableau de bord';
  btn.addEventListener('click', () => {
    window.location.hash = 'dashboard';
  });
  article.append(h, p, em, btn);
  wrap.append(article);
  return wrap;
}

function createRouteLoadingView() {
  const wrap = document.createElement('div');
  wrap.className = 'qhse-route-loading content-card card-soft';
  wrap.setAttribute('role', 'status');
  wrap.setAttribute('aria-live', 'polite');
  wrap.setAttribute('aria-busy', 'true');
  const p = document.createElement('p');
  p.className = 'qhse-route-loading__text';
  p.textContent = 'Chargement du module…';
  wrap.append(p);
  return wrap;
}

/**
 * Chargement dynamique des pages — réduit le JS initial (code-splitting Vite).
 * @param {string} pageId
 * @param {(entry: unknown) => void} onAddLog
 * @returns {Promise<HTMLElement>}
 */
async function importAndRenderPage(pageId, onAddLog) {
  switch (pageId) {
    case 'terrain-mode': {
      const m = await import('./terrain-mode.js');
      return m.renderTerrainMode();
    }
    case 'incidents': {
      const m = await import('./incidents.js');
      return m.renderIncidents(onAddLog);
    }
    case 'risks': {
      const m = await import('./risks.js');
      return m.renderRisks();
    }
    case 'actions': {
      const m = await import('./actions.js');
      return m.renderActions();
    }
    case 'permits': {
      const m = await import('./permits.js');
      return m.renderPermits();
    }
    case 'iso': {
      const m = await import('./iso.js');
      return m.renderIso(onAddLog);
    }
    case 'audits': {
      const m = await import('./audits.js');
      return m.renderAudits();
    }
    case 'products': {
      const m = await import('./products.js');
      return m.renderProducts();
    }
    case 'imports': {
      const m = await import('./imports.js');
      return m.renderImports();
    }
    case 'sites': {
      const m = await import('./sites.js');
      return m.renderSites();
    }
    case 'analytics': {
      const m = await import('./analytics.js');
      return m.renderAnalytics();
    }
    case 'performance': {
      const m = await import('./performance.js');
      return m.renderPerformance();
    }
    case 'ai-center': {
      const m = await import('./ai-center.js');
      return m.renderAiCenter(onAddLog);
    }
    case 'activity-log': {
      const m = await import('./activity-log.js');
      return m.renderActivityLog();
    }
    case 'settings': {
      const m = await import('./settings.js');
      return m.renderSettings();
    }
    case 'dashboard':
    default: {
      const m = await import('./dashboard.js');
      return m.renderDashboard();
    }
  }
}

/**
 * @param {{ currentPage: string; onAddLog: (entry: unknown) => void }} opts
 * @returns {HTMLElement} conteneur `.page-stack` avec slot async (compatible `attachPageIntro`).
 */
export function createPageRenderer({ currentPage, onAddLog }) {
  if (currentPage === 'login') {
    return document.createElement('div');
  }

  const host = document.createElement('div');
  host.className = 'page-stack qhse-page-host';
  const slot = document.createElement('div');
  slot.className = 'qhse-page-slot';
  host.append(slot);

  let targetPage = currentPage;
  const su = getSessionUser();
  if (su && !canAccessNavPage(su.role, currentPage)) {
    const h = window.location.hash.replace(/^#/, '');
    if (h && h !== 'dashboard') {
      window.location.hash = 'dashboard';
    }
    targetPage = 'dashboard';
  }

  slot.replaceChildren(createRouteLoadingView());

  void importAndRenderPage(targetPage, onAddLog)
    .then((root) => {
      if (!slot.isConnected) return;
      slot.replaceChildren(root);
    })
    .catch((err) => {
      if (!slot.isConnected) return;
      slot.replaceChildren(buildRenderErrorView(err));
    });

  return host;
}

export { createLoginView } from './loginV2.js';
