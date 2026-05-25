import {
  adminGateApi,
  extractOneTimePassword,
  getApiErrorMessage,
  jsonOrEmpty,
  normalizeClient
} from './AdminGateApi.js';
import { getGateToken } from '../../utils/adminGateSession.js';

export async function createAdminGateCompaniesView({ onSessionExpired } = {}) {
  const root = document.createElement('section');
  root.className = 'admin-gate-companies';
  root.innerHTML = `
    <div class="admin-gate-panel content-card card-soft">
      <h2 class="admin-gate-title">Entreprises</h2>
      <p class="admin-gate-subtitle">Gérez les entreprises clientes depuis cet espace sécurisé.</p>
      <form class="admin-gate-form js-create-form">
        <input class="admin-gate-input js-company" name="companyName" placeholder="Nom entreprise" required />
        <input class="admin-gate-input js-contact" name="contactName" placeholder="Nom du contact" required />
        <input class="admin-gate-input js-email" name="email" type="email" placeholder="E-mail professionnel" required />
        <button class="btn btn-primary" type="submit">Créer l’entreprise</button>
      </form>
      <p class="admin-gate-message js-message" aria-live="polite"></p>
      <div class="admin-gate-inline-secret js-secret" hidden></div>
    </div>
    <div class="admin-gate-panel content-card card-soft">
      <div class="js-list"></div>
    </div>
  `;

  const form = root.querySelector('.js-create-form');
  const list = root.querySelector('.js-list');
  const message = root.querySelector('.js-message');
  const secretBox = root.querySelector('.js-secret');

  let oneTimePassword = null;
  let isLoadingCompanies = false;
  let didInitialLoad = false;

  function setMessage(text, tone = 'error') {
    const value = String(text || '').trim();
    message.textContent = value;
    message.style.color = tone === 'success' ? 'var(--admin-gate-success)' : 'var(--admin-gate-danger)';
  }

  function clearMessage() {
    setMessage('', 'error');
  }

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

  function statusLabel(status) {
    if (status === 'suspended') return 'Suspendue';
    if (status === 'trial') return 'Essai';
    return 'Active';
  }

  async function loadCompanies() {
    if (isLoadingCompanies) {
      console.info('[ADMIN_GATE] request skipped (/clients) reason: already loading');
      return;
    }
    if (!getGateToken()) {
      console.info('[ADMIN_GATE] request skipped (/clients) reason: missing token before load');
      list.innerHTML = '<p class="admin-gate-subtitle">Session admin en cours d’initialisation...</p>';
      return;
    }
    isLoadingCompanies = true;
    list.innerHTML = '<p class="admin-gate-subtitle">Chargement des entreprises…</p>';
    const res = await adminGateApi('/clients', {}, { onAuthError: onSessionExpired });
    const payload = await jsonOrEmpty(res);
    if (!res.ok) {
      if (payload?.code === 'MISSING_GATE_TOKEN_LOCAL') {
        list.innerHTML = '<p class="admin-gate-subtitle">Session admin en cours d’initialisation...</p>';
        isLoadingCompanies = false;
        return;
      }
      list.innerHTML = `<p class="admin-gate-message">${getApiErrorMessage(res.status, payload)}</p>`;
      isLoadingCompanies = false;
      return;
    }
    const rawItems = Array.isArray(payload?.clients) ? payload.clients : Array.isArray(payload) ? payload : [];
    const items = rawItems.map(normalizeClient).filter((c) => c.id);

    if (!items.length) {
      list.innerHTML = '<p class="admin-gate-subtitle">Aucune entreprise pour le moment.</p>';
      didInitialLoad = true;
      isLoadingCompanies = false;
      return;
    }

    list.innerHTML = `
      <div class="admin-gate-table-wrap">
        <table class="admin-gate-table">
          <thead><tr><th>Entreprise</th><th>Statut</th><th>Utilisateurs</th><th>Actifs</th><th>Actions</th></tr></thead>
          <tbody>
            ${items.map((c) => `<tr>
              <td>${c.name}</td>
              <td>${statusLabel(c.status)}</td>
              <td>${c.usersCount}</td>
              <td>${c.activeUsersCount}</td>
              <td><button class="btn" data-toggle-id="${c.id}" data-toggle-status="${c.status}">${c.status === 'suspended' ? 'Réactiver' : 'Suspendre'}</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
    didInitialLoad = true;
    isLoadingCompanies = false;
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage();
    const companyName = String(root.querySelector('.js-company')?.value || '').trim();
    const contactName = String(root.querySelector('.js-contact')?.value || '').trim();
    const email = String(root.querySelector('.js-email')?.value || '').trim().toLowerCase();

    const res = await adminGateApi('/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, contactName, email })
    }, { onAuthError: onSessionExpired });
    const payload = await jsonOrEmpty(res);
    if (!res.ok) {
      if (res.status === 409) {
        setMessage('Un compte existe déjà pour cet e-mail.');
      } else {
        setMessage(getApiErrorMessage(res.status, payload));
      }
      return;
    }
    clearMessage();
    oneTimePassword = extractOneTimePassword(payload);
    renderSecret();
    form.reset();
    setMessage('Entreprise créée avec succès.', 'success');
    await loadCompanies();
  });

  list?.addEventListener('click', async (event) => {
    const el = event.target;
    if (!(el instanceof HTMLElement)) return;
    const id = String(el.dataset.toggleId || '').trim();
    if (!id) return;
    const current = String(el.dataset.toggleStatus || 'active').toLowerCase();
    const nextStatus = current === 'suspended' ? 'active' : 'suspended';
    clearMessage();
    const res = await adminGateApi(`/clients/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    }, { onAuthError: onSessionExpired });
    const payload = await jsonOrEmpty(res);
    if (!res.ok) {
      setMessage(getApiErrorMessage(res.status, payload));
      return;
    }
    setMessage(nextStatus === 'suspended' ? 'Entreprise suspendue.' : 'Entreprise réactivée.', 'success');
    await loadCompanies();
  });

  renderSecret();
  if (!didInitialLoad) await loadCompanies();
  return root;
}
