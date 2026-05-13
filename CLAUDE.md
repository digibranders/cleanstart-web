# CLAUDE.md — CleanStart repo

This file tells Claude Code *how* to work in this repo. It does not duplicate the architecture doc, which tells you *what* to build.

**Source of truth for *what*:** `docs/cleanstart-cms-architecture.html`. Every ticket, every design call, every schema decision references an anchor in that file (e.g. `#new-fields`, `#blocks`, `#publishing-checklist`). If this CLAUDE.md and the arch doc disagree, the arch doc wins for product/architecture decisions; this file wins for code conventions.

**Plan of record:** `~/.claude/plans/lets-review-the-doc-curried-feigenbaum.md` (CMS-only Phase A–I sequence). The current backlog is at `docs/BACKLOG.md`. Phases A–I are substantially done (see backlog for remaining ops-only gaps). **Currently active scope: Phase J — Integrations dashboard** (`apps/cms` Integrations collection + editor self-serve UI). `apps/web` marketing site is also active as of Phase J (see below).

---

## Local dev prerequisites

- **Node 22+** (24.x verified working)
- **pnpm 10.30.3+**
- **Postgres 16** running on `localhost:5432`. Local dev uses the host Postgres (Postgres.app / pgAdmin / Homebrew); database `cleanstart`, user `postgres`. Connection string lives in `apps/cms/.env` (gitignored). The `infra/docker-compose.yml` Postgres is for staging/droplet parity, not the local-dev path.
- **`apps/cms/.env`** must exist with `DATABASE_URI` and `PAYLOAD_SECRET` before `pnpm dev` will start. Copy from `apps/cms/.env.example` and generate the secret with `openssl rand -base64 32`.

**Key versions:**
```
apps/cms:  Next.js 16.2.0 · Payload 3.81.0 · React 19.0.0
apps/web:  Next.js 16.2.5 · React 19.2.4 · Tailwind CSS v4
Node ≥ 22 (24.x verified) · pnpm 10.30.3
```

---

## Repo layout

This directory (`cleanstart-website/`) is the monorepo root. The arch doc's §09 file map is authoritative.

```
cleanstart-website/                  monorepo · pnpm workspaces + Turborepo
├── apps/
│   ├── cms/                         Payload 3 admin + REST API · admin.cleanstart.com · port 3000
│   │   └── src/payload/{collections,globals,blocks,fields,access,lib,jobs,endpoints,hooks}/
│   └── web/                         @cleanstart/web marketing site · Next.js 16 · Tailwind v4 · port 3001
│       ├── src/{app,components,lib}/
│       ├── figma.config.json         Figma Code Connect (include: src/components/**/*.figma.tsx)
│       └── docs/design-tokens.md    Extracted Figma tokens (hero gradient, typography, palette, node IDs)
├── packages/
│   ├── types/                       re-exports apps/cms/payload-types
│   ├── ui/                          @cleanstart/ui design-system primitives + tokens; consumed by apps/cms and apps/web
│   └── config/                      tsconfig · biome · eslint
├── migrations/webflow-import/       Phase H: ETL scripts
├── infra/                           docker-compose · Caddy · backup/restore scripts
├── docs/                            BACKLOG.md · cleanstart-cms-architecture.html · INTEGRATIONS-RESEARCH.md · INTEGRATIONS-RESEARCH-V2.md
├── cleanstart-logo.svg              brand mark — also embedded as JSX in apps/cms/src/payload/admin/
└── CLAUDE.md                        this file
```

**`apps/web`** was re-bootstrapped at commit `ac5a0d0` as a purpose-built Next.js 16.2.5 / React 19 / Tailwind v4 marketing site. It currently has a hero page and Figma Code Connect wired (`figma.config.json`; component stubs live at `src/components/**/*.figma.tsx`). It is **early-stage** — no production deployment yet, no separate CI gate yet. The design/token/routing contracts from the prior wipe are gone; everything in `apps/web` now is built from Figma ground up. When touching `apps/web`, preserve the Code Connect setup: do not delete `figma.config.json` or restructure `src/components/` without understanding the connected Figma component mapping.

**Full page inventory:** `docs/WEB-PAGES.md` — canonical list of all 31 pages, their URL slugs, types (Static / CMS Listing / CMS Detail / Legal / Utility), build status, and recommended build order. Update the status column there whenever a page is completed.

**`packages/ui`** hosts the custom React primitives (`Drawer`, `Dialog`, `Popover`, `Combobox`, `ConfirmDialog`, `Spinner`, `Tooltip`, `DropdownMenu`, `ContextMenu`, `DateTimePicker`, `Toast`) plus design tokens. Consumed by both `apps/cms` and `apps/web` — no duplication between the two apps.

### `@payloadcms/ui` is a data-layer-only dependency

CleanStart owns every render path under `/admin`. Imports from `@payloadcms/ui` are limited to the **data layer**:

- Allowed: `useField`, `useFormFields`, `useDocumentInfo`, `useListQuery`, `useTableColumns`, `useSelection`, `useAuth`, `useConfig`, `useLocale`, `useTranslation`, `useDocumentDrawer` (the hook only — render comes from `@cleanstart/ui`).
- Forbidden: render-side exports (any component, including `Button`, `Drawer`, `Modal`, `Pill`, `useEditDepth`-driven view shells, etc.).

ESLint enforces the allow-list (Wave 8 flips it from warn to error). The `@payloadcms/ui` major is pinned (currently `^3.81.0`); a new major is a *data-layer* upgrade only — never a UI upgrade.

---

## Mandatory pre-completion checks

Before reporting any code change as done, run these against the package you touched. Scope to what changed — do not re-lint the whole monorepo for a one-file change.

```bash
# apps/cms
pnpm --filter @cleanstart/cms lint
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms build
pnpm --filter @cleanstart/cms test       # if tests were touched or added

# apps/web (when that package was touched)
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web build
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

## apps/web — marketing site conventions

Everything in this section applies only to `apps/web`. It does not override the global code conventions above — it extends them.

### Component structure

- One section per file: `src/components/sections/[page]/SectionName.tsx`
- Page entry point: `src/app/[page]/page.tsx`
- All nav links live in **one place only**: `src/lib/nav-config.ts`. Changing a page slug means changing it there — both desktop and mobile nav pick it up automatically.
- Do not restructure `src/components/` or delete `figma.config.json` without understanding the Figma Code Connect mapping.

### Figma-to-code rules

Every section is built directly from Figma design context. These rules are non-negotiable:

**Values must be exact — never approximated.**
- Copy gradient strings verbatim including angle, all stops, and opacities.
- Letter-spacing in `em` exactly as Figma reports (e.g. `-0.05em` ≠ `-0.04em`).
- Border-radius in exact `px` — `40px` is not `rounded-2xl` (which is `16px`).
- Shadow strings copied in full including all layers.
- Use `style={{}}` inline for any value that cannot be expressed as an exact Tailwind class.
- Use `clamp(minREM, Xvw, maxREM)` for all font sizes — never hardcode `px` for text.

**Section wrapper pattern:**
```tsx
<section className="relative overflow-hidden ..." style={{ minHeight: "Xpx" }}>
  {/* decorative elements — absolute positioned */}
  <div className="relative mx-auto max-w-[1276px] px-6">
    {/* content */}
  </div>
</section>
```
The outer `relative overflow-hidden` clips decorative elements. The inner `relative` wrapper ensures content sits above absolute decorative layers.

### Asset extraction rules

Before saving any asset downloaded from Figma MCP:
1. Detect actual format: `file --mime-type -b <file>`
   - `image/svg+xml` → save as `.svg` even if Figma called it `.png`
   - `image/png` → `.png` · `image/jpeg` → `.jpg`
2. Name descriptively: `hero-bg-grid.svg`, `founders-photo.png`, `card-glow.svg`
3. Save to `public/images/[page-name]/`
4. Verify the file exists on disk before referencing it in JSX

Never recreate an SVG asset in code — always extract the actual file from Figma MCP. If MCP did not return it, call `get_design_context` on the specific child node that contains it.

### Image component rules

- `next/image` (`Image`) for all PNG/JPG content images — requires explicit `width` and `height`.
- Plain `<img>` for decorative SVGs. Always add `// eslint-disable-next-line @next/next/no-img-element` on the line above.
- Every decorative element must have: `aria-hidden`, `pointer-events-none`, `select-none`, `loading="lazy"`, `decoding="async"`.

### Background decorative elements

Grids, blobs, guide lines, and glow flares are the most commonly missed detail. Rules:

- Positions use exact Figma `px` coordinates — including negative values. Do not move an element inward to "fix" a negative position; partial off-screen clipping via `overflow-hidden` is intentional.
- For vertical guide lines, use proportional positioning so they scale: `left: calc(Xpx / 1920 * 100%)` not fixed `px`.
- Radial gradient blobs are pure CSS `<div>` with `borderRadius: "50%"` — not SVG files.
- Bottom glow flares: `<div>` pinned `bottom-0 left-0 right-0`, `mix-blend-mode: screen` if Figma shows screen blend.
- Elements only visible at wide viewports: `className="hidden xl:block"`.

### CTA ↔ Footer overlap pattern

When a CTA card overlaps the Footer's dark background (standard pattern across all pages):

- `mb-[-Xpx]` goes on the `<section>` element — **not** the card div inside it.
- `z-20` goes on the **inner card wrapper div** — not the section.
- `<Footer />` stays outside `<main>` as a sibling — no extra wrapper needed in `page.tsx`.
- The section must not have a solid background that covers the overlap zone. If it has `bg-white`, replace with a gradient overlay that fades to `rgba(0,0,0,0)` at the bottom so the footer dark background bleeds through.

### FadeUp scroll animation

- Wrap every section below the fold in `<FadeUp>` in `page.tsx`.
- Never wrap the Hero (above the fold).
- Sections that share a continuous Figma frame (e.g. Hero + Factory) go inside **one** background wrapper div — not separate `FadeUp` wrappers for the background.
- `FadeUp` accepts `className` via spread — use `<FadeUp className="relative z-10">` if the section's card must render above a following sibling (e.g. footer) and stacking context is needed.

### Visual verification workflow

`preview_screenshot` only captures at `scrollY=0`. To bring any section into view:

```js
// Shift the ENTIRE page — use body, not main, so footer moves too
document.body.style.transform = `translateY(-${top - 100}px)`;
document.body.style.transformOrigin = 'top left';
// Reset:
document.body.style.transform = '';
```

Force FadeUp/animation wrappers visible before screenshotting:
```js
document.querySelectorAll('*').forEach(el => {
  if (window.getComputedStyle(el).opacity === '0') {
    el.style.opacity = '1';
    el.style.transform = 'none';
  }
});
```

A section is not done until its screenshot matches the Figma reference at 1440px.

---

## Forbidden actions

These are hard rules. Do not work around them — flag and stop instead.

- **Never edit `apps/cms/payload-types.ts` by hand.** It is generated. Run `pnpm --filter @cleanstart/cms generate:types`.
- **Never bypass the `LeadHandler` adapter** for lead writes. Even one-off scripts go through it. Arch doc §`#forms` makes the R2 fallback queue load-bearing for "no lead lost during outage" — bypassing it breaks that guarantee.
- **Never hand-edit the `config` column in the `integrations` table.** Values are encrypted blobs produced by `lib/integrations/secrets.ts`. Use the admin UI or the `encryptJson` helper.
- **Never rename a Next.js route segment post-launch** (e.g. `/webinar/[slug]` → `/webinars/[slug]`). It breaks every indexed URL. Arch doc §`#migration` last subsection is explicit.
- **Never commit `.env*`, secrets, R2 keys, Brevo keys, Webflow tokens, or 2FA seeds.** They live in 1Password vault `cleanstart-migration` and Coolify env-vars panel.
- **Never enable GraphQL on the Payload admin.** Arch doc §`#decisions`: `graphQL: { disable: true }` at launch.
- **Never `git add -A` or `git add .`** at repo root. Stage specific paths.
- **Never `--no-verify`** on commits. If a hook fails, fix it.
- **Never delete data or drop tables** without explicit user confirmation, even in dev. Postgres on the droplet is shared with staging.
- **Never bypass the publishing checklist** (arch doc §`#publishing-checklist`). It is the editor-facing safety gate.

---

## Schema decisions locked

These resolved the open forks from arch doc §`#decisions`. Build accordingly:

- **Webinar/Event registration:** per-record `registrationMode` discriminator (`'internal' | 'external'`); `registrationForm` (relationship to `forms`) and `registrationUrl` (URL string) are conditionally required based on the discriminator. (Earlier drafts used `'inHouse'` / `'inHouseForm'` / `'externalUrl'`; values were standardised at code time. Renaming would require a Payload migration — keep current values unless that cost is justified.)
- **Resource gating:** `gateForm` is an optional relationship to `forms` on the `resources` collection. Presence gates the download; absence makes it public.
- **Authors:** pure content collection. No `linkedUser` field at v1. If multi-author self-editing is ever needed, an additive migration adds an optional `linkedUser` relationship.
- **Knowledge Hub:** dedicated collections — `knowledgeBase` (versioned + drafts, per-article slug, SEO field group, slug-change-redirect hook) plus `knowledgeCategories` (hierarchical taxonomy with self-referencing `parent`). No URL-parity loss in migration because nothing past `/knowledge-hub` is indexed on the current Webflow site.
- **Guest Contributors:** still open. Ship as an additive optional `contributorType: 'staff' | 'guest'` field on the existing `authors` collection — do **not** create a separate collection.
- **Integrations collection (Phase J1 shipped):** `slug: 'integrations'`; `config` field stores per-kind credentials encrypted at rest via `lib/integrations/secrets.ts` (`encryptJson` / `isEncrypted`). Per-row `routing` group (`events[]`, `collections[]`, `formSlugs[]`, `minLeadScore`). Admin endpoints: `/api/integrations/:id/test`, `/api/integrations/:id/health`, `/api/integrations/:id/audit` (file: `payload/endpoints/integrations-actions.ts`). Dead-letter retry reuses `WebhookDeadLetter` collection. Router wired in `lib/integrations/router.ts`.

---

## Background jobs

Six Payload cron tasks run in `apps/cms/src/payload/jobs/`. All are gated by `PAYLOAD_AUTO_RUN=true` — set this in `.env` to enable; omitting it (e.g. in test runs) prevents spurious fires.

| Job | Schedule (UTC) | File |
|-----|----------------|------|
| Lead queue drain | every 5 min | `drain-lead-queue.ts` |
| Webhook retry | every 5 min | `retry-webhook.ts` |
| Search-log purge (90-day retention) | daily 03:00 | `purge-search-log.ts` |
| Leads PII redaction (365-day retention) | daily 03:15 | `purge-leads-pii.ts` |
| Broken-links scan | daily 04:30 | `check-broken-links.ts` |
| Meilisearch reindex (drift check + self-heal) | daily 05:00 | `reindex-meili.ts` |

Never change a job schedule without updating this table. Every new job needs a test file and must respect the `PAYLOAD_AUTO_RUN` gate.

---

## Live integrations

These channels are wired and active (env-var configured). See `apps/cms/.env.example` for the full annotated list.

| Integration | Purpose | Key env vars |
|---|---|---|
| Cloudflare R2 | Media storage + lead fallback queue | `R2_BUCKET`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_BASE` |
| Brevo | Transactional email on `lead.submitted` | `BREVO_API_KEY`, `BREVO_TEMPLATE_ID` |
| Microsoft Teams (Workflows) | Publish + lead notifications via Adaptive Cards | `WEBHOOK_TEAMS_URL`, `WEBHOOK_TEAMS_EVENTS` |
| Standard Webhooks | Generic HMAC-signed outbound webhook | `WEBHOOK_GENERIC_URL`, `WEBHOOK_GENERIC_EVENTS`, `WEBHOOK_GENERIC_SIGNING_SECRET` |
| Meilisearch | Full-text search + analytics | `MEILISEARCH_URL`, `MEILISEARCH_MASTER_KEY`, `MEILISEARCH_API_KEY` |
| Cloudflare Turnstile | Bot protection on `/api/leads/submit` | `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| Sentry | Error tracking + PII redaction | `SENTRY_DSN` (+ auth token, org, project) |
| IndexNow | Bing/Yandex ping on publish (7 collections) | `INDEXNOW_KEY` |

**Phase J2 planned:** Zoho CRM (OAuth 2.0 — primary CRM, build first), GA4 Measurement Protocol, Google Search Console. See `docs/INTEGRATIONS-RESEARCH-V2.md` for the full J1/J2/J3 milestone breakdown.

The `Integrations` collection (Phase J1) provides editor self-serve config for channels that don't require env-var changes (Teams channels, generic webhooks). The env-var channels above remain env-var-only until a J2 row migrates them.

---

## Test conventions

- **Unit:** Vitest, co-located as `*.test.ts` next to the file under test.
- **E2E:** Playwright, in `apps/cms/tests/e2e/`. Each spec tagged with the phase it covers (`@phase-d-preview`, `@phase-e-leads`, etc.) so CI can run a phase's gate suite.
- **Fixtures:** ETL fixtures (10 docs per collection) live in `migrations/webflow-export/fixtures/` per arch doc Phase 1. Don't seed dev DB from prod data.
- **Schema-validation tests:** every collection has at least one test asserting `payload generate:types` output matches a snapshot of the public type surface.

---

## Branch strategy

```
web ──────┐
          ├──► development (CI + integration) ──► main (production)
cms ──────┘
```

| Branch | Purpose | PRs to | Notes |
|--------|---------|--------|-------|
| `web` | All `apps/web` marketing site work | `development` | Never commit CMS changes here |
| `cms` | All `apps/cms` Payload work | `development` | Never commit web changes here |
| `development` | CI gate + integration | `main` | No direct feature work — merge only |
| `main` | Production | — | Coolify deploys `apps/cms` on push here |

**Rules:**
- All feature work starts from and PRs back to `development` via `web` or `cms` branch.
- Never push directly to `main`. Only `development` → `main` PRs after CI passes.
- Never work directly on `development` — it is the integration branch, not a feature branch.
- `web` and `cms` branches are permanent — never delete them.
- Keep `web` and `cms` branches rebased on `development` before opening a PR to avoid conflicts.
- One concern per PR: a `web` PR touches only `apps/web`; a `cms` PR touches only `apps/cms`.
  Shared files (`CLAUDE.md`, `docs/`, `packages/`) may go in either PR depending on what drove the change.

---

## Deploy rules

- `apps/cms` deploys via **Coolify** on push to `main`. There is no other deploy path.
- `apps/web` has no production deployment yet — actively developed on the `web` branch.
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
- **Integration question?** Read `docs/INTEGRATIONS-RESEARCH.md` (Teams/webhook deep-dive, Standard Webhooks signing) and `docs/INTEGRATIONS-RESEARCH-V2.md` (analytics read-back, inbound webhooks, J1/J2/J3 milestones).
- **Background job question?** Arch doc §`#cron-jobs` + the job file and its co-located test.
- **Which apps/web page to build next, or what slug/category a page uses?** `docs/WEB-PAGES.md`.
- **Decision not in arch doc and not in this file?** Stop and ask. Don't invent.
