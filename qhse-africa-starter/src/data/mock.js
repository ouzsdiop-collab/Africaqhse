export const dashboardKpis = [
  { label: 'Incidents du mois', value: '18', tone: 'amber', note: '3 nouveaux sur 7 jours' },
  { label: 'Risques critiques', value: '6', tone: 'red', note: '2 sans action engagée' },
  { label: 'Actions en retard', value: '11', tone: 'blue', note: '4 sur site principal' },
  { label: 'Taux conformité', value: '87%', tone: 'green', note: 'Audit interne favorable' }
];

export const alerts = [
  { title: 'Incident environnemental : bassin nord', detail: 'Déversement mineur à vérifier avant clôture.', status: 'Critique', tone: 'red', meta: 'Aujourd’hui' },
  { title: 'Action corrective non lancée', detail: 'Protection machine non remplacée sur atelier concassage.', status: 'Retard', tone: 'amber', meta: '+4 jours' },
  { title: 'Audit site sud à préparer', detail: 'Pièces de preuve manquantes sur 2 contrôles.', status: 'Préparation', tone: 'blue', meta: 'Cette semaine' }
];

export const incidents = [
  ['INC-204', 'Quasi-accident', 'Zone concassage', 'Modérée', 'En analyse', '03/04'],
  ['INC-203', 'Environnement', 'Bassin nord', 'Critique', 'Ouvert', '02/04'],
  ['INC-202', 'Accident mineur', 'Atelier maintenance', 'Faible', 'Suivi', '01/04'],
  ['INC-201', 'Presque accident', 'Accès rampe', 'Élevée', 'Clos', '29/03']
];

export const risks = [
  {
    title: 'Renversement d’engin en pente',
    type: 'Sécurité',
    detail: 'Zone de manutention : signalisation et stabilité des sols à revoir ; plan de manœuvre à formaliser.',
    causes: 'Pente non balisée ; sol meuble après pluie ; manœuvres simultanées.',
    impacts: 'Blessures graves, arrêt chantier, atteinte matériel et image.',
    mesuresExistantes:
      'Signalisation provisoire ; briefing sécurité hebdomadaire ; contrôle visuel des pentes (non formalisé).',
    gpHistory: [
      { when: '15/01/2026', g: 3, p: 3, note: 'Estimation initiale' },
      { when: '10/03/2026', g: 4, p: 3, note: 'Relevé terrain : gravité rehaussée' },
      { when: '02/04/2026', g: 5, p: 4, note: 'Alignement criticité actuelle' }
    ],
    history: [
      {
        when: '02/04/2026 16:40',
        who: 'Chef de chantier',
        what: 'Mise à jour criticité après relevé terrain.'
      },
      {
        when: '15/03/2026',
        who: 'Coordinateur QHSE',
        what: 'Création fiche : intégration registre site.'
      }
    ],
    status: 'Critique',
    tone: 'red',
    meta: 'G5 × P4',
    responsible: 'Chef de chantier',
    actionLinked: {
      ref: 'ACT-204',
      status: 'En cours',
      due: '18/04/2026',
      owner: 'Maintenance'
    },
    pilotageState: 'actif',
    updatedAt: '2026-04-02',
    trend: 'up'
  },
  {
    title: 'Pollution ponctuelle par hydrocarbures',
    type: 'Environnement',
    detail: 'Zone stockage : rétention incomplète ; contrôle des absorbants et registre des déchets.',
    causes: 'Rétention non conforme ; stockage temporaire prolongé ; contrôles espacés.',
    impacts: 'Pollution sols / eaux, sanctions, coûts de traitement.',
    gpHistory: [
      { when: '01/02/2026', g: 3, p: 2, note: 'Évaluation' },
      { when: '28/03/2026', g: 4, p: 3, note: 'Dérive constatée : rétention' }
    ],
    status: 'Très élevé',
    tone: 'amber',
    meta: 'G4 × P3',
    responsible: 'Resp. environnement',
    actionLinked: {
      ref: 'ACT-198',
      status: 'Retard',
      due: '28/03/2026',
      owner: 'Atelier'
    },
    pilotageState: 'derive',
    updatedAt: '2026-03-28',
    trend: 'up'
  },
  {
    title: 'Exposition bruit opérateurs',
    type: 'Sécurité',
    detail: 'Poste bruyant : EPI disponibles ; campagne de mesures et formation à planifier.',
    causes: 'Postes non insonorisés ; rotations courtes ; affichage insuffisant.',
    impacts: 'Troubles auditifs, plaintes, non-conformité réglementaire.',
    status: 'Élevé',
    tone: 'amber',
    meta: 'G3 × P3',
    responsible: 'Resp. HSE site',
    actionLinked: {
      ref: 'ACT-201',
      status: 'Planifié',
      due: '30/04/2026',
      owner: 'HSE'
    },
    pilotageState: 'actif',
    updatedAt: '2026-03-20',
    trend: 'stable'
  },
  {
    title: 'Dérapage procédure contrôle qualité',
    type: 'Qualité',
    detail: 'Ligne de conditionnement : non-conformité mineure détectée ; revue du mode opératoire.',
    causes: 'Mode opératoire obsolète ; formation partielle ; surcharge de ligne.',
    impacts: 'Lots non conformes, retouches, perte client ponctuelle.',
    status: 'Élevé',
    tone: 'amber',
    meta: 'G2 × P4',
    responsible: 'Resp. qualité',
    actionLinked: {
      ref: 'ACT-188',
      status: 'Clôturé',
      due: 'Non disponible',
      owner: 'Qualité'
    },
    pilotageState: 'traite',
    updatedAt: '2026-01-10',
    trend: 'down'
  },
  {
    title: 'Manque de ressources EPI saison hiver',
    type: 'Sécurité',
    detail: 'Saison pluie : stocks limités sur antenne nord ; besoin de réassort anticipé.',
    causes: 'Prévision logistique insuffisante ; pics d’activité non anticipés.',
    impacts: 'Port partiel des EPI, exposition accrue, risque psychosocial.',
    status: 'Modéré',
    tone: 'blue',
    meta: 'G2 × P2',
    responsible: 'Magasinier',
    actionLinked: null,
    pilotageState: 'actif',
    updatedAt: '2026-03-15',
    trend: 'stable'
  }
];

export const actionColumns = {
  todo: [
    { title: 'Mettre à jour le plan de circulation', detail: 'Site principal • Resp. Exploitation' },
    { title: 'Vérifier stock absorbants', detail: 'Bassin nord • Resp. Environnement' }
  ],
  doing: [
    { title: 'Former opérateurs zone concassage', detail: 'Échéance 09/04 • Resp. HSE' },
    { title: 'Installer signalétique pente', detail: 'Échéance 12/04 • Resp. Maintenance' }
  ],
  overdue: [
    { title: 'Contrôle rétention hydrocarbures', detail: '+4 jours • Resp. Atelier' },
    { title: 'Clôturer NC audit interne', detail: '+2 jours • Resp. Qualité' }
  ]
};

export const audits = [
  { title: 'Contrôles opérationnels documentés', detail: 'Preuves présentes, mise à jour récente.', status: 'Conforme', tone: 'green' },
  { title: 'Gestion des déchets dangereux', detail: 'Registre incomplet sur 1 zone de stockage.', status: 'Écart', tone: 'amber' },
  { title: 'Habilitations et autorisations', detail: '2 échéances proches à anticiper.', status: 'Vigilance', tone: 'blue' },
  { title: 'Gestion d’urgence environnementale', detail: 'Exercice à reprogrammer ce mois-ci.', status: 'Prioritaire', tone: 'red' }
];

export const products = [
  ['Acide sulfurique', '7664-93-9', 'Corrosif', '02/2026'],
  ['Gasoil industriel', '68334-30-5', 'Inflammable', '01/2026'],
  ['Soude caustique', '1310-73-2', 'Corrosif', '11/2025']
];
