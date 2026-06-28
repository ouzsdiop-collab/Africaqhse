import { adminApi, jsonOrEmpty, formatDateTime } from './adminApi.js';
import { escapeHtml } from '../../utils/escapeHtml.js';

const PAGE_SIZE = 50;

export async function renderAdminLogs() {
  const section = document.createElement('section');
  section.innerHTML = `<h2>Logs</h2>
    <div class="form-grid">
      <input class="control-input js-tenant" placeholder="ID entreprise"/>
      <input class="control-input js-action" placeholder="Action (ex: USER_CREATED)"/>
      <button class="btn btn-primary js-filter">Filtrer</button>
    </div>
    <p class="js-error" style="margin:8px 0 0;color:var(--danger,#dc2626);font-size:13px;display:none"></p>
    <div class="js-list"><p>Chargement…</p></div>
    <div class="form-grid" style="margin-top:8px">
      <button class="btn js-prev">Précédent</button>
      <span class="js-page-info"></span>
      <button class="btn js-next">Suivant</button>
    </div>`;

  const list = section.querySelector('.js-list');
  const errorEl = section.querySelector('.js-error');
  const pageInfo = section.querySelector('.js-page-info');
  const prevBtn = section.querySelector('.js-prev');
  const nextBtn = section.querySelector('.js-next');

  let offset = 0;
  let total = 0;

  const setError = (message = '') => {
    const txt = String(message || '').trim();
    errorEl.textContent = txt;
    errorEl.style.display = txt ? 'block' : 'none';
  };

  async function load() {
    setError('');
    const tenantId = section.querySelector('.js-tenant')?.value?.trim() || '';
    const action = section.querySelector('.js-action')?.value?.trim() || '';
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
    if (tenantId) params.set('tenantId', tenantId);
    if (action) params.set('action', action);
    const res = await adminApi(`/logs?${params.toString()}`);
    const payload = await jsonOrEmpty(res);
    if (!res.ok) {
      setError(payload?.error || payload?.message || `Erreur ${res.status}`);
      return;
    }
    const items = Array.isArray(payload?.logs) ? payload.logs : [];
    total = Number(payload?.total) || 0;
    list.innerHTML = !items.length
      ? '<p>Aucun log.</p>'
      : `<table class="admin-table"><thead><tr><th>Date</th><th>Action</th><th>Acteur</th><th>Cible</th><th>Entreprise</th><th>Détails</th></tr></thead><tbody>${items.map((log) => `<tr>
          <td>${formatDateTime(log.createdAt)}</td>
          <td>${escapeHtml(log.action || '—')}</td>
          <td>${escapeHtml(log.actorUserId || '—')}</td>
          <td>${escapeHtml(log.targetType || '—')}${log.targetId ? ` (${escapeHtml(log.targetId)})` : ''}</td>
          <td>${escapeHtml(log.tenantId || '—')}</td>
          <td><pre style="margin:0;white-space:pre-wrap">${escapeHtml(JSON.stringify(log.metadata || {}))}</pre></td>
        </tr>`).join('')}</tbody></table>`;
    const page = Math.floor(offset / PAGE_SIZE) + 1;
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    pageInfo.textContent = `Page ${page} / ${pageCount} (${total} entrées)`;
    prevBtn.disabled = offset <= 0;
    nextBtn.disabled = offset + PAGE_SIZE >= total;
  }

  section.querySelector('.js-filter')?.addEventListener('click', () => {
    offset = 0;
    load();
  });
  prevBtn?.addEventListener('click', () => {
    offset = Math.max(0, offset - PAGE_SIZE);
    load();
  });
  nextBtn?.addEventListener('click', () => {
    offset += PAGE_SIZE;
    load();
  });

  await load();
  return section;
}
