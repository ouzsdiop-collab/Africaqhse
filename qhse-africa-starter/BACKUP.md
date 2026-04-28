# Sauvegarde & restauration — Production Railway / PostgreSQL (minimal, fiable)

Objectif : avoir une solution **simple** (avant premiers clients) pour :
- faire un **backup manuel** à la demande
- automatiser un **backup régulier** (cron)
- savoir **restaurer** rapidement sur une nouvelle base

> Ce document ne modifie pas le schéma. Il décrit des dumps logiques PostgreSQL (`pg_dump`) et leur restauration (`pg_restore`).

## 1) Configuration DB actuelle (projet)

- Backend Prisma utilise **PostgreSQL** via une seule variable :
  - `DATABASE_URL` (voir `backend/prisma/schema.prisma`)
- Déploiement : migrations via `npx prisma migrate deploy` (voir `DEPLOYMENT.md`)

## 2) Stratégie recommandée (minimal viable)

### Niveau A — Backup manuel (immédiat)

- **Format**: dump `tar` (portable, restorable par `pg_restore`)
- **Fréquence**: avant chaque démo majeure / avant mise à jour / avant migration
- **Rétention**: conserver les 7 derniers dumps (ou 30 jours)

### Niveau B — Backup automatique (fiable)

Deux options simples (choisir 1) :

1) **Railway template “Postgres S3 Backups”** (recommandé)
   - Déploie un petit service sur Railway qui exécute `pg_dump` sur un schedule et upload sur S3.
   - Voir (doc Railway) : `https://railway.app/deploy/postgres-s3-backups`

2) **Cron externe** (GitHub Actions / VM / serveur admin)
   - Un cron exécute `pg_dump` via `DATABASE_URL` et pousse vers un stockage (S3 / disque chiffré).

> Pourquoi S3 : stockage indépendant de Railway, donc utile en cas d’incident projet / suppression.

## 3) Outils nécessaires

Les commandes utilisent les outils PostgreSQL :
- `pg_dump`
- `pg_restore`

### Option “sans installer Postgres” (via Docker)

Si Docker est disponible, vous pouvez exécuter les outils depuis l’image `postgres:16-alpine`.

## 4) Backup manuel — commandes exactes

### A) Via scripts du repo (Node) — recommandé

1) Dans `backend/`, définir la source DB :

- `BACKUP_DATABASE_URL` (sinon fallback sur `DATABASE_URL`)

2) Lancer :

```bash
node backend/scripts/backupPg.mjs
```

Variables utiles :
- `BACKUP_OUT_DIR=./backups` (défaut)
- `BACKUP_LABEL=prod` (défaut)
- `BACKUP_FORMAT=tar` (défaut) ou `custom`

Sortie : un fichier `tar` horodaté (ex: `prod-2026-04-28T20-30-00Z.tar`).

### B) Via Docker (si pas de scripts)

1) Exporter `DATABASE_URL` (ou `BACKUP_DATABASE_URL`) dans votre shell.
2) Backup tar :

```bash
docker run --rm -e PGPASSWORD="" postgres:16-alpine \
  sh -lc 'pg_dump --dbname="$BACKUP_DATABASE_URL" --format=tar --no-owner --no-acl' \
  > backup.tar
```

> Remarque : si votre URL contient le mot de passe, `pg_dump` l’utilise sans `PGPASSWORD`.

## 5) Restauration — commandes exactes

### A) Via script (Node) — recommandé

```bash
node backend/scripts/restorePg.mjs --file ./backups/prod-<timestamp>.tar
```

Variables :
- `RESTORE_DATABASE_URL` (sinon fallback sur `DATABASE_URL`)

### B) Via `pg_restore` direct

```bash
pg_restore --dbname="$RESTORE_DATABASE_URL" --format=tar --clean --if-exists --no-owner --no-acl ./backup.tar
```

## 6) Procédure “test de restauration” (fortement conseillée)

1) Créer une **nouvelle base Railway** (staging/restore-test)
2) Restaurer le dernier dump vers cette base
3) Lancer :
- `npx prisma migrate deploy` (si nécessaire)
- smoke tests (`npm test --prefix backend`) + vérifications UI basiques

## 7) Check-list (prod)

- [ ] Backups automatiques activés (Railway template S3 ou cron externe)
- [ ] Rétention en place (S3 lifecycle / suppression automatique)
- [ ] Test de restauration réalisé au moins 1 fois
- [ ] Accès aux dumps restreint (IAM, chiffrement au repos)
- [ ] Monitoring d’échec backup (alert email / webhook)

