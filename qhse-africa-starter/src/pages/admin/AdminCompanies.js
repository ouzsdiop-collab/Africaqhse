import { adminApi, extractOneTimePassword, formatDateTime, jsonOrEmpty } from './adminApi.js';
import { escapeHtml } from '../../utils/escapeHtml.js';

function getApiError(payload, fallback) {
  if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error;
  if (typeof payload?.message === 'string' && payload.message.trim()) return payload.message;
  if (payload?.details?.fieldErrors && typeof payload.details.fieldErrors === 'object') {
    const first = Object.entries(payload.details.fieldErrors).find(([, arr]) => Array.isArray(arr) && arr.length);
    if (first) {
      const [field, arr] = first;
      return `${field}: ${arr[0]}`;
    }
  }
  return fallback;
}

export async function renderAdminCompanies(onOneTimePassword) {
  const section = document.createElement('section');
  section.innerHTML = `<h2>Entreprises</h2><div class="form-grid"><input class="control-input js-name" placeholder="Entreprise"/><input class="control-input js-contact" placeholder="Contact"/><input class="control-input js-email" placeholder="Email"/><button class="btn btn-primary js-create">Créer entreprise + admin principal</button></div><p class="js-error" style="margin:8px 0 0;color:var(--danger,#dc2626);font-size:13px;display:none"></p><div class="js-list"></div>`;
  const list = section.querySelector('.js-list');
  const errorEl = section.querySelector('.js-error');

  const setError = (message = '') => {
    if (!errorEl) return;
    const value = String(message || '').trim();
    errorEl.textContent = value;
    errorEl.style.display = value ? 'block' : 'none';
  };

  async function load() {
    setError('');
    const res = await adminApi('/clients');
    const payload = await jsonOrEmpty(res);
    if (!res.ok) {
      setError(getApiError(payload, `Erreur ${res.status}`));
      return;
    }
    const items = Array.isArray(payload?.clients) ? payload.clients : Array.isArray(payload) ? payload : [];
    list.innerHTML = `<table class="admin-table"><thead><tr><th>Entreprise</th><th>Statut</th><th>Utilisateurs</th><th>Actions</th></tr></thead><tbody>${items.map((c) => {
      const id = c.tenant?.id || c.id;
      const companyName = c.tenant?.name || c.companyName || c.name || '';
      const status = c.tenant?.status || c.status || 'ACTIVE';
      return `<tr data-row-id="${id}"><td><span class="js-name-display">${escapeHtml(companyName)}</span></td><td>${status}</td><td>${Array.isArray(c.users) ? c.users.length : '-'}</td><td><button class="btn js-rename" data-id="${id}" data-name="${escapeHtml(companyName)}">Renommer</button> <button class="btn js-reset" data-id="${id}">MDP admin principal</button> <button class="btn js-toggle" data-id="${id}" data-status="${status}">${String(status).toUpperCase() === 'SUSPENDED' ? 'Réactiver' : 'Suspendre'}</button> <button class="btn js-open" data-id="${id}">Ouvrir interface client</button></td></tr>`;
    }).join('')}</tbody></table>`;
  }

  section.querySelector('.js-create')?.addEventListener('click', async () => {
    setError('');
    const companyName = String(section.querySelector('.js-name')?.value || '').trim();
    const contactName = String(section.querySelector('.js-contact')?.value || '').trim();
    const email = String(section.querySelector('.js-email')?.value || '').trim().toLowerCase();
    if (!companyName || !contactName || !email) {
      setError('Renseignez entreprise, contact et e-mail.');
      return;
    }
    const body = { companyName, contactName, email };
    const res = await adminApi('/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const payload = await jsonOrEmpty(res);
    if (!res.ok) {
      setError(getApiError(payload, `Erreur ${res.status}`));
      return;
    }
    const one = extractOneTimePassword(payload);
    if (one) onOneTimePassword({ ...one, expiresAt: formatDateTime(one.expiresAt) });
    section.querySelector('.js-name').value = '';
    section.querySelector('.js-contact').value = '';
    section.querySelector('.js-email').value = '';
    await load();
  });

  list?.addEventListener('click', async (e) => {
    setError('');
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;
    const id = el.dataset.id;
    if (!id) return;
    if (el.classList.contains('js-rename')) {
      const row = el.closest('tr');
      const cell = row?.querySelector('.js-name-display')?.parentElement;
      if (!cell) return;
      const currentName = el.dataset.name || '';
      cell.innerHTML = `<input type="text" class="control-input js-rename-input" value="${escapeHtml(currentName)}" style="margin-right:4px"/><button class="btn btn-primary js-rename-confirm" data-id="${id}">Valider</button> <button class="btn js-rename-cancel">Annuler</button>`;
      cell.querySelector('.js-rename-input')?.focus();
      return;
    }
    if (el.classList.contains('js-rename-cancel')) {
      await load();
      return;
    }
    if (el.classList.contains('js-rename-confirm')) {
      const cell = el.closest('td');
      const input = cell?.querySelector('.js-rename-input');
      const newName = String(input?.value || '').trim();
      if (!newName) {
        setError('Le nom de l’entreprise ne peut pas être vide.');
        return;
      }
      const r = await adminApi(`/clients/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName }) });
      const payload = await jsonOrEmpty(r);
      if (!r.ok) {
        setError(getApiError(payload, `Erreur ${r.status}`));
        return;
      }
      await load();
      return;
    }
    if (el.classList.contains('js-reset')) {
      const r = await adminApi(`/clients/${encodeURIComponent(id)}/reset-password`, { method: 'POST' });
      const payload = await jsonOrEmpty(r);
      if (!r.ok) {
        setError(getApiError(payload, `Erreur ${r.status}`));
        return;
      }
      const one = extractOneTimePassword(payload);
      if (one) onOneTimePassword({ ...one, expiresAt: formatDateTime(one.expiresAt) });
    }
    if (el.classList.contains('js-toggle')) {
      const next = el.dataset.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
      const r = await adminApi(`/clients/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
      if (!r.ok) {
        const payload = await jsonOrEmpty(r);
        setError(getApiError(payload, `Erreur ${r.status}`));
        return;
      }
      await load();
    }
    if (el.classList.contains('js-open')) {
      const r = await adminApi(`/tenants/${encodeURIComponent(id)}/setup/start`, { method: 'POST' });
      if (!r.ok) {
        const payload = await jsonOrEmpty(r);
        setError(getApiError(payload, `Erreur ${r.status}`));
        return;
      }
      window.location.assign('/app');
    }
  });

  await load();
  return section;
}
