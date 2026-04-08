#!/bin/sh
set -e

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
