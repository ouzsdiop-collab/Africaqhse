#!/usr/bin/env bash
# Provisionne une stack Docker isolée par client (API + Postgres + front nginx).
# Usage : depuis la racine du dépôt — ./scripts/provision-client.sh <nom-client>
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

err() {
  echo "Erreur: $*" >&2
  exit 1
}

if ! command -v docker >/dev/null 2>&1; then
  err "docker n'est pas installé ou n'est pas dans le PATH."
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  err "docker compose (plugin v2) ou docker-compose n'est pas disponible."
fi

if ! command -v openssl >/dev/null 2>&1; then
  err "openssl n'est pas installé (requis pour générer JWT_SECRET)."
fi

CLIENT_NAME="${1:-}"
if [[ -z "$CLIENT_NAME" ]]; then
  echo "Usage: ./scripts/provision-client.sh <nom-client>" >&2
  exit 1
fi

if ! [[ "$CLIENT_NAME" =~ ^[a-z0-9][a-z0-9_-]*$ ]]; then
  err "nom-client invalide (minuscules, chiffres, tirets ou underscores ; pas d'espaces)."
fi

mkdir -p .clients docker-compose.clients

JWT_SECRET="$(openssl rand -hex 32)"

PORT_COUNTER_FILE=".clients/.port-counter"
if [[ -f "$PORT_COUNTER_FILE" ]]; then
  PORT_API="$(tr -d '[:space:]' <"$PORT_COUNTER_FILE" | head -n1)"
  if ! [[ "$PORT_API" =~ ^[0-9]+$ ]]; then
    err "fichier .clients/.port-counter corrompu (nombre attendu)."
  fi
  echo $((PORT_API + 1)) >"$PORT_COUNTER_FILE"
else
  PORT_API=3002
  echo $((PORT_API + 1)) >"$PORT_COUNTER_FILE"
fi

# Port hôte du front nginx (évite le conflit :80 entre plusieurs clients sur la même machine)
FRONT_PORT=$((PORT_API + 1000))

ENV_FILE=".clients/${CLIENT_NAME}.env"
cat >"$ENV_FILE" <<EOF
DATABASE_URL=postgresql://postgres:postgres@db_${CLIENT_NAME}:5432/${CLIENT_NAME}_qhse
JWT_SECRET=${JWT_SECRET}
PORT=${PORT_API}
NODE_ENV=production
S3_BUCKET=${CLIENT_NAME}-qhse-docs
ALLOWED_ORIGINS=http://localhost:${PORT_API}
EOF

COMPOSE_OUT="docker-compose.clients/${CLIENT_NAME}.yml"
COMPOSE_SRC="docker-compose.prod.yml"
[[ -f "$COMPOSE_SRC" ]] || err "fichier $COMPOSE_SRC introuvable à la racine du dépôt."

awk -v c="$CLIENT_NAME" -v p="$PORT_API" -v fp="$FRONT_PORT" '
$0 == "  db:" {
  print "  db_" c ":"
  print "    container_name: qhse_" c "_db"
  next
}
$0 == "      db:" {
  print "      db_" c ":"
  next
}
$0 == "      POSTGRES_USER: qhse" {
  print "      POSTGRES_USER: postgres"
  next
}
$0 == "      POSTGRES_PASSWORD: qhse_change_me" {
  print "      POSTGRES_PASSWORD: postgres"
  next
}
$0 == "      POSTGRES_DB: qhse" {
  print "      POSTGRES_DB: " c "_qhse"
  next
}
/pg_isready -U qhse -d qhse/ {
  gsub(/pg_isready -U qhse -d qhse/, "pg_isready -U postgres -d " c "_qhse")
  print
  next
}
$0 == "      - qhse_pgdata:/var/lib/postgresql/data" {
  print "      - qhse_pgdata_" c ":/var/lib/postgresql/data"
  next
}
$0 == "  qhse_pgdata:" {
  print "  qhse_pgdata_" c ":"
  next
}
$0 == "  api:" {
  print
  print "    container_name: qhse_" c "_api"
  in_api = 1
  next
}
in_api && $0 == "    env_file:" {
  print
  getline
  print "      - .clients/" c ".env"
  next
}
in_api && $0 == "    expose:" {
  print "    ports:"
  print "      - \"" p ":" p "\""
  skip_expose = 1
  next
}
skip_expose && /^      - / {
  skip_expose = 0
  next
}
$0 == "  front:" {
  in_front = 1
}
in_front && $0 == "    ports:" {
  print
  getline
  print "      - \"" fp ":80\""
  in_front = 0
  next
}
{ print }
' "$COMPOSE_SRC" >"$COMPOSE_OUT"

"${COMPOSE[@]}" -f "$COMPOSE_OUT" up -d --build

HEALTH_URL="http://127.0.0.1:${PORT_API}/api/health/ready"
ok=0
for ((i = 1; i <= 15; i++)); do
  if command -v curl >/dev/null 2>&1; then
    if curl -sf "$HEALTH_URL" >/dev/null; then
      ok=1
      break
    fi
  elif command -v wget >/dev/null 2>&1; then
    if wget -q -O /dev/null "$HEALTH_URL"; then
      ok=1
      break
    fi
  else
    err "curl ou wget requis pour le test /api/health/ready."
  fi
  sleep 3
done

if [[ "$ok" -ne 1 ]]; then
  err "l'API ne répond pas sur $HEALTH_URL après 15 tentatives (3 s)."
fi

echo ""
echo "Résumé provisionnement"
echo "----------------------"
echo "Client    : ${CLIENT_NAME}"
echo "URL API   : http://localhost:${PORT_API}"
echo "Base DB   : ${CLIENT_NAME}_qhse"
echo "JWT Secret: ${JWT_SECRET}"
echo "Env file  : .clients/${CLIENT_NAME}.env"
echo ""
