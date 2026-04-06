/**
 * Store notifications — mock front, prêt pour branchement API.
 * Champs utiles backend : id, kind, title, detail, level, read, timestamp, link, priority.
 */

const items = [
  {
    id: 1,
    kind: 'incident',
    priority: 'critical',
    title: 'Incident critique — zone concassage',
    detail:
      'Blessé léger, arrêt machine ; investigation prioritaire et communication direction. Équipe HSE mobilisée.',
    level: 'critical',
    read: false,
    timestamp: '02/04/2026 · 08:42',
    link: { page: 'incidents', ref: 'INC-204' }
  },
  {
    id: 2,
    kind: 'action',
    priority: 'high',
    title: 'Action corrective en retard',
    detail:
      'Clôture protection machine (zone concassage) — échéance dépassée de 5 jours. Escalade maintenance requise.',
    level: 'warning',
    read: false,
    timestamp: '01/04/2026 · 16:20',
    link: { page: 'actions', ref: 'ACT-118' }
  },
  {
    id: 3,
    kind: 'audit',
    priority: 'high',
    title: 'Audit interne à préparer',
    detail:
      'Site sud — ouverture dans 3 jours ; préparer preuves documentaires et brief équipe d’accueil.',
    level: 'warning',
    read: false,
    timestamp: '31/03/2026 · 09:05',
    link: { page: 'audits', ref: 'AUD-2026-018' }
  },
  {
    id: 4,
    kind: 'info',
    priority: 'normal',
    title: 'IA — signal faible détecté',
    detail: 'Hausse des quasi-accidents sur le site principal (tendance glissante 30 j). À traiter en revue mensuelle.',
    level: 'info',
    read: true,
    timestamp: '28/03/2026 · 11:30',
    link: { page: 'ai-center', ref: null }
  }
];

function unreadList() {
  return items.filter((item) => !item.read);
}

export const notificationsStore = {
  all() {
    return items;
  },

  unreadCount() {
    return unreadList().length;
  },

  hasUnread() {
    return unreadList().length > 0;
  },

  getById(id) {
    const n = Number(id);
    return items.find((item) => item.id === n) ?? null;
  },

  markRead(id) {
    const entry = items.find((item) => item.id === Number(id));
    if (entry) entry.read = true;
  },

  markAllRead() {
    items.forEach((item) => {
      item.read = true;
    });
  }
};
