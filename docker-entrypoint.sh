#!/bin/sh
set -e

cd backend

echo "=== Generating Prisma Client ==="
./node_modules/.bin/prisma generate --schema=prisma/schema.prisma

echo "=== Waiting for database ==="
DB_READY=0
for i in $(seq 1 30); do
  if ./node_modules/.bin/prisma db execute --stdin --schema=prisma/schema.prisma </dev/null >/dev/null 2>&1; then
    DB_READY=1
    echo "Database is reachable"
    break
  fi
  echo "Database not ready yet (attempt $i/30)..."
  sleep 2
done

if [ "$DB_READY" = "1" ]; then
  echo "=== Running database migrations ==="
  ./node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma || echo "WARNING: migrations failed, continuing anyway"
else
  echo "WARNING: Database not reachable after 60s, skipping migrations"
fi

cd /app
exec "$@"
