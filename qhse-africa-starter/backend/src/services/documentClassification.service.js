import { PDFParse } from 'pdf-parse';

/**
 * Pré-analyse métier légère (mots-clés / pondération) — extensible sans IA lourde.
 * Types : audit | incident | fds | iso | unknown
 */

/** @typedef {'audit' | 'incident' | 'fds' | 'iso' | 'unknown'} QhseDocType */

/** @type {Record<QhseDocType, { pageId: string | null, label: string }>} */
const MODULE_BY_TYPE = {
  audit: { pageId: 'audits', label: 'Audits' },
  incident: { pageId: 'incidents', label: 'Incidents' },
  fds: { pageId: 'products', label: 'Produits / FDS' },
  iso: { pageId: 'iso', label: 'Conformité & ISO' },
  unknown: { pageId: null, label: 'Non classé' }
};

/**
 * Mot-clé → [type, poids]. Poids plus élevés pour les termes très discriminants.
 * @type {Array<[string, QhseDocType, number]>}
 */
const KEYWORD_RULES = [
  // Audit
  ['audit', 'audit', 4],
  ['auditeur', 'audit', 4],
  ['auditrice', 'audit', 4],
  ['checklist', 'audit', 3],
  ['check-list', 'audit', 3],
  ['constat', 'audit', 2],
  ['constats', 'audit', 2],
  ['plan d’audit', 'audit', 4],
  ["plan d'audit", 'audit', 4],
  ['score', 'audit', 2],
  ['non-conformité', 'audit', 2],
  ['non conformité', 'audit', 2],
  ['non-conformites', 'audit', 2],
  ['écart', 'audit', 1],
  ['critère', 'audit', 2],
  ['critères', 'audit', 2],
  ['audit de site', 'audit', 3],
  ['site industriel', 'audit', 2],
  ['conformité audit', 'audit', 2],
  ['conformite audit', 'audit', 2],

  // Incident (éviter seuls mots trop génériques sauf en combinaison — pondération modérée)
  ['incident', 'incident', 5],
  ['accident', 'incident', 4],
  ['presqu’accident', 'incident', 4],
  ["presqu'accident", 'incident', 4],
  ['quasi-accident', 'incident', 4],
  ['blessure', 'incident', 4],
  ['blessé', 'incident', 3],
  ['dommage', 'incident', 3],
  ['gravité', 'incident', 4],
  ['sévérité', 'incident', 3],
  ['description des faits', 'incident', 3],
  ['témoin', 'incident', 2],
  ['enquête', 'incident', 2],
  ['investigation', 'incident', 2],
  ['lieu de l’événement', 'incident', 3],
  ["lieu de l'evenement", 'incident', 3],
  ['date de l’événement', 'incident', 2],
  ["date de l'evenement", 'incident', 2],
  ['description des blessures', 'incident', 2],

  // FDS / produit chimique
  ['fiche de données de sécurité', 'fds', 6],
  ['fiche de donnees de securite', 'fds', 6],
  ['fds', 'fds', 4],
  ['sds', 'fds', 4],
  ['msds', 'fds', 3],
  ['substance', 'fds', 3],
  ['substances', 'fds', 3],
  ['composition', 'fds', 3],
  ['ingrédient', 'fds', 2],
  ['ingredients', 'fds', 2],
  ['pictogramme', 'fds', 3],
  ['phrase h', 'fds', 3],
  ['phrase p', 'fds', 2],
  ['reach', 'fds', 3],
  ['clp', 'fds', 3],
  ['stockage', 'fds', 2],
  ['manipulation', 'fds', 2],
  ['toxicité', 'fds', 3],
  ['corrosif', 'fds', 3],
  ['inflammable', 'fds', 3],
  ['numéro cas', 'fds', 2],
  ['numero cas', 'fds', 2],
  ['cas no', 'fds', 2],
  ['produit chimique', 'fds', 4],
  ['danger pour', 'fds', 2],
  ['danger', 'fds', 2],
  ['identification du produit', 'fds', 3],
  ['nom commercial', 'fds', 2],
  ['fiche de sécurité', 'fds', 3],
  ['fiche de securite', 'fds', 3],

  // ISO / SMS (éviter « conformité » seul : recoupe « non conformité »)
  ['iso 9001', 'iso', 5],
  ['iso 14001', 'iso', 5],
  ['iso 45001', 'iso', 5],
  ['iso ', 'iso', 2],
  [' norme iso', 'iso', 3],
  ['exigence', 'iso', 2],
  ['exigences', 'iso', 2],
  ['procédure', 'iso', 2],
  ['procedure', 'iso', 2],
  ['politique qhse', 'iso', 3],
  ['système de management', 'iso', 3],
  ['systeme de management', 'iso', 3],
  ['sms ', 'iso', 2],
  ['chapitre', 'iso', 2],
  ['clause', 'iso', 3],
  ['annexe sl', 'iso', 2],
  ['contexte de l’organisme', 'iso', 3],
  ["contexte de l'organisme", 'iso', 3],
  ['revue de direction', 'iso', 3],
  ['documenté', 'iso', 1],
  ['documente', 'iso', 1],
  ['référentiel documentaire', 'iso', 2],
  ['referentiel documentaire', 'iso', 2],
  ['matrice documentaire', 'iso', 2],
  ['conformité iso', 'iso', 3],
  ['conformite iso', 'iso', 3],
  ['évaluation de la conformité', 'iso', 2],
  ['evaluation de la conformite', 'iso', 2]
];

const MIN_SCORE_TO_CLASSIFY = 3;
/** Si le 2e score est significatif et trop proche du 1er → non classé (évite le biais d’ordre audit/incident/fds/iso). */
const MIN_WIN_MARGIN = 3;
const UNKNOWN_CONFIDENCE = 22;
/** Limite pour rester prévisible en CPU sur PDF très longs */
const MAX_CLASSIFY_CHARS = 120_000;

/**
 * @param {string} s
 */
function normalizeForMatch(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {string} rawText
 * @returns {{
 *   detectedDocumentType: QhseDocType,
 *   confidence: number,
 *   detectedHints: string[],
 *   suggestedModule: { pageId: string | null, label: string }
 * }}
 */
export function classifyQhseDocument(rawText) {
  const clipped =
    String(rawText || '').length > MAX_CLASSIFY_CHARS
      ? String(rawText).slice(0, MAX_CLASSIFY_CHARS)
      : String(rawText || '');
  const text = normalizeForMatch(clipped);
  if (!text || text.length < 8) {
    return {
      detectedDocumentType: 'unknown',
      confidence: UNKNOWN_CONFIDENCE,
      detectedHints: [],
      suggestedModule: MODULE_BY_TYPE.unknown
    };
  }

  /** @type {Record<QhseDocType, number>} */
  const scores = {
    audit: 0,
    incident: 0,
    fds: 0,
    iso: 0,
    unknown: 0
  };

  /** @type {Array<{ type: QhseDocType, phrase: string, weight: number }>} */
  const hits = [];

  for (const [needle, type, weight] of KEYWORD_RULES) {
    const n = normalizeForMatch(needle);
    if (!n) continue;
    if (text.includes(n)) {
      scores[type] += weight;
      hits.push({ type, phrase: needle.trim(), weight });
    }
  }

  const ranked = /** @type {QhseDocType[]} */ (
    ['audit', 'incident', 'fds', 'iso']
  )
    .map((t) => ({ t, s: scores[t] }))
    .sort((a, b) => b.s - a.s);

  const best = ranked[0];
  const second = ranked[1] ?? { t: 'unknown', s: 0 };

  if (!best || best.s < MIN_SCORE_TO_CLASSIFY) {
    const sortedWeak = [...hits].sort((a, b) => b.weight - a.weight);
    const seenWeak = new Set();
    const hintsFromWeak = [];
    for (const h of sortedWeak) {
      const key = normalizeForMatch(h.phrase);
      if (seenWeak.has(key)) continue;
      seenWeak.add(key);
      hintsFromWeak.push(
        `${labelForType(h.type)} : « ${h.phrase.trim()} »`
      );
      if (hintsFromWeak.length >= 5) break;
    }
    return {
      detectedDocumentType: 'unknown',
      confidence: Math.min(45, UNKNOWN_CONFIDENCE + Math.min(20, best?.s ?? 0)),
      detectedHints: hintsFromWeak,
      suggestedModule: MODULE_BY_TYPE.unknown
    };
  }

  const margin = best.s - second.s;
  if (second.s >= MIN_SCORE_TO_CLASSIFY && margin < MIN_WIN_MARGIN) {
    const sortedAmb = [...hits].sort((a, b) => b.weight - a.weight);
    const seenAmb = new Set();
    const hintsAmb = [];
    for (const h of sortedAmb) {
      const key = normalizeForMatch(h.phrase);
      if (seenAmb.has(key)) continue;
      seenAmb.add(key);
      hintsAmb.push(`${labelForType(h.type)} : « ${h.phrase.trim()} »`);
      if (hintsAmb.length >= 8) break;
    }
    return {
      detectedDocumentType: 'unknown',
      confidence: Math.min(
        52,
        UNKNOWN_CONFIDENCE + Math.min(25, Math.round((best.s + second.s) / 2))
      ),
      detectedHints: hintsAmb,
      suggestedModule: MODULE_BY_TYPE.unknown
    };
  }

  const winner = best.t;
  const confidence = Math.round(
    Math.min(
      96,
      38 + margin * 4 + Math.min(28, best.s * 1.2)
    )
  );

  const hintsForWinner = dedupeHintPhrases(
    hits
      .filter((h) => h.type === winner)
      .sort((a, b) => b.weight - a.weight)
      .map((h) => h.phrase)
  )
    .slice(0, 8)
    .map((phrase) => `« ${phrase.trim()} »`);

  return {
    detectedDocumentType: winner,
    confidence,
    detectedHints: hintsForWinner,
    suggestedModule: MODULE_BY_TYPE[winner]
  };
}

/**
 * @param {string[]} phrases
 */
function dedupeHintPhrases(phrases) {
  const seen = new Set();
  const out = [];
  for (const p of phrases) {
    const key = normalizeForMatch(p);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

/**
 * @param {QhseDocType} t
 */
function labelForType(t) {
  switch (t) {
    case 'audit':
      return 'Audit';
    case 'incident':
      return 'Incident';
    case 'fds':
      return 'FDS';
    case 'iso':
      return 'ISO';
    default:
      return String(t);
  }
}

/**
 * Aplatit les lignes Excel (aperçu) en texte pour classification.
 * @param {unknown[][]} rows
 */
export function excelRowsToClassificationText(rows) {
  if (!Array.isArray(rows)) return '';
  const parts = [];
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    for (const cell of row) {
      const s = cellToClassString(cell);
      if (s) parts.push(s);
    }
  }
  return parts.join(' ');
}

/**
 * @param {unknown} v
 */
function cellToClassString(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

const MAX_FDS_PARSE_CHARS = 500_000;

/**
 * Normalise le texte extrait du PDF pour l’analyse regex.
 * @param {string} s
 */
function normalizeFdsText(s) {
  return String(s || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Déduplique en conservant l’ordre.
 * @param {string[]} arr
 */
function uniqStrings(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = String(x).trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

/**
 * Extraction heuristique FDS / SDS (sections 1, 3, 8 — multilingue FR/EN).
 * Le rendu PDF varie : résultats à toujours faire valider par un humain.
 *
 * @param {Buffer} pdfBuffer
 * @returns {Promise<{
 *   productName: string,
 *   supplier: string,
 *   casNumber: string | null,
 *   ceNumber: string | null,
 *   hStatements: string[],
 *   pStatements: string[],
 *   ghs: string[],
 *   vlep: string | null,
 *   storageClass: string | null
 * }>}
 */
export async function parseFdsDocument(pdfBuffer) {
  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
    const err = new Error('Buffer PDF requis');
    err.statusCode = 400;
    throw err;
  }

  const parser = new PDFParse({ data: pdfBuffer });
  let rawText = '';
  try {
    const textResult = await parser.getText();
    rawText = textResult?.text || '';
  } finally {
    try {
      await parser.destroy();
    } catch {
      /* ignore */
    }
  }

  let text = normalizeFdsText(rawText);
  if (text.length > MAX_FDS_PARSE_CHARS) {
    text = text.slice(0, MAX_FDS_PARSE_CHARS);
  }

  /** @type {string | null} */
  let productName = '';
  const namePatterns = [
    /(?:nom\s*(?:commercial|du\s*produit)|d[eé]nomination\s*(?:commerciale)?|product\s*(?:identifier|name)|commercial\s*name|trade\s*name)\s*[:\s]+([^\n]{2,200})/i,
    /(?:section\s*1[^\n]*identification[^\n]*\n+)([^\n]{2,200})/i
  ];
  for (const re of namePatterns) {
    const m = text.match(re);
    if (m && m[1]) {
      productName = m[1].replace(/\s+/g, ' ').trim().replace(/^[;:,.\s]+/, '');
      if (productName.length >= 2) break;
    }
  }
  if (!productName) {
    const firstLine = text.split('\n').map((l) => l.trim()).find((l) => l.length > 3 && l.length < 180);
    productName = firstLine || 'Produit (FDS)';
  }

  let supplier = '';
  const supPatterns = [
    /(?:supplier|company\s*name|manufacturer|fabricant|fournisseur|r[eé]f[eé]rent|details\s*of\s*the\s*supplier)\s*[:\s]+([^\n]{2,220})/i,
    /(?:nom\s*de\s*l['’]entreprise|soci[eé]t[eé])\s*[:\s]+([^\n]{2,220})/i
  ];
  for (const re of supPatterns) {
    const m = text.match(re);
    if (m && m[1]) {
      supplier = m[1].replace(/\s+/g, ' ').trim();
      if (supplier.length >= 2) break;
    }
  }

  const casMatches = text.match(/\b\d{2,7}-\d{2}-\d\b/g);
  /** @type {string | null} */
  const casNumber = casMatches && casMatches.length ? casMatches[0] : null;

  const ceMatches = text.match(
    /\b\d{3}-\d{3}-\d\b|\b\d{3}-\d{4}-\d\b|\bEC\s*(?:no\.?|n[o°]\s*)?\s*:?\s*\d{3}-\d{3}-\d\b/gi
  );
  let ceNumber = null;
  if (ceMatches && ceMatches.length) {
    const raw = ceMatches[0];
    const norm = raw.replace(/^EC\s*(?:no\.?|n[o°]\s*)?\s*:?\s*/i, '').trim();
    ceNumber = /\d{3}-\d{3,4}-\d/.test(norm) ? norm : null;
  }

  const hRaw = text.match(/\bH\d{3}(?:[a-z]{1,3}\d?)?\b/gi) || [];
  const hStatements = uniqStrings(hRaw.map((x) => x.toUpperCase()));

  const pRaw = text.match(/\bP\d{3,4}[a-z]?\b/gi) || [];
  const pStatements = uniqStrings(pRaw.map((x) => x.toUpperCase()));

  const ghsSet = new Set();
  const ghsWord = text.match(/\bGHS\s*0?([1-9])\b/gi) || [];
  for (const w of ghsWord) {
    const d = w.match(/0?([1-9])/i);
    if (d) ghsSet.add(`GHS0${d[1]}`);
  }
  const pictoLine = text.match(/\b(?:GHS|SGH)\s*0?([1-9])\b/gi) || [];
  for (const w of pictoLine) {
    const d = w.match(/0?([1-9])/i);
    if (d) ghsSet.add(`GHS0${d[1]}`);
  }
  const ghs = [...ghsSet].sort();

  let vlep = null;
  const vleBlock =
    text.match(
      /[^\n]{0,40}(?:VLEP?|VME|TLV|STEL|valeur\s*limite\s*d['’]?exposition|exposure\s*limit|occupational\s*exposure)[^\n]{0,220}/gi
    ) || [];
  if (vleBlock.length) {
    vlep = vleBlock
      .slice(0, 3)
      .map((s) => s.replace(/\s+/g, ' ').trim())
      .join(' · ')
      .slice(0, 600);
  }

  let storageClass = null;
  const st =
    text.match(
      /(?:classe\s*de\s*stockage|storage\s*class|LGK|StorCat|classe\s*de\s*conservation)\s*[:\s]+([^\n]{1,120})/i
    ) ||
    text.match(/\b(?:classe|class)\s+([0-9]{1,2}[a-z]?)\s*(?:de\s*stockage)?/i);
  if (st && st[1]) storageClass = st[1].replace(/\s+/g, ' ').trim().slice(0, 120);

  return {
    productName,
    supplier,
    casNumber,
    ceNumber,
    hStatements,
    pStatements,
    ghs,
    vlep,
    storageClass
  };
}
