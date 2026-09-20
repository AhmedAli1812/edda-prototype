FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/shared-config/package*.json ./packages/shared-config/

RUN npm install

COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

RUN cd packages/shared-types && npm run build
RUN cd apps/api && npx prisma generate && npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package*.json ./apps/api/

EXPOSE 4000

CMD ["node", "apps/api/dist/main"]
