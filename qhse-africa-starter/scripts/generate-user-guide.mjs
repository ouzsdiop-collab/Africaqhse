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

function body(text) {
  doc.fontSize(11).font('Helvetica').fillColor(DARK).text(text, { lineGap: 4 });
  doc.moveDown(0.5);
}

function bullet(text) {
  doc.fontSize(11).font('Helvetica').fillColor(DARK)
     .text(`   •  ${text}`, { lineGap: 3 });
}

function tip(text) {
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

// PAGE DE COUVERTURE
doc.rect(0, 0, doc.page.width, doc.page.height * 0.4).fill(BLUE);
doc.fillColor('#ffffff').fontSize(36).font('Helvetica-Bold')
   .text('GUIDE UTILISATEUR', 50, 80, { align: 'center' });
doc.fontSize(20).font('Helvetica')
   .text('Plateforme de pilotage QHSE', 50, 135, { align: 'center' });
doc.fontSize(13)
   .text(`AfricaQHSE — v1.0 — ${new Date().getFullYear()}`, 50, 175, { align: 'center' });
doc.fillColor(DARK).fontSize(13).font('Helvetica')
   .text('Ce guide vous accompagne dans la prise en main de la plateforme AfricaQHSE.',
     80, 320, { width: 440, align: 'center', lineGap: 6 });

// SECTION 1 — PRESENTATION
header('1. Presentation');
body('AfricaQHSE est une plateforme digitale de gestion QHSE concue pour les entreprises africaines. Elle centralise la declaration d\'incidents, le suivi des risques, la planification des audits et le pilotage des actions correctives.');
doc.moveDown(0.5);
['Gain de temps : reduction de 60 % du temps de reporting manuel.',
 'Conformite : suivi ISO 45001, ISO 9001 et reglementations locales.',
 'Mobilite : accessible depuis le chantier sans connexion internet.'].forEach(bullet);

// SECTION 2 — PRISE EN MAIN
header('2. Prise en main rapide');
doc.fontSize(13).font('Helvetica-Bold').fillColor(DARK).text('Connexion');
doc.moveDown(0.3);
[['1','Ouvrez africaqhse.com dans votre navigateur.'],
 ['2','Saisissez votre email et mot de passe.'],
 ['3','Cliquez sur "Se connecter".'],
 ['4','Vous arrivez directement sur le tableau de bord.']].forEach(([n,t]) => numbered(n,t));
doc.moveDown(1);
doc.fontSize(13).font('Helvetica-Bold').fillColor(DARK).text('Navigation');
doc.moveDown(0.3);
body('Le menu lateral gauche donne acces a tous les modules : Dashboard, Incidents, Risques, Actions, Audits, Documents, Mode Terrain.');
tip('Sur mobile, le menu se replie automatiquement pour laisser plus de place au contenu.');

// SECTION 3 — MODULES
const modules = [
  { name: 'Dashboard',   desc: 'Vue synthetique des KPI QHSE en temps reel.',
    actions: ['Visualiser les indicateurs cles (incidents, risques, actions, audits)','Filtrer par site ou periode','Exporter les statistiques'] },
  { name: 'Incidents',   desc: 'Declarer et suivre tous les incidents SST.',
    actions: ['Declarer un incident (type, site, gravite, description)','Suivre le statut (ouvert / en cours / clos)','Exporter la liste en Excel'] },
  { name: 'Risques',     desc: 'Gerer le registre des risques professionnels.',
    actions: ['Creer une fiche risque avec cotation GP','Assigner un proprietaire','Visualiser la matrice de criticite'] },
  { name: 'Actions',     desc: 'Piloter le plan d\'actions correctives et preventives.',
    actions: ['Creer une action avec echeance et responsable','Glisser-deposer entre les statuts (Kanban)','Recevoir des rappels automatiques par email'] },
  { name: 'Audits',      desc: 'Planifier et conduire les audits QHSE.',
    actions: ['Planifier un audit (date, site, type)','Saisir le score et les observations','Telecharger le rapport PDF'] },
  { name: 'Mode Terrain',desc: 'Interface simplifiee pour les agents sur chantier.',
    actions: ['Declarer un incident en 3 clics','Signaler un risque avec photo','Valider une checklist securite sans connexion'] },
  { name: 'Documents',   desc: 'Gerer les documents QHSE (procedures, FDS, enregistrements).',
    actions: ['Uploader et versionner les documents','Controler les dates de revision','Partager via lien securise'] },
];

modules.forEach(m => {
  header(`3. Module — ${m.name}`);
  body(m.desc);
  doc.moveDown(0.3);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(DARK).text('Actions principales :');
  doc.moveDown(0.2);
  m.actions.forEach(bullet);
  doc.moveDown(0.5);
  tip(m.actions[0].toLowerCase() + '.');
});

// SECTION 4 — ROLES
header('4. Roles et permissions');
body('Chaque utilisateur dispose d\'un role qui determine ses droits d\'acces :');
doc.moveDown(0.5);
const roles = [
  ['Module','ADMIN','QHSE','DIRECTION','TERRAIN'],
  ['Incidents','Lect.+Ecr.','Lect.+Ecr.','Lecture','Ecriture'],
  ['Risques','Lect.+Ecr.','Lect.+Ecr.','Lecture','Lecture'],
  ['Actions','Lect.+Ecr.','Lect.+Ecr.','Lecture','Ecriture'],
  ['Audits','Lect.+Ecr.','Lect.+Ecr.','Lecture','Aucun'],
  ['Documents','Lect.+Ecr.','Lect.+Ecr.','Lecture','Aucun'],
  ['Dashboard','Lect.+Ecr.','Lect.+Ecr.','Lecture','Aucun'],
  ['Parametres','Lect.+Ecr.','Aucun','Aucun','Aucun'],
];
const colW = [110, 90, 80, 90, 80];
let tableY = doc.y;
roles.forEach((row, ri) => {
  const rowH = 22;
  if (ri === 0) {
    doc.rect(50, tableY, 495, rowH).fill(BLUE);
    row.forEach((cell, ci) => {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#fff')
         .text(cell, 52 + colW.slice(0,ci).reduce((a,b)=>a+b,0), tableY + 6, { width: colW[ci]-4 });
    });
  } else {
    doc.rect(50, tableY, 495, rowH).fill(ri % 2 === 0 ? LIGHT : '#fff').stroke('#e2e8f0');
    row.forEach((cell, ci) => {
      doc.fontSize(9).font('Helvetica').fillColor(DARK)
         .text(cell, 52 + colW.slice(0,ci).reduce((a,b)=>a+b,0), tableY + 6, { width: colW[ci]-4 });
    });
  }
  tableY += rowH;
});

// SECTION 5 — FAQ
header('5. Questions frequentes');
const faq = [
  ["J'ai oublie mon mot de passe, que faire ?", "Contactez votre administrateur AfricaQHSE pour reinitialiser votre acces."],
  ["Puis-je utiliser l'app sans connexion ?", "Oui, le mode terrain fonctionne hors connexion. Les donnees se synchronisent au retour du reseau."],
  ["Comment changer de site ?", "Utilisez le selecteur de site en haut de page dans la barre de navigation."],
  ["Comment exporter mes donnees ?", "Cliquez sur 'Export Excel' en haut de chaque liste (incidents, risques, actions, audits)."],
  ["Qui peut creer des utilisateurs ?", "Uniquement les utilisateurs avec le role ADMIN."],
  ["Comment telecharger un rapport d'audit PDF ?", "Ouvrez un audit et cliquez sur le bouton 'Telecharger PDF'."],
  ["Les donnees sont-elles securisees ?", "Oui, toutes les communications sont chiffrees HTTPS et les donnees hebergees sur des serveurs securises."],
  ["Comment signaler un bug ?", "Envoyez un email a support@africaqhse.com avec une capture d'ecran."],
  ["Peut-on avoir plusieurs sites dans le meme compte ?", "Oui, les offres Pro et Business permettent plusieurs sites."],
  ["Comment inviter un collegue ?", "Menu Parametres > Utilisateurs > Ajouter un utilisateur."],
];
faq.forEach(([q, a], i) => {
  doc.fontSize(11).font('Helvetica-Bold').fillColor(BLUE).text(`Q${i+1}. ${q}`);
  doc.fontSize(11).font('Helvetica').fillColor(DARK).text(`    ${a}`, { lineGap: 3 });
  doc.moveDown(0.5);
});

// SECTION 6 — CONTACT
header('6. Contact et support');
body('Notre equipe est disponible pour vous accompagner :');
doc.moveDown(0.3);
bullet('Email : support@africaqhse.com');
bullet('WhatsApp : +221 XX XXX XX XX');
bullet('Delai de reponse : 24h ouvrables');
bullet('Documentation en ligne : docs.africaqhse.com');
tip('Pour toute urgence terrain, privilegiez le contact WhatsApp.');

// NUMEROTATION DES PAGES
const total = doc.bufferedPageRange().count;
for (let i = 0; i < total; i++) {
  doc.switchToPage(i);
  if (i === 0) continue;
  doc.fontSize(8).fillColor(GREY)
     .text(`AfricaQHSE — Guide Utilisateur v1.0 | Page ${i}/${total - 1}`,
       50, doc.page.height - 35, { align: 'center', width: 495 });
}

doc.on('end', () => console.log(`Guide genere : ${OUT} (${total - 1} pages)`));
doc.end();
