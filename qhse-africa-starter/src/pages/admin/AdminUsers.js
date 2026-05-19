import { adminApi, extractOneTimePassword, formatDateTime, jsonOrEmpty } from './adminApi.js';

export async function renderAdminUsers(onOneTimePassword) {
  const section = document.createElement('section');
  section.className = 'admin-page';
  section.innerHTML = `<header class="admin-page__head admin-page__head--actions"><div><h2>Utilisateurs</h2><p>Gestion centralisée des accès utilisateurs.</p></div><button class="btn btn-primary js-create-toggle">Créer utilisateur</button></header>
  <div class="admin-card admin-form js-create-form" hidden><div class="form-grid"><input class="control-input js-company" placeholder="ID entreprise"/><input class="control-input js-name" placeholder="Nom"/><input class="control-input js-email" placeholder="Email"/><button class="btn btn-primary js-create">Créer utilisateur</button></div></div>
  <article class="admin-card"><div class="admin-filters"><input class="control-input js-search" placeholder="Recherche email/nom"/><input class="control-input js-company-filter" placeholder="Filtre entreprise"/><select class="control-input js-status"><option value="">Tous statuts</option><option value="ACTIVE">Actifs</option><option value="SUSPENDED">Suspendus</option></select><select class="control-input js-role"><option value="">Tous rôles</option><option value="ADMIN">ADMIN</option><option value="MANAGER">MANAGER</option><option value="USER">USER</option></select></div><div class="js-list"></div></article>`;

  const list = section.querySelector('.js-list');
  const createForm = section.querySelector('.js-create-form');
  section.querySelector('.js-create-toggle')?.addEventListener('click', () => {
    createForm.hidden = !createForm.hidden;
  });

  let allRows = [];

  function renderRows() {
    const search = section.querySelector('.js-search')?.value?.trim()?.toLowerCase() || '';
    const companyFilter = section.querySelector('.js-company-filter')?.value?.trim()?.toLowerCase() || '';
    const status = section.querySelector('.js-status')?.value || '';
    const role = section.querySelector('.js-role')?.value || '';
    const rows = allRows.filter(({ c, u }) => {
      const active = u.active === false ? 'SUSPENDED' : 'ACTIVE';
      return (!search || String(u.email || '').toLowerCase().includes(search) || String(u.name || '').toLowerCase().includes(search))
        && (!companyFilter || String(c.companyName || c.name || '').toLowerCase().includes(companyFilter))
        && (!status || active === status)
        && (!role || String(u.role || 'USER').toUpperCase() === role);
    });
    if (!rows.length) {
      list.innerHTML = '<div class="admin-empty"><strong>Aucun utilisateur</strong><p>Affinez les filtres ou créez un nouvel utilisateur.</p></div>';
      return;
    }
    list.innerHTML = `<table class="admin-table"><thead><tr><th>Utilisateur</th><th>Email</th><th>Entreprise</th><th>Rôle</th><th>Statut</th><th>Invitation</th><th>Dernière activité</th><th>Actions</th></tr></thead><tbody>${rows.map(({ c, u }) => `<tr><td>${u.name || '—'}</td><td>${u.email || '—'}</td><td>${c.companyName || c.name || '—'}</td><td>${u.role || 'USER'}</td><td><span class="admin-pill ${u.active === false ? 'warn' : 'ok'}">${u.active === false ? 'SUSPENDED' : 'ACTIVE'}</span></td><td>${u.invitedAt ? formatDateTime(u.invitedAt) : '—'}</td><td>${u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Jamais'}</td><td><div class="admin-actions"><button class="btn js-reset" data-uid="${u.id}">MDP</button><button class="btn js-toggle" data-cid="${c.id}" data-uid="${u.id}" data-active="${u.active === false ? '0' : '1'}">${u.active === false ? 'Réactiver' : 'Suspendre'}</button></div></td></tr>`).join('')}</tbody></table>`;
  }

  async function load() {
    list.innerHTML = '<div class="admin-empty"><strong>Chargement</strong><p>Récupération des utilisateurs…</p></div>';
    const res = await adminApi('/clients').catch(() => null);
    if (!res) {
      list.innerHTML = '<div class="admin-empty"><strong>Erreur API</strong><p>Impossible de charger les utilisateurs.</p></div>';
      return;
    }
    const payload = await jsonOrEmpty(res);
    const clients = Array.isArray(payload?.clients) ? payload.clients : Array.isArray(payload) ? payload : [];
    allRows = clients.flatMap((c) => (Array.isArray(c.users) ? c.users.map((u) => ({ c, u })) : []));
    renderRows();
  }

  section.querySelectorAll('.js-search,.js-company-filter,.js-status,.js-role').forEach((el) => el.addEventListener('input', renderRows));

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
