# Stage 1: Build frontend
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Node.js backend
FROM node:20-alpine

WORKDIR /app

# Install dependencies for Prisma
RUN apk add --no-cache openssl

# Copy backend package files and install
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy backend source
COPY backend/ ./backend/

# Generate Prisma Client (needs schema.prisma to exist)
RUN cd backend && npx prisma generate

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
