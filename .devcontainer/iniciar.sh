#!/usr/bin/env bash
# Roda a cada vez que o Codespace liga: sobe o Postgres e aplica as migrações.
set -euo pipefail
cd "$(dirname "$0")/.."
for i in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 1; done
docker compose up -d
for i in $(seq 1 30); do docker exec estudo-praca-db pg_isready -p 5433 -U estudo >/dev/null 2>&1 && break; sleep 1; done
npm run db:migrate
