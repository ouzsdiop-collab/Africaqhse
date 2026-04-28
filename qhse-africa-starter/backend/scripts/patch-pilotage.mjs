import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = path.join(__dirname, '..', 'src', 'services', 'aiSuggestion.service.js');
let t = fs.readFileSync(p, 'utf8');

const oldH = `function buildHeuristicPilotageNarrative(dashboardContext) {
  const ctx = dashboardContext && typeof dashboardContext === 'object' ? dashboardContext : {};
  const overdue = Number(ctx.actionsOverdue ?? ctx.overdueActions ?? 0) || 0;
  const crit = Array.isArray(ctx.criticalIncidentsPreview) ? ctx.criticalIncidentsPreview.length : 0;
  const parts = [
    'Synthèse automatique (IA locale ou fournisseur indisponible) : maintenir le pilotage sur les indicateurs affichés.'
  ];
  if (overdue) {
    parts.push(\`\${overdue} action(s) en retard — prioriser arbitrage, réaffectation et jalons.\`);
  }
  if (crit) {
    parts.push(\`\${crit} incident(s) critique(s) dans les extraits — sécuriser la réponse terrain et la traçabilité.\`);
  }
  if (!overdue && !crit) {
    parts.push('Aucun signal critique majeur dans le contexte transmis — poursuivre le suivi habituel des plans.');
  }
  return parts.join(' ');
}`;

const newH = `function buildHeuristicPilotageNarrative(dashboardContext) {
  const ctx = dashboardContext && typeof dashboardContext === 'object' ? dashboardContext : {};
  const overdue = Number(ctx.actionsOverdue ?? ctx.overdueActions ?? 0) || 0;
  const crit = Array.isArray(ctx.criticalIncidentsPreview) ? ctx.criticalIncidentsPreview.length : 0;
  const rc = ctx.risksCritical != null && Number.isFinite(Number(ctx.risksCritical)) ? Number(ctx.risksCritical) : 0;
  const nc = Number(ctx.nonConformities ?? 0) || 0;
  const parts = [
    'Synthèse automatique (IA locale ou fournisseur indisponible) : maintenir le pilotage sur les indicateurs transmis (KPI serveur / extraits).'
  ];
  if (overdue) {
    parts.push(\`\${overdue} action(s) en retard — prioriser arbitrage, réaffectation et jalons.\`);
  }
  if (crit) {
    parts.push(\`\${crit} incident(s) critique(s) dans les extraits — sécuriser la réponse terrain et la traçabilité.\`);
  }
  if (rc > 0) {
    parts.push(\`\${rc} risque(s) critique(s) selon la synthèse serveur — consolider le registre et les mesures.\`);
  }
  if (nc > 0) {
    parts.push(\`\${nc} non-conformité(s) ouverte(s) (compteur) — prioriser le plan d'actions associé.\`);
  }
  if (ctx.timeseries && typeof ctx.timeseries === 'object') {
    parts.push('Séries temporelles agrégées (6 mois) fournies — intégrer la tendance incidents / audits / NC dans le pilotage.');
  }
  if (!overdue && !crit && !rc && !nc) {
    parts.push('Aucun signal critique majeur dans le contexte transmis — poursuivre le suivi habituel des plans.');
  }
  return parts.join(' ');
}`;

if (!t.includes(oldH)) {
  console.error('OLD narrative block not found');
  process.exit(1);
}
t = t.replace(oldH, newH);

const sp0 = `  const systemPrompt = \`Tu es un directeur QHSE senior. On te fournit un JSON "dashboardContext" (compteurs, extraits d'incidents critiques, actions en retard, site).
Rédige une synthèse opérationnelle en français (3 à 5 phrases courtes) dans la clé "narrative".
Propose jusqu'à 3 actions de pilotage prioritaires (gestion du système QHSE, pas des actions correctives détaillées sur un seul dossier) dans "actions" : chaque élément { "title", "description", "delayDays", "ownerRole", "confidence" }.
Réponds UNIQUEMENT par un JSON objet valide avec les clés "narrative" (string) et "actions" (tableau, max 3). Sans markdown ni texte hors JSON.\`;`;

const sp1 = `  const systemPrompt = \`Tu es un directeur QHSE senior. On te fournit un JSON "dashboardContext" avec compteurs serveur fiables (incidentsTotal, actionsOverdue, nonConformities, risksCritical si présent), synthèse audits optionnelle (auditsSummary), séries agrégées optionnelles (timeseries), extraits limités (criticalIncidentsPreview, overdueActionsPreview), signalSources et siteLabel.
Rédige une synthèse opérationnelle en français (3 à 5 phrases courtes) dans la clé "narrative".
Propose jusqu'à 3 actions de pilotage prioritaires (gestion du système QHSE, pas des actions correctives détaillées sur un seul dossier) dans "actions" : chaque élément { "title", "description", "delayDays", "ownerRole", "confidence" }.
Réponds UNIQUEMENT par un JSON objet valide avec les clés "narrative" (string) et "actions" (tableau, max 3). Sans markdown ni texte hors JSON.\`;`;

if (!t.includes(sp0)) {
  console.error('OLD systemPrompt not found');
  process.exit(1);
}
t = t.replace(sp0, sp1);

const mock0 = `  if (actions.length < 1) {
    actions = mockPilotageActionsFromDashboard(dashboardContext);
  }`;
const mock1 = `  if (actions.length < 1 && dashboardContext.allowGenericPilotageMocks === true) {
    actions = mockPilotageActionsFromDashboard(dashboardContext);
  }`;
if (!t.includes(mock0)) {
  console.error('OLD mock block not found');
  process.exit(1);
}
t = t.replace(mock0, mock1);

fs.writeFileSync(p, t, 'utf8');
console.log('patched', p);
