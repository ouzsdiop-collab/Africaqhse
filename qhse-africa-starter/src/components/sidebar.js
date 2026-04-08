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
import { canAccessNavPage } from '../utils/permissionsUi.js';

/** Icônes SVG 20×20, stroke — cohérentes et sobres. */
const NAV_ICON_SVG = {
  dashboard:
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
  sites:
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/></svg>',
  incidents:
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
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
  imports:
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  'activity-log':
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  analytics:
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  'ai-center':
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14v2a4 4 0 0 1-8 0v-2"/><path d="M8 10h8"/><path d="M12 18v4"/></svg>',
  settings:
    '<svg class="shell-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
};

function navIconFor(id) {
  return NAV_ICON_SVG[id] || NAV_ICON_SVG.dashboard;
}

export function createSidebar({
  currentPage,
  onNavigate,
  onSiteChange,
  onSessionUserChange
}) {
  const aside = document.createElement('aside');
  aside.className = 'sidebar shell-sidebar';

  aside.innerHTML = `
    <div class="shell-sidebar-header">
      <span class="shell-sidebar-header-mark" aria-hidden="true">Q</span>
      <div class="shell-sidebar-header-text">
        <span class="shell-sidebar-header-title">Menu</span>
        <span class="shell-sidebar-header-sub">QHSE Control</span>
      </div>
      <span class="shell-sidebar-badge" title="Exploration sans compte : données d’illustration">Essai</span>
    </div>
    <nav class="shell-side-nav side-nav" aria-label="Navigation principale"></nav>
    <div class="shell-sidebar-footer">
      <div class="shell-footer-block">
        <span class="shell-footer-label">Périmètre</span>
        <div class="shell-footer-card context-card"></div>
      </div>
      <div class="shell-footer-block shell-footer-block--account">
        <span class="shell-footer-label">Compte</span>
        <div class="shell-account-slot"></div>
      </div>
    </div>
  `;

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
    select.innerHTML = '';
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
      card.className = 'shell-account-card';
      const av = document.createElement('div');
      av.className = 'shell-account-avatar';
      const initials = (u?.name || 'U')
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      av.textContent = initials;
      const meta = document.createElement('div');
      meta.className = 'shell-account-meta';
      const nameEl = document.createElement('div');
      nameEl.className = 'shell-account-name';
      nameEl.textContent = u?.name || 'Utilisateur';
      const roleEl = document.createElement('div');
      roleEl.className = 'shell-account-role';
      roleEl.textContent = u?.role || '';
      meta.append(nameEl, roleEl);
      const orgT = getActiveTenant();
      if (orgT?.slug) {
        const orgEl = document.createElement('div');
        orgEl.className = 'shell-account-org';
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
      logoutBtn.className = 'shell-btn-ghost shell-btn-ghost--full';
      logoutBtn.textContent = 'Déconnexion';
      logoutBtn.addEventListener('click', () => {
        qhseFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        clearAuthSession();
        if (typeof onSessionUserChange === 'function') onSessionUserChange();
      });
      const switchBtn = document.createElement('button');
      switchBtn.type = 'button';
      switchBtn.className = 'shell-btn-link';
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
        orgBtn.className = 'shell-btn-link';
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
    loginNav.className = 'shell-btn-ghost shell-btn-ghost--full';
    loginNav.textContent = 'Connexion';
    loginNav.addEventListener('click', () => {
      window.location.hash = 'login';
    });
    profileSlot.append(loginNav);
  }

  mountAuthProfile();

  const nav = aside.querySelector('.shell-side-nav');

  navigationGroups.forEach((group) => {
    const section = document.createElement('section');
    section.className = 'shell-nav-group nav-group';

    const title = document.createElement('p');
    title.className = 'shell-nav-group-title nav-group-title';
    title.textContent = group.label;
    section.append(title);

    const list = document.createElement('div');
    list.className = 'shell-nav-items nav-items';

    const role = getSessionUser()?.role;

    group.items.forEach((item) => {
      if (!canAccessNavPage(role, item.id)) return;
      const button = document.createElement('button');
      button.type = 'button';
      const isActive = currentPage === item.id;
      button.className = `shell-nav-item nav-item ${isActive ? 'active' : ''}`;
      button.setAttribute('aria-current', isActive ? 'page' : 'false');

      const iconWrap = document.createElement('span');
      iconWrap.className = 'shell-nav-icon-wrap';
      iconWrap.innerHTML = navIconFor(item.id);

      const text = document.createElement('span');
      text.className = 'nav-text';
      text.textContent = item.label;

      button.append(iconWrap, text);
      button.addEventListener('click', () => onNavigate(item.id));
      list.append(button);
    });

    section.append(list);
    nav.append(section);
  });

  return aside;
}
