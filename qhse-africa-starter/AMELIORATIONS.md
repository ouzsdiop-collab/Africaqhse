# Audit d’améliorations — QHSE Africa Starter

Document de synthèse (front + back démo). Prioriser selon votre produit cible (MVP démo vs. production).

## Avancement récent (version poussée)

Les points suivants ont été traités dans le dépôt : alignement **`permissionsUi` ↔ `permissions.js`** (risques, conformité, documents contrôlés, suggestions IA) ; **validation Zod** sur `POST /api/auth/login` (422 + `code`) ; **erreurs API** homogènes (`code`, `requestId`) ; **Sentry** avec filtrage mots de passe dans le corps de requête ; **module `reconcileDashboardStats`** extrait + tests Vitest ; message **périmètre vide** sur les KPI dashboard ; **ESLint** (`eslint.config.mjs`) + script `npm run lint` ; **`npm audit` assaini** (upgrade `jspdf@^4.2.1` + correctif Vite) ; **E2E** étendus (readiness, page Risques, navigation Audits, login + hash `#settings`, bascule Essentiel/Expert).
Reste notamment : stockage objet (S3), refresh JWT, Zod sur les autres routes, réduction des chunks front, et règles métier notifications / habilitations branchées Prisma.

---

## 1. Données & cohérence des indicateurs

- **Filtre site (`siteId`)** : les agrégats Prisma comptent sur `siteId` ; beaucoup de lignes seedées peuvent n’avoir que le libellé `site`. Alignement seed + API + filtre « vue groupe » pour éviter des totaux à zéro alors que les listes sont peuplées (partiellement corrigé côté front par réconciliation stats / listes sur le dashboard).
- **Source de vérité** : décider si les KPI vitrine viennent toujours de `/api/dashboard/stats` ou d’un résumé calculé côté client à partir des listes (documenter le contrat).
- **Limites liste (500 / 150)** : les dérivations depuis les listes plafonnent les totaux ; pour la prod, exposer des `count` agrégés fiables ou de la pagination « total ».
- **Mode hors-ligne terrain** : finaliser la stratégie de sync et de rétention des files d’attente (incidents) vs. affichage des compteurs.

## 2. UX / design system

- **Checklist mesurable par page** : voir [`docs/CHECKLIST_PREMIUM_PAGES.md`](docs/CHECKLIST_PREMIUM_PAGES.md). Les routes métier sous shell utilisent **`page-stack--premium-saas`** (`page-premium-unified.css`) pour harmoniser `--page-stack-gap`, le rendu des **états vides** (`.empty-state`), le **padding des cartes racines** (`> .content-card` / `> .card-soft`, hors dashboard), et l’espace des **skeletons**. **Incidents** : liste vide après filtres → CTA *Réinitialiser les filtres*. **Journal d’activité** : vue filtrée vide alors que le store contient des entrées → CTA *Réinitialiser les filtres* (période → tout, type, utilisateur, vue audit).
- **Densité** : le rythme vertical global (`.page-stack`, blocs dashboard) a été augmenté ; poursuivre module par module (actions, audits, risques) pour uniformiser marges internes des `.content-card`.
- **États vides** : remplacer les `0` ambigus par des libellés du type « Aucune donnée sur ce périmètre » + CTA (changer de site, rafraîchir, lien doc).
- **Mode terrain / expert** : garder la logique permissions + mode d’affichage documentée ; tests E2E sur bascule et profils.
- **Accessibilité** : contraste des pastilles, focus sur les segments « Terrain / Complet », annonces live pour toasts et chargements async.

## 3. Performance front

- **Code-splitting** : certains chunks dépassent 500 Ko (build Vite) — découper `audits`, `iso`, et le pipeline PDF (`html2canvas`, `jspdf`) derrière des imports dynamiques ; la lib lourde `canvg` (SVG → canvas pour `jsPDF.addSvgAsImage`) est remplacée par un shim dans ce produit car non utilisée.
- **Chart.js** : mutualiser options (thème, polices) ; éviter recréation inutile des graphiques au moindre refresh.

## 4. Backend & API

- **Contrats d’erreur** : normaliser les corps JSON d’erreur et les codes (401 / 403 / 422) pour tous les modules (incidents, risques, actions, audits).
- **Validation** : centraliser schémas (ex.: Zod) alignés avec le front pour éviter `null` / types flous.
- **Permissions serveur** : la matrice `permissions.js` doit refléter `permissionsUi.js` (TERRAIN + mode complet, etc.) sans divergence.
- **Seed** : garantir `siteId` cohérent sur incidents / actions / audits pour les scénarios multi-sites.

## 5. Tests & qualité

- **Vitest** : étendre les tests sur `reconcileDashboardStatsWithLists`, normalisation payload dashboard, `siteFilter`.
- **Playwright** : parcours critiques en place (login démo, dashboard, toggle terrain/expert, création incident, hash navigation). Étendre ensuite aux chemins métiers longs (clôture incident, exports multi-modules, rôles non-admin).
- **Lint / format** : ESLint + Prettier sur tout le monorepo si pas déjà homogène.

## 6. Sécurité (hors démo, hors dépendances déjà corrigées)

- Auth réelle (JWT refresh, CSRF si cookies), rate limiting, validation uploads (photos incidents), sanitization HTML côté serveur si rich text.
- Sentry : filtrer PII, variables d’environnement pour DSN.

## 7. Produit & modules métier

- **Risques** : alignement complet backend + matrice + exports CSV.
- **Habilitations** : basculer les jeux démo pur API quand le modèle Prisma sera prêt.
- **Analytics / performance** : jeux de données réalistes ou mode « démo guidée » explicite.
- **Notifications** : règles métier stables (non-conformités, échéances FDS, habilitations).

## 8. Documentation / onboarding

- README : prérequis Node, `npm run dev`, URL API, variable `__QHSE_API_BASE__`.
- Changelog ou releases pour jeux de seed et breaking API.

---

## Prochaines actions recommandées (court terme)

1. Vérifier en base que les enregistrements critiques ont `siteId` renseigné lorsque l’utilisateur filtre par site.
2. Étendre Zod + contrats d’erreur sur les routes API restantes (incidents, risques, actions, audits).
3. Passer une revue visuelle module par module avec la même `page-stack` / cartes (checklist design).

---

*Généré dans le cadre d’un polish global ; à adapter à votre roadmap.*
