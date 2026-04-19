# Checklist premium — pages métier (critères mesurables)

Référence pour revues QA / design : **ISO & Conformité**, **Audits**, **Risques**, **Actions**.  
Les seuils sont indicatifs ; ajuster selon votre charte WCAG interne.

---

## Critères transverses (toutes les pages)

| ID | Critère | Cible mesurable | Vérification |
|----|-----------|-----------------|--------------|
| G1 | Espacement vertical entre blocs majeurs (`page-stack`) | Intervalle **≥ 22px** et **≤ 42px** (`clamp`) via `--page-stack-gap` | Inspecteur : `.page-stack--premium-saas` |
| G2 | Contraste texte courant | **≥ 4.5:1** (WCAG AA corps) sur fond carte | axe DevTools ou contrast checker |
| G3 | États vides | Titre **+** explication **+** action ou filtre (pas seul « 0 ») | Ex. **Incidents** (filtre sans résultat → CTA réinitialiser), **Journal** (filtres / période → CTA réinitialiser) ; à généraliser Kanban / autres listes |
| G4 | Chargement | Skeleton ou shimmer **≥ 300 ms** attendu réseau ; pas d’écran blanc sans texte | Throttling réseau |
| G5 | Focus clavier | Outline visible **≥ 2px** sur boutons et lignes interactives | Tab dans la page |
| G6 | Erreur API | Toast ou bannière **avec** libellé action (réessayer / autre périmètre) | Couper API |

---

## Dashboard (référence)

| ID | Critère | Cible |
|----|---------|--------|
| D1 | Largeur utile | Cartes principales **`max-width`** alignée conteneur (**~1460px** shell) |
| D2 | Hiérarchie | Au plus **3 niveaux** visuels dominants au-dessus de la ligne de flottaison |

---

## ISO & Conformité (`iso-page`)

| ID | Critère | Cible mesurable |
|----|---------|-----------------|
| I1 | Cartes hub | Padding interne carte **18–26px** ; pas de doubles bordures fantômes entre bandeaux |
| I2 | Tableau exigences | Hauteur ligne mini **44px** zone clic (touch) ; labels statut lisibles mode clair |
| I3 | Imports / preuves | Message si périmètre vide : **mention explicite** « aucune ligne » + lien doc ou filtre |
| I4 | PDF export | Indicateur succès ou erreur sous **≤ 5 s** perception (toast ou toast + progression) |

---

## Audits (`audit-premium-page`)

| ID | Critère | Cible mesurable |
|----|---------|-----------------|
| A1 | Toggle gravité Mineur / Majeur | Contraste **≥ 4.5:1** label sur fond sélectionné (modes clair / sombre ) |
| A2 | Zone décision / traçabilité | Champs formulaire fond **≠** charbon en mode clair (`--color-background-primary`) |
| A3 | Checklist chantier | Sections repliables : titre **≥ 13px** équivalent ; état développé visible |

---

## Risques (`risks-page`)

| ID | Critère | Cible mesurable |
|----|---------|-----------------|
| R1 | Matrice 5×5 | Tooltip : fond lisible les **deux** thèmes (`--color-background-primary` + texte primaire) |
| R2 | Filtrage matrice | État vide filtre : message **≠** générique tableau ; bouton « tout afficher » présent ou équivalent |
| R3 | Registre vide | Bloc `.empty-state` avec **au moins** titre + sous-texte (+ CTA si création disponible) |

---

## Actions (`page-stack--actions-premium`)

| ID | Critère | Cible mesurable |
|----|---------|-----------------|
| C1 | Kanban colonnes | Message vide **par colonne** cohérent avec filtre actif |
| C2 | Densité cartes | Une carte action : titre **clair** au premier coup d’œil ; pas **> 6** lignes méta sans repli |

---

## Performance (bonus produit)

| ID | Critère | Cible |
|----|---------|--------|
| P1 | JS initial | Pas de blocage **> 500 ms** sur machine référence après cache (mesure Lighthouse / Performance) |
| P2 | Chunks | Routes lourdes (PDF, iso long) chargées **à la demande** |

---

## Suivi

- Mettre à jour cette checklist après chaque passe module.
- Référence CSS d’alignement espacement : classe **`page-stack--premium-saas`** sur les `page-stack` **de toutes les routes shell** (dont dashboard, incidents, ISO, audits, risques, actions, paramètres…) ; fichier **`page-premium-unified.css`**.
