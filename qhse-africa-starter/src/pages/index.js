import { renderDashboard } from './dashboard.js';
import { renderIncidents } from './incidents.js';
import { renderRisks } from './risks.js';
import { renderActions } from './actions.js';
import { renderIso } from './iso.js';
import { renderAudits } from './audits.js';
import { renderProducts } from './products.js';
import { renderAnalytics } from './analytics.js';
import { renderPerformance } from './performance.js';
import { renderAiCenter } from './ai-center.js';
import { renderActivityLog } from './activity-log.js';
import { renderSettings } from './settings.js';
import { renderImports } from './imports.js';
import { renderSites } from './sites.js';
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

export function createPageRenderer({ currentPage, onAddLog }) {
  if (currentPage === 'login') {
    const el = document.createElement('div');
    return el;
  }

  const su = getSessionUser();
  if (su && !canAccessNavPage(su.role, currentPage)) {
    const h = window.location.hash.replace(/^#/, '');
    if (h && h !== 'dashboard') {
      window.location.hash = 'dashboard';
    }
    try {
      return renderDashboard();
    } catch (err) {
      return buildRenderErrorView(err);
    }
  }

  try {
    switch (currentPage) {
      case 'incidents':
        return renderIncidents(onAddLog);
      case 'risks':
        return renderRisks();
      case 'actions':
        return renderActions();
      case 'iso':
        return renderIso(onAddLog);
      case 'audits':
        return renderAudits();
      case 'products':
        return renderProducts();
      case 'imports':
        return renderImports();
      case 'sites':
        return renderSites();
      case 'analytics':
        return renderAnalytics();
      case 'performance':
        return renderPerformance();
      case 'ai-center':
        return renderAiCenter(onAddLog);
      case 'activity-log':
        return renderActivityLog();
      case 'settings':
        return renderSettings();
      case 'dashboard':
      default:
        return renderDashboard();
    }
  } catch (err) {
    return buildRenderErrorView(err);
  }
}

export { createLoginView } from './loginV2.js';
