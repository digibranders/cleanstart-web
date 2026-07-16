# CLAUDE.md — CleanStart repo

This file tells Claude Code *how* to work in this repo. It does not duplicate the architecture doc, which tells you *what* to build.

**Source of truth for *what*:** `docs/architecture/cleanstart-cms-architecture.html`. If this file and the arch doc disagree, the arch doc wins for product/architecture decisions; this file wins for code conventions.

**Current backlog:** `docs/BACKLOG.md`. Phases A–I are done. **Phase J — Integrations dashboard** is active. `apps/web` is live at `www.cleanstart.com`.

---

## Local dev prerequisites

- **Node 22+** (24.x verified) · **pnpm 10.30.3+**
- **Postgres 16** on `localhost:5432` (Postgres.app / Homebrew). Database `cleanstart`, user `postgres`. The `infra/docker-compose.yml` Postgres is for staging/droplet parity, not local dev.
- **`apps/cms/.env`** — copy from `.env.example`, generate secret with `openssl rand -base64 32`.

**Key versions:**

```
apps/cms:  Next.js 16.2.5 · Payload 3.81.0 · React 19.0.0
apps/web:  Next.js 16.2.5 · React 19.2.4 · Tailwind CSS v4
```

---

## Branching policy

| Branch        | Purpose                                          | Allowed scope |
| ------------- | ------------------------------------------------ | ------------- |
| `main`        | Production. Deploys go from here.                | Everything    |
| `development` | Day-to-day dev for `apps/cms` + `apps/web`.      | Everything    |
| `farheen`     | Web page work (scoped — see rules below).        | `apps/web` only, scoped to in-progress page |

No other long-lived branches. No feature branches, no worktrees for routine work. Short-lived branches by other developers (e.g. `feat/yatish-resume`) are tolerated but don't enter the merge cycle until promoted to `development`. All three branches are kept in sync at the same HEAD after every merge.

### Scoped-change rule on `farheen`

Every commit must be **scoped to the page being worked on**:
- Only touch `apps/web/src/app/<page>/`, `apps/web/src/components/sections/<page>/`, `apps/web/public/images/<page>/`.
- Allowed cross-page edits: one nav entry in `src/lib/nav-config.ts`, one row in `docs/web/WEB-PAGES.md`.
- **Do not touch:** `globals.css`, layout primitives, `tsconfig`/`eslint`/`biome` config, or any `apps/cms/` path.
- **Typography from global config, NOT Figma.** See `apps/web/docs/TYPOGRAPHY-SYSTEM.md` for the `--fs-*` token family. Never inline `text-[clamp()]` or `fontSize: "Xpx"`. If a role token doesn't exist for what Figma shows, **stop and ask** — adding a token is a shared change.
- No bulk formatter sweeps. No "while I'm here" cleanups.
- If a shared change is needed (new token, layout primitive, CSP entry), it lands on `development` first, then `farheen` rebases.

### Forbidden git actions

- Never force-push `main`. Use forward merges and back-merges to align.
- Never create new long-lived branches without updating this section.
- Never `git add -A` or `git add .` at repo root. Stage specific paths.
- Never `--no-verify` on commits. If a hook fails, fix it.
- Never delete data or drop tables without explicit user confirmation, even in dev.

---

## Repo layout

```
cleanstart-website/                  monorepo · pnpm workspaces + Turborepo
├── apps/
│   ├── cms/                         Payload 3 admin + REST API · cms.cleanstart.com · port 3000
│   │   └── src/payload/{collections,globals,blocks,fields,access,lib,jobs,endpoints,hooks}/
│   └── web/                         Marketing site · www.cleanstart.com · Next.js 16 · Tailwind v4 · port 3001
│       ├── src/{app,components,lib}/
│       ├── figma.config.json         Figma Code Connect mapping
│       └── docs/                    TYPOGRAPHY-SYSTEM.md · RESPONSIVE-SYSTEM-AUDIT.md (canonical)
├── packages/
│   ├── types/                       re-exports apps/cms/payload-types
│   ├── ui/                          @cleanstart/ui primitives + tokens (shared by cms + web)
│   └── config/                      tsconfig · biome · eslint
├── migrations/webflow-import/       Phase H: ETL scripts
├── infra/                           docker-compose · Caddy · backup/restore
├── docs/                            BACKLOG.md · architecture · integrations · operations
└── CLAUDE.md                        this file
```

**Page inventory:** `docs/web/WEB-PAGES.md` — canonical list of all pages, slugs, types, build status. Update status when a page is completed.

**`packages/ui`** hosts the shared React primitives (`Drawer`, `Dialog`, `Popover`, `Combobox`, `ConfirmDialog`, `Spinner`, `Tooltip`, `DropdownMenu`, `ContextMenu`, `DateTimePicker`, `Toast`) plus design tokens. Consumed by both `apps/cms` and `apps/web` — no duplication between apps.

When touching `apps/web`, preserve the Figma Code Connect setup: do not delete `figma.config.json` or restructure `src/components/` without understanding the connected Figma component mapping (stubs at `src/components/**/*.figma.tsx`).

### `@payloadcms/ui` is data-layer-only

Allowed imports: `useField`, `useFormFields`, `useDocumentInfo`, `useListQuery`, `useTableColumns`, `useSelection`, `useAuth`, `useConfig`, `useLocale`, `useTranslation`, `useDocumentDrawer` (hook only). No render-side components (`Button`, `Drawer`, `Modal`, `Pill`, `useEditDepth`-driven view shells, etc.). ESLint enforces the allow-list. The `@payloadcms/ui` major is pinned (`^3.81.0`); a new major is a data-layer upgrade only — never a UI upgrade.

---

## Mandatory pre-completion checks

Scope to what changed — do not re-lint the whole monorepo for a one-file change.

```bash
# apps/cms (when touched)
pnpm --filter @cleanstart/cms lint
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms build
pnpm --filter @cleanstart/cms test       # if tests were touched or added

# apps/web (when touched)
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web build
```

1. Fix before reporting — if lint/typecheck/build fails, fix and re-run.
2. Never skip, even for one-line changes.
3. Report: `lint ✓ · typecheck ✓ · build ✓`.
4. `payload generate:types` runs in CI and fails on drift. If you change a collection, regenerate types locally and commit the result.

---

## Code conventions

- **TypeScript strict.** No `any`. Explicit return types on exported functions.
- **Zod at boundaries.** REST handlers, lead intake, webhook payloads, ETL inputs — validated with Zod before crossing the boundary.
- **No null punning.** Distinguish `undefined` (not set) from `null` (explicitly cleared) — Payload uses both meaningfully.
- **Errors are typed.** Throw subclasses of `AppError` (`ValidationError`, `NotFoundError`, `IntegrationError`, `RateLimitError`). No bare `throw new Error('...')` outside of truly unexpected paths.
- **No comments unless the WHY is non-obvious.** Don't restate what the code does.
- **Three similar lines beats a premature abstraction.** Don't extract helpers until you have a third caller.
- **Validate at system boundaries only.** Trust internal code. Don't add defensive checks for impossible states.
- **Lexical nodes** follow arch doc §`#table-handling` and §`#link-handling`. Custom nodes: `apps/cms/src/payload/lib/lexical/`.

---

## apps/web conventions

### Layout primitives (use these, never hand-roll)

- `<Section padding="sm|md|lg|cta|none">` — wraps with `--spacing-section-*` tokens. Default `md`.
- `<Container variant="default|wide|prose">` — max-width 1440/1600/720. Never hardcode `max-w-[1440px]`.

### Typography

**Source of truth:** `apps/web/docs/TYPOGRAPHY-SYSTEM.md` — the `--fs-*` token family.

- Consume role tokens (`--fs-display`, `--fs-h1`–`--fs-h5`, `--fs-lead`, `--fs-body`, `--fs-caption`, `--fs-button`, `--fs-eyebrow`, etc.). Never inline `text-[clamp()]` or `fontSize: "Xpx"`.
- Font family: `var(--font-display)` Manrope / `var(--font-sans)` Sora / `var(--font-mono)`.
- Font weight: 400 body / 500 nav-meta-button / 600 sub-head+card-title+hero / 700 article H1–H3. No 800.
- Hero H1 uses `--text-hero-marketing` (40→72px), `--text-hero-product` (36→56px), or `--text-hero-utility` (32→48px). Listing/detail pages reuse `_shared/DetailHero.tsx`.
- Legacy `--text-hero-*`/`--text-display-*`/`--text-body-*` tokens are aliased to `--fs-*` — don't use in new code.

### Responsive system

**Source of truth:** `apps/web/docs/RESPONSIVE-SYSTEM-AUDIT.md`. All earlier docs in `docs/_archive/` (`RESPONSIVE-AUDIT.md`, `design-tokens.md`, `typography.md`, `web-responsiveness plan.md`) are dead — do NOT copy from them.

- **Figma artboard is 1920px — dev target is 1440px.** Scale interior dimensions (cards, illustrations, gaps, section padding) by ~0.75×. Keep absolute sizes (body text, buttons, form inputs, icons) at industry standards regardless of Figma. See RESPONSIVE-SYSTEM-AUDIT.md §17 decision 6.
- Card-grid interiors: use container queries (`container-type: inline-size` + `cqi`), NOT viewport `vw` — viewport units produce the over-sizing bug. Card title-to-width ratio: 8–13% band. Ref: `FactoryCard.tsx`.
- No bare `w-[Xpx]` without `max-w` qualifier. Card widths: `w-full max-w-[Xpx]`. Card heights: `min-h-[clamp()]` or `aspect-ratio`, never `h-[Xpx]`.
- Every `<Image>` needs `sizes` matching rendered widths per breakpoint. SVGs: `preserveAspectRatio="xMidYMid meet"` (never `"none"`).
- Buttons: `--btn-fs-*`/`--btn-h-*`/`--btn-px-*`, never `clamp()`. Primary CTAs ≥ 44px tall.
- Section vertical padding: `--spacing-section-*` tokens via `<Section padding>` or `py-section-*` utilities. Do not invent `pt-Xpx sm:pt-Ypx lg:pt-Zpx` shapes.
- Form inputs ≥ 16px font-size (iOS Safari zoom rule). `FormRenderer.tsx`'s `fieldInputStyle` already sets this; never override with `text-sm` (14 px).
- No `<br />` in prose — trust `max-width` + `text-wrap: balance` (applied globally on `h1`–`h4` via `@layer base`).
- Footer CTA-card geometry is owned by `Footer.tsx`. Per-page CTAs paint inside the slot via the `cta` prop.

### CMS prose / blog rendering

- Body content from RenderLexical lives inside `.article-body` (see `BlogDetailContent.tsx`).
- `.article-body .article-{paragraph|h1|h2|h3|...}` rules in `globals.css` consume the `--prose-*` token family. Body 17→18px / lh 1.6 / column max 680px / H3 ≥ 22px.
- **Do NOT use `text-[clamp()]` directly on prose elements** — wrap content in `.article-body` and let the rules apply.

### Section wrapper pattern

```tsx
import { Section, Container } from "@/components/layout";

<Section padding="md" className="relative overflow-hidden ...">
  <Container>{/* content */}</Container>
</Section>
```

### Component structure

- One section per file: `src/components/sections/[page]/SectionName.tsx`
- Page entry: `src/app/[page]/page.tsx`
- Nav links: `src/lib/nav-config.ts` only. Don't restructure `src/components/` or delete `figma.config.json`.

### Image rules

- `next/image` for PNG/JPG content images (explicit `width`/`height`).
- `<img>` for decorative SVGs — add `// eslint-disable-next-line @next/next/no-img-element`.
- Decorative elements: `aria-hidden`, `pointer-events-none`, `select-none`, `loading="lazy"`, `decoding="async"`.

### Figma-to-code

- Gradient strings, letter-spacing, border-radius, shadows: **exact** from Figma. Border-radius in exact `px` — `40px` is not `rounded-2xl` (which is `16px`). Use `style={{}}` for values without exact Tailwind classes.
- Never recreate SVG assets in code — extract from Figma MCP. If MCP didn't return it, call `get_design_context` on the specific child node.
- Assets saved to `public/images/[page-name]/`. Before saving, detect actual format: `file --mime-type -b <file>` (`image/svg+xml` → `.svg` even if Figma called it `.png`). Verify the file exists on disk before referencing in JSX.

### CTA ↔ Footer overlap

- `mb-[-Xpx]` on the `<section>` element — **not** the card div inside it. `z-20` on the **inner card wrapper div** — not the section.
- `<Footer />` stays outside `<main>` as a sibling — no extra wrapper needed in `page.tsx`.
- The section must not have a solid background covering the overlap zone. If it has `bg-white`, replace with a gradient fading to `rgba(0,0,0,0)` at the bottom so the footer dark background bleeds through.

### FadeUp animation

- Wrap every below-fold section in `<FadeUp>` in `page.tsx`. Never wrap the Hero (above the fold).
- Continuous-frame sections (e.g. Hero + Factory) go inside **one** background wrapper div — not separate `<FadeUp>` wrappers for the background.
- `FadeUp` accepts `className` via spread — use `<FadeUp className="relative z-10">` if the section's card must render above a following sibling.

### Background decorative elements

- Exact Figma px positions (including negative values). Do not move an element inward to "fix" a negative position; partial off-screen clipping via `overflow-hidden` is intentional.
- Vertical guide lines: proportional positioning `left: calc(Xpx / 1920 * 100%)`, not fixed px.
- Radial gradient blobs: CSS `<div>` with `borderRadius: "50%"`, not SVG files.
- Bottom glow flares: `<div>` pinned `bottom-0 left-0 right-0`, `mix-blend-mode: screen` if Figma shows screen blend.
- Elements only visible at wide viewports: `className="hidden xl:block"`.

### Visual verification workflow

- **Always lock Claude Preview to desktop viewport (1440×900)** — never verify at mobile or tablet widths unless explicitly asked.
- `preview_screenshot` only captures at `scrollY=0`. To bring a section into view:
  ```js
  document.body.style.transform = `translateY(-${top - 100}px)`;
  document.body.style.transformOrigin = 'top left';
  ```
- Force FadeUp/animation wrappers visible before screenshotting:
  ```js
  document.querySelectorAll('*').forEach(el => {
    if (window.getComputedStyle(el).opacity === '0') {
      el.style.opacity = '1'; el.style.transform = 'none';
    }
  });
  ```
- A section is not done until its screenshot matches the Figma reference at 1440px.

---

## Forbidden actions

These are hard rules. Do not work around them — flag and stop instead.

- **Never edit `apps/cms/payload-types.ts` by hand.** It is generated. Run `pnpm --filter @cleanstart/cms generate:types`.
- **Never bypass the `LeadHandler` adapter** for lead writes. Even one-off scripts go through it. The R2 fallback queue is load-bearing for "no lead lost during outage".
- **Never hand-edit the `config` column in the `integrations` table.** Values are encrypted blobs produced by `lib/integrations/secrets.ts`. Use the admin UI or the `encryptJson` helper.
- **Never rename a Next.js route segment post-launch** (e.g. `/webinar/[slug]` → `/webinars/[slug]`). It breaks every indexed URL.
- **Never commit `.env*`, secrets, R2 keys, HubSpot tokens, or API keys.** They live in the operator's secrets store, GitHub Actions secrets, and `/opt/cleanstart/.env` on the droplet (chmod 600).
- **Never enable GraphQL** on the Payload admin (`graphQL: { disable: true }`).
- **Never bypass the publishing checklist** (arch doc §`#publishing-checklist`). It is the editor-facing safety gate.

---

## Schema decisions (locked)

- **Webinar/Event registration:** per-record `registrationMode: 'internal' | 'external'` discriminator; `registrationForm` (relationship to `forms`) and `registrationUrl` (URL string) conditionally required based on the mode.
- **Resource gating:** `gateForm` is an optional relationship to `forms`. Presence gates the download; absence makes it public.
- **Authors:** pure content collection. No `linkedUser` at v1. If multi-author self-editing is needed later, an additive migration adds an optional `linkedUser` relationship.
- **Guest Contributors:** still open. Ship as an additive optional `contributorType: 'staff' | 'guest'` field on the existing `authors` collection — do **not** create a separate collection.
- **Knowledge Hub:** `knowledgeBase` (versioned + drafts, slug-change-redirect hook, SEO field group) + `knowledgeCategories` (hierarchical with self-referencing `parent`).
- **Integrations (Phase J1):** `config` field encrypted at rest via `lib/integrations/secrets.ts`. Per-row `routing` group (`events[]`, `collections[]`, `formSlugs[]`, `minLeadScore`). Admin endpoints: `/api/integrations/:id/test`, `/health`, `/audit` (file: `payload/endpoints/integrations-actions.ts`). Dead-letter retry reuses `WebhookDeadLetter`. Router: `lib/integrations/router.ts`.

---

## Background jobs

Twelve cron tasks in `apps/cms/src/payload/jobs/`. All gated by `PAYLOAD_AUTO_RUN=true` — set this in `.env` to enable; omitting it (e.g. in test runs) prevents spurious fires.

| Job | Schedule (UTC) | File |
|-----|---------------|------|
| Lead queue drain | every 5 min | `drain-lead-queue.ts` |
| Webhook retry | every 5 min | `retry-webhook.ts` |
| Deal-registration sync retry | every 10 min | `retry-deal-sync.ts` |
| Search-log purge (90-day) | daily 03:00 | `purge-search-log.ts` |
| Leads PII redaction (365-day) | daily 03:15 | `purge-leads-pii.ts` |
| Deal-registrations purge (365-day) | daily 03:30 | `purge-deal-registrations.ts` |
| Career-applications purge (365-day) | daily 03:45 | `purge-career-applications.ts` |
| Consent-log purge (24-month) | daily 04:00 | `purge-consent-log.ts` |
| Broken-links scan | daily 04:30 | `check-broken-links.ts` |
| Meilisearch reindex | daily 05:00 | `reindex-meili.ts` |
| Content-insights snapshot rebuild | daily 06:30 | `refresh-content-insights.ts` |
| Core Web Vitals (CrUX) refresh | daily 06:45 | `refresh-crux.ts` (no-op without `CRUX_API_KEY`) |

Update this table when adding/changing jobs. Every job needs a test file and the `PAYLOAD_AUTO_RUN` gate.

---

## Live integrations

| Integration | Purpose | Key env vars |
|------------|---------|-------------|
| Cloudflare R2 | Media storage + lead fallback queue | `R2_BUCKET`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_BASE` |
| HubSpot | Lead relay → Forms Submissions API (keyed by `forms.hubspotFormGuid`); Deal registration → CRM Deals API (`lib/deal-registrations/hubspot-deal.ts`), gated by `integrations` `hubspotCrm` row. Distinct paths. | `HUBSPOT_PORTAL_ID`, `HUBSPOT_PRIVATE_APP_TOKEN`, `HUBSPOT_DEAL_PIPELINE`, `HUBSPOT_DEAL_STAGE` |
| Microsoft Teams | Publish + lead notifications via Adaptive Cards | `WEBHOOK_TEAMS_URL`, `WEBHOOK_TEAMS_EVENTS` |
| Standard Webhooks | Generic HMAC-signed outbound webhook | `WEBHOOK_GENERIC_URL`, `WEBHOOK_GENERIC_EVENTS`, `WEBHOOK_GENERIC_SIGNING_SECRET` |
| Meilisearch | Full-text search + analytics | `MEILISEARCH_URL`, `MEILISEARCH_MASTER_KEY`, `MEILISEARCH_API_KEY` |
| Cloudflare Turnstile | Bot protection on `/api/leads/submit` + deal-reg | `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| Sentry | Error tracking + PII redaction | `SENTRY_DSN` |
| IndexNow | Bing/Yandex ping on publish (7 collections) | `INDEXNOW_KEY` |
| Brevo | Careers/partner transactional email (HR notification + resume on job apps; partner-form pair). Distinct from HubSpot — never receives careers/partner data. | `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `CAREERS_HR_EMAIL`, `PARTNER_USER_TEMPLATE_ID`, `PARTNER_ADMIN_TEMPLATE_ID`, `PARTNERS_NOTIFY_EMAIL` |

See `apps/cms/.env.example` for full annotated list. Phase J2 planned: Zoho CRM, GA4, GSC. See `docs/integrations/INTEGRATIONS-RESEARCH-V2.md` for J1/J2/J3 milestones.

The `Integrations` collection (Phase J1) provides editor self-serve config for channels that don't require env-var changes (Teams channels, generic webhooks). The env-var channels above remain env-var-only until a J2 row migrates them.

---

## Test conventions

- **Unit:** Vitest, co-located as `*.test.ts` next to the file under test.
- **E2E:** Playwright, in `apps/cms/tests/e2e/`. Each spec tagged with the phase it covers (`@phase-d-preview`, `@phase-e-leads`, etc.) so CI can run a phase's gate suite.
- **Fixtures:** ETL fixtures (10 docs per collection) in `migrations/webflow-export/fixtures/`. Don't seed dev DB from prod data.
- **Schema-validation tests:** every collection has at least one test asserting `payload generate:types` output matches a snapshot of the public type surface.

---

## Deploy rules

- **`apps/cms`:** GitHub Actions (`.github/workflows/deploy-cms.yml`) on push to `main`. Docker image → droplet → `docker compose up -d --wait`. Caddy handles TLS. Single droplet at `cms.cleanstart.com`. Admin access is password-only at v1 — 2FA deferred (see `docs/BACKLOG.md` A9).
- **`apps/web`:** Vercel, deploys from `main`. Live at `www.cleanstart.com`. Staging at `staging.cleanstart.com` (noindex QA alias).
- Postgres on the droplet, localhost-bound. Migrations via Payload's migration runner, never raw SQL.
- Cloudflare WAF in front of `cms.cleanstart.com`.
- Never point staging at prod data. Staging is a separate droplet (or DB) per arch doc §`#staging`.
- Backup-cron heartbeat is P1 alert (arch doc §`#logging-alerting`). If a backup script is changed, verify the heartbeat fires.

---

## Production rollout checklist

**Moved to `docs/operations/PRODUCTION-ROLLOUT.md`** — one-shot scripts for prod go-live (backfills, seeds, provisioning). Consult that file when running prod ops.

---

## When stuck

- **Schema:** arch doc §`#new-fields`.
- **Blocks:** arch doc §`#blocks`.
- **Editor workflow:** arch doc §`#authoring`, §`#publishing-checklist`, §`#preview-workflow`.
- **Ops/security:** arch doc §`#security-headers`, §`#rate-limiting`, §`#privacy-gdpr`.
- **Migration:** arch doc §`#migration`.
- **Integration:** `docs/integrations/INTEGRATIONS-RESEARCH.md`, `INTEGRATIONS-RESEARCH-V2.md`.
- **Background jobs:** arch doc §`#cron-jobs` + job file + test.
- **Which page to build:** `docs/web/WEB-PAGES.md`.
- **Web production:** `docs/web/WEB-PRODUCTION.md`.
- **Prod one-shots:** `docs/operations/PRODUCTION-ROLLOUT.md`.
- **Past incidents & non-obvious bugs:** `docs/operations/INCIDENTS.md` — check it before deep-debugging a prod issue, and **append a new entry** whenever you fix a prod incident or a bug whose root cause was non-obvious (symptom → root cause → fix → reusable lesson).
- **Decision not documented?** Stop and ask.
