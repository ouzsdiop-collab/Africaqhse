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
