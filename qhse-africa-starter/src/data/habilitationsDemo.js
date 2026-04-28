export const HABILITATIONS_STATUS_LABEL = {
  valide: 'Valide',
  expire_bientot: 'Expire bientôt',
  expiree: 'Expirée',
  en_attente: 'En attente',
  suspendue: 'Suspendue',
  incomplete: 'Incomplète'
};

export const HABILITATIONS_DEMO_ROWS = [
  { id: 'HAB-001', collaborateur: 'Moussa Diallo', entreprise: 'Sahel Drilling', matricule: 'SD-1842', poste: 'Foreur', service: 'Forage', site: 'Mine Nord', type: 'Travaux en hauteur', niveau: 'N2', delivrance: '2025-07-02', expiration: '2026-07-01', organisme: 'INHST Dakar', justificatif: true, statut: 'valide', remarques: 'RAS' },
  { id: 'HAB-002', collaborateur: 'Moussa Diallo', entreprise: 'Sahel Drilling', matricule: 'SD-1842', poste: 'Foreur', service: 'Forage', site: 'Mine Nord', type: 'Espace confiné', niveau: 'N1', delivrance: '2024-06-12', expiration: '2026-04-22', organisme: 'APAVE', justificatif: true, statut: 'expire_bientot', remarques: 'Recyclage planifié' },
  { id: 'HAB-003', collaborateur: 'Aissatou Kane', entreprise: 'QHSE Africa', matricule: 'QA-220', poste: 'Superviseur HSE', service: 'HSE', site: 'Base Portuaire', type: 'Atmosphère explosible', niveau: 'N3', delivrance: '2024-09-12', expiration: '2026-06-22', organisme: 'APAVE', justificatif: true, statut: 'valide', remarques: 'Conforme' },
  { id: 'HAB-004', collaborateur: 'Ibrahima Sarr', entreprise: 'Atlas Contractors', matricule: 'AT-901', poste: 'Soudeur', service: 'Maintenance', site: 'Raffinerie Ouest', type: 'Permis feu', niveau: 'N2', delivrance: '2024-03-10', expiration: '2026-03-10', organisme: 'Bureau Veritas', justificatif: true, statut: 'expiree', remarques: 'Bloqué activités critiques' },
  { id: 'HAB-005', collaborateur: 'Fatou Ndiaye', entreprise: 'Delta Services', matricule: 'DS-441', poste: 'Électricienne', service: 'Énergie', site: 'Centrale Sud', type: 'Habilitation électrique', niveau: 'H2B2', delivrance: '2025-11-01', expiration: '2027-11-01', organisme: 'INP', justificatif: false, statut: 'incomplete', remarques: 'Justificatif manquant' },
  { id: 'HAB-006', collaborateur: 'Jean Mendy', entreprise: 'QHSE Africa', matricule: 'QA-512', poste: 'Chef de chantier', service: 'BTP lourd', site: 'Corridor Est', type: 'Conduite engin lourd', niveau: 'N3', delivrance: '2026-02-05', expiration: '2028-02-05', organisme: 'CNSS', justificatif: true, statut: 'en_attente', remarques: 'Validation direction en cours' },
  { id: 'HAB-007', collaborateur: 'Khadim Gueye', entreprise: 'Atlas Contractors', matricule: 'AT-117', poste: 'Grutier', service: 'Levage', site: 'Mine Nord', type: 'Levage critique', niveau: 'N3', delivrance: '2025-01-18', expiration: '2026-05-30', organisme: 'INHST Dakar', justificatif: true, statut: 'suspendue', remarques: 'Suspension après incident mineur' },
  { id: 'HAB-008', collaborateur: 'Mariam Ba', entreprise: 'QHSE Africa', matricule: 'QA-735', poste: 'Inspectrice terrain', service: 'Inspection', site: 'Base Portuaire', type: 'Travaux en hauteur', niveau: 'N2', delivrance: '2025-05-10', expiration: '2026-01-10', organisme: 'INHST Dakar', justificatif: true, statut: 'expiree', remarques: 'Renouvellement en retard' },
  { id: 'HAB-009', collaborateur: 'Abdoulaye Cisse', entreprise: 'Niger Build', matricule: 'NB-332', poste: 'Chef équipe coffrage', service: 'BTP', site: 'Corridor Est', type: 'Conduite engin lourd', niveau: 'N2', delivrance: '2024-10-01', expiration: '2026-04-18', organisme: 'CNSS', justificatif: false, statut: 'incomplete', remarques: 'Attestation absente' },
  { id: 'HAB-010', collaborateur: 'Rokia Faye', entreprise: 'Delta Services', matricule: 'DS-502', poste: 'Technicienne gaz', service: 'Énergie', site: 'Centrale Sud', type: 'Atmosphère explosible', niveau: 'N2', delivrance: '2025-03-16', expiration: '2026-08-30', organisme: 'APAVE', justificatif: true, statut: 'valide', remarques: 'Conforme' },
  { id: 'HAB-011', collaborateur: 'Ousmane Traoré', entreprise: 'Mali Hydrocarbon Services', matricule: 'MHS-771', poste: 'Opérateur puits', service: 'Production', site: 'Champ onshore Tamesna', type: 'Espace confiné', niveau: 'N2', delivrance: '2024-08-01', expiration: '2026-02-14', organisme: 'Bureau Veritas', justificatif: true, statut: 'expire_bientot', remarques: 'Recycler avant mi-févr.' },
  { id: 'HAB-012', collaborateur: 'Aminata Diop', entreprise: 'QHSE Africa', matricule: 'QA-881', poste: 'Responsable levage', service: 'Levage', site: 'Raffinerie Ouest', type: 'Levage critique', niveau: 'N3', delivrance: '2025-01-20', expiration: '2026-12-01', organisme: 'INHST Dakar', justificatif: true, statut: 'valide', remarques: 'Autorisation grue 120t' },
  { id: 'HAB-013', collaborateur: 'Samba Sow', entreprise: 'SN BTP Alliance', matricule: 'SBA-209', poste: 'Conducteur d’engins', service: 'BTP lourd', site: 'Corridor Est', type: 'Conduite engin lourd', niveau: 'N2', delivrance: '2023-11-10', expiration: '2026-01-28', organisme: 'CNSS', justificatif: false, statut: 'expiree', remarques: 'Bloqué terrassement zone 4' },
  { id: 'HAB-014', collaborateur: 'Hawa Touré', entreprise: 'Niger Build', matricule: 'NB-118', poste: 'Charpentière', service: 'BTP', site: 'Mine Nord', type: 'Travaux en hauteur', niveau: 'N1', delivrance: '2025-10-02', expiration: '2027-01-15', organisme: 'APAVE', justificatif: true, statut: 'valide', remarques: 'OK' },
  { id: 'HAB-015', collaborateur: 'Kwame Asante', entreprise: 'Ghana Offshore JV', matricule: 'GOJ-445', poste: 'Superviseur sécurité', service: 'HSE', site: 'Terminal CPP Lomé', type: 'Permis feu', niveau: 'N3', delivrance: '2024-12-01', expiration: '2026-03-02', organisme: 'INP', justificatif: true, statut: 'expire_bientot', remarques: 'Renouvellement à planifier' },
  { id: 'HAB-016', collaborateur: 'Yacine Fall', entreprise: 'Atlas Contractors', matricule: 'AT-330', poste: 'Chaudronnier', service: 'Maintenance', site: 'Base Portuaire', type: 'Permis feu', niveau: 'N2', delivrance: '2024-04-22', expiration: '2025-08-10', organisme: 'Bureau Veritas', justificatif: true, statut: 'expiree', remarques: 'Suspension fonderie : bloqué soudure' }
];

export function habDaysUntil(dateIso) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return 9999;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function computeHabilitationsKpis(rows) {
  const actifs = rows.filter((r) => r.statut === 'valide').length;
  const expirees = rows.filter((r) => r.statut === 'expiree').length;
  const exp30 = rows.filter((r) => habDaysUntil(r.expiration) >= 0 && habDaysUntil(r.expiration) <= 30).length;
  const nonConformes = rows.filter((r) => r.statut === 'expiree' || r.statut === 'suspendue' || r.statut === 'incomplete').length;
  const missingDocs = rows.filter((r) => !r.justificatif).length;
  const taux = rows.length ? Math.max(0, Math.round(((rows.length - nonConformes) / rows.length) * 100)) : 0;
  const blocCrit = rows.filter((r) => r.statut === 'expiree' || r.statut === 'suspendue').length;
  const sousTraitantsIncomplets = rows.filter((r) => r.entreprise !== 'QHSE Africa' && (r.statut === 'incomplete' || r.statut === 'expiree')).length;
  return { actifs, expirees, exp30, nonConformes, missingDocs, taux, blocCrit, sousTraitantsIncomplets };
}

export function computeHabilitationsBySite(rows) {
  const sites = [...new Set(rows.map((r) => r.site))];
  return sites.map((site) => {
    const bucket = rows.filter((r) => r.site === site);
    const nonConf = bucket.filter((r) => ['expiree', 'suspendue', 'incomplete'].includes(r.statut)).length;
    const score = bucket.length ? Math.max(0, Math.round(((bucket.length - nonConf) / bucket.length) * 100)) : 0;
    return { site, score, total: bucket.length, nonConf };
  });
}

export function computeHabilitationsByService(rows) {
  const services = [...new Set(rows.map((r) => r.service))];
  return services.map((service) => {
    const bucket = rows.filter((r) => r.service === service);
    const nonConf = bucket.filter((r) => ['expiree', 'suspendue', 'incomplete'].includes(r.statut)).length;
    const score = bucket.length ? Math.max(0, Math.round(((bucket.length - nonConf) / bucket.length) * 100)) : 0;
    return { service, score, total: bucket.length, nonConf };
  });
}
