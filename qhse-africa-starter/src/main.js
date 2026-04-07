import './components/isoProofsManager.js';
import './components/isoCopilotConformiteModule.js';
import { initQhseSentry, captureQhseException } from './instrumentSentry.js';
import { initDisplayMode } from './utils/displayMode.js';
import { createSidebar } from './components/sidebarV2.js';
import { createTopbar } from './components/topbarV2.js';
import { createNotificationsPanel } from './components/notifications.js';
import { createPageRenderer, createLoginView } from './pages/index.js';
import { activityLogStore } from './data/activityLog.js';
import { notificationsStore, loadNotificationsFromApi } from './data/notifications.js';
import { refreshDocComplianceNotifications } from './services/documentRegistry.service.js';
import {
  buildPresentationFeed,
  countUnreadPresentation,
  refreshNotificationSmartContext
} from './services/notificationIntelligence.service.js';
import { appState, setActiveSiteContext, setCurrentPage } from './utils/state.js';
import { getSessionUser, restoreSessionFromToken } from './data/sessionUser.js';
import { pageTopbarById } from './data/navigation.js';
import { qhseFetch } from './utils/qhseFetch.js';
import { withSiteQuery } from './utils/siteFilter.js';
import { getDisplayMode } from './utils/displayMode.js';
import { syncTerrainIncidentQueue } from './services/terrainOffline.service.js';

const MOBILE_STYLE_ID = 'qhse-terrain-mobile-shell';

function ensureTerrainMobileStyles() {
  if (document.getElementById(MOBILE_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = MOBILE_STYLE_ID;
  el.textContent = `
@media (max-width: 900px){
  [data-display-mode="terrain"] .sidebar-v2{display:none!important}
  [data-display-mode="terrain"] .topbar-v2__center,
  [data-display-mode="terrain"] .topbar-v2__quick-wrap,
  [data-display-mode="terrain"] .topbar-v2__ai{display:none!important}
  [data-display-mode="terrain"] .main-shell{padding-bottom:74px}
  .terrain-bottom-nav{position:fixed;left:0;right:0;bottom:0;z-index:2000;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:8px;background:color-mix(in srgb,var(--color-surface) 95%,black);border-top:1px solid var(--color-border-secondary)}
  .terrain-bottom-nav__btn{min-height:48px;border:1px solid var(--color-border-secondary);border-radius:12px;background:var(--color-background-secondary);color:var(--text);font-size:12px;font-weight:700}
  .terrain-bottom-nav__btn.is-active{border-color:color-mix(in srgb,var(--app-accent,#14b8a6) 45%,var(--color-border-secondary));background:color-mix(in srgb,var(--app-accent,#14b8a6) 16%,var(--color-background-secondary))}
}
`;
  document.head.append(el);
}

function createTerrainBottomNav(currentPage, onNavigate) {
  const nav = document.createElement('nav');
  nav.className = 'terrain-bottom-nav';
  nav.setAttribute('aria-label', 'Navigation terrain');
  const items = [
    { id: 'terrain-mode', label: 'Accueil' },
    { id: 'actions', label: 'Actions' },
    { id: 'permits', label: 'Permis' },
    { id: 'settings', label: 'Profil' }
  ];
  items.forEach((it) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `terrain-bottom-nav__btn${currentPage === it.id ? ' is-active' : ''}`;
    b.textContent = it.label;
    b.addEventListener('click', () => onNavigate(it.id));
    nav.append(b);
  });
  return nav;
}

function registerPwaServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

/**
 * @param {HTMLElement & { refreshNavBadges?: (p: unknown) => void }} sidebar
 */
async function refreshShellNavBadges(sidebar) {
  if (!sidebar || typeof sidebar.refreshNavBadges !== 'function') return;
  /** @type {{ incidents: number; overdueActions: number }} */
  const payload = { incidents: 0, overdueActions: 0 };
  const ac = new AbortController();
  const tid = setTimeout(() => ac.abort(), 6000);
  try {
    const statsRes = await qhseFetch(withSiteQuery('/api/dashboard/stats'), {
      signal: ac.signal
    });
    if (statsRes.ok) {
      const stats = await statsRes.json().catch(() => ({}));
      payload.incidents = Array.isArray(stats.criticalIncidents) ? stats.criticalIncidents.length : 0;
      payload.overdueActions = Number(stats.overdueActions) || 0;
    }
  } catch {
    /* API lente ou indisponible : afficher l’app sans bloquer sur les badges */
  } finally {
    clearTimeout(tid);
  }
  sidebar.refreshNavBadges(payload);
}

function attachPageIntro(pageRoot, currentPage) {
  if (currentPage === 'dashboard' || currentPage === 'login') return;
  /* En-têtes riches dédiés : pas de doublon avec le bandeau shell */
  if (
    currentPage === 'terrain-mode' ||
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

function appMountEl() {
  return document.querySelector('#app');
}

function showFatalShell(message, detail) {
  const mount = appMountEl() || document.body;
  mount.innerHTML = '';
  if (mount.id === 'app') {
    mount.style.minHeight = '100vh';
  }
  const wrap = document.createElement('div');
  wrap.dataset.qhseFatal = '1';
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
  const app = appMountEl();
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

  try {
    const terrainMode = getDisplayMode() === 'terrain';
    ensureTerrainMobileStyles();
    if (terrainMode) {
      const terrainAllowed = new Set(['terrain-mode', 'incidents', 'permits', 'actions', 'settings']);
      if (!terrainAllowed.has(appState.currentPage)) {
        setCurrentPage('terrain-mode');
      }
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
        void Promise.all([
          loadNotificationsFromApi(),
          refreshDocComplianceNotifications(),
          refreshNotificationSmartContext()
        ])
          .then(() => renderApp())
          .catch((err) => console.error('[QHSE] notifications après changement site', err));
      },
      onSessionUserChange: () => {
        Promise.all([
          loadNotificationsFromApi(),
          refreshDocComplianceNotifications(),
          refreshNotificationSmartContext()
        ])
          .then(() => renderApp())
          .catch((err) => console.error('[QHSE] notifications après changement profil', err));
      }
    });

    const content = document.createElement('main');
    content.className = 'main-shell';

    const topbar = createTopbar({
      currentPage: appState.currentPage,
      sessionUser: getSessionUser(),
      unreadCount: countUnreadPresentation(
        buildPresentationFeed(notificationsStore.all(), { role: getSessionUser()?.role })
      ),
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
          onPresentationChange: () => renderApp(),
          onClose: () => {
            appState.notificationsOpen = false;
            renderApp();
          }
        })
      );
    }

    shell.append(sidebar, content);
    if (terrainMode) {
      const mobileNav = createTerrainBottomNav(appState.currentPage, (pageId) => {
        setCurrentPage(pageId);
        window.location.hash = pageId;
        renderApp();
      });
      shell.append(mobileNav);
    }
    app.append(shell);
    void refreshShellNavBadges(sidebar).catch((err) => {
      console.error('[QHSE] refreshShellNavBadges', err);
    });
  } catch (e) {
    console.error('[QHSE] renderApp', e);
    captureQhseException(e, { phase: 'renderApp' });
    showFatalShell('Erreur d’affichage de l’interface', String(e?.message || e));
  }
}

function initRouting() {
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    setCurrentPage(hash);
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function boot() {
  try {
    await initQhseSentry();
    initDisplayMode();
    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
      showFatalShell(
        'Application non chargée (fichier local)',
        'Ouvrez http://localhost:5173 après npm run dev (dossier qhse-africa-starter). Le mode file:// ne charge pas correctement les modules JavaScript.'
      );
      return;
    }
    initRouting();
    registerPwaServiceWorker();
    try {
      await Promise.race([restoreSessionFromToken(), sleep(10000)]);
    } catch (e) {
      console.error('[QHSE] restoreSessionFromToken', e);
    }
    logBootEvent();
    renderApp();
    if (navigator.onLine !== false) {
      void syncTerrainIncidentQueue().catch(() => {});
    }
    Promise.all([
      loadNotificationsFromApi(),
      refreshDocComplianceNotifications(),
      refreshNotificationSmartContext()
    ])
      .then(() => renderApp())
      .catch((err) => {
        console.error('[QHSE] loadNotificationsFromApi', err);
        renderApp();
      });
  } catch (err) {
    console.error(err);
    captureQhseException(err, { phase: 'boot' });
    showFatalShell('Erreur au démarrage', String(err?.message || err));
  }
}

boot();

function shouldReportGlobalFailure() {
  const app = appMountEl();
  if (!app) return true;
  if (app.querySelector('.app-shell')) return false;
  return true;
}

window.addEventListener('error', (event) => {
  if (!shouldReportGlobalFailure()) return;
  const msg = event.error?.message || event.message || 'Erreur inconnue';
  console.error('[QHSE] window.error', event.error || event);
  captureQhseException(event.error || new Error(msg), { phase: 'window.error', filename: event.filename });
  showFatalShell('Erreur au chargement de l’application', msg);
});

window.addEventListener('unhandledrejection', (event) => {
  if (!shouldReportGlobalFailure()) return;
  const r = event.reason;
  const msg = r instanceof Error ? r.message : String(r);
  console.error('[QHSE] unhandledrejection', r);
  showFatalShell('Erreur asynchrone au démarrage', msg);
});

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  if (!hash) return;
  setCurrentPage(hash);
  try {
    renderApp();
  } catch (e) {
    console.error('[QHSE] hashchange renderApp', e);
    captureQhseException(e, { phase: 'hashchange' });
    showFatalShell('Erreur de navigation', String(e?.message || e));
  }
});

window.addEventListener('online', () => {
  void syncTerrainIncidentQueue().catch(() => {});
});
