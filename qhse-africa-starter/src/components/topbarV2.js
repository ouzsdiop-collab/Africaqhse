import {
  pageTopbarById,
  getFlattenedNavItems,
  getBreadcrumbForPage,
  getNavContextForPage
} from '../data/navigation.js';
import { canAccessNavPage, canResource } from '../utils/permissionsUi.js';
import { getDisplayMode, setDisplayMode } from '../utils/displayMode.js';
import { TERRAIN_ALLOWED_PAGE_IDS } from '../utils/terrainModePages.js';
import { showToast } from './toast.js';
import { isDemoMode } from '../services/demoMode.service.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { getActiveTenant } from '../data/sessionUser.js';

const STYLE_ID = 'qhse-topbar-v2-styles';
const DASHBOARD_INTENT_LAST_KEY = 'qhse.dashboard.intent.last';

function readDashboardIntentLast() {
  try {
    const raw = localStorage.getItem(DASHBOARD_INTENT_LAST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function ensureTopbarV2Styles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = `
.topbar-v2 {
  position: sticky;
  top: 0;
  z-index: var(--z-topbar);
  flex-shrink: 0;
  min-height: 56px;
  height: auto;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 8px var(--space-4) 8px clamp(var(--space-3), 2vw, var(--space-4));
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--color-surface) 84%, var(--palette-accent, #14b8a6) 5%) 0%,
    color-mix(in srgb, var(--color-surface) 96%, var(--color-subtle)) 100%
  );
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
  box-shadow:
    0 1px 0 color-mix(in srgb, var(--color-border) 42%, transparent),
    0 10px 30px color-mix(in srgb, var(--palette-accent, #14b8a6) 10%, transparent);
  font-family: var(--font-body);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .topbar-v2 {
    background: var(--color-surface);
  }
}
.topbar-v2__inner {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0 clamp(10px, 1vw, 16px);
}
.topbar-v2__lead {
  flex: 0 1 42%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
}
.topbar-v2__page-title {
  margin: 0;
  padding: 0;
  font-family: inherit;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.22;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: min(420px, 38vw);
}
.topbar-v2__lead .topbar-v2__breadcrumb {
  opacity: 0.92;
}
.topbar-v2__breadcrumb {
  flex: 0 1 auto;
  min-width: 0;
}
.topbar-v2__breadcrumb-nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  font-size: 11.5px;
  line-height: 1.35;
  color: var(--color-text-muted);
}
.topbar-v2__breadcrumb-sep {
  color: var(--color-text-muted);
  user-select: none;
  font-weight: 500;
}
.topbar-v2__breadcrumb-link {
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  font: inherit;
  font-size: inherit;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color 160ms ease;
  text-decoration: none;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.topbar-v2__breadcrumb-link:hover {
  color: var(--color-primary-text);
}
.topbar-v2__breadcrumb-current {
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 280px;
}
.topbar-v2__breadcrumb-static {
  font-weight: 500;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}
.topbar-v2__tenant {
  margin: 2px 0 0;
  font-size: 11px;
  line-height: 1.25;
  color: var(--color-text-muted, var(--color-text-tertiary));
  max-width: min(420px, 88vw);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.topbar-v2__center {
  flex: 1 1 200px;
  min-width: 0;
  display: flex;
  justify-content: center;
}
.topbar-v2 .shell-quick-search {
  position: relative;
  width: 100%;
  max-width: 420px;
}
.topbar-v2 .shell-search-icon {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  color: var(--color-text-muted);
  pointer-events: none;
}
.topbar-v2 .shell-quick-search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 9px var(--space-3) 9px 40px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--color-border) 85%, transparent);
  background: color-mix(in srgb, var(--color-subtle) 92%, var(--color-surface));
  color: var(--color-text);
  font-family: inherit;
  font-size: 13.5px;
  line-height: 1.4;
  transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
}
.topbar-v2 .shell-quick-search-input:hover {
  border-color: var(--color-primary-border);
  background: var(--color-surface);
}
.topbar-v2 .shell-quick-search-input:focus {
  outline: none;
  border-color: var(--color-primary-border);
  background: var(--color-surface);
  box-shadow: 0 0 0 2px var(--color-primary-bg);
}
.topbar-v2 .shell-quick-search:focus-within .shell-search-icon {
  color: var(--color-primary-text);
}
.topbar-v2 .shell-quick-search-results {
  position: absolute;
  top: calc(100% + var(--space-1));
  left: 0;
  right: 0;
  margin: 0;
  padding: var(--space-2);
  list-style: none;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
  max-height: 320px;
  overflow-y: auto;
  z-index: calc(var(--z-topbar) + 1);
}
.topbar-v2 .shell-search-result-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background 150ms ease;
}
.topbar-v2 .shell-search-result-btn:hover {
  background: var(--color-subtle);
}
.topbar-v2 .shell-search-result-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}
.topbar-v2 .shell-search-result-group {
  font-size: 12px;
  color: var(--color-text-muted);
}
.topbar-v2 .shell-search-empty {
  padding: var(--space-3);
  font-size: 13px;
  color: var(--color-text-muted);
}
.topbar-v2 .shell-search-intent {
  margin: 0 0 var(--space-1);
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--color-primary-border) 58%, var(--color-border));
  background: color-mix(in srgb, var(--color-primary-bg) 72%, transparent);
  color: var(--color-primary-text);
  font-size: 11px;
  font-weight: 700;
}
.topbar-v2__demo-pill {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, rgb(129, 140, 248) 55%, transparent);
  background: color-mix(in srgb, rgb(99, 102, 241) 22%, transparent);
  color: color-mix(in srgb, rgb(199, 210, 254) 92%, var(--color-text));
  line-height: 1.2;
}
.topbar-v2__demo-pill[hidden] {
  display: none !important;
}
.topbar-v2__trailing {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 4px 0 4px var(--space-2);
  margin-left: var(--space-1);
  border-left: 1px solid color-mix(in srgb, var(--color-border) 55%, transparent);
}
.topbar-v2__quick-wrap {
  position: relative;
}
.topbar-v2__quick {
  min-height: 36px;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--color-primary-border) 58%, var(--color-border));
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--color-primary-bg) 92%, var(--color-surface)) 0%,
    color-mix(in srgb, var(--color-primary-bg) 78%, var(--color-surface)) 100%
  );
  color: var(--color-primary-text);
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 160ms cubic-bezier(0.33, 1, 0.68, 1),
    border-color 160ms cubic-bezier(0.33, 1, 0.68, 1);
  white-space: nowrap;
}
.topbar-v2__quick:hover {
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--color-primary-bg) 98%, var(--color-surface)) 0%,
    color-mix(in srgb, var(--color-primary-bg) 84%, var(--color-surface)) 100%
  );
  border-color: color-mix(in srgb, var(--color-primary-border) 72%, var(--color-border));
}
.topbar-v2__quick[aria-expanded="true"] {
  border-color: var(--color-primary-border);
  background: var(--color-primary-bg);
}
.topbar-v2__quick-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  margin: 0;
  padding: var(--space-2);
  list-style: none;
  min-width: 220px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
  z-index: calc(var(--z-topbar) + 2);
  transform-origin: top right;
}
.topbar-v2__quick-menu[hidden] {
  display: none !important;
}
.topbar-v2__quick-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--space-2) var(--space-3);
  margin: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms ease;
}
.topbar-v2__quick-item:hover {
  background: var(--color-subtle);
}
.topbar-v2__ai {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 36px;
  min-width: 36px;
  height: 36px;
  padding: 0;
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--color-border) 80%, transparent);
  background: transparent;
  color: var(--color-text-muted);
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
}
.topbar-v2__ai:hover {
  background: var(--color-subtle);
  border-color: var(--color-border);
  color: var(--color-primary-text);
}
.topbar-v2__profile-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  transition: box-shadow 150ms ease, transform 150ms ease;
}
.topbar-v2__profile-btn:focus-visible {
  outline: none;
  box-shadow: var(--ds-shadow-focus, 0 0 0 2px var(--color-primary-bg));
}
.topbar-v2__profile-btn:hover .topbar-v2__avatar {
  filter: brightness(var(--effect-brightness-hover, 1.06));
}
.display-mode-switch {
  display: inline-flex;
  align-items: stretch;
  padding: 3px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--color-border) 88%, transparent);
  background: color-mix(in srgb, var(--color-subtle) 55%, transparent);
  gap: 2px;
}
.display-mode-seg {
  border: none;
  margin: 0;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  color: var(--color-text-muted);
  background: transparent;
  transition: background 150ms ease, color 150ms ease, box-shadow 150ms ease;
  white-space: nowrap;
}
.display-mode-seg:hover {
  color: var(--color-text-secondary);
}
.display-mode-seg.is-active {
  color: var(--color-primary-text);
  background: var(--color-primary-bg);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--color-primary-text) 12%, transparent);
}
[data-display-mode="terrain"] .display-mode-switch {
  border-color: color-mix(in srgb, var(--color-primary-border) 45%, var(--color-border));
}
@media (max-width: 1100px) {
  .topbar-v2__trailing {
    border-left: none;
    padding-left: 0;
    margin-left: 0;
  }
  .topbar-v2__inner {
    gap: var(--space-2);
  }
  .topbar-v2 .display-mode-seg {
    padding: 6px 9px;
    font-size: 10px;
  }
  .topbar-v2__breadcrumb-current {
    max-width: 140px;
  }
  .topbar-v2__page-title {
    max-width: min(280px, 52vw);
    font-size: 15px;
  }
  .topbar-v2 .shell-quick-search {
    max-width: min(420px, 36vw);
  }
}
.topbar-v2__notif-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}
.topbar-v2__notif {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition:
    background 180ms cubic-bezier(0.33, 1, 0.68, 1),
    border-color 180ms cubic-bezier(0.33, 1, 0.68, 1),
    color 180ms cubic-bezier(0.33, 1, 0.68, 1),
    opacity 120ms ease;
}
.topbar-v2__notif:hover {
  background: var(--color-subtle);
  color: var(--color-text);
  border-color: color-mix(in srgb, var(--color-primary-border) 45%, var(--color-border));
}
.topbar-v2__notif:active {
  opacity: 0.92;
}
.topbar-v2__notif-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
.topbar-v2__notif-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  z-index: 2;
  min-width: 15px;
  height: 15px;
  padding: 0 4px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 800;
  line-height: 15px;
  text-align: center;
  background: var(--palette-accent, var(--app-accent, #14b8a6));
  color: #fff;
  border: 2px solid var(--color-surface);
  box-sizing: border-box;
  display: none;
  pointer-events: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}
.topbar-v2__notif-badge--visible {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.topbar-v2__avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 800;
  color: var(--color-primary-text);
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary-border);
  flex-shrink: 0;
  transition: box-shadow 180ms ease, filter 180ms ease;
}
.topbar-v2__profile-btn:hover .topbar-v2__avatar {
  box-shadow: 0 2px 8px color-mix(in srgb, var(--color-primary-text) 15%, transparent);
}
@media (prefers-reduced-motion: reduce) {
  .topbar-v2 .shell-quick-search-input,
  .topbar-v2__notif,
  .topbar-v2__quick,
  .topbar-v2__ai {
    transition-duration: 0.01ms !important;
  }
}
`;
  document.head.append(el);
}

function navigateByHash(pageId) {
  window.location.hash = pageId;
}

const ICON_BELL_SVG = `<svg class="topbar-v2-bell-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.3 21a1.94 1.94 0 0 0 4 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** @param {{ name?: string; email?: string } | null | undefined} user */
function userInitials(user) {
  const raw = (user?.name || user?.email || 'Utilisateur').trim();
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0] || '';
    const b = parts[parts.length - 1][0] || '';
    return (a + b).toUpperCase();
  }
  return raw.slice(0, 2).toUpperCase() || 'U';
}

/**
 * @param {HTMLElement} host
 * @param {string} currentPage
 * @param {(pageId: string) => void} [onNavigate]
 * @param {{ omitCurrentPage?: boolean }} [options]
 */
function renderBreadcrumb(host, currentPage, onNavigate, options = {}) {
  const { omitCurrentPage = false } = options;
  host.replaceChildren();
  let crumbs = getBreadcrumbForPage(currentPage);
  if (omitCurrentPage && crumbs.length > 1) {
    crumbs = crumbs.slice(0, -1);
  }
  const nav = document.createElement('nav');
  nav.className = 'topbar-v2__breadcrumb-nav';
  nav.setAttribute('aria-label', 'Fil d\'Ariane');

  crumbs.forEach((crumb, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'topbar-v2__breadcrumb-sep';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = '›';
      nav.append(sep);
    }

    const isLast = i === crumbs.length - 1;

    if (isLast) {
      const span = document.createElement('span');
      span.className = 'topbar-v2__breadcrumb-current';
      span.textContent = crumb.label;
      span.setAttribute('aria-current', 'page');
      nav.append(span);
    } else if (crumb.pageId) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'topbar-v2__breadcrumb-link';
      btn.textContent = crumb.label;
      btn.addEventListener('click', () => {
        if (typeof onNavigate === 'function') onNavigate(crumb.pageId);
        else navigateByHash(crumb.pageId);
      });
      nav.append(btn);
    } else {
      const span = document.createElement('span');
      span.className = 'topbar-v2__breadcrumb-static';
      span.textContent = crumb.label;
      nav.append(span);
    }
  });

  host.append(nav);
}

function pageTitleForTopbar(currentPage) {
  const meta = pageTopbarById[currentPage];
  const ctx = getNavContextForPage(currentPage);
  return meta?.title || ctx?.item?.label || 'Module';
}

export function createTopbar({
  currentPage,
  sessionUser,
  unreadCount,
  onToggleNotifications,
  onNavigate
}) {
  ensureTopbarV2Styles();

  const header = document.createElement('header');
  header.className = 'topbar-v2';

  const role = sessionUser?.role;

  const safeUnread = Math.max(0, Number(unreadCount) || 0);
  const badgeLabel = safeUnread > 99 ? '99+' : String(safeUnread);
  const mode = getDisplayMode();
  const dashboardIntentLast = readDashboardIntentLast();

  header.innerHTML = `
    <div class="topbar-v2__inner">
      <div class="topbar-v2__lead">
        <p class="topbar-v2__page-title" data-tb2-page-title></p>
        <div class="topbar-v2__breadcrumb" data-tb2-breadcrumb></div>
        <p class="topbar-v2__tenant" data-tb2-tenant hidden></p>
      </div>
      <div class="topbar-v2__center">
        <div class="shell-quick-search" role="search">
          <label class="visually-hidden" for="tb2-shell-quick-search-input">Rechercher un module</label>
          <span class="shell-search-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input
            id="tb2-shell-quick-search-input"
            type="search"
            class="shell-quick-search-input"
            placeholder="Rechercher…"
            autocomplete="off"
            spellcheck="false"
          />
          <ul class="shell-quick-search-results" hidden></ul>
        </div>
      </div>
      <div class="topbar-v2__trailing">
        <span class="topbar-v2__demo-pill" hidden data-topbar-demo-pill title="Exploration : données d’illustration pour prise en main (hors production)">Essai</span>
        <span class="topbar-v2__notif-wrap">
          <button type="button" class="topbar-v2__notif notification-toggle" aria-label="Notifications${safeUnread ? ` (${safeUnread} non lues)` : ''}">
            <span class="topbar-v2__notif-icon" aria-hidden="true">${ICON_BELL_SVG}</span>
          </button>
          <span class="topbar-v2__notif-badge${safeUnread ? ' topbar-v2__notif-badge--visible' : ''}" ${safeUnread ? '' : 'hidden'} data-notif-badge>${badgeLabel}</span>
        </span>
        <div class="topbar-v2__quick-wrap">
          <button type="button" class="topbar-v2__quick topbar-quick-add" aria-expanded="false" aria-haspopup="true" aria-controls="topbar-quick-menu" id="topbar-quick-btn">Créer</button>
          <ul class="topbar-v2__quick-menu" id="topbar-quick-menu" role="menu" aria-labelledby="topbar-quick-btn" hidden></ul>
        </div>
        <button type="button" class="topbar-v2__ai topbar-ai-btn topbar-v2__ai--subtle" aria-label="Centre IA">
          <span aria-hidden="true">✦</span>
        </button>
        <button type="button" class="topbar-v2__profile-btn topbar-v2__avatar-wrap" aria-label="Ouvrir les paramètres">
          <span class="topbar-v2__avatar" aria-hidden="true"></span>
          <span class="visually-hidden topbar-v2__user-name"></span>
        </button>
        <div class="display-mode-switch" role="group" aria-label="Mode d'affichage">
          <button type="button" class="display-mode-seg${mode === 'terrain' ? ' is-active' : ''}" data-set-mode="terrain" aria-pressed="${mode === 'terrain' ? 'true' : 'false'}" title="Menu réduit, focus opérations terrain">Terrain</button>
          <button type="button" class="display-mode-seg${mode === 'expert' ? ' is-active' : ''}" data-set-mode="expert" aria-pressed="${mode === 'expert' ? 'true' : 'false'}" title="Tous les modules QHSE">Complet</button>
        </div>
      </div>
    </div>
  `;

  const demoPill = header.querySelector('[data-topbar-demo-pill]');
  function syncDemoPill() {
    if (demoPill instanceof HTMLElement) {
      demoPill.hidden = !isDemoMode();
    }
  }
  syncDemoPill();
  window.addEventListener('qhse-demo-mode-changed', syncDemoPill);
  window.addEventListener('qhse-demo-reset', syncDemoPill);

  const titleEl = header.querySelector('[data-tb2-page-title]');
  if (titleEl) {
    titleEl.textContent = pageTitleForTopbar(currentPage);
  }

  const breadcrumbHost = header.querySelector('[data-tb2-breadcrumb]');
  if (breadcrumbHost) {
    renderBreadcrumb(breadcrumbHost, currentPage, onNavigate, { omitCurrentPage: true });
  }

  const tenantLine = header.querySelector('[data-tb2-tenant]');
  if (tenantLine instanceof HTMLElement) {
    const org = getActiveTenant();
    if (org?.slug) {
      tenantLine.hidden = false;
      tenantLine.textContent = org.name || org.slug;
      tenantLine.title = org.slug;
    }
  }

  const avatarEl = header.querySelector('.topbar-v2__avatar');
  const nameHidden = header.querySelector('.topbar-v2__user-name');

  function allAccessibleItems() {
    const terrainMode = getDisplayMode() === 'terrain';
    return getFlattenedNavItems().filter((item) => {
      if (!canAccessNavPage(role, item.id)) return false;
      if (terrainMode && !TERRAIN_ALLOWED_PAGE_IDS.has(item.id)) return false;
      if (
        'resource' in item &&
        item.resource &&
        !canResource(
          role,
          item.resource,
          item.verb === 'write' ? 'write' : 'read'
        )
      ) {
        return false;
      }
      return true;
    });
  }

  if (avatarEl) {
    avatarEl.textContent = userInitials(sessionUser);
  }
  if (nameHidden) {
    nameHidden.textContent = sessionUser?.name || sessionUser?.email || 'Utilisateur';
  }

  const searchInput = header.querySelector('.shell-quick-search-input');
  const searchResults = header.querySelector('.shell-quick-search-results');
  const searchWrap = header.querySelector('.shell-quick-search');

  function dashboardIntentHint(intent) {
    if (!intent || intent.source !== 'dashboard') return '';
    if (intent.chart === 'risk_distribution' && intent.riskType) {
      return `Contexte Dashboard: risque ${intent.riskType}`;
    }
    if (intent.chart === 'incidents_trend') {
      return 'Contexte Dashboard: incidents (tendance)';
    }
    if (intent.chart === 'qhse_score') {
      return intent.period
        ? `Contexte Dashboard: score QHSE (${intent.period})`
        : 'Contexte Dashboard: score QHSE';
    }
    return '';
  }

  if (searchInput) {
    const hint = dashboardIntentHint(dashboardIntentLast);
    if (hint) searchInput.placeholder = `${hint} · rechercher…`;
  }

  function renderSearchResults(query) {
    if (!searchResults) return;
    const q = (query || '').trim().toLowerCase();
    searchResults.replaceChildren();
    if (!q) {
      searchResults.hidden = true;
      return;
    }
    const items = allAccessibleItems().filter(
      (it) =>
        it.label.toLowerCase().includes(q) || it.groupLabel.toLowerCase().includes(q)
    );
    const hint = dashboardIntentHint(dashboardIntentLast);
    if (hint) {
      const liHint = document.createElement('li');
      liHint.className = 'shell-search-intent';
      liHint.textContent = hint;
      searchResults.append(liHint);
    }
    const max = 8;
    items.slice(0, max).forEach((it) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shell-search-result-btn';
      btn.innerHTML = `<span class="shell-search-result-title">${escapeHtml(it.label)}</span><span class="shell-search-result-group">${escapeHtml(it.groupLabel)}</span>`;
      btn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        searchResults.hidden = true;
        if (typeof onNavigate === 'function') onNavigate(it.id);
        else navigateByHash(it.id);
      });
      li.append(btn);
      searchResults.append(li);
    });
    if (items.length === 0) {
      const li = document.createElement('li');
      li.className = 'shell-search-empty';
      li.textContent = 'Aucun module correspondant';
      searchResults.append(li);
    }
    searchResults.hidden = false;
  }

  function closeSearchOnOutside(ev) {
    if (searchWrap && !searchWrap.contains(ev.target)) {
      if (searchResults) searchResults.hidden = true;
      document.removeEventListener('click', closeSearchOnOutside, true);
    }
  }

  if (searchInput && searchResults) {
    searchInput.addEventListener('input', () => renderSearchResults(searchInput.value));
    searchInput.addEventListener('focus', () => {
      document.addEventListener('click', closeSearchOnOutside, true);
      if (searchInput.value.trim()) renderSearchResults(searchInput.value);
    });
    searchInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        searchResults.hidden = true;
        searchInput.blur();
      }
    });
  }

  const modeSwitch = header.querySelector('.display-mode-switch');
  function syncModeSegments(activeMode) {
    if (!modeSwitch) return;
    modeSwitch.querySelectorAll('[data-set-mode]').forEach((btn) => {
      const m = btn.getAttribute('data-set-mode');
      const on = m === activeMode;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  if (modeSwitch) {
    modeSwitch.querySelectorAll('[data-set-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-set-mode');
        if (target !== 'terrain' && target !== 'expert') return;
        if (getDisplayMode() === target) return;
        setDisplayMode(target);
        syncModeSegments(target);
        if (target === 'terrain') {
          showToast('Mode terrain — accès opérations et raccourcis chantier.', 'info');
          if (typeof onNavigate === 'function') onNavigate('terrain-mode');
          else navigateByHash('terrain-mode');
        } else {
          showToast('Mode complet — tous les modules du menu.', 'info');
          const dest = currentPage === 'terrain-mode' ? 'dashboard' : currentPage;
          if (typeof onNavigate === 'function') onNavigate(dest);
          else navigateByHash(dest);
        }
      });
    });
  }

  const notifBtn = header.querySelector('.notification-toggle');
  if (notifBtn) {
    notifBtn.addEventListener('click', onToggleNotifications);
  }

  const aiBtn = header.querySelector('.topbar-ai-btn');
  if (aiBtn && role && !canAccessNavPage(role, 'ai-center')) {
    aiBtn.style.display = 'none';
  }
  if (aiBtn) {
    aiBtn.addEventListener('click', () => {
      if (typeof onNavigate === 'function') onNavigate('ai-center');
      else navigateByHash('ai-center');
    });
  }

  const quickBtn = header.querySelector('.topbar-quick-add');
  const quickMenu = header.querySelector('#topbar-quick-menu');
  const quickWrap = header.querySelector('.topbar-v2__quick-wrap');
  if (quickBtn && quickMenu && quickWrap) {
    const quickSpecs = [
      {
        label: 'Incident',
        pageId: 'incidents',
        toast: 'Saisie incident — utilisez le module Incidents.'
      },
      {
        label: 'Action',
        pageId: 'actions',
        toast: 'Nouvelle action — depuis le plan d’actions.'
      },
      {
        label: 'Audit',
        pageId: 'audits',
        toast: 'Audit — renseignez le module Audits.'
      }
    ];
    function closeQuickMenu() {
      if (quickMenu.hidden) return;
      quickMenu.hidden = true;
      quickBtn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', closeQuickOnOutside, true);
      document.removeEventListener('keydown', onQuickEscape, true);
    }
    function onQuickEscape(ev) {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        closeQuickMenu();
      }
    }
    function closeQuickOnOutside(ev) {
      if (!quickWrap.contains(ev.target)) closeQuickMenu();
    }
    quickMenu.replaceChildren();
    quickSpecs.forEach((spec) => {
      if (role && !canAccessNavPage(role, spec.pageId)) return;
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'topbar-v2__quick-item';
      b.setAttribute('role', 'menuitem');
      b.textContent = spec.label;
      b.addEventListener('click', () => {
        closeQuickMenu();
        showToast(spec.toast, 'info');
        if (typeof onNavigate === 'function') onNavigate(spec.pageId);
        else navigateByHash(spec.pageId);
      });
      li.append(b);
      quickMenu.append(li);
    });
    if (!quickMenu.querySelector('li')) {
      quickBtn.style.display = 'none';
    }
    quickBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (!quickMenu.querySelector('li')) return;
      if (!quickMenu.hidden) {
        closeQuickMenu();
        return;
      }
      quickMenu.hidden = false;
      quickBtn.setAttribute('aria-expanded', 'true');
      document.addEventListener('click', closeQuickOnOutside, true);
      document.addEventListener('keydown', onQuickEscape, true);
    });
  }

  const profileBtn = header.querySelector('.topbar-v2__profile-btn');
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      if (typeof onNavigate === 'function') onNavigate('settings');
      else navigateByHash('settings');
    });
  }

  return header;
}
