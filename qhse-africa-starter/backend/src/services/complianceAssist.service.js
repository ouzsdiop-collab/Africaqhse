/**
 * Assistance « conformité » 100 % locale : recoupement textuel + signaux applicatifs.
 * Aucun appel réseau vers un fournisseur d’IA externe.
 */

import { prisma } from '../db.js';
import { findAllImportHistory } from './importHistory.service.js';
import { resolveClauseHints } from '../data/isoClauseHints.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';

const STOPWORDS = new Set([
  'les',
  'des',
  'une',
  'pour',
  'dans',
  'avec',
  'sans',
  'sont',
  'être',
  'cette',
  'comme',
  'tout',
  'tous',
  'plus',
  'moins',
  'vers',
  'chez',
  'leurs',
  'leur',
  'aux',
  'par',
  'sur',
  'pas',
  'qui',
  'que',
  'son',
  'ses',
  'est',
  'sont',
  'the',
  'and',
  'pdf',
  'doc',
  'xlsx'
]);

/**
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  const s = String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, ' ');
  return s
    .split(/[^a-z0-9]+/i)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/**
 * @param {string[]} a
 * @param {string[]} b
 */
function jaccard(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const x of A) {
    if (B.has(x)) inter += 1;
  }
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}

function isNcOpenStatus(status) {
  const s = String(status || '').toLowerCase();
  if (!s) return true;
  return !/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(s);
}

function isActionOverdue(row) {
  if (!row?.dueDate) return false;
  const s = String(row.status || '').toLowerCase();
  if (/termin|clos|ferm|fait|complete|réalis|realis/i.test(s)) return false;
  return new Date(row.dueDate).getTime() < Date.now();
}

/**
 * @param {{ tenantId?: string | null, siteId?: string | null }} opt
 */
async function loadAppSignals(opt) {
  const tenantId =
    opt.tenantId != null && String(opt.tenantId).trim() !== ''
      ? String(opt.tenantId).trim()
      : null;
  if (!tenantId) {
    return { overdueActions: 0, openNc: 0, openActionsSample: 0 };
  }
  const siteId =
    opt.siteId != null && String(opt.siteId).trim() !== '' ? String(opt.siteId).trim() : null;
  const actionWhere = { tenantId };
  const ncWhere = { tenantId };
  if (siteId) {
    actionWhere.siteId = siteId;
    ncWhere.siteId = siteId;
  }

  const [actions, ncs] = await Promise.all([
    prisma.action.findMany({
      where: actionWhere,
      select: { dueDate: true, status: true }
    }),
    prisma.nonConformity.findMany({
      where: ncWhere,
      select: { status: true },
      take: 400
    })
  ]);

  const overdueActions = actions.filter(isActionOverdue).length;
  const openNc = ncs.filter((r) => isNcOpenStatus(r.status)).length;

  return { overdueActions, openNc, openActionsSample: Math.min(actions.length, 50) };
}

/**
 * Aperçu risques / incidents textuellement liés à la clause (sans appel IA externe).
 * @param {{ tenantId: string | null; siteId?: string | null; clause: string; normId?: string }} opt
 */
async function loadIsoTerrainLinks(opt) {
  const t = normalizeTenantId(opt.tenantId);
  const clause = String(opt.clause || '').trim();
  if (!t) {
    return {
      risks: [],
      incidents: [],
      summary:
        'Risques et incidents : connectez-vous avec un contexte organisation pour afficher les liens terrain.'
    };
  }
  const tf = prismaTenantFilter(t);
  const siteId =
    opt.siteId != null && String(opt.siteId).trim() !== '' ? String(opt.siteId).trim() : null;
  const siteFrag = siteId ? { siteId } : {};

  const [riskRows, incidentRows] = await Promise.all([
    prisma.risk.findMany({
      where: { ...tf, ...siteFrag },
      take: 100,
      orderBy: { updatedAt: 'desc' },
      select: { ref: true, title: true, status: true, description: true }
    }),
    prisma.incident.findMany({
      where: { ...tf, ...siteFrag },
      take: 100,
      orderBy: { createdAt: 'desc' },
      select: { ref: true, type: true, description: true, severity: true }
    })
  ]);

  const needles = [
    clause,
    ...clause.split(/[._]/).filter((x) => x.length >= 2),
    String(opt.normId || '')
  ].filter(Boolean);

  function textHasLink(text) {
    const u = String(text || '').toLowerCase();
    if (!u) return false;
    if (clause) {
      const flex = clause
        .toLowerCase()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\\\./g, '[._-]');
      try {
        if (new RegExp(`\\b${flex}\\b`, 'i').test(u)) return true;
      } catch {
        /* ignore */
      }
    }
    for (const n of needles) {
      const n0 = String(n).toLowerCase();
      if (n0.length >= 2 && u.includes(n0)) return true;
    }
    return false;
  }

  const risks = riskRows
    .filter((r) => textHasLink(r.title) || textHasLink(r.description))
    .slice(0, 5)
    .map((r) => ({
      ref: r.ref || '',
      title: r.title,
      status: r.status || ''
    }));

  const incidents = incidentRows
    .filter((i) => textHasLink(i.description) || textHasLink(i.type))
    .slice(0, 5)
    .map((i) => ({
      ref: i.ref,
      type: i.type,
      severity: i.severity || ''
    }));

  const summary =
    risks.length || incidents.length
      ? `${risks.length} risque(s) et ${incidents.length} incident(s) repérés par mots-clés pour la clause ${clause || 'n/c'} (vérification humaine requise).`
      : `Aucun risque/incident évident sur les extraits récents pour la clause ${clause || 'n/c'} — contrôler manuellement le registre.`;

  return { risks, incidents, summary };
}

/**
 * @param {import('@prisma/client').ImportHistory[]} rows
 * @returns {{ name: string; source: string }[]}
 */
function corpusFromImportHistory(rows) {
  const out = [];
  for (const r of rows) {
    const name = String(r.fileName || '').trim();
    if (!name) continue;
    const mod = String(r.suggestedModule || r.detectedDocumentType || '').toLowerCase();
    const label = [name, mod, r.suggestedModuleLabel].filter(Boolean).join(' ');
    out.push({ name, source: 'import', text: label });
  }
  return out;
}

/**
 * @param {{ normId: string; clause: string; title: string; summary: string; evidence?: string }} req
 * @param {{ name: string; version?: string }[]} controlledDocs
 * @param {{ name: string; source: string; text: string }[]} extraCorpus
 */
function scoreAgainstCorpus(req, controlledDocs, extraCorpus) {
  const hints = resolveClauseHints(req.normId, req.clause);
  const reqText = [req.clause, req.title, req.summary, req.evidence || '', ...hints].join(' ');
  const reqTokens = tokenize(reqText);

  /** @type {{ name: string; source: string; score: number; jaccard: number }[]} */
  const matches = [];

  for (const d of controlledDocs) {
    const line = [d.name, d.version || ''].join(' ');
    const dt = tokenize(line);
    const jac = jaccard(reqTokens, dt);
    matches.push({
      name: d.name,
      source: 'document_maitrise',
      score: jac,
      jaccard: jac
    });
  }

  for (const e of extraCorpus) {
    const dt = tokenize(e.text);
    const jac = jaccard(reqTokens, dt);
    matches.push({
      name: e.name,
      source: e.source,
      score: jac * 0.92,
      jaccard: jac
    });
  }

  matches.sort((a, b) => b.score - a.score);
  const positive = matches.filter((m) => m.jaccard >= 0.04 || m.score >= 0.04);
  const top = matches.slice(0, 8);

  const maxJ = top.length ? Math.max(...top.map((t) => t.jaccard)) : 0;
  const countStrong = positive.filter((m) => m.jaccard >= 0.08).length;

  return { top, maxJ, countStrong, hintsUsed: hints.slice(0, 12) };
}

/**
 * @param {'conforme' | 'partiel' | 'non_conforme'} base
 * @param {number} penalty
 */
function applyPenalty(base, penalty) {
  const order = ['conforme', 'partiel', 'non_conforme'];
  let i = order.indexOf(base);
  i = Math.min(order.length - 1, i + penalty);
  return /** @type {'conforme' | 'partiel' | 'non_conforme'} */ (order[i]);
}

/**
 * Analyse déterministe — à valider par un humain.
 * @param {{
 *   requirement: {
 *     id: string;
 *     normId: string;
 *     normCode?: string;
 *     clause: string;
 *     title: string;
 *     summary: string;
 *     evidence?: string;
 *     currentStatus?: string;
 *   };
 *   controlledDocuments?: { name: string; version?: string }[];
 *   siteId?: string | null;
 * }} input
 */
export async function analyzeComplianceAssist(input) {
  const req = input?.requirement;
  if (!req || !String(req.id || '').trim()) {
    const err = new Error('Exigence invalide : identifiant requis.');
    err.statusCode = 400;
    throw err;
  }

  const controlled = Array.isArray(input.controlledDocuments) ? input.controlledDocuments : [];

  const tenantId = input?.tenantId ?? null;
  const historyRows = await findAllImportHistory(tenantId);
  const recent = historyRows.slice(0, 100);
  const extraCorpus = corpusFromImportHistory(recent);

  const { top, maxJ, countStrong, hintsUsed } = scoreAgainstCorpus(
    {
      normId: req.normId,
      clause: req.clause,
      title: req.title,
      summary: req.summary,
      evidence: req.evidence
    },
    controlled,
    extraCorpus
  );

  const appSignals = await loadAppSignals({ tenantId, siteId: input.siteId });

  let penalty = 0;
  if (appSignals.overdueActions >= 8) penalty += 1;
  if (appSignals.openNc >= 6) penalty += 1;
  if (appSignals.overdueActions >= 3 && appSignals.openNc >= 2) penalty += 1;

  /** @type {'conforme' | 'partiel' | 'non_conforme'} */
  let suggested;
  if (maxJ >= 0.14 && countStrong >= 2) {
    suggested = 'conforme';
  } else if (maxJ >= 0.07 || countStrong >= 1 || top[0]?.jaccard >= 0.06) {
    suggested = 'partiel';
  } else {
    suggested = 'non_conforme';
  }

  suggested = applyPenalty(suggested, penalty);

  const statusLabels = {
    conforme: 'Conforme',
    partiel: 'Partiellement conforme',
    non_conforme: 'Non conforme'
  };

  const matchedDocuments = top.slice(0, 5).map((m) => ({
    name: m.name,
    source: m.source === 'import' ? 'Import documentaire' : 'Document maîtrisé',
    relevance:
      m.jaccard >= 0.1 ? 'élevée' : m.jaccard >= 0.05 ? 'moyenne' : 'faible'
  }));

  const parts = [];
  parts.push(
    `Analyse automatique basée sur le libellé de l’exigence, des mots-clés thématiques et le croisement avec ${controlled.length} document(s) maîtrisé(s) transmis et ${extraCorpus.length} fichier(s) récent(s) dans l’historique d’import.`
  );
  if (maxJ < 0.05) {
    parts.push(
      'Peu de mots communs entre l’exigence et les titres de documents disponibles : la preuve documentaire peut manquer ou être mal référencée.'
    );
  } else if (countStrong >= 2) {
    parts.push(
      'Plusieurs documents semblent alignés sur le thème de l’exigence : la preuve est plausible, à confirmer sur le contenu réel.'
    );
  } else {
    parts.push(
      'Un rapprochement partiel existe avec au moins un document ou import : compléter ou actualiser les preuves si nécessaire.'
    );
  }
  if (appSignals.overdueActions > 0 || appSignals.openNc > 0) {
    parts.push(
      `Côté application : ${appSignals.openNc} non-conformité(s) ouverte(s) et ${appSignals.overdueActions} action(s) en retard — facteurs de vigilance pour le SMS.`
    );
  }

  /** @type {string[]} */
  const recommendedActions = [];
  if (suggested === 'non_conforme') {
    recommendedActions.push('Identifier ou rédiger la procédure / enregistrement attendu pour cette clause.');
    recommendedActions.push('Planifier une revue terrain avec le responsable désigné.');
  } else if (suggested === 'partiel') {
    recommendedActions.push('Vérifier que les documents listés couvrent bien toute l’exigence (pas seulement le titre).');
    recommendedActions.push('Mettre à jour la preuve documentaire ou la lier explicitement dans le registre SMS.');
  } else {
    recommendedActions.push('Conserver la preuve à jour et noter la prochaine date de revue.');
    recommendedActions.push('Échantillonner le contenu en audit interne pour valider l’efficacité.');
  }
  if (appSignals.overdueActions >= 3) {
    recommendedActions.push('Traiter en priorité les actions en retard liées au thème de l’exigence.');
  }
  if (appSignals.openNc >= 2) {
    recommendedActions.push('Revoir les NC ouvertes susceptibles d’impacter cette exigence.');
  }

  const terrainLinks = await loadIsoTerrainLinks({
    tenantId,
    siteId: input.siteId,
    clause: req.clause,
    normId: req.normId
  });

  /** @type {string[]} */
  const missingEvidence = [];
  if (!controlled.length) {
    missingEvidence.push(
      'Aucun document maîtrisé transmis dans la requête : fournir les titres de procédures / enregistrements pour affiner la preuve.'
    );
  }
  if (maxJ < 0.05) {
    missingEvidence.push(
      'Faible recoupement textuel avec les documents disponibles : la preuve attendue pour cette clause est probablement absente ou mal référencée.'
    );
  }
  if (countStrong === 0 && maxJ < 0.08) {
    missingEvidence.push(
      'Pas de correspondance documentaire solide : prévoir pièce(s) terrain (enregistrement, relevé, rapport) ou lien explicite dans le SMS.'
    );
  }
  if (suggested !== 'conforme') {
    missingEvidence.push(
      'Consolider ou valider la preuve avant de conclure à la conformité pour cette exigence.'
    );
  }

  /** @type {'high' | 'medium' | 'low'} */
  let priority = 'low';
  if (
    suggested === 'non_conforme' ||
    appSignals.overdueActions >= 6 ||
    appSignals.openNc >= 5
  ) {
    priority = 'high';
  } else if (
    suggested === 'partiel' ||
    appSignals.overdueActions >= 2 ||
    appSignals.openNc >= 2 ||
    maxJ < 0.06 ||
    (terrainLinks.risks.length > 0 && suggested !== 'conforme')
  ) {
    priority = 'medium';
  }

  let confidence =
    0.26 +
    Math.min(0.52, maxJ * 2.35) +
    Math.min(0.22, countStrong * 0.065) -
    penalty * 0.07;
  confidence = Math.max(0.14, Math.min(0.93, Math.round(confidence * 100) / 100));

  const currentSt = req.currentStatus ? String(req.currentStatus) : '';
  const statusAnalysis = [
    currentSt ? `Statut enregistré dans le registre : ${currentSt}.` : '',
    `Lecture moteur : ${statusLabels[suggested]} (croisement documents maîtrisés, imports récents, NC & actions ouvertes, liens risques/incidents).`,
    parts.length > 1 ? parts[1] : parts[0]
  ]
    .filter(Boolean)
    .join(' ');

  const isoAnalysis = {
    type: 'iso_analysis',
    confidence,
    content: {
      statusAnalysis,
      missingEvidence,
      recommendedActions: [...recommendedActions],
      priority,
      terrainLinks: {
        risks: terrainLinks.risks,
        incidents: terrainLinks.incidents,
        summary: terrainLinks.summary
      }
    }
  };

  return {
    suggestedStatus: suggested,
    statusLabel: statusLabels[suggested],
    explanation: parts.join(' '),
    recommendedActions,
    matchedDocuments,
    normHintsUsed: hintsUsed,
    scores: {
      maxDocumentSimilarity: Math.round(maxJ * 1000) / 1000,
      strongDocumentMatches: countStrong,
      openNonConformities: appSignals.openNc,
      overdueActions: appSignals.overdueActions
    },
    isoAnalysis,
    method: 'rules-local',
    humanValidationRequired: true,
    disclaimer:
      'Analyse structurée (champ isoAnalysis, JSON) produite par des règles internes et données applicatives — pas de LLM externe. Elle ne remplace ni l’audit ni le jugement professionnel ; validez ou rejetez explicitement.'
  };
}
