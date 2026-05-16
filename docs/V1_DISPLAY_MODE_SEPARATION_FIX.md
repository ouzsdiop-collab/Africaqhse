# V1 Display Mode Separation Fix

## Bug initial
Le mode **Essentiel** utilisait `data-display-mode='terrain'`.

Conséquence directe :
- bascule Essentiel => activation des règles/layout terrain-mobile ;
- sidebar/menu desktop impactés ;
- comportement shell incohérent sur desktop/tablette.

## Cause racine
Le mapping des modes mélangeait deux intentions différentes :
- **Essentiel** (simplification de contenu desktop) ;
- **Terrain** (UX/navigation spécifique mobile/terrain).

Le code mappait implicitement Essentiel vers `terrain`.

## Correction appliquée
Séparation des modes en 3 états effectifs :
- `essential` : simplification de contenu sans casser le shell desktop ;
- `expert` : mode complet ;
- `field` : mode terrain/mobile.

### Changements clés
1. Mapping JS du mode affichage
   - `Essentiel -> essential`
   - `Expert -> expert`
   - `Terrain legacy -> field` (compatibilité lecture)

2. Attribut DOM
   - `data-display-mode='essential'` pour Essentiel
   - `data-display-mode='expert'` pour Expert
   - `data-display-mode='field'` pour le vrai mode terrain

3. CSS
   - règles Essentiel desktop ciblent désormais `[data-display-mode='essential']`;
   - règles terrain mobile restent réservées au mode `field`.

4. Topbar / navigation
   - le toggle Essentiel n’envoie plus automatiquement vers `terrain-mode`;
   - il conserve une navigation desktop stable.

## Fichiers modifiés
- `qhse-africa-starter/src/utils/displayMode.js`
- `qhse-africa-starter/src/components/topbarV2.js`
- `qhse-africa-starter/src/main.js`
- `qhse-africa-starter/src/components/sidebarV2.js`
- `qhse-africa-starter/src/utils/permissionsUi.js`
- `qhse-africa-starter/src/styles/displayModes.css`
- `qhse-africa-starter/src/styles/essential-desktop.css`

## Règles futures (garde-fous)
1. **Ne jamais** réutiliser `terrain`/`field` pour représenter Essentiel.
2. `essential` = simplification de contenu uniquement.
3. `field`/`terrain` = UX terrain/mobile dédiée.
4. Toute nouvelle règle CSS de simplification doit cibler explicitement `essential`.
