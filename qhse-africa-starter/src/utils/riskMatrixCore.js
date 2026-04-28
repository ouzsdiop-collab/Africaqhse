/**
 * Cœur métier G × P (sans UI) : partagé par matrice, registre, exports PDF.
 */

const GP_RE = /G\s*([1-5])\s*[×xX*]\s*P\s*([1-5])/;

export function parseRiskMatrixGp(meta) {
  const m = GP_RE.exec(String(meta ?? '').trim());
  if (!m) return null;
  const g = Number(m[1]);
  const p = Number(m[2]);
  if (!Number.isFinite(g) || !Number.isFinite(p)) return null;
  if (g < 1 || g > 5 || p < 1 || p > 5) return null;
  return { g, p };
}

export function riskScoreProduct(g, p) {
  return g * p;
}

export function riskTierFromGp(g, p) {
  const s = g * p;
  if (s >= 20) return 5;
  if (s >= 12) return 4;
  if (s >= 7) return 3;
  if (s >= 3) return 2;
  return 1;
}

const TIER_LABELS = {
  1: 'Faible',
  2: 'Modéré',
  3: 'Élevé',
  4: 'Très élevé',
  5: 'Critique'
};

export function riskLevelLabelFromTier(tier) {
  return TIER_LABELS[Math.min(5, Math.max(1, tier))] || 'Non disponible';
}

export function riskCriticalityFromMeta(meta) {
  const gp = parseRiskMatrixGp(meta);
  if (!gp) return null;
  const product = riskScoreProduct(gp.g, gp.p);
  const tier = riskTierFromGp(gp.g, gp.p);
  return {
    g: gp.g,
    p: gp.p,
    product,
    tier,
    label: riskLevelLabelFromTier(tier)
  };
}
