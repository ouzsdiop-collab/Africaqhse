import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Mot de passe démo (tous les comptes seed) — à changer en production. */
const DEMO_PASSWORD = 'Demo2026!';

const MS_DAY = 24 * 60 * 60 * 1000;

/** Dates dynamiques depuis l’exécution du seed. */
function daysAgo(n) {
  const d = new Date(Date.now() - n * MS_DAY);
  d.setHours(10, 30, 0, 0);
  return d;
}

function daysFromNow(n) {
  const d = new Date(Date.now() + n * MS_DAY);
  d.setHours(14, 0, 0, 0);
  return d;
}

/**
 * Points de contrôle risques (checklist) sur l’audit SST AUD-2026-107.
 * Les risques structurés sont aussi créés dans la table `risks` (modèle Prisma).
 */
function riskChecklistEntries() {
  return [
    {
      point:
        'R01 — Collision engins lourds en zone d’extraction (P3×S5 = 15, criticité élevée, Sécurité). Traitement : signalisation renforcée, séparation des flux piétons/engins, formation conducteurs, vitesse limitée 20 km/h en zone active.',
      conforme: false
    },
    {
      point:
        'R02 — Exposition chronique aux poussières de silice (P4×S4 = 16, criticité élevée, Santé). Traitement : port masque FFP3 obligatoire, arrosage des pistes 3×/jour, surveillance médicale annuelle obligatoire.',
      conforme: false
    },
    {
      point:
        'R03 — Fuite ou déversement de solution cyanurée (P2×S5 = 10, criticité moyenne, Environnement). Traitement : double confinement des cuves, kit anti-pollution 24h/24, protocole urgence cyanure affiché et testé.',
      conforme: false
    },
    {
      point:
        'R04 — Accident tir de mines — raté ou sous-charge (P2×S5 = 10, criticité moyenne, Sécurité). Traitement : procédure tir validée artificieur certifié, périmètre 500 m obligatoire, inspection post-tir systématique.',
      conforme: false
    },
    {
      point:
        'R05 — Chute en hauteur depuis plateforme ou front de taille (P3×S4 = 12, criticité élevée, Sécurité). Traitement : garde-corps obligatoires toutes plateformes >2 m, harnais certifié, permis travail en hauteur systématique.',
      conforme: false
    },
    {
      point:
        'R06 — Pollution nappe phréatique par eaux de procédé (P2×S5 = 10, criticité moyenne, Environnement). Traitement : bassins de rétention étanches, analyses eau trimestrielles, plan de surveillance piézométrique.',
      conforme: false
    },
    {
      point:
        'R07 — Incendie dépôt hydrocarbures (P2×S4 = 8, criticité moyenne, Sécurité). Traitement : rétention 110 % volume, système extinction automatique, interdiction feu nu, rondes quotidiennes.',
      conforme: false
    },
    {
      point:
        'R08 — Glissement de terrain — talus en exploitation active (P3×S3 = 9, criticité moyenne, Sécurité). Traitement : contrôle géotechnique mensuel, angle talus conforme, repères visuels de déformation installés.',
      conforme: false
    },
    {
      point:
        'R09 — Intoxication monoxyde de carbone — espace confiné (P2×S4 = 8, criticité moyenne, Santé). Traitement : détecteur CO obligatoire avant entrée, ventilation forcée, permis espace confiné.',
      conforme: false
    },
    {
      point:
        'R10 — Bruit excessif — zone concassage et forage (P4×S3 = 12, criticité élevée, Santé). Traitement : port bouchons et casque antibruit obligatoire, rotation des postes, audiogramme annuel.',
      conforme: false
    },
    {
      point:
        'R11 — Vibrations corps entier — conducteurs engins (P3×S2 = 6, criticité faible à moyenne, Santé). Traitement : sièges anti-vibrations homologués, rotation conducteurs 4 h max par session, suivi médical.',
      conforme: true
    },
    {
      point:
        'R12 — Stress thermique — travail en plein soleil saison sèche (P4×S2 = 8, criticité moyenne, Santé). Traitement : pauses obligatoires toutes les 2 h, eau fraîche disponible en permanence, horaires adaptés saison chaude.',
      conforme: true
    }
  ];
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  /** Aligné avec `tenantConstants` et la migration multi-tenant. */
  const DEFAULT_TENANT_ID = 'qhse_default_tenant';
  await prisma.tenant.upsert({
    where: { id: DEFAULT_TENANT_ID },
    create: { id: DEFAULT_TENANT_ID, slug: 'default', name: 'Katiola Mining (démo)', status: 'active' },
    update: { name: 'Katiola Mining (démo)', status: 'active' }
  });

  /** 8 comptes — rôles limités à ceux listés (permissions V1). */
  const seedUsers = [
    { name: 'Admin Système', email: 'admin@qhse.local', role: 'ADMIN' },
    { name: 'Responsable QHSE', email: 'qhse@qhse.local', role: 'QHSE' },
    { name: 'Direction Site', email: 'direction@qhse.local', role: 'DIRECTION' },
    { name: 'Assistant Qualité', email: 'assistant@qhse.local', role: 'ASSISTANT' },
    { name: 'Chef de chantier', email: 'terrain@qhse.local', role: 'TERRAIN' },
    { name: 'Ingénieur extraction', email: 'extraction@qhse.local', role: 'QHSE' },
    { name: 'Coordonnateur forage', email: 'forage@qhse.local', role: 'TERRAIN' },
    { name: 'Superviseur concassage', email: 'concassage@qhse.local', role: 'ASSISTANT' }
  ];

  for (const u of seedUsers) {
    const email = u.email.toLowerCase();
    await prisma.user.upsert({
      where: { email },
      create: {
        name: u.name,
        email,
        role: u.role,
        passwordHash,
        isActive: true,
        mustChangePassword: false
      },
      update: {
        name: u.name,
        role: u.role,
        passwordHash,
        isActive: true
      }
    });
  }

  await prisma.user.upsert({
    where: { email: 'superadmin@qhse.local' },
    create: {
      name: 'Super Administrateur',
      email: 'superadmin@qhse.local',
      role: 'SUPER_ADMIN',
      passwordHash,
      isActive: true,
      mustChangePassword: false,
      clientCode: 'superadmin'
    },
    update: {
      name: 'Super Administrateur',
      role: 'SUPER_ADMIN',
      passwordHash,
      isActive: true,
      mustChangePassword: false,
      clientCode: 'superadmin'
    }
  });

  for (const u of seedUsers) {
    const email = u.email.toLowerCase();
    const row = await prisma.user.findUnique({ where: { email } });
    if (row) {
      await prisma.tenantMember.upsert({
        where: { tenantId_userId: { tenantId: DEFAULT_TENANT_ID, userId: row.id } },
        create: { tenantId: DEFAULT_TENANT_ID, userId: row.id, role: u.role },
        update: { role: u.role }
      });
    }
  }

  const superRow = await prisma.user.findUnique({ where: { email: 'superadmin@qhse.local' } });
  if (superRow) {
    await prisma.tenantMember.upsert({
      where: { tenantId_userId: { tenantId: DEFAULT_TENANT_ID, userId: superRow.id } },
      create: { tenantId: DEFAULT_TENANT_ID, userId: superRow.id, role: 'SUPER_ADMIN' },
      update: { role: 'SUPER_ADMIN' }
    });
  }

  await prisma.aiSuggestion.deleteMany({});
  await prisma.controlledDocument.deleteMany({});
  await prisma.importHistory.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.action.deleteMany({});
  await prisma.nonConformity.deleteMany({});
  await prisma.audit.deleteMany({});
  await prisma.incident.deleteMany({});
  await prisma.risk.deleteMany({});
  await prisma.habilitation.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.site.deleteMany({});

  /**
   * Identifiants stables (filtre `?siteId=` dashboard, API, TF/TG).
   * MINE-YAKRO : extraction / engins / forage production.
   * USINE-ABJ : concassage, lixiviation, laboratoire, stockage réactifs.
   * EXPL-BON : forage reconnaissance, géotech, hors chaîne usine.
   */
  const KATIOLA_MINE_YAKRO = 'KATIOLA_MINE_YAKRO';
  const KATIOLA_USINE_ABJ = 'KATIOLA_USINE_ABJ';
  const KATIOLA_EXPLORATION_BON = 'KATIOLA_EXPLORATION_BON';

  await prisma.site.create({
    data: {
      id: KATIOLA_MINE_YAKRO,
      tenantId: DEFAULT_TENANT_ID,
      name: 'Katiola Mining — Site Extraction Yakouro',
      code: 'MINE-YAKRO',
      address: "Front d'exploitation aurifère — forage, extraction et transport stériles"
    }
  });
  await prisma.site.create({
    data: {
      id: KATIOLA_USINE_ABJ,
      tenantId: DEFAULT_TENANT_ID,
      name: 'Katiola Mining — Usine Traitement Abidjan',
      code: 'USINE-ABJ',
      address: 'Unité de traitement du minerai, bassins, atelier lixiviation et laboratoire'
    }
  });
  await prisma.site.create({
    data: {
      id: KATIOLA_EXPLORATION_BON,
      tenantId: DEFAULT_TENANT_ID,
      name: 'Katiola Mining — Zone Exploration Bondoukou',
      code: 'EXPL-BON',
      address: 'Plateformes de forage exploration, géotechnique et hydrogéologie'
    }
  });

  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@qhse.local' } });
  const qhse = await prisma.user.findUnique({ where: { email: 'qhse@qhse.local' } });
  const direction = await prisma.user.findUnique({ where: { email: 'direction@qhse.local' } });
  const assistant = await prisma.user.findUnique({ where: { email: 'assistant@qhse.local' } });
  const terrain = await prisma.user.findUnique({ where: { email: 'terrain@qhse.local' } });
  const extraction = await prisma.user.findUnique({ where: { email: 'extraction@qhse.local' } });
  const forage = await prisma.user.findUnique({ where: { email: 'forage@qhse.local' } });
  const concassage = await prisma.user.findUnique({ where: { email: 'concassage@qhse.local' } });

  const M = 'MINE-YAKRO';
  const S = 'USINE-ABJ';
  const E = 'EXPL-BON';

  /** Risques enregistrés (probability × gravity = gp), secteur minier + exploration. */
  const risksSeed = [
    {
      ref: 'RSK-2026-01',
      title: 'Collision engins lourds — zone extraction',
      description: 'Croisement tombereaux / engins de forage, visibilité réduite poussière.',
      category: 'Sécurité',
      probability: 4,
      gravity: 5,
      status: 'open',
      owner: qhse?.name ?? 'QHSE',
      siteId: KATIOLA_MINE_YAKRO
    },
    {
      ref: 'RSK-2026-02',
      title: 'Exposition silice — concassage',
      description: 'Poussières cristallines, postes fixes et rondes maintenance.',
      category: 'Santé',
      probability: 4,
      gravity: 4,
      status: 'open',
      owner: extraction?.name ?? 'QHSE',
      siteId: KATIOLA_USINE_ABJ
    },
    {
      ref: 'RSK-2026-03',
      title: 'Déversement solution cyanurée',
      description: 'Cuves, pompes et canalisations salle lixiviation.',
      category: 'Environnement',
      probability: 2,
      gravity: 5,
      status: 'open',
      owner: qhse?.name ?? 'QHSE',
      siteId: KATIOLA_USINE_ABJ
    },
    {
      ref: 'RSK-2026-04',
      title: 'Tir de mines — projectile ou mégot',
      description: 'Campagnes de minage, respect périmètre et procédure artificier.',
      category: 'Sécurité',
      probability: 2,
      gravity: 5,
      status: 'mitigation',
      owner: forage?.name ?? 'Forage',
      siteId: KATIOLA_MINE_YAKRO
    },
    {
      ref: 'RSK-2026-05',
      title: 'Chute hauteur — plateformes forage',
      description: 'Garde-corps, harnais, conditions météo.',
      category: 'Sécurité',
      probability: 3,
      gravity: 4,
      status: 'open',
      owner: terrain?.name ?? 'Terrain',
      siteId: KATIOLA_MINE_YAKRO
    },
    {
      ref: 'RSK-2026-06',
      title: 'Glissement de talus / stériles',
      description: 'Saison des pluies, surveillance géotechnique.',
      category: 'Sécurité',
      probability: 3,
      gravity: 3,
      status: 'open',
      owner: direction?.name ?? 'Direction',
      siteId: KATIOLA_MINE_YAKRO
    },
    {
      ref: 'RSK-2026-07',
      title: 'Incendie dépôt hydrocarbures',
      description: 'Stockage gasoil et lubrifiants zone engins.',
      category: 'Sécurité',
      probability: 2,
      gravity: 4,
      status: 'open',
      owner: concassage?.name ?? 'Assistant',
      siteId: KATIOLA_USINE_ABJ
    },
    {
      ref: 'RSK-2026-08',
      title: 'Bruit et vibrations — concassage',
      description: 'Exposition des opérateurs et riverains internes.',
      category: 'Santé',
      probability: 4,
      gravity: 3,
      status: 'open',
      owner: assistant?.name ?? 'Assistant',
      siteId: KATIOLA_USINE_ABJ
    },
    {
      ref: 'RSK-2026-09',
      title: 'Forage exploration — projection boue / tige',
      description: 'Plateformes mobiles, rotation tiges, zone riveraine.',
      category: 'Sécurité',
      probability: 3,
      gravity: 3,
      status: 'open',
      owner: forage?.name ?? 'Forage',
      siteId: KATIOLA_EXPLORATION_BON
    },
    {
      ref: 'RSK-2026-10',
      title: 'Accès pistes saison pluies — enlisement convois',
      description: 'Liaison camp / plateformes, engins légers et approvisionnement.',
      category: 'Sécurité',
      probability: 3,
      gravity: 2,
      status: 'mitigation',
      owner: terrain?.name ?? 'Terrain',
      siteId: KATIOLA_EXPLORATION_BON
    },
    {
      ref: 'RSK-2026-11',
      title: 'Chute plateforme forage exploration — garde-corps mobile',
      description: 'Montage/démontage plates-formes, travail en hauteur sans filet.',
      category: 'Sécurité',
      probability: 4,
      gravity: 4,
      status: 'open',
      owner: forage?.name ?? 'Forage',
      siteId: KATIOLA_EXPLORATION_BON
    }
  ];

  for (const r of risksSeed) {
    const gp = r.probability * r.gravity;
    await prisma.risk.create({
      data: {
        tenantId: DEFAULT_TENANT_ID,
        ref: r.ref,
        title: r.title,
        description: r.description,
        category: r.category,
        gravity: r.gravity,
        severity: r.gravity,
        probability: r.probability,
        gp,
        status: r.status,
        owner: r.owner,
        siteId: r.siteId
      }
    });
  }

  /** 20 incidents — sévérités : critique, moyen, faible. */
  const incidentsData = [
    {
      ref: 'INC-2026-001',
      type: 'Engin / circulation',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      severity: 'critique',
      status: 'Investigation',
      days: 18,
      description:
        'Renversement de tombereau minier grande capacité en zone de dumping lors d’une manœuvre sur le bord du merlon. Chauffeur évacué avec fracture du poignet droit. Zone neutralisée en attente d’investigation.'
    },
    {
      ref: 'INC-2026-002',
      type: 'Accident',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      severity: 'critique',
      status: 'En cours',
      days: 35,
      description:
        'Projection de fragments rocheux hors périmètre sécurisé après tir de mines. Deux agents légèrement blessés. Périmètre de sécurité évalué comme insuffisant.'
    },
    {
      ref: 'INC-2026-003',
      type: 'Environnement',
      site: S,
      siteId: KATIOLA_USINE_ABJ,
      severity: 'critique',
      status: 'Clôturé',
      days: 52,
      description:
        'Fuite sur vanne de dosage solution cyanurée en salle de lixiviation. Opérateur exposé suite à port incomplet des EPI. Procédure de consignation renforcée et vanne remplacée.'
    },
    {
      ref: 'INC-2026-004',
      type: 'Accident',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      severity: 'critique',
      status: 'Clôturé',
      days: 78,
      description:
        'Chute de 3,2 mètres depuis plateforme de forage sans garde-corps. Opérateur hospitalisé, ITT 21 jours. Plateforme consignée et équipée en urgence.'
    },
    {
      ref: 'INC-2026-005',
      type: 'Engin / circulation',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      severity: 'critique',
      status: 'Clôturé',
      days: 112,
      description:
        'Départ de feu sur foreuse hydraulique sur chenilles suite à fuite d’huile hydraulique sur zone chaude. Maîtrisé à l’extincteur. Aucun blessé. Foreuse immobilisée 9 jours.'
    },
    {
      ref: 'INC-2026-006',
      type: 'Quasi-accident',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      severity: 'moyen',
      status: 'Nouveau',
      days: 8,
      description:
        'Quasi-collision entre véhicule léger et dumper au carrefour de la zone de chargement. Absence de signalisation au croisement.'
    },
    {
      ref: 'INC-2026-007',
      type: 'Accident',
      site: S,
      siteId: KATIOLA_USINE_ABJ,
      severity: 'moyen',
      status: 'En cours',
      days: 14,
      description:
        'Inhalation de poussières siliceuses en zone de concassage. Agent sans masque FFP3. Envoyé en consultation médicale préventive.'
    },
    {
      ref: 'INC-2026-008',
      type: 'Environnement',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      severity: 'moyen',
      status: 'En cours',
      days: 22,
      description:
        "Déversement de gasoil sur l'aire de ravitaillement des engins suite à défaillance du pistolet de remplissage. Environ 40 litres répandus, absorption en cours."
    },
    {
      ref: 'INC-2026-009',
      type: 'Quasi-accident',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      severity: 'moyen',
      status: 'Investigation',
      days: 41,
      description:
        "Raté de tir lors d'une campagne de minage. Détonateur non amorcé découvert lors de l'inspection post-tir. Zone consignée 48 h."
    },
    {
      ref: 'INC-2026-010',
      type: 'Accident',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      severity: 'moyen',
      status: 'Clôturé',
      days: 55,
      description:
        "Chute d'un outil depuis la nacelle d'un engin de levage. Aucun blessé mais zone de passage non neutralisée. Procédure levage révisée."
    },
    {
      ref: 'INC-2026-011',
      type: 'Environnement',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      severity: 'moyen',
      status: 'Clôturé',
      days: 63,
      description:
        "Contamination légère d'une rigole de drainage par eaux de procédé. Détectée lors d'une ronde environnementale. Obturation et neutralisation effectuées."
    },
    {
      ref: 'INC-2026-012',
      type: 'Accident',
      site: S,
      siteId: KATIOLA_USINE_ABJ,
      severity: 'moyen',
      status: 'Clôturé',
      days: 71,
      description:
        "Accident de trajet impliquant un véhicule de liaison. Accrochage avec un engin de chantier à l'entrée du site. Dégâts matériels uniquement."
    },
    {
      ref: 'INC-2026-013',
      type: 'Quasi-accident',
      site: S,
      siteId: KATIOLA_USINE_ABJ,
      severity: 'moyen',
      status: 'Clôturé',
      days: 88,
      description:
        "Câble électrique défectueux découvert dans l'atelier de maintenance. Court-circuit évité de justesse. Remplacement immédiat effectué."
    },
    {
      ref: 'INC-2026-014',
      type: 'Environnement',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      severity: 'moyen',
      status: 'Clôturé',
      days: 95,
      description:
        'Glissement de terrain mineur sur le talus de la zone à stériles après fortes pluies. Aucun blessé. Géotechnicien mandaté pour contrôle de stabilité.'
    },
    {
      ref: 'INC-2026-015',
      type: 'Accident',
      site: S,
      siteId: KATIOLA_USINE_ABJ,
      severity: 'moyen',
      status: 'Clôturé',
      days: 108,
      description:
        'Blessure main lors de la maintenance du concasseur primaire. Agent coincé entre deux pièces mécaniques pendant une opération sans consignation préalable.'
    },
    {
      ref: 'INC-2026-016',
      type: 'Quasi-accident',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      severity: 'faible',
      status: 'Clôturé',
      days: 32,
      description:
        "Glissade d'un agent sur sol boueux à l'entrée du vestiaire. Légère contusion. Tapis anti-dérapants installés."
    },
    {
      ref: 'INC-2026-017',
      type: 'Autre',
      site: S,
      siteId: KATIOLA_USINE_ABJ,
      severity: 'faible',
      status: 'Clôturé',
      days: 48,
      description:
        "Petite coupure lors de la manipulation d'un échantillon rocheux sans gants. Soins de premier secours sur place."
    },
    {
      ref: 'INC-2026-018',
      type: 'Environnement',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      severity: 'faible',
      status: 'En cours',
      days: 59,
      description:
        'Dépôt sauvage de déchets ménagers à proximité de la zone vie. Sensibilisation équipes programmée.'
    },
    {
      ref: 'INC-2026-019',
      type: 'Quasi-accident',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      severity: 'faible',
      status: 'Clôturé',
      days: 75,
      description:
        "Départ en roue libre d'un véhicule non calé sur pente. Arrêté par butte. Aucun dommage."
    },
    {
      ref: 'INC-2026-020',
      type: 'Autre',
      site: S,
      siteId: KATIOLA_USINE_ABJ,
      severity: 'faible',
      status: 'En cours',
      days: 90,
      description:
        "Réactif chimique stocké hors zone réglementaire. Détecté lors d'audit interne. Remise en conformité planifiée."
    },
    {
      ref: 'INC-2026-021',
      type: 'Quasi-accident',
      site: E,
      siteId: KATIOLA_EXPLORATION_BON,
      severity: 'moyen',
      status: 'Investigation',
      days: 11,
      description:
        'Décrochage partiel tige forage sur sondage EX-BON-14 : arrêt d’urgence, personne non blessée. Inspection équipement en cours.'
    },
    {
      ref: 'INC-2026-023',
      type: 'Engin / circulation',
      site: E,
      siteId: KATIOLA_EXPLORATION_BON,
      severity: 'critique',
      status: 'En cours',
      days: 6,
      description:
        'Rupture conduite hydraulique sur foreuse légère — jet sous pression près d’opérateurs. Arrêt machine, blessure légère au visage (sans ITT).'
    },
    {
      ref: 'INC-2026-022',
      type: 'Environnement',
      site: E,
      siteId: KATIOLA_EXPLORATION_BON,
      severity: 'faible',
      status: 'En cours',
      days: 26,
      description:
        'Boues forage stockées hors bâche étanche 24 h — rétention provisoire conformée, camp Bondoukou.'
    }
  ];

  for (const inc of incidentsData) {
    await prisma.incident.create({
      data: {
        tenantId: DEFAULT_TENANT_ID,
        ref: inc.ref,
        type: inc.type,
        site: inc.site,
        siteId: inc.siteId,
        severity: inc.severity,
        description: inc.description,
        status: inc.status,
        createdAt: daysAgo(inc.days)
      }
    });
  }

  const auditsData = [
    {
      ref: 'AUD-2026-101',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      score: 61,
      status: 'Terminé',
      days: 45,
      checklist: [
        {
          point:
            'Audit sécurité engins — zone extraction (Interne). Constat : signalisation insuffisante sur 3 croisements, 4 conducteurs sans formation à jour, usure pneus à surveiller sur 2 tombereaux.',
          conforme: false
        },
        {
          point:
            'Signalisation insuffisante sur 3 croisements ; 4 conducteurs sans formation à jour ; usure pneus à surveiller sur 2 tombereaux.',
          conforme: false
        }
      ]
    },
    {
      ref: 'AUD-2026-102',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      score: 74,
      status: 'Terminé',
      days: 62,
      checklist: [
        {
          point:
            'Audit hygiène industrielle — exposition poussières silice (Interne). Constat : mesurages proches des valeurs limites, arrosage irrégulier en saison sèche, 2 agents sans visite médicale annuelle.',
          conforme: false
        }
      ]
    },
    {
      ref: 'AUD-2026-103',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      score: 82,
      status: 'Terminé',
      days: 78,
      checklist: [
        {
          point:
            'Audit ISO 14001 — gestion déchets et effluents (Externe). Constat : bonne gestion globale, registre déchets dangereux T3 incomplet, une rigole de drainage à étanchéifier.',
          conforme: false
        }
      ]
    },
    {
      ref: 'AUD-2026-104',
      site: S,
      siteId: KATIOLA_USINE_ABJ,
      score: 88,
      status: 'Terminé',
      days: 91,
      checklist: [
        {
          point:
            'Audit sécurité laboratoire — produits chimiques (Interne). Constat : stockage conforme, FDS à jour pour 95 % des produits, 2 réactifs à reconditionner.',
          conforme: true
        }
      ]
    },
    {
      ref: 'AUD-2026-105',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      score: 79,
      status: 'Terminé',
      days: 110,
      checklist: [
        {
          point:
            'Audit procédures tir de mines et explosifs (Interne). Constat : procédure globalement respectée, périmètre de sécurité insuffisant sur 1 campagne, registre consommation explosifs à tenir à jour.',
          conforme: false
        }
      ]
    },
    {
      ref: 'AUD-2026-106',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      score: 71,
      status: 'Terminé',
      days: 130,
      checklist: [
        {
          point:
            'Audit conformité légale — cadre minier national pays hôte (Externe). Constat : 3 non-conformités réglementaires identifiées, plan d’actions correctives requis dans les 60 jours.',
          conforme: false
        }
      ]
    },
    {
      ref: 'AUD-2026-107',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      score: 68,
      status: 'Terminé',
      days: 155,
      checklist: [
        {
          point:
            'Audit système management SST — diagnostic initial (Externe). Constat : bases présentes, documentation insuffisante, formation encadrement à renforcer, indicateurs à formaliser.',
          conforme: false
        },
        ...riskChecklistEntries()
      ]
    },
    {
      ref: 'AUD-2026-108',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      score: 0,
      status: 'Planifié',
      days: -18,
      checklist: [
        {
          point:
            'Audit engins et circulation — préparation certification (Externe). Planifié — score et constats à renseigner après réalisation.',
          conforme: false
        }
      ]
    },
    {
      ref: 'AUD-2026-109',
      site: M,
      siteId: KATIOLA_MINE_YAKRO,
      score: 0,
      status: 'Planifié',
      days: -35,
      checklist: [
        {
          point:
            'Revue direction QHSE — bilan semestriel (Interne). Planifiée — synthèse à produire en séance.',
          conforme: false
        }
      ]
    },
    {
      ref: 'AUD-2026-110',
      site: E,
      siteId: KATIOLA_EXPLORATION_BON,
      score: 76,
      status: 'Terminé',
      days: 33,
      checklist: [
        {
          point:
            'Audit SST camp exploration Bondoukou — circulation engins, stockage carburant, plans évacuation. Constat : EPI forage conformes, registre visite médicale à compléter.',
          conforme: false
        }
      ]
    }
  ];

  for (const a of auditsData) {
    const createdAt = a.days < 0 ? daysFromNow(-a.days) : daysAgo(a.days);
    await prisma.audit.create({
      data: {
        tenantId: DEFAULT_TENANT_ID,
        ref: a.ref,
        site: a.site,
        siteId: a.siteId,
        score: a.score,
        status: a.status,
        checklist: a.checklist,
        createdAt
      }
    });
  }

  const auditByRef = async (ref) =>
    prisma.audit.findFirst({ where: { ref, tenantId: DEFAULT_TENANT_ID }, select: { id: true } });

  const ncRows = [
    {
      title: 'Registre expositions chimiques non tenu à jour',
      detail:
        'Référentiel : ISO 45001 — Article 10.2.\nCriticité : majeure.\nStatut métier : En cours.\nLié audit : AUD-2026-103 (ISO 14001 — déchets / effluents).',
      status: 'open',
      auditRef: 'AUD-2026-103',
      siteId: KATIOLA_USINE_ABJ
    },
    {
      title: 'Périmètre sécurité tirs non conforme distances réglementaires',
      detail:
        'Référentiel : code minier national — Article 87 (réf. démo).\nCriticité : majeure.\nStatut métier : En cours.',
      status: 'open',
      auditRef: 'AUD-2026-105',
      siteId: KATIOLA_MINE_YAKRO
    },
    {
      title: 'Formation PRAP non dispensée — 8 agents manutention',
      detail:
        'Référentiel : ISO 45001 — Article 7.2.\nCriticité : mineure.\nStatut métier : En cours.\nLié audit : AUD-2026-107 (SST).',
      status: 'open',
      auditRef: 'AUD-2026-107',
      siteId: KATIOLA_MINE_YAKRO
    },
    {
      title: 'Plan urgence cyanure non validé par autorité compétente',
      detail: 'Référentiel : réglementation nationale mines.\nCriticité : majeure.\nClôturé après validation obtenue.',
      status: 'Clôturé',
      auditRef: 'AUD-2026-104',
      siteId: KATIOLA_USINE_ABJ
    },
    {
      title: 'Absence affichage consignes sécurité atelier mécanique',
      detail: 'Référentiel : ISO 45001 — Article 7.4.\nCriticité : mineure.',
      status: 'Clôturé',
      auditRef: 'AUD-2026-107',
      siteId: KATIOLA_MINE_YAKRO
    },
    {
      title: 'Registre déchets dangereux incomplet — T3 2025',
      detail: 'Référentiel : ISO 14001 — Article 8.1.\nCriticité : mineure.',
      status: 'Clôturé',
      auditRef: 'AUD-2026-103',
      siteId: KATIOLA_MINE_YAKRO
    },
    {
      title: 'Registre visites médicales équipes forage exploration incomplet',
      detail:
        'Référentiel : ISO 45001 — Article 7.2.\nCriticité : mineure.\nStatut métier : En cours.\nLié audit : AUD-2026-110 (SST camp exploration).',
      status: 'open',
      auditRef: 'AUD-2026-110',
      siteId: KATIOLA_EXPLORATION_BON
    }
  ];

  for (const nc of ncRows) {
    const aud = await auditByRef(nc.auditRef);
    await prisma.nonConformity.create({
      data: {
        tenantId: DEFAULT_TENANT_ID,
        title: nc.title,
        detail: nc.detail,
        status: nc.status,
        auditRef: nc.auditRef,
        auditId: aud?.id ?? null,
        siteId: nc.siteId
      }
    });
  }

  const REF_CHUTE = 'INC-2026-004';
  const REF_CYANURE = 'INC-2026-003';
  const REF_QUASI_COLL = 'INC-2026-006';

  const actionsData = [
    {
      title: 'Installer garde-corps plateforme forage P3',
      detail: `[Priorité critique]\nLié incident : ${REF_CHUTE} (chute en hauteur).`,
      status: 'En retard — priorité critique',
      owner: extraction?.name ?? 'QHSE',
      assigneeId: extraction?.id,
      dueDate: daysAgo(12),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 20
    },
    {
      title: 'Former 100% conducteurs engins — conduite défensive session rattrapage',
      detail: '[Priorité haute]',
      status: 'En retard',
      owner: forage?.name ?? 'Forage',
      assigneeId: forage?.id,
      dueDate: daysAgo(8),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 25
    },
    {
      title: 'Remplacer vannes cyanure vétustes — lixiviation',
      detail: `[Priorité critique]\nLié incident : ${REF_CYANURE} (fuite dosage cyanure).`,
      status: 'En retard — priorité critique',
      owner: extraction?.name ?? 'QHSE',
      assigneeId: extraction?.id,
      dueDate: daysAgo(5),
      siteId: KATIOLA_USINE_ABJ,
      daysCreated: 55
    },
    {
      title: 'Réaliser audit sécurité complet zone explosifs',
      detail: '[Priorité haute]\nSuite campagne minage et investigation raté de tir.',
      status: 'En retard',
      owner: extraction?.name ?? 'QHSE',
      assigneeId: extraction?.id,
      dueDate: daysAgo(3),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 42
    },
    {
      title: 'Mettre à jour registre des expositions chimiques',
      detail: '[Priorité haute]\nAlignement NC registre expositions.',
      status: 'En retard',
      owner: extraction?.name ?? 'QHSE',
      assigneeId: extraction?.id,
      dueDate: daysAgo(7),
      siteId: KATIOLA_USINE_ABJ,
      daysCreated: 50
    },
    {
      title: 'Renouveler dotation EPI — 12 agents zone forage',
      detail: '[Priorité moyenne]',
      status: 'En retard',
      owner: concassage?.name ?? 'Assistant',
      assigneeId: concassage?.id,
      dueDate: daysAgo(10),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 30
    },
    {
      title: 'Corriger signalisation croisement zone chargement',
      detail: `[Priorité haute]\nLié incident : ${REF_QUASI_COLL} (quasi-collision VL / dumper).`,
      status: 'En retard',
      owner: concassage?.name ?? 'Assistant',
      assigneeId: concassage?.id,
      dueDate: daysAgo(4),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 9
    },
    {
      title: 'Compléter registre déchets dangereux T4 2025',
      detail: '[Priorité moyenne]\nSuite audit ISO 14001.',
      status: 'En retard',
      owner: extraction?.name ?? 'QHSE',
      assigneeId: extraction?.id,
      dueDate: daysAgo(2),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 78
    },
    {
      title: 'Installer système détection gaz H2S laboratoire',
      detail: '[Priorité haute]',
      status: 'En cours',
      owner: extraction?.name ?? 'QHSE',
      assigneeId: extraction?.id,
      dueDate: daysFromNow(15),
      siteId: KATIOLA_USINE_ABJ,
      daysCreated: 5
    },
    {
      title: 'Réviser plan urgence cyanure avec toutes les équipes',
      detail: '[Priorité haute]',
      status: 'En cours',
      owner: extraction?.name ?? 'QHSE',
      assigneeId: extraction?.id,
      dueDate: daysFromNow(21),
      siteId: KATIOLA_USINE_ABJ,
      daysCreated: 4
    },
    {
      title: 'Installer caméras surveillance aires de manœuvre',
      detail: '[Priorité moyenne]',
      status: 'En cours',
      owner: direction?.name ?? 'Direction Site',
      assigneeId: direction?.id,
      dueDate: daysFromNow(30),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 3
    },
    {
      title: 'Former 8 agents PRAP — manutention manuelle',
      detail: '[Priorité moyenne]',
      status: 'À lancer',
      owner: qhse?.name ?? 'Responsable QHSE',
      assigneeId: qhse?.id,
      dueDate: daysFromNow(18),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 2
    },
    {
      title: 'Contrôle géotechnique talus zone stérile nord',
      detail: '[Priorité haute]',
      status: 'En cours',
      owner: forage?.name ?? 'Forage',
      assigneeId: forage?.id,
      dueDate: daysFromNow(12),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 96
    },
    {
      title: 'Renouveler permis de travail espace confiné — 6 agents',
      detail: '[Priorité haute]',
      status: 'En cours',
      owner: extraction?.name ?? 'QHSE',
      assigneeId: extraction?.id,
      dueDate: daysFromNow(25),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 40
    },
    {
      title: 'Afficher consignes sécurité en français et en dioula',
      detail: '[Priorité moyenne]',
      status: 'À lancer',
      owner: assistant?.name ?? 'Assistant Qualité',
      assigneeId: assistant?.id,
      dueDate: daysFromNow(10),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 1
    },
    {
      title: 'Mettre à jour DUER — nouveaux postes forage',
      detail: '[Priorité haute]',
      status: 'En cours',
      owner: qhse?.name ?? 'Responsable QHSE',
      assigneeId: qhse?.id,
      dueDate: daysFromNow(35),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 8
    },
    {
      title: 'Vérifier état tuyauteries lixiviation — inspection visuelle',
      detail: '[Priorité haute]',
      status: 'En cours',
      owner: extraction?.name ?? 'QHSE',
      assigneeId: extraction?.id,
      dueDate: daysFromNow(8),
      siteId: KATIOLA_USINE_ABJ,
      daysCreated: 52
    },
    {
      title: 'Sensibilisation équipes — gestion déchets et tri sélectif',
      detail: '[Priorité faible]',
      status: 'À lancer',
      owner: forage?.name ?? 'Forage',
      assigneeId: forage?.id,
      dueDate: daysFromNow(20),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 59
    },
    {
      title: 'Tester kit anti-pollution — exercice simulation déversement',
      detail: '[Priorité haute]',
      status: 'À lancer',
      owner: extraction?.name ?? 'QHSE',
      assigneeId: extraction?.id,
      dueDate: daysFromNow(28),
      siteId: KATIOLA_USINE_ABJ,
      daysCreated: 6
    },
    {
      title: 'Contrôle annuel extincteurs — tous les sites',
      detail: '[Priorité moyenne]',
      status: 'En cours',
      owner: assistant?.name ?? 'Assistant Qualité',
      assigneeId: assistant?.id,
      dueDate: daysFromNow(40),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 10
    },
    {
      title: 'Mettre à jour liste EPI autorisés et fournisseurs',
      detail: '[Priorité faible]',
      status: 'À lancer',
      owner: qhse?.name ?? 'Responsable QHSE',
      assigneeId: qhse?.id,
      dueDate: daysFromNow(45),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 12
    },
    {
      title: 'Préparer dossier audit certification ISO 45001',
      detail: '[Priorité haute]',
      status: 'En cours',
      owner: qhse?.name ?? 'Responsable QHSE',
      assigneeId: qhse?.id,
      dueDate: daysFromNow(42),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 7
    },
    {
      title: 'Réparer vanne dosage cyanure — lixiviation',
      detail: '[Clôturée — succès]',
      status: 'Terminée',
      owner: extraction?.name ?? 'QHSE',
      assigneeId: extraction?.id,
      dueDate: daysAgo(45),
      siteId: KATIOLA_USINE_ABJ,
      daysCreated: 52
    },
    {
      title: 'Équiper plateforme forage P1 et P2 en garde-corps',
      detail: '[Clôturée — succès]',
      status: 'Terminée',
      owner: forage?.name ?? 'Forage',
      assigneeId: forage?.id,
      dueDate: daysAgo(62),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 80
    },
    {
      title: 'Session formation premiers secours — 15 agents',
      detail: '[Clôturée — succès]',
      status: 'Terminée',
      owner: qhse?.name ?? 'Responsable QHSE',
      assigneeId: qhse?.id,
      dueDate: daysAgo(70),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 75
    },
    {
      title: 'Installer tapis anti-dérapants vestiaires et accès',
      detail: '[Clôturée — succès]',
      status: 'Terminée',
      owner: concassage?.name ?? 'Assistant',
      assigneeId: concassage?.id,
      dueDate: daysAgo(28),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 33
    },
    {
      title: 'Remplacer câble électrique défectueux atelier mécanique',
      detail: '[Clôturée — succès]',
      status: 'Terminée',
      owner: concassage?.name ?? 'Assistant',
      assigneeId: concassage?.id,
      dueDate: daysAgo(80),
      siteId: KATIOLA_USINE_ABJ,
      daysCreated: 89
    },
    {
      title: 'Mise à jour procédure tir de mines — version 4',
      detail: '[Clôturée — succès]',
      status: 'Terminée',
      owner: qhse?.name ?? 'Responsable QHSE',
      assigneeId: qhse?.id,
      dueDate: daysAgo(95),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 112
    },
    {
      title: 'Contrôle et recharge extincteurs zone carburants',
      detail: '[Clôturée — succès]',
      status: 'Terminée',
      owner: assistant?.name ?? 'Assistant Qualité',
      assigneeId: assistant?.id,
      dueDate: daysAgo(110),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 115
    },
    {
      title: 'Formation conduite sécurisée — 8 conducteurs tombereau',
      detail: '[Clôturée — succès]',
      status: 'Terminée',
      owner: forage?.name ?? 'Forage',
      assigneeId: forage?.id,
      dueDate: daysAgo(120),
      siteId: KATIOLA_MINE_YAKRO,
      daysCreated: 125
    },
    {
      title: 'Compléter registre visites médicales — équipes exploration Bondoukou',
      detail: '[Priorité haute]\nSuite audit AUD-2026-110.',
      status: 'En retard',
      owner: qhse?.name ?? 'Responsable QHSE',
      assigneeId: qhse?.id,
      dueDate: daysAgo(6),
      siteId: KATIOLA_EXPLORATION_BON,
      daysCreated: 34
    },
    {
      title: 'Installer bâches étanches — aire stockage boues forage EX-BON',
      detail: '[Priorité haute]\nLié incident INC-2026-022.',
      status: 'En cours',
      owner: forage?.name ?? 'Forage',
      assigneeId: forage?.id,
      dueDate: daysFromNow(14),
      siteId: KATIOLA_EXPLORATION_BON,
      daysCreated: 27
    },
    {
      title: 'Révision plan circulation engins — camp exploration',
      detail: '[Priorité moyenne]',
      status: 'À lancer',
      owner: terrain?.name ?? 'Terrain',
      assigneeId: terrain?.id,
      dueDate: daysFromNow(22),
      siteId: KATIOLA_EXPLORATION_BON,
      daysCreated: 5
    }
  ];

  for (const act of actionsData) {
    await prisma.action.create({
      data: {
        tenantId: DEFAULT_TENANT_ID,
        title: act.title,
        detail: act.detail,
        status: act.status,
        owner: act.owner,
        assigneeId: act.assigneeId ?? undefined,
        dueDate: act.dueDate,
        siteId: act.siteId,
        createdAt: daysAgo(act.daysCreated)
      }
    });
  }

  const habilitationSeeds = [
    { user: adminUser, siteId: KATIOLA_MINE_YAKRO, type: 'Accès général', level: 'complet' },
    { user: qhse, siteId: KATIOLA_MINE_YAKRO, type: 'Coordination QHSE groupe', level: 'N3' },
    { user: direction, siteId: KATIOLA_MINE_YAKRO, type: 'Direction site extraction', level: null },
    { user: assistant, siteId: KATIOLA_USINE_ABJ, type: 'Qualité & documents usine', level: null },
    { user: terrain, siteId: KATIOLA_EXPLORATION_BON, type: 'Encadrement camp exploration', level: null },
    { user: extraction, siteId: KATIOLA_MINE_YAKRO, type: 'Extraction / engins', level: 'N2' },
    { user: forage, siteId: KATIOLA_EXPLORATION_BON, type: 'Forage exploration', level: 'N2' },
    { user: concassage, siteId: KATIOLA_USINE_ABJ, type: 'Concassage & maintenance usine', level: null }
  ];
  for (const h of habilitationSeeds) {
    if (!h.user?.id) continue;
    await prisma.habilitation.create({
      data: {
        tenantId: DEFAULT_TENANT_ID,
        userId: h.user.id,
        siteId: h.siteId,
        type: h.type,
        level: h.level,
        validFrom: daysAgo(400),
        validUntil: daysFromNow(500),
        status: 'active'
      }
    });
  }

  const jsonEmpty = [];
  const productsSeed = [
    {
      name: 'Gasoil — stock carburant engins mine',
      supplier: 'Total Énergies CI',
      casNumber: null,
      siteId: KATIOLA_MINE_YAKRO
    },
    {
      name: 'Lubrifiant hydraulique ISO VG 46',
      supplier: 'Shell',
      casNumber: null,
      siteId: KATIOLA_MINE_YAKRO
    },
    {
      name: 'Solution cyanure — lixiviation (usage encadré)',
      supplier: 'ProChem Afrique',
      casNumber: '143-33-9',
      siteId: KATIOLA_USINE_ABJ
    },
    {
      name: 'Acide chlorhydrique technique 32 %',
      supplier: 'LabSupply CI',
      casNumber: '7647-01-0',
      siteId: KATIOLA_USINE_ABJ
    },
    {
      name: 'Réactif analyse or — digestion',
      supplier: 'LabSupply CI',
      casNumber: null,
      siteId: KATIOLA_USINE_ABJ
    },
    {
      name: 'Gasoil — convois exploration',
      supplier: 'Total Énergies CI',
      casNumber: null,
      siteId: KATIOLA_EXPLORATION_BON
    }
  ];
  for (const p of productsSeed) {
    await prisma.product.create({
      data: {
        name: p.name,
        supplier: p.supplier,
        casNumber: p.casNumber,
        siteId: p.siteId,
        tenantId: DEFAULT_TENANT_ID,
        hStatements: jsonEmpty,
        pStatements: jsonEmpty,
        ghsPictograms: jsonEmpty
      }
    });
  }

  /** Pilotage des processus : cartographie démo (8 processus, gérée uniquement pour ce tenant). */
  await prisma.processLink.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } });
  await prisma.process.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } });

  const riskByRef = async (ref) =>
    prisma.risk.findFirst({ where: { ref, tenantId: DEFAULT_TENANT_ID }, select: { id: true } });

  const processesSeed = [
    {
      name: 'Management',
      type: 'management',
      purpose: 'Définir la politique QHSE, les objectifs et piloter la revue de direction.',
      ownerUserId: direction?.id ?? null,
      deputyUserId: adminUser?.id ?? null,
      inputs: ['Exigences réglementaires', 'Résultats des audits', 'Indicateurs QHSE'],
      outputs: ['Politique QHSE', 'Objectifs annuels', 'Décisions de revue de direction'],
      interestedParties: ['Direction', 'Actionnaires', 'Autorités'],
      status: 'conforme',
      reviewFrequency: 'Annuelle',
      nextReviewAt: daysFromNow(120),
      riskRefs: [],
      auditRefs: ['AUD-2026-101']
    },
    {
      name: 'Administratif',
      type: 'support',
      purpose: 'Gérer les ressources humaines, la documentation et les achats administratifs.',
      ownerUserId: assistant?.id ?? null,
      deputyUserId: null,
      inputs: ['Besoins en personnel', 'Demandes documentaires'],
      outputs: ['Contrats', 'Documents archivés'],
      interestedParties: ['Personnel', 'Direction'],
      status: 'a_surveiller',
      reviewFrequency: 'Semestrielle',
      nextReviewAt: daysFromNow(45),
      riskRefs: [],
      auditRefs: []
    },
    {
      name: 'Commercial',
      type: 'realisation',
      purpose: 'Gérer les relations clients, les contrats de vente et le suivi commercial.',
      ownerUserId: adminUser?.id ?? null,
      deputyUserId: null,
      inputs: ['Demandes clients', 'Conditions de marché'],
      outputs: ['Contrats commerciaux', 'Prévisions de vente'],
      interestedParties: ['Clients', 'Direction'],
      status: 'conforme',
      reviewFrequency: 'Annuelle',
      nextReviewAt: daysFromNow(200),
      riskRefs: [],
      auditRefs: []
    },
    {
      name: 'Logistique',
      type: 'realisation',
      purpose: 'Organiser les flux d’approvisionnement, le stockage et la distribution interne.',
      ownerUserId: terrain?.id ?? null,
      deputyUserId: extraction?.id ?? null,
      inputs: ['Plans d’approvisionnement', 'Niveaux de stock'],
      outputs: ['Stocks disponibles', 'Plans de livraison'],
      interestedParties: ['Production', 'Transport', 'Fournisseurs'],
      status: 'a_surveiller',
      reviewFrequency: 'Trimestrielle',
      nextReviewAt: daysAgo(10),
      riskRefs: ['RSK-2026-03'],
      auditRefs: []
    },
    {
      name: 'Transport',
      type: 'realisation',
      purpose: 'Assurer le transport des minerais et du personnel en sécurité.',
      ownerUserId: extraction?.id ?? null,
      deputyUserId: forage?.id ?? null,
      inputs: ['Plans de transport', 'État des engins'],
      outputs: ['Minerai acheminé', 'Registre des trajets'],
      interestedParties: ['Production', 'Sécurité'],
      status: 'critique',
      reviewFrequency: 'Mensuelle',
      nextReviewAt: daysAgo(30),
      riskRefs: ['RSK-2026-01', 'RSK-2026-04'],
      auditRefs: ['AUD-2026-107']
    },
    {
      name: 'Conditionnement',
      type: 'realisation',
      purpose: 'Conditionner et préparer le produit avant expédition.',
      ownerUserId: concassage?.id ?? null,
      deputyUserId: null,
      inputs: ['Produit traité', 'Spécifications client'],
      outputs: ['Produit conditionné', 'Bons d’expédition'],
      interestedParties: ['Production', 'Clients'],
      status: 'conforme',
      reviewFrequency: 'Trimestrielle',
      nextReviewAt: daysFromNow(80),
      riskRefs: [],
      auditRefs: []
    },
    {
      name: 'Maintenance',
      type: 'support',
      purpose: 'Assurer la disponibilité et la fiabilité des équipements et installations.',
      ownerUserId: forage?.id ?? null,
      deputyUserId: concassage?.id ?? null,
      inputs: ['Plans de maintenance préventive', 'Signalements de pannes'],
      outputs: ['Équipements opérationnels', 'Historique d’interventions'],
      interestedParties: ['Production', 'Sécurité'],
      status: 'a_surveiller',
      reviewFrequency: 'Mensuelle',
      nextReviewAt: daysFromNow(15),
      riskRefs: ['RSK-2026-02'],
      auditRefs: []
    },
    {
      name: 'Énergie',
      type: 'support',
      purpose: 'Gérer l’approvisionnement et l’optimisation de la consommation énergétique des sites.',
      ownerUserId: adminUser?.id ?? null,
      deputyUserId: qhse?.id ?? null,
      inputs: ['Contrats énergie', 'Relevés de consommation'],
      outputs: ['Bilan énergétique', 'Plan d’optimisation'],
      interestedParties: ['Direction', 'Production'],
      status: 'a_surveiller',
      reviewFrequency: 'Annuelle',
      nextReviewAt: daysFromNow(150),
      riskRefs: [],
      auditRefs: []
    }
  ];

  for (const p of processesSeed) {
    const created = await prisma.process.create({
      data: {
        tenantId: DEFAULT_TENANT_ID,
        name: p.name,
        type: p.type,
        purpose: p.purpose,
        ownerUserId: p.ownerUserId,
        deputyUserId: p.deputyUserId,
        inputs: p.inputs,
        outputs: p.outputs,
        interestedParties: p.interestedParties,
        status: p.status,
        reviewFrequency: p.reviewFrequency,
        nextReviewAt: p.nextReviewAt
      }
    });

    for (const ref of p.riskRefs) {
      const risk = await riskByRef(ref);
      if (risk) {
        await prisma.processLink.create({
          data: { tenantId: DEFAULT_TENANT_ID, processId: created.id, linkedType: 'risk', linkedId: risk.id, role: 'main' }
        });
      }
    }
    for (const ref of p.auditRefs) {
      const audit = await auditByRef(ref);
      if (audit) {
        await prisma.processLink.create({
          data: { tenantId: DEFAULT_TENANT_ID, processId: created.id, linkedType: 'audit', linkedId: audit.id, role: 'main' }
        });
      }
    }
  }

  /** Équipements / EPI — registre démo (contrôles passés et à venir pour illustrer les alertes). */
  await prisma.equipment.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } });
  const equipmentSeeds = [
    {
      name: 'Harnais antichute HA-12',
      category: 'EPI travail en hauteur',
      serialNumber: 'EPI-HA-0012',
      siteId: KATIOLA_MINE_YAKRO,
      assignedUserId: extraction?.id ?? null,
      lastControlDate: daysAgo(180),
      nextControlDate: daysFromNow(15)
    },
    {
      name: 'Détecteur de gaz portable DG-04',
      category: 'Détection',
      serialNumber: 'EPI-DG-0004',
      siteId: KATIOLA_USINE_ABJ,
      assignedUserId: concassage?.id ?? null,
      lastControlDate: daysAgo(150),
      nextControlDate: daysFromNow(5)
    },
    {
      name: 'Casque de chantier C-118',
      category: 'EPI protection tête',
      serialNumber: 'EPI-CQ-0118',
      siteId: KATIOLA_EXPLORATION_BON,
      assignedUserId: forage?.id ?? null,
      lastControlDate: daysAgo(90),
      nextControlDate: daysFromNow(90)
    },
    {
      name: 'Extincteur CO2 9kg EX-07',
      category: 'Incendie',
      serialNumber: 'EPI-EX-0007',
      siteId: KATIOLA_USINE_ABJ,
      assignedUserId: null,
      lastControlDate: daysAgo(370),
      nextControlDate: daysAgo(5),
      status: 'out_of_service'
    },
    {
      name: 'Masque respiratoire complet MR-21',
      category: 'EPI respiratoire',
      serialNumber: 'EPI-MR-0021',
      siteId: KATIOLA_MINE_YAKRO,
      assignedUserId: extraction?.id ?? null,
      lastControlDate: daysAgo(60),
      nextControlDate: daysFromNow(300)
    },
    {
      name: 'Treuil de levage TL-03',
      category: 'Levage',
      serialNumber: 'EQP-TL-0003',
      siteId: KATIOLA_MINE_YAKRO,
      assignedUserId: null,
      lastControlDate: daysAgo(200),
      nextControlDate: daysFromNow(20),
      status: 'in_repair'
    }
  ];
  for (const e of equipmentSeeds) {
    await prisma.equipment.create({
      data: {
        tenantId: DEFAULT_TENANT_ID,
        siteId: e.siteId,
        assignedUserId: e.assignedUserId,
        name: e.name,
        category: e.category,
        serialNumber: e.serialNumber,
        status: e.status ?? 'in_service',
        lastControlDate: e.lastControlDate,
        nextControlDate: e.nextControlDate
      }
    });
  }

  /** Suivi environnemental — relevés démo répartis par type pour illustrer la synthèse. */
  await prisma.environmentalRecord.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } });
  const environmentalSeeds = [
    { type: 'waste', category: 'Déchets dangereux', quantity: 1240, unit: 'kg', periodDate: daysAgo(25), siteId: KATIOLA_MINE_YAKRO },
    { type: 'waste', category: 'Déchets banals', quantity: 860, unit: 'kg', periodDate: daysAgo(25), siteId: KATIOLA_USINE_ABJ },
    { type: 'water', category: 'Eau process', quantity: 320, unit: 'm3', periodDate: daysAgo(20), siteId: KATIOLA_USINE_ABJ },
    { type: 'water', category: 'Eau potable camp', quantity: 45, unit: 'm3', periodDate: daysAgo(18), siteId: KATIOLA_EXPLORATION_BON },
    { type: 'energy', category: 'Électricité réseau', quantity: 18500, unit: 'kWh', periodDate: daysAgo(10), siteId: KATIOLA_USINE_ABJ },
    { type: 'energy', category: 'Gasoil groupes électrogènes', quantity: 2100, unit: 'L', periodDate: daysAgo(10), siteId: KATIOLA_MINE_YAKRO },
    { type: 'water', category: 'Eau process', quantity: 298, unit: 'm3', periodDate: daysAgo(50), siteId: KATIOLA_USINE_ABJ }
  ];
  for (const r of environmentalSeeds) {
    await prisma.environmentalRecord.create({
      data: {
        tenantId: DEFAULT_TENANT_ID,
        siteId: r.siteId,
        type: r.type,
        category: r.category,
        quantity: r.quantity,
        unit: r.unit,
        periodDate: r.periodDate
      }
    });
  }

  /** Presque-accidents / retours d'expérience — registre démo, statuts variés. */
  await prisma.nearMiss.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } });
  const nearMissSeeds = [
    {
      title: 'Chute de pierre évitée en zone de forage',
      category: 'Chute d’objet',
      occurredAt: daysAgo(40),
      location: 'Front de forage Yakouro',
      siteId: KATIOLA_MINE_YAKRO,
      immediateActions: 'Périmètre balisé, accès suspendu 2h',
      lessonsLearned: 'Renforcer le contrôle des purges de paroi avant chaque poste',
      status: 'closed'
    },
    {
      title: 'Glissade sur sol humide atelier lixiviation',
      category: 'Glissade / chute de plain-pied',
      occurredAt: daysAgo(22),
      location: 'Atelier lixiviation — Usine Abidjan',
      siteId: KATIOLA_USINE_ABJ,
      immediateActions: 'Nettoyage immédiat, signalisation sol mouillé posée',
      lessonsLearned: 'Étudier un revêtement antidérapant pour la zone',
      status: 'under_review'
    },
    {
      title: 'Quasi-collision engin / piéton zone de circulation',
      category: 'Circulation engins',
      occurredAt: daysAgo(12),
      location: 'Piste principale — Mine Yakouro',
      siteId: KATIOLA_MINE_YAKRO,
      immediateActions: 'Rappel consignes de circulation à l’équipe',
      lessonsLearned: null,
      status: 'open'
    },
    {
      title: 'Détecteur de gaz déclenché sans exposition confirmée',
      category: 'Détection / atmosphère',
      occurredAt: daysAgo(8),
      location: 'Bassin de stockage — Usine Abidjan',
      siteId: KATIOLA_USINE_ABJ,
      immediateActions: 'Évacuation zone, contrôle capteur',
      lessonsLearned: null,
      status: 'open'
    },
    {
      title: 'Câble de levage usé repéré avant rupture',
      category: 'Levage',
      occurredAt: daysAgo(55),
      location: 'Mine Yakouro',
      siteId: KATIOLA_MINE_YAKRO,
      immediateActions: 'Câble remplacé, équipement consigné',
      lessonsLearned: 'Réduire l’intervalle de contrôle visuel des câbles de levage',
      status: 'closed'
    },
    {
      title: 'Tente de camp instable lors d’un coup de vent',
      category: 'Conditions climatiques',
      occurredAt: daysAgo(5),
      location: 'Camp exploration Bondoukou',
      siteId: KATIOLA_EXPLORATION_BON,
      immediateActions: 'Renfort des ancrages réalisé',
      lessonsLearned: null,
      status: 'under_review'
    }
  ];
  for (const n of nearMissSeeds) {
    await prisma.nearMiss.create({
      data: {
        tenantId: DEFAULT_TENANT_ID,
        siteId: n.siteId,
        title: n.title,
        category: n.category,
        occurredAt: n.occurredAt,
        location: n.location,
        immediateActions: n.immediateActions,
        lessonsLearned: n.lessonsLearned,
        status: n.status
      }
    });
  }

  console.log(
    '[seed] 3 sites (KATIOLA_MINE_YAKRO, KATIOLA_USINE_ABJ, KATIOLA_EXPLORATION_BON), 8 utilisateurs, 23 incidents, 11 risques, 33 actions, 10 audits, 7 NC, 8 habilitations, 6 produits, 8 processus, 6 équipements, 7 relevés environnementaux, 6 presque-accidents.'
  );
  console.log(
    '[seed] Données rattachées au tenant par défaut (qhse_default_tenant).'
  );
  console.log('[seed] Mot de passe démo (tous les comptes) :', DEMO_PASSWORD);
  console.log('[seed] Commande : npm run db:seed (dans backend/)');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
