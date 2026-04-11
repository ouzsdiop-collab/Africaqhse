#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env.prod ]]; then
  echo "Erreur : fichier .env.prod introuvable à la racine du projet ($ROOT_DIR)." >&2
  exit 1
fi

docker compose -f docker-compose.prod.yml up -d --build

ok=0
for i in $(seq 1 10); do
  if curl -sf "http://localhost/api/health/ready" >/dev/null; then
    ok=1
    break
  fi
  sleep 3
done

if [[ "$ok" -ne 1 ]]; then
  echo "Erreur : /api/health/ready n’a pas répondu 200 après les tentatives." >&2
  exit 1
fi

echo "Statut : prêt (API healthy)."
echo "URL application : http://localhost"
echo "Déploiement réussi."
