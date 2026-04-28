/**
 * Narratif décisionnel pour la série incidents (6 mois), partagé SVG / Chart.js.
 * @param {{ label: string; value: number }[]} safe
 */
export function computeIncidentSeriesNarrative(safe) {
  const series = Array.isArray(safe) ? safe : [];
  const vals = series.map((p) => (Number.isFinite(p.value) ? Math.max(0, p.value) : 0));
  const n = vals.length;
  const total = vals.reduce((a, b) => a + b, 0);
  if (n === 0) {
    return {
      trendKey: 'silence',
      badgeLabel: 'Aucun signal',
      badgeCls: 'dashboard-incidents-badge--neutral',
      peakIdx: 0,
      peakVal: 0,
      peakLabel: 'Non disponible',
      total: 0,
      avg: 0,
      deltas: [],
      vigilance: [],
      microHints: [],
      refCeiling: null
    };
  }
  let peakIdx = 0;
  vals.forEach((v, i) => {
    if (v > vals[peakIdx]) peakIdx = i;
  });
  const peakVal = vals[peakIdx];
  const peakLabel = series[peakIdx]?.label || 'Non disponible';
  const deltas = vals.map((v, i) => (i === 0 ? null : v - vals[i - 1]));
  const avg = total / n;
  const vigilance = vals.map((v) => {
    if (avg <= 0.001) return v > 0 ? 'Vigilance' : 'Normale';
    if (peakVal > 0 && v === peakVal && v >= avg * 1.05) return 'Critique';
    if (v >= avg * 1.35) return 'Critique';
    if (v >= avg * 1.12) return 'Vigilance';
    return 'Normale';
  });
  const microHints = series.map((_, idx) => {
    const vg = vigilance[idx];
    const d = deltas[idx];
    if (vg === 'Critique') {
      return 'Arbitrage direction / HSE : sévériser briefs, permis et contrôles poste sur cette période.';
    }
    if (vg === 'Vigilance') {
      return 'Renforcer observations terrain et lien avec PTW / habilitations sur les postes sensibles.';
    }
    if (d != null && d > 1) {
    return 'Hausse locale, corréler avec maintenance, intempéries ou charge sous-traitants.';
    }
    if (d != null && d < -1) {
    return 'Baisse marquée, vérifier que la remontée terrain reste exhaustive.';
    }
    return 'Rythme compatible avec un pilotage HSE standard sur ce mois.';
  });
  let signFlips = 0;
  for (let i = 2; i < n; i += 1) {
    const s0 = Math.sign(vals[i - 1] - vals[i - 2]);
    const s1 = Math.sign(vals[i] - vals[i - 1]);
    if (s0 !== 0 && s1 !== 0 && s0 !== s1) signFlips += 1;
  }
  const first3 = vals.slice(0, Math.min(3, n)).reduce((a, b) => a + b, 0);
  const last3 = vals.slice(Math.max(0, n - 3)).reduce((a, b) => a + b, 0);
  const mean = total / n;
  const variance =
    n > 1 ? vals.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n : 0;
  const cv = mean > 0.4 ? Math.sqrt(variance) / mean : 0;
  const instableByVar = n >= 5 && cv > 0.38;
  /** @type {'silence'|'degradation'|'amelioration'|'instable'|'stable'} */
  let trendKey = 'stable';
  if (total === 0) trendKey = 'silence';
  else if (first3 > 0 && last3 > first3 * 1.22) trendKey = 'degradation';
  else if (first3 > 0 && last3 < first3 * 0.78) trendKey = 'amelioration';
  else if (signFlips >= 2 || instableByVar) trendKey = 'instable';
  const badgeMap = {
    silence: { label: 'Aucun signal', cls: 'dashboard-incidents-badge--neutral' },
    degradation: { label: 'Dégradation', cls: 'dashboard-incidents-badge--bad' },
    instable: { label: 'Instable', cls: 'dashboard-incidents-badge--warn' },
    amelioration: { label: 'Amélioration', cls: 'dashboard-incidents-badge--good' },
    stable: { label: 'Stable', cls: 'dashboard-incidents-badge--neutral' }
  };
  const bm = badgeMap[trendKey];
  const refCeiling =
    mean > 0.2 && peakVal > 0 ? Math.max(1, Math.round(mean * 1.15)) : null;
  return {
    trendKey,
    badgeLabel: bm.label,
    badgeCls: bm.cls,
    peakIdx,
    peakVal,
    peakLabel,
    total,
    avg,
    deltas,
    vigilance,
    microHints,
    refCeiling
  };
}

/**
 * @param {{ label: string; value: number }[]} safe
 * @param {ReturnType<typeof computeIncidentSeriesNarrative>} nar
 */
export function buildIncidentExecutiveInterpret(safe, nar) {
  if (nar.trendKey === 'silence') {
    return 'Aucun incident sur six mois : capitalisez sur ce socle et sécurisez la crédibilité du dispositif de remontée terrain.';
  }
  const { total, peakLabel, peakVal, trendKey } = nar;
  const last = safe[safe.length - 1]?.value ?? 0;
  const prev = safe.length > 1 ? safe[safe.length - 2]?.value ?? 0 : last;
  const tailEase = last < prev || (last === prev && last < peakVal * 0.75);
  if (trendKey === 'degradation') {
    const extra = tailEase
      ? ' Les derniers mois montrent un léger repli : utile, mais insuffisant pour lever la vigilance sans plan d’actions ciblé.'
      : ' La fin de période reste élevée : maintenir une revue HSE hebdomadaire ciblée sur les zones à risque.';
    return `La charge récente dépasse nettement le début de fenêtre (${total} incidents cumulés, pic ${peakVal} en ${peakLabel}).${extra}`;
  }
  if (trendKey === 'amelioration') {
    return `Après un pic à ${peakVal} (${peakLabel}), la courbe se referme (${total} sur six mois). Capitaliser sur les actions engagées sans relâcher le pilotage au sol.`;
  }
  if (trendKey === 'instable') {
    return `Volume irrégulier (${total} sur six mois, max ${peakVal} en ${peakLabel}) : activité variable ou qualité de déclaration hétérogène. Lancez une revue commune direction / terrain.`;
  }
  return `Rythme modéré (${total} sur six mois). Point d’attention principal : ${peakLabel} (${peakVal}). Gardez ce pic sous surveillance en comité de pilotage.`;
}

/**
 * @param {{ label: string; value: number }[]} safe
 */
export function interpretIncidentTrend(safe) {
  return buildIncidentExecutiveInterpret(safe, computeIncidentSeriesNarrative(safe));
}
