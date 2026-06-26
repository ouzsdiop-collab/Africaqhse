import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../public/guide-utilisateur-africaqhse.pdf');
const BLUE = '#3b82f6';
const DARK = '#1e293b';
const GREY = '#64748b';
const LIGHT = '#f8fafc';

const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
doc.pipe(fs.createWriteStream(OUT));

function header(text) {
  doc.addPage();
  doc.rect(0, 0, doc.page.width, 6).fill(BLUE);
  doc.moveDown(0.5);
  doc.fontSize(18).font('Helvetica-Bold').fillColor(BLUE).text(text, 50, 70);
  doc.moveTo(50, 95).lineTo(545, 95).lineWidth(1).stroke(BLUE);
  doc.moveDown(1);
}

function subheader(text) {
  if (doc.y > doc.page.height - 140) {
    doc.addPage();
    doc.rect(0, 0, doc.page.width, 6).fill(BLUE);
    doc.moveDown(1);
  } else {
    doc.moveDown(0.8);
  }
  doc.fontSize(14).font('Helvetica-Bold').fillColor(DARK).text(text);
  doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).lineWidth(0.5).stroke('#cbd5e1');
  doc.moveDown(0.5);
}

function body(text) {
  doc.fontSize(11).font('Helvetica').fillColor(DARK).text(text, { lineGap: 4 });
  doc.moveDown(0.5);
}

function bullet(text) {
  doc.fontSize(10.5).font('Helvetica').fillColor(DARK)
     .text(`   •  ${text}`, { lineGap: 3 });
}

function tip(text) {
  if (doc.y > doc.page.height - 90) doc.addPage();
  const y = doc.y;
  doc.rect(50, y, 495, 40).fill('#eff6ff').stroke(BLUE);
  doc.fontSize(10).font('Helvetica').fillColor(BLUE)
     .text(`Astuce : ${text}`, 62, y + 10, { width: 470 });
  doc.moveDown(2.5);
}

function numbered(n, text) {
  doc.fontSize(11).font('Helvetica-Bold').fillColor(BLUE)
     .text(`${n}.  `, { continued: true });
  doc.font('Helvetica').fillColor(DARK).text(text, { lineGap: 3 });
}

function moduleBlock(name, desc, actions, roleNote) {
  subheader(name);
  body(desc);
  doc.fontSize(10.5).font('Helvetica-Bold').fillColor(DARK).text('Actions principales :');
  doc.moveDown(0.15);
  actions.forEach(bullet);
  if (roleNote) {
    doc.moveDown(0.2);
    doc.fontSize(9.5).font('Helvetica-Oblique').fillColor(GREY).text(`Accès : ${roleNote}`);
  }
  doc.moveDown(0.8);
}

// PAGE DE COUVERTURE
doc.rect(0, 0, doc.page.width, doc.page.height * 0.4).fill(BLUE);
doc.fillColor('#ffffff').fontSize(36).font('Helvetica-Bold')
   .text('GUIDE UTILISATEUR', 50, 80, { align: 'center' });
doc.fontSize(20).font('Helvetica')
   .text('Plateforme de pilotage QHSE', 50, 135, { align: 'center' });
doc.fontSize(13)
   .text(`QHSE Control Africa · v2.0 · ${new Date().getFullYear()}`, 50, 175, { align: 'center' });
doc.fillColor(DARK).fontSize(13).font('Helvetica')
   .text('Ce guide couvre l\'ensemble des modules de la plateforme : sécurité, environnement, conformité réglementaire et pilotage des opérations.',
     80, 320, { width: 440, align: 'center', lineGap: 6 });

// SECTION 1, PRESENTATION
header('1. Présentation générale');
body('QHSE Control Africa est une plateforme de pilotage QHSE (Qualité, Hygiène, Sécurité, Environnement) conçue pour les sites industriels et les équipes terrain en Afrique. Elle centralise la déclaration et le suivi des incidents, la gestion des risques, la planification des audits, le pilotage des actions correctives, ainsi que le suivi environnemental et la conformité réglementaire.');
doc.moveDown(0.4);
body('La plateforme s\'organise autour de trois principes : centraliser l\'information QHSE de tous les sites dans un seul outil, simplifier la saisie terrain (y compris hors connexion) et fournir aux équipes de direction des indicateurs fiables pour décider rapidement.');
doc.moveDown(0.5);
['Gain de temps : réduction significative du temps de reporting manuel grâce à la saisie unique et aux exports automatisés.',
 'Conformité : suivi aligné sur les référentiels ISO 45001 (santé et sécurité), ISO 14001 (environnement) et ISO 9001 (qualité), ainsi que sur la réglementation locale.',
 'Mobilité : le Mode Terrain reste utilisable sans connexion internet, avec synchronisation automatique au retour du réseau.',
 'Traçabilité : chaque création, modification ou validation est historisée dans le Journal d\'activité.',
 'Multi-sites : chaque organisation peut piloter plusieurs sites depuis une vue groupe ou filtrer par site.'].forEach(bullet);

// SECTION 2, PRISE EN MAIN
header('2. Prise en main rapide');
doc.fontSize(13).font('Helvetica-Bold').fillColor(DARK).text('Connexion');
doc.moveDown(0.3);
[['1', 'Ouvrez l\'URL de votre organisation (par exemple app.qhsecontrol.com).'],
 ['2', 'Saisissez votre identifiant (email) et votre mot de passe.'],
 ['3', 'Si c\'est votre première connexion, vous devrez choisir un nouveau mot de passe à la place du mot de passe provisoire reçu.'],
 ['4', 'Vous arrivez directement sur le tableau de bord de votre organisation.']].forEach(([n, t]) => numbered(n, t));
doc.moveDown(1);

doc.fontSize(13).font('Helvetica-Bold').fillColor(DARK).text('Navigation et menu latéral');
doc.moveDown(0.3);
body('Le menu latéral gauche donne accès à tous les modules autorisés pour votre rôle, regroupés par thème : Pilotage, Maîtrise des risques, Conformité réglementaire, Ressources et compétences, Produits et environnement, Opérations. Le sélecteur en haut de page permet de basculer entre la vue groupe (tous les sites) et un site précis.');

doc.moveDown(0.6);
doc.fontSize(13).font('Helvetica-Bold').fillColor(DARK).text('Modes d\'affichage');
doc.moveDown(0.3);
body('Trois modes d\'affichage existent et s\'adaptent au profil et au support utilisé :');
['Mode Expert : tous les indicateurs et toutes les colonnes de tableau sont visibles, pour les profils QHSE et direction sur poste de travail.',
 'Mode Essentiel : une vue condensée avec les colonnes prioritaires, utile pour aller plus vite au quotidien.',
 'Mode Terrain : activé automatiquement sur smartphone et tablette (écran étroit), avec des formulaires simplifiés et la possibilité de travailler hors connexion.'].forEach(bullet);
tip('Sur mobile, le sélecteur de mode Expert / Essentiel disparaît : l\'application bascule directement en Mode Terrain pour rester lisible et rapide.');

doc.moveDown(0.4);
doc.fontSize(13).font('Helvetica-Bold').fillColor(DARK).text('Notifications et assistant QHSE');
doc.moveDown(0.3);
body('La cloche en haut de page centralise les alertes (échéances dépassées, actions en retard, formations à renouveler, équipements à contrôler). L\'assistant QHSE, accessible depuis le Centre IA, peut répondre aux questions sur vos données et préremplir certains formulaires.');

// SECTION 3, MODULES
header('3. Modules : Pilotage et analyse');
moduleBlock(
  'Tableau de bord',
  'Vue de synthèse des indicateurs clés QHSE en temps réel : incidents, risques, actions, audits, formations et équipements.',
  ['Visualiser les indicateurs clés par site ou pour l\'ensemble du groupe',
   'Suivre les tendances sur les derniers mois (graphiques d\'évolution)',
   'Accéder en un clic aux éléments prioritaires (actions en retard, risques critiques sans action)'],
  'tous les rôles, en lecture'
);
moduleBlock(
  'Analytics',
  'Analyses approfondies multi-modules : répartition des incidents par type, mix des actions, comparaisons entre sites.',
  ['Croiser plusieurs indicateurs sur une période choisie',
   'Comparer les sites entre eux',
   'Exporter les graphiques pour vos comités de direction'],
  'ADMIN, QHSE, DIRECTION'
);
moduleBlock(
  'Performance',
  'Suivi de la performance QHSE dans le temps : taux de clôture des actions, délais moyens de traitement, score global.',
  ['Suivre l\'évolution des indicateurs de performance dans la durée',
   'Identifier les sites ou les périodes en dérive',
   'Documenter les progrès pour les revues de direction'],
  'ADMIN, QHSE, DIRECTION'
);
moduleBlock(
  'Centre IA',
  'Assistant QHSE et synthèses automatiques pour gagner du temps sur l\'analyse des données.',
  ['Poser une question en langage naturel sur vos données QHSE',
   'Obtenir une synthèse automatique d\'un module (risques, incidents, audits)',
   'Préremplir un formulaire d\'action à partir d\'une suggestion de l\'assistant'],
  'selon configuration de l\'organisation'
);

header('3. Modules : Sécurité au travail');
moduleBlock(
  'Incidents',
  'Déclaration et suivi de tous les incidents et accidents du travail.',
  ['Déclarer un incident (type, site, gravité, description, personnes impliquées)',
   'Suivre le statut (ouvert, en cours d\'analyse, clos)',
   'Lier un incident à une action corrective et exporter la liste en CSV'],
  'TERRAIN et QHSE en écriture, DIRECTION en lecture'
);
moduleBlock(
  'Presqu\'accidents',
  'Recensement des situations dangereuses qui n\'ont pas causé de dommage, pour agir avant l\'accident.',
  ['Signaler un presqu\'accident rapidement, y compris depuis le Mode Terrain',
   'Analyser la répartition par catégorie (diagramme de Pareto)',
   'Capitaliser les retours d\'expérience pour la prévention'],
  'TERRAIN et QHSE en écriture'
);
moduleBlock(
  'Permis de travail',
  'Gestion des permis pour les travaux à risque (travail en hauteur, espace confiné, point chaud, etc.).',
  ['Créer un permis de travail avec ses conditions de sécurité',
   'Suivre les permis en cours et leur date d\'expiration',
   'Clôturer un permis une fois les travaux terminés'],
  'QHSE et responsables de site en écriture'
);
moduleBlock(
  'Plans de prévention',
  'Organisation de la coactivité entre l\'entreprise et les entreprises extérieures intervenant sur site.',
  ['Créer un plan de prévention pour une intervention extérieure',
   'Lister les risques liés à la coactivité et les mesures de prévention associées',
   'Suivre la validité du plan dans le temps'],
  'QHSE et responsables de site en écriture'
);

header('3. Modules : Risques et conformité');
moduleBlock(
  'Registre des risques',
  'Registre central des risques professionnels, avec cotation Gravité x Probabilité (G x P) et matrice de criticité.',
  ['Créer une fiche de risque et la coter (G x P, de 1 à 25)',
   'Visualiser la matrice de criticité et les risques sans action associée',
   'Lier un risque à une action corrective ou à un permis de travail'],
  'QHSE en écriture, DIRECTION et TERRAIN en lecture ou écriture limitée selon configuration'
);
moduleBlock(
  'Processus',
  'Cartographie et pilotage des processus de l\'organisation (approche système de management).',
  ['Décrire un processus, ses indicateurs et son pilote',
   'Suivre la performance de chaque processus dans le temps',
   'Relier un processus aux risques et actions qui le concernent'],
  'ADMIN et QHSE en écriture'
);
moduleBlock(
  'Conformité ISO',
  'Suivi des exigences des référentiels ISO 45001, ISO 14001 et ISO 9001, avec preuves documentaires.',
  ['Suivre l\'état de conformité de chaque exigence du référentiel choisi',
   'Rattacher une preuve documentaire à une exigence',
   'Préparer un audit de certification grâce à la vue de préparation dédiée'],
  'ADMIN et QHSE en écriture'
);
moduleBlock(
  'Veille réglementaire',
  'Suivi des textes réglementaires applicables et de leur statut de conformité.',
  ['Enregistrer un texte réglementaire et son impact sur l\'organisation',
   'Suivre les échéances de mise en conformité et recevoir des alertes',
   'Créer une action corrective directement depuis une veille en écart'],
  'ADMIN et QHSE en écriture'
);

header('3. Modules : Audits et traçabilité');
moduleBlock(
  'Audits',
  'Planification et conduite des audits internes et externes.',
  ['Planifier un audit (date, site, type, référentiel)',
   'Saisir le score et les observations pendant l\'audit',
   'Télécharger le rapport d\'audit au format PDF'],
  'QHSE en écriture, ADMIN en écriture, DIRECTION en lecture'
);
moduleBlock(
  'Imports',
  'Import en masse de données existantes (anciens registres, tableaux Excel) vers la plateforme.',
  ['Importer un fichier de données dans un module compatible',
   'Vérifier les données avant la validation finale de l\'import',
   'Suivre la feuille de route d\'import par module'],
  'ADMIN en écriture'
);
moduleBlock(
  'Journal d\'activité',
  'Historique complet des actions effectuées par les utilisateurs sur la plateforme.',
  ['Consulter qui a créé, modifié ou supprimé un enregistrement, et quand',
   'Filtrer le journal par utilisateur, module ou période',
   'Exporter le journal pour un audit de sécurité interne'],
  'ADMIN uniquement'
);

header('3. Modules : Ressources, équipements et compétences');
moduleBlock(
  'Sites',
  'Référentiel des sites et de leurs informations de base (adresse, responsable, effectif).',
  ['Créer ou modifier la fiche d\'un site',
   'Consulter les indicateurs clés propres à un site',
   'Filtrer l\'ensemble des modules sur un site donné'],
  'ADMIN en écriture'
);
moduleBlock(
  'Équipements et EPI',
  'Suivi du parc d\'équipements et des équipements de protection individuelle, avec périodicité de maintenance.',
  ['Enregistrer un équipement et sa périodicité de contrôle',
   'Suivre les prochaines échéances de maintenance calculées automatiquement',
   'Créer une action liée depuis une alerte de maintenance'],
  'QHSE et responsables de site en écriture'
);
moduleBlock(
  'Signalements terrain',
  'Signalements d\'équipement défectueux remontés directement depuis le Mode Terrain, à valider par le QHSE.',
  ['Recevoir un signalement envoyé depuis le terrain, y compris créé hors connexion',
   'Valider ou rejeter le signalement après vérification',
   'Déclencher une action de maintenance si nécessaire'],
  'TERRAIN en création, QHSE en validation'
);
moduleBlock(
  'Habilitations',
  'Suivi des habilitations et autorisations individuelles nécessaires pour certains postes ou travaux.',
  ['Enregistrer l\'habilitation d\'un collaborateur et sa date d\'expiration',
   'Anticiper les renouvellements grâce aux alertes d\'échéance',
   'Visualiser le risque opérationnel lié à une habilitation manquante'],
  'QHSE et ADMIN en écriture'
);
moduleBlock(
  'Formations',
  'Suivi des formations obligatoires et de leur renouvellement.',
  ['Enregistrer une formation suivie par un collaborateur',
   'Recevoir une alerte avant l\'expiration d\'une formation',
   'Consulter le référentiel des formations disponibles'],
  'QHSE et ADMIN en écriture'
);
moduleBlock(
  'Mode Terrain',
  'Interface simplifiée pensée pour les agents sur le chantier, utilisable même sans connexion internet.',
  ['Déclarer un incident ou un presqu\'accident en quelques clics',
   'Signaler un équipement défectueux, photo à l\'appui',
   'Valider une checklist sécurité hors connexion, synchronisée automatiquement au retour du réseau'],
  'TERRAIN'
);

header('3. Modules : Environnement et produits');
moduleBlock(
  'Environnement',
  'Suivi des relevés environnementaux (déchets, eau, énergie) avec synthèse, tendance et graphiques.',
  ['Enregistrer un relevé (type, quantité, unité, date)',
   'Consulter la synthèse par type avec comparaison à la période précédente',
   'Visualiser la tendance mensuelle et la répartition par type sous forme de graphiques'],
  'QHSE en écriture, DIRECTION en lecture'
);
moduleBlock(
  'Produits chimiques',
  'Inventaire des produits et substances dangereuses, avec leurs fiches de données de sécurité (FDS).',
  ['Enregistrer un produit et rattacher sa FDS',
   'Suivre les produits classés dangereux par site',
   'Vérifier la mise à jour des fiches de sécurité'],
  'QHSE en écriture'
);

header('3. Modules : Pilotage des actions correctives');
moduleBlock(
  'Plan d\'actions',
  'Pilotage de toutes les actions correctives et préventives issues des autres modules (incidents, risques, audits, veille réglementaire, équipements).',
  ['Créer une action avec échéance, responsable et priorité',
   'Faire glisser une action entre les colonnes du tableau Kanban (à faire, en cours, terminé)',
   'Recevoir des rappels automatiques par email avant l\'échéance'],
  'tous les rôles peuvent créer une action, le suivi global reste réservé à QHSE et ADMIN'
);

header('3. Modules : Administration');
moduleBlock(
  'Paramètres',
  'Configuration de l\'organisation : informations générales, utilisateurs, rôles et préférences.',
  ['Gérer la liste des utilisateurs et leurs rôles',
   'Réinitialiser le mot de passe provisoire d\'un utilisateur',
   'Configurer les préférences générales de l\'organisation'],
  'ADMIN uniquement'
);
moduleBlock(
  'Cockpit clients (SaaS)',
  'Vue réservée aux administrateurs de la plateforme pour gérer les organisations clientes.',
  ['Créer un nouvel espace client (tenant)',
   'Suivre l\'état des comptes administrateurs de chaque client',
   'Réinitialiser ou regénérer un accès provisoire'],
  'SUPER_ADMIN uniquement'
);

// SECTION 4, ROLES
header('4. Rôles et permissions');
body('Chaque utilisateur dispose d\'un rôle qui détermine ses droits d\'accès aux modules. Le tableau ci-dessous résume les droits par module pour les rôles les plus courants :');
doc.moveDown(0.5);
const roles = [
  ['Module', 'ADMIN', 'QHSE', 'DIRECTION', 'TERRAIN'],
  ['Incidents', 'Lect. + Écr.', 'Lect. + Écr.', 'Lecture', 'Écriture'],
  ['Risques', 'Lect. + Écr.', 'Lect. + Écr.', 'Lecture', 'Lecture'],
  ['Plan d\'actions', 'Lect. + Écr.', 'Lect. + Écr.', 'Lecture', 'Écriture'],
  ['Audits', 'Lect. + Écr.', 'Lect. + Écr.', 'Lecture', 'Aucun'],
  ['Environnement', 'Lect. + Écr.', 'Lect. + Écr.', 'Lecture', 'Aucun'],
  ['Tableau de bord', 'Lect. + Écr.', 'Lect. + Écr.', 'Lecture', 'Lecture limitée'],
  ['Paramètres', 'Lect. + Écr.', 'Aucun', 'Aucun', 'Aucun'],
];
const colW = [120, 95, 95, 95, 90];
let tableY = doc.y;
roles.forEach((row, ri) => {
  const rowH = 22;
  if (tableY > doc.page.height - 100) {
    doc.addPage();
    tableY = 80;
  }
  if (ri === 0) {
    doc.rect(50, tableY, 495, rowH).fill(BLUE);
    row.forEach((cell, ci) => {
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#fff')
         .text(cell, 52 + colW.slice(0, ci).reduce((a, b) => a + b, 0), tableY + 6, { width: colW[ci] - 4 });
    });
  } else {
    doc.rect(50, tableY, 495, rowH).fill(ri % 2 === 0 ? LIGHT : '#fff').stroke('#e2e8f0');
    row.forEach((cell, ci) => {
      doc.fontSize(9).font('Helvetica').fillColor(DARK)
         .text(cell, 52 + colW.slice(0, ci).reduce((a, b) => a + b, 0), tableY + 6, { width: colW[ci] - 4 });
    });
  }
  tableY += rowH;
});
doc.y = tableY + 16;
doc.moveDown(0.5);
body('Autres rôles disponibles selon votre organisation : ASSISTANT (appui administratif), AUDITEUR (lecture pour audits externes), OPÉRATEUR (saisie terrain limitée), CLIENT_ADMIN (administrateur d\'un espace client) et SUPER_ADMIN (administrateur de la plateforme, gestion des espaces clients).');

// SECTION 5, FAQ
header('5. Questions fréquentes');
const faq = [
  ['J\'ai oublié mon mot de passe, que faire ?', 'Contactez l\'administrateur de votre organisation, ou écrivez à support@qhsecontrol.com.'],
  ['Puis-je utiliser l\'application sans connexion internet ?', 'Oui. Le Mode Terrain fonctionne hors connexion : les données saisies se synchronisent automatiquement dès que le réseau revient.'],
  ['Comment changer de site affiché ?', 'Utilisez le sélecteur de site en haut de page, dans la barre de navigation. Vous pouvez aussi revenir à la vue groupe pour voir tous les sites.'],
  ['Comment exporter mes données ?', 'Cliquez sur le bouton d\'export (CSV ou PDF selon le module) en haut de chaque liste : incidents, risques, actions, audits, environnement.'],
  ['Qui peut créer de nouveaux utilisateurs ?', 'Uniquement les utilisateurs avec le rôle ADMIN, depuis le module Paramètres.'],
  ['Comment télécharger le rapport d\'un audit ?', 'Ouvrez l\'audit concerné et cliquez sur le bouton "Télécharger le rapport PDF".'],
  ['Les données sont-elles sécurisées ?', 'Oui. Toutes les communications sont chiffrées en HTTPS, les mots de passe sont stockés sous forme chiffrée, et les accès sont historisés dans le Journal d\'activité.'],
  ['Comment signaler un problème technique ?', 'Utilisez le bouton de retour d\'expérience flottant dans l\'application, ou écrivez à support@qhsecontrol.com avec une capture d\'écran si possible.'],
  ['Peut-on gérer plusieurs sites avec un seul compte ?', 'Oui. Selon votre offre, vous pouvez créer plusieurs sites et piloter une vue groupe consolidée ou filtrer site par site.'],
  ['Comment inviter un collègue sur la plateforme ?', 'Allez dans Paramètres, puis Utilisateurs, puis "Ajouter un utilisateur". Un mot de passe provisoire lui sera communiqué.'],
  ['Comment créer une action à partir d\'un risque ou d\'un incident ?', 'Depuis la fiche concernée, utilisez le bouton "Créer une action liée" : les informations principales sont préremplies dans le formulaire d\'action.'],
  ['Comment fonctionne la cotation des risques (G x P) ?', 'G correspond à la gravité potentielle et P à la probabilité d\'occurrence, chacune notée de 1 à 5. Le produit G x P (de 1 à 25) détermine le niveau de criticité du risque.'],
  ['Comment savoir si une formation ou une habilitation arrive à échéance ?', 'Les modules Formations et Habilitations affichent des alertes d\'échéance, également reprises dans les notifications et sur le tableau de bord.'],
  ['Le Mode Terrain est-il accessible sur smartphone et tablette ?', 'Oui, il s\'active automatiquement sur les écrans étroits afin de garder une interface simple et rapide à utiliser sur le terrain.']
];
faq.forEach(([q, a]) => {
  if (doc.y > doc.page.height - 110) doc.addPage();
  doc.fontSize(10.5).font('Helvetica-Bold').fillColor(BLUE).text(`Q. ${q}`);
  doc.fontSize(10.5).font('Helvetica').fillColor(DARK).text(`    ${a}`, { lineGap: 3 });
  doc.moveDown(0.5);
});

// SECTION 6, CONTACT
header('6. Contact et support');
body('Notre équipe est disponible pour vous accompagner :');
doc.moveDown(0.3);
bullet('Assistance application : support@qhsecontrol.com');
bullet('Relation client / compte : direction@qhsecontrol.com');
bullet('Devis ou offre Pro : devis@qhsecontrol.com');
bullet('Facturation : facturation@qhsecontrol.com');
bullet('Contact général : contact@qhsecontrol.com');
tip('Pour une demande commerciale ou un accompagnement au déploiement, utilisez devis@qhsecontrol.com.');

// NUMEROTATION DES PAGES
const total = doc.bufferedPageRange().count;
for (let i = 0; i < total; i++) {
  doc.switchToPage(i);
  if (i === 0) continue;
  doc.fontSize(8).fillColor(GREY)
     .text(`QHSE Control Africa · Guide utilisateur v2.0 · Page ${i}/${total - 1}`,
       50, doc.page.height - 35, { align: 'center', width: 495 });
}

doc.on('end', () => console.log(`Guide généré : ${OUT} (${total - 1} pages)`));
doc.end();
