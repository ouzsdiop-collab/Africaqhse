/**
 * Phase 3 — Proposition de préremplissage à partir du texte extrait (heuristiques, pas d’écriture BDD).
 * Extensible : ajouter des extracteurs par type ou des règles Excel structurées.
 */

/**
 * @param {string} s
 */
function normalizeText(s) {
  return String(s || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

/**
 * @param {string} text
 * @param {string[]} labels
 * @param {number} maxLen
 */
function extractAfterLabel(text, labels, maxLen = 800) {
  const t = text;
  for (const raw of labels) {
    const esc = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`${esc}\\s*[:.;]\\s*([^\\n]+)`, 'i');
    const m = t.match(re);
    if (m?.[1]) return m[1].trim().slice(0, maxLen);
  }
  return '';
}

/**
 * @param {string} text
 * @param {RegExp} re
 */
function firstMatch(text, re) {
  const m = text.match(re);
  return m ? m[1].trim() : '';
}

/**
 * @param {unknown[][] | null} rows
 */
function excelHeaderMap(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return { headers: [], dataRows: [] };
  const headerRow = rows[0];
  if (!Array.isArray(headerRow)) return { headers: [], dataRows: rows };
  const headers = headerRow.map((c) =>
    String(c || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .trim()
  );
  return { headers, dataRows: rows.slice(1) };
}

/**
 * @param {string[]} headers
 * @param {unknown[][]} dataRows
 * @param {string[]} aliases
 */
function pickExcelColumn(headers, dataRows, aliases) {
  const idx = headers.findIndex((h) =>
    aliases.some((a) => h.includes(a))
  );
  if (idx < 0 || !dataRows[0]) return '';
  const v = dataRows[0][idx];
  return v != null ? String(v).trim().slice(0, 2000) : '';
}

/**
 * @param {string} text
 */
function extractAuditRef(text) {
  const patterns = [
    /\b(AUD[-\s]?\d{2,}(?:[-/]\d{2,})*)\b/i,
    /\b(AUDIT[-\s]?\d{2,}(?:[-/]\d{2,})*)\b/i,
    /\b(r[ée]f(?:[ée]rence)?|ref)\s*[:.;]?\s*([A-Z0-9][A-Z0-9\s\-/]{4,40})/i
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return (m[2] || m[1]).replace(/\s+/g, ' ').trim().slice(0, 64);
  }
  return '';
}

/**
 * @param {string} text
 */
function extractScore(text) {
  const m =
    text.match(/(?:score|note)\s*[:.;]?\s*(\d{1,3})(?:\s*%)?/i) ||
    text.match(/\b(\d{1,3})\s*%\s*(?:conform|global|audit)/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (Number.isNaN(n) || n < 0 || n > 100) return null;
  return n;
}

/**
 * @param {string} text
 */
function extractAuditStatus(text) {
  const tl = text.toLowerCase();
  if (/(cl[oô]tur|termin|clos|finalis)/i.test(tl)) return 'terminé';
  if (/(en cours|planifi|program)/i.test(tl)) return 'en cours';
  if (/(pr[eé]vu|a venir|à venir)/i.test(tl)) return 'planifié';
  return '';
}

/**
 * @param {string} text
 */
function extractChecklistBullets(text) {
  const lines = text.split('\n');
  const out = [];
  let capture = false;
  for (const line of lines) {
    const t = line.trim();
    if (/^checklist|^liste de v[eé]rification/i.test(t)) {
      capture = true;
      continue;
    }
    if (capture && /^[-•*]\s+.+/.test(t)) {
      out.push(t.replace(/^[-•*]\s+/, '').slice(0, 300));
    } else if (capture && /^\d+[\).]\s+.+/.test(t)) {
      out.push(t.replace(/^\d+[\).]\s+/, '').slice(0, 300));
    }
  }
  if (out.length) return out.slice(0, 30);
  for (const line of lines) {
    const t = line.trim();
    if (/^[-•*]\s+.{12,}/.test(t)) {
      out.push(t.replace(/^[-•*]\s+/, '').slice(0, 300));
    }
    if (out.length >= 8) break;
  }
  return out.slice(0, 15);
}

/**
 * @param {string} text
 */
function mapIncidentType(text) {
  const tl = text.toLowerCase();
  if (/(quasi|presqu|presq)/i.test(tl) && /accident/i.test(tl))
    return 'Quasi-accident';
  if (/\baccident\b/i.test(tl)) return 'Accident';
  if (/(environnement|déversement|fuite|pollution)/i.test(tl))
    return 'Environnement';
  if (/(engin|circulation|véhicule|chariot)/i.test(tl))
    return 'Engin / circulation';
  return '';
}

/**
 * @param {string} text
 */
function extractSeverity(text) {
  const tl = text.toLowerCase();
  if (/(gravité|sévérité)\s*[:.;]?\s*crit/i.test(tl)) return 'critique';
  if (/(gravité|sévérité)\s*[:.;]?\s*faib/i.test(tl)) return 'faible';
  if (/\bcritique\b/i.test(tl)) return 'critique';
  if (/\bfaible\b/i.test(tl)) return 'faible';
  if (/\bmoyen(ne)?\b/i.test(tl)) return 'moyen';
  return '';
}

/**
 * @param {string} text
 */
function extractDateHint(text) {
  const m =
    text.match(
      /(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})|(\d{4}-\d{2}-\d{2})/
    );
  return m ? m[0] : '';
}

/**
 * @param {string} text
 */
function extractDescriptionBlock(text) {
  const after = extractAfterLabel(text, [
    'description',
    'description des faits',
    'synthèse',
    'compte rendu'
  ], 2000);
  if (after) return after;
  const para = text.split(/\n\n+/).find((p) => p.trim().length > 40);
  return para ? para.trim().slice(0, 1600) : text.slice(0, 800).trim();
}

/**
 * @param {string} text
 */
function extractCasNumber(text) {
  const m = text.match(/\b(\d{2,7}-\d{2}-\d)\b/);
  return m ? m[1] : '';
}

/**
 * @param {string} text
 */
function extractIsoClause(text) {
  const m = text.match(
    /\bclause\s*[:.;]?\s*([0-9]+(?:\.[0-9]+){0,3})\b/i
  );
  if (m) return m[1];
  /** Évite de confondre avec des versions « 4.2 » : favoriser les numéros type exigence ISO (x.y.z). */
  const m2 = text.match(/\b([0-9]{1,2}\.[0-9]{1,2}\.[0-9]{1,2})\b/);
  return m2 ? m2[1] : '';
}

/**
 * @param {string} docType
 * @param {string} sourceText
 * @param {unknown[][] | null} excelRows
 * @param {string} originalName
 */
function buildForType(docType, sourceText, excelRows, originalName) {
  const text = normalizeText(sourceText);
  const { headers, dataRows } = excelHeaderMap(excelRows);

  if (docType === 'audit') {
    let ref = extractAuditRef(text);
    let site =
      extractAfterLabel(text, ['site', 'établissement', 'lieu', 'usine']) ||
      pickExcelColumn(headers, dataRows, ['site', 'lieu', 'usine']);
    let score = extractScore(text);
    if (score == null) {
      const cell = pickExcelColumn(headers, dataRows, ['score', 'note', '%']);
      const n = cell ? parseInt(cell.replace(/\D/g, ''), 10) : NaN;
      if (!Number.isNaN(n) && n >= 0 && n <= 100) score = n;
    }
    const status = extractAuditStatus(text) || extractAfterLabel(text, ['statut', 'status']);
    const checklist = extractChecklistBullets(text);
    if (!ref && originalName) {
      const m = originalName.match(/(AUD[\s-]?\d+)/i);
      if (m) ref = m[1].replace(/\s+/g, '');
    }
    return {
      ref: ref || '',
      site: site || '',
      score: score != null ? score : null,
      status: status || '',
      checklist: checklist.length ? checklist : null
    };
  }

  if (docType === 'incident') {
    const type =
      mapIncidentType(text) ||
      extractAfterLabel(text, ['type', 'nature', 'catégorie']).slice(0, 80);
    const site =
      extractAfterLabel(text, ['site', 'lieu', 'zone', 'emplacement']) ||
      pickExcelColumn(headers, dataRows, ['site', 'lieu', 'zone']);
    const severity = extractSeverity(text);
    const description = extractDescriptionBlock(text);
    const titre =
      extractAfterLabel(text, ['titre', 'objet', 'sujet'], 200) ||
      text.split('\n').find((l) => l.trim().length > 5)?.trim().slice(0, 120) ||
      '';
    return {
      titre: titre || '',
      type: type || '',
      site: site || '',
      gravite: severity || '',
      severity: severity || '',
      description: description || '',
      date: extractDateHint(text) || ''
    };
  }

  if (docType === 'fds') {
    return {
      nomProduit:
        extractAfterLabel(text, [
          'nom commercial',
          'identification du produit',
          'produit',
          'dénomination'
        ]) ||
        text.split('\n').find((l) => /produit|substance|fds|sds/i.test(l))?.trim().slice(0, 200) ||
        '',
      substance: extractAfterLabel(text, ['substance', 'composition', 'ingrédient']),
      cas: extractCasNumber(text),
      danger:
        extractAfterLabel(text, ['danger', 'classification', 'pictogramme']) ||
        '',
      stockage: extractAfterLabel(text, ['stockage', 'conservation', 'entreposage']),
      precautions: extractAfterLabel(text, ['précaution', 'precaution', 'phrase p', 'manipulation'])
    };
  }

  if (docType === 'iso') {
    return {
      reference:
        firstMatch(text, /\b(ISO\s*[0-9]{4,5}(?::[0-9]{4})?)\b/i) ||
        extractAfterLabel(text, ['référence', 'reference', 'document', 'code']),
      clause: extractIsoClause(text) || extractAfterLabel(text, ['clause', 'article'], 80),
      exigence: extractAfterLabel(text, ['exigence', 'requirement']),
      procedure:
        extractAfterLabel(text, ['procédure', 'procedure', 'mode opératoire']) ||
        '',
      statut: extractAuditStatus(text) || extractAfterLabel(text, ['statut', 'état'])
    };
  }

  return {
    note: 'Type de document non déterminé — saisie manuelle recommandée.'
  };
}

/**
 * @param {string} docType
 * @param {Record<string, unknown>} data
 */
function computeMissing(docType, data) {
  /** @type {string[]} */
  const keys = [];
  if (docType === 'audit') {
    if (!data.ref) keys.push('ref');
    if (!data.site) keys.push('site');
    if (data.score == null || data.score === '') keys.push('score');
    if (!data.status) keys.push('status');
  } else if (docType === 'incident') {
    if (!data.type) keys.push('type');
    if (!data.site) keys.push('site');
    if (!data.gravite && !data.severity) keys.push('gravité');
  } else if (docType === 'fds') {
    if (!data.nomProduit) keys.push('nomProduit');
    if (!data.substance) keys.push('substance');
    if (!data.danger) keys.push('danger');
    if (!data.stockage) keys.push('stockage');
  } else if (docType === 'iso') {
    if (!data.reference) keys.push('référence');
    if (!data.clause) keys.push('clause');
    if (!data.exigence) keys.push('exigence');
  } else {
    keys.push('classification');
  }
  return keys;
}

/**
 * @param {{
 *   detectedDocumentType: string,
 *   suggestedModule: { pageId: string | null, label: string } | null,
 *   confidence: number,
 *   detectedHints: string[],
 *   sourceText: string,
 *   excelRows: unknown[][] | null,
 *   originalName: string
 * }} input
 */
export function buildPrefillPayload(input) {
  const docType = String(input.detectedDocumentType || 'unknown');
  const sourceText = input.sourceText || '';

  if (docType === 'unknown') {
    return {
      prefillData: {
        note: 'Données insuffisantes ou document non classé — complétez manuellement après vérification.'
      },
      missingFields: ['classification', 'champs_métier']
    };
  }

  const prefillData = buildForType(
    docType,
    sourceText,
    input.excelRows,
    input.originalName || ''
  );

  return {
    prefillData,
    missingFields: computeMissing(docType, prefillData)
  };
}
