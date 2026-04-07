/**
 * Données de démonstration — graphiques audit du dashboard (aucun backend requis).
 * Courbes et volumes réalistes pour présentation / formation.
 */

/**
 * @param {number} [monthCount=6]
 */
function buildMonthBuckets(monthCount = 6) {
  const n = Math.max(1, Math.min(12, Math.floor(Number(monthCount)) || 6));
  const now = new Date();
  const buckets = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('fr-FR', { month: 'short' })
    });
  }
  return buckets;
}

/** Séries déterministes (même rendu d’une session à l’autre pour 6 mois). */
const DEMO_SCORES_6 = [73, 75, 72, 78, 81, 84];
const DEMO_MAJOR_6 = [1, 0, 2, 1, 1, 0];
const DEMO_MINOR_6 = [4, 5, 3, 6, 4, 5];

/**
 * @param {number[]} arr
 * @param {number} n
 */
function stretchSeries(arr, n) {
  if (n <= arr.length) return arr.slice(arr.length - n);
  const x = [...arr];
  while (x.length < n) x.push(x[x.length - 1]);
  return x;
}

/**
 * @param {number} [monthCount=6]
 * @returns {{ labels: string[]; scores: number[]; major: number[]; minor: number[] }}
 */
export function getDemoAuditChartData(monthCount = 6) {
  const buckets = buildMonthBuckets(monthCount);
  const n = buckets.length;
  return {
    labels: buckets.map((b) => b.label),
    scores: stretchSeries(DEMO_SCORES_6, n),
    major: stretchSeries(DEMO_MAJOR_6, n),
    minor: stretchSeries(DEMO_MINOR_6, n)
  };
}
