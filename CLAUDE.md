# CLAUDE.md — CleanStart CMS repo

This file tells Claude Code *how* to work in this repo. It does not duplicate the architecture doc, which tells you *what* to build.

**Source of truth for *what*:** `docs/cleanstart-cms-architecture.html`. Every ticket, every design call, every schema decision references an anchor in that file (e.g. `#new-fields`, `#blocks`, `#publishing-checklist`). If this CLAUDE.md and the arch doc disagree, the arch doc wins for product/architecture decisions; this file wins for code conventions.

**Plan of record:** `~/.claude/plans/lets-review-the-doc-curried-feigenbaum.md` (CMS-only Phase A–I sequence). The current backlog is at `docs/BACKLOG.md`.

**Currently active scope:** `apps/cms` only (Payload admin + REST API + hooks). The public marketing site `apps/web` was bootstrapped once and discarded; it will be reintroduced in a future wave. Until then, do not scaffold `apps/web` or recreate the deleted design/UI/Figma-extracted assets in `docs/web/`.

---

## Local dev prerequisites

- **Node 22+** (24.x verified working as of last bootstrap)
- **pnpm 10+**
- **Postgres 16** running on `localhost:5432`. Local dev uses the host Postgres (Postgres.app / pgAdmin / Homebrew); database `cleanstart`, user `postgres`. Connection string lives in `apps/cms/.env` (gitignored). The `infra/docker-compose.yml` Postgres is for staging/droplet parity, not the local-dev path.
- **`apps/cms/.env`** must exist with `DATABASE_URI` and `PAYLOAD_SECRET` before `pnpm dev` will start. Copy from `apps/cms/.env.example` and generate the secret with `openssl rand -base64 32`.

## Repo layout

This directory (`cleanstart-website/`) is the monorepo root. The arch doc's §09 file map is authoritative.

```
cleanstart-website/                  monorepo · pnpm workspaces + Turborepo
├── apps/
│   └── cms/                         Payload 3 admin + REST API · admin.cleanstart.com
│       └── src/payload/{collections,globals,blocks,fields,access,lib}/
├── packages/
│   ├── types/                       re-exports apps/cms/payload-types
│   └── config/                      tsconfig · biome · eslint
├── migrations/webflow-import/       Phase H: ETL scripts
├── infra/                           docker-compose · Caddy · backup/restore scripts
├── docs/                            BACKLOG, cleanstart-cms-architecture.html (source of truth),
│                                    INTEGRATIONS-RESEARCH, web/ (architecture+roadmap only)
├── cleanstart-logo.svg              brand mark — also embedded as JSX in apps/cms/src/payload/admin/
└── CLAUDE.md                        this file
```

`apps/web` is **deferred** — a previous bootstrap was discarded along with the design-system / brand / token / component-map docs. The surviving contracts in `docs/web/` are architecture- and roadmap-only ([`WEB-ARCHITECTURE.md`](docs/web/WEB-ARCHITECTURE.md), [`BACKLOG-WEB.md`](docs/web/BACKLOG-WEB.md), [`CONTENT-MODEL.md`](docs/web/CONTENT-MODEL.md), [`SEO-PLAYBOOK.md`](docs/web/SEO-PLAYBOOK.md)); the design-surface docs (DESIGN-SYSTEM, COMPONENT-MAP, BRAND-GUIDELINES, ACCESSIBILITY, FRONTEND-INTEGRATIONS) and the Figma-extracted assets (tokens.css/json, snapshots) will be reintroduced when web development restarts. `packages/ui` is intentionally absent.

---

## Mandatory pre-completion checks

Before reporting any code change as done, run these against `apps/cms` (or whichever package you touched). Scope to what changed — do not re-lint the whole monorepo for a one-file change.

```bash
pnpm --filter @cleanstart/cms lint
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms build
pnpm --filter @cleanstart/cms test       # if tests were touched or added
```

**Rules:**
1. Fix before reporting. If lint/typecheck/build fails, fix and re-run until clean.
2. Never skip checks — even for one-line changes.
3. Report results in your final message: `lint ✓ · typecheck ✓ · build ✓`.
4. `payload generate:types` runs in CI and fails on drift. If you change a collection, regenerate types locally and commit the result.

---

## Code conventions

- **TypeScript strict.** No `any`. Explicit return types on exported functions.
- **Zod at boundaries.** REST handlers, lead intake, webhook payloads, ETL inputs — all validated with Zod before crossing the boundary.
- **No null punning.** Distinguish `undefined` (not set) from `null` (explicitly cleared) — Payload uses both meaningfully.
- **Errors are typed.** Throw subclasses of a shared `AppError` taxonomy (`ValidationError`, `NotFoundError`, `IntegrationError`, `RateLimitError`). No bare `throw new Error('...')` outside of truly unexpected paths.
- **No comments unless the WHY is non-obvious.** Don't restate what the code does. Don't reference tickets or PRs.
- **Three similar lines beats a premature abstraction.** Don't extract helpers until you have a third caller.
- **Validate at system boundaries only.** Trust internal code. Don't add defensive checks for impossible states.
- **Lexical nodes** follow the pattern in arch doc §`#table-handling` and §`#link-handling`. Custom nodes live in `apps/cms/src/payload/lib/lexical/`.

---

## Forbidden actions

These are hard rules. Do not work around them — flag and stop instead.

- **Never edit `apps/cms/payload-types.ts` by hand.** It is generated. Run `pnpm --filter @cleanstart/cms generate:types`.
- **Never bypass the `LeadHandler` adapter** for lead writes. Even one-off scripts go through it. Arch doc §`#forms` makes the R2 fallback queue load-bearing for "no lead lost during outage" — bypassing it breaks that guarantee.
- **Never rename a Next.js route segment post-launch** (e.g. `/webinar/[slug]` → `/webinars/[slug]`). It breaks every indexed URL. Arch doc §`#migration` last subsection is explicit.
- **Never commit `.env*`, secrets, R2 keys, Brevo keys, Webflow tokens, or 2FA seeds.** They live in 1Password vault `cleanstart-migration` and Coolify env-vars panel.
- **Never enable GraphQL on the Payload admin.** Arch doc §`#decisions`: `graphQL: { disable: true }` at launch.
- **Never `git add -A` or `git add .`** at repo root. Stage specific paths.
- **Never `--no-verify`** on commits. If a hook fails, fix it.
- **Never delete data or drop tables** without explicit user confirmation, even in dev. Postgres on the droplet is shared with staging.
- **Never bypass the publishing checklist** (arch doc §`#publishing-checklist`). It is the editor-facing safety gate.

---

## Schema decisions locked this session

These resolved the open forks from arch doc §`#decisions`. Build accordingly:

- **Webinar/Event registration:** per-record `registrationMode` discriminator (`'internal' | 'external'`); `registrationForm` (relationship to `forms`) and `registrationUrl` (URL string) are conditionally required based on the discriminator. (Earlier drafts of this lock used the names `'inHouse'` / `'inHouseForm'` / `'externalUrl'`; the values were standardised to `'internal'` / `registrationForm` / `registrationUrl` at code time. Renaming to the `'inHouse'` shape would require a Payload migration to rewrite existing rows — keep the current values unless that cost is justified.)
- **Resource gating:** `gateForm` is an optional relationship to `forms` on the `resources` collection. Presence gates the download; absence makes it public.
- **Authors:** pure content collection. No `linkedUser` field at v1. If multi-author self-editing is ever needed, an additive migration adds an optional `linkedUser` relationship.
- **Knowledge Hub** and **Guest Contributors:** still open per arch doc §`#decisions`. Do not pre-build either.

---

## apps/web (public marketing site) — deferred

`apps/web` does not currently exist. A previous scaffold was discarded; the design-system / component-map / brand / accessibility / frontend-integrations docs and Figma-extracted assets were removed alongside it.

What survives and is still load-bearing:

- [`docs/web/WEB-ARCHITECTURE.md`](docs/web/WEB-ARCHITECTURE.md) — stack, hosting split (Vercel Pro for web, Coolify for CMS), preview-JWT flow, lead-submit proxy contract.
- [`docs/web/BACKLOG-WEB.md`](docs/web/BACKLOG-WEB.md) — the wave plan; W-A bootstrap is open again.
- [`docs/web/CONTENT-MODEL.md`](docs/web/CONTENT-MODEL.md) — collection → URL → cache-tag → JSON-LD data contract.
- [`docs/web/SEO-PLAYBOOK.md`](docs/web/SEO-PLAYBOOK.md) — JSON-LD recipes; drives Wave D Phase F server-side generators in `apps/cms`.
- [`apps/cms/src/payload/lib/route-prefixes.ts`](apps/cms/src/payload/lib/route-prefixes.ts) — single source of truth for URL prefixes (singulars `/event`, `/webinar`, `/job`, `/guide`, `/author`; plural `/resources`).

**Until web development restarts:** do not scaffold `apps/web/`, do not re-create the deleted design docs from memory, do not regenerate `docs/web/tokens.*` or `docs/web/figma-snapshots/`. When work resumes, this section will be rewritten with the active stack, hard rules, and pre-completion checks.

The cross-cutting hard rules that *will* apply once web exists are already captured in [`docs/web/WEB-ARCHITECTURE.md`](docs/web/WEB-ARCHITECTURE.md) (LeadHandler proxy, preview JWT, route segment immutability, no `NEXT_PUBLIC_*` for secrets, consent-mode-v2 before third-party scripts) — they don't need to live in this file until then.

---

## Figma access — tooling preserved, extracted output deferred

The design lives in the *CleanStart V4* Figma file (file key `doWR9Xbwgkz6dqR9n4m3BB`). The extraction tooling stays in place so it can be re-run when web development restarts; the previously extracted assets (`docs/web/tokens.css`, `tokens.json`, `figma-snapshots/`) were removed alongside `apps/web`.

- **Auth:** a Figma PAT lives in `$FIGMA_TOKEN` (root [`.env`](#), gitignored). Never echo, log, or commit the token. [`.env.example`](.env.example) documents the variable names.
- **File + node IDs:** `$FIGMA_FILE_KEY`, `$FIGMA_HOMEPAGE_NODE`.
- **Extraction script:** `pnpm figma:extract` runs [`scripts/figma-extract.ts`](scripts/figma-extract.ts). When the web app restarts, re-running this regenerates `docs/web/tokens.json`, `tokens.css`, and `figma-snapshots/`. Do not run it before then — the output has no consumer.
- **Plugin MCP** (`figma-console`): optional, not required for extraction.

**Hard rule when web restarts:** never hand-edit the extractor's output. Re-run the script instead.

---

## Test conventions

- **Unit:** Vitest, co-located as `*.test.ts` next to the file under test.
- **E2E:** Playwright, in `apps/cms/tests/e2e/`. Each spec tagged with the phase it covers (`@phase-d-preview`, `@phase-e-leads`, etc.) so CI can run a phase's gate suite.
- **Fixtures:** ETL fixtures (10 docs per collection) live in `migrations/webflow-export/fixtures/` per arch doc Phase 1. Don't seed dev DB from prod data.
- **Schema-validation tests:** every collection has at least one test asserting `payload generate:types` output matches a snapshot of the public type surface.

---

## Deploy rules

- `apps/cms` deploys via **Coolify** on push to `main`. There is no other deploy path.
- Postgres lives on the same droplet, localhost-bound. Migrations run via Payload's migration runner, never raw SQL.
- Cloudflare WAF sits in front of `admin.cleanstart.com`. 2FA is mandatory for every admin user.
- Staging is a separate droplet (or DB) per arch doc §`#staging`. Never point staging at prod data.
- Backup-cron heartbeat is monitored as a P1 alert (arch doc §`#logging-alerting`). If a backup script is changed, verify the heartbeat fires.

---

## When stuck

- **Schema question?** Read arch doc §`#new-fields` for that collection.
- **Block question?** Arch doc §`#blocks`.
- **Editor workflow question?** Arch doc §`#authoring`, §`#publishing-checklist`, §`#preview-workflow`.
- **Ops/security question?** Arch doc §`#security-headers`, §`#rate-limiting`, §`#privacy-gdpr`.
- **Migration question?** Arch doc §`#migration` (and the seven subsections under it).
- **Decision not in arch doc and not in this file?** Stop and ask. Don't invent.
