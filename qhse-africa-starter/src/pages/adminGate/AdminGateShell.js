import { createAdminGateCompaniesView } from './AdminGateCompanies.js';
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
      <button class="btn btn-primary is-active" type="button">Entreprises</button>
    </aside>
    <section class="admin-gate-main"></section>
  `;

  const mount = shell.querySelector('.admin-gate-main');
  const companiesView = await createAdminGateCompaniesView({
    onSessionExpired: () => {
      resetAdminGateSession();
      onSessionExpired?.();
    }
  });
  mount?.append(companiesView);

  root.append(shell);
  return root;
}
