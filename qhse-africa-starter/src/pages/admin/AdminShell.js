import './adminStyles.css';
import { authApi } from './adminApi.js';

const MENU = [
  ['Vue d’ensemble', '/admin'],
  ['Entreprises', '/admin/entreprises'],
  ['Utilisateurs', '/admin/utilisateurs'],
  ['Logs', '/admin/logs'],
  ['Paramètres', '/admin/parametres']
];

export function createAdminShell(contentEl) {
  const shell = document.createElement('div');
  shell.className = 'admin-shell';
  const nav = document.createElement('aside');
  nav.className = 'admin-nav';
  nav.innerHTML = `<div class="admin-nav__brand"><strong>QHSE Control Admin</strong><span>Console administrateur</span><em>SUPER ADMIN</em></div>`;

  const currentPath = String(window.location.pathname || '').replace(/\/+$/, '') || '/admin';
  const menu = document.createElement('nav');
  menu.className = 'admin-nav__menu';
  MENU.forEach(([label, href]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `admin-nav__item${currentPath === href ? ' is-active' : ''}`;
    b.textContent = label;
    b.addEventListener('click', () => {
      if (window.location.pathname === href) return;
      window.history.pushState(null, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    menu.append(b);
  });
  nav.append(menu);

  const logout = document.createElement('button');
  logout.type = 'button';
  logout.className = 'admin-nav__logout';
  logout.textContent = 'Déconnexion';
  logout.addEventListener('click', async () => {
    await authApi('/logout', { method: 'POST' }).catch(() => {});
    window.location.assign('/login');
  });
  nav.append(logout);

  const main = document.createElement('main');
  main.className = 'admin-main';
  main.append(contentEl);
  shell.append(nav, main);
  return shell;
}

export function withPasswordModal(host, oneTime, clearFn) {
  if (!oneTime) return;
  const modal = document.createElement('div');
  modal.className = 'admin-modal';
  modal.innerHTML = `<article class="content-card card-soft admin-modal-card"><h3>Mot de passe provisoire généré</h3>
    <p class="admin-modal__meta">Email utilisateur : <strong>${oneTime.email}</strong></p>
    <label class="admin-modal__pwd-label">Mot de passe provisoire</label>
    <div class="admin-modal__pwd-row"><code>${oneTime.password}</code><button type="button" class="btn js-copy">Copier</button></div>
    <p class="admin-modal__meta">Expiration : <strong>${oneTime.expiresAt || '—'}</strong></p>
    <p class="admin-modal__meta">Statut email : <strong>${oneTime.emailSent === true ? 'envoyé' : oneTime.emailSent === false ? 'échec' : 'inconnu'}</strong></p>
    <p class="admin-modal__hint">Copiez-le maintenant. Il ne sera plus affiché ensuite.</p>
    <div style="display:flex;justify-content:flex-end"><button type="button" class="btn btn-primary js-close">J’ai copié</button></div></article>`;
  modal.querySelector('.js-copy')?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(oneTime.password).catch(() => {});
  });
  modal.querySelector('.js-close')?.addEventListener('click', () => {
    modal.remove();
    clearFn?.();
  });
  host.append(modal);
}
