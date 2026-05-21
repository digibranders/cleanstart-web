# syntax=docker/dockerfile:1

# ─── Stage 1: builder ─────────────────────────────────────────────────────────
# Install + build in a single stage. The previous split (deps + builder) tried
# to cache `pnpm install` across rebuilds, but cross-stage `COPY --from=deps`
# of `packages/*/node_modules` lost the pnpm workspace symlinks, so the build
# couldn't resolve `react` from inside `@cleanstart/ui`. Combining them is the
# correct primitive — pnpm's content-addressed `.pnpm` store + lockfile gives
# us reproducibility without depending on Docker layer cache mechanics.
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
WORKDIR /app

# Copy full source (needed for pnpm workspace install + build)
COPY . .

# Install — uses lockfile for reproducibility, prefers offline cache when present
RUN pnpm install --frozen-lockfile --prefer-offline

# Build args become env vars only during the build step.
# These are the public/static values baked into the Next.js bundle —
# secrets (DATABASE_URI, PAYLOAD_SECRET, etc.) are passed at runtime only.
ARG NEXT_PUBLIC_SITE_URL=https://cleanstart.com
ARG NEXT_PUBLIC_SITE_ORIGIN=https://cleanstart.com
ARG NEXT_PUBLIC_SITE_HOSTS=cleanstart.com,www.cleanstart.com
ARG PAYLOAD_PUBLIC_ENV=production
ARG PAYLOAD_PUBLIC_ROBOTS_DISALLOW=false

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_ORIGIN=$NEXT_PUBLIC_SITE_ORIGIN
ENV NEXT_PUBLIC_SITE_HOSTS=$NEXT_PUBLIC_SITE_HOSTS
ENV PAYLOAD_PUBLIC_ENV=$PAYLOAD_PUBLIC_ENV
ENV PAYLOAD_PUBLIC_ROBOTS_DISALLOW=$PAYLOAD_PUBLIC_ROBOTS_DISALLOW

# Payload requires DATABASE_URI at build time only to generate types/importmap.
# We use a placeholder here — it is never used at runtime from this value.
ARG DATABASE_URI=postgres://placeholder:placeholder@localhost:5432/placeholder
ARG PAYLOAD_SECRET=build-time-placeholder-not-used-at-runtime
ENV DATABASE_URI=$DATABASE_URI
ENV PAYLOAD_SECRET=$PAYLOAD_SECRET

# R2 placeholders — never used at runtime (real values are in /opt/cleanstart/.env
# on the droplet), but must be non-empty during `payload generate:importmap`
# so r2EnvComplete() returns true and the s3Storage plugin registers
# S3ClientUploadHandler in importMap.js. Without these, the prebuild step
# emits an importMap missing that client component; at runtime the plugin
# *is* active (real R2 envs present), it references S3ClientUploadHandler,
# and the lookup fails — breaking admin hydration with a blank screen.
ARG R2_BUCKET=build-placeholder
ARG R2_ENDPOINT=https://build-placeholder.r2.cloudflarestorage.com
ARG R2_ACCESS_KEY_ID=build-placeholder
ARG R2_SECRET_ACCESS_KEY=build-placeholder
ENV R2_BUCKET=$R2_BUCKET
ENV R2_ENDPOINT=$R2_ENDPOINT
ENV R2_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID
ENV R2_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY

# Sharp memory tuning for the constrained droplet (2 GB / 1 vCPU)
ENV SHARP_CONCURRENCY=1

RUN pnpm --filter @cleanstart/cms build

# ─── Stage 2: runner ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 payload
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Suppress Node.js deprecation warnings in production logs
ENV NODE_OPTIONS=--no-deprecation

# Copy only what the production server needs. Workspace package node_modules
# (packages/*/node_modules with pnpm symlinks) are brought over via the full
# `packages` copy below — necessary for runtime resolution from inside
# @cleanstart/ui, @cleanstart/types, @cleanstart/config.
COPY --from=builder --chown=payload:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=payload:nodejs /app/apps/cms/node_modules ./apps/cms/node_modules
COPY --from=builder --chown=payload:nodejs /app/apps/cms/.next ./apps/cms/.next
COPY --from=builder --chown=payload:nodejs /app/apps/cms/public ./apps/cms/public
COPY --from=builder --chown=payload:nodejs /app/apps/cms/package.json ./apps/cms/package.json
COPY --from=builder --chown=payload:nodejs /app/packages ./packages
COPY --from=builder --chown=payload:nodejs /app/package.json ./package.json
COPY --from=builder --chown=payload:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Payload + Next.js need these at runtime to bootstrap.
# - tsconfig.json: payload's `findConfig` reads it to compute ts-path aliases
# - next.config.ts: next start reads it for headers/redirects/etc
# - instrumentation.ts: Next.js loads it for OpenTelemetry / Sentry init
# - sentry.{client,edge,server}.config.ts: Sentry's wizard-generated configs
# - src/: payload.config.ts + collections + everything the config imports
#   transitively. Payload resolves these at runtime, not at build time.
COPY --from=builder --chown=payload:nodejs /app/apps/cms/tsconfig.json ./apps/cms/tsconfig.json
COPY --from=builder --chown=payload:nodejs /app/apps/cms/next.config.ts ./apps/cms/next.config.ts
COPY --from=builder --chown=payload:nodejs /app/apps/cms/next-env.d.ts ./apps/cms/next-env.d.ts
COPY --from=builder --chown=payload:nodejs /app/apps/cms/instrumentation.ts ./apps/cms/instrumentation.ts
COPY --from=builder --chown=payload:nodejs /app/apps/cms/sentry.client.config.ts ./apps/cms/sentry.client.config.ts
COPY --from=builder --chown=payload:nodejs /app/apps/cms/sentry.edge.config.ts ./apps/cms/sentry.edge.config.ts
COPY --from=builder --chown=payload:nodejs /app/apps/cms/sentry.server.config.ts ./apps/cms/sentry.server.config.ts
COPY --from=builder --chown=payload:nodejs /app/apps/cms/src ./apps/cms/src
# Single runtime-only script. Other scripts/ entries are dev/migration
# tooling and intentionally not shipped into the prod image.
COPY --from=builder --chown=payload:nodejs /app/apps/cms/scripts/preflight-migrate.cjs ./apps/cms/scripts/preflight-migrate.cjs

USER payload
WORKDIR /app/apps/cms

EXPOSE 3000

# Run preflight cleanup, then migrations, then start the server.
# The preflight step removes any leftover db.push sentinel rows
# (batch=-1) from payload_migrations — see scripts/preflight-migrate.cjs
# for the full failure mode that motivates it. Migrations themselves
# are idempotent, so running them on every container start is safe.
CMD ["sh", "-c", "node scripts/preflight-migrate.cjs && pnpm migrate && pnpm start"]
