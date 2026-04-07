import { pageTopbarById, getFlattenedNavItems } from '../data/navigation.js';
import { canAccessNavPage } from '../utils/permissionsUi.js';
import { escapeHtml } from '../utils/escapeHtml.js';

function navigateByHash(pageId) {
  window.location.hash = pageId;
}

/** Icône cloche (style Lucide / stroke). */
const ICON_BELL_SVG = `<svg class="topbar-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.3 21a1.94 1.94 0 0 0 4 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

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

export function createTopbar({
  currentPage,
  sessionUser,
  unreadCount,
  onToggleNotifications,
  onNavigate
}) {
  const header = document.createElement('header');
  header.className = 'topbar shell-topbar';

  const meta = pageTopbarById[currentPage] || {};
  const cta = meta.cta;
  const role = sessionUser?.role;

  const safeUnread = Math.max(0, Number(unreadCount) || 0);
  const badgeLabel = safeUnread > 99 ? '99+' : String(safeUnread);

  header.innerHTML = `
    <div class="app-topbar__inner">
      <div class="app-topbar__brand">
        <div class="app-topbar__logo" aria-hidden="true">Q</div>
        <div class="app-topbar__titles">
          <div class="app-topbar__title">QHSE Control</div>
          <p class="app-topbar__subtitle">Cockpit QHSE — sécurité, conformité &amp; actions</p>
        </div>
      </div>
      <div class="app-topbar__center">
        <nav class="app-topbar__nav" aria-label="Navigation modules"></nav>
        <div class="shell-quick-search" role="search">
          <label class="visually-hidden" for="shell-quick-search-input">Rechercher un module</label>
          <span class="shell-search-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input
            id="shell-quick-search-input"
            type="search"
            class="shell-quick-search-input"
            placeholder="Rechercher…"
            autocomplete="off"
            spellcheck="false"
          />
          <ul class="shell-quick-search-results" hidden></ul>
        </div>
      </div>
      <div class="app-topbar__trailing">
        <div class="app-topbar__trailing-actions" aria-label="Actions rapides">
          <button type="button" class="app-btn-ghost app-topbar__multisites">Multi-sites</button>
          <button type="button" class="ghost-chip topbar-ai-btn" aria-label="Ouvrir le Centre IA">
            <span class="ghost-chip-icon" aria-hidden="true">✦</span>
            <span>Centre IA</span>
          </button>
          ${
            cta
              ? `<button type="button" class="btn btn-primary topbar-cta">${cta.label}</button>`
              : ''
          }
        </div>
        <button type="button" class="icon-button icon-button--notifications notification-toggle" aria-label="Notifications${safeUnread ? ` (${safeUnread} non lues)` : ''}">
          <span class="notification-toggle__icon" aria-hidden="true">${ICON_BELL_SVG}</span>
          <span class="notif-count-badge${safeUnread ? ' notif-count-badge--visible' : ''}" ${safeUnread ? '' : 'hidden'} data-notif-badge>${badgeLabel}</span>
        </button>
        <div class="topbar-user-chip" role="group" aria-label="Utilisateur connecté">
          <span class="topbar-user-chip__avatar" aria-hidden="true"></span>
          <span class="topbar-user-chip__name visually-hidden"></span>
        </div>
      </div>
    </div>
  `;

  const navEl = header.querySelector('.app-topbar__nav');
  const avatarEl = header.querySelector('.topbar-user-chip__avatar');
  const nameHidden = header.querySelector('.topbar-user-chip__name');

  function allAccessibleItems() {
    return getFlattenedNavItems().filter((item) => canAccessNavPage(role, item.id));
  }

  if (navEl) {
    allAccessibleItems().forEach((it) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'app-topbar__nav-link';
      btn.textContent = it.label;
      btn.setAttribute('data-nav-page', it.id);
      if (it.id === currentPage) btn.setAttribute('aria-current', 'page');
      btn.addEventListener('click', () => {
        if (typeof onNavigate === 'function') onNavigate(it.id);
        else navigateByHash(it.id);
      });
      navEl.append(btn);
    });
  }

  if (avatarEl) {
    avatarEl.textContent = userInitials(sessionUser);
  }
  if (nameHidden) {
    nameHidden.textContent = sessionUser?.name || sessionUser?.email || 'Utilisateur';
  }

  const multiBtn = header.querySelector('.app-topbar__multisites');
  if (multiBtn) {
    multiBtn.addEventListener('click', () => {
      if (typeof onNavigate === 'function') onNavigate('sites');
      else navigateByHash('sites');
    });
  }

  const searchInput = header.querySelector('.shell-quick-search-input');
  const searchResults = header.querySelector('.shell-quick-search-results');
  const searchWrap = header.querySelector('.shell-quick-search');

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

  const ctaBtn = header.querySelector('.topbar-cta');
  if (ctaBtn && cta) {
    ctaBtn.addEventListener('click', () => {
      if (typeof onNavigate === 'function') onNavigate(cta.pageId);
      else navigateByHash(cta.pageId);
    });
  }

  return header;
}
