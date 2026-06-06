# Stage 1: Build frontend
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Node.js backend
FROM node:20-alpine

WORKDIR /app

# Install dependencies for Prisma (OpenSSL is required for the query engine)
RUN apk add --no-cache openssl

# Copy backend package files and install dependencies cleanly
COPY backend/package*.json ./backend/
RUN cd backend && npm ci

# Copy backend source (schema.prisma must be present before generate)
COPY backend/ ./backend/

# Generate Prisma Client explicitly using the local binary
RUN cd backend && \
    ./node_modules/.bin/prisma generate --schema=prisma/schema.prisma && \
    ls -la node_modules/.prisma/client/

# Copy built frontend assets from stage 1
COPY --from=builder /app/dist ./dist

# Copy public assets (images)
COPY public/ ./public/

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "backend/src/server.js"]
