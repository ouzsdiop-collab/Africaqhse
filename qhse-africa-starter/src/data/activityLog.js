const entries = [
  {
    id: 1,
    module: 'incidents',
    action: 'Incident créé',
    detail: 'INC-203 enregistré sur le bassin nord',
    user: 'Responsable HSE',
    timestamp: 'Aujourd’hui · 09:10'
  },
  {
    id: 2,
    module: 'actions',
    action: 'Action modifiée',
    detail: 'Action corrective affectée à Maintenance',
    user: 'Manager site',
    timestamp: 'Aujourd’hui · 08:40'
  },
  {
    id: 3,
    module: 'incidents',
    action: 'Incident critique — gravité élevée',
    detail: 'INC-204 zone stockage — sécurité',
    user: 'HSE terrain',
    timestamp: 'Hier · 17:22'
  },
  {
    id: 4,
    module: 'actions',
    action: 'Relance action en retard',
    detail: 'Échéance dépassée — plan correctif site sud',
    user: 'Coord. QHSE',
    timestamp: 'Hier · 11:05'
  },
  {
    id: 5,
    module: 'audits',
    action: 'Non-conformité majeure relevée',
    detail: 'Constat NC-12 — suivi audits internes',
    user: 'Auditeur interne',
    timestamp: 'Lun. · 14:30'
  }
];

export const activityLogStore = {
  all() {
    return [...entries].reverse();
  },
  add(entry) {
    entries.push({
      id: Date.now(),
      timestamp: 'À l’instant',
      ...entry
    });
  }
};
