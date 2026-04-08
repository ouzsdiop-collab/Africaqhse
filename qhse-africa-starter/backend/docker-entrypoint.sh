#!/bin/sh
set -e

# Marqueur temporaire : si cette ligne n’apparaît pas dans les logs Railway, ce n’est pas ce Dockerfile/entrypoint.
echo "=================================================================================="
echo "QHSE_BACKEND_RAILWAY_MARKER entrypoint=backend/docker-entrypoint.sh build=2026-04-08"
echo "=================================================================================="

echo "🚀 ENTRYPOINT START"

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL est requis."
  exit 1
fi

echo "📦 Prisma generate..."
npx prisma generate

echo "🧱 Prisma migrate deploy..."
npx prisma migrate deploy

echo "🚀 Lancement du serveur..."
npm start
