import './utils/networkStatus.js';
import './components/isoProofsManager.js';
import './components/isoCopilotConformiteModule.js';
import { initQhseSentry, captureQhseException } from './instrumentSentry.js';
import { initDisplayMode, subscribeDisplayModeViewport } from './utils/displayMode.js';
import { createSidebar } from './components/sidebarV2.js';
import { createTopbar } from './components/topbarV2.js';
import { createNotificationsPanel } from './components/notifications.js';
import {
  createLoginView,
  createForgotPasswordView,
  createResetPasswordView,
  createFirstPasswordChangeView
} from './pages/loginV2.js';
import { showOnboardingWizard, shouldShowOnboarding } from './components/onboardingWizard.js';
import { canAccessNavPage } from './utils/permissionsUi.js';
import { activityLogStore } from './data/activityLog.js';
import { notificationsStore, loadNotificationsFromApi } from './data/notifications.js';
import { refreshDocComplianceNotifications } from './services/documentRegistry.service.js';
import { refreshConformityStatusCacheFromApi } from './data/conformityStore.js';
import { flushSyncQueue, refreshPermitsFromApi } from './services/ptw.service.js';
import {
  buildPresentationFeed,
  countUnreadPresentation,
  refreshNotificationSmartContext
} from './services/notificationIntelligence.service.js';
import { appState, setActiveSiteContext, setCurrentPage } from './utils/state.js';
import {
  getAuthToken,
  getSessionUser,
  getPasswordSetupToken,
  restoreSessionFromToken
} from './data/sessionUser.js';
import { getNavContextForPage, pageTopbarById } from './data/navigation.js';
import { qhseFetch } from './utils/qhseFetch.js';
import { withSiteQuery } from './utils/siteFilter.js';
import { getDisplayMode } from './utils/displayMode.js';
import { TERRAIN_ALLOWED_PAGE_IDS, TERRAIN_BOTTOM_NAV_ITEMS } from './utils/terrainModePages.js';
import {
  getTerrainQueueState,
  syncAllTerrainQueues,
  syncTerrainIncidentQueue,
  syncTerrainRiskQueue
} from './services/terrainOffline.service.js';
import { showToast } from './components/toast.js';
import { ensureProductionDemoModeOff, isDemoMode } from './services/demoMode.service.js';
import { initTheme } from './utils/theme.js';
import './styles/dashboard-contrast-fixes.css';
import './styles/ui-density-saas.css';

ensureProductionDemoModeOff();
initTheme();

function scheduleProductOnboardingTour() {
  if (!getSessionUser() || appState.currentPage === 'login') return;
  if (!shouldShowOnboarding()) return;
  setTimeout(() => showOnboardingWizard(), 800);
}

const MOBILE_STYLE_ID = 'qhse-terrain-mobile-shell';

function ensureTerrainMobileStyles() {
  if (document.getElementById(MOBILE_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = MOBILE_STYLE_ID;
  el.textContent = `
.terrain-bottom-nav{display:none!important}
@media (max-width:900px){
  [data-display-mode="terrain"] .sidebar-v2{display:none!important}
  [data-display-mode="terrain"] .topbar-v2__center,
  [data-display-mode="terrain"] .topbar-v2__quick-wrap{display:none!important}
  [data-display-mode="terrain"] .main-shell{padding-bottom:74px}
  [data-display-mode="terrain"] .terrain-bottom-nav{
    display:grid!important;
    position:fixed;left:0;right:0;bottom:0;z-index:2000;
    grid-template-columns:repeat(4,1fr);gap:6px;padding:8px;
    background:color-mix(in srgb,var(--color-surface) 95%,black);
    border-top:1px solid var(--color-border-secondary)
  }
  .terrain-bottom-nav__btn{min-height:48px;border:1px solid var(--color-border-secondary);border-radius:12px;background:var(--color-background-secondary);color:var(--text);font-size:12px;font-weight:700}
  .terrain-bottom-nav__btn.is-active{border-color:color-mix(in srgb,var(--app-accent,#14b8a6) 45%,var(--color-border-secondary));background:color-mix(in srgb,var(--app-accent,#14b8a6) 16%,var(--color-background-secondary))}
}
`;
  document.head.append(el);
}

function createTerrainBottomNav(currentPage, onNavigate) {
  const nav = document.createElement('nav');
  nav.className = 'terrain-bottom-nav';
  nav.setAttribute('aria-label', 'Navigation mode Essentiel');
  const items = TERRAIN_BOTTOM_NAV_ITEMS;
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

const SW_UPDATE_SESSION_KEY = 'qhse-sw-update-pending';
/** Une fois : `localStorage.setItem('qhse-sw-purge-once','1')` puis recharger — désinscription + vidage caches + reload. */
const SW_PURGE_ONCE_KEY = 'qhse-sw-purge-once';
const SW_DEBUG_STORAGE_KEY = 'qhse_sw_debug';

let swClientHooksInstalled = false;
let swLoadHandlerRegistered = false;

/**
 * Enregistre le background sync terrain (retry quand le réseau revient).
 * Fallback : les handlers `online` + boot appellent déjà `syncTerrainIncidentQueue`.
 */
async function registerTerrainBackgroundSync() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.sync || typeof reg.sync.register !== 'function') return;
    const st = await getTerrainQueueState();
    const pendingIncidentsOrAudits = (st.pendingIncidents || 0) + (st.pendingAudits || 0);
    if (pendingIncidentsOrAudits > 0) {
      await reg.sync.register('terrain-incident-sync');
    }
    if ((st.pendingRisks || 0) > 0) {
      await reg.sync.register('terrain-risk-sync');
    }
  } catch {
    /* SyncManager refusé / navigateur ancien — pas bloquant */
  }
}

function installTerrainSyncClientBridge() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SW_SYNC_INCIDENTS') {
      void syncTerrainIncidentQueue().catch(() => {});
    }
    if (event.data?.type === 'SW_SYNC_RISKS') {
      void syncTerrainRiskQueue().catch(() => {});
    }
  });
}

installTerrainSyncClientBridge();

/**
 * Mise à jour SW : toast avec bouton « Recharger » (persistant).
 * @param {ServiceWorkerRegistration} reg
 */
function showSwUpdateToast(reg) {
  showToast(
    '🔄 Mise à jour disponible',
    'info',
    {
      label: 'Recharger',
      swUpdateBanner: true,
      persistent: true,
      action: () => {
        sessionStorage.setItem(SW_UPDATE_SESSION_KEY, '1');
        reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  );
}

function swDebugLog(...args) {
  const on =
    (import.meta.env && import.meta.env.DEV) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem(SW_DEBUG_STORAGE_KEY) === '1');
  if (on) console.info('[QHSE/SW]', ...args);
}

function registerPwaServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  if (!swClientHooksInstalled) {
    swClientHooksInstalled = true;
    let controllerChangeReloadScheduled = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      swDebugLog('controllerchange', {
        controller: navigator.serviceWorker.controller?.scriptURL,
        pendingReloadFlag: sessionStorage.getItem(SW_UPDATE_SESSION_KEY)
      });
      if (controllerChangeReloadScheduled) return;
      if (sessionStorage.getItem(SW_UPDATE_SESSION_KEY) !== '1') return;
      sessionStorage.removeItem(SW_UPDATE_SESSION_KEY);
      controllerChangeReloadScheduled = true;
      swDebugLog('reload once after SW update');
      window.location.reload();
    });
  }

  if (swLoadHandlerRegistered) return;
  swLoadHandlerRegistered = true;

  window.addEventListener('load', () => {
    void (async () => {
      if (localStorage.getItem(SW_PURGE_ONCE_KEY) === '1') {
        localStorage.removeItem(SW_PURGE_ONCE_KEY);
        swDebugLog('purge-once: unregister all + delete caches');
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        } catch (e) {
          console.warn('[QHSE/SW] purge-once failed', e);
        }
        window.location.reload();
        return;
      }

      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        swDebugLog('registered', {
          scope: reg.scope,
          active: reg.active?.state,
          waiting: Boolean(reg.waiting),
          installing: Boolean(reg.installing)
        });

        const terrainQ = await getTerrainQueueState();
        if ((terrainQ.pendingTotal || 0) > 0) {
          void registerTerrainBackgroundSync();
        }

        if (reg.waiting && navigator.serviceWorker.controller) {
          showSwUpdateToast(reg);
        }

        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            swDebugLog('installing statechange', nw.state);
            if (nw.state !== 'installed' || !reg.waiting) return;
            if (!navigator.serviceWorker.controller) {
              swDebugLog('updatefound (première installation, pas de toast)');
              return;
            }
            swDebugLog('updatefound → toast mise à jour');
            showSwUpdateToast(reg);
          });
        });
      } catch {
        /* ignore */
      }
    })();
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
  if (!pageRoot?.classList?.contains('qhse-page-host')) return;
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
    'QHSE Control doit être servi via un serveur web (recommandé : npm run dev puis http://localhost:5173). L’ouverture directe du fichier (file://) n’est pas prise en charge.';
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
    detail: 'Application QHSE Control prête',
    user: 'Système'
  });
}

const APP_BRAND_TITLE = 'QHSE Control';

/** @type {string | null} — évite de précharger plusieurs fois pour la même session navigateur. */
let qhseRoutePrefetchKey = null;

const PAGE_IMPORT_LOADERS = {
  dashboard: () => import('./pages/dashboard.js'),
  'mines-demo': () => import('./pages/mines-demo.js'),
  incidents: () => import('./pages/incidents.js'),
  audits: () => import('./pages/audits.js'),
  iso: () => import('./pages/iso.js'),
  analytics: () => import('./pages/analytics.js'),
  risks: () => import('./pages/risks.js'),
  actions: () => import('./pages/actions.js'),
  settings: () => import('./pages/settings.js'),
  habilitations: () => import('./pages/habilitations.js'),
  'terrain-mode': () => import('./pages/terrain-mode.js'),
  permits: () => import('./pages/permits.js'),
  products: () => import('./pages/products.js'),
  imports: () => import('./pages/imports.js'),
  sites: () => import('./pages/sites.js'),
  performance: () => import('./pages/performance.js'),
  'ai-center': () => import('./pages/ai-center.js'),
  'activity-log': () => import('./pages/activity-log.js'),
  'audit-logs': () => import('./pages/activity-log.js'),
  'saas-clients': () => import('./pages/saas-clients.js')
};

/**
 * Précharge en idle les chunks des pages les plus ouvertes (une fois par utilisateur connecté).
 * Ne remplace pas le chargement du tableau de bord initial ; s’exécute après un court délai.
 */
function scheduleIdleRoutePrefetch() {
  const su = getSessionUser();
  if (!su?.role) {
    qhseRoutePrefetchKey = null;
    return;
  }
  const key = `${su.id || su.email || 'user'}:${su.role}`;
  if (qhseRoutePrefetchKey === key) return;
  qhseRoutePrefetchKey = key;

  const run = () => {
    const su2 = getSessionUser();
    if (!su2?.role) return;
    const cur = appState.currentPage;
    const terrain = getDisplayMode() === 'terrain';
    /** @type {Array<keyof typeof PAGE_IMPORT_LOADERS>} */
    const want = ['incidents', 'risks', 'actions', 'audits'];
    if (terrain) want.push('terrain-mode');
    for (const pageId of want) {
      if (pageId === cur) continue;
      if (!canAccessNavPage(su2.role, pageId)) continue;
      const load = PAGE_IMPORT_LOADERS[pageId];
      if (load) void load().catch(() => {});
    }
  };

  const kick = () => {
    try {
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(() => run(), { timeout: 4500 });
      } else {
        setTimeout(run, 1800);
      }
    } catch {
      setTimeout(run, 1800);
    }
  };
  setTimeout(kick, 700);
}

/**
 * Charge le module de page à la demande (code-splitting).
 * @param {string} pageId
 * @returns {Promise<object | null>}
 */
async function loadPage(pageId) {
  const loader = PAGE_IMPORT_LOADERS[pageId];
  if (!loader) return null;
  const mod = await loader();
  return mod.default || mod;
}

/** @param {unknown} err */
function buildRenderErrorView(err) {
  console.error('[QHSE] Rendu page', err);
  const wrap = document.createElement('div');
  wrap.className = 'page-stack';
  const article = document.createElement('article');
  article.className = 'content-card card-soft qhse-render-error-card';
  const h = document.createElement('h2');
  h.className = 'qhse-render-error-title';
  h.textContent = 'Impossible d’afficher cette page';
  const p = document.createElement('p');
  p.className = 'qhse-render-error-lead';
  p.textContent =
    'Une erreur technique a interrompu l’affichage. Ouvrez la console (F12) pour le détail.';
  const em = document.createElement('p');
  em.className = 'qhse-render-error-detail';
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

const ROUTE_LOADING_STYLE_ID = 'qhse-route-loading-keyframes';

function ensureRouteLoadingStyles() {
  if (document.getElementById(ROUTE_LOADING_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = ROUTE_LOADING_STYLE_ID;
  el.textContent = `@keyframes qhse-route-spin{to{transform:rotate(360deg)}}.qhse-route-loading--spinner{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;min-height:180px}.qhse-route-loading__spinner{width:40px;height:40px;border:3px solid var(--color-border-secondary,#334155);border-top-color:var(--app-accent,#14b8a6);border-radius:50%;animation:qhse-route-spin .75s linear infinite}`;
  document.head.append(el);
}

function createRouteLoadingView() {
  ensureRouteLoadingStyles();
  const wrap = document.createElement('div');
  wrap.className = 'qhse-route-loading content-card card-soft qhse-route-loading--spinner';
  wrap.setAttribute('role', 'status');
  wrap.setAttribute('aria-live', 'polite');
  wrap.setAttribute('aria-busy', 'true');
  const spinner = document.createElement('div');
  spinner.className = 'qhse-route-loading__spinner';
  spinner.setAttribute('aria-hidden', 'true');
  const p = document.createElement('p');
  p.className = 'qhse-route-loading__text';
  p.textContent = 'Chargement de la page…';
  wrap.append(spinner, p);
  return wrap;
}

/**
 * @param {string} targetPage
 * @param {object} mod
 * @param {(entry: unknown) => void} onAddLog
 * @returns {Promise<HTMLElement>}
 */
async function renderPageRootFromModule(targetPage, mod, onAddLog) {
  switch (targetPage) {
    case 'mines-demo':
      return mod.renderMinesDemo();
    case 'terrain-mode':
      return mod.renderTerrainMode();
    case 'incidents':
      return mod.renderIncidents(onAddLog);
    case 'risks':
      return mod.renderRisks();
    case 'actions':
      return mod.renderActions();
    case 'permits':
      return mod.renderPermits();
    case 'iso':
      return mod.renderIso(onAddLog);
    case 'audits':
      return mod.renderAudits();
    case 'products':
      return mod.renderProducts();
    case 'habilitations':
      return mod.renderHabilitations();
    case 'imports':
      return mod.renderImports();
    case 'sites':
      return mod.renderSites();
    case 'analytics':
      return mod.renderAnalytics();
    case 'performance':
      return mod.renderPerformance();
    case 'ai-center':
      return mod.renderAiCenter(onAddLog);
    case 'activity-log':
      return mod.renderActivityLog();
    case 'audit-logs':
      return mod.renderActivityLog({ initialTab: 'server' });
    case 'settings':
      return mod.renderSettings();
    case 'saas-clients':
      return mod.renderSaasClients();
    case 'dashboard':
    default:
      return mod.renderDashboard();
  }
}

/**
 * @param {{ currentPage: string; onAddLog: (entry: unknown) => void }} opts
 * @returns {HTMLElement}
 */
function createPageRenderer(opts) {
  const { currentPage, onAddLog } = opts;
  if (
    currentPage === 'login' ||
    currentPage === 'forgot-password' ||
    currentPage === 'reset-password' ||
    currentPage === 'first-password'
  ) {
    return document.createElement('div');
  }

  const host = document.createElement('div');
  host.className = 'qhse-page-host';
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

  void (async () => {
    try {
      let mod = await loadPage(targetPage);
      if (!mod) {
        const dash = await import('./pages/dashboard.js');
        mod = dash.default || dash;
        targetPage = 'dashboard';
      }
      const root = await renderPageRootFromModule(targetPage, mod, onAddLog);
      if (!slot.isConnected) return;
      slot.replaceChildren(root);
    } catch (err) {
      if (!slot.isConnected) return;
      slot.replaceChildren(buildRenderErrorView(err));
    }
  })();

  return host;
}

function syncDocumentTitle(pageId) {
  if (pageId === 'login') {
    document.title = `${APP_BRAND_TITLE} — Connexion`;
    return;
  }
  if (pageId === 'forgot-password') {
    document.title = `${APP_BRAND_TITLE} — Mot de passe oublié`;
    return;
  }
  if (pageId === 'reset-password') {
    document.title = `${APP_BRAND_TITLE} — Nouveau mot de passe`;
    return;
  }
  if (pageId === 'first-password') {
    document.title = `${APP_BRAND_TITLE} — Mot de passe définitif`;
    return;
  }
  if (pageId === 'saas-clients') {
    document.title = `Clients SaaS · ${APP_BRAND_TITLE}`;
    return;
  }
  const meta = pageTopbarById[pageId];
  if (meta?.title) {
    document.title = `${meta.title} · ${APP_BRAND_TITLE}`;
    return;
  }
  const ctx = getNavContextForPage(pageId);
  if (ctx?.item?.label) {
    document.title = `${ctx.item.label} · ${APP_BRAND_TITLE}`;
    return;
  }
  document.title = APP_BRAND_TITLE;
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
    const pwdTok = getPasswordSetupToken();
    if (pwdTok && appState.currentPage !== 'first-password') {
      setCurrentPage('first-password');
      window.location.hash = 'first-password';
      renderApp();
      return;
    }

    const demoGuestMode = isDemoMode() && !getAuthToken() && !getSessionUser();
    if (demoGuestMode && appState.currentPage === 'dashboard') {
      setCurrentPage('mines-demo');
    }

    const terrainMode = getDisplayMode() === 'terrain';
    const expertMode = getDisplayMode() === 'expert';
    ensureTerrainMobileStyles();
    if (terrainMode) {
      const publicAuthPages = new Set(['login', 'forgot-password', 'reset-password', 'first-password']);
      if (
        !publicAuthPages.has(appState.currentPage) &&
        !TERRAIN_ALLOWED_PAGE_IDS.has(appState.currentPage)
      ) {
        setCurrentPage('terrain-mode');
      }
    }

    if (
      appState.currentPage === 'login' ||
      appState.currentPage === 'forgot-password' ||
      appState.currentPage === 'reset-password' ||
      appState.currentPage === 'first-password'
    ) {
      qhseRoutePrefetchKey = null;
      syncDocumentTitle(appState.currentPage);
      const onAuthNavigate = () => {
        try {
          renderApp();
        } catch (err) {
          console.error('[QHSE] auth view navigate', err);
          captureQhseException(err, { phase: 'auth-navigate' });
        }
      };
      if (appState.currentPage === 'first-password') {
        app.append(
          createFirstPasswordChangeView({
            onSuccess: async () => {
              renderApp();
              scheduleProductOnboardingTour();
            },
            onNavigate: onAuthNavigate
          })
        );
        return;
      }
      if (appState.currentPage === 'forgot-password') {
        app.append(createForgotPasswordView({ onNavigate: onAuthNavigate }));
        return;
      }
      if (appState.currentPage === 'reset-password') {
        app.append(createResetPasswordView({ onNavigate: onAuthNavigate }));
        return;
      }
      app.append(
        createLoginView({
          onSuccess: async () => {
            renderApp();
            scheduleProductOnboardingTour();
          },
          onNavigate: onAuthNavigate
        })
      );
      return;
    }

    const shell = document.createElement('div');
    shell.className = 'app-shell';

    const sidebar = createSidebar({
      currentPage: appState.currentPage,
      onNavigate: (pageId) => {
        if (expertMode) appState.expertMobileNavOpen = false;
        setCurrentPage(pageId);
        window.location.hash = pageId;
        renderApp();
      },
      onExpertMobileDrawerClose: expertMode
        ? () => {
            appState.expertMobileNavOpen = false;
            renderApp();
          }
        : undefined,
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
      expertMobileNavOpen: expertMode && appState.expertMobileNavOpen,
      onExpertMobileNavToggle: expertMode
        ? () => {
            appState.expertMobileNavOpen = !appState.expertMobileNavOpen;
            renderApp();
          }
        : undefined,
      onToggleNotifications: () => {
        appState.notificationsOpen = !appState.notificationsOpen;
        renderApp();
      },
      onNavigate: (pageId) => {
        if (expertMode) appState.expertMobileNavOpen = false;
        setCurrentPage(pageId);
        window.location.hash = pageId;
        renderApp();
      }
    });

    const pageRenderer = createPageRenderer({
      currentPage: appState.currentPage,
      onNavigate: (pageId) => {
        if (expertMode) appState.expertMobileNavOpen = false;
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

    content.append(topbar);

    content.append(pageRenderer);

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

    if (expertMode) {
      if (appState.expertMobileNavOpen) shell.classList.add('app-shell--nav-open');
      else shell.classList.remove('app-shell--nav-open');
      const backdrop = document.createElement('button');
      backdrop.type = 'button';
      backdrop.className = 'app-shell__nav-backdrop';
      backdrop.setAttribute('aria-label', 'Fermer le menu');
      if (!appState.expertMobileNavOpen) backdrop.hidden = true;
      backdrop.addEventListener('click', () => {
        appState.expertMobileNavOpen = false;
        renderApp();
      });
      shell.append(backdrop);
    } else {
      appState.expertMobileNavOpen = false;
    }

    app.append(shell);
    syncDocumentTitle(appState.currentPage);
    scheduleIdleRoutePrefetch();

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
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return;
  const path = hash.split('?')[0];
  if (path) setCurrentPage(path);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

let expertMobileNavEscapeRegistered = false;
function ensureExpertMobileNavEscape() {
  if (expertMobileNavEscapeRegistered) return;
  expertMobileNavEscapeRegistered = true;
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (getDisplayMode() !== 'expert') return;
    if (!appState.expertMobileNavOpen) return;
    appState.expertMobileNavOpen = false;
    renderApp();
  });
}

async function boot() {
  try {
    await initQhseSentry();
    initDisplayMode();
    subscribeDisplayModeViewport(() => {
      try {
        renderApp();
      } catch (e) {
        console.error('[QHSE] viewport display mode', e);
      }
    });
    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
      showFatalShell(
        'Application non chargée (fichier local)',
        'Ouvrez http://localhost:5173 après npm run dev. Le mode file:// ne charge pas correctement les modules JavaScript.'
      );
      return;
    }
    initRouting();
    ensureExpertMobileNavEscape();
    registerPwaServiceWorker();
    try {
      await Promise.race([restoreSessionFromToken(), sleep(10000)]);
    } catch (e) {
      console.error('[QHSE] restoreSessionFromToken', e);
    }
    logBootEvent();
    renderApp();
    scheduleProductOnboardingTour();
    if (navigator.onLine !== false) {
      void registerTerrainBackgroundSync();
      void syncTerrainIncidentQueue().catch(() => {});
    }
    Promise.all([
      loadNotificationsFromApi(),
      refreshConformityStatusCacheFromApi(),
      refreshPermitsFromApi(),
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

window.addEventListener('qhse-navigate', (e) => {
  const page = e.detail?.page;
  if (!page || typeof setCurrentPage !== 'function') return;
  if (getDisplayMode() === 'expert') appState.expertMobileNavOpen = false;
  setCurrentPage(page);
  window.location.hash = page;
  try {
    renderApp();
  } catch (err) {
    console.error('[QHSE] qhse-navigate renderApp', err);
    captureQhseException(err, { phase: 'qhse-navigate' });
    showFatalShell('Erreur de navigation', String(err?.message || err));
  }
});

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return;
  if (getDisplayMode() === 'expert') appState.expertMobileNavOpen = false;
  const path = hash.split('?')[0];
  if (path) setCurrentPage(path);
  try {
    renderApp();
  } catch (e) {
    console.error('[QHSE] hashchange renderApp', e);
    captureQhseException(e, { phase: 'hashchange' });
    showFatalShell('Erreur de navigation', String(e?.message || e));
  }
});

window.addEventListener('online', () => {
  void registerTerrainBackgroundSync();
  void syncTerrainIncidentQueue().catch(() => {});
  void flushSyncQueue();
});
window.addEventListener('online', () => {
  void syncAllTerrainQueues().catch(() => {});
});

navigator.serviceWorker?.addEventListener('message', (event) => {
  if (event.data?.type === 'SW_SYNC_INCIDENTS') {
    void syncTerrainIncidentQueue().catch(() => {});
  }
  if (event.data?.type === 'SW_SYNC_RISKS') {
    void syncTerrainRiskQueue().catch(() => {});
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration('/sw.js').then(reg => {
    if (!reg) return;
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          if (typeof showToast === 'function') {
            showToast('Mise a jour disponible — rechargez la page', 'info');
          }
        }
      });
    });
  });
}
