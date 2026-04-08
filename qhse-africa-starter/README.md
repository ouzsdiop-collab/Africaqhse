# QHSE Control

Plateforme web de **pilotage QHSE** : incidents, risques, audits, non-conformités, actions correctives, documents contrôlés et indicateurs — pensée pour les **sites industriels**, les **équipes terrain** et le **management**.

## Fonctionnalités clés

- Tableau de bord et indicateurs par site / organisation (multi-tenant)
- Déclaration et suivi d’incidents, gestion des risques et du plan d’actions
- Audits et non-conformités, assistances conformité et rapportage
- Authentification sécurisée (JWT), rôles et **organisations multiples** par compte
- Mode **exploration** sans compte pour prise en main et démonstration

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
