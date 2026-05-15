# syntax=docker/dockerfile:1

# ─── Stage 1: deps ───────────────────────────────────────────────────────────
# Install ALL workspace dependencies from the monorepo root so that
# @cleanstart/ui, @cleanstart/types, and @cleanstart/config resolve correctly.
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/cms/package.json ./apps/cms/
COPY packages/ui/package.json ./packages/ui/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/

RUN pnpm install --frozen-lockfile --prefer-offline

# ─── Stage 2: builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/cms/node_modules ./apps/cms/node_modules

# Copy full source (needed for build + generate:types)
COPY . .

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

# Sharp memory tuning for the constrained droplet (2 GB / 1 vCPU)
ENV SHARP_CONCURRENCY=1

RUN pnpm --filter @cleanstart/cms build

# ─── Stage 3: runner ─────────────────────────────────────────────────────────
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

# Copy only what the production server needs
COPY --from=builder --chown=payload:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=payload:nodejs /app/apps/cms/node_modules ./apps/cms/node_modules
COPY --from=builder --chown=payload:nodejs /app/apps/cms/.next ./apps/cms/.next
COPY --from=builder --chown=payload:nodejs /app/apps/cms/public ./apps/cms/public
COPY --from=builder --chown=payload:nodejs /app/apps/cms/package.json ./apps/cms/package.json
COPY --from=builder --chown=payload:nodejs /app/packages ./packages
COPY --from=builder --chown=payload:nodejs /app/package.json ./package.json
COPY --from=builder --chown=payload:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Payload migration files — needed for `payload migrate` on startup
COPY --from=builder --chown=payload:nodejs /app/apps/cms/src/migrations ./apps/cms/src/migrations

USER payload
WORKDIR /app/apps/cms

EXPOSE 3000

# Run migrations then start the server.
# Migrations are idempotent — safe to run on every container start.
CMD ["sh", "-c", "pnpm migrate && pnpm start"]
