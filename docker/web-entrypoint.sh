#!/bin/sh
set -eu

SEED_MARKER="/app/data/.novasphere-seeded"

if [ ! -f "$SEED_MARKER" ]; then
  echo "[novasphere] Running database setup (push + seed)..."
  cd /app/packages/db
  ./node_modules/.bin/drizzle-kit push
  ./node_modules/.bin/tsx src/seed.ts
  touch "$SEED_MARKER"
  echo "[novasphere] Database setup complete."
fi

exec node /app/apps/web/server.js
