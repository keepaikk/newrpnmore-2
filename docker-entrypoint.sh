#!/bin/sh
set -e

# Run Prisma migrations before starting the app
cd backend && npx prisma migrate deploy

cd /app
exec "$@"
