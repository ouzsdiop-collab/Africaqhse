import { adminApi, formatDateTime, jsonOrEmpty } from './adminApi.js';

const KPI_META = [
  { key: 'activeCompanies', label: 'Entreprises actives', tone: 'ok', hint: 'Organisations opérationnelles', href: '/admin/entreprises' },
  { key: 'suspendedCompanies', label: 'Entreprises suspendues', tone: 'warn', hint: 'Accès client bloqué', href: '/admin/entreprises' },
  { key: 'activeUsers', label: 'Utilisateurs actifs', tone: 'ok', hint: 'Comptes utilisables', href: '/admin/utilisateurs' },
  { key: 'pendingInvitations', label: 'Invitations en attente', tone: 'warn', hint: 'Utilisateurs à relancer', href: '/admin/utilisateurs' },
  { key: 'suspendedUsers', label: 'Comptes suspendus', tone: 'warn', hint: 'Utilisateurs désactivés', href: '/admin/utilisateurs' },
  { key: 'emailFailed', label: 'Emails échoués', tone: 'danger', hint: 'Invitations ou notifications non délivrées', href: '/admin/logs' }
];

function toAdminPage(path) {
  window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export async function renderAdminOverview() {
  const section = document.createElement('section');
  section.className = 'admin-page';
  section.innerHTML = '<header class="admin-page__head"><h2>Vue d’ensemble</h2><p>Pilotage global des comptes, invitations et incidents d’accès.</p></header>';

  const statsWrap = document.createElement('div');
  statsWrap.className = 'admin-grid';
  section.append(statsWrap);

  const r = await adminApi('/clients').catch(() => null);
  if (!r) {
    section.append(buildStateCard('Erreur API', 'Impossible de charger les statistiques administrateur.'));
    return section;
  }
  const payload = await jsonOrEmpty(r);
  const clients = Array.isArray(payload?.clients) ? payload.clients : Array.isArray(payload) ? payload : [];

  const rows = clients.flatMap((c) => (Array.isArray(c.users) ? c.users.map((u) => ({ c, u })) : []));
  const stats = {
    activeCompanies: clients.filter((c) => c.status === 'ACTIVE').length,
    suspendedCompanies: clients.filter((c) => c.status === 'SUSPENDED').length,
    activeUsers: rows.filter(({ u }) => u.active !== false).length,
    pendingInvitations: clients.reduce((a, c) => a + Number(c.pendingInvitations || 0), 0),
    suspendedUsers: rows.filter(({ u }) => u.active === false).length,
    emailFailed: clients.reduce((a, c) => a + Number(c.emailFailedCount || 0), 0)
  };

  KPI_META.forEach((kpi) => {
    const card = document.createElement('article');
    card.className = `admin-card admin-kpi admin-kpi--${kpi.tone}`;
    card.innerHTML = `<p class="admin-kpi__label">${kpi.label}</p><strong class="admin-kpi__value">${stats[kpi.key] ?? 0}</strong><p class="admin-kpi__hint">${kpi.hint}</p>`;
    card.addEventListener('click', () => toAdminPage(kpi.href));
    statsWrap.append(card);
  });

  const triage = document.createElement('article');
  triage.className = 'admin-card';
  triage.innerHTML = '<h3>À traiter</h3>';
  const toReview = [
    ['Invitations expirées', clients.reduce((a, c) => a + Number(c.expiredInvitations || 0), 0)],
    ['Emails échoués', stats.emailFailed],
    ['Comptes suspendus', stats.suspendedUsers],
    ['Entreprises sans admin actif', clients.filter((c) => !Array.isArray(c.users) || !c.users.some((u) => u.role === 'ADMIN' && u.active !== false)).length],
    ['Invités jamais connectés', rows.filter(({ u }) => u.invitedAt && !u.lastLoginAt).length]
  ].filter((entry) => entry[1] > 0);
  if (!toReview.length) {
    triage.append(buildStateCard('Aucun point critique à traiter.', 'Tout est en ordre côté administration.'));
  } else {
    const ul = document.createElement('ul');
    ul.className = 'admin-list';
    ul.innerHTML = toReview.map(([label, count]) => `<li><span>${label}</span><strong>${count}</strong></li>`).join('');
    triage.append(ul);
  }

  const logsCard = document.createElement('article');
  logsCard.className = 'admin-card';
  logsCard.innerHTML = '<h3>Dernières actions admin</h3>';
  const logsRes = await adminApi('/logs').catch(() => null);
  const logsPayload = logsRes ? await jsonOrEmpty(logsRes) : {};
  const logs = Array.isArray(logsPayload?.logs) ? logsPayload.logs : Array.isArray(logsPayload) ? logsPayload : [];
  if (!logs.length) {
    logsCard.append(buildStateCard('Aucune action admin récente.', 'Les prochaines actions apparaîtront ici.'));
  } else {
    const ul = document.createElement('ul');
    ul.className = 'admin-list admin-list--logs';
    ul.innerHTML = logs.slice(0, 5).map((log) => `<li><div><strong>${log.action || log.type || 'Action admin'}</strong><p>${log.actorEmail || log.email || 'Système'} · ${formatDateTime(log.createdAt || log.timestamp)}</p></div></li>`).join('');
    logsCard.append(ul);
  }

  section.append(triage, logsCard);
  return section;
}

function buildStateCard(title, text) {
  const box = document.createElement('div');
  box.className = 'admin-empty';
  box.innerHTML = `<strong>${title}</strong><p>${text}</p>`;
  return box;
}
