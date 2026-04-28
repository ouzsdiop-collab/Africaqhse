/**
 * Couche « décision » : score global et texte direction, dérivés des données
 * déjà chargées par le dashboard (aucune nouvelle règle métier serveur).
 *
 * Le score est une synthèse lisible (0–100, plus haut = meilleure posture affichée),
 * pas un indicateur normatif certifié.
 */

/**
 * @param {{
 *   stats?: {
 *     overdueActions?: number;
 *     criticalIncidents?: unknown[];
 *   };
 *   ncOpenCount?: number;
 *   avgAuditScore?: number | null;
 *   hasAuditScores?: boolean;
 * }} ctx
 * @returns {number}
 */
export function computeQhseGlobalScore(ctx) {
  const stats = ctx?.stats || {};
  const crit = Array.isArray(stats.criticalIncidents) ? stats.criticalIncidents.length : 0;
  const od = Math.max(0, Number(stats.overdueActions) || 0);
  const nc = Math.max(0, Number(ctx.ncOpenCount) || 0);

  let s = 100;
  s -= Math.min(crit * 14, 44);
  s -= Math.min(od * 3.5, 36);
  s -= Math.min(nc * 2.5, 30);

  const has = Boolean(ctx.hasAuditScores);
  const avg = Number(ctx.avgAuditScore);
  if (has && Number.isFinite(avg)) {
    if (avg >= 78) s += 5;
    else if (avg < 55) s -= 14;
    else if (avg < 68) s -= 8;
  }

  return Math.max(0, Math.min(100, Math.round(s)));
}

/**
 * @param {number} score
 * @returns {{ tone: 'ok' | 'watch' | 'risk'; label: string; hint: string }}
 */
export function qhseScorePresentation(score) {
  if (score >= 74) {
    return {
      tone: 'ok',
      label: 'Posture globale favorable',
      hint: ''
    };
  }
  if (score >= 52) {
    return {
      tone: 'watch',
      label: 'Vigilance recommandée',
      hint: 'Des sujets méritent un arbitrage dans les prochains échanges de pilotage.'
    };
  }
  return {
    tone: 'risk',
    label: 'Pilotage serré nécessaire',
    hint: 'Plusieurs signaux se cumulent : prioriser les décisions et le suivi des plans.'
  };
}

/** Libellé court direction : Stable / Vigilance / Critique */
export function ceoGlobalStatusLabel(tone) {
  if (tone === 'ok') return 'Stable';
  if (tone === 'watch') return 'Vigilance';
  return 'Critique';
}

/**
 * Texte naturel pour la direction (2 à 4 phrases max).
 * @param {{
 *   stats?: {
 *     overdueActions?: number;
 *     incidents?: number;
 *     actions?: number;
 *     criticalIncidents?: unknown[];
 *     overdueActionItems?: unknown[];
 *   };
 *   ncOpenCount?: number;
 *   avgAuditScore?: number | null;
 *   hasAuditScores?: boolean;
 *   siteLabel?: string;
 * }} ctx
 */
export function buildExecutiveBriefNarrative(ctx) {
  const stats = ctx?.stats || {};
  const site =
    ctx.siteLabel && String(ctx.siteLabel).trim()
      ? String(ctx.siteLabel).trim()
      : 'votre périmètre';
  const crit = Array.isArray(stats.criticalIncidents) ? stats.criticalIncidents.length : 0;
  const od = Math.max(0, Number(stats.overdueActions) || 0);
  const nc = Math.max(0, Number(ctx.ncOpenCount) || 0);
  const totInc = Math.max(0, Number(stats.incidents) || 0);
  const totAct = Math.max(0, Number(stats.actions) || 0);
  const hasAud = Boolean(ctx.hasAuditScores);
  const avg = Number(ctx.avgAuditScore);

  /** @type {string[]} */
  const parts = [];

  if (crit > 0) {
    parts.push(
      crit === 1
        ? `Une situation à gravité élevée est à traiter en priorité sur ${site}.`
        : `Plusieurs situations à gravité élevée concernent ${site} : la chaîne de réaction doit rester engagée.`
    );
  }

  if (od > 0) {
    parts.push(
      od === 1
        ? `Une action dépasse son échéance : cela fragilise la crédibilité du plan et mérite un arbitrage immédiat.`
        : `Plusieurs actions sont en retard : sans décision rapide, le retard se propage sur le reste du plan.`
    );
  }

  if (nc > 0 && crit === 0 && od < 3) {
    parts.push(
      nc === 1
        ? `Une non-conformité reste ouverte : veillez à ce qu’elle soit portée et suivie jusqu’à clôture.`
        : `Le nombre de non-conformités ouvertes invite à planifier une revue de suivi ou des arbitrages ciblés.`
    );
  }

  if (hasAud && Number.isFinite(avg) && nc + od + crit === 0) {
    if (avg >= 76) {
      parts.push(
        `Les derniers audits visibles affichent une moyenne confortable (${avg} %) : capitalisez sur les bonnes pratiques identifiées.`
      );
    } else if (avg < 65) {
      parts.push(
        `La moyenne des audits (${avg} %) reste sous les attentes usuelles : utile d’en faire un point en comité.`
      );
    }
  }

  if (parts.length === 0) {
    if (totInc + totAct === 0 && od === 0 && nc === 0) {
      parts.push(
        `Sur ${site}, les volumes suivis ici sont faibles : vérifiez que la saisie terrain et le filtre de site reflètent bien la réalité.`
      );
    } else {
      parts.push(
        `Sur ${site}, les indicateurs agrégés ne montrent pas de cumul critique sur les axes incidents, actions et conformité suivis dans cette vue.`
      );
      parts.push(
        `Poursuivez le pilotage habituel : revues, échéances et preuves. Les sections ci-dessous détaillent le niveau opérationnel.`
      );
    }
  } else {
    parts.push(
      `En réunion de direction, commencez par ces sujets avant d’élargir le débat aux tendances de fond.`
    );
  }

  return parts.join(' ');
}
