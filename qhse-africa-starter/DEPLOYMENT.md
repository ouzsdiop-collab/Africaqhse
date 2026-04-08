# Déploiement production (API + base)

Ce document complète le `README.md` pour une mise en ligne **PostgreSQL** + API Node, sans SQLite.

## Prérequis

- Node.js 20+
- PostgreSQL 14+ (recommandé : 16)
- Variables d’environnement alignées sur `backend/.env.example`

## Base de données

1. Créer une base dédiée et un utilisateur avec droits `CREATE` / `CONNECT` sur cette base.
2. Définir `DATABASE_URL`, par exemple :

   `postgresql://USER:PASSWORD@HOST:5432/NOM_BASE?schema=public`

3. **Avant** le premier démarrage de l’API sur un nouvel environnement :

   ```bash
   cd backend
   npx prisma migrate deploy
   npm run db:seed
   ```

   Le seed est optionnel en production si les données sont importées autrement ; il sert surtout aux environnements de démo.

4. Sauvegardes : planifier des dumps logiques (`pg_dump`) ou des snapshots volume selon votre hébergeur. Tester la restauration au moins une fois.

## API (processus Node)

- `NODE_ENV=production`
- `JWT_SECRET` : au moins 16 caractères, unique par environnement, stocké dans un coffre (pas dans le dépôt).
- `CORS_ORIGINS` : liste des origines du front HTTPS, séparées par des virgules.
- `TRUST_PROXY=true` si l’API est derrière un reverse proxy (nécessaire pour les limites de débit par IP).
- `SENTRY_DSN` (optionnel) : erreurs et performances API — voir `backend/.env.example`.
- `LOG_HTTP=1` : journalise chaque requête en une ligne JSON (agrégation Loki / CloudWatch / Datadog).
- Santé : `GET /api/health` et `GET /api/health/live` (vivacité, sans base) ; `GET /api/health/ready` (connexion SQL — sonde orchestrateur / Kubernetes). `HEALTH_DB_TIMEOUT_MS` ajuste le délai max.
- Arrêt : `SIGTERM` / `SIGINT` ferment le serveur HTTP puis déconnectent Prisma proprement.
- Réponses JSON compressées (`compression`) si le client accepte gzip/br.
- Limite JSON : `JSON_BODY_LIMIT` (défaut `512kb`).
- Limites d’upload / import : `RATE_LIMIT_UPLOAD_MAX`, `RATE_LIMIT_UPLOAD_WINDOW_MS` (voir `backend/src/middleware/apiRateLimit.middleware.js`).

## Fichiers et pièces jointes

- Documents contrôlés : aujourd’hui stockage local (`DOCUMENT_STORAGE_PATH`). Pour le cloud, prévoir un backend objet (**S3**, Azure Blob, GCS) : même contrat d’accès (URLs signées, pas d’exposition du bucket en public), chiffrement au repos, sauvegardes répliquées.
- Ne jamais servir le répertoire de fichiers en statique depuis Express ; utiliser des flux authentifiés ou des jetons de téléchargement.

## Conteneur (optionnel)

- `backend/Dockerfile` : image API ; l’entrée exécute `prisma migrate deploy` puis lance le serveur.
- Compose : vous pouvez réutiliser `backend/docker-compose.yml` comme base et ajouter un service `api` qui dépend de `db`, avec les mêmes variables que ci-dessus.

## Front (Vite)

- Build : `npm run build` à la racine du dépôt ; servir `dist/` derrière HTTPS.
- Le **mode exploration** (données locales sans API) est **désactivé** dans les builds de production (`import.meta.env.PROD`).

## Check-list rapide

- [ ] Postgres accessible uniquement depuis le réseau de confiance (VPC / firewall).
- [ ] `migrate deploy` exécuté sur la base cible.
- [ ] Secrets hors du dépôt, rotation prévue pour `JWT_SECRET` / SMTP / S3.
- [ ] CORS et HTTPS cohérents avec l’URL du front.
- [ ] Sauvegardes DB + procédure de restauration documentée.
