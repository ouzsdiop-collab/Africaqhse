#!/bin/sh
set -e

echo "[entrypoint] démarrage — commande: $*"

if [ -z "$DATABASE_URL" ]; then
  echo "[entrypoint] ERREUR: DATABASE_URL est requis."
  exit 1
fi
# Ne jamais logger la valeur complète (secret).
echo "[entrypoint] DATABASE_URL défini (${#DATABASE_URL} caractères)."

echo "[entrypoint] étape: npx prisma generate…"
npx prisma generate
echo "[entrypoint] prisma generate terminé OK."

echo "[entrypoint] étape: npx prisma migrate deploy…"
npx prisma migrate deploy
echo "[entrypoint] prisma migrate deploy terminé OK."

echo "[entrypoint] lancement processus principal (exec, sans fork npm si node direct)…"
exec "$@"
