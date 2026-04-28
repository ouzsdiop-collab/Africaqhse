/**
 * Jeu de données d’exploration : scénario cohérent (Katiola Mining, audit en cours, incidents récents, NC, actions).
 * Utilisé lorsque le mode exploration local est actif (voir demoModeFetch.js).
 */

export const DEMO_SITE_ID = 'site-demo-kassa';
export const DEMO_SITE_LABEL = 'Katiola Mining : site Yakouro';
export const DEMO_MINE_ZONES = [
  'Fosse Nord',
  'Usine de traitement',
  'Atelier maintenance',
  'Concassage',
  'Parc engins',
  'Zone explosifs',
  'Base vie'
];

/** @type {object[]} */
export const demoSites = [
  {
    id: DEMO_SITE_ID,
    name: DEMO_SITE_LABEL,
    code: 'MK-RDC',
    address: 'Site minier (jeu d’illustration)',
    createdAt: '2025-06-01T08:00:00.000Z'
  }
];

/** @type {object[]} */
export const demoUsers = [
  {
    id: 'usr-demo-qhse-1',
    name: 'Amina Mukendi',
    email: 'amina.mukendi@demo.qhse',
    role: 'QHSE',
    defaultSiteId: DEMO_SITE_ID
  },
  {
    id: 'usr-demo-dir-1',
    name: 'Jean-Paul Ilunga',
    email: 'jp.ilunga@demo.qhse',
    role: 'ADMIN',
    defaultSiteId: DEMO_SITE_ID
  },
  {
    id: 'usr-demo-terrain-1',
    name: 'Patrick Kasaï',
    email: 'patrick.kasai@demo.qhse',
    role: 'TERRAIN',
    defaultSiteId: DEMO_SITE_ID
  }
];

/** Registre risques : cohérent avec l’assistant pilotage et GET /api/risks en mode exploration. */
export const demoRisks = [
  {
    id: 'cldemo-risk-01',
    ref: 'RSK-MK-2026-01',
    title: 'Chute de hauteur : accès trémies et passerelles provisoires',
    description:
      'Travail en hauteur sur infrastructure extraction : garde-corps démontables, intempéries, charge dynamique engins.',
    category: 'Sécurité',
    gravity: 5,
    probability: 3,
    gp: 15,
    severity: 'Critique',
    status: 'ouvert',
    siteId: DEMO_SITE_ID,
    site: DEMO_SITE_LABEL,
    owner: 'Amina Mukendi',
    updatedAt: '2026-04-01T10:00:00.000Z',
    createdAt: '2025-12-01T08:00:00.000Z'
  },
  {
    id: 'cldemo-risk-02',
    ref: 'RSK-MK-2026-02',
    title: 'Écrasement / heurt : circulation engins blindés et bennes',
    description:
      'Croisement engins de terrassement et piétons logistique ; visibilité réduite nuit et poussière.',
    category: 'Sécurité',
    gravity: 4,
    probability: 4,
    gp: 16,
    severity: 'Élevée',
    status: 'en_traitement',
    siteId: DEMO_SITE_ID,
    site: DEMO_SITE_LABEL,
    owner: 'Patrick Kasaï',
    updatedAt: '2026-03-28T14:00:00.000Z',
    createdAt: '2026-01-15T09:00:00.000Z'
  },
  {
    id: 'cldemo-risk-03',
    ref: 'RSK-MK-2026-03',
    title: 'Fuite hydrocarbures : stockage carburant tranchée nord',
    description: 'Bacs de rétention, raccords vibratoires, surveillance cuve mobile forage.',
    category: 'Environnement',
    gravity: 3,
    probability: 3,
    gp: 9,
    severity: 'Moyenne',
    status: 'ouvert',
    siteId: DEMO_SITE_ID,
    site: DEMO_SITE_LABEL,
    owner: 'Jean-Paul Ilunga',
    updatedAt: '2026-03-10T11:00:00.000Z',
    createdAt: '2025-11-20T08:00:00.000Z'
  },
  {
    id: 'cldemo-risk-04',
    ref: 'RSK-MK-2026-04',
    title: 'Effondrement localisé : talus stérile humide',
    description: 'Saison des pluies ; stabilité bermes accès flanc nord ; géotechnique à mettre à jour.',
    category: 'Sécurité',
    gravity: 5,
    probability: 2,
    gp: 10,
    severity: 'Élevée',
    status: 'ouvert',
    siteId: DEMO_SITE_ID,
    site: DEMO_SITE_LABEL,
    owner: 'Jean-Paul Ilunga',
    updatedAt: '2026-02-22T09:30:00.000Z',
    createdAt: '2026-02-01T08:00:00.000Z'
  },
  {
    id: 'cldemo-risk-05',
    ref: 'RSK-MK-2026-05',
    title: 'Exposition poussières silice : concassage primaire',
    description: 'Mesures EPI FFP3, arrosages, captage. Alignement plan hygiène industrielle.',
    category: 'Santé au travail',
    gravity: 4,
    probability: 3,
    gp: 12,
    severity: 'Élevée',
    status: 'ouvert',
    siteId: DEMO_SITE_ID,
    site: DEMO_SITE_LABEL,
    owner: 'Amina Mukendi',
    updatedAt: '2026-04-05T16:00:00.000Z',
    createdAt: '2025-10-10T07:00:00.000Z'
  }
];

/**
 * Causes racines mock (mine / SST) : même forme que POST /api/ai-suggestions/suggest/root-causes.
 * @param {{ id?: string, ref?: string }} inc
 */
export function buildDemoAiRootCausesPayload(inc) {
  const ref = inc?.ref || 'Non disponible';
  return {
    incidentId: inc?.id || 'Non disponible',
    ref,
    provider: 'qhse-demo-mining',
    error: null,
    rootCauses: [
      {
        cause: `Signalisation / isolement zone insuffisants sur le poste concerné (${ref})`,
        category: 'materiel',
        confidence: 0.72
      },
      {
        cause: 'Brief sécurité ou permis de travail incomplet avant intervention',
        category: 'organisation',
        confidence: 0.66
      },
      {
        cause: 'Fatigue ou rotation équipes non suivie sur astreinte extraction',
        category: 'humain',
        confidence: 0.58
      },
      {
        cause: 'Maintenance préventive engins / auxiliaires non respectée sur la période',
        category: 'mixte',
        confidence: 0.61
      },
      {
        cause: 'Conditions météo (pluie / boue) aggravant adhérence et visibilité',
        category: 'mixte',
        confidence: 0.54
      }
    ]
  };
}

/**
 * Actions correctives mock : même forme que POST /api/ai-suggestions/suggest/actions.
 * @param {{ id?: string, ref?: string, severity?: string }} inc
 */
export function buildDemoAiCorrectiveActionsPayload(inc) {
  const ref = inc?.ref || 'INC';
  const sev = String(inc?.severity || '').toLowerCase();
  const crit = sev.includes('crit');
  return {
    incidentId: inc?.id || 'Non disponible',
    ref,
    provider: 'qhse-demo-mining',
    error: null,
    actions: [
      {
        title: `Isolement terrain et consignation : ${ref}`,
        description:
          'Baliser la zone, couper les énergies si besoin, désigner un opérateur radio, photo de preuve pour QHSE.',
        delayDays: 1,
        ownerRole: 'Chef de poste extraction',
        confidence: crit ? 0.9 : 0.78
      },
      {
        title: `Analyse 5M0 + lien registre risques (trémie / engins) : ${ref}`,
        description:
          'Mettre à jour la fiche incident, croiser avec RSK-MK-2026-01 / 02 si pertinent, proposer indicateur de suivi.',
        delayDays: 5,
        ownerRole: 'Responsable QHSE site',
        confidence: 0.73
      },
      {
        title: 'Retour d’expérience : équipe forage et maintenance',
        description:
          'Toolbox 15 min, focus EPI et circulation engins ; enregistrement dans le registre des formations.',
        delayDays: 10,
        ownerRole: 'Encadrement terrain',
        confidence: 0.67
      }
    ]
  };
}

/**
 * Incidents (réf. uniques pour PATCH /api/incidents/:ref).
 * @type {object[]}
 */
export const demoIncidentsBase = [
  {
    id: 'cldemo-inc-04',
    ref: 'INC-DEMO-2026-04',
    type: 'Quasi-accident',
    site: DEMO_SITE_LABEL,
    siteId: DEMO_SITE_ID,
    severity: 'Critique',
    description:
      'Décrochage partiel d’un garde-corps provisoire zone trémie T3. Personne non blessée, arrêt chantier 45 min.',
    status: 'Investigation',
    createdAt: '2026-04-02T14:20:00.000Z',
    location: 'Trémie T3, niveau 420',
    causes: null,
    causeCategory: null,
    photosJson: null,
    responsible: 'Amina Mukendi'
  },
  {
    id: 'cldemo-inc-03',
    ref: 'INC-DEMO-2026-03',
    type: 'Sécurité',
    site: DEMO_SITE_LABEL,
    siteId: DEMO_SITE_ID,
    severity: 'Élevée',
    description:
      'Engin en intersection sans signalisation complète. Manœuvre sécurisée par opérateur terrain.',
    status: 'En cours',
    createdAt: '2026-03-18T09:10:00.000Z',
    location: 'Carrefour logistique nord',
    causes: null,
    causeCategory: 'organisation',
    photosJson: null,
    responsible: 'Patrick Kasaï'
  },
  {
    id: 'cldemo-inc-02',
    ref: 'INC-DEMO-2026-02',
    type: 'Quasi-accident',
    site: DEMO_SITE_LABEL,
    siteId: DEMO_SITE_ID,
    severity: 'Moyenne',
    description: 'Glissade sur surface humide sans chute. Analyse 5M0 enregistrée.',
    status: 'Clôturé',
    createdAt: '2026-02-10T16:00:00.000Z',
    location: 'Atelier maintenance',
    causes: null,
    causeCategory: 'materiel',
    photosJson: null,
    responsible: 'Amina Mukendi'
  },
  {
    id: 'cldemo-inc-01',
    ref: 'INC-DEMO-2026-01',
    type: 'Environnement',
    site: DEMO_SITE_LABEL,
    siteId: DEMO_SITE_ID,
    severity: 'Faible',
    description: 'Fuite mineure sur raccord hydraulique. Colmatage immédiat.',
    status: 'Nouveau',
    createdAt: '2026-01-08T11:30:00.000Z',
    location: 'Parc engins',
    causes: null,
    causeCategory: null,
    photosJson: null,
    responsible: null
  }
];

/**
 * @type {object[]}
 */
export const demoActionsBase = [
  {
    id: 'cldemo-act-001',
    title: 'Renforcer garde-corps provisoires : zone T3',
    detail: 'Suite INC-DEMO-2026-04. Vérification tous points d’ancrage + plan photo.',
    status: 'En cours',
    owner: 'Amina Mukendi',
    dueDate: '2026-04-12T00:00:00.000Z',
    siteId: DEMO_SITE_ID,
    assigneeId: 'usr-demo-qhse-1',
    assignee: { id: 'usr-demo-qhse-1', name: 'Amina Mukendi', email: 'amina.mukendi@demo.qhse' },
    incidentId: 'cldemo-inc-04',
    createdAt: '2026-04-02T15:00:00.000Z'
  },
  {
    id: 'cldemo-act-002',
    title: 'Signalisation intersection logistique nord',
    detail: 'Balisage + feux temporaires. Alignement plan circulation interne.',
    status: 'En retard',
    owner: 'Patrick Kasaï',
    dueDate: '2026-03-25T00:00:00.000Z',
    siteId: DEMO_SITE_ID,
    assigneeId: 'usr-demo-terrain-1',
    assignee: {
      id: 'usr-demo-terrain-1',
      name: 'Patrick Kasaï',
      email: 'patrick.kasai@demo.qhse'
    },
    incidentId: 'cldemo-inc-03',
    createdAt: '2026-03-19T08:00:00.000Z'
  },
  {
    id: 'cldemo-act-003',
    title: 'NC AUD : preuves formation SST équipe forage',
    detail: 'Réf. audit AUD-DEMO-2026-03. Joindre attestations à jour.',
    status: 'En retard',
    owner: 'À assigner',
    dueDate: '2026-03-30T00:00:00.000Z',
    siteId: DEMO_SITE_ID,
    assigneeId: null,
    assignee: null,
    incidentId: null,
    createdAt: '2026-03-22T10:00:00.000Z'
  },
  {
    id: 'cldemo-act-004',
    title: 'Revue documentaire : PdP travail en hauteur',
    detail: 'Mise à jour annuelle + diffusion terrain.',
    status: 'À lancer',
    owner: 'À assigner',
    dueDate: '2026-04-20T00:00:00.000Z',
    siteId: DEMO_SITE_ID,
    assigneeId: null,
    assignee: null,
    incidentId: null,
    createdAt: '2026-04-01T09:00:00.000Z'
  },
  {
    id: 'cldemo-act-005',
    title: 'Audit interne : suivi points sortants Q1',
    status: 'Terminé',
    owner: 'Jean-Paul Ilunga',
    dueDate: '2026-02-28T00:00:00.000Z',
    siteId: DEMO_SITE_ID,
    assigneeId: 'usr-demo-dir-1',
    assignee: {
      id: 'usr-demo-dir-1',
      name: 'Jean-Paul Ilunga',
      email: 'jp.ilunga@demo.qhse'
    },
    incidentId: null,
    createdAt: '2026-02-15T14:00:00.000Z'
  }
];

/** @type {object[]} */
export const demoAudits = [
  {
    id: 'cldemo-audit-03',
    ref: 'AUD-DEMO-2026-03',
    site: DEMO_SITE_LABEL,
    siteId: DEMO_SITE_ID,
    score: 76,
    status: 'En cours',
    checklist: null,
    createdAt: '2026-03-20T08:00:00.000Z',
    autoReportSentAt: null
  },
  {
    id: 'cldemo-audit-02',
    ref: 'AUD-DEMO-2026-02',
    site: DEMO_SITE_LABEL,
    siteId: DEMO_SITE_ID,
    score: 82,
    status: 'Terminé',
    checklist: null,
    createdAt: '2026-02-05T08:00:00.000Z',
    autoReportSentAt: '2026-02-12T17:00:00.000Z'
  },
  {
    id: 'cldemo-audit-01',
    ref: 'AUD-DEMO-2025-12',
    site: DEMO_SITE_LABEL,
    siteId: DEMO_SITE_ID,
    score: 79,
    status: 'Terminé',
    checklist: null,
    createdAt: '2025-12-10T08:00:00.000Z',
    autoReportSentAt: null
  }
];

/** @type {object[]} */
export const demoNonConformities = [
  {
    id: 9201,
    title: 'Registre formation SST incomplet (équipe forage)',
    detail:
      'Référentiel : ISO 45001, article 7.2.\nCriticité : majeure.\nStatut métier : En cours.\nLié audit : AUD-DEMO-2026-03.',
    status: 'open',
    auditRef: 'AUD-DEMO-2026-03',
    auditId: 'cldemo-audit-03',
    siteId: DEMO_SITE_ID,
    createdAt: '2026-03-21T11:00:00.000Z'
  },
  {
    id: 9202,
    title: 'Plan de maintenance extincteurs : version non signée',
    detail: 'Criticité : majeure.\nStatut métier : En cours.\nLié audit : AUD-DEMO-2026-03.',
    status: 'open',
    auditRef: 'AUD-DEMO-2026-03',
    auditId: 'cldemo-audit-03',
    siteId: DEMO_SITE_ID,
    createdAt: '2026-03-21T11:15:00.000Z'
  },
  {
    id: 9203,
    title: 'Affichage consignes LEV non homogène',
    detail: 'Criticité : mineure.\nClôturé après photo de preuve.',
    status: 'closed',
    auditRef: 'AUD-DEMO-2026-02',
    auditId: 'cldemo-audit-02',
    siteId: DEMO_SITE_ID,
    createdAt: '2026-02-06T09:00:00.000Z'
  },
  {
    id: 9204,
    title: 'Bordereau déchets : case code déchet manquante',
    detail: 'Criticité : mineure.',
    status: 'open',
    auditRef: 'AUD-DEMO-2026-02',
    auditId: 'cldemo-audit-02',
    siteId: DEMO_SITE_ID,
    createdAt: '2026-02-07T10:30:00.000Z'
  }
];

function isNcOpenDemo(status) {
  const s = String(status || '').toLowerCase();
  if (/(clos|ferm|done|termin|trait)/i.test(s)) return false;
  return true;
}

function isIncidentOpenDemo(status) {
  const s = String(status || '').toLowerCase();
  return !/(clos|ferm|termin|clôtur|clotur|résolu|resolu|done|complete|trait)/i.test(s);
}

/**
 * @param {object[]} incidents
 * @param {object[]} actions
 * @param {object[]} ncs
 */
export function buildDemoDashboardStats(incidents, actions, ncs) {
  const criticalIncidents = incidents
    .filter((row) => String(row.severity || '').toLowerCase().includes('critique'))
    .slice(0, 5)
    .map(({ severity: _s, ...rest }) => rest);

  const overdueActionItems = actions
    .filter((row) => String(row.status || '').toLowerCase().includes('retard'))
    .slice(0, 5)
    .map((row) => ({
      title: row.title,
      detail: row.detail ?? null,
      status: row.status,
      owner: row.owner ?? null,
      dueDate: row.dueDate ?? null,
      createdAt: row.createdAt ?? null
    }));

  const overdueActions = actions.filter((row) =>
    String(row.status || '').toLowerCase().includes('retard')
  ).length;

  const ncOpen = ncs.filter((r) => isNcOpenDemo(r.status)).length;

  return {
    incidents: incidents.length,
    actions: actions.length,
    overdueActions,
    nonConformities: ncOpen,
    criticalIncidents,
    overdueActionItems,
    siteId: null
  };
}

/**
 * @param {object[]} incidents
 * @param {object[]} actions
 * @param {object[]} audits
 * @param {object[]} ncs
 */
export function buildDemoReportingSummary(incidents, actions, audits, ncs) {
  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const incidentsLast30Days = incidents.filter((i) => new Date(i.createdAt) >= since30).length;
  const openNc = ncs.filter((r) => isNcOpenDemo(r.status));
  const criticalOpen = incidents.filter(
    (row) =>
      String(row.severity || '').toLowerCase().includes('critique') &&
      isIncidentOpenDemo(row.status)
  );
  const overdue = actions.filter((a) => String(a.status || '').toLowerCase().includes('retard'));
  const scores = audits.map((a) => Number(a.score)).filter((n) => Number.isFinite(n));
  const auditScoreAvg =
    scores.length > 0 ? Math.round((scores.reduce((x, y) => x + y, 0) / scores.length) * 10) / 10 : null;

  const priorityAlerts = [];
  if (criticalOpen.length > 0) {
    priorityAlerts.push({
      level: 'critical',
      code: 'INCIDENTS_CRITIQUES',
      message: `${criticalOpen.length} incident(s) critique(s) encore ouverts.`
    });
  }
  if (overdue.length > 0) {
    priorityAlerts.push({
      level: 'high',
      code: 'ACTIONS_RETARD',
      message: `${overdue.length} action(s) en retard. Relance du plan d’actions recommandée.`
    });
  }
  if (openNc.length > 0) {
    priorityAlerts.push({
      level: openNc.length >= 3 ? 'high' : 'info',
      code: 'NC_OUVERTES',
      message: `${openNc.length} non-conformité(s) ouverte(s).`
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    siteId: null,
    counts: {
      incidentsTotal: incidents.length,
      incidentsLast30Days,
      incidentsCriticalOpen: criticalOpen.length,
      nonConformitiesTotal: ncs.length,
      nonConformitiesOpen: openNc.length,
      actionsTotal: actions.length,
      actionsOverdue: overdue.length,
      auditsTotal: audits.length
    },
    kpis: {
      auditScoreAvg,
      auditScoreMin: scores.length ? Math.min(...scores) : null,
      auditScoreMax: scores.length ? Math.max(...scores) : null
    },
    recentAudits: audits.slice(0, 6).map((a) => ({
      ref: a.ref,
      site: a.site,
      score: a.score,
      status: a.status,
      createdAt: a.createdAt
    })),
    openNonConformities: openNc.slice(0, 8).map((row) => ({
      id: row.id,
      title: row.title,
      detail: row.detail,
      status: row.status,
      auditRef: row.auditRef,
      createdAt: row.createdAt
    })),
    overdueActions: overdue.slice(0, 8).map((row) => ({
      title: row.title,
      detail: row.detail,
      status: row.status,
      owner: row.owner,
      dueDate: row.dueDate,
      createdAt: row.createdAt
    })),
    criticalIncidents: criticalOpen.slice(0, 6).map((row) => ({
      ref: row.ref,
      type: row.type,
      site: row.site,
      status: row.status,
      createdAt: row.createdAt
    })),
    priorityAlerts,
    export: {
      documentTitle: 'Synthèse QHSE : exploration locale',
      schemaVersion: 1,
      sectionsOrder: [
        'counts',
        'kpis',
        'priorityAlerts',
        'criticalIncidents',
        'overdueActions',
        'openNonConformities',
        'recentAudits'
      ]
    }
  };
}

/** @type {object[]} */
export const demoNotifications = [
  {
    id: 'demo-notif-1',
    kind: 'incident',
    title: 'Incident critique : INC-DEMO-2026-04',
    detail: 'Quasi-accident zone T3. Investigation en cours.',
    level: 'critical',
    read: false,
    timestamp: '2026-04-02T15:30:00.000Z'
  },
  {
    id: 'demo-notif-2',
    kind: 'action',
    title: 'Actions en retard : 2 fiches',
    detail: 'Signalisation nord + preuves formation SST.',
    level: 'warning',
    read: false,
    timestamp: '2026-04-01T08:00:00.000Z'
  },
  {
    id: 'demo-notif-3',
    kind: 'audit',
    title: 'Audit récent : AUD-DEMO-2026-03',
    detail: 'Audit ISO 45001 en cours. Score provisoire 76 %.',
    level: 'info',
    read: false,
    timestamp: '2026-03-22T09:00:00.000Z'
  },
  {
    id: 'demo-notif-4',
    kind: 'nonconformity',
    title: 'Non-conformité ouverte : registre formation SST',
    detail: 'NC majeure liée à AUD-DEMO-2026-03.',
    level: 'critical',
    read: false,
    timestamp: '2026-03-21T12:00:00.000Z'
  },
  {
    id: 'demo-notif-5',
    kind: 'action_assigned',
    title: 'Action assignée : garde-corps T3',
    detail: 'Vous êtes responsable du suivi.',
    level: 'info',
    read: true,
    timestamp: '2026-04-02T16:00:00.000Z'
  }
];

/** @type {object[]} */
export const demoControlledDocuments = [
  {
    id: 'cldemo-doc-1',
    name: 'Procédure travail en hauteur v4',
    type: 'procedure',
    path: 'demo/proc-hauteur-v4.pdf',
    classification: 'sensible',
    siteId: DEMO_SITE_ID,
    createdAt: '2025-11-01T10:00:00.000Z',
    updatedAt: '2026-03-15T10:00:00.000Z',
    mimeType: 'application/pdf',
    sizeBytes: 245000,
    auditId: null,
    fdsProductRef: null,
    isoRequirementRef: 'ISO 45001 : 8.1',
    riskRef: null,
    complianceTag: 'SST',
    expiresAt: '2026-06-01T00:00:00.000Z',
    responsible: 'Amina Mukendi',
    version: '4.1',
    pendingValidation: false,
    rejected: false
  },
  {
    id: 'cldemo-doc-2',
    name: 'Plan de gestion des déchets : annexe B',
    type: 'iso_proof',
    path: 'demo/pgd-annexe-b.pdf',
    classification: 'normal',
    siteId: DEMO_SITE_ID,
    createdAt: '2025-09-10T08:00:00.000Z',
    updatedAt: '2026-01-20T08:00:00.000Z',
    mimeType: 'application/pdf',
    sizeBytes: 512000,
    auditId: null,
    isoRequirementRef: 'ISO 14001 : 8.1',
    expiresAt: '2026-03-01T00:00:00.000Z',
    responsible: 'Jean-Paul Ilunga',
    version: '2.0',
    pendingValidation: true,
    rejected: false
  },
  {
    id: 'cldemo-doc-3',
    name: 'Registre formation SST (extrait)',
    type: 'other',
    path: 'demo/registre-sst-extrait.xlsx',
    classification: 'critique',
    siteId: DEMO_SITE_ID,
    createdAt: '2026-02-01T09:00:00.000Z',
    updatedAt: '2026-02-28T09:00:00.000Z',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    sizeBytes: 88000,
    expiresAt: '2026-05-15T00:00:00.000Z',
    responsible: 'Amina Mukendi',
    version: 'Non renseigné',
    pendingValidation: false,
    rejected: false
  },
  {
    id: 'cldemo-doc-4',
    name: 'FDS Emulsion explosive ANFO',
    type: 'fds',
    path: 'demo/fds-anfo.pdf',
    classification: 'critique',
    siteId: DEMO_SITE_ID,
    createdAt: '2026-02-10T09:00:00.000Z',
    updatedAt: '2026-04-03T09:00:00.000Z',
    mimeType: 'application/pdf',
    sizeBytes: 198000,
    fdsProductRef: 'EXP-ANFO-01',
    complianceTag: 'SST',
    expiresAt: '2026-07-10T00:00:00.000Z',
    responsible: 'Amina Mukendi',
    version: '3.2',
    pendingValidation: false,
    rejected: false
  },
  {
    id: 'cldemo-doc-5',
    name: 'FDS Floculant traitement',
    type: 'fds',
    path: 'demo/fds-floculant.pdf',
    classification: 'normal',
    siteId: DEMO_SITE_ID,
    createdAt: '2025-12-18T08:00:00.000Z',
    updatedAt: '2026-03-28T08:00:00.000Z',
    mimeType: 'application/pdf',
    sizeBytes: 142000,
    fdsProductRef: 'CHEM-FLOC-02',
    complianceTag: 'Environnement',
    expiresAt: '2026-06-30T00:00:00.000Z',
    responsible: 'Jean-Paul Ilunga',
    version: '2.4',
    pendingValidation: false,
    rejected: false
  }
];

export const demoPtwBase = [
  {
    id: 'ptw-demo-001',
    ref: 'PTW-DEMO-2026-001',
    type: 'travail en hauteur',
    zone: 'Concassage',
    description: 'Remplacement garde-corps passerelle convoyeur C2.',
    date: '2026-04-13',
    team: 'Equipe maintenance mecanique',
    checklist: ['Ancrage vérifié (OK)', 'Ligne de vie installée (OK)', 'Zone balisée au sol (OK)'],
    epi: ['Casque', 'Harnais', 'Lunettes'],
    safetyConditions: ['Permis feu non requis', 'Balisage renforcé'],
    status: 'in_progress',
    riskAnalysis: 'Risque chute hauteur et chute objet sur zone de circulation.',
    validationMode: 'double',
    signatures: [],
    synced: true,
    syncState: 'synced',
    syncPendingCount: 0,
    createdAt: '2026-04-12T08:10:00.000Z',
    updatedAt: '2026-04-12T10:00:00.000Z'
  },
  {
    id: 'ptw-demo-002',
    ref: 'PTW-DEMO-2026-002',
    type: 'espace confiné',
    zone: 'Usine de traitement',
    description: 'Inspection interne cuve réactifs section flottation.',
    date: '2026-04-14',
    team: 'Equipe process',
    checklist: ['Mesure atmosphère OK (OK)', 'Ventilation en place (OK)', 'Surveillant extérieur présent (OK)'],
    epi: ['Casque', 'Détecteur gaz', 'Masque filtrant'],
    safetyConditions: ['Permis valide 1 jour', 'Secours stand-by'],
    status: 'validated',
    riskAnalysis: 'Asphyxie, gaz résiduels et évacuation difficile.',
    validationMode: 'double',
    signatures: [],
    synced: true,
    syncState: 'synced',
    syncPendingCount: 0,
    createdAt: '2026-04-11T16:20:00.000Z',
    updatedAt: '2026-04-12T07:30:00.000Z'
  },
  {
    id: 'ptw-demo-003',
    ref: 'PTW-DEMO-2026-003',
    type: 'explosifs',
    zone: 'Zone explosifs',
    description: 'Préparation tir contrôlé secteur front FN-12.',
    date: '2026-04-13',
    team: 'Equipe forage-minage',
    checklist: ['Zone sécurisée (OK)', 'Autorisation spéciale confirmée (OK)', 'Brief sécurité fait (OK)'],
    epi: ['Casque', 'Gants anti-coupure', 'Protection auditive'],
    safetyConditions: ['Périmètre évacué', 'Radio canal sécurité'],
    status: 'pending',
    riskAnalysis: 'Risque détonation prématurée et projection.',
    validationMode: 'double',
    signatures: [],
    synced: true,
    syncState: 'synced',
    syncPendingCount: 0,
    createdAt: '2026-04-12T12:00:00.000Z',
    updatedAt: '2026-04-12T12:00:00.000Z'
  }
];

export const demoHabilitationsBase = [
  {
    id: 'hab-demo-001',
    user: { id: 'usr-demo-terrain-1', name: 'Patrick Kasaï', role: 'TERRAIN', email: 'patrick.kasai@demo.qhse' },
    siteRecord: { id: DEMO_SITE_ID, name: DEMO_SITE_LABEL },
    type: 'Conduite engin lourd',
    level: 'N3',
    validFrom: '2025-05-12T00:00:00.000Z',
    validUntil: '2026-10-01T00:00:00.000Z',
    organisme: 'INHST',
    status: 'active',
    justificatif: true
  },
  {
    id: 'hab-demo-002',
    user: { id: 'usr-demo-qhse-1', name: 'Amina Mukendi', role: 'QHSE', email: 'amina.mukendi@demo.qhse' },
    siteRecord: { id: DEMO_SITE_ID, name: DEMO_SITE_LABEL },
    type: 'Atmosphère explosible',
    level: 'N3',
    validFrom: '2024-09-02T00:00:00.000Z',
    validUntil: '2026-04-24T00:00:00.000Z',
    organisme: 'APAVE',
    status: 'expire_bientot',
    justificatif: true
  },
  {
    id: 'hab-demo-003',
    user: { id: 'usr-demo-dir-1', name: 'Jean-Paul Ilunga', role: 'ADMIN', email: 'jp.ilunga@demo.qhse' },
    siteRecord: { id: DEMO_SITE_ID, name: DEMO_SITE_LABEL },
    type: 'Permis feu',
    level: 'N2',
    validFrom: '2023-11-03T00:00:00.000Z',
    validUntil: '2026-03-10T00:00:00.000Z',
    organisme: 'Bureau Veritas',
    status: 'expired',
    justificatif: true
  }
];
