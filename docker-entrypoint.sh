#!/bin/sh
set -e

cd backend

# Ensure Prisma Client is generated (safety net for production)
npx prisma generate

# Run Prisma migrations before starting the app
npx prisma migrate deploy

cd /app
exec "$@"
