import { adminApi, jsonOrEmpty } from './adminApi.js';

export async function renderAdminLogs() {
  const section = document.createElement('section');
  section.innerHTML = '<h2>Logs</h2><div class="admin-card">Chargement…</div>';
  const r = await adminApi('/logs').catch(() => null);
  const payload = r ? await jsonOrEmpty(r) : {};
  const items = Array.isArray(payload?.logs) ? payload.logs : Array.isArray(payload) ? payload : [];
  section.innerHTML = `<h2>Logs</h2><div class="admin-card"><pre>${JSON.stringify(items.slice(0, 50), null, 2)}</pre></div>`;
  return section;
}
