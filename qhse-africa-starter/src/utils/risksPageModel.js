/**
 * Modèle et analyses « registre risques » · extrait de pages/risks.js.
 * Reste sans effet de bord (sauf regex state sur RISK_LINK_RE lors du scan).
 */

import {
  parseRiskMatrixGp,
  riskCriticalityFromMeta,
  riskTierFromGp,
  riskLevelLabelFromTier
} from './riskMatrixCore.js';

export { sortRisksByPriority } from './risksSort.js';

/** Marqueur `[Risque lié: …]` dans la description d’incident (aligné API incidents). */
export const RISK_LINK_RE = /\[Risque lié:\s*([^\]]+?)\]/gi;

export function normalizeRiskLinkTitle(t) {
  return String(t || '')
    .trim()
    .replace(/\s+/g, ' ');
}

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
export function incidentsLinkedToRiskFromRows(rows, riskTitle) {
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
        : 'Non renseigné'
    }));
}

export const MONTH_SHORT_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

/**
 * Histogramme mensuel : nb. fiches critiques + score moyen G×P (données registre chargées).
 * @param {Array<{ meta?: string, updatedAt?: string }>} uiRisks
 */
export function buildEvolutionSeriesFromRisks(uiRisks, maxMonths = 6) {
  if (!Array.isArray(uiRisks) || !uiRisks.length) return [];
  /** @type {Map<string, { crit: number, sumGp: number, n: number }>} */
  const byMonth = new Map();
  uiRisks.forEach((r) => {
    const gp = parseRiskMatrixGp(r.meta);
    const product = gp ? gp.g * gp.p : 0;
    const crit = riskTierBucket(r) === 'critique' ? 1 : 0;
    const dStr = r.updatedAt || '';
    const d = dStr ? new Date(String(dStr)) : null;
    if (!d || Number.isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const cur = byMonth.get(key) || { crit: 0, sumGp: 0, n: 0 };
    cur.crit += crit;
    if (product > 0) {
      cur.sumGp += product;
      cur.n += 1;
    }
    byMonth.set(key, cur);
  });
  const keys = [...byMonth.keys()].sort();
  const tail = keys.slice(-maxMonths);
  return tail.map((k) => {
    const parts = k.split('-');
    const monthNum = Number(parts[1]) || 1;
    const agg = byMonth.get(k) || { crit: 0, sumGp: 0, n: 0 };
    const avgScore = agg.n > 0 ? Math.round((agg.sumGp / agg.n) * 10) / 10 : 0;
    return {
      m: MONTH_SHORT_FR[monthNum - 1] || k,
      crit: agg.crit,
      avgScore: avgScore > 0 ? avgScore : 0
    };
  });
}

export function countRiskLevels(list) {
  let critique = 0;
  let eleve = 0;
  let modere = 0;
  list.forEach((r) => {
    const crit = riskCriticalityFromMeta(r.meta);
    if (crit) {
      if (crit.tier >= 5) critique += 1;
      else if (crit.tier >= 3) eleve += 1;
      else modere += 1;
      return;
    }
    const s = String(r.status).toLowerCase();
    if (s.includes('critique')) critique += 1;
    else if (s.includes('très') && s.includes('élev')) eleve += 1;
    else if (s.includes('élevé') || s.includes('eleve')) eleve += 1;
    else modere += 1;
  });
  return { critique, eleve, modere };
}

/** @param {{ meta?: string, status?: string }} r */
export function riskTierBucket(r) {
  const crit = riskCriticalityFromMeta(r.meta);
  if (crit) {
    if (crit.tier >= 5) return 'critique';
    if (crit.tier >= 3) return 'eleve';
    return 'modere';
  }
  const s = String(r.status).toLowerCase();
  if (s.includes('critique')) return 'critique';
  if (s.includes('très') && s.includes('élev')) return 'eleve';
  if (s.includes('élevé') || s.includes('eleve')) return 'eleve';
  return 'modere';
}

/** @param {Array<{ title?: string, meta?: string, status?: string }>} list */
export function countRisksWithoutGp(list) {
  return list.filter((r) => !parseRiskMatrixGp(r.meta)).length;
}

export function hasActionLinked(r) {
  return r?.actionLinked != null && typeof r.actionLinked === 'object';
}

/** @param {Array<object>} list */
export function countRiskElevesOnly(list) {
  return list.filter((r) => riskTierBucket(r) === 'eleve').length;
}

export function countRiskMaitrises(list) {
  return list.filter((r) => r.pilotageState === 'traite').length;
}

export function countRiskSansAction(list) {
  return list.filter((r) => !hasActionLinked(r)).length;
}

/**
 * Analyse globale (lecture seule · pas d’écriture).
 * @param {Array<{ title?: string, meta?: string, status?: string, pilotageState?: string, trend?: string }>} list
 */
export function computeGlobalRiskAnalysis(list) {
  /** @type {{ level: 'info'|'warn'|'err', text: string }[]} */
  const findings = [];
  const sans = countRiskSansAction(list);
  if (sans > 0) {
    findings.push({
      level: 'warn',
      text: `${sans} risque(s) sans action liée : prioriser le rattachement au registre actions.`
    });
  }
  const unplaced = countRisksWithoutGp(list);
  if (unplaced > 0) {
    findings.push({
      level: 'info',
      text: `${unplaced} fiche(s) sans position G×P explicite sur la matrice.`
    });
  }
  list.forEach((r) => {
    const gp = parseRiskMatrixGp(r.meta);
    const crit = riskCriticalityFromMeta(r.meta);
    const st = String(r.status || '').toLowerCase();
    if (gp && crit && crit.tier >= 4 && (st.includes('faible') || st.includes('modéré') || st.includes('modere'))) {
      findings.push({
        level: 'err',
        text: `Incohérence possible : « ${r.title || 'Sans titre'} » · palier ${crit.label} vs libellé de statut modeste.`
      });
    }
    if (gp) {
      const prod = gp.g * gp.p;
      if (prod >= 16 && r.trend === 'stable' && r.pilotageState === 'actif' && crit && crit.tier >= 4) {
        findings.push({
          level: 'warn',
          text: `Sous-évaluation / veille : « ${r.title || 'Sans titre'} » · score G×P ${prod} mais tendance stable ; confirmer le pilotage.`
        });
      }
    }
  });
  const seen = new Set();
  return findings.filter((f) => {
    if (seen.has(f.text)) return false;
    seen.add(f.text);
    return true;
  });
}

export function levelToNum(v) {
  const s = String(v || '').toLowerCase();
  if (s.includes('élev') || s.includes('elev') || s === '5' || s === '4') return 5;
  if (s.includes('faible') || s === '1' || s === '2') return 2;
  return 3;
}

export function mapApiRiskToUi(row) {
  const gRaw = Number(row?.gravity ?? row?.severity ?? row?.level ?? 3);
  const pRaw = Number(row?.probability ?? 3);
  const g = Number.isFinite(gRaw) && gRaw > 0 ? Math.max(1, Math.min(5, Math.round(gRaw))) : 3;
  const p = Number.isFinite(pRaw) && pRaw > 0 ? Math.max(1, Math.min(5, Math.round(pRaw))) : 3;
  const meta = `G${g} × P${p}`;
  const tier = riskTierFromGp(g, p);
  const statusLabel = row?.status ? String(row.status) : riskLevelLabelFromTier(tier);
  return {
    id: row?.id || null,
    title: String(row?.title || 'Sans titre'),
    type: String(row?.category || ''),
    detail: String(row?.description || ''),
    status: statusLabel,
    tone: tier >= 5 ? 'red' : tier >= 3 ? 'amber' : 'blue',
    meta,
    responsible: String(row?.responsible || row?.owner || 'À désigner'),
    actionLinked: row?.actionLinked ?? null,
    pilotageState: /clos|ferm|trait|ma[iî]tris/i.test(statusLabel) ? 'traite' : 'actif',
    updatedAt: row?.updatedAt ? String(row.updatedAt).slice(0, 10) : new Date().toISOString().slice(0, 10),
    trend: row?.trend || 'stable'
  };
}
