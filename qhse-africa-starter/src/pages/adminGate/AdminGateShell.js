import { createAdminGateCompaniesView } from './AdminGateCompanies.js';
import { createAdminGateUsersView } from './AdminGateUsers.js';
import { resetAdminGateSession } from '../../utils/adminGateSession.js';

export async function createAdminGateShellView({ onSessionExpired } = {}) {
  const root = document.createElement('main');
  root.className = 'admin-gate-root';

  const shell = document.createElement('div');
  shell.className = 'admin-gate-shell';
  shell.innerHTML = `
    <aside class="admin-gate-nav content-card card-soft">
      <h1 class="admin-gate-title">Admin QHSE Control</h1>
      <p class="admin-gate-subtitle">Espace réservé</p>
      <button class="btn btn-primary js-tab is-active" type="button" data-tab="companies">Entreprises</button>
      <button class="btn js-tab" type="button" data-tab="users">Utilisateurs</button>
    </aside>
    <section class="admin-gate-main"></section>
  `;

  const mount = shell.querySelector('.admin-gate-main');
  const tabs = shell.querySelectorAll('.js-tab');
  let currentTab = 'companies';

  const onGateExpired = () => {
    resetAdminGateSession();
    onSessionExpired?.();
  };

  async function renderTab(tab) {
    currentTab = tab;
    tabs.forEach((b) => {
      const isActive = b.getAttribute('data-tab') === tab;
      b.classList.toggle('is-active', isActive);
      b.classList.toggle('btn-primary', isActive);
    });
    if (!mount) return;
    mount.innerHTML = '';
    if (tab === 'users') {
      mount.append(await createAdminGateUsersView({ onSessionExpired: onGateExpired }));
      return;
    }
    mount.append(await createAdminGateCompaniesView({ onSessionExpired: onGateExpired }));
  }

  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab') || 'companies';
      if (tab === currentTab) return;
      void renderTab(tab);
    });
  });

  await renderTab('companies');

  root.append(shell);
  return root;
}
