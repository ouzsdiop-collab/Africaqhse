import { adminApi, extractOneTimePassword, formatDateTime, jsonOrEmpty } from './adminApi.js';

export async function renderAdminCompanies(onOneTimePassword) {
  const section = document.createElement('section');
  section.className = 'admin-page';
  section.innerHTML = `<header class="admin-page__head admin-page__head--actions"><div><h2>Entreprises</h2><p>Gestion des clients, statuts et accès administrateur.</p></div><button class="btn btn-primary js-create-toggle">Créer entreprise</button></header>
  <div class="admin-card admin-form js-create-form" hidden><div class="form-grid"><input class="control-input js-name" placeholder="Entreprise"/><input class="control-input js-contact" placeholder="Admin principal"/><input class="control-input js-email" placeholder="Email admin"/><button class="btn btn-primary js-create">Créer entreprise + admin principal</button></div></div>
  <article class="admin-card"><div class="admin-filters"><input class="control-input js-search" placeholder="Recherche entreprise/admin"/><select class="control-input js-status"><option value="">Tous statuts</option><option value="ACTIVE">Actives</option><option value="SUSPENDED">Suspendues</option></select><select class="control-input js-plan"><option value="">Tous plans</option><option value="starter">Starter</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option></select></div><div class="js-list"></div></article>`;

  const list = section.querySelector('.js-list');
  const createForm = section.querySelector('.js-create-form');
  section.querySelector('.js-create-toggle')?.addEventListener('click', () => {
    createForm.hidden = !createForm.hidden;
  });

  let allItems = [];

  function renderRows() {
    const search = section.querySelector('.js-search')?.value?.trim()?.toLowerCase() || '';
    const status = section.querySelector('.js-status')?.value || '';
    const plan = section.querySelector('.js-plan')?.value || '';
    const items = allItems.filter((c) => {
      const company = String(c.companyName || c.name || '').toLowerCase();
      const admin = String(c.adminEmail || c.ownerEmail || '').toLowerCase();
      const cStatus = String(c.status || 'ACTIVE');
      const cPlan = String(c.plan || c.subscriptionPlan || '').toLowerCase();
      return (!search || company.includes(search) || admin.includes(search))
        && (!status || cStatus === status)
        && (!plan || cPlan === plan);
    });

    if (!items.length) {
      list.innerHTML = '<div class="admin-empty"><strong>Aucune entreprise</strong><p>Affinez les filtres ou créez une nouvelle entreprise.</p></div>';
      return;
    }

    list.innerHTML = `<table class="admin-table"><thead><tr><th>Entreprise</th><th>Statut</th><th>Plan</th><th>Admin principal</th><th>Utilisateurs</th><th>Créée le</th><th>Actions</th></tr></thead><tbody>${items.map((c) => `<tr><td>${c.companyName || c.name || '—'}</td><td><span class="admin-pill ${c.status === 'SUSPENDED' ? 'warn' : 'ok'}">${c.status || 'ACTIVE'}</span></td><td>${c.plan || c.subscriptionPlan || '—'}</td><td>${c.adminEmail || c.ownerEmail || '—'}</td><td>${Array.isArray(c.users) ? c.users.length : 0}</td><td>${formatDateTime(c.createdAt)}</td><td><div class="admin-actions"><button class="btn js-users" data-id="${c.id}">Utilisateurs</button><button class="btn js-reset" data-id="${c.id}">MDP admin</button><button class="btn js-open" data-id="${c.id}">Ouvrir interface client</button><button class="btn js-toggle" data-id="${c.id}" data-status="${c.status || 'ACTIVE'}">${c.status === 'SUSPENDED' ? 'Réactiver' : 'Suspendre'}</button></div></td></tr>`).join('')}</tbody></table>`;
  }

  async function load() {
    list.innerHTML = '<div class="admin-empty"><strong>Chargement</strong><p>Récupération des entreprises…</p></div>';
    const res = await adminApi('/clients').catch(() => null);
    if (!res) {
      list.innerHTML = '<div class="admin-empty"><strong>Erreur API</strong><p>Impossible de charger les entreprises.</p></div>';
      return;
    }
    const payload = await jsonOrEmpty(res);
    allItems = Array.isArray(payload?.clients) ? payload.clients : Array.isArray(payload) ? payload : [];
    renderRows();
  }

  section.querySelectorAll('.js-search,.js-status,.js-plan').forEach((el) => el.addEventListener('input', renderRows));
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
    if (el.classList.contains('js-users')) {
      window.history.pushState(null, '', '/admin/utilisateurs');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
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
