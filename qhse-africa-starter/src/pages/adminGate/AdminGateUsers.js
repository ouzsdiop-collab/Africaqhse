import {
  adminGateRequest,
  extractOneTimePassword,
  getApiErrorMessage,
  normalizeClient
} from './AdminGateApi.js';
import { escapeHtml } from '../../utils/escapeHtml.js';

const TENANT_USER_ROLES = [
  'CLIENT_ADMIN', 'ADMIN', 'QHSE', 'MANAGER', 'DIRECTION',
  'TERRAIN', 'ASSISTANT', 'AUDITEUR', 'OPERATEUR', 'USER'
];

export async function createAdminGateUsersView({ onSessionExpired } = {}) {
  const root = document.createElement('section');
  root.className = 'admin-gate-users';
  root.innerHTML = `
    <div class="admin-gate-panel content-card card-soft">
      <h2 class="admin-gate-title">Utilisateurs</h2>
      <p class="admin-gate-subtitle">Gérez les accès utilisateurs par entreprise.</p>
      <label class="admin-gate-subtitle" for="ag-tenant-select">Entreprise</label>
      <select id="ag-tenant-select" class="admin-gate-input js-tenant"></select>
      <form class="admin-gate-form js-create-form" style="margin-top:.8rem">
        <input class="admin-gate-input js-name" name="name" placeholder="Nom" required />
        <input class="admin-gate-input js-email" name="email" type="email" placeholder="E-mail professionnel" required />
        <select class="admin-gate-input js-role" name="role">${TENANT_USER_ROLES.map((r) => `<option value="${r}" ${r === 'USER' ? 'selected' : ''}>${r}</option>`).join('')}</select>
        <button class="btn btn-primary" type="submit">Créer l’utilisateur</button>
      </form>
      <p class="admin-gate-message js-message" aria-live="polite"></p>
      <div class="admin-gate-inline-secret js-secret" hidden></div>
    </div>
    <div class="admin-gate-panel content-card card-soft">
      <div class="js-list"></div>
    </div>
  `;

  const tenantSelect = root.querySelector('.js-tenant');
  const form = root.querySelector('.js-create-form');
  const list = root.querySelector('.js-list');
  const message = root.querySelector('.js-message');
  const secretBox = root.querySelector('.js-secret');

  let clients = [];
  let selectedTenantId = '';
  let oneTimePassword = null;

  const setMessage = (text, tone = 'error') => {
    message.textContent = String(text || '').trim();
    message.style.color = tone === 'success' ? 'var(--admin-gate-success)' : 'var(--admin-gate-danger)';
  };

  function renderSecret() {
    if (!oneTimePassword) {
      secretBox.hidden = true;
      secretBox.innerHTML = '';
      return;
    }
    secretBox.hidden = false;
    secretBox.innerHTML = `
      <p><strong>Mot de passe provisoire généré. Copiez-le maintenant, il ne sera plus affiché ensuite.</strong></p>
      <code>${oneTimePassword}</code>
      <button class="btn" type="button" data-copy>Copier le mot de passe</button>
    `;
    secretBox.querySelector('[data-copy]')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(oneTimePassword);
        setMessage('Mot de passe copié.', 'success');
      } catch {
        setMessage('Copie impossible sur ce navigateur.');
      }
    });
  }

  function getSelectedClient() {
    return clients.find((c) => c.id === selectedTenantId) || null;
  }

  function renderUsersTable() {
    const c = getSelectedClient();
    if (!c) {
      list.innerHTML = '<p class="admin-gate-subtitle">Sélectionnez une entreprise.</p>';
      return;
    }
    if (!Array.isArray(c.users) || !c.users.length) {
      list.innerHTML = '<p class="admin-gate-subtitle">Aucun utilisateur pour cette entreprise.</p>';
      return;
    }
    list.innerHTML = `
      <div class="admin-gate-table-wrap">
        <table class="admin-gate-table">
          <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Mdp provisoire</th><th>Actions</th></tr></thead>
          <tbody>
            ${c.users.map((u) => {
              const hasProvisional = u.mustChangePassword && u.hasProvisionalPassword;
              const tempPwd = hasProvisional
                ? `<span class="badge badge-warning">Provisoire</span> <code>${escapeHtml(u.provisionalPassword || '—')}</code> <button type="button" class="btn btn-sm" data-action="copy-provisional" data-pwd="${escapeHtml(u.provisionalPassword || '')}">Copier</button>`
                : '—';
              return `<tr>
              <td>${u.name || '—'}</td>
              <td>${u.email || '—'}</td>
              <td>${u.role || 'USER'}</td>
              <td>${u.isActive === false ? 'Désactivé' : 'Actif'}</td>
              <td>${tempPwd}</td>
              <td>
                <button class="btn" data-action="reset" data-user-id="${u.id}" data-tenant-id="${c.id}">Reset mot de passe</button>
                <button class="btn" data-action="toggle" data-user-id="${u.id}" data-active="${u.isActive === false ? '0' : '1'}">${u.isActive === false ? 'Réactiver' : 'Désactiver'}</button>
              </td>
            </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  async function loadClientsAndUsers() {
    list.innerHTML = '<p class="admin-gate-subtitle">Chargement des utilisateurs…</p>';
    let payload;
    try {
      ({ data: payload } = await adminGateRequest('/clients', {}, { onAuthError: onSessionExpired }));
    } catch (error) {
      list.innerHTML = `<p class="admin-gate-message">${error?.message || getApiErrorMessage(error?.status, error?.data)}</p>`;
      return;
    }
    const raw = Array.isArray(payload?.clients) ? payload.clients : Array.isArray(payload) ? payload : [];
    clients = raw.map(normalizeClient).filter((c) => c.id);
    tenantSelect.innerHTML = clients.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
    selectedTenantId = selectedTenantId && clients.some((c) => c.id === selectedTenantId) ? selectedTenantId : (clients[0]?.id || '');
    tenantSelect.value = selectedTenantId;
    renderUsersTable();
  }

  tenantSelect?.addEventListener('change', () => {
    setMessage('');
    selectedTenantId = String(tenantSelect.value || '').trim();
    renderUsersTable();
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage('');
    const tenantId = String(tenantSelect.value || '').trim();
    if (!tenantId) {
      setMessage('Sélectionnez une entreprise.');
      return;
    }
    const body = {
      name: String(root.querySelector('.js-name')?.value || '').trim(),
      email: String(root.querySelector('.js-email')?.value || '').trim().toLowerCase(),
      role: String(root.querySelector('.js-role')?.value || 'USER').trim().toUpperCase()
    };
    let payload;
    try {
      ({ data: payload } = await adminGateRequest(`/clients/${encodeURIComponent(tenantId)}/users`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      }, { onAuthError: onSessionExpired }));
    } catch (error) {
      setMessage(error?.status === 409 ? 'Un compte existe déjà pour cet e-mail.' : (error?.message || getApiErrorMessage(error?.status, error?.data)));
      return;
    }
    oneTimePassword = extractOneTimePassword(payload);
    renderSecret();
    form.reset();
    setMessage('Utilisateur créé avec succès.', 'success');
    await loadClientsAndUsers();
  });

  list?.addEventListener('click', async (event) => {
    const el = event.target;
    if (!(el instanceof HTMLElement)) return;
    const action = el.dataset.action;
    if (action === 'copy-provisional') {
      const pwd = el.dataset.pwd || '';
      if (!pwd) return;
      await navigator.clipboard.writeText(pwd).catch(() => {});
      return;
    }
    const userId = String(el.dataset.userId || '').trim();
    const rowTenantId = String(el.dataset.tenantId || '').trim();
    if (!action || !userId) return;
    setMessage('');

    if (action === 'reset') {
      const tenantId = rowTenantId || String(selectedTenantId || tenantSelect?.value || '').trim();
      oneTimePassword = null;
      renderSecret();
      console.info('[ADMIN_GATE] reset password clicked: true');
      console.info(`[ADMIN_GATE] tenantId present: ${Boolean(tenantId)}`);

      if (!tenantId) {
        setMessage('Champ manquant ou invalide.');
        return;
      }

      const resetButtonLabel = el.textContent;
      el.setAttribute('disabled', 'disabled');
      el.textContent = 'Reset en cours...';
      try {
        const { status, data: payload } = await adminGateRequest(`/users/${encodeURIComponent(userId)}/reset-password`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantId })
        }, { onAuthError: onSessionExpired });
        oneTimePassword = extractOneTimePassword(payload);
        console.info(`[ADMIN_GATE] reset status: ${status}`);
        console.info('[ADMIN_GATE] reset success: true');
        console.info(`[ADMIN_GATE] response has one-time password: ${Boolean(oneTimePassword)}`);
        renderSecret();
        const row = el.closest('tr');
        const tempPwdCell = row?.children?.[4];
        if (tempPwdCell) tempPwdCell.innerHTML = '<span class="badge badge-warning">Mdp provisoire actif</span>';
        setMessage('Mot de passe réinitialisé.', 'success');
      } catch (error) {
        console.info(`[ADMIN_GATE] reset status: ${error?.status || 'unknown'}`);
        console.info('[ADMIN_GATE] reset success: false');
        if (error?.status === 400 || error?.status === 422) {
          setMessage('Champ manquant ou invalide.');
        } else if (error?.status === 401 || error?.status === 403) {
          setMessage('Accès admin expiré, ressaisir le code.');
        } else if (error?.status === 404) {
          setMessage('Utilisateur introuvable.');
        } else if (error?.status >= 500) {
          setMessage('Erreur serveur.');
        } else {
          setMessage(error?.message || getApiErrorMessage(error?.status, error?.data));
        }
      } finally {
        el.removeAttribute('disabled');
        el.textContent = resetButtonLabel || 'Reset mot de passe';
      }
      return;
    }

    if (action === 'toggle') {
      const active = el.dataset.active === '1';
      try {
        await adminGateRequest(`/users/${encodeURIComponent(userId)}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantId: selectedTenantId, isActive: !active })
        }, { onAuthError: onSessionExpired });
      } catch (error) {
        setMessage(error?.message || getApiErrorMessage(error?.status, error?.data));
        return;
      }
      setMessage(!active ? 'Utilisateur activé.' : 'Utilisateur désactivé.', 'success');
      await loadClientsAndUsers();
    }
  });

  renderSecret();
  await loadClientsAndUsers();
  return root;
}
