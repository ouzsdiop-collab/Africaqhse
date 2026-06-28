import { adminApi, extractOneTimePassword, formatDateTime, jsonOrEmpty } from './adminApi.js';
import { escapeHtml } from '../../utils/escapeHtml.js';

const TENANT_USER_ROLES = [
  'CLIENT_ADMIN',
  'ADMIN',
  'QHSE',
  'MANAGER',
  'DIRECTION',
  'TERRAIN',
  'ASSISTANT',
  'AUDITEUR',
  'OPERATEUR',
  'USER'
];

function getApiErrorMessage(status, payload) {
  const fieldErrors = payload?.details?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === 'object') {
    const first = Object.entries(fieldErrors).find(([, arr]) => Array.isArray(arr) && arr.length);
    if (first) {
      const [field, arr] = first;
      return `${field}: ${arr[0]}`;
    }
  }
  const serverMessage =
    (typeof payload?.error === 'string' && payload.error.trim()) ||
    (typeof payload?.message === 'string' && payload.message.trim()) ||
    '';
  if (serverMessage) return serverMessage;
  if (status === 401) return 'Session expirée. Reconnectez-vous.';
  if (status === 403) return 'Accès admin refusé.';
  if (status === 404) return 'Ressource ou endpoint introuvable.';
  if (status === 409) return 'Conflit détecté (ex. e-mail déjà utilisé).';
  if (status === 400 || status === 422) return 'Champs invalides ou manquants.';
  if (status >= 500) return 'Erreur serveur. Réessayez plus tard.';
  return `Erreur ${status || 'inconnue'}.`;
}

export async function renderAdminUsers(_onOneTimePassword) {
  const section = document.createElement('section');
  section.innerHTML = `<h2>Utilisateurs</h2>
    <div class="form-grid">
      <input class="control-input js-company" placeholder="ID entreprise"/>
      <input class="control-input js-name" placeholder="Nom"/>
      <input class="control-input js-email" placeholder="Email"/>
      <select class="control-input js-role" aria-label="Rôle utilisateur">
        ${TENANT_USER_ROLES.map((role) => `<option value="${role}" ${role === 'USER' ? 'selected' : ''}>${role}</option>`).join('')}
      </select>
      <button class="btn btn-primary js-create">Créer utilisateur</button>
    </div>
    <p class="js-error" style="margin:8px 0 0;color:var(--danger,#dc2626);font-size:13px;display:none"></p>
    <div class="form-grid" style="margin-top:12px">
      <input class="control-input js-search" placeholder="Rechercher (nom ou email)"/>
      <select class="control-input js-filter-status" aria-label="Filtrer par statut mot de passe">
        <option value="">Tous les statuts</option>
        <option value="provisional">Mdp provisoire actif</option>
        <option value="normal">Mdp défini</option>
      </select>
      <button class="btn js-bulk-reset">Réinitialiser la sélection</button>
    </div>
    <article class="content-card card-soft js-one-time" style="display:none;margin-top:10px">
      <h3 style="margin-top:0">Mot de passe provisoire généré</h3>
      <p>Mot de passe provisoire généré. Copiez-le maintenant, il ne sera plus affiché ensuite.</p>
      <p class="js-one-time-email" style="margin:0 0 4px"></p>
      <pre class="js-one-time-password" style="margin:0 0 8px"></pre>
      <button type="button" class="btn js-copy-password">Copier le mot de passe</button>
    </article>
    <article class="content-card card-soft js-bulk-result" style="display:none;margin-top:10px">
      <h3 style="margin-top:0">Mots de passe provisoires générés (sélection)</h3>
      <p>Copiez-les maintenant, ils ne seront plus affichés ensuite.</p>
      <div class="js-bulk-result-list"></div>
    </article>
    <div class="js-list"></div>`;
  const list = section.querySelector('.js-list');
  const errorEl = section.querySelector('.js-error');
  const oneTimeCard = section.querySelector('.js-one-time');
  const oneTimeEmail = section.querySelector('.js-one-time-email');
  const oneTimePassword = section.querySelector('.js-one-time-password');

  const setError = (message = '') => {
    if (!errorEl) return;
    const txt = String(message || '').trim();
    errorEl.textContent = txt;
    errorEl.style.display = txt ? 'block' : 'none';
  };

  const showOneTimePassword = (payload) => {
    const one = extractOneTimePassword(payload);
    if (!one || !oneTimeCard || !oneTimeEmail || !oneTimePassword) return;
    oneTimeEmail.textContent = `Compte : ${one.email || '—'}${one.expiresAt ? ` · Expire le ${formatDateTime(one.expiresAt)}` : ''}`;
    oneTimePassword.textContent = one.password;
    oneTimeCard.style.display = 'block';
  };

  section.querySelector('.js-copy-password')?.addEventListener('click', async () => {
    const pwd = oneTimePassword?.textContent || '';
    if (!pwd) return;
    await navigator.clipboard.writeText(pwd).catch(() => {});
  });

  let allRows = [];
  const searchInput = section.querySelector('.js-search');
  const statusFilter = section.querySelector('.js-filter-status');

  function renderRows() {
    const query = String(searchInput?.value || '').trim().toLowerCase();
    const statusValue = String(statusFilter?.value || '');
    const rows = allRows.filter(({ u }) => {
      if (query) {
        const haystack = `${u.name || ''} ${u.email || ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      const hasProvisional = Boolean(u?.mustChangePassword && u?.hasProvisionalPassword);
      if (statusValue === 'provisional' && !hasProvisional) return false;
      if (statusValue === 'normal' && hasProvisional) return false;
      return true;
    });
    list.innerHTML = `<table class="admin-table"><thead><tr><th></th><th>Email</th><th>Entreprise</th><th>Statut</th><th>Mdp provisoire</th><th>Actions</th></tr></thead><tbody>${rows.map(({ c, u }) => {
      const tenantId = c?.tenant?.id || c?.id || '';
      const tenantName = c?.tenant?.name || c?.companyName || c?.name || '—';
      const isActive = u?.isActive !== false;
      const hasProvisional = u?.mustChangePassword && u?.hasProvisionalPassword;
      const tempPwd = hasProvisional
        ? `<span class="badge badge-warning">Provisoire</span> <code class="js-provisional-pwd">${escapeHtml(u.provisionalPassword || '—')}</code> <button type="button" class="btn btn-sm js-copy-provisional" data-pwd="${escapeHtml(u.provisionalPassword || '')}">Copier</button>`
        : '—';
      return `<tr><td><input type="checkbox" class="js-select" data-uid="${u.id}" data-tid="${tenantId}"/></td><td>${u.email || '—'}</td><td>${tenantName}</td><td>${isActive ? 'ACTIVE' : 'SUSPENDED'}</td><td>${tempPwd}</td><td><button class="btn js-reset" data-uid="${u.id}" data-tid="${tenantId}">MDP utilisateur</button> <button class="btn js-toggle" data-uid="${u.id}" data-tid="${tenantId}" data-active="${isActive ? '1' : '0'}">${isActive ? 'Suspendre' : 'Réactiver'}</button></td></tr>`;
    }).join('')}</tbody></table>`;
  }

  searchInput?.addEventListener('input', renderRows);
  statusFilter?.addEventListener('change', renderRows);

  async function load() {
    setError('');
    const res = await adminApi('/clients');
    const payload = await jsonOrEmpty(res);
    if (!res.ok) {
      setError(getApiErrorMessage(res.status, payload));
      return;
    }
    const clients = Array.isArray(payload?.clients) ? payload.clients : Array.isArray(payload) ? payload : [];
    allRows = clients.flatMap((c) => (Array.isArray(c.users) ? c.users.map((u) => ({ c, u })) : []));
    renderRows();
  }

  section.querySelector('.js-create')?.addEventListener('click', async () => {
    setError('');
    const cid = section.querySelector('.js-company')?.value?.trim();
    const role = String(section.querySelector('.js-role')?.value || '').trim().toUpperCase();
    const body = {
      name: section.querySelector('.js-name')?.value?.trim(),
      email: section.querySelector('.js-email')?.value?.trim(),
      role
    };
    if (!cid || !body.name || !body.email || !role) {
      setError('Renseignez entreprise, nom, e-mail et rôle.');
      return;
    }
    const r = await adminApi(`/clients/${encodeURIComponent(cid)}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const payload = await jsonOrEmpty(r);
    if (!r.ok) {
      setError(getApiErrorMessage(r.status, payload));
      return;
    }
    showOneTimePassword(payload);
    await load();
  });

  list?.addEventListener('click', async (e) => {
    setError('');
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;
    if (el.classList.contains('js-reset')) {
      const uid = el.dataset.uid;
      const tenantId = el.dataset.tid;
      if (!uid || !tenantId) {
        setError('Identifiant utilisateur/entreprise introuvable.');
        return;
      }
      const r = await adminApi(`/users/${encodeURIComponent(uid)}/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantId }) });
      const payload = await jsonOrEmpty(r);
      if (!r.ok) {
        setError(getApiErrorMessage(r.status, payload));
        return;
      }
      showOneTimePassword(payload);
      const row = el.closest('tr');
      const tempPwdCell = row?.children?.[4];
      if (tempPwdCell) tempPwdCell.innerHTML = '<span class="badge badge-warning">Mdp provisoire actif</span>';
    }
    if (el.classList.contains('js-copy-provisional')) {
      const pwd = el.dataset.pwd || '';
      if (!pwd) return;
      await navigator.clipboard.writeText(pwd).catch(() => {});
      return;
    }
    if (el.classList.contains('js-toggle')) {
      const uid = el.dataset.uid;
      const tenantId = el.dataset.tid;
      const active = el.dataset.active === '1';
      if (!uid || !tenantId) {
        setError('Identifiant utilisateur/entreprise introuvable.');
        return;
      }
      const r = await adminApi(`/users/${encodeURIComponent(uid)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantId, isActive: !active }) });
      const payload = await jsonOrEmpty(r);
      if (!r.ok) {
        setError(getApiErrorMessage(r.status, payload));
        return;
      }
      await load();
    }
  });

  const bulkResultCard = section.querySelector('.js-bulk-result');
  const bulkResultList = section.querySelector('.js-bulk-result-list');

  section.querySelector('.js-bulk-reset')?.addEventListener('click', async () => {
    setError('');
    const checked = [...list.querySelectorAll('.js-select:checked')];
    if (!checked.length) {
      setError('Sélectionnez au moins un utilisateur.');
      return;
    }
    const byTenant = new Map();
    for (const checkbox of checked) {
      const uid = checkbox.dataset.uid;
      const tid = checkbox.dataset.tid;
      if (!uid || !tid) continue;
      if (!byTenant.has(tid)) byTenant.set(tid, []);
      byTenant.get(tid).push(uid);
    }

    const allResults = [];
    for (const [tenantId, userIds] of byTenant) {
      const r = await adminApi('/users/bulk-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, userIds })
      });
      const payload = await jsonOrEmpty(r);
      if (!r.ok) {
        setError(getApiErrorMessage(r.status, payload));
        continue;
      }
      allResults.push(...(Array.isArray(payload?.results) ? payload.results : []));
    }

    if (bulkResultCard && bulkResultList) {
      bulkResultList.innerHTML = allResults.map((res) => {
        if (!res.ok) return `<p style="color:var(--danger,#dc2626)">${res.userId} : ${res.error || 'échec'}</p>`;
        return `<p><strong>${res.user?.email || res.userId}</strong> : <code>${res.temporaryPasswordOneTime || '—'}</code></p>`;
      }).join('');
      bulkResultCard.style.display = allResults.length ? 'block' : 'none';
    }
    await load();
  });

  await load();
  return section;
}
