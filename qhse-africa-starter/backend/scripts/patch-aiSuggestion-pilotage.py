# One-off patch script — Phase 2 IA/Data
path = (
    __file__.replace("\\scripts\\patch-aiSuggestion-pilotage.py", "\\src\\services\\aiSuggestion.service.js")
    .replace("/scripts/patch-aiSuggestion-pilotage.py", "/src/services/aiSuggestion.service.js")
)
import os
if not os.path.isfile(path):
    # running from repo root
    path = os.path.join(
        os.path.dirname(__file__), "..", "src", "services", "aiSuggestion.service.js"
    )
    path = os.path.normpath(path)
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

old_h = """function buildHeuristicPilotageNarrative(dashboardContext) {
  const ctx = dashboardContext && typeof dashboardContext === 'object' ? dashboardContext : {};
  const overdue = Number(ctx.actionsOverdue ?? ctx.overdueActions ?? 0) || 0;
  const crit = Array.isArray(ctx.criticalIncidentsPreview) ? ctx.criticalIncidentsPreview.length : 0;
  const parts = [
    'Synthèse automatique (IA locale ou fournisseur indisponible) : maintenir le pilotage sur les indicateurs affichés.'
  ];
  if (overdue) {
    parts.push(`${overdue} action(s) en retard — prioriser arbitrage, réaffectation et jalons.`);
  }
  if (crit) {
    parts.push(`${crit} incident(s) critique(s) dans les extraits — sécuriser la réponse terrain et la traçabilité.`);
  }
  if (!overdue && !crit) {
    parts.push('Aucun signal critique majeur dans le contexte transmis — poursuivre le suivi habituel des plans.');
  }
  return parts.join(' ');
}"""

new_h = """function buildHeuristicPilotageNarrative(dashboardContext) {
  const ctx = dashboardContext && typeof dashboardContext === 'object' ? dashboardContext : {};
  const overdue = Number(ctx.actionsOverdue ?? ctx.overdueActions ?? 0) || 0;
  const crit = Array.isArray(ctx.criticalIncidentsPreview) ? ctx.criticalIncidentsPreview.length : 0;
  const rc = ctx.risksCritical != null && Number.isFinite(Number(ctx.risksCritical)) ? Number(ctx.risksCritical) : 0;
  const nc = Number(ctx.nonConformities ?? 0) || 0;
  const parts = [
    'Synthèse automatique (IA locale ou fournisseur indisponible) : maintenir le pilotage sur les indicateurs transmis (KPI serveur / extraits).'
  ];
  if (overdue) {
    parts.push(`${overdue} action(s) en retard — prioriser arbitrage, réaffectation et jalons.`);
  }
  if (crit) {
    parts.push(`${crit} incident(s) critique(s) dans les extraits — sécuriser la réponse terrain et la traçabilité.`);
  }
  if (rc > 0) {
    parts.push(`${rc} risque(s) critique(s) selon la synthèse serveur — consolider le registre et les mesures.`);
  }
  if (nc > 0) {
    parts.push(`${nc} non-conformité(s) ouverte(s) (compteur) — prioriser le plan d’actions associé.`);
  }
  if (ctx.timeseries && typeof ctx.timeseries === 'object') {
    parts.push('Séries temporelles agrégées (6 mois) fournies — intégrer la tendance incidents / audits / NC dans le pilotage.');
  }
  if (!overdue && !crit && !rc && !nc) {
    parts.push('Aucun signal critique majeur dans le contexte transmis — poursuivre le suivi habituel des plans.');
  }
  return parts.join(' ');
}"""

if old_h not in text:
    raise SystemExit(f"patch block not found (path={path})")

text = text.replace(old_h, new_h, 1)

text = text.replace(
    """  const systemPrompt = `Tu es un directeur QHSE senior. On te fournit un JSON "dashboardContext" (compteurs, extraits d'incidents critiques, actions en retard, site).
Rédige une synthèse opérationnelle en français (3 à 5 phrases courtes) dans la clé "narrative".
Propose jusqu'à 3 actions de pilotage prioritaires (gestion du système QHSE, pas des actions correctives détaillées sur un seul dossier) dans "actions" : chaque élément { "title", "description", "delayDays", "ownerRole", "confidence" }.
Réponds UNIQUEMENT par un JSON objet valide avec les clés "narrative" (string) et "actions" (tableau, max 3). Sans markdown ni texte hors JSON.`;""",
    """  const systemPrompt = `Tu es un directeur QHSE senior. On te fournit un JSON "dashboardContext" avec compteurs serveur fiables (incidentsTotal, actionsOverdue, nonConformities, risksCritical si présent), synthèse audits optionnelle (auditsSummary), séries agrégées optionnelles (timeseries), extraits limités (criticalIncidentsPreview, overdueActionsPreview), signalSources et siteLabel.
Rédige une synthèse opérationnelle en français (3 à 5 phrases courtes) dans la clé "narrative".
Propose jusqu'à 3 actions de pilotage prioritaires (gestion du système QHSE, pas des actions correctives détaillées sur un seul dossier) dans "actions" : chaque élément { "title", "description", "delayDays", "ownerRole", "confidence" }.
Réponds UNIQUEMENT par un JSON objet valide avec les clés "narrative" (string) et "actions" (tableau, max 3). Sans markdown ni texte hors JSON.`;""",
    1,
)

text = text.replace(
    "  if (actions.length < 1) {\n    actions = mockPilotageActionsFromDashboard(dashboardContext);\n  }",
    "  if (actions.length < 1 && dashboardContext.allowGenericPilotageMocks === true) {\n    actions = mockPilotageActionsFromDashboard(dashboardContext);\n  }",
    1,
)

with open(path, "w", encoding="utf-8", newline="\n") as f:
    f.write(text)
print("patched", path)
