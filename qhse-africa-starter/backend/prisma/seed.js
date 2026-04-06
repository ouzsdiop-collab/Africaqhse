import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Mot de passe démo (tous les comptes seed) — à changer en production. */
const DEMO_PASSWORD = 'Demo2026!';

const MS_DAY = 24 * 60 * 60 * 1000;

/** Dates dynamiques depuis l’exécution du seed (spec utilisateur). */
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
 * Pas de modèle Risk dans schema.prisma : les 12 risques sont sérialisés en checklist
 * (champs point + conforme) sur l’audit SST AUD-2026-107 — voir commentaire en fin de seed.
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

  const existingUsers = [
    { name: 'Admin Système', email: 'admin@qhse.local', role: 'ADMIN' },
    { name: 'Responsable QHSE', email: 'qhse@qhse.local', role: 'QHSE' },
    { name: 'Direction Site', email: 'direction@qhse.local', role: 'DIRECTION' },
    { name: 'Assistant Qualité', email: 'assistant@qhse.local', role: 'ASSISTANT' },
    { name: 'Chef de chantier', email: 'terrain@qhse.local', role: 'TERRAIN' }
  ];

  const extraDemoUsers = [
    { name: 'Konan Adjoua', email: 'hse@demo.local', role: 'HSE_MANAGER' },
    { name: 'Traoré Bakary', email: 'site@demo.local', role: 'SITE_MANAGER' },
    { name: 'Bamba Koffi', email: 'ops@demo.local', role: 'OPERATOR' }
  ];

  const allUsers = [...existingUsers, ...extraDemoUsers];

  for (const u of allUsers) {
    const email = u.email.toLowerCase();
    await prisma.user.upsert({
      where: { email },
      create: {
        name: u.name,
        email,
        role: u.role,
        passwordHash
      },
      update: {
        name: u.name,
        role: u.role,
        passwordHash
      }
    });
  }

  await prisma.action.deleteMany({});
  await prisma.nonConformity.deleteMany({});
  await prisma.audit.deleteMany({});
  await prisma.incident.deleteMany({});
  await prisma.user.updateMany({ data: { defaultSiteId: null } });
  await prisma.site.deleteMany({});

  const siteMine = await prisma.site.create({
    data: {
      name: 'Site minier — Zone Nord',
      code: 'MINE-N01',
      address: "Front d'exploitation aurifère — forage et extraction"
    }
  });
  const siteLab = await prisma.site.create({
    data: {
      name: 'Laboratoire & traitement — Siège',
      code: 'LAB-S01',
      address: 'Traitement des échantillons et analyses minérales'
    }
  });

  await prisma.user.updateMany({
    where: { email: 'terrain@qhse.local' },
    data: { defaultSiteId: siteMine.id }
  });
  await prisma.user.updateMany({
    where: { email: 'hse@demo.local' },
    data: { defaultSiteId: siteLab.id }
  });
  await prisma.user.updateMany({
    where: { email: 'site@demo.local' },
    data: { defaultSiteId: siteMine.id }
  });
  await prisma.user.updateMany({
    where: { email: 'ops@demo.local' },
    data: { defaultSiteId: siteMine.id }
  });

  const konan = await prisma.user.findUnique({ where: { email: 'hse@demo.local' } });
  const traore = await prisma.user.findUnique({ where: { email: 'site@demo.local' } });
  const bamba = await prisma.user.findUnique({ where: { email: 'ops@demo.local' } });
  const qhse = await prisma.user.findUnique({ where: { email: 'qhse@qhse.local' } });
  const direction = await prisma.user.findUnique({ where: { email: 'direction@qhse.local' } });
  const assistant = await prisma.user.findUnique({ where: { email: 'assistant@qhse.local' } });

  const M = 'MINE-N01';
  const L = 'LAB-S01';

  const incidentsData = [
    {
      ref: 'INC-2026-001',
      type: 'Engin / circulation',
      site: M,
      siteId: siteMine.id,
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
      siteId: siteMine.id,
      severity: 'critique',
      status: 'En cours',
      days: 35,
      description:
        'Projection de fragments rocheux hors périmètre sécurisé après tir de mines. Deux agents légèrement blessés. Périmètre de sécurité évalué comme insuffisant.'
    },
    {
      ref: 'INC-2026-003',
      type: 'Environnement',
      site: L,
      siteId: siteLab.id,
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
      siteId: siteMine.id,
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
      siteId: siteMine.id,
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
      siteId: siteMine.id,
      severity: 'moyen',
      status: 'Nouveau',
      days: 8,
      description:
        'Quasi-collision entre véhicule léger et dumper au carrefour de la zone de chargement. Absence de signalisation au croisement.'
    },
    {
      ref: 'INC-2026-007',
      type: 'Accident',
      site: M,
      siteId: siteMine.id,
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
      siteId: siteMine.id,
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
      siteId: siteMine.id,
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
      siteId: siteMine.id,
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
      siteId: siteMine.id,
      severity: 'moyen',
      status: 'Clôturé',
      days: 63,
      description:
        "Contamination légère d'une rigole de drainage par eaux de procédé. Détectée lors d'une ronde environnementale. Obturation et neutralisation effectuées."
    },
    {
      ref: 'INC-2026-012',
      type: 'Accident',
      site: L,
      siteId: siteLab.id,
      severity: 'moyen',
      status: 'Clôturé',
      days: 71,
      description:
        "Accident de trajet impliquant un véhicule de liaison. Accrochage avec un engin de chantier à l'entrée du site. Dégâts matériels uniquement."
    },
    {
      ref: 'INC-2026-013',
      type: 'Quasi-accident',
      site: L,
      siteId: siteLab.id,
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
      siteId: siteMine.id,
      severity: 'moyen',
      status: 'Clôturé',
      days: 95,
      description:
        'Glissement de terrain mineur sur le talus de la zone à stériles après fortes pluies. Aucun blessé. Géotechnicien mandaté pour contrôle de stabilité.'
    },
    {
      ref: 'INC-2026-015',
      type: 'Accident',
      site: M,
      siteId: siteMine.id,
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
      siteId: siteMine.id,
      severity: 'faible',
      status: 'Clôturé',
      days: 32,
      description:
        "Glissade d'un agent sur sol boueux à l'entrée du vestiaire. Légère contusion. Tapis anti-dérapants installés."
    },
    {
      ref: 'INC-2026-017',
      type: 'Autre',
      site: L,
      siteId: siteLab.id,
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
      siteId: siteMine.id,
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
      siteId: siteMine.id,
      severity: 'faible',
      status: 'Clôturé',
      days: 75,
      description:
        "Départ en roue libre d'un véhicule non calé sur pente. Arrêté par butte. Aucun dommage."
    },
    {
      ref: 'INC-2026-020',
      type: 'Autre',
      site: L,
      siteId: siteLab.id,
      severity: 'faible',
      status: 'En cours',
      days: 90,
      description:
        "Réactif chimique stocké hors zone réglementaire. Détecté lors d'audit interne. Remise en conformité planifiée."
    },
    {
      ref: 'INC-2026-021',
      type: 'Quasi-accident',
      site: M,
      siteId: siteMine.id,
      severity: 'faible',
      status: 'Clôturé',
      days: 130,
      description:
        'Alerte fumée déclenchée par poussière de minerai dans la salle de contrôle. Fausse alarme confirmée.'
    },
    {
      ref: 'INC-2026-022',
      type: 'Environnement',
      site: M,
      siteId: siteMine.id,
      severity: 'faible',
      status: 'Clôturé',
      days: 155,
      description:
        "Fuite mineure d'huile de transmission sur engin en stationnement. Détectée lors de la ronde quotidienne. Réparée sous 24 h."
    }
  ];

  for (const inc of incidentsData) {
    await prisma.incident.create({
      data: {
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
      siteId: siteMine.id,
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
      siteId: siteMine.id,
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
      siteId: siteMine.id,
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
      site: L,
      siteId: siteLab.id,
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
      siteId: siteMine.id,
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
      siteId: siteMine.id,
      score: 71,
      status: 'Terminé',
      days: 130,
      checklist: [
        {
          point:
            'Audit conformité légale — cadre minier national pays hôte (Externe). Constat : 3 non-conformités réglementaires identifiées, plan d’actions correctives requis dans les 60 jours. (Intitulé adapté : pas de référence pays dans le libellé démo.)',
          conforme: false
        }
      ]
    },
    {
      ref: 'AUD-2026-107',
      site: M,
      siteId: siteMine.id,
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
      siteId: siteMine.id,
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
      siteId: siteMine.id,
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
    }
  ];

  for (const a of auditsData) {
    const createdAt = a.days < 0 ? daysFromNow(-a.days) : daysAgo(a.days);
    await prisma.audit.create({
      data: {
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

  const ncRows = [
    {
      title: 'Registre expositions chimiques non tenu à jour',
      detail:
        'Référentiel : ISO 45001 — Article 10.2.\nCriticité : majeure.\nStatut métier : En cours.\nLié audit : AUD-2026-103 (ISO 14001 — déchets / effluents).',
      status: 'open',
      auditRef: 'AUD-2026-103',
      siteId: siteLab.id
    },
    {
      title: 'Périmètre sécurité tirs non conforme distances réglementaires',
      detail:
        'Référentiel : code minier national — Article 87 (réf. démo, sans juridiction nommée).\nCriticité : majeure.\nStatut métier : En cours.',
      status: 'open',
      auditRef: 'AUD-2026-105',
      siteId: siteMine.id
    },
    {
      title: 'Formation PRAP non dispensée — 8 agents manutention',
      detail:
        'Référentiel : ISO 45001 — Article 7.2.\nCriticité : mineure.\nStatut métier : En cours.\nLié audit : AUD-2026-107 (SST).',
      status: 'open',
      auditRef: 'AUD-2026-107',
      siteId: siteMine.id
    },
    {
      title: 'Plan urgence cyanure non validé par autorité compétente',
      detail: 'Référentiel : réglementation nationale mines.\nCriticité : majeure.\nClôturé après validation obtenue.',
      status: 'Clôturé',
      auditRef: 'AUD-2026-104',
      siteId: siteLab.id
    },
    {
      title: 'Absence affichage consignes sécurité atelier mécanique',
      detail: 'Référentiel : ISO 45001 — Article 7.4.\nCriticité : mineure.',
      status: 'Clôturé',
      auditRef: 'AUD-2026-107',
      siteId: siteMine.id
    },
    {
      title: 'Registre déchets dangereux incomplet — T3 2025',
      detail: 'Référentiel : ISO 14001 — Article 8.1.\nCriticité : mineure.',
      status: 'Clôturé',
      auditRef: 'AUD-2026-103',
      siteId: siteMine.id
    }
  ];

  for (const nc of ncRows) {
    await prisma.nonConformity.create({ data: nc });
  }

  const REF_CHUTE = 'INC-2026-004';
  const REF_CYANURE = 'INC-2026-003';
  const REF_QUASI_COLL = 'INC-2026-006';

  const actionsData = [
    {
      title: 'Installer garde-corps plateforme forage P3',
      detail: `[Priorité critique]\nLié incident : ${REF_CHUTE} (chute en hauteur).`,
      status: 'En retard — priorité critique',
      owner: konan?.name ?? 'Konan Adjoua',
      assigneeId: konan?.id,
      dueDate: daysAgo(12),
      siteId: siteMine.id,
      daysCreated: 20
    },
    {
      title: 'Former 100% conducteurs engins — conduite défensive session rattrapage',
      detail: '[Priorité haute]',
      status: 'En retard',
      owner: traore?.name ?? 'Traoré Bakary',
      assigneeId: traore?.id,
      dueDate: daysAgo(8),
      siteId: siteMine.id,
      daysCreated: 25
    },
    {
      title: 'Remplacer vannes cyanure vétustes — lixiviation',
      detail: `[Priorité critique]\nLié incident : ${REF_CYANURE} (fuite dosage cyanure).`,
      status: 'En retard — priorité critique',
      owner: konan?.name ?? 'Konan Adjoua',
      assigneeId: konan?.id,
      dueDate: daysAgo(5),
      siteId: siteLab.id,
      daysCreated: 55
    },
    {
      title: 'Réaliser audit sécurité complet zone explosifs',
      detail: '[Priorité haute]\nSuite campagne minage et investigation raté de tir.',
      status: 'En retard',
      owner: konan?.name ?? 'Konan Adjoua',
      assigneeId: konan?.id,
      dueDate: daysAgo(3),
      siteId: siteMine.id,
      daysCreated: 42
    },
    {
      title: 'Mettre à jour registre des expositions chimiques',
      detail: '[Priorité haute]\nAlignement NC registre expositions.',
      status: 'En retard',
      owner: konan?.name ?? 'Konan Adjoua',
      assigneeId: konan?.id,
      dueDate: daysAgo(7),
      siteId: siteLab.id,
      daysCreated: 50
    },
    {
      title: 'Renouveler dotation EPI — 12 agents zone forage',
      detail: '[Priorité moyenne]',
      status: 'En retard',
      owner: bamba?.name ?? 'Bamba Koffi',
      assigneeId: bamba?.id,
      dueDate: daysAgo(10),
      siteId: siteMine.id,
      daysCreated: 30
    },
    {
      title: 'Corriger signalisation croisement zone chargement',
      detail: `[Priorité haute]\nLié incident : ${REF_QUASI_COLL} (quasi-collision VL / dumper).`,
      status: 'En retard',
      owner: bamba?.name ?? 'Bamba Koffi',
      assigneeId: bamba?.id,
      dueDate: daysAgo(4),
      siteId: siteMine.id,
      daysCreated: 9
    },
    {
      title: 'Compléter registre déchets dangereux T4 2025',
      detail: '[Priorité moyenne]\nSuite audit ISO 14001.',
      status: 'En retard',
      owner: konan?.name ?? 'Konan Adjoua',
      assigneeId: konan?.id,
      dueDate: daysAgo(2),
      siteId: siteMine.id,
      daysCreated: 78
    },
    {
      title: 'Installer système détection gaz H2S laboratoire',
      detail: '[Priorité haute]',
      status: 'En cours',
      owner: konan?.name ?? 'Konan Adjoua',
      assigneeId: konan?.id,
      dueDate: daysFromNow(15),
      siteId: siteLab.id,
      daysCreated: 5
    },
    {
      title: 'Réviser plan urgence cyanure avec toutes les équipes',
      detail: '[Priorité haute]',
      status: 'En cours',
      owner: konan?.name ?? 'Konan Adjoua',
      assigneeId: konan?.id,
      dueDate: daysFromNow(21),
      siteId: siteLab.id,
      daysCreated: 4
    },
    {
      title: 'Installer caméras surveillance aires de manœuvre',
      detail: '[Priorité moyenne]',
      status: 'En cours',
      owner: direction?.name ?? 'Direction Site',
      assigneeId: direction?.id,
      dueDate: daysFromNow(30),
      siteId: siteMine.id,
      daysCreated: 3
    },
    {
      title: 'Former 8 agents PRAP — manutention manuelle',
      detail: '[Priorité moyenne]',
      status: 'À lancer',
      owner: qhse?.name ?? 'Responsable QHSE',
      assigneeId: qhse?.id,
      dueDate: daysFromNow(18),
      siteId: siteMine.id,
      daysCreated: 2
    },
    {
      title: 'Contrôle géotechnique talus zone stérile nord',
      detail: '[Priorité haute]',
      status: 'En cours',
      owner: traore?.name ?? 'Traoré Bakary',
      assigneeId: traore?.id,
      dueDate: daysFromNow(12),
      siteId: siteMine.id,
      daysCreated: 96
    },
    {
      title: 'Renouveler permis de travail espace confiné — 6 agents',
      detail: '[Priorité haute]',
      status: 'En cours',
      owner: konan?.name ?? 'Konan Adjoua',
      assigneeId: konan?.id,
      dueDate: daysFromNow(25),
      siteId: siteMine.id,
      daysCreated: 40
    },
    {
      title: 'Afficher consignes sécurité en français et en dioula',
      detail: '[Priorité moyenne]',
      status: 'À lancer',
      owner: assistant?.name ?? 'Assistant Qualité',
      assigneeId: assistant?.id,
      dueDate: daysFromNow(10),
      siteId: siteMine.id,
      daysCreated: 1
    },
    {
      title: 'Mettre à jour DUER — nouveaux postes forage',
      detail: '[Priorité haute]',
      status: 'En cours',
      owner: qhse?.name ?? 'Responsable QHSE',
      assigneeId: qhse?.id,
      dueDate: daysFromNow(35),
      siteId: siteMine.id,
      daysCreated: 8
    },
    {
      title: 'Vérifier état tuyauteries lixiviation — inspection visuelle',
      detail: '[Priorité haute]',
      status: 'En cours',
      owner: konan?.name ?? 'Konan Adjoua',
      assigneeId: konan?.id,
      dueDate: daysFromNow(8),
      siteId: siteLab.id,
      daysCreated: 52
    },
    {
      title: 'Sensibilisation équipes — gestion déchets et tri sélectif',
      detail: '[Priorité faible]',
      status: 'À lancer',
      owner: traore?.name ?? 'Traoré Bakary',
      assigneeId: traore?.id,
      dueDate: daysFromNow(20),
      siteId: siteMine.id,
      daysCreated: 59
    },
    {
      title: 'Tester kit anti-pollution — exercice simulation déversement',
      detail: '[Priorité haute]',
      status: 'À lancer',
      owner: konan?.name ?? 'Konan Adjoua',
      assigneeId: konan?.id,
      dueDate: daysFromNow(28),
      siteId: siteLab.id,
      daysCreated: 6
    },
    {
      title: 'Contrôle annuel extincteurs — tous les sites',
      detail: '[Priorité moyenne]',
      status: 'En cours',
      owner: assistant?.name ?? 'Assistant Qualité',
      assigneeId: assistant?.id,
      dueDate: daysFromNow(40),
      siteId: siteMine.id,
      daysCreated: 10
    },
    {
      title: 'Mettre à jour liste EPI autorisés et fournisseurs',
      detail: '[Priorité faible]',
      status: 'À lancer',
      owner: qhse?.name ?? 'Responsable QHSE',
      assigneeId: qhse?.id,
      dueDate: daysFromNow(45),
      siteId: siteMine.id,
      daysCreated: 12
    },
    {
      title: 'Préparer dossier audit certification ISO 45001',
      detail: '[Priorité haute]',
      status: 'En cours',
      owner: qhse?.name ?? 'Responsable QHSE',
      assigneeId: qhse?.id,
      dueDate: daysFromNow(42),
      siteId: siteMine.id,
      daysCreated: 7
    },
    {
      title: 'Réparer vanne dosage cyanure — lixiviation',
      detail: '[Clôturée — succès]',
      status: 'Terminée',
      owner: konan?.name ?? 'Konan Adjoua',
      assigneeId: konan?.id,
      dueDate: daysAgo(45),
      siteId: siteLab.id,
      daysCreated: 52
    },
    {
      title: 'Équiper plateforme forage P1 et P2 en garde-corps',
      detail: '[Clôturée — succès]',
      status: 'Terminée',
      owner: traore?.name ?? 'Traoré Bakary',
      assigneeId: traore?.id,
      dueDate: daysAgo(62),
      siteId: siteMine.id,
      daysCreated: 80
    },
    {
      title: 'Session formation premiers secours — 15 agents',
      detail: '[Clôturée — succès]',
      status: 'Terminée',
      owner: qhse?.name ?? 'Responsable QHSE',
      assigneeId: qhse?.id,
      dueDate: daysAgo(70),
      siteId: siteMine.id,
      daysCreated: 75
    },
    {
      title: 'Installer tapis anti-dérapants vestiaires et accès',
      detail: '[Clôturée — succès]',
      status: 'Terminée',
      owner: bamba?.name ?? 'Bamba Koffi',
      assigneeId: bamba?.id,
      dueDate: daysAgo(28),
      siteId: siteMine.id,
      daysCreated: 33
    },
    {
      title: 'Remplacer câble électrique défectueux atelier mécanique',
      detail: '[Clôturée — succès]',
      status: 'Terminée',
      owner: bamba?.name ?? 'Bamba Koffi',
      assigneeId: bamba?.id,
      dueDate: daysAgo(80),
      siteId: siteLab.id,
      daysCreated: 89
    },
    {
      title: 'Mise à jour procédure tir de mines — version 4',
      detail: '[Clôturée — succès]',
      status: 'Terminée',
      owner: qhse?.name ?? 'Responsable QHSE',
      assigneeId: qhse?.id,
      dueDate: daysAgo(95),
      siteId: siteMine.id,
      daysCreated: 112
    },
    {
      title: 'Contrôle et recharge extincteurs zone carburants',
      detail: '[Clôturée — succès]',
      status: 'Terminée',
      owner: assistant?.name ?? 'Assistant Qualité',
      assigneeId: assistant?.id,
      dueDate: daysAgo(110),
      siteId: siteMine.id,
      daysCreated: 115
    },
    {
      title: 'Formation conduite sécurisée — 8 conducteurs tombereau',
      detail: '[Clôturée — succès]',
      status: 'Terminée',
      owner: traore?.name ?? 'Traoré Bakary',
      assigneeId: traore?.id,
      dueDate: daysAgo(120),
      siteId: siteMine.id,
      daysCreated: 125
    }
  ];

  for (const act of actionsData) {
    await prisma.action.create({
      data: {
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

  console.log(
    '[seed] 2 sites, 8 users, 22 incidents, 12 risques (checklist audit AUD-2026-107), 30 actions, 9 audits, 6 NC créés — seed prêt à exécuter.'
  );
  console.log(
    '[seed] Adaptations : pas de champ description sur Site → texte métier dans address ; pas de linkedIncidentId → lien par ref dans Action.detail ; score audits planifiés = 0 (Int requis) ; NC ouvertes : statut Prisma « open » + détail « En cours » (notifications).'
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
