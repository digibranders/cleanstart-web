# syntax=docker/dockerfile:1

# Build context is the repository root (pnpm workspace):
#   docker build -f apps/portal/Dockerfile -t portal:local .
# The image is a Next.js standalone server, a few hundred MB, unlike the 4.4 GB CMS image.

# ─── Stage 1: builder ─────────────────────────────────────────────────────────
# One stage for install and build, like apps/cms/Dockerfile: the pnpm lockfile gives reproducibility and a
# split deps stage loses the workspace symlinks.
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile --prefer-offline

# NEXT_PUBLIC_* values are inlined into the browser bundle, so the Turnstile site key is a build argument.
# It is public by design. Secrets (database, auth, HubSpot, Brevo, R2) are runtime only and never in the image.
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_OUTPUT=standalone
ENV NEXT_TELEMETRY_DISABLED=1
# src/env.ts returns an unparsed object when this is 1; nothing reads a secret at build time.
ENV SKIP_ENV_VALIDATION=1

RUN pnpm --filter @cleanstart/portal build
# The standalone output has no tsx and no drizzle migrator, so the migration entry is bundled into one file.
RUN node apps/portal/scripts/bundle-migrate.mjs

# ─── Stage 2: runner ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 portal
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3004
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
# 2 GB droplet shared with Postgres and the CMS (master plan task 0.6).
ENV NODE_OPTIONS="--no-deprecation --max-old-space-size=384"

# outputFileTracingRoot is the monorepo root, so the server lands at apps/portal/server.js inside the standalone dir.
COPY --from=builder --chown=portal:nodejs /app/apps/portal/.next/standalone ./
COPY --from=builder --chown=portal:nodejs /app/apps/portal/.next/static ./apps/portal/.next/static
COPY --from=builder --chown=portal:nodejs /app/apps/portal/public ./apps/portal/public
# Read at runtime by the migration entry: the SQL migrations and the row level security script.
COPY --from=builder --chown=portal:nodejs /app/apps/portal/drizzle ./apps/portal/drizzle
COPY --from=builder --chown=portal:nodejs /app/apps/portal/src/db/rls.sql ./apps/portal/src/db/rls.sql
COPY --from=builder --chown=portal:nodejs /app/apps/portal/scripts/migrate.cjs ./apps/portal/scripts/migrate.cjs

USER portal
WORKDIR /app/apps/portal

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3004/api/health || exit 1

# Migrations are idempotent (drizzle journal, then rls.sql), so running them on every start is safe.
# Caveat (BUILD-HANDOFF open decision 4, plan 06 CCR-5b): because the container migrates on start, the owner
# credential DATABASE_OWNER_URL, which bypasses row level security, is in this container's environment. Before
# real partner data goes in, move migration to a one-shot service and drop that variable from the app container.
CMD ["sh", "-c", "node scripts/migrate.cjs && node server.js"]
