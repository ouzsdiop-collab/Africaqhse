import { adminApi, jsonOrEmpty } from './adminApi.js';

export async function renderAdminOverview() {
  const section = document.createElement('section');
  section.innerHTML = '<h2>Vue d’ensemble</h2><div class="admin-grid"></div><article class="admin-card"><h3>Dernières actions admin</h3><ul class="js-logs"></ul></article>';
  const grid = section.querySelector('.admin-grid');
  const statsRes = await adminApi('/clients').catch(() => null);
  const stats = statsRes ? await jsonOrEmpty(statsRes) : {};
  const clients = Array.isArray(stats?.clients) ? stats.clients : Array.isArray(stats) ? stats : [];
  const cards = [
    ['entreprises actives', clients.filter((c) => c.status === 'ACTIVE').length],
    ['entreprises suspendues', clients.filter((c) => c.status === 'SUSPENDED').length],
    ['utilisateurs actifs', clients.reduce((a, c) => a + (Array.isArray(c.users) ? c.users.filter((u) => u.active !== false).length : 0), 0)],
    ['invitations en attente', clients.reduce((a, c) => a + Number(c.pendingInvitations || 0), 0)],
    ['comptes suspendus', clients.reduce((a, c) => a + (Array.isArray(c.users) ? c.users.filter((u) => u.active === false).length : 0), 0)],
    ['emails échoués', clients.reduce((a, c) => a + Number(c.emailFailedCount || 0), 0)]
  ];
  cards.forEach(([label, value]) => {
    const card = document.createElement('article');
    card.className = 'admin-card';
    card.innerHTML = `<h3>${label}</h3><p>${value}</p>`;
    grid?.append(card);
  });
  return section;
}
