#!/bin/sh
set -e

cd backend

echo "=== Generating Prisma Client ==="
./node_modules/.bin/prisma generate --schema=prisma/schema.prisma

echo "=== Verifying generated client ==="
ls -la node_modules/.prisma/client/ | head -5

echo "=== Running database migrations ==="
./node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma

cd /app
exec "$@"
