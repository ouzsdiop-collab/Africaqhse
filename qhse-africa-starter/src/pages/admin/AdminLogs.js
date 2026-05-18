import { adminApi, formatDateTime, jsonOrEmpty } from './adminApi.js';

export async function renderAdminLogs() {
  const section = document.createElement('section');
  section.className = 'admin-page';
  section.innerHTML = '<header class="admin-page__head"><h2>Logs</h2><p>Traçabilité des actions administrateur.</p></header>';
  const card = document.createElement('article');
  card.className = 'admin-card';
  card.innerHTML = '<div class="admin-empty"><strong>Chargement</strong><p>Lecture des logs administrateur…</p></div>';
  section.append(card);

  const r = await adminApi('/logs').catch(() => null);
  if (!r) {
    card.innerHTML = '<div class="admin-empty"><strong>Erreur API</strong><p>Impossible de charger les logs.</p></div>';
    return section;
  }
  const payload = await jsonOrEmpty(r);
  const items = Array.isArray(payload?.logs) ? payload.logs : Array.isArray(payload) ? payload : [];
  if (!items.length) {
    card.innerHTML = '<div class="admin-empty"><strong>Aucun log</strong><p>Aucune action admin n’a été enregistrée.</p></div>';
    return section;
  }
  card.innerHTML = `<table class="admin-table"><thead><tr><th>Date</th><th>Action</th><th>Acteur</th><th>Détail</th></tr></thead><tbody>${items.slice(0, 100).map((log) => `<tr><td>${formatDateTime(log.createdAt || log.timestamp)}</td><td>${log.action || log.type || 'Action'}</td><td>${log.actorEmail || log.email || 'Système'}</td><td>${log.detail || log.message || '—'}</td></tr>`).join('')}</tbody></table>`;
  return section;
}
