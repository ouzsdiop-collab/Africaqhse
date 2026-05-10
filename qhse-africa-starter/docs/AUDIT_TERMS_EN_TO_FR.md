# Audit des termes EN visibles — QHSE Control

## 1) Résumé exécutif

Cet audit identifie les textes **anglais visibles utilisateur** (ou potentiellement visibles via données/API) dans QHSE Control, sans modifier le code applicatif.

Constats principaux :
- L’interface est majoritairement en français, mais plusieurs termes EN persistent dans des zones critiques (exports, statuts, notifications, navigation démo).  
- Les risques les plus élevés concernent les **statuts métier bruts** (`pending`, `validated`, `rejected`, `closed`, `done`) susceptibles d’être affichés tels quels selon les flux API / seed / fallback.  
- Les termes EN sont concentrés dans :
  - statuts et normalisation frontend/backend,
  - libellés export/import,
  - composants notifications/digest,
  - contenus démo/seed.

Recommandation : mettre en place une couche de traduction centralisée (dictionnaire i18n FR métier) avant correction module par module.

---

## 2) Méthode de recherche

### Commandes utilisées (audit uniquement)

```bash
rg -n "\"[A-Za-z][^\"]{1,120}\"" qhse-africa-starter/src qhse-africa-starter/backend/src qhse-africa-starter/public --glob '!**/*.test.*' --glob '!**/*.spec.*'
```

```bash
rg -n -i "(dashboard|cockpit|summary|settings|reports|upload|export|search|actions|recommendations|overview|readiness|compliance|score|priority|status|pending|completed|open|closed|overdue|draft|approved|rejected|active|inactive|high|medium|low|critical|ready|warning|error|success|save|cancel|delete|edit|create|update|submit|required|empty|no data|loading|retry)" qhse-africa-starter/src qhse-africa-starter/backend/src --glob '*.{js,jsx,ts,tsx,json,html,md}'
```

```bash
rg -n "'([^']*(Dashboard|Settings|Reports|Upload|Export|Search|Actions|Overview|Status|Pending|Completed|Open|Closed|Overdue|Draft|Approved|Rejected|Active|Inactive|High|Medium|Low|Critical|Warning|Error|Success|Save|Cancel|Delete|Edit|Create|Update|Submit|Loading|Retry)[^']*)'|\"([^\"]*(Dashboard|Settings|Reports|Upload|Export|Search|Actions|Overview|Status|Pending|Completed|Open|Closed|Overdue|Draft|Approved|Rejected|Active|Inactive|High|Medium|Low|Critical|Warning|Error|Success|Save|Cancel|Delete|Edit|Create|Update|Submit|Loading|Retry)[^\"]*)\"" qhse-africa-starter/src qhse-africa-starter/backend/src --glob '*.{js,jsx,ts,tsx,json,html}'
```

### Critères de tri appliqués
- Inclus : textes rendus UI, labels, placeholders, toasts, exports PDF/CSV, statuts potentiellement rendus bruts.
- Exclus : noms de variables/fonctions/classes CSS, routes techniques, commentaires non visibles, tests.

---

## 3) Zones auditées

- Dashboard / cockpit / synthèse hebdo
- Suggestions assistées IA
- Modules ISO / risques / incidents / actions / audits
- FDS / documents / import Excel / export PDF
- Alertes / modales / boutons / formulaires / tableaux / filtres
- Menu / sidebar / header
- Auth / erreurs / états vides / notifications / validation
- Seed/demo et réponses backend affichées côté front

---

## 4) Tableau des termes anglais visibles trouvés

| Terme EN trouvé | Traduction FR proposée | Fichier | Ligne approx. | Contexte d’affichage | Risque | Stratégie |
|---|---|---|---:|---|---|---|
| Export CSV | Exporter en CSV | `src/pages/actions.js` | ~478 | Bouton export actions | Moyen | Uniformiser verbes d’action UI |
| Export… | Export en cours… | `src/pages/actions.js` | ~483 | État bouton pendant export | Faible | Normaliser état de chargement |
| Export CSV | Exporter en CSV | `src/pages/incidents.js` | ~737 | Bouton export incidents | Moyen | Cohérence labels boutons |
| Export PDF | Exporter en PDF | `src/pages/incidents.js` | ~763 | Bouton export incidents PDF | Moyen | Harmoniser pattern “Exporter en …” |
| Export PDF | Exporter en PDF | `src/pages/performance.js` | ~583 | Export performance | Moyen | Même traduction sur tous modules |
| Exporter PDF | Exporter en PDF | `src/components/isoAuditReportPanel.js` | ~275 | CTA export ISO | Faible | Standardiser infinitif |
| Exports | Exportations | `src/pages/settings.js` | ~318 | Ancre/section paramètres | Faible | Glossaire navigation |
| Exports | Exportations | `src/pages/habilitations.js` | ~480 | Label section | Faible | Cohérence navigation |
| Digest pilotage | Synthèse de pilotage | `src/components/notifications.js` | ~58 | Panneau notifications | Élevé | Remplacer anglicisme produit |
| Summary (weeklySummary clé métier) | Synthèse hebdomadaire | `backend/src/controllers/settings.controller.js` | ~68 | Paramètre notification affichable | Moyen | Mapper clé->label FR UI |
| pending | En attente | `src/components/isoProofsManager.js` | ~116 | Statut preuve importée | Élevé | Mapper statuts API côté UI |
| validated | Validé | `src/components/isoProofsManager.js` | ~116 | Statut preuve importée | Élevé | Mapper statuts API côté UI |
| rejected | Rejeté | `src/components/isoProofsManager.js` | ~116 | Statut preuve importée | Élevé | Mapper statuts API côté UI |
| closed | Clôturé | `src/pages/mines-demo.js` | ~329 | KPI démo (permis/NC actifs) | Moyen | Normaliser statuts démo |
| done | Terminé | `src/services/isoTerrainLinks.service.js` | ~131 | Détection statut action ouverte/fermée | Moyen | Mapper statut brut en amont |
| closed | Clôturé | `src/services/isoTerrainLinks.service.js` | ~131 | Même logique fermeture | Moyen | Dictionnaire statuts central |
| partial | Partiel | `backend/src/services/auditAutoReport.service.js` | ~232 | Statut audit narratif potentiellement affiché | Moyen | Traduire avant rendu PDF/UI |
| na | N/A / Non applicable | `backend/src/services/auditAutoReport.service.js` | ~229 | Statut conformité | Faible | Conserver clé technique, traduire label |
| Dashboard mines | Tableau de bord mines | `src/pages/mines-demo.js` | ~165 | Navigation démo | Faible | FR complet pour démos visibles |
| Upload invalide | Téléversement invalide | `backend/src/controllers/controlledDocuments.controller.js` | ~37 | Message backend renvoyé au front | Faible | Uniformiser terminologie “Téléverser” |
| Upload invalide | Téléversement invalide | `backend/src/controllers/isoEvidence.controller.js` | ~28 | Message backend preuve ISO | Faible | Même stratégie transversale |
| success / error / warning (niveau toast) | succès / erreur / avertissement | `src/pages/*.js`, `src/services/*.js` | multiple | Type de toast parfois réutilisé brut | Moyen | Garder clé technique EN, afficher label FR |
| critical / low (severity brute) | critique / faible | `src/pages/dashboard.js` | ~663, ~772 | Sévérité potentiellement affichée via fallback | Élevé | Mapper sévérité via helper unique |
| nonConformitiesOpen (clé backend) | Non-conformités ouvertes | `src/services/qhseReportsPdf.service.js` | ~473-534 | KPI export PDF | Faible | Ne pas exposer clé brute ; label FR déjà partiel |

---

## 5) Stratégie de traduction recommandée

1. **Créer un dictionnaire central des labels visibles** (FR métier QHSE).  
2. **Conserver les clés techniques EN** (API, enums internes), mais **ne jamais les afficher brutes**.  
3. Introduire des helpers dédiés :
   - `translateStatus(key)`
   - `translateSeverity(key)`
   - `translateActionLabel(key)`
4. Normaliser les CTA : `Exporter en …`, `Téléverser`, `Réessayer`, `Annuler`, etc.
5. Verrouiller par tests UI/snapshot pour éviter régression d’alignement/longueur de labels.

---

## 6) Emplacement recommandé pour les traductions

Proposition (sans implémentation dans cet audit) :
- `qhse-africa-starter/src/i18n/fr/uiLabels.js`
- `qhse-africa-starter/src/i18n/fr/statusLabels.js`
- `qhse-africa-starter/src/i18n/fr/severityLabels.js`
- `qhse-africa-starter/src/i18n/fr/exportLabels.js`
- `qhse-africa-starter/src/utils/i18nTranslate.js`

Côté backend (messages affichables) :
- `qhse-africa-starter/backend/src/i18n/fr/apiMessages.js`

---

## 7) Exemples de mappings

```js
status: {
  pending: 'En attente',
  validated: 'Validé',
  rejected: 'Rejeté',
  closed: 'Clôturé',
  done: 'Terminé',
  partial: 'Partiel',
  na: 'Non applicable'
}
```

```js
severity: {
  critical: 'Critique',
  high: 'Élevée',
  medium: 'Moyenne',
  low: 'Faible'
}
```

```js
cta: {
  export_csv: 'Exporter en CSV',
  export_pdf: 'Exporter en PDF',
  retry: 'Réessayer',
  save: 'Enregistrer',
  cancel: 'Annuler'
}
```

---

## 8) Ordre de correction conseillé

1. **Statuts/sévérités bruts** (risque le plus élevé de fuite EN dans UI).  
2. **Notifications/toasts/messages backend affichés**.  
3. **Boutons et exports (CSV/PDF)**.  
4. **Démos/seed visibles client**.  
5. **Affinage terminologique QHSE** (uniformité métier : conformité, écart, criticité, clôture).

---

## 9) Tests à prévoir

- Tests unitaires mapping (`status`, `severity`, `cta`).
- Tests de rendu composants clés : dashboard, incidents, actions, ISO, notifications.
- Tests d’intégration sur retours API (statuts EN -> affichage FR).
- Tests d’export PDF/CSV (labels FR en en-têtes et sections).
- Test manuel responsive pour vérifier l’absence de casse UI (labels plus longs).
- Test non-régression accessibilité (aria-labels traduits, pertinents).

