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
  nav.innerHTML = '<strong>Administration QHSE Control</strong><span>Console administrateur</span>';
  MENU.forEach(([label, href]) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.addEventListener('click', () => window.location.assign(href));
    nav.append(b);
  });
  const logout = document.createElement('button');
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
    <p>Email: <strong>${oneTime.email}</strong></p>
    <p>Expiration: <strong>${oneTime.expiresAt || '—'}</strong></p>
    <p>Statut email: <strong>${oneTime.emailSent === true ? 'envoyé' : oneTime.emailSent === false ? 'échec' : 'inconnu'}</strong></p>
    <pre>${oneTime.password}</pre>
    <p>Copiez-le maintenant, il ne sera plus affiché ensuite.</p>
    <div style="display:flex;gap:8px"><button type="button" class="btn js-copy">Copier</button><button type="button" class="btn btn-primary js-close">Fermer</button></div></article>`;
  modal.querySelector('.js-copy')?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(oneTime.password).catch(() => {});
  });
  modal.querySelector('.js-close')?.addEventListener('click', () => {
    modal.remove();
    clearFn?.();
  });
  host.append(modal);
}
