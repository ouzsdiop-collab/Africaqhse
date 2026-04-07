/**
 * Référentiel et exigences — données initiales + persistance locale du statut (sans API).
 * Clé localStorage : statut par id d’exigence uniquement.
 */
const STORAGE_KEY = 'qhse-conformity-status-v1';
const IMPORTED_PROOFS_STORAGE_KEY = 'qhse-iso-imported-proofs-v1';

/** @typedef {'present' | 'verify' | 'missing'} ImportedProofStatus */

/**
 * @typedef {object} ImportedDocumentProof
 * @property {string} id
 * @property {string} fileName
 * @property {string} requirementId
 * @property {ImportedProofStatus} proofStatus
 * @property {string} docTypeLabel
 * @property {string[]} keyPoints
 * @property {string[]} gaps
 * @property {string} createdAt
 * @property {string} [validatedBy] — validateur terrain (démo locale)
 */

/** @typedef {'conforme' | 'partiel' | 'non_conforme'} ConformityStatus */

/**
 * @typedef {object} ConformityNorm
 * @property {string} id
 * @property {string} code
 * @property {string} title
 */

/**
 * @typedef {object} ConformityRequirementSeed
 * @property {string} id
 * @property {string} normId
 * @property {string} clause
 * @property {string} title
 * @property {string} summary
 * @property {string} owner
 * @property {string} evidence
 * @property {ConformityStatus} defaultStatus
 * @property {string} [actionNote] — repère pour le terrain (module Actions)
 * @property {string} [auditNote] — repère pour le terrain (module Audits)
 */

/** @type {ConformityNorm[]} */
export const CONFORMITY_NORMS = [
  { id: 'iso9001', code: 'ISO 9001', title: 'Management de la qualité' },
  { id: 'iso14001', code: 'ISO 14001', title: 'Management environnemental' },
  { id: 'iso45001', code: 'ISO 45001', title: 'Santé et sécurité au travail' }
];

/** Documents maîtrisés — démo locale (échéances / responsable enrichis pour statuts conformité). */
export const CONTROLLED_DOCUMENTS = [
  {
    name: 'Manuel intégré SMS',
    version: '4.2',
    type: 'manuel',
    expiresAt: '2027-06-01',
    responsible: 'Direction',
    createdAt: '2025-01-10T10:00:00.000Z'
  },
  {
    name: 'Procédure audits internes',
    version: '3.1',
    type: 'procedure',
    expiresAt: '2026-04-25',
    responsible: 'Qualité site',
    createdAt: '2024-06-01T10:00:00.000Z'
  },
  {
    name: 'Instruction déchets dangereux',
    version: '2.4',
    type: 'instruction',
    expiresAt: '2026-03-10',
    responsible: 'HSE',
    createdAt: '2024-03-15T10:00:00.000Z'
  },
  {
    name: 'Registre des aspects environnementaux',
    version: '1.8',
    type: 'registre',
    responsible: 'Environnement'
  },
  {
    name: 'DDR site et fiches risques',
    version: '2.0',
    type: 'plan',
    expiresAt: '2028-01-15',
    responsible: 'SST'
  },
  {
    name: 'Registre gestion du changement (GMC)',
    version: '1.3',
    type: 'registre',
    expiresAt: '2026-12-01',
    responsible: 'Qualité site'
  }
];

/**
 * Repères pilotage documentaire — à afficher en « points d’attention » (n’altère pas CONTROLLED_DOCUMENTS).
 * @type {{ critical: { name: string; version?: string; note: string }[]; missing: { name: string; note: string }[]; obsolete: { name: string; version?: string; note: string }[] }}
 */
export const DOCUMENT_ATTENTION = {
  critical: [{ name: 'Manuel intégré SMS', version: '4.2', note: 'Document de référence certification' }],
  missing: [
    {
      name: 'Plan de réponse aux déversements (version signée)',
      note: 'Exigé pour la surveillance environnementale — pièce à produire.'
    }
  ],
  obsolete: [
    {
      name: 'Procédure audits internes',
      version: '3.1',
      note: 'Révision à planifier selon le cycle documentaire interne.'
    }
  ]
};

/** Audits / contrôles à mener — pilotage (démo). */
export const AUDITS_TO_SCHEDULE = [
  { title: 'Audit interne ISO 45001 (Q2)', horizon: 'Avant le 15/04/2026', owner: 'Qualité site' },
  { title: 'Surveillance certification ISO 9001', horizon: 'Fenêtre juin 2026', owner: 'Direction' }
];

/** @type {ConformityRequirementSeed[]} */
export const REQUIREMENTS_SEED = [
  {
    id: 'req-9-1-1',
    normId: 'iso9001',
    clause: '9.1.1',
    title: 'Suivi et évaluation des processus',
    summary: 'Indicateurs, sources de données et analyse des performances des processus.',
    owner: 'Responsable qualité site',
    evidence: 'Revue processus Q1 + tableau de bord qualité',
    defaultStatus: 'conforme',
    actionNote: 'Actions liées : indicateurs retard / plans qualité (module Actions).',
    auditNote: 'Vérifier lors des audits internes processus (module Audits).'
  },
  {
    id: 'req-10-2',
    normId: 'iso9001',
    clause: '10.2',
    title: 'Non-conformités et actions correctives',
    summary: 'Réaction aux écarts, causes, actions et efficacité des corrections.',
    owner: 'QHSE',
    evidence: 'Registre NC + plans d’actions',
    defaultStatus: 'partiel',
    actionNote: 'Suivre les actions correctives ouvertes.',
    auditNote: 'Constats NC des derniers audits.'
  },
  {
    id: 'req-7-1-5',
    normId: 'iso9001',
    clause: '7.1.5',
    title: 'Ressources pour la mesure et le suivi',
    summary: 'Étalonnage et maîtrise des équipements de mesure.',
    owner: 'Maintenance / Qualité',
    evidence: 'Planning étalonnage 2026',
    defaultStatus: 'conforme',
    actionNote: 'Actions sur instruments en retard d’étalonnage.',
    auditNote: 'Preuves d’étalonnage en audit.'
  },
  {
    id: 'req-6-1-2',
    normId: 'iso14001',
    clause: '6.1.2',
    title: 'Aspects environnementaux',
    summary: 'Identification, critères et mise à jour des aspects significatifs.',
    owner: 'HSE',
    evidence: 'Matrice aspects / impacts révisée',
    defaultStatus: 'conforme',
    actionNote: 'Actions sur aspects nouveaux ou non maîtrisés.',
    auditNote: 'Audit environnemental / conformité matrice.'
  },
  {
    id: 'req-8-1',
    normId: 'iso14001',
    clause: '8.1',
    title: 'Planification et contrôle opérationnels',
    summary: 'Conditions opérationnelles pour les processus et prévention de la pollution.',
    owner: 'Exploitation',
    evidence: 'Modes opératoires et registres associés',
    defaultStatus: 'partiel',
    actionNote: 'Actions sur écarts opérationnels (déchets, rejets).',
    auditNote: 'Visites terrain et constats documentés.'
  },
  {
    id: 'req-9-1-1-env',
    normId: 'iso14001',
    clause: '9.1.1',
    title: 'Surveillance et mesure environnementales',
    summary: 'Suivi des indicateurs environnementaux et conformité réglementaire.',
    owner: 'HSE',
    evidence: 'Rapports de mesures et autocontrôles',
    defaultStatus: 'non_conforme',
    actionNote: 'Plan d’actions sur dépassements ou non-conformités réglementaires.',
    auditNote: 'Revue des preuves de conformité réglementaire.'
  },
  {
    id: 'req-6-1-2-ohs',
    normId: 'iso45001',
    clause: '6.1.2',
    title: 'Identification des dangers et évaluation des risques',
    summary: 'DDR, mesures de maîtrise et mise à jour après changement.',
    owner: 'SSE / Encadrement',
    evidence: 'DDR site + fiches de risques par poste',
    defaultStatus: 'conforme',
    actionNote: 'Actions sur risques résiduels ou habilitations.',
    auditNote: 'Audits SST / reprise des DDR.'
  },
  {
    id: 'req-8-1-3',
    normId: 'iso45001',
    clause: '8.1.3',
    title: 'Gestion du changement',
    summary: 'GMC pour activités, équipements et organisation impactant la SST.',
    owner: 'Managers opérationnels',
    evidence: 'Registre GMC + validations HSE',
    defaultStatus: 'partiel',
    actionNote: 'Actions issues des GMC non clos.',
    auditNote: 'Échantillon de GMC en audit interne.'
  },
  {
    id: 'req-10-2-ohs',
    normId: 'iso45001',
    clause: '10.2',
    title: 'Incidents, non-conformités et actions correctives',
    summary: 'Enquêtes, enregistrement et traitement des événements SST.',
    owner: 'QHSE',
    evidence: 'Registre incidents + liens NC',
    defaultStatus: 'partiel',
    actionNote: 'Correspond au module Incidents / Actions.',
    auditNote: 'Revue des dossiers incidents en audit.'
  }
];

function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveOverrides(/** @type {Record<string, { status: ConformityStatus }>} */ data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

/**
 * @returns {Array<ConformityRequirementSeed & { status: ConformityStatus }>}
 */
export function getRequirements() {
  const overrides = loadOverrides();
  return REQUIREMENTS_SEED.map((r) => {
    const st = overrides[r.id]?.status;
    const status =
      st === 'conforme' || st === 'partiel' || st === 'non_conforme' ? st : r.defaultStatus;
    return {
      ...r,
      status
    };
  });
}

/**
 * @param {string} requirementId
 * @param {ConformityStatus} status
 */
export function setRequirementStatus(requirementId, status) {
  if (status !== 'conforme' && status !== 'partiel' && status !== 'non_conforme') return;
  const overrides = loadOverrides();
  overrides[requirementId] = { status };
  saveOverrides(overrides);
}

export function getNormById(normId) {
  return CONFORMITY_NORMS.find((n) => n.id === normId) || null;
}

function loadImportedProofsRaw() {
  try {
    const raw = localStorage.getItem(IMPORTED_PROOFS_STORAGE_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function saveImportedProofsRaw(/** @type {ImportedDocumentProof[]} */ list) {
  try {
    localStorage.setItem(IMPORTED_PROOFS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota */
  }
}

/**
 * Preuves issues de l’import intelligent ISO (persistées localement, sans API).
 * @returns {ImportedDocumentProof[]}
 */
export function getImportedDocumentProofs() {
  return loadImportedProofsRaw().map((x) => ({ ...x }));
}

/**
 * @param {Omit<ImportedDocumentProof, 'id' | 'createdAt'> & { id?: string; createdAt?: string }} entry
 * @returns {string} id créé
 */
export function addImportedDocumentProof(entry) {
  const list = loadImportedProofsRaw();
  const id =
    entry.id && String(entry.id).trim()
      ? String(entry.id).trim()
      : `imp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const proofStatus =
    entry.proofStatus === 'missing' || entry.proofStatus === 'verify' ? entry.proofStatus : 'present';
  const row = {
    id,
    fileName: String(entry.fileName || 'document').slice(0, 240),
    requirementId: String(entry.requirementId || '').trim(),
    proofStatus,
    docTypeLabel: String(entry.docTypeLabel || 'Document').slice(0, 120),
    keyPoints: Array.isArray(entry.keyPoints) ? entry.keyPoints.map((s) => String(s).slice(0, 400)) : [],
    gaps: Array.isArray(entry.gaps) ? entry.gaps.map((s) => String(s).slice(0, 400)) : [],
    createdAt: entry.createdAt || new Date().toISOString(),
    validatedBy: entry.validatedBy ? String(entry.validatedBy).slice(0, 120) : ''
  };
  if (!row.requirementId) return '';
  list.push(row);
  saveImportedProofsRaw(list);
  return id;
}

/** @param {string} id */
export function removeImportedDocumentProof(id) {
  const list = loadImportedProofsRaw().filter((x) => x && x.id !== id);
  saveImportedProofsRaw(list);
}

/**
 * Synthèse lisible pour le bandeau « situation globale » (exigences + statuts persistés).
 */
export function computeComplianceSummary() {
  const reqs = getRequirements();
  const n = reqs.length;
  if (n === 0) {
    return {
      pct: 0,
      globalLabel: '—',
      globalTone: 'watch',
      message: 'Aucune exigence chargée.',
      nonOk: 0,
      partial: 0,
      ok: 0
    };
  }
  let pts = 0;
  let nonOk = 0;
  let partial = 0;
  let ok = 0;
  reqs.forEach((r) => {
    if (r.status === 'conforme') {
      pts += 100;
      ok += 1;
    } else if (r.status === 'partiel') {
      pts += 50;
      partial += 1;
    } else {
      nonOk += 1;
    }
  });
  const pct = Math.round(pts / n);
  /** @type {'ok'|'watch'|'risk'} */
  let globalTone = 'ok';
  let globalLabel = 'Situation saine';
  let message =
    'Toutes les exigences suivies sont au vert : poursuivez les revues et gardez les preuves à jour.';
  if (nonOk > 0) {
    globalTone = 'risk';
    globalLabel = 'Action requise';
    message = `Vous avez ${nonOk} exigence(s) en non-conformité : traitez-les en priorité avant la revue ou l’audit.`;
  } else if (partial > 0) {
    globalTone = 'watch';
    globalLabel = 'À consolider';
    message = `${partial} exigence(s) sont partiellement couvertes : complétez les preuves ou les actions liées.`;
  }
  return { pct, globalLabel, globalTone, message, nonOk, partial, ok };
}
