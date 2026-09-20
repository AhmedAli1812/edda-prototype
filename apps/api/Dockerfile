# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and workspace manifests
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/shared-config/package*.json ./packages/shared-config/

# Install full dependencies for building
RUN npm ci

# Copy sources
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Build shared types, generate Prisma Client, and build API
RUN npm --workspace=packages/shared-types run build
RUN cd apps/api && npx prisma generate && npm run build

# Stage 2: Production dependencies stage (pruning devDependencies)
FROM node:20-alpine AS prod-deps

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/shared-config/package*.json ./packages/shared-config/

# Install production-only dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Stage 3: Minimal, secure runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install curl for container health checks
RUN apk add --no-cache curl

# Create dedicated non-root user and group
RUN addgroup -S eddagroup && adduser -S eddauser -G eddagroup

# Copy pruned production dependencies from prod-deps stage
COPY --from=prod-deps --chown=eddauser:eddagroup /app/node_modules ./node_modules
COPY --from=prod-deps --chown=eddauser:eddagroup /app/package.json ./package.json

# Copy compiled shared-types
COPY --from=builder --chown=eddauser:eddagroup /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder --chown=eddauser:eddagroup /app/packages/shared-types/package.json ./packages/shared-types/package.json

# Copy compiled API dist and runtime manifests
COPY --from=builder --chown=eddauser:eddagroup /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=eddauser:eddagroup /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=eddauser:eddagroup /app/apps/api/prisma ./apps/api/prisma

# Copy generated Prisma engine/client from builder
COPY --from=builder --chown=eddauser:eddagroup /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=eddauser:eddagroup /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Use non-root user
USER eddauser

EXPOSE 4000

# Health check against the health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/v1/health || exit 1

CMD ["node", "apps/api/dist/main"]
