import { initDisplayMode } from './utils/displayMode.js';
import { createSidebar } from './components/sidebarV2.js';
import { createTopbar } from './components/topbarV2.js';
import { createNotificationsPanel } from './components/notifications.js';
import { createPageRenderer, createLoginView } from './pages/index.js';
import { activityLogStore } from './data/activityLog.js';
import { notificationsStore, loadNotificationsFromApi } from './data/notifications.js';
import { appState, setActiveSiteContext, setCurrentPage } from './utils/state.js';
import { getSessionUser, restoreSessionFromToken } from './data/sessionUser.js';
import { pageTopbarById } from './data/navigation.js';
import { qhseFetch } from './utils/qhseFetch.js';
import { withSiteQuery } from './utils/siteFilter.js';

/**
 * @param {HTMLElement & { refreshNavBadges?: (p: unknown) => void }} sidebar
 */
async function refreshShellNavBadges(sidebar) {
  if (!sidebar || typeof sidebar.refreshNavBadges !== 'function') return;
  /** @type {{ incidents: number; overdueActions: number }} */
  const payload = { incidents: 0, overdueActions: 0 };
  try {
    const statsRes = await qhseFetch(withSiteQuery('/api/dashboard/stats'));
    if (statsRes.ok) {
      const stats = await statsRes.json().catch(() => ({}));
      payload.incidents = Array.isArray(stats.criticalIncidents) ? stats.criticalIncidents.length : 0;
      payload.overdueActions = Number(stats.overdueActions) || 0;
    }
  } catch {
    /* garde les compteurs stats à 0 */
  }
  sidebar.refreshNavBadges(payload);
}

function attachPageIntro(pageRoot, currentPage) {
  if (currentPage === 'dashboard' || currentPage === 'login') return;
  /* En-têtes riches dédiés : pas de doublon avec le bandeau shell */
  if (
    currentPage === 'incidents' ||
    currentPage === 'settings' ||
    currentPage === 'iso' ||
    currentPage === 'analytics'
  ) {
    return;
  }
  if (!pageRoot?.classList?.contains('page-stack')) return;
  if (pageRoot.querySelector('.page-intro')) return;
  const meta = pageTopbarById[currentPage];
  if (!meta?.title) return;
  const intro = document.createElement('div');
  intro.className = 'page-intro module-page-hero';
  const inner = document.createElement('div');
  inner.className = 'module-page-hero__inner';
  if (meta.kicker) {
    const k = document.createElement('p');
    k.className = 'page-intro__kicker section-kicker';
    k.textContent = meta.kicker;
    inner.append(k);
  }
  const h = document.createElement('h1');
  h.className = 'page-intro__title';
  h.textContent = meta.title;
  inner.append(h);
  if (meta.subtitle) {
    const p = document.createElement('p');
    p.className = 'page-intro__desc';
    p.textContent = meta.subtitle;
    inner.append(p);
  }
  intro.append(inner);
  pageRoot.prepend(intro);
}

const app = document.querySelector('#app');

function showFatalShell(message, detail) {
  const mount = document.querySelector('#app') || document.body;
  mount.innerHTML = '';
  if (mount.id === 'app') {
    mount.style.minHeight = '100vh';
  }
  const wrap = document.createElement('div');
  wrap.style.cssText =
    'min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;background:#0f172a;color:#e2e8f0;font-family:system-ui,sans-serif;';
  const card = document.createElement('div');
  card.style.cssText =
    'max-width:520px;border:1px solid rgba(148,163,184,.25);border-radius:16px;padding:22px 24px;background:rgba(15,23,42,.9);';
  const h = document.createElement('h1');
  h.style.cssText = 'margin:0 0 12px;font-size:18px;';
  h.textContent = message;
  const p = document.createElement('p');
  p.style.cssText = 'margin:0 0 14px;font-size:14px;line-height:1.5;opacity:.9;';
  p.textContent =
    'Si vous ouvrez les fichiers en double-clic (file://), utilisez plutôt le serveur de dev : dans le dossier du projet, exécutez npm run dev puis ouvrez http://localhost:5173 .';
  const code = document.createElement('pre');
  code.style.cssText =
    'margin:0 0 16px;padding:12px;border-radius:10px;background:rgba(0,0,0,.35);font-size:12px;overflow:auto;white-space:pre-wrap;word-break:break-word;';
  code.textContent = detail || '';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Recharger la page';
  btn.style.cssText =
    'padding:10px 18px;border-radius:10px;border:none;font-weight:700;cursor:pointer;background:#14b8a6;color:#fff;';
  btn.addEventListener('click', () => window.location.reload());
  card.append(h, p, code, btn);
  wrap.append(card);
  mount.append(wrap);
}

function logBootEvent() {
  activityLogStore.add({
    module: 'system',
    action: 'Application initialisée',
    detail: 'Shell front chargé avec succès',
    user: 'Système'
  });
}

function renderApp() {
  if (!app) {
    showFatalShell('Élément #app introuvable', 'Vérifiez que index.html contient <div id="app"></div>.');
    return;
  }

  try {
    app.innerHTML = '';
  } catch (e) {
    showFatalShell('Impossible de préparer l’interface', String(e?.message || e));
    return;
  }

  if (appState.currentPage === 'login') {
    app.append(
      createLoginView({
        onSuccess: () => renderApp()
      })
    );
    return;
  }

  const shell = document.createElement('div');
  shell.className = 'app-shell';

  const sidebar = createSidebar({
    currentPage: appState.currentPage,
    onNavigate: (pageId) => {
      setCurrentPage(pageId);
      window.location.hash = pageId;
      renderApp();
    },
    onSiteChange: (siteId, label) => {
      setActiveSiteContext(siteId, label);
      activityLogStore.add({
        module: 'context',
        action: 'Changement de site',
        detail: `Contexte actif: ${appState.currentSite}${appState.activeSiteId ? ` · ref ${appState.activeSiteId}` : ''}`,
        user: getSessionUser()?.name || 'Responsable QHSE'
      });
      renderApp();
    },
    onSessionUserChange: () => {
      loadNotificationsFromApi().then(() => renderApp());
    }
  });

  const content = document.createElement('main');
  content.className = 'main-shell';

  const topbar = createTopbar({
    currentPage: appState.currentPage,
    sessionUser: getSessionUser(),
    unreadCount: notificationsStore.unreadCount(),
    onToggleNotifications: () => {
      appState.notificationsOpen = !appState.notificationsOpen;
      renderApp();
    },
    onNavigate: (pageId) => {
      setCurrentPage(pageId);
      window.location.hash = pageId;
      renderApp();
    }
  });

  const pageRenderer = createPageRenderer({
    currentPage: appState.currentPage,
    onNavigate: (pageId) => {
      setCurrentPage(pageId);
      window.location.hash = pageId;
      renderApp();
    },
    onMarkNotificationRead: (id) => {
      notificationsStore.markRead(id);
      renderApp();
    },
    onAddLog: (entry) => {
      activityLogStore.add(entry);
      renderApp();
    }
  });

  attachPageIntro(pageRenderer, appState.currentPage);

  content.append(topbar, pageRenderer);

  if (appState.notificationsOpen) {
    content.append(
      createNotificationsPanel({
        notifications: notificationsStore.all(),
        onMarkAllRead: () => {
          notificationsStore.markAllRead();
          renderApp();
        },
        onClose: () => {
          appState.notificationsOpen = false;
          renderApp();
        }
      })
    );
  }

  shell.append(sidebar, content);
  try {
    app.append(shell);
  } catch (e) {
    console.error(e);
    showFatalShell('Erreur lors du rendu de l’application', String(e?.message || e));
    return;
  }
  refreshShellNavBadges(sidebar);
}

function initRouting() {
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    setCurrentPage(hash);
  }
}

async function boot() {
  try {
    initDisplayMode();
    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
      showFatalShell(
        'Application non chargée (fichier local)',
        'Ouvrez http://localhost:5173 après npm run dev (dossier qhse-africa-starter). Le mode file:// ne charge pas correctement les modules JavaScript.'
      );
      return;
    }
    initRouting();
    await restoreSessionFromToken();
    logBootEvent();
    renderApp();
    loadNotificationsFromApi().then(() => renderApp());
  } catch (err) {
    console.error(err);
    showFatalShell('Erreur au démarrage', String(err?.message || err));
  }
}

boot();

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  if (!hash) return;
  setCurrentPage(hash);
  renderApp();
});
