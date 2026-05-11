# AUDIT — Branchages boutons, liens, CTA, menus d’action et redirections

## 1) Résumé exécutif

Cet audit statique (code frontend + services de navigation/context) montre que l’application dispose déjà d’une **structure de navigation centralisée** (hash routing + intents) qui couvre une bonne partie du besoin de contextualisation. Les flux “métier” clés (dashboard → actions/incidents/audits/risks) sont présents, mais on observe encore des écarts :

- **Contexte parfois perdu** : certains CTA renvoient vers un module générique (`#actions`, `#risks`, `#audits`) sans filtre/contexte métier transmis.
- **Incohérence des mécanismes de navigation** : coexistence de `window.location.hash = ...`, utilitaires de navigation (`qhseNavigate`) et callbacks directs, ce qui augmente le risque de divergence fonctionnelle.
- **Actions contextuelles incomplètes** dans plusieurs modales/panneaux (incident, audit, ISO), où le lien est correct fonctionnellement mais pas assez prérempli (référence objet source, criticité, site, origine ISO exigence/preuve).
- **Risque UX/qualité élevé** sur KPI cliquables, alertes, cards et menus “…” qui peuvent “ouvrir la bonne page” sans “ouvrir la bonne vue”.

Conclusion : la base est solide, mais il faut une **normalisation forte du passage de contexte** (source, ref, filtres, préremplissage création) pour aligner le comportement avec l’objectif produit demandé.

---

## 2) Méthode d’audit

### 2.1 Approche
- Audit **statique** du code (sans modification), centré sur :
  - boutons/CTA/menu items,
  - handlers `click`/`onClick`,
  - redirections hash/router,
  - transports d’intent/contexte,
  - panneaux/modales/toasts/notifications.
- Vérification croisée des pages majeures : dashboard, cockpit, ISO, actions, incidents, risques, audits, documents/FDS, import/export, auth, navigation shell.

### 2.2 Commandes utilisées
- `rg -n --files -g 'AGENTS.md'`
- `find .. -name AGENTS.md -print`
- `rg -n "onClick=|href=|to=|navigate\(|router\.push|history\.push|window\.location|Link |NavLink|button|Button|cta|menu|dropdown|ellipsis|\.\.\.|Créer|Ajouter|Voir|Ouvrir|Détail|Filtrer|Exporter|Importer|Téléverser|preuve|action|incident|risque|audit|document|FDS|Ctrl\+K" qhse-africa-starter/src`
- `rg --files qhse-africa-starter/src/pages qhse-africa-starter/src/components qhse-africa-starter/src/services`
- `rg -n "window\.location\.hash|href=|onClick|addEventListener\('click'|navigateTo\(|open.*dialog|showModal|dropdown|menu|cta|Ctrl\+K|search" qhse-africa-starter/src --glob '!**/*.css'`

### 2.3 Limites
- Audit réalisé sans exécution e2e : certaines destinations peuvent être correctes en runtime via état global non visible statiquement.
- Analyse principalement frontend ; backend vérifié uniquement indirectement via flux de création/export/import détectés.

---

## 3) Liste des fichiers inspectés (principaux)

### Routing / navigation globale
- `src/main.js`
- `src/data/navigation.js`
- `src/utils/qhseNavigate.js`
- `src/utils/dashboardNavigationIntent.js`

### Dashboard / cockpit / synthèse / assistant
- `src/pages/dashboard.js`
- `src/pages/dashboard/decisionPanel.js`
- `src/components/dashboardCockpit.js`
- `src/components/dashboardCockpitPremium.js`
- `src/components/dashboardActivity.js`
- `src/components/dashboardAlertsPriorites.js`
- `src/components/dashboardPriorityNow.js`
- `src/components/dashboardVigilancePoints.js`
- `src/components/dashboardPilotageAssistant.js`
- `src/components/kpiDetailDrawer.js`

### ISO / conformité / preuves / suggestions
- `src/pages/iso.js`
- `src/components/isoCopilotSuggestions.js`
- `src/components/isoCopilotConformiteModule.js`
- `src/components/isoProofsManager.js`
- `src/components/isoComplianceAssistPanel.js`
- `src/components/isoAuditReadiness.js`
- `src/components/isoAuditReportPanel.js`
- `src/services/isoTerrainLinks.service.js`

### Actions / incidents / risques / audits
- `src/pages/actions.js`
- `src/pages/incidents.js`
- `src/components/incidentDetailPanel.js`
- `src/components/incidentAiAnalysisPanel.js`
- `src/pages/risks.js`
- `src/components/riskRegisterRow.js`
- `src/components/riskSheetModal.js`
- `src/pages/audits.js`
- `src/components/auditFormDialog.js`
- `src/components/auditResultPanel.js`

### FDS/documents, import/export, notifications, shell
- `src/pages/products.js`
- `src/pages/imports.js`
- `src/services/qhseReportsPdf.service.js`
- `src/components/toast.js`
- `src/stores/notifications.js`
- `src/components/notifications.js`
- `src/components/sidebar.js`
- `src/components/sidebarV2.js`
- `src/components/topbar.js`
- `src/components/topbarV2.js`
- `src/pages/login.js`

---

## 4) Tableau d’audit complet (CTA/boutons/liens relevés)

> Légende pertinence : **OK / Flou / Mal branché**
> 
> Légende risque : **Faible / Moyen / Élevé / Critique**

| Zone | Élément UI | Destination actuelle | Destination recommandée | Contexte transmis actuel | Contexte attendu | Pertinence | Risque | Recommandation |
|---|---|---|---|---|---|---|---|---|
| Dashboard | KPI “actions en retard” | vers `#actions` (selon handlers cockpit/dashboard) | vue actions pré-filtrée `status=overdue` | parfois intent générique | filtres + source dashboard + plage date | Flou | Élevé | Standardiser via helper unique “navigateWithIntent”. |
| Dashboard | KPI “incidents critiques” | vers `#incidents` | incidents filtrés `severity=critique` | partiel selon composant | criticité + site + période + origine clic | Flou | Élevé | Encoder preset filtres dans intent. |
| Dashboard | KPI “audits à traiter” | vers `#audits` | onglet/filtre constats prioritaires | souvent aucun filtre | statut audit + dueDate + priorisation | Flou | Moyen | Ajouter mapping KPI→preset audit. |
| Cockpit essentiel | CTA “Voir plan d’actions” | `#actions` | `#actions` + vue priorisée (retard/critique) | intent parfois présent | intent obligatoire | Flou | Moyen | Rendre intent obligatoire côté cockpit. |
| Cockpit essentiel | CTA “Voir incidents” | `#incidents` | liste incidents filtrée contexte alerte | variable | type alerte + site + criticité | Flou | Moyen | Uniformiser payload de navigation. |
| Cockpit essentiel | Alert cards cliquables | navigation par hash | deep-link fonctionnel + filtres | hétérogène | objet source + filtre ciblé | Flou | Élevé | Passer toutes alerts via utilitaire commun. |
| Synthèse semaine | CTA “Agir” recommandations | redirection module global | ouverture module + filtre précis | peu explicite | ref recommandation + action suggérée | Flou | Moyen | Ajouter contrat d’intent par recommandation. |
| Suggestions assistées | “Ouvrir” suggestion | variable (scroll/hash) | focus exact (section/objet) | partiel | anchor + id objet | Flou | Moyen | Préférer identifiants stables aux sélecteurs CSS. |
| ISO | “Décision ISO / ISO en 5 sec” CTA | souvent `#audits` ou section ISO | décision contextualisée exigence/écart | limité | ref exigence, niveau criticité, site | Flou | Élevé | Créer intents ISO typés. |
| ISO exigences critiques | “Créer action” | ouvre actions ou création non systématiquement liée | création action préremplie liée exigence | partiel/inconstant | `source=iso_requirement`, `requirementId`, `normRef` | Mal branché | Critique | Exiger lien fort exigence→action. |
| ISO exigences critiques | “Ajouter preuve” | peut ouvrir preuve/doc générique | ajout preuve liée exigence ciblée | variable | `requirementId`, type preuve, échéance | Mal branché | Critique | Ajouter prébinding exigence dans modal preuve. |
| ISO preuves | “Voir preuve” | ouverture modal/zone preuve | OK si preuve ciblée, sinon fallback liste | souvent id preuve | id preuve + id exigence + mode lecture | Flou | Moyen | Forcer relation preuve↔exigence dans UI. |
| ISO preuves | “Retirer preuve” | action locale modal | reste dans contexte | id preuve | idem + journalisation source | OK | Faible | Conserver + tracer raison. |
| Incidents | “Voir détail” carte/ligne | modal détail incident | détail exact incident | id incident présent | + contexte d’origine (dashboard/alert) | OK | Faible | Ajouter retour contextualisé éventuel. |
| Incidents détail | “Corriger” | ouvre action/assistant selon bouton | créer action corrective liée incident | parfois id incident | id incident + gravité + cause + site | Flou | Élevé | Préremplir action corrective automatiquement. |
| Incidents détail | “Créer action” | navigation/creation actions | création contextualisée incident | partiel | `source=incident`, `incidentId`, titre suggéré | Flou | Élevé | Centraliser factory payload. |
| Incidents détail | “Créer risque” | navigation risques | création risque préremplie depuis incident | limité | `sourceIncidentId`, danger, zone | Flou | Moyen | Créer mapping incident→risque. |
| Incidents détail | “Aller au plan d’actions” | `#actions` | `#actions` filtré sur incident lié | aucun | `linkedIncidentId` | Mal branché | Élevé | Ajouter filtre relationnel. |
| Risques registre | bouton “Action” ligne risque | crée/ouvre action | action liée risque | parfois id risque | id risque + niveau + mesure recommandée | Flou | Moyen | Préremplir champ “source risk”. |
| Risques registre | bouton “PTW” | vers permis | créer permis depuis risque | partiel | `riskId`, activité, zone | Flou | Moyen | Créer préset formulaire permis. |
| Risques | “Voir détail” ligne | ouvre sheet modal risque | détail exact | id risque | + provenance pour back-nav | OK | Faible | Pas prioritaire. |
| Actions | KPI cards cliquables | filtres in-page (toggleKpiStripFilter) | conforme si cohérent avec libellé | clé KPI | + persistance filtre si navigation | OK | Faible | Vérifier cohérence libellés/règles. |
| Actions | menu “…” carte action | edit/assign/status | principalement in-context | id action | + journal source | OK | Faible | Ajouter audit trail UX. |
| Actions | “Créer action” principal | dialog création | création générique | préfill optionnel | préfill depuis intent entrant | Flou | Moyen | Consommer systématiquement intent. |
| Audits | CTA hero “Lancer audit terrain” | ouvre flow audit terrain | pertinent | contexte audit module | + site/type audit présélectionnés | OK | Faible | Étendre présets selon source. |
| Audits | “Générer PDF” | export rapport | pertinent | audit sélectionné selon état | id audit explicite | Flou | Moyen | Verrouiller sur audit courant. |
| Audits | “Créer action depuis constat” | crée action | parfois contextualisé | constat partiel | `auditId`, `findingId`, criticité | Flou | Élevé | Contraindre création contextualisée. |
| Audits | lignes cockpit/constats cliquables | goPilotage / ouverture | destination parfois large | info limitée | deep-link vers constat exact | Flou | Moyen | Introduire identifiant constat dans route/intents. |
| FDS/Documents | “FDS expirées” KPI/alerte | probablement vers produits/docs génériques | liste FDS filtrée expirées | non garanti | `docType=FDS`, `status=expired` | Mal branché | Critique | Ajouter filtre obligatoire sur entrée. |
| Import Excel | CTA import | page import/handler | correct fonctionnellement | fichier + type | + module cible et mapping validé | OK | Faible | Ajouter contrôle post-import contextualisé. |
| Export PDF | CTA export dashboard/audits | service PDF | correct | contexte variable | objet cible explicite (site/période) | Flou | Moyen | Normaliser contrat export payload. |
| Alertes | ligne alerte cliquable | navigation module concerné | devrait ouvrir objet exact | ref parfois stockée | page + ref + filtre de sécurité | Flou | Élevé | Utiliser `link.ref` partout + fallback robuste. |
| Notifications | item notification | `link: {page, ref}` store | bon potentiel | page+ref en data | résolution ref→objet puis ouverture détail | Flou | Moyen | Implémenter resolver uniforme. |
| Toasts actionnables | bouton action toast | callback local | dépend implémentation appelante | callback opaque | convention callback avec intent typé | Flou | Moyen | Définir API toast d’action standard. |
| Modales | boutons “Fermer/Annuler” | close dialog | OK | n/a | n/a | OK | Faible | Aucun. |
| Menus “…” | actions secondaires | souvent locale | pertinent si objet courant | id local | + navigation ciblée quand nécessaire | Flou | Faible | Vérifier chaque menu pour deep-link manquant. |
| Tableaux | lignes cliquables | souvent open detail | généralement correct | id ligne | + contexte liste filtrée | OK | Faible | Mémoriser filtres avant drill-down. |
| Cards KPI cliquables | clic carte => module | bon niveau macro | manque parfois filtre métier | kpiKey variable | preset filtre strict | Flou | Élevé | Cartographier KPI->filtres canoniques. |
| Sidebar | navigation module | hash vers page | attendu | pageId | conserver source nav | OK | Faible | Ajouter métrique d’usage. |
| Header/topbar CTA | CTA contextuel depuis navigation data | page cible unique | pertinent macro | pageId | + intent de contexte page source | Flou | Moyen | Étendre `cta` schema dans navigation data. |
| Recherche globale (Ctrl+K) | ouverture page depuis index | vers page du résultat | utile mais macro | pageId | + sous-cible (section/tab/filtre) | Flou | Élevé | Ajouter métadonnées de “destination fine”. |
| Configuration entreprise | boutons paramètres | in-page actions | majoritairement correct | état formulaire | + retour contexte si lancé depuis alerte | OK | Faible | QA non bloquante. |
| Auth (login) | “Continuer / Skip” | vers `#dashboard` | correct | aucun | éventuellement `postAuthIntent` | Flou | Moyen | Supporter redirection vers intention initiale. |

---

## 5) Pertinence fonctionnelle (synthèse)

### Correct (globalement)
- Navigation structurelle shell (sidebar/header/pageId).
- Ouverture des modales de détail (incident, risque, audit) quand ID objet déjà disponible.
- Parcours export/import de base.

### Flou (à clarifier)
- Passage de filtres sur KPI/cockpit/alertes.
- Uniformité des callbacks de toasts/notifications.
- Usage mixte des méthodes de navigation.

### Mal branché (priorité haute)
- Flux ISO “Créer action / Ajouter preuve” non systématiquement préliés à l’exigence.
- Entrées “FDS expirées” non garanties vers liste expirée filtrée.
- CTA “aller vers actions” depuis incident/audit sans contrainte de contexte relationnel.

---

## 6) Ordre de correction conseillé (roadmap)

1. **Standard de contexte unique** (navigation intent contract) pour tous les CTA métiers.
2. **Flux ISO critiques** : exigence → action / preuve contextualisées.
3. **KPI & alertes dashboard/cockpit** : mapping strict KPI/alerte → filtres cibles.
4. **Incidents/Audits vers Actions/Risques** : préremplissage et relation objet source.
5. **FDS expirées & documents** : routes/filtres explicites.
6. **Notifications/toasts/recherche Ctrl+K** : destination fine (pas seulement module).
7. **Harmonisation technique** : réduire `window.location.hash` brut au profit helper unifié.

---

## 7) Recommandations de correction (sans implémentation ici)

- Définir un **schéma TypeScript/JSDoc unique** de `NavigationIntent` (source, objectType, objectId, filters, prefill, tab, anchor).
- Exiger que tout CTA métier appelle un helper unique (ex: `navigateWithIntent(pageId, intent)`).
- Créer des **presets canoniques** :
  - `actions.overdue`, `incidents.critical`, `fds.expired`, `audits.findings.priority`.
- Ajouter un **resolver ref->objet** pour notifications (ouvrir détail si `ref` trouvée, sinon liste filtrée).
- Journaliser analytics “CTA clicked / intent resolved / fallback used”.
- Mettre en place garde-fous QA : test unitaire de mapping + tests e2e de parcours prioritaires.

---

## 8) Tests à prévoir

### 8.1 Tests unitaires
- Mapping CTA/KPI → destination + filtres attendus.
- Validation schéma `NavigationIntent`.
- Resolver notifications par `ref`.

### 8.2 Tests intégration
- Incident détail → créer action : champs préremplis (incidentId/site/severity).
- Exigence ISO → créer action / ajouter preuve : lien exigence persistant.
- FDS expirées → ouverture liste filtrée expirées.

### 8.3 Tests E2E (prioritaires)
1. Dashboard “Actions en retard” → vue actions filtrée retard.
2. Dashboard “Incidents critiques” → vue incidents criticité critique.
3. ISO exigence critique → “Créer action” préliée exigence.
4. ISO exigence critique → “Ajouter preuve” préliée exigence.
5. Incident détail → “Corriger” ouvre objet exact ou action corrective contextualisée.
6. Audit constat prioritaire → “Traiter” ouvre création action liée au constat.
7. Notification avec ref objet → ouvre détail exact.
8. Ctrl+K résultat métier → ouvre sous-vue pertinente (pas module générique).

### 8.4 Critères d’acceptation
- Aucun CTA métier ne doit seulement “changer de module” sans transporter un contexte exploitable.
- Tout bouton “Voir détail” ouvre le bon objet.
- Tout bouton “Corriger/Traiter/Créer action” crée/ouvre avec lien source vérifiable.
- Les filtres attendus sont visibles et actifs à l’arrivée.

