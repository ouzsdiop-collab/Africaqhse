import { risks as seedRisks } from '../data/mock.js';

const STORAGE_EXTRA = 'qhse-custom-risk-titles';

/**
 * Enregistre un titre de risque ajouté localement pour alimenter le sélecteur Incidents.
 * @param {string} title
 */
export function pushCustomRiskTitle(title) {
  const t = String(title || '').trim();
  if (!t) return;
  let arr = [];
  try {
    arr = JSON.parse(sessionStorage.getItem(STORAGE_EXTRA) || '[]');
    if (!Array.isArray(arr)) arr = [];
  } catch {
    arr = [];
  }
  const next = [t, ...arr.filter((x) => x !== t)];
  sessionStorage.setItem(STORAGE_EXTRA, JSON.stringify(next.slice(0, 50)));
}

/**
 * Titres pour le sélecteur « lier à un risque » (jeu initial + session).
 * @returns {string[]}
 */
export function getRiskTitlesForSelect() {
  const seedTitles = seedRisks.map((r) => r.title).filter(Boolean);
  let extra = [];
  try {
    extra = JSON.parse(sessionStorage.getItem(STORAGE_EXTRA) || '[]');
    if (!Array.isArray(extra)) extra = [];
  } catch {
    extra = [];
  }
  const seen = new Set();
  const out = [];
  for (const x of [...seedTitles, ...extra]) {
    if (x && !seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
}

/**
 * Marqueur stocké dans la description d’incident (aucun champ API dédié).
 * @param {string} title
 */
export function formatRiskLinkTag(title) {
  return `[Risque lié: ${String(title).trim()}]`;
}

/** Normalise pour comparer titres (espaces, casse conservée sur le contenu). */
export function normalizeRiskLinkTitle(t) {
  return String(t || '')
    .trim()
    .replace(/\s+/g, ' ');
}

const RISK_LINK_RE = /\[Risque lié:\s*([^\]]+?)\]/gi;

/**
 * @param {string} [description]
 * @param {string} riskTitle
 */
export function descriptionLinksToRisk(description, riskTitle) {
  const wanted = normalizeRiskLinkTitle(riskTitle);
  if (!wanted || typeof description !== 'string') return false;
  RISK_LINK_RE.lastIndex = 0;
  let m;
  while ((m = RISK_LINK_RE.exec(description)) !== null) {
    if (normalizeRiskLinkTitle(m[1]) === wanted) return true;
  }
  return false;
}

/**
 * @param {Array<{ description?: string, ref?: string, type?: string, status?: string, createdAt?: string }>} rows
 * @param {string} riskTitle
 */
export function incidentsLinkedToRiskFromApiRows(rows, riskTitle) {
  return (Array.isArray(rows) ? rows : [])
    .filter((r) => descriptionLinksToRisk(r?.description, riskTitle))
    .map((r) => ({
      ref: r.ref || 'Non renseigné',
      type: r.type || 'Non renseigné',
      status: r.status || 'Non renseigné',
      date: r.createdAt
        ? new Date(r.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : 'Non disponible'
    }));
}
