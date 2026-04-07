/**
 * Synthèse sous la grille Analytics (4 cartes) — heuristique locale + enrichissement API IA si disponible.
 */

import { qhseFetch } from '../utils/qhseFetch.js';

function aggregateCriticalTypes(crit) {
  if (!Array.isArray(crit) || !crit.length) return [];
  const m = new Map();
  crit.forEach((row) => {
    const t = String(row.type || 'Autre').trim() || 'Autre';
    m.set(t, (m.get(t) || 0) + 1);
  });
  return [...m.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function aggregateAuditStatuses(audits) {
  if (!Array.isArray(audits) || !audits.length) return [];
  const m = new Map();
  audits.forEach((a) => {
    const s = String(a.status || '—').trim() || '—';
    m.set(s, (m.get(s) || 0) + 1);
  });
  return [...m.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/**
 * @param {Record<string, unknown>} counts
 * @param {{ criticalIncidents?: unknown[]; recentAudits?: unknown[] }} data
 */
export function computeQuadInsightHeuristic(counts, data) {
  const actTotal = Math.max(0, Number(counts.actionsTotal) || 0);
  const actOver = Math.max(0, Number(counts.actionsOverdue) || 0);
  const inc30 = Math.max(0, Number(counts.incidentsLast30Days) || 0);
  const ncOpen = Math.max(0, Number(counts.nonConformitiesOpen) || 0);
  const critOpen = Math.max(0, Number(counts.incidentsCriticalOpen) || 0);
  const auditsN = Math.max(0, Number(counts.auditsTotal) || 0);

  const types = aggregateCriticalTypes(data?.criticalIncidents);
  const statAudit = aggregateAuditStatuses(data?.recentAudits);

  /** @type {string[]} */
  const parts = [];

  if (actTotal > 0) {
    const ratio = Math.round((actOver / actTotal) * 100);
    if (actOver === 0) {
      parts.push(
        `Sur ${actTotal} action(s) suivie(s), aucun retard — discipline d’exécution favorable.`
      );
    } else {
      parts.push(
        `${actOver} action(s) en retard soit environ ${ratio} % du stock : prioriser relances et arbitrage de charge.`
      );
    }
  }

  const vols = [
    { key: 'incidents (30 j.)', n: inc30 },
    { key: 'NC ouvertes', n: ncOpen },
    { key: 'actions en retard', n: actOver },
    { key: 'audits (base)', n: auditsN }
  ];
  const maxN = Math.max(...vols.map((v) => v.n), 0);
  if (maxN > 0) {
    const top = vols.filter((v) => v.n === maxN);
    const label = top.map((t) => t.key).join(' et ');
    parts.push(
      `À l’échelle relative des volumes, « ${label} » domine (${maxN}) — c’est le levier le plus visible pour un gain rapide de visibilité.`
    );
  }

  if (ncOpen > 0 && actOver > 0) {
    parts.push(
      'Le cumul NC ouvertes et actions en retard renforce le risque de dérive : lier plans NC et échéances pour éviter les doubles dettes.'
    );
  } else if (ncOpen >= 4) {
    parts.push(
      `${ncOpen} NC ouvertes : arbitrer par criticité et sécuriser des jalons de sortie.`
    );
  }

  if (critOpen > 0 && types.length) {
    const [a, b] = [types[0], types[1]];
    if (b && a.count === b.count) {
      parts.push(
        `Les incidents critiques se partagent entre « ${a.type} » et « ${b.type} » (${a.count} chacun) — analyser les causes système communes plutôt qu’un seul poste.`
      );
    } else {
      parts.push(
        `Parmi les critiques ouverts, « ${a.type} » ressort en tête (${a.count}) — utile pour un focus causes / barrières.`
      );
    }
  } else if (critOpen === 0) {
    parts.push('Aucun incident critique ouvert dans le périmètre analysé — priorité sécurité sous contrôle sur cet indicateur.');
  }

  if (statAudit.length) {
    const topS = statAudit[0];
    const second = statAudit[1];
    if (second) {
      parts.push(
        `Sur l’échantillon audits, « ${topS.type} » (${topS.count}) et « ${second.type} » (${second.count}) structurent le paysage — caler le plan de contrôle en conséquence.`
      );
    } else {
      parts.push(
        `Les statuts d’audit sont dominés par « ${topS.type} » (${topS.count} cas) — vérifier la couverture temporelle des revues.`
      );
    }
  }

  if (parts.length === 0) {
    return 'Indicateurs peu denses sur cet échantillon — enrichir les données ou élargir le périmètre pour une lecture plus fine.';
  }

  return parts.slice(0, 4).join(' ');
}

/**
 * @param {Record<string, unknown>} counts
 * @param {object} data
 * @param {Record<string, unknown>} [kpis]
 */
function buildQuadContext(counts, data, kpis) {
  const k = kpis && typeof kpis === 'object' ? kpis : {};
  return {
    siteScope: data?.siteId != null && String(data.siteId).trim() ? String(data.siteId) : 'tous',
    actions: {
      total: Number(counts.actionsTotal) || 0,
      overdue: Number(counts.actionsOverdue) || 0,
      overdueRatio:
        Number(counts.actionsTotal) > 0
          ? Math.round(
              ((Number(counts.actionsOverdue) || 0) / Number(counts.actionsTotal)) * 100
            )
          : null
    },
    incidents: {
      total: Number(counts.incidentsTotal) || 0,
      last30: Number(counts.incidentsLast30Days) || 0,
      criticalOpen: Number(counts.incidentsCriticalOpen) || 0
    },
    nc: {
      open: Number(counts.nonConformitiesOpen) || 0,
      total: Number(counts.nonConformitiesTotal) || 0
    },
    audits: {
      total: Number(counts.auditsTotal) || 0,
      scoreAvg: k.auditScoreAvg != null ? Number(k.auditScoreAvg) : null
    },
    topCriticalTypes: aggregateCriticalTypes(data?.criticalIncidents).slice(0, 3),
    auditStatusMix: aggregateAuditStatuses(data?.recentAudits).slice(0, 4)
  };
}

function isPlaceholderSummary(text) {
  const s = String(text || '').trim();
  if (s.length < 40) return true;
  if (/Suggestion générée \(type/i.test(s)) return true;
  if (/revue obligatoire avant toute action/i.test(s) && s.length < 160) return true;
  return false;
}

/**
 * Section carte : synthèse IA sous les 4 graphiques secondaires.
 * @param {Record<string, unknown>} counts
 * @param {object} data — même objet que la synthèse reporting
 * @param {Record<string, unknown>} [kpis]
 * @returns {HTMLElement}
 */
export function createAnalyticsQuadInsightSection(counts, data, kpis) {
  const section = document.createElement('section');
  section.className = 'analytics-quad-ai';
  section.setAttribute('aria-labelledby', 'analytics-quad-ai-title');

  const head = document.createElement('div');
  head.className = 'analytics-quad-ai__head';

  const kicker = document.createElement('span');
  kicker.className = 'analytics-quad-ai__kicker';
  kicker.textContent = 'Synthèse';

  const title = document.createElement('h3');
  title.id = 'analytics-quad-ai-title';
  title.className = 'analytics-quad-ai__title';
  title.textContent = 'Lecture croisée (IA)';

  const badge = document.createElement('span');
  badge.className = 'analytics-quad-ai__badge';
  badge.textContent = 'Indicatif';
  badge.title = 'Contenu généré ou heuristique — validation métier requise.';

  head.append(kicker, title, badge);

  const body = document.createElement('div');
  body.className = 'analytics-quad-ai__body';

  const textEl = document.createElement('p');
  textEl.className = 'analytics-quad-ai__text';
  const heuristic = computeQuadInsightHeuristic(counts, data);
  textEl.textContent = heuristic;

  const meta = document.createElement('p');
  meta.className = 'analytics-quad-ai__meta';
  meta.textContent = 'Synthèse locale instantanée — connexion à l’IA en cours…';

  body.append(textEl, meta);
  section.append(head, body);

  const context = buildQuadContext(counts, data, kpis);

  (async () => {
    try {
      const res = await qhseFetch('/api/ai-suggestions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'analytics_quad',
          context
        })
      });
      if (res.status === 403) {
        meta.textContent =
          'Permission « suggestions IA » (écriture) absente — affichage de la synthèse locale uniquement.';
        return;
      }
      if (!res.ok) {
        meta.textContent = `IA indisponible (${res.status}) — synthèse locale conservée.`;
        return;
      }
      const row = await res.json().catch(() => null);
      const summary =
        row?.content && typeof row.content === 'object'
          ? String(row.content.summary || '').trim()
          : '';
      const mode = row?.providerMeta && typeof row.providerMeta === 'object' ? row.providerMeta.mode : null;
      const usedLlm = mode === 'openai' && summary && !isPlaceholderSummary(summary);

      if (usedLlm) {
        textEl.textContent = summary;
        meta.textContent =
          'Proposition enrichie par modèle — à valider avant toute décision opérationnelle.';
      } else if (!isPlaceholderSummary(summary) && summary.length > 60) {
        textEl.textContent = summary;
        meta.textContent = 'Synthèse serveur — revue humaine recommandée.';
      } else {
        meta.textContent =
          'Modèle distant non utilisé ou indisponible — synthèse heuristique affichée.';
      }
    } catch {
      meta.textContent = 'Connexion IA impossible — synthèse locale conservée.';
    }
  })();

  return section;
}
