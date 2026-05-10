# AUDIT CIBLÉ — MODE CLAIR
## Séparation visuelle des sous-blocs, cartes internes et sections imbriquées

## 1) Résumé exécutif

En mode clair, plusieurs composants de QHSE Control présentent une **séparation insuffisante entre le bloc parent et ses sous-blocs internes**. Les problèmes reviennent de façon récurrente :

- bordures trop fines/faiblement opaques;
- fonds de sous-cartes trop proches du fond parent;
- séparateurs (head/body, rows, sections) trop discrets;
- ombres faibles ou incohérentes pour l’élévation interne;
- badges/chips peu détachés visuellement;
- hiérarchie interne des sections insuffisante (cartes imbriquées).

Le mode sombre étant globalement stable, le défaut principal vient d’un **design de séparation insuffisamment “light-first”** dans des styles inline et des surfaces fallback sombres/translucides.

---

## 2) Méthode d’audit (audit statique uniquement)

Audit réalisé sans modifier le code applicatif.

### Commandes de repérage utilisées

```bash
rg -n "border|borderColor|border-|divide-|ring-|outline-" qhse-africa-starter/src

rg -n "background:\s*rgba\(0,0,0|background:\s*var\(--surface|box-shadow|card-soft|content-card|dashboard|cockpit|iso|modal|drawer|popover|table|form|badge|chip" qhse-africa-starter/src

rg -n "border:\s*(none|0)|border-color:\s*transparent|rgba\([^\)]*0\.0[1-9]|rgba\([^\)]*0\.[0-1][0-9]\)|background:\s*rgba\([^\)]*0\.[0-1][0-9]\)|box-shadow:\s*none" qhse-africa-starter/src
```

### Critères d’identification

Un sous-bloc est considéré “mal séparé” en light mode si l’un des cas suivants est présent :

1. contraste fond parent / fond enfant trop proche;
2. bordure ≤ faible opacité (≈ 0.10–0.16) sur fonds similaires;
3. absence de séparation head/body ou row/row;
4. ombre inexistante ou non lisible sur fond clair;
5. badge/chip sans contour ni fond de contraste suffisant;
6. fallback de surface sombre en contexte light.

---

## 3) Périmètre prioritaire audité

- Dashboard
- Cockpit / Pilotage Essentiel
- Synthèse de la semaine
- Suggestions assistées
- Cartes KPI
- Module ISO (dont “Décision / ISO en 5 secondes”)
- Modales / Drawers / Popovers
- Formulaires / Tableaux
- Cartes internes / alertes / recommandations
- Import Excel
- Export PDF preview (UI preview)
- Configuration entreprise

---

## 4) Constats globaux (mode clair)

## A. Séparation structurelle insuffisante (Majeure)

- Multiples sous-sections utilisent des fonds très proches des cartes parentes.
- De nombreuses bordures reposent sur des alpha faibles (`rgba(..., .10-.16)`) peu visibles sur surfaces déjà grisées.
- Certains blocs internes combinent fond translucide + texte secondaire atténué, ce qui efface la hiérarchie.

## B. Cartes imbriquées et encarts “fusionnés” (Critique à Majeure)

- Plusieurs modules cockpit/dashboard/audits/ISO utilisent des sous-cartes avec élévation faible.
- Résultat : parent/enfant se confondent, surtout sur contenus denses (KPI + méta + badges + tableaux).

## C. Modales / drawers / popovers (Majeure)

- Le contraste entre panneau ouvert et éléments internes est inégal.
- Certains contenus internes n’ont pas de niveau de surface distinct (head/body/footer, blocs de synthèse, encarts d’aide).

## D. Badges / chips / micro-encarts (Majeure)

- Des badges/chips conservent un style trop discret (fond/contour proches du contexte).
- La fonction sémantique est correcte, mais la séparation visuelle est insuffisante en mode clair.

---

## 5) Composants/fichiers à risque (priorisés)

## 5.1 Dashboard / Cockpit / KPI

1. `qhse-africa-starter/src/pages/dashboard.js`
   - sections décisionnelles et cartes internes avec dégradés/ombres qui n’isolent pas toujours clairement les sous-zones en light.
2. `qhse-africa-starter/src/pages/dashboard/decisionPanel.js`
   - densité de sous-cartes/alerts/ops cards; séparation interne variable selon tone et états.
3. `qhse-africa-starter/src/pages/dashboard/kpiCards.js`
   - cartes KPI et sous-lignes de priorité pouvant manquer de détachement entre sous-éléments.
4. `qhse-africa-starter/src/pages/dashboard/chartsSection.js`
   - notes de graphique et footers parfois trop proches du fond parent.
5. `qhse-africa-starter/src/components/essentialPilotageUnifiedCockpit.js`
   - cockpit consolidé : vigilance sur cartes imbriquées et rangs d’indicateurs.

## 5.2 ISO (dont “Décision / ISO en 5 secondes”)

6. `qhse-africa-starter/src/pages/iso.js`
   - sections décision, synthèses et blocs de revue/import; risques de séparation faible des sous-encarts.
7. `qhse-africa-starter/src/components/isoCopilotConformiteModule.css`
   - séparations/ombres de blocs premium à contrôler en light.
8. `qhse-africa-starter/src/components/isoAuditReportPanel.js`
   - panel modal + résumés internes avec fonds translucides.
9. `qhse-africa-starter/src/components/isoComplianceAssistPanel.js`
   - encarts d’assistance IA et niveaux de surface.

## 5.3 Audits / Incidents / Actions

10. `qhse-africa-starter/src/components/auditPlusStyles.js`
    - forte présence de sous-blocs en `rgba(0,0,0,...)` et bordures subtiles : fusion visuelle probable en light.
11. `qhse-africa-starter/src/components/auditPremiumSaaS.js`
    - encarts/bandes premium: détachement variable.
12. `qhse-africa-starter/src/components/auditFormDialog.js`
    - structure dialog et séparation head/body/fields.
13. `qhse-africa-starter/src/components/incidentFormDialog.js`
    - drawer/form multi-sections: séparation des étapes et blocs internes.
14. `qhse-africa-starter/src/components/incidentDetailPanel.js`
    - dialog détail + segments d’information internes.
15. `qhse-africa-starter/src/components/actionCreateDialog.js`
    - sous-sections de formulaire et hiérarchie de champs.

## 5.4 Configuration entreprise / SaaS / Admin

16. `qhse-africa-starter/src/pages/settings.js`
    - nombreuses sections fonctionnelles, cartes et alert rows.
17. `qhse-africa-starter/src/pages/saas-clients.js`
    - `sc-tenant-card`, `sc-metrics`, `sc-modules`, tables et badges : séparation parfois faible en light (fonds/contours proches).

## 5.5 Imports / preview export / UI transverse

18. `qhse-africa-starter/src/pages/imports.js`
    - blocs de logs/résultats et encarts d’état avec fonds proches.
19. `qhse-africa-starter/src/components/toast.js`
    - notifications et détachement sur pages denses.
20. `qhse-africa-starter/src/styles.css`
21. `qhse-africa-starter/src/styles/dashboard-contrast-fixes.css`
    - couches globales où se joue la lisibilité des sous-niveaux de surface.

---

## 6) Patterns CSS/visuels qui causent le manque de séparation

1. **Bordures trop subtiles**
   - `border-color` avec alpha faible et proches des fonds contigus.

2. **Surfaces internes trop proches du parent**
   - fond enfant utilisant la même famille colorimétrique que le parent sans delta perceptible.

3. **Noirs translucides réutilisés en light**
   - `background: rgba(0,0,0,.08-.16)` pouvant “griser” sans créer une vraie couche.

4. **Shadows de faible contribution structurelle**
   - ombres soit absentes, soit trop diffuses/légères pour dessiner un niveau interne.

5. **Séparateurs de sections/rows trop discrets**
   - lignes de division minces et à contraste insuffisant dans tableaux/listes/rows.

6. **Badges/chips trop plats**
   - manque de combinaison fond + contour + texte pour détacher le micro-composant.

---

## 7) Gravité par zone

- **Critique**
  - Cartes imbriquées dashboard/cockpit/ISO lorsque plusieurs sous-blocs se superposent (lecture priorités/KPI/recommandations).

- **Majeure**
  - Modales/drawers/popovers : hiérarchie interne insuffisante (head/body/footer, sous-groupes).
  - Tables/formulaires denses : séparateurs et groupes de champs peu visibles.
  - Badges/chips/alertes/recommandations : détachement visuel insuffisant.

- **Mineure à Majeure**
  - Pages settings/imports selon profondeur de cartes internes.

---

## 8) Recommandations (pré-correction)

> Audit uniquement: ce sont des recommandations pour la phase suivante, sans changement de code ici.

1. Définir une **échelle de surfaces light** explicite (parent, child, nested-child).
2. Définir une **échelle de bordures light** (subtle/default/strong) avec seuil minimum de contraste.
3. Ajouter une **échelle de séparateurs** (sections, row dividers, table dividers).
4. Standardiser les **cards internes** (padding, border, radius, shadow légère mais lisible).
5. Standardiser les **badges/chips** (fond + contour + texte) par niveau sémantique.
6. Pour modales/drawers: imposer un pattern clair `head / content / aside / footer` avec séparations dédiées.
7. Valider tous les niveaux de séparation en tests visuels multi-écrans avant toute généralisation.

---

## 9) Ordre conseillé pour la prochaine phase de correction

1. Dashboard / Cockpit / KPI (impact business & fréquence d’usage).
2. ISO décisionnel (“ISO en 5 secondes”) + panels d’assistance.
3. Modales / drawers / popovers (structure interne).
4. Tables & formulaires (groupes + dividers).
5. Badges/chips/alertes/recommandations.
6. Imports / settings / preview export.

---

## 10) Plan de tests visuels à préparer

1. Captures “avant/après” en **mode clair uniquement** par zone prioritaire.
2. Vérification parent/enfant sur cartes imbriquées (3 niveaux minimum).
3. Vérification séparateurs sur tables/listes denses.
4. Vérification badges/chips sur fonds clairs variés.
5. Vérification des modales/drawers avec contenu long + formulaires.
6. Contrôle non-régression dark mode (parcours miroir).

---

## 11) Conclusion

Le défaut principal n’est pas l’absence totale de styles, mais un **niveau de séparation visuelle insuffisant** entre sous-blocs en mode clair. L’audit cible précisément les zones où la hiérarchie parent/enfant s’efface et fournit un ordre de traitement pour corriger sans dégrader le dark mode.
