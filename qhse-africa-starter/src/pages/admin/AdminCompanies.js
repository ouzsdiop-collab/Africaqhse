import { adminApi, extractOneTimePassword, formatDateTime, jsonOrEmpty } from './adminApi.js';

export async function renderAdminCompanies(onOneTimePassword) {
  const section = document.createElement('section');
  section.innerHTML = `<h2>Entreprises</h2><div class="form-grid"><input class="control-input js-name" placeholder="Entreprise"/><input class="control-input js-contact" placeholder="Contact"/><input class="control-input js-email" placeholder="Email"/><button class="btn btn-primary js-create">Créer entreprise + admin principal</button></div><div class="js-list"></div>`;
  const list = section.querySelector('.js-list');

  async function load() {
    const res = await adminApi('/clients');
    const payload = await jsonOrEmpty(res);
    const items = Array.isArray(payload?.clients) ? payload.clients : Array.isArray(payload) ? payload : [];
    list.innerHTML = `<table class="admin-table"><thead><tr><th>Entreprise</th><th>Statut</th><th>Utilisateurs</th><th>Actions</th></tr></thead><tbody>${items.map((c) => `<tr><td>${c.companyName || c.name}</td><td>${c.status || 'ACTIVE'}</td><td>${Array.isArray(c.users) ? c.users.length : '-'}</td><td><button class="btn js-reset" data-id="${c.id}">MDP admin principal</button> <button class="btn js-toggle" data-id="${c.id}" data-status="${c.status}">${c.status === 'SUSPENDED' ? 'Réactiver' : 'Suspendre'}</button> <button class="btn js-open" data-id="${c.id}">Ouvrir interface client</button></td></tr>`).join('')}</tbody></table>`;
  }

  section.querySelector('.js-create')?.addEventListener('click', async () => {
    const body = { companyName: section.querySelector('.js-name')?.value?.trim(), adminName: section.querySelector('.js-contact')?.value?.trim(), email: section.querySelector('.js-email')?.value?.trim() };
    const res = await adminApi('/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const payload = await jsonOrEmpty(res);
    const one = extractOneTimePassword(payload);
    if (one) onOneTimePassword({ ...one, expiresAt: formatDateTime(one.expiresAt) });
    await load();
  });

  list?.addEventListener('click', async (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;
    const id = el.dataset.id;
    if (!id) return;
    if (el.classList.contains('js-reset')) {
      const r = await adminApi(`/clients/${encodeURIComponent(id)}/reset-password`, { method: 'POST' });
      const payload = await jsonOrEmpty(r);
      const one = extractOneTimePassword(payload);
      if (one) onOneTimePassword({ ...one, expiresAt: formatDateTime(one.expiresAt) });
    }
    if (el.classList.contains('js-toggle')) {
      const next = el.dataset.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
      await adminApi(`/clients/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
      await load();
    }
    if (el.classList.contains('js-open')) {
      await adminApi(`/tenants/${encodeURIComponent(id)}/setup/start`, { method: 'POST' });
      window.location.assign('/app');
    }
  });

  await load();
  return section;
}
