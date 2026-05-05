# CLAUDE.md — CleanStart CMS repo

This file tells Claude Code *how* to work in this repo. It does not duplicate the architecture doc, which tells you *what* to build.

**Source of truth for *what*:** `docs/cleanstart-cms-architecture.html`. Every ticket, every design call, every schema decision references an anchor in that file (e.g. `#new-fields`, `#blocks`, `#publishing-checklist`). If this CLAUDE.md and the arch doc disagree, the arch doc wins for product/architecture decisions; this file wins for code conventions.

**Plan of record:** `~/.claude/plans/lets-review-the-doc-curried-feigenbaum.md` (CMS-only Phase A–I sequence). The current backlog is at `docs/BACKLOG.md`.

**Scope of this session:** `apps/cms` only (Payload admin + REST API + hooks). The public marketing site `apps/web` is out of scope until brand/Figma lands.

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
│                                    brand PDF, future EDITOR-GUIDE / CONTENT-MODEL / RESTORE-LOG
├── cleanstart-logo.svg              brand mark — also embedded as JSX in apps/cms/src/payload/admin/
└── CLAUDE.md                        this file
```

`apps/web` is **planned** — implementation kicks off W1 (Home page first). Documentation contracts ship in `docs/web/` ahead of code; see [`docs/web/WEB-ARCHITECTURE.md`](docs/web/WEB-ARCHITECTURE.md) and the **apps/web** section below. `packages/ui` remains intentionally absent — primitives live inside `apps/web/components/primitives/` until cross-app reuse demands extraction.

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

## apps/web (public marketing site)

**Source of truth for design + content surface:** [`docs/web/`](docs/web/). The arch doc ([`docs/cleanstart-cms-architecture.html`](docs/cleanstart-cms-architecture.html)) remains the source of truth for behavior; `docs/web/` translates that behavior into web-client contracts. If they disagree, arch doc wins for product decisions; `docs/web/` wins for code conventions inside `apps/web/`.

**Stack:** Next.js 16.2 App Router · Tailwind v4 (`@theme`) · shadcn/ui · TypeScript strict · Biome · Vitest + Playwright. Same Node 22 / pnpm 10 as `apps/cms`.

**Hosting:** `apps/web` deploys to **Vercel Pro** (per arch doc §hosting); `apps/cms` stays on **Coolify+droplet**. Cloudflare WAF fronts both. The split is deliberate — see [`docs/web/WEB-ARCHITECTURE.md §15`](docs/web/WEB-ARCHITECTURE.md#15--deployment) for rationale.

**URL parity is hard.** All URLs verified against the live `cleanstart.com` sitemap on 2026-05-05 — see [`docs/web/WEB-ARCHITECTURE.md §3`](docs/web/WEB-ARCHITECTURE.md#3--route-map-locked-against-live-cleanstartcom). Listings: `/blogs`, `/news`, `/events`, `/webinar` (singular!), `/careers`, `/resource-center`. Detail prefixes: `/blogs/[slug]`, `/news/[slug]`, `/event/[slug]`, `/webinar/[slug]`, `/job/[slug]`, `/resources/[slug]`, `/guide/[slug]`, `/author/[slug]` — all per [`apps/cms/src/payload/lib/route-prefixes.ts`](apps/cms/src/payload/lib/route-prefixes.ts).

**Hard rules** (in addition to the global Forbidden actions section):
- **Never duplicate the LeadHandler chain in `apps/web`.** All form posts proxy to `https://admin.cleanstart.com/api/leads/submit` via a Server Action (`apps/web/app/api/leads/submit/route.ts`).
- **Never expose `PAYLOAD_SECRET` to the browser** — no `NEXT_PUBLIC_*` prefix; preview-JWT verification is server-only.
- **Never bypass the `/api/preview` JWT check.** Cookie tokens are re-verified on every page render.
- **Never rename a Next.js route segment post-launch.** Already in Forbidden actions; re-stated for emphasis on `apps/web`.
- **Never hard-code design tokens.** Consume from `docs/web/tokens.css` via the `@theme` import. No raw hex colors, no inline `box-shadow`/`filter`, no off-grid spacing.
- **Never hand-edit `docs/web/tokens.json` or `docs/web/tokens.css`.** Re-run `pnpm figma:extract`.
- **Never load third-party scripts before consent** unless strictly necessary (functional/security cookies excepted). Consent-mode v2 enforced via `lib/consent.ts`.
- **Never change `apps/cms` to satisfy `apps/web`** without first ensuring `docs/cleanstart-cms-architecture.html` agrees.

**Pre-completion checks (apps/web):**

```bash
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web build
pnpm --filter @cleanstart/web test
```

Same rule as the CMS: fix before reporting; report `lint ✓ · typecheck ✓ · build ✓`.

**Reading order for new contributors:** [`README`](README.md) → this file → [`docs/web/WEB-ARCHITECTURE.md`](docs/web/WEB-ARCHITECTURE.md) → [`docs/web/CONTENT-MODEL.md`](docs/web/CONTENT-MODEL.md) → [`docs/web/COMPONENT-MAP.md`](docs/web/COMPONENT-MAP.md) → [`docs/web/DESIGN-SYSTEM.md`](docs/web/DESIGN-SYSTEM.md) → [`docs/web/BACKLOG-WEB.md`](docs/web/BACKLOG-WEB.md).

A separate `apps/web/CLAUDE.md` ships in W-A bootstrap (template in [`docs/web/BACKLOG-WEB.md`](docs/web/BACKLOG-WEB.md) §apps/web/CLAUDE.md template).

---

## Figma source of truth

The design lives in the *CleanStart V4* Figma file (file key
`doWR9Xbwgkz6dqR9n4m3BB`). The Home page (node `108:7624`) is the only
design-complete artboard at start of W1; six more pages are in design.
See [`docs/web/BACKLOG-WEB.md`](docs/web/BACKLOG-WEB.md) for the
design-availability wave plan.

### For Claude sessions doing design extraction or asset pulls

- **Auth:** a Figma PAT lives in `$FIGMA_TOKEN` (root [`.env`](#), gitignored). Never echo, log, or commit the token. [`.env.example`](.env.example) documents the variable names.
- **File + node IDs:** `$FIGMA_FILE_KEY` (default `doWR9Xbwgkz6dqR9n4m3BB`), `$FIGMA_HOMEPAGE_NODE` (default `108:7624`).
- **Extraction script:** `pnpm figma:extract` runs [`scripts/figma-extract.ts`](scripts/figma-extract.ts). It re-derives [`docs/web/tokens.json`](docs/web/tokens.json), [`docs/web/tokens.css`](docs/web/tokens.css), and per-page snapshots in `docs/web/figma-snapshots/`. Re-run after any Figma update; commit the resulting `docs/web/` files (script output is tracked, the secret is not).
- **Variables API:** requires `file_variables:read` PAT scope AND the file having published Figma Variables. Currently not used (file has no Variables); the layer-walk path in `figma-extract.ts` is the source of truth. If the designer later promotes layer styles to Variables, regenerate the PAT with that scope and the script auto-prefers it.
- **Plugin MCP** (`figma-console`): optional. Useful for live design iteration; not required for extraction. REST API + `pnpm figma:extract` is sufficient.

**Hard rule:** if a token value disagrees between [`docs/web/tokens.json`](docs/web/tokens.json) and a hand-edited CSS variable in `apps/web/`, the JSON wins. Hand-edits to `tokens.css` are forbidden — re-run the extractor instead.

**Snapshot caveat:** the Home artboard (1920×9276 px) exceeds Figma REST `/v1/images` render-service limits even at scale=1. The other six pages render fine. See [`docs/web/figma-snapshots/README.md`](docs/web/figma-snapshots/README.md) for workarounds.

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
