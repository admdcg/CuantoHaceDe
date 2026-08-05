# Imagen de producción para Railway.
#
# Se construye desde la raíz del monorepo porque el package-lock y el workspace
# packages/types viven ahí.

FROM node:22-alpine AS base
WORKDIR /app

# --- dependencias ---------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY packages/types/package.json packages/types/
RUN npm ci

# --- build ----------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w apps/web

# --- runtime --------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

# El standalone trae su propio node_modules recortado y el server.js.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Las migraciones y su ejecutor no forman parte del bundle de Next.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/scripts ./apps/web/scripts
COPY --from=builder --chown=nextjs:nodejs /app/db ./db

USER nextjs
EXPOSE 3000

# Las migraciones corren en el arranque: son idempotentes y toman un advisory
# lock, así que varias réplicas arrancando a la vez no se pisan.
CMD ["sh", "-c", "node apps/web/scripts/migrate.mjs && node apps/web/server.js"]
