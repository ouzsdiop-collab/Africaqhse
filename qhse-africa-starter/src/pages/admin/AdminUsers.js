import { adminApi, extractOneTimePassword, formatDateTime, jsonOrEmpty } from './adminApi.js';

export async function renderAdminUsers(onOneTimePassword) {
  const section = document.createElement('section');
  section.innerHTML = '<h2>Utilisateurs</h2><div class="form-grid"><input class="control-input js-company" placeholder="ID entreprise"/><input class="control-input js-name" placeholder="Nom"/><input class="control-input js-email" placeholder="Email"/><button class="btn btn-primary js-create">Créer utilisateur</button></div><div class="js-list"></div>';
  const list = section.querySelector('.js-list');

  async function load() {
    const res = await adminApi('/clients');
    const payload = await jsonOrEmpty(res);
    const clients = Array.isArray(payload?.clients) ? payload.clients : Array.isArray(payload) ? payload : [];
    const rows = clients.flatMap((c) => (Array.isArray(c.users) ? c.users.map((u) => ({ c, u })) : []));
    list.innerHTML = `<table class="admin-table"><thead><tr><th>Email</th><th>Entreprise</th><th>Statut</th><th>Actions</th></tr></thead><tbody>${rows.map(({ c, u }) => `<tr><td>${u.email || '—'}</td><td>${c.companyName || c.name}</td><td>${u.active === false ? 'SUSPENDED' : 'ACTIVE'}</td><td><button class="btn js-reset" data-uid="${u.id}">MDP utilisateur</button> <button class="btn js-toggle" data-cid="${c.id}" data-uid="${u.id}" data-active="${u.active === false ? '0' : '1'}">${u.active === false ? 'Réactiver' : 'Suspendre'}</button></td></tr>`).join('')}</tbody></table>`;
  }

  section.querySelector('.js-create')?.addEventListener('click', async () => {
    const cid = section.querySelector('.js-company')?.value?.trim();
    const body = { name: section.querySelector('.js-name')?.value?.trim(), email: section.querySelector('.js-email')?.value?.trim() };
    const r = await adminApi(`/clients/${encodeURIComponent(cid)}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const payload = await jsonOrEmpty(r);
    const one = extractOneTimePassword(payload);
    if (one) onOneTimePassword({ ...one, expiresAt: formatDateTime(one.expiresAt) });
    await load();
  });

  list?.addEventListener('click', async (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;
    if (el.classList.contains('js-reset')) {
      const uid = el.dataset.uid;
      const r = await adminApi(`/users/${encodeURIComponent(uid)}/reset-password`, { method: 'POST' });
      const payload = await jsonOrEmpty(r);
      const one = extractOneTimePassword(payload);
      if (one) onOneTimePassword({ ...one, expiresAt: formatDateTime(one.expiresAt) });
    }
    if (el.classList.contains('js-toggle')) {
      const cid = el.dataset.cid;
      const uid = el.dataset.uid;
      const active = el.dataset.active === '1';
      await adminApi(`/clients/${encodeURIComponent(cid)}/users/${encodeURIComponent(uid)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !active }) });
      await load();
    }
  });
  await load();
  return section;
}
