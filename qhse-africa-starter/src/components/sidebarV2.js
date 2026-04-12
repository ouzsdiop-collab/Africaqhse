import { navigationGroups, siteOptions } from '../data/navigation.js';
import { appState } from '../utils/state.js';
import { fetchSitesCatalog } from '../services/sitesCatalog.service.js';
import {
  getSessionUser,
  setSessionUser,
  getAuthToken,
  clearAuthSession,
  getActiveTenant,
  getSessionTenants
} from '../data/sessionUser.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { canAccessNavPage, canResource } from '../utils/permissionsUi.js';
import { getDisplayMode } from '../utils/displayMode.js';
import { TERRAIN_ALLOWED_PAGE_IDS } from '../utils/terrainModePages.js';

const STYLE_ID = 'qhse-sidebar-v2-styles';

/** État repliable des familles de navigation (préférence locale, sans impact routing). */
const NAV_GROUPS_EXPANDED_KEY = 'qhse-nav-groups-expanded';

function readNavGroupsExpanded() {
  try {
    const raw = localStorage.getItem(NAV_GROUPS_EXPANDED_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw);
    return o && typeof o === 'object' ? o : {};
  } catch {
    return {};
  }
}

function writeNavGroupsExpanded(/** @type {Record<string, boolean>} */ map) {
  try {
    localStorage.setItem(NAV_GROUPS_EXPANDED_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function ensureSidebarV2Styles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  /* UI density (2026) : navigation latérale = repère discret, pas second écran décoratif. */
  el.textContent = `
.sidebar-v2 {
  width: 258px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-height: 100dvh;
  position: sticky;
  top: 0;
  align-self: flex-start;
  z-index: var(--z-sidebar);
  background: color-mix(in srgb, var(--color-surface) 97%, var(--palette-accent, #14b8a6) 3%);
  border-right: 1px solid color-mix(in srgb, var(--color-border) 65%, transparent);
  box-shadow: inset -1px 0 0 color-mix(in srgb, var(--color-border) 22%, transparent);
  font-family: var(--font-body);
}
.sidebar-v2__brand {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4) var(--space-4);
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
}
.sidebar-v2__brand-mark {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: var(--color-primary-text);
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary-border);
}
.sidebar-v2__brand-mark svg {
  width: 24px;
  height: 24px;
}
.sidebar-v2__brand-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.sidebar-v2__drawer-close {
  display: none;
  flex-shrink: 0;
  margin-left: auto;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-subtle) 80%, transparent);
  color: var(--color-text);
  font-size: 22px;
  line-height: 1;
  font-weight: 500;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.sidebar-v2__drawer-close:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary-border) 45%, transparent);
}
.sidebar-v2__brand-title {
  font-family: 'Inter', var(--font-body);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--color-text);
  letter-spacing: -0.02em;
}
.sidebar-v2__brand-badge {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  background: var(--color-subtle);
  align-self: flex-start;
}
.sidebar-v2__nav {
  flex: 1 1 0%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: var(--space-2) var(--space-3) var(--space-3);
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}
.sidebar-v2__group {
  margin-bottom: var(--space-4);
}
.sidebar-v2__group + .sidebar-v2__group {
  margin-top: var(--space-1);
  padding-top: var(--space-4);
  border-top: 1px solid color-mix(in srgb, var(--color-border) 42%, transparent);
}
.sidebar-v2__nav-divider {
  height: 0;
  margin: var(--space-1) 0 var(--space-2);
  border: none;
  border-top: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
  background: none;
}
.sidebar-v2__nav-divider + .sidebar-v2__group {
  margin-top: var(--space-3);
  padding-top: 0;
  border-top: none;
}
.sidebar-v2__group:last-child {
  margin-bottom: 0;
}
.sidebar-v2__group-toggle {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin: 0 0 var(--space-2) 0;
  padding: var(--space-1) var(--space-2);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  color: var(--color-text-muted);
  font: inherit;
  text-align: left;
  transition:
    background 180ms cubic-bezier(0.4, 0, 0.2, 1),
    color 180ms cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-tap-highlight-color: transparent;
}
.sidebar-v2__group-toggle:hover {
  background: color-mix(in srgb, var(--color-subtle) 72%, transparent);
  color: var(--color-text-secondary);
}
.sidebar-v2__group-toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary-border) 45%, transparent);
}
.sidebar-v2__group-toggle[aria-expanded='true'] {
  color: var(--color-text-secondary);
}
.sidebar-v2__group-chevron {
  flex-shrink: 0;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  opacity: 0.72;
  letter-spacing: 0;
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease;
}
.sidebar-v2__group-toggle:hover .sidebar-v2__group-chevron,
.sidebar-v2__group-toggle:focus-visible .sidebar-v2__group-chevron {
  opacity: 0.95;
}
.sidebar-v2__group-body {
  margin: 0;
  padding: 0;
}
.sidebar-v2__group-label {
  margin: 0 0 var(--space-2) var(--space-2);
  font-size: 9px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  opacity: 0.78;
}
.sidebar-v2__group-toggle .sidebar-v2__group-label {
  margin: 0;
  flex: 1;
  min-width: 0;
}
.sidebar-v2__items {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.sidebar-v2__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  text-align: left;
  border: none;
  border-radius: calc(var(--radius-md) + 1px);
  padding: var(--space-2) var(--space-3);
  padding-left: calc(var(--space-3) + 3px);
  margin: 0;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  cursor: pointer;
  position: relative;
  text-decoration: none;
  box-sizing: border-box;
  transition:
    background 220ms cubic-bezier(0.4, 0, 0.2, 1),
    color 220ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 220ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar-v2__item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  border-radius: 0 2px 2px 0;
  background: var(--color-primary-text);
  opacity: 0;
  transition:
    height 220ms cubic-bezier(0.4, 0, 0.2, 1),
    opacity 220ms cubic-bezier(0.4, 0, 0.2, 1),
    width 220ms cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar-v2__item:hover {
  background: color-mix(in srgb, var(--color-subtle) 88%, var(--color-surface));
  color: var(--color-text);
}
.sidebar-v2__item:active {
  transform: scale(0.992);
}
.sidebar-v2__item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary-border) 45%, transparent);
}
.sidebar-v2__item--active {
  color: var(--color-text);
  font-weight: 600;
  background: color-mix(in srgb, var(--color-primary-bg) 82%, var(--color-surface));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary-border) 40%, transparent);
}
.sidebar-v2__item--active::before {
  height: 72%;
  min-height: 24px;
  opacity: 1;
  width: 4px;
  border-radius: 0 3px 3px 0;
}
.sidebar-v2__item-text {
  flex: 1 1 auto;
  min-width: 0;
  text-align: left;
}
.sidebar-v2__item-badge {
  flex-shrink: 0;
  margin-left: var(--space-2);
  font-size: 10px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--color-text);
  background: color-mix(in srgb, var(--color-subtle) 70%, var(--color-surface));
  border: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
  box-sizing: border-box;
}
.sidebar-v2__item-badge[hidden] {
  display: none !important;
}
.sidebar-v2__item-badge--incidents {
  color: var(--color-danger-text);
  background: var(--color-danger-bg);
  border-color: color-mix(in srgb, var(--color-danger-border) 70%, var(--color-border));
}
.sidebar-v2__item-badge--actions {
  color: var(--color-warning-text);
  background: var(--color-warning-bg);
  border-color: color-mix(in srgb, var(--color-warning-border) 72%, var(--color-border));
}
.sidebar-v2__item-badge--audits {
  color: var(--color-info-text, var(--color-primary-text));
  background: color-mix(in srgb, var(--color-primary-bg) 88%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-primary-border) 55%, transparent);
}
.sidebar-v2__item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: inherit;
  opacity: 0.92;
}
.sidebar-v2__item-icon .shell-nav-svg {
  width: 20px;
  height: 20px;
}
.sidebar-v2__footer {
  flex-shrink: 0;
  padding: var(--space-2) var(--space-3) var(--space-3);
  border-top: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--color-subtle) 55%, var(--color-surface)) 0%,
    color-mix(in srgb, var(--color-subtle) 88%, var(--color-surface)) 100%
  );
}
.sidebar-v2__footer--compact {
  padding: 4px 6px 6px;
  gap: 4px;
  background: color-mix(in srgb, var(--color-subtle) 92%, var(--color-surface));
}
.sidebar-v2__footer-identity {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 4px 6px;
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--color-border) 42%, transparent);
  background: color-mix(in srgb, var(--color-surface) 92%, var(--color-subtle));
}
.sidebar-v2__footer-identity .sidebar-v2__block {
  margin: 0;
}
.sidebar-v2__footer-identity .sidebar-v2__account-card {
  border: none;
  background: transparent;
  padding: 0 0 5px;
  margin: 0;
  border-radius: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 45%, transparent);
}
.sidebar-v2__footer-identity .shell-account-actions {
  padding-top: 2px;
}
.sidebar-v2__footer--compact .sidebar-v2__footer-label {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  opacity: 0.72;
  margin: 0 0 5px;
}
.sidebar-v2__footer-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: var(--space-2);
}
.sidebar-v2__context .control-select,
.sidebar-v2 .shell-account-slot > .control-select {
  width: 100%;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  padding: var(--space-2) var(--space-3);
  font-family: inherit;
  font-size: 13px;
}
.sidebar-v2__footer--compact .sidebar-v2__context .control-select,
.sidebar-v2__footer--compact .shell-account-slot > .control-select {
  padding: 4px 8px;
  font-size: 11px;
  line-height: 1.3;
  min-height: 28px;
}
.sidebar-v2 .shell-account-actions {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.sidebar-v2__account-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}
.sidebar-v2__footer--compact .sidebar-v2__account-card {
  gap: 6px;
  padding: 0;
}
.sidebar-v2__account-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary-text);
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary-border);
  flex-shrink: 0;
}
.sidebar-v2__footer--compact .sidebar-v2__account-avatar {
  width: 32px;
  height: 32px;
  font-size: 11px;
  border-radius: var(--radius-sm);
}
.sidebar-v2__account-meta {
  min-width: 0;
  flex: 1;
}
.sidebar-v2__account-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sidebar-v2__footer--compact .sidebar-v2__account-name {
  font-size: 12px;
}
.sidebar-v2__account-role {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: var(--space-1);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.sidebar-v2__footer--compact .sidebar-v2__account-role {
  font-size: 10px;
  margin-top: 1px;
}
.sidebar-v2__account-org {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 3px;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sidebar-v2__footer--compact .sidebar-v2__account-org {
  font-size: 10px;
}
.sidebar-v2__btn-logout {
  width: 100%;
  margin-top: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
}
.sidebar-v2__btn-logout:hover {
  background: var(--color-surface);
  border-color: var(--color-primary-border);
  color: var(--color-text);
}
.sidebar-v2__footer--compact .sidebar-v2__btn-logout {
  margin-top: 4px;
  padding: 4px 8px;
  font-size: 11px;
  min-height: 28px;
}
.sidebar-v2__btn-ghost {
  width: 100%;
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
}
.sidebar-v2__footer--compact .sidebar-v2__btn-ghost {
  margin-top: 4px;
  padding: 4px 8px;
  font-size: 11px;
  min-height: 28px;
}
.sidebar-v2__btn-ghost:hover {
  background: var(--color-subtle);
  color: var(--color-text);
}
.sidebar-v2__btn-link {
  display: block;
  width: 100%;
  margin-top: var(--space-2);
  padding: var(--space-1) 0;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-info-text);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  transition: color 150ms ease;
}
.sidebar-v2__btn-link:hover {
  color: var(--color-primary-text);
}
.sidebar-v2__footer-secondary[hidden] {
  display: none !important;
}
.sidebar-v2__footer-secondary {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.sidebar-v2__footer--compact .sidebar-v2__footer-secondary {
  gap: 0;
  margin-top: 1px;
}
.sidebar-v2__footer-secondary > .sidebar-v2__footer-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  opacity: 0.72;
  margin-bottom: 0;
}
.sidebar-v2__footer-shortcuts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  width: 100%;
}
.sidebar-v2__footer--compact .sidebar-v2__footer-shortcuts {
  gap: 3px;
}
.sidebar-v2__footer-shortcut {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: 36px;
  padding: 4px var(--space-1);
  margin: 0;
  border: 1px solid color-mix(in srgb, var(--color-border) 78%, transparent);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  line-height: 1.2;
  text-align: center;
  cursor: pointer;
  transition:
    background 180ms cubic-bezier(0.4, 0, 0.2, 1),
    border-color 180ms cubic-bezier(0.4, 0, 0.2, 1),
    color 180ms cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar-v2__footer-shortcut--icon-only {
  flex-direction: row;
  align-items: center;
  justify-content: center;
  min-height: 0;
  aspect-ratio: 1;
  max-height: 28px;
  padding: 0;
  border-radius: var(--radius-sm);
  border-color: color-mix(in srgb, var(--color-border) 65%, transparent);
  background: color-mix(in srgb, var(--color-surface) 88%, transparent);
}
.sidebar-v2__footer-shortcut:hover {
  background: color-mix(in srgb, var(--color-primary-bg) 18%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-primary-border) 42%, var(--color-border));
  color: var(--color-text);
}
.sidebar-v2__footer-shortcut:active {
  background: color-mix(in srgb, var(--color-primary-bg) 26%, var(--color-surface));
}
.sidebar-v2__footer-shortcut--active {
  border-color: color-mix(in srgb, var(--color-primary-border) 50%, var(--color-border));
  background: color-mix(in srgb, var(--color-primary-bg) 82%, var(--color-surface));
  color: var(--color-text);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary-border) 28%, transparent);
}
.sidebar-v2__footer-shortcut--icon-only.sidebar-v2__footer-shortcut--active {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary-border) 35%, transparent);
}
.sidebar-v2__footer-shortcut-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  transition: color 200ms ease;
}
.sidebar-v2__footer-shortcut:hover .sidebar-v2__footer-shortcut-icon,
.sidebar-v2__footer-shortcut--active .sidebar-v2__footer-shortcut-icon {
  color: var(--color-primary-text);
}
.sidebar-v2__footer-shortcut-icon .shell-nav-svg {
  width: 18px;
  height: 18px;
}
.sidebar-v2__footer-shortcut--icon-only .sidebar-v2__footer-shortcut-icon .shell-nav-svg {
  width: 14px;
  height: 14px;
}
.sidebar-v2__status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--color-border) 55%, transparent);
  background: color-mix(in srgb, var(--color-surface) 65%, var(--color-subtle));
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
  line-height: 1.35;
  margin: 0;
}
.sidebar-v2__footer--compact .sidebar-v2__status {
  padding: 2px 0 0;
  margin: 0;
  font-size: 9px;
  font-weight: 500;
  border: none;
  background: transparent;
  justify-content: center;
  opacity: 0.75;
  gap: 5px;
}
.sidebar-v2__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--palette-accent, var(--app-accent, #14b8a6)) 75%, var(--color-text-muted));
  opacity: 0.9;
}
.sidebar-v2__footer--compact .sidebar-v2__status-dot {
  width: 4px;
  height: 4px;
}
.sidebar-v2__terrain-dock {
  display: none;
}
@media (max-width: 1024px) {
  [data-display-mode='terrain'] .terrain-bottom-nav {
    display: none !important;
  }
  [data-display-mode='terrain'] .app-shell .main-shell {
    padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
  }
  [data-display-mode='terrain'] aside.sidebar-v2#qhse-shell-sidebar {
    display: flex !important;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    min-height: 0;
    max-height: none;
    height: auto;
    flex-direction: column;
    flex-shrink: 0;
    align-self: stretch;
    z-index: 2100;
    padding: 0;
    margin: 0;
    border-right: none;
    border-top: 1px solid color-mix(in srgb, var(--color-border) 78%, transparent);
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -8px 28px color-mix(in srgb, var(--color-text) 12%, transparent);
    background: var(--color-surface);
  }
  [data-display-mode='terrain'] .sidebar-v2__brand,
  [data-display-mode='terrain'] .sidebar-v2__nav,
  [data-display-mode='terrain'] .sidebar-v2__footer {
    display: none !important;
  }
  [data-display-mode='terrain'] .sidebar-v2__terrain-dock {
    display: flex !important;
    width: 100%;
    justify-content: space-around;
    align-items: stretch;
    gap: 4px;
    padding: 8px 6px calc(10px + env(safe-area-inset-bottom, 0px));
    margin: 0;
  }
  .sidebar-v2__terrain-dock__btn {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 52px;
    padding: 6px 4px;
    margin: 0;
    border: none;
    border-radius: 12px;
    background: transparent;
    color: var(--color-text-muted);
    font-family: inherit;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.02em;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .sidebar-v2__terrain-dock__btn--active {
    color: var(--color-primary-text);
    background: color-mix(in srgb, var(--color-primary-bg) 88%, var(--color-surface));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary-border) 40%, transparent);
  }
  .sidebar-v2__terrain-dock__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: inherit;
  }
  .sidebar-v2__terrain-dock__icon .shell-nav-svg {
    width: 22px;
    height: 22px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .sidebar-v2__item,
  .sidebar-v2__item::before,
  .sidebar-v2__footer-shortcut,
  .sidebar-v2__group-toggle,
  .sidebar-v2__group-chevron {
    transition-duration: 0.01ms !important;
  }
  .sidebar-v2__item:active {
    transform: none;
  }
}
`;
  document.head.append(el);
}

/** Icônes SVG 20×20, stroke — cohérentes et sobres. */
const NAV_ICON_SVG = {
  dashboard:
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
  sites:
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/></svg>',
  incidents:
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  permits:
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/></svg>',
  risks:
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  actions:
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>',
  iso:
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  audits:
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4"/></svg>',
  products:
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  habilitations:
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>',
  imports:
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  'activity-log':
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  analytics:
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  performance:
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 16l4-6 4 4 5-8"/></svg>',
  'ai-center':
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14v2a4 4 0 0 1-8 0v-2"/><path d="M8 10h8"/><path d="M12 18v4"/></svg>',
  settings:
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
};

const SHIELD_LOGO_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

function navIconFor(id) {
  return NAV_ICON_SVG[id] || NAV_ICON_SVG.dashboard;
}

/** Marquage SVG interne uniquement (icônes menu) — pas de données utilisateur. */
function mountTrustedSvgChild(host, svgMarkup) {
  host.replaceChildren();
  const doc = new DOMParser().parseFromString(String(svgMarkup).trim(), 'text/html');
  const el = doc.body.firstElementChild;
  if (el) host.append(el);
}

export function createSidebar({
  currentPage,
  onNavigate,
  onSiteChange,
  onSessionUserChange,
  onExpertMobileDrawerClose
}) {
  ensureSidebarV2Styles();
  const terrainMode = getDisplayMode() === 'terrain';
  const terrainVisiblePages = TERRAIN_ALLOWED_PAGE_IDS;

  const aside = document.createElement('aside');
  aside.className = 'sidebar-v2';
  aside.id = 'qhse-shell-sidebar';

  const terrainDock = document.createElement('nav');
  terrainDock.className = 'sidebar-v2__terrain-dock';
  terrainDock.setAttribute('aria-label', 'Navigation terrain mobile');

  const brand = document.createElement('div');
  brand.className = 'sidebar-v2__brand';
  const brandMark = document.createElement('div');
  brandMark.className = 'sidebar-v2__brand-mark';
  brandMark.setAttribute('aria-hidden', 'true');
  mountTrustedSvgChild(brandMark, SHIELD_LOGO_SVG);
  const brandText = document.createElement('div');
  brandText.className = 'sidebar-v2__brand-text';
  const brandTitle = document.createElement('span');
  brandTitle.className = 'sidebar-v2__brand-title';
  brandTitle.textContent = 'QHSE Control';
  const brandBadge = document.createElement('span');
  brandBadge.className = 'sidebar-v2__brand-badge';
  brandBadge.title = 'Exploration sans compte : données d’illustration';
  brandBadge.textContent = 'Essai';
  brandText.append(brandTitle, brandBadge);
  brand.append(brandMark, brandText);

  const mainNav = document.createElement('nav');
  mainNav.className = 'sidebar-v2__nav';
  mainNav.setAttribute('role', 'navigation');
  mainNav.setAttribute('aria-label', 'Menu principal');

  const footer = document.createElement('div');
  footer.className = 'sidebar-v2__footer sidebar-v2__footer--compact';
  const footerIdentity = document.createElement('div');
  footerIdentity.className = 'sidebar-v2__footer-identity';
  const fh1 = document.createElement('span');
  fh1.className = 'visually-hidden';
  fh1.textContent = 'Compte et périmètre';
  const blockAccount = document.createElement('div');
  blockAccount.className = 'sidebar-v2__block sidebar-v2__block--account';
  const accountSlot = document.createElement('div');
  accountSlot.className = 'shell-account-slot';
  blockAccount.append(accountSlot);
  const blockCtx = document.createElement('div');
  blockCtx.className = 'sidebar-v2__block';
  const contextCard = document.createElement('div');
  contextCard.className = 'sidebar-v2__context context-card';
  blockCtx.append(contextCard);
  footerIdentity.append(fh1, blockAccount, blockCtx);

  const footerSecondary = document.createElement('div');
  footerSecondary.className = 'sidebar-v2__footer-secondary';
  const fh2 = document.createElement('span');
  fh2.className = 'visually-hidden';
  fh2.textContent = 'Raccourcis';
  const shortcutsToolbar = document.createElement('div');
  shortcutsToolbar.className = 'sidebar-v2__footer-shortcuts';
  shortcutsToolbar.setAttribute('role', 'toolbar');
  shortcutsToolbar.setAttribute('aria-label', 'Raccourcis module');
  footerSecondary.append(fh2, shortcutsToolbar);

  const statusP = document.createElement('p');
  statusP.className = 'sidebar-v2__status';
  statusP.setAttribute('aria-live', 'polite');
  const statusDot = document.createElement('span');
  statusDot.className = 'sidebar-v2__status-dot';
  statusDot.setAttribute('aria-hidden', 'true');
  const statusTxt = document.createElement('span');
  statusTxt.textContent = 'Prêt · local';
  statusP.append(statusDot, statusTxt);

  footer.append(footerIdentity, footerSecondary, statusP);
  aside.append(terrainDock, brand, mainNav, footer);

  if (terrainDock && terrainMode) {
    const dockSpec = [
      { id: 'terrain-mode', label: 'Accueil', iconId: 'dashboard' },
      { id: 'incidents', label: 'Incident', iconId: 'incidents' },
      { id: 'risks', label: 'Risque', iconId: 'risks' },
      { id: 'settings', label: 'Profil', iconId: 'settings' }
    ];
    terrainDock.replaceChildren();
    dockSpec.forEach((spec) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'sidebar-v2__terrain-dock__btn' +
        (currentPage === spec.id ? ' sidebar-v2__terrain-dock__btn--active' : '');
      btn.setAttribute('aria-label', spec.label);
      if (currentPage === spec.id) btn.setAttribute('aria-current', 'page');
      btn.title = spec.label;
      const iconWrap = document.createElement('span');
      iconWrap.className = 'sidebar-v2__terrain-dock__icon';
      mountTrustedSvgChild(iconWrap, navIconFor(spec.iconId));
      const lab = document.createElement('span');
      lab.textContent = spec.label;
      btn.append(iconWrap, lab);
      btn.addEventListener('click', () => onNavigate(spec.id));
      terrainDock.append(btn);
    });
  }

  if (typeof onExpertMobileDrawerClose === 'function') {
    const closeDrawer = document.createElement('button');
    closeDrawer.type = 'button';
    closeDrawer.className = 'sidebar-v2__drawer-close';
    closeDrawer.setAttribute('aria-label', 'Fermer le menu');
    closeDrawer.textContent = '×';
    closeDrawer.addEventListener('click', () => onExpertMobileDrawerClose());
    brand.append(closeDrawer);
  }

  const select = document.createElement('select');
  select.className = 'control-select context-select shell-context-select';
  select.setAttribute('aria-label', 'Choisir le site ou la vue groupe');

  function syncContextSelectFromState() {
    const id = appState.activeSiteId;
    if (id) {
      const hit = [...select.options].find((o) => o.value === id);
      if (hit) {
        select.value = id;
        return;
      }
      /* Id périmètre inconnu (catalogue API re-seedé, option retirée) : l’UI peut afficher
         « Vue groupe » alors que appState gardait l’ancien UUID — les API renvoient alors 0. */
      onSiteChange(null, 'Vue groupe (tous sites)');
      select.value = '';
      return;
    }
    const legacy = [...select.options].find(
      (o) => o.dataset.legacy === '1' && o.textContent === appState.currentSite
    );
    if (legacy) {
      select.value = legacy.value;
      return;
    }
    select.value = '';
  }

  async function loadContextSiteOptions() {
    select.replaceChildren();
    const groupe = document.createElement('option');
    groupe.value = '';
    groupe.textContent = 'Vue groupe (tous sites)';
    select.append(groupe);

    let fromApi = false;
    try {
      const list = await fetchSitesCatalog();
      if (Array.isArray(list) && list.length > 0) {
        fromApi = true;
        list.forEach((s) => {
          if (!s?.id) return;
          const o = document.createElement('option');
          o.value = s.id;
          o.textContent = s.code ? `${s.name} (${s.code})` : s.name;
          select.append(o);
        });
      }
    } catch {
      /* ignore */
    }

    if (!fromApi) {
      siteOptions.forEach((label) => {
        const o = document.createElement('option');
        o.value = `leg:${encodeURIComponent(label)}`;
        o.textContent = label;
        o.dataset.legacy = '1';
        select.append(o);
      });
    }

    syncContextSelectFromState();
  }

  select.addEventListener('change', () => {
    const v = select.value;
    const opt = select.selectedOptions[0];
    const label = opt ? opt.textContent.trim() : '';
    if (!v) {
      onSiteChange(null, 'Vue groupe (tous sites)');
      return;
    }
    if (v.startsWith('leg:')) {
      try {
        onSiteChange(null, decodeURIComponent(v.slice(4)));
      } catch {
        onSiteChange(null, label);
      }
      return;
    }
    onSiteChange(v, label);
  });

  aside.querySelector('.context-card').append(select);
  loadContextSiteOptions();

  const profileSlot = aside.querySelector('.shell-account-slot');

  function mountAuthProfile() {
    profileSlot.replaceChildren();
    const token = getAuthToken();

    if (token) {
      const u = getSessionUser();
      const card = document.createElement('div');
      card.className = 'sidebar-v2__account-card';
      const av = document.createElement('div');
      av.className = 'sidebar-v2__account-avatar';
      const initials = (u?.name || 'U')
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      av.textContent = initials;
      const meta = document.createElement('div');
      meta.className = 'sidebar-v2__account-meta';
      const nameEl = document.createElement('div');
      nameEl.className = 'sidebar-v2__account-name';
      nameEl.textContent = u?.name || 'Utilisateur';
      const roleEl = document.createElement('div');
      roleEl.className = 'sidebar-v2__account-role';
      roleEl.textContent = u?.role || '';
      meta.append(nameEl, roleEl);
      const orgT = getActiveTenant();
      if (orgT?.slug) {
        const orgEl = document.createElement('div');
        orgEl.className = 'sidebar-v2__account-org';
        orgEl.title = orgT.slug;
        orgEl.textContent = orgT.name || orgT.slug;
        meta.append(orgEl);
      }
      card.append(av, meta);
      profileSlot.append(card);

      const actions = document.createElement('div');
      actions.className = 'shell-account-actions';
      const logoutBtn = document.createElement('button');
      logoutBtn.type = 'button';
      logoutBtn.className = 'sidebar-v2__btn-logout';
      logoutBtn.textContent = 'Déconnexion';
      logoutBtn.addEventListener('click', () => {
        qhseFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        clearAuthSession();
        if (typeof onSessionUserChange === 'function') onSessionUserChange();
      });
      const switchBtn = document.createElement('button');
      switchBtn.type = 'button';
      switchBtn.className = 'sidebar-v2__btn-link';
      switchBtn.textContent = 'Changer de compte';
      switchBtn.addEventListener('click', () => {
        qhseFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        clearAuthSession();
        if (typeof onSessionUserChange === 'function') onSessionUserChange();
        window.location.hash = 'login';
      });
      actions.append(logoutBtn, switchBtn);
      if (getSessionTenants().length > 1) {
        const orgBtn = document.createElement('button');
        orgBtn.type = 'button';
        orgBtn.className = 'sidebar-v2__btn-link';
        orgBtn.textContent = 'Organisations…';
        orgBtn.addEventListener('click', () => {
          try {
            sessionStorage.setItem('qhse_settings_focus', 'settings-anchor-org');
          } catch {
            /* ignore */
          }
          window.location.hash = 'settings';
        });
        actions.append(orgBtn);
      }
      profileSlot.append(actions);
      return;
    }

    const profileSelect = document.createElement('select');
    profileSelect.className = 'control-select context-select shell-context-select';
    profileSelect.setAttribute('aria-label', 'Choisir un utilisateur pour les permissions');
    profileSelect.title =
      'Sans connexion : choisissez un profil pour prévisualiser le menu selon le rôle (aperçu local).';
    const optProf0 = document.createElement('option');
    optProf0.value = '';
    optProf0.textContent = '— Mode libre —';
    profileSelect.append(optProf0);
    profileSlot.append(profileSelect);

    (async function loadProfileUsers() {
      try {
        const res = await qhseFetch('/api/users');
        if (!res.ok) return;
        const list = await res.json();
        if (!Array.isArray(list)) return;
        list.forEach((userRow) => {
          if (!userRow?.id) return;
          const o = document.createElement('option');
          o.value = userRow.id;
          o.textContent = `${userRow.name} (${userRow.role})`;
          profileSelect.append(o);
        });
        const cur = getSessionUser();
        if (cur && list.some((x) => x.id === cur.id)) {
          profileSelect.value = cur.id;
        }
      } catch {
        /* ignore */
      }
    })();

    profileSelect.addEventListener('change', () => {
      const id = profileSelect.value;
      if (!id) {
        setSessionUser(null);
      } else {
        const opt = profileSelect.selectedOptions[0];
        const name = opt ? opt.textContent.replace(/\s*\([^)]+\)\s*$/, '').trim() : '';
        const roleMatch = /\(([^)]+)\)\s*$/.exec(opt?.textContent || '');
        const role = roleMatch ? roleMatch[1].trim() : 'TERRAIN';
        setSessionUser({ id, name, role });
      }
      if (typeof onSessionUserChange === 'function') onSessionUserChange();
    });

    const loginNav = document.createElement('button');
    loginNav.type = 'button';
    loginNav.className = 'sidebar-v2__btn-ghost';
    loginNav.textContent = 'Connexion';
    loginNav.addEventListener('click', () => {
      window.location.hash = 'login';
    });
    profileSlot.append(loginNav);
  }

  mountAuthProfile();

  /** @type {Map<string, HTMLSpanElement>} */
  const navBadgeEls = new Map();

  const navGroupsExpandedSnapshot = readNavGroupsExpanded();

  navigationGroups.forEach((group, groupIndex) => {
    const list = document.createElement('div');
    list.className = 'sidebar-v2__items';

    const role = getSessionUser()?.role;
    /** @type {string[]} */
    const visibleItemIds = [];

    group.items.forEach((item) => {
      if (terrainMode && !terrainVisiblePages.has(item.id)) return;
      if (!canAccessNavPage(role, item.id)) return;
      if (
        'resource' in item &&
        item.resource &&
        !canResource(
          role,
          item.resource,
          item.verb === 'write' ? 'write' : 'read'
        )
      ) {
        return;
      }
      visibleItemIds.push(item.id);
      const link = document.createElement('a');
      link.href = `#${item.id}`;
      const isActive = currentPage === item.id;
      link.className = `sidebar-v2__item${isActive ? ' sidebar-v2__item--active' : ''}`;
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');

      const iconWrap = document.createElement('span');
      iconWrap.className = 'sidebar-v2__item-icon';
      mountTrustedSvgChild(iconWrap, navIconFor(item.id));

      const text = document.createElement('span');
      text.className = 'sidebar-v2__item-text';
      text.textContent = item.label;

      link.dataset.navTip = item.label;

      if (item.id === 'incidents' || item.id === 'actions') {
        const badge = document.createElement('span');
        const tone = item.id === 'incidents' ? 'incidents' : 'actions';
        badge.className = `sidebar-v2__item-badge sidebar-v2__item-badge--${tone}`;
        badge.hidden = true;
        badge.setAttribute('aria-hidden', 'true');
        navBadgeEls.set(item.id, badge);
        link.append(iconWrap, text, badge);
      } else {
        link.append(iconWrap, text);
      }
      link.addEventListener('click', (e) => {
        e.preventDefault();
        onNavigate(item.id);
      });
      list.append(link);
    });

    if (!list.childElementCount) return;

    const section = document.createElement('section');
    section.className = 'sidebar-v2__group';

    const containsActive = visibleItemIds.includes(currentPage);
    const useCollapsible = group.collapsible === true;

    if (!useCollapsible) {
      const title = document.createElement('p');
      title.className = 'sidebar-v2__group-label';
      title.textContent = group.label;
      section.append(title, list);
    } else {
      /* Ouvert si page courante dans le groupe, sinon préférence locale (défaut : ouvert). */
      const savedOpen = navGroupsExpandedSnapshot[group.label];
      const isOpen = containsActive || savedOpen !== false;

      const gid = `nav-group-${groupIndex}`;
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'sidebar-v2__group-toggle';
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.setAttribute('aria-controls', gid);
      toggle.id = `${gid}-btn`;

      const labelSpan = document.createElement('span');
      labelSpan.className = 'sidebar-v2__group-label';
      labelSpan.textContent = group.label;

      const chevron = document.createElement('span');
      chevron.className = 'sidebar-v2__group-chevron';
      chevron.setAttribute('aria-hidden', 'true');
      chevron.textContent = isOpen ? '▾' : '▸';

      toggle.append(labelSpan, chevron);

      const body = document.createElement('div');
      body.className = 'sidebar-v2__group-body';
      body.id = gid;
      if (!isOpen) body.hidden = true;
      body.append(list);

      toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') === 'true';
        const next = !open;
        toggle.setAttribute('aria-expanded', next ? 'true' : 'false');
        chevron.textContent = next ? '▾' : '▸';
        body.hidden = !next;
        const state = readNavGroupsExpanded();
        state[group.label] = next;
        writeNavGroupsExpanded(state);
      });

      section.append(toggle, body);
    }

    mainNav.append(section);
  });

  const shortcutsHost = aside.querySelector('.sidebar-v2__footer-shortcuts');
  const shortcutsWrap = aside.querySelector('.sidebar-v2__footer-secondary');
  if (shortcutsHost && shortcutsWrap) {
    /* Plus de doublons avec le menu : tout passe par les 5 familles métier. */
    const shortcutSpecs = [];
    const roleForShortcuts = getSessionUser()?.role;
    shortcutSpecs.forEach((spec) => {
      if (!canAccessNavPage(roleForShortcuts, spec.pageId)) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sidebar-v2__footer-shortcut sidebar-v2__footer-shortcut--icon-only';
      btn.setAttribute('aria-label', spec.label);
      btn.title = spec.label;
      btn.dataset.navTip = spec.label;
      if (currentPage === spec.pageId) {
        btn.classList.add('sidebar-v2__footer-shortcut--active');
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
      const iconWrap = document.createElement('span');
      iconWrap.className = 'sidebar-v2__footer-shortcut-icon';
      mountTrustedSvgChild(iconWrap, navIconFor(spec.iconId));
      btn.append(iconWrap);
      btn.addEventListener('click', () => onNavigate(spec.pageId));
      shortcutsHost.append(btn);
    });
    if (!shortcutsHost.children.length) {
      shortcutsWrap.hidden = true;
    }
  }

  /**
   * @param {{ incidents?: number; overdueActions?: number } | null | undefined} payload
   */
  function refreshNavBadges(payload) {
    const hideAll = () => {
      navBadgeEls.forEach((el) => {
        el.hidden = true;
      });
    };
    if (!payload || typeof payload !== 'object') {
      hideAll();
      return;
    }
    /** @param {string} id @param {unknown} raw */
    const set = (id, raw) => {
      const el = navBadgeEls.get(id);
      if (!el) return;
      const v = Math.max(0, Math.floor(Number(raw) || 0));
      if (v < 1) {
        el.hidden = true;
        el.removeAttribute('title');
        return;
      }
      el.hidden = false;
      el.textContent = v > 99 ? '99+' : String(v);
      el.title =
        id === 'incidents' ? 'Incidents critiques (aperçu récent)' : 'Actions en retard';
    };
    set('incidents', payload.incidents);
    set('actions', payload.overdueActions);
  }

  aside.refreshNavBadges = refreshNavBadges;

  return aside;
}
