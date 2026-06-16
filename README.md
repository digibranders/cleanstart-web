<div align="center">
  <img src="./cleanstart-logo.svg" alt="CleanStart" width="320" />

  <h1>CleanStart Website</h1>

  <p><strong>Monorepo for the CleanStart CMS and marketing site.</strong></p>

  <p>
    <a href="#stack"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" /></a>
    <a href="#stack"><img alt="Payload" src="https://img.shields.io/badge/Payload-3.81-000?logo=payloadcms" /></a>
    <a href="#stack"><img alt="React" src="https://img.shields.io/badge/React-19-149eca?logo=react" /></a>
    <a href="#stack"><img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss" /></a>
    <a href="#stack"><img alt="pnpm" src="https://img.shields.io/badge/pnpm-10.30-f69220?logo=pnpm" /></a>
    <a href="#stack"><img alt="Node" src="https://img.shields.io/badge/Node-%E2%89%A522-339933?logo=node.js" /></a>
  </p>
</div>

---

## Overview

CleanStart Website is a **pnpm + Turborepo monorepo** containing two applications and a set of shared packages:

- **`apps/cms`** — a [Payload 3](https://payloadcms.com) headless CMS and admin (Next.js 16, Postgres), serving content and a REST API at `cms.cleanstart.com`.
- **`apps/web`** — the public marketing site (Next.js 16, React 19, Tailwind CSS v4), which renders content sourced from the CMS.

Both apps share design-system primitives, generated types, and tooling config through the workspace packages in `packages/`.

> [!IMPORTANT]
> This is a **private** repository. Before contributing, read [`CLAUDE.md`](./CLAUDE.md) (working conventions) and the architecture source of truth at [`docs/architecture/cleanstart-cms-architecture.html`](./docs/architecture/cleanstart-cms-architecture.html).

---

## Stack

| Area | Technology |
| --- | --- |
| **Monorepo** | pnpm workspaces · Turborepo |
| **CMS** (`apps/cms`) | Payload 3.81 · Next.js 16 · React 19 · Postgres 16 · Lexical rich text |
| **Web** (`apps/web`) | Next.js 16.2 · React 19.2 · Tailwind CSS v4 · Motion · Base UI |
| **Storage / search** | Cloudflare R2 · Meilisearch |
| **Tooling** | TypeScript 5.7 (strict) · Biome · Vitest · Playwright |
| **Integrations** | HubSpot · Microsoft Teams · Brevo · Turnstile · Sentry · IndexNow |
| **Runtime** | Node ≥ 22 (24.x verified) · pnpm ≥ 10 |

---

## Repository layout

```
cleanstart-website/
├── apps/
│   ├── cms/                 Payload 3 admin + REST API · port 3000
│   └── web/                 Marketing site · Next.js 16 · port 3001
├── packages/
│   ├── types/               Re-exports apps/cms payload-types
│   ├── ui/                  @cleanstart/ui — shared design-system primitives + tokens
│   └── config/              Shared tsconfig · biome · eslint
├── migrations/              Webflow → Payload ETL (export + import)
├── infra/                   docker-compose · Caddy · backup/restore scripts
├── docs/                    Architecture, backlog, integrations, ops, web docs
├── scripts/                 Repo-level tooling (Figma extract, etc.)
└── turbo.json               Turborepo task graph
```

Authoritative references:

- **Architecture (what to build):** [`docs/architecture/cleanstart-cms-architecture.html`](./docs/architecture/cleanstart-cms-architecture.html)
- **Working conventions (how to build):** [`CLAUDE.md`](./CLAUDE.md)
- **Web page inventory:** [`docs/web/WEB-PAGES.md`](./docs/web/WEB-PAGES.md)
- **Backlog:** [`docs/BACKLOG.md`](./docs/BACKLOG.md)

---

## Prerequisites

- **Node 22+** (24.x verified working) — see [`.nvmrc`](./.nvmrc)
- **pnpm 10.30.3+**
- **Postgres 16** running on `localhost:5432` (database `cleanstart`, user `postgres`)

---

## Getting started

```bash
# 1. Install dependencies (from the repo root)
pnpm install

# 2. Configure the CMS environment
cp apps/cms/.env.example apps/cms/.env
#    then generate a Payload secret and add it to apps/cms/.env:
openssl rand -base64 32

# 3. Start both apps (Turborepo runs them in parallel)
pnpm dev
```

| App | URL | Notes |
| --- | --- | --- |
| CMS / admin | http://localhost:3000 | Requires `DATABASE_URI` + `PAYLOAD_SECRET` in `apps/cms/.env` |
| Web | http://localhost:3001 | Reads content from the running CMS |

To run a single app:

```bash
pnpm --filter @cleanstart/cms dev
pnpm --filter @cleanstart/web dev
```

---

## Common scripts

Run from the repo root (Turborepo fans out across packages), or scope to one package with `--filter`.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint with Biome |
| `pnpm typecheck` | TypeScript `--noEmit` across the workspace |
| `pnpm test` | Run the Vitest suites |
| `pnpm format` | Format the repo with Biome |

CMS-specific (`pnpm --filter @cleanstart/cms <script>`):

| Command | What it does |
| --- | --- |
| `generate:types` | Regenerate `payload-types.ts` (commit the result — CI fails on drift) |
| `migrate` / `migrate:create` | Run / scaffold Payload migrations |
| `test:e2e` | Playwright end-to-end suite |

> [!WARNING]
> Never hand-edit `apps/cms/payload-types.ts` — it is generated. Run `pnpm --filter @cleanstart/cms generate:types` and commit the output.

---

## Pre-completion checks

Before any change is considered done, run the relevant gates for the package you touched (scope to what changed):

```bash
# apps/cms
pnpm --filter @cleanstart/cms lint
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms build

# apps/web
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web build
```

---

## Branching policy

The repo keeps **exactly three long-lived branches**, all kept in sync at the same HEAD after every merge:

| Branch | Purpose | Scope |
| --- | --- | --- |
| `main` | Production truth — deploys originate here | Everything |
| `development` | Day-to-day development | Everything |
| `farheen` | Web-only contributions | **`apps/web/` only** |

No feature/fix branches and no worktrees for routine work. See the **Branching policy** section of [`CLAUDE.md`](./CLAUDE.md) for the full rules, including the scoped-change rules on `farheen`.

---

## Deployment

- **`apps/cms`** deploys via GitHub Actions ([`.github/workflows/deploy-cms.yml`](./.github/workflows/deploy-cms.yml)) on push to `main`. The workflow builds the Docker image, ships it to the droplet over SSH, and runs `docker compose up -d --wait`; Caddy handles TLS. Served at `cms.cleanstart.com`.
- **`apps/web`** is pre-launch — staging is `staging.cleanstart.com`. See [`docs/web/WEB-PRODUCTION.md`](./docs/web/WEB-PRODUCTION.md) for the web production guide (deploy, CSP, SEO, rollback).

CI runs on every push: [`ci.yml`](./.github/workflows/ci.yml) (lint / typecheck / build / test) and [`web.yml`](./.github/workflows/web.yml).

---

## Documentation map

| Topic | Location |
| --- | --- |
| CMS architecture (source of truth) | [`docs/architecture/`](./docs/architecture/) |
| Backlog & phase status | [`docs/BACKLOG.md`](./docs/BACKLOG.md) |
| Integrations research | [`docs/integrations/`](./docs/integrations/) |
| Webflow migration (ETL) | [`migrations/`](./migrations/) · [`docs/migration/`](./docs/migration/) |
| Operations / runbooks | [`docs/operations/`](./docs/operations/) |
| Web pages & production | [`docs/web/`](./docs/web/) |
| Working conventions for contributors | [`CLAUDE.md`](./CLAUDE.md) · [`AGENTS.md`](./AGENTS.md) |

---

<div align="center">
  <sub>© CleanStart — private repository. Not licensed for external distribution.</sub>
</div>
