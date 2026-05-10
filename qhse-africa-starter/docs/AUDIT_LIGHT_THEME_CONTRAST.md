# AUDIT COMPLET — MODE CLAIR (Contraste & cohérence visuelle)

## 1) Résumé exécutif

Cet audit confirme que le **mode clair** de QHSE Control est partiellement harmonisé, mais reste affecté par des **styles dark-like injectés directement dans des composants** (inline CSS/strings JS/CSS locaux), notamment sur:

- modales/dialogs/drawers;
- cartes internes cockpit/audits/dashboard;
- badges/chips/états secondaires;
- overlays/toasts et éléments de focus visuel;
- certains composants charts (conteneurs + labels/footnotes).

Le pattern principal observé:
- usage fréquent de `background: rgba(0,0,0,...)` et fallback sombres (`#0f172a`, `#1e293b`, `#0b1220`) même hors scope dark;
- variables de texte secondaire faibles (`--text2`, `--text3`) parfois insuffisantes sur fonds gris;
- couleurs d’état (rouge/vert/bleu/teal) non systématiquement calibrées pour le mode clair (parfois trop “flash” ou trop pâles selon le fond).

Impact: lisibilité dégradée, fatigue visuelle, perception “mode sombre cassé en clair”, hiérarchie UI instable selon les modules.

---

## 2) Méthode de recherche

Audit statique du code sans modification applicative, centré sur:

1. recherche de classes/couleurs sombres hardcodées;
2. recherche de fallbacks dark dans composants visibles en light;
3. inspection des zones demandées (dashboard, cockpit, ISO, risques, incidents, actions, audits, import/export, modales, etc.);
4. qualification par gravité (Critique / Majeure / Mineure) selon impact contraste & fréquence.

Commandes de base utilisées (non exhaustif):

```bash
rg -n "bg-(slate|gray|zinc|neutral|stone)-(700|800|900|950)|from-(slate|gray|zinc|neutral|stone)-(800|900|950)|to-(slate|gray|zinc|neutral|stone)-(800|900|950)|border-(slate|gray|zinc|neutral|stone)-(700|800|900|950)|text-white|text-slate-50|text-gray-50|shadow-black" qhse-africa-starter/src

rg -n "#0f172a|#111827|#1f2937|#020617|#000|rgba\(0,\s*0,\s*0|data-theme='light'|modal|dialog|drawer|popover|toast|chart|tooltip" qhse-africa-starter/src
```

Constat important: peu/pas d’empreinte Tailwind “dark classes”, mais une forte empreinte de styles inline / CSS custom avec noirs translucides.

---

## 3) Zones auditées

Couvertes par inspection de `src`:

- Dashboard & cockpit (KPIs, charts, panneaux décisionnels);
- Synthèse/semaine & suggestions assistées (zones premium/intelligence);
- ISO (conformité, import revue, copilot);
- Risques / Incidents / Actions / Audits;
- FDS/documents et registres;
- Import Excel / export PDF (UI de pilotage export/import, hors rendu PDF final);
- Alertes, badges, chips, boutons;
- Modales/dialogs/drawers/popovers/menus;
- Formulaires, filtres, tableaux;
- Sidebar/header;
- Auth (login);
- états vides, toasts/notifications;
- graphiques Chart.js (conteneurs/tooltip settings locaux);
- recherche globale (sur base styles génériques partagés);
- configuration entreprise (settings + SaaS clients).

---

## 4) Problèmes mode clair trouvés

## A. Problèmes **critiques**

1. **Dialogs/modales avec fond dark par défaut en mode clair**.
   - `auditFormDialog`: `background: var(--bg,#0f172a)` + shadow très sombre.
   - `incidentDetailPanel`: même pattern (`#0f172a` fallback + backdrop sombre).
   - `ai-center` drawer: `background: var(--color-surface,#0f172a)`.
   - `saas-clients` secret panel: `background: var(--surface2,#1e293b)`.

   Risque: blocs quasi “dark-only” en light, contraste inversé inattendu.

2. **Overlay/backdrop trop opaques en clair**.
   - Multiples `rgba(0,0,0,.55/.58/.68)` sur overlays/dialogs.

   Risque: perception lourde, perte de séparation des plans, accessibilité réduite (surtout petits écrans).

3. **Cartes internes en noir translucide dans modules métier** (audits/ISO/etc.).
   - usages répétés `background: rgba(0,0,0,.1 ~ .22)` sur cartes, headers, blocs NC, champs.

   Risque: “gris sale” en light + textes secondaires insuffisants.

## B. Problèmes **majeurs**

4. **Texte secondaire trop faible sur surfaces teintées**.
   - récurrence `var(--text2,#94a3b8)` / `var(--text3)` sur fonds gris/noirs translucides.

5. **Couleurs d’état non normalisées (vert/rouge/bleu/teal)**.
   - plusieurs modules appliquent des teintes locales (inline) sans palette light unifiée;
   - certaines teintes d’accent paraissent agressives (forte saturation) ou, inversement, trop pâles selon le fond.

6. **Charts: conteneurs premium avec mix de noirs + accents**.
   - dégradés et ombres orientés dark dans des sections dashboard/cockpit;
   - risque de lisibilité labels/annotations selon combinaison fond + data colors.

7. **Incohérence entre correctifs light ciblés et styles legacy**.
   - présence de `dashboard-contrast-fixes.css` (bonne direction), mais coexistence avec styles inline legacy peut créer des “poches sombres” non couvertes.

## C. Problèmes **mineurs**

8. **Badges/chips/notes info avec contrastes variables**.
   - certains badges restent lisibles, mais manque de cohérence inter-modules.

9. **Shadows très denses en mode clair**.
   - ombres noires fortes (blur large) donnant une sensation de lourdeur visuelle.

---

## 5) Fichiers concernés (principaux)

### Base globale
- `qhse-africa-starter/src/styles.css`
- `qhse-africa-starter/src/styles/dashboard-contrast-fixes.css`

### Dashboard / cockpit / charts
- `qhse-africa-starter/src/pages/dashboard.js`
- `qhse-africa-starter/src/pages/dashboard/chartsSection.js`
- `qhse-africa-starter/src/pages/dashboard/decisionPanel.js`
- `qhse-africa-starter/src/components/dashboardCockpitPremium.js`

### ISO
- `qhse-africa-starter/src/pages/iso.js`
- `qhse-africa-starter/src/components/isoCopilotConformiteModule.css`
- `qhse-africa-starter/src/components/isoComplianceAssistPanel.js`
- `qhse-africa-starter/src/components/isoAuditReportPanel.js`

### Risques / incidents / actions / audits
- `qhse-africa-starter/src/components/incidentFormDialog.js`
- `qhse-africa-starter/src/components/incidentDetailPanel.js`
- `qhse-africa-starter/src/components/riskSheetModal.js`
- `qhse-africa-starter/src/components/actionCreateDialog.js`
- `qhse-africa-starter/src/components/auditFormDialog.js`
- `qhse-africa-starter/src/components/auditPlusStyles.js`
- `qhse-africa-starter/src/components/auditPremiumSaaS.js`

### Settings / auth / imports / divers UI
- `qhse-africa-starter/src/pages/settings.js`
- `qhse-africa-starter/src/pages/login.js`
- `qhse-africa-starter/src/pages/imports.js`
- `qhse-africa-starter/src/pages/saas-clients.js`
- `qhse-africa-starter/src/components/sidebarV2.js`
- `qhse-africa-starter/src/components/topbarV2.js`
- `qhse-africa-starter/src/components/toast.js`

---

## 6) Classes/couleurs en cause (patterns)

- **Noirs translucides (principal facteur d’assombrissement light)**:
  - `rgba(0,0,0,.08/.1/.12/.14/.18/.2/.22/.28/.35/.55/.68)`
- **Fallback surfaces sombres**:
  - `#0f172a`, `#1e293b`, `#0b1220`
- **Texte secondaire fragile**:
  - `var(--text2,#94a3b8)`, `var(--text3)` sur fonds intermédiaires
- **Shadows très dark**:
  - `box-shadow` à base `rgba(0,0,0,.45+)`
- **Accents non harmonisés**:
  - bleus/teals/rouges/verts locaux sans token commun light-first.

---

## 7) Gravité par zone

- **Critique**: modales/dialogs/drawers (audit/incident/AI center/SaaS secret panel).
- **Majeure**: cockpit/dashboard premium cards, audit premium cards, ISO summary blocks, incidents/actions secondaires.
- **Majeure**: badges/chips/alertes non normalisés entre modules.
- **Mineure à Majeure**: formulaires/tables/textes secondaires selon densité de blocs assombris.

---

## 8) Recommandations de correction

1. **Tokeniser strictement les surfaces light**:
   - remplacer noirs translucides de structure par tokens `--surface-1/2/3` dédiés light.
2. **Séparer explicitement light/dark par variables, pas par fallback dark**.
3. **Créer une échelle texte** (`primary/secondary/tertiary`) validée WCAG AA sur chaque surface.
4. **Normaliser états sémantiques**:
   - success/warning/danger/info: fond + border + texte dédiés light.
5. **Réduire opacité overlays en light**:
   - viser un voile léger et constant, non “cinéma dark”.
6. **Unifier ombres light**:
   - faible densité, blur modéré, priorité à border/subtle elevation.
7. **Charts**:
   - palette datasets distincte light; labels/ticks/tooltips adossés à tokens contrastés.
8. **Réduction inline styles**:
   - migrer styles critiques vers feuilles thématiques centralisées.

---

## 9) Stratégie de correction light mode (sans casser dark)

1. **Approche token-first**: définir/renforcer tokens par thème (`html[data-theme='light']` vs `dark`).
2. **Conserver structure CSS existante**: patcher d’abord les variables, puis seulement les exceptions composant.
3. **Ajouter couche “light-override” modulaire** par domaine (dialogs, cards, badges, charts).
4. **Ne pas toucher les règles dark existantes** sauf régression prouvée.
5. **Comparer systématiquement avant/après** sur 3 écrans (desktop/tablette/mobile) et 3 densités de contenu.

---

## 10) Ordre de correction conseillé

1. Modales/dialogs/drawers/backdrops (impact UX maximal).
2. Surfaces cartes cockpit/dashboard/audits/ISO.
3. Texte secondaire + badges/chips/alertes.
4. Boutons/formulaires/filtres/tables.
5. Charts/legendes/tooltips.
6. Pages auth/erreur/états vides/toasts.
7. Finitions sidebar/header/recherche globale/settings entreprise.

---

## 11) Tests visuels à prévoir

- **Snapshots light mode** par module (avant/après) sur pages listées au périmètre.
- **Tests contraste**:
  - texte normal (AA), texte large, composants interactifs.
- **Tests interactions**:
  - hover/focus/active/disabled sur boutons, chips, menus, filtres.
- **Tests overlays**:
  - modal + drawer + popover superposés.
- **Tests charts**:
  - lisibilité labels axes, tooltip, légende, couleurs datasets.
- **Tests accessibilité clavier**:
  - focus visible en mode clair.
- **Tests non-régression dark mode**:
  - parcours miroir sur modules critiques.

---

## 12) Conclusion

Le mode clair dispose déjà de correctifs ciblés, mais la dette visuelle persiste à cause de nombreux styles sombres injectés localement. Une correction efficace passera par une **normalisation des tokens light**, puis un **nettoyage progressif des surfaces/overlays/cartes/modales**, en gardant le dark mode intact via séparation stricte des variables et overrides.
