# QHSE Control

Plateforme web de **pilotage QHSE** : incidents, risques, audits, non-conformités, actions correctives, documents contrôlés et indicateurs — pensée pour les **sites industriels**, les **équipes terrain** et le **management**.

## Fonctionnalités clés

- Tableau de bord et indicateurs par site / organisation (multi-tenant)
- Déclaration et suivi d’incidents, gestion des risques et du plan d’actions
- Audits et non-conformités, assistances conformité et rapportage
- Authentification sécurisée (JWT), rôles et **organisations multiples** par compte
- Mode **exploration** sans compte pour prise en main et démonstration

### Exports et imports

- Les exports registres (`/api/export/incidents|risks|actions|audits`) sont fournis en **CSV UTF-8** (BOM, séparateur `;`).
- Les imports supportent **CSV/TSV**, **PDF** et **tableurs XLS/XLSX** pour la pré-analyse et le préremplissage assisté.
- **PDF dans le navigateur** : génération via **html2canvas** + **jsPDF** (le module lourd **canvg**, prévu pour `addSvgAsImage` dans jsPDF, est remplacé par un **shim** dans `vite.config.mjs` car non utilisé).
- Après connexion, le front **précharge en idle** les modules des pages les plus ouvertes (incidents, risques, actions, audits — et accueil Essentiel si mode terrain), pour accélérer la navigation sans bloquer le premier rendu.

### Multi-organisations et réinitialisation de mot de passe

- Chaque compte est rattaché à une ou plusieurs organisations via la table `tenant_members`. Le **jeton d’accès** JWT inclut la revendication `tid` (identifiant tenant) ; le middleware API vérifie l’adhésion avant de renseigner `req.qhseTenantId`. Ensuite, **`requireTenantContext`** impose un **tenant résolu sur presque toutes les routes `/api/*`** (sinon **403** `Contexte organisation requis.`), y compris si `REQUIRE_AUTH=false`. Exceptions documentées dans `backend/src/middleware/requireTenantContext.middleware.js` (`isApiTenantOptionalPath`) : notamment `/api/auth`, `/api/health`, `/api/docs`, **`GET /api/controlled-documents/stream`** (jeton signé), **`POST /api/fds/analyze`** (analyse sans persistance), **`/api/automation/*`** (déclencheurs internes).
- Les données seed et la migration d’introduction utilisent le tenant par défaut **`qhse_default_tenant`** (slug `default`). Fichier de migration : `backend/prisma/migrations/20260411120000_tenants_password_reset/migration.sql`.
- **Mot de passe oublié** : le front appelle `POST /api/auth/forgot-password` ; l’utilisateur reçoit un lien vers `/#reset-password?token=…`. Pour un envoi réel, configurez **SMTP** (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` ou `EMAIL_FROM`) et **`FRONTEND_URL`** (ou premier origine dans `ALLOWED_ORIGINS`) — voir `backend/.env.example`.
- **Annuaire utilisateurs** : la liste et la fiche (`GET /api/users`, etc.) ne concernent que les **membres du tenant** du jeton. **Retirer** un utilisateur supprime son adhésion à l’organisation courante (le compte peut rester actif sur d’autres tenants).
- En **mode exploration**, le front intercepte la plupart des appels (`qhseFetch`) et ne touche pas l’API. Pour appeler l’API réelle avec `REQUIRE_AUTH=false` (tests, intégrations), envoyez **`X-User-Id`** (hors production par défaut ; en prod seulement si `ALLOW_X_USER_ID=true` dans `securityConfig.js`) ou un **JWT** afin que `attachRequestUser` renseigne le tenant ; sans cela, les routes métier répondent **403**.

## Démarrage rapide (démonstration locale)

**Prérequis** : Node.js 20+

```bash
npm install
cd backend && npm install && cd ..
```

Base de données (PostgreSQL) et données d’exemple :

```bash
npm run db:docker --prefix backend
```

Attendez que Postgres soit prêt, puis migrations et seed :

```bash
npm run db:migrate:deploy --prefix backend
npm run db:seed --prefix backend
```

En développement sans Docker, pointez `DATABASE_URL` vers une instance Postgres (voir `backend/.env.example`).

Lancer l’API et le front (recommandé) :

```bash
npm run dev
```

- Interface : [http://localhost:5173](http://localhost:5173)  
- API : [http://localhost:3001](http://localhost:3001)

Après le seed, connectez-vous avec un compte du fichier `backend/prisma/seed.js` (ex. `qhse@qhse.local` avec le mot de passe défini dans le seed).

## Initialiser une base client propre (PostgreSQL vierge)

Le dépôt inclut un seed démo (beaucoup de données) **et** un seed client (base vierge).

### Seed démo (inchangé)

```bash
npm run db:migrate:deploy --prefix backend
npm run db:seed --prefix backend
```

### Seed client (vierge)

1) Configurez les variables dans `backend/.env` (ou variables d’environnement du serveur) :

- `DATABASE_URL` (Postgres)
- `CLIENT_TENANT_SLUG`, `CLIENT_TENANT_NAME`
- `CLIENT_ADMIN_EMAIL`, `CLIENT_ADMIN_NAME`, `CLIENT_ADMIN_ROLE`, `CLIENT_ADMIN_PASSWORD`

2) Exécutez :

```bash
npm run db:init:client --prefix backend
```

Ce script exécute `prisma migrate deploy` puis `prisma/seed.client.js`.

## Structure du dépôt

| Élément | Rôle |
|--------|------|
| `src/` | Application front (Vite, JS natif modulaire) |
| `backend/` | API Express, Prisma, logique métier |
| `public/` | Ressources statiques, PWA (`manifest.webmanifest`) |

## Build production

```bash
npm run build
npm run preview
```

Déployez le dossier `dist/` derrière un serveur web ; configurez l’URL de l’API (`window.__QHSE_API_BASE__` ou même origine avec reverse proxy). Côté API, exécutez `npx prisma migrate deploy` avant le démarrage sur une base Postgres de production — voir `DEPLOYMENT.md`.

## Qualité

- Lint : `npm run lint` (ESLint, `eslint.config.mjs`)
- Tests front : `npm test` (Vitest)
- Tests API : `npm test --prefix backend`
- E2E : `npm run test:e2e` (Playwright — API + Vite via `npm run dev`)

---

*QHSE Control est une base produit évolutive — personnalisation marque, hébergement et intégrations sur mesure.*
