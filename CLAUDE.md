# CLAUDE.md — CleanStart repo

This file tells Claude Code *how* to work in this repo. It does not duplicate the architecture doc, which tells you *what* to build.

**Source of truth for *what*:** `docs/architecture/cleanstart-cms-architecture.html`. Every ticket, every design call, every schema decision references an anchor in that file (e.g. `#new-fields`, `#blocks`, `#publishing-checklist`). If this CLAUDE.md and the arch doc disagree, the arch doc wins for product/architecture decisions; this file wins for code conventions.

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

## Branching policy

The repo has **exactly three long-lived branches**. All three are kept in sync at the same HEAD after every merge.

| Branch | Owner / device | Purpose | Allowed scope |
|---|---|---|---|
| `main` | — | Production truth. Deploys go from here. | Everything |
| `development` | Primary dev branch on this device (`admin@digibranders.com`) | Day-to-day development for both `apps/cms` and `apps/web`. | Everything |
| `farheen` | Farheen's primary device | Web-only contributions, **scoped to the page being worked on**. | **`apps/web/` ONLY** — no edits to `apps/cms/`, `packages/`, `migrations/`, `infra/`, `docs/architecture/cleanstart-cms-architecture.html`, or shared config. Touching CMS code on `farheen` is a hard rule violation. |

### No other long-lived branches

- **No feature branches**, **no fix/* branches**, **no integration/* branches**, **no `web` branch**, **no worktrees** for routine development.
- Hotfixes go directly on the branch that owns them (`development` for CMS, `farheen` for web).
- Exception: short-lived branches created by another developer (e.g. `feat/yatish-resume`) are tolerated for their owner's use, but they don't enter the merge cycle until promoted to `development`.

### Scoped-change rule on `farheen`

Every commit on `farheen` must be **scoped to the page or feature being worked on**. Other pages, shared utilities, and global config stay untouched.

- **Working on `/for-developers`?** Only touch `apps/web/src/app/for-developers/`, `apps/web/src/components/sections/for-developers/`, and `apps/web/public/images/for-developers/`. Do not edit `/community`, `/sbom`, `/teams`, etc., nor `globals.css`, `nav-config.ts`, layout primitives, or `tsconfig`/`eslint`/`prettier`/`biome` config.
- **Adding a new page?** New route under `apps/web/src/app/<page>/`, new sections under `apps/web/src/components/sections/<page>/`, new assets under `apps/web/public/images/<page>/`. The only allowed cross-page edits are:
  - One line in `apps/web/src/lib/nav-config.ts` to add the nav entry.
  - One row in `docs/web/WEB-PAGES.md` for the page inventory.
- **Typography comes from the global config — NOT from Figma.** For any new or existing page, **ignore Figma's font sizes, font family, font weights, letter-spacing, and line-heights**. The canonical typography spec is **[`apps/web/docs/TYPOGRAPHY-SYSTEM.md`](apps/web/docs/TYPOGRAPHY-SYSTEM.md)** (v2/v4, 2026-05-27). Consume the role tokens defined there:
  - Hero H1 (marketing/product) → `var(--fs-display)` (36 → 64 px).
  - Listing / detail / legal H1 → `var(--fs-h1)` (32 → 56 px).
  - Section H2 → `var(--fs-h2)` (28 → 48 px).
  - Subsection / card title → `var(--fs-h3)` (22 → 28 px).
  - Card sub-title → `var(--fs-h4)`; small panel header → `var(--fs-h5)`.
  - Hero sub-heading / intro → `var(--fs-lead)` (18 → 20 px).
  - Body copy → `var(--fs-body)` (16 → 17 px); secondary → `var(--fs-body-sm)`; caption/meta → `var(--fs-caption)`.
  - Buttons → `var(--fs-button)` (16 px) or `var(--fs-button-lg)` (16 → 18 px, hero CTA).
  - Inputs / textarea / select → `var(--fs-input)` (16 px fixed — iOS zoom rule).
  - Eyebrow chip → `var(--fs-eyebrow)` (UPPERCASE, 0.08em tracking).
  - Prose (CMS-rendered article content) → `.article-body` + `--prose-*`.
  - Font family → `var(--font-display)` (Manrope) / `var(--font-sans)` (Sora) / `var(--font-mono)`. Never literal `"Figtree"` / `"InterFigmaName"` etc.
  - Font weight → 400 body / 500 nav-meta-button / 600 sub-head + card title + hero / 700 article H1–H3. No `font-weight: 800`. No other weights.
  Inline `text-[clamp(...)]`, `text-[Xpx]`, `fontSize: "Xpx"`, or any other ad-hoc type sizing is forbidden. **Legacy `--text-hero-*` / `--text-display-*` / `--text-card-title-*` / `--text-body-*` / `--text-t-*` tokens are aliased to the new `--fs-*` family** in `globals.css` for backward compatibility but should not be used in new code. If a role token doesn't exist for what Figma shows, **stop and ask** — adding a new token is a shared change that goes through `development`, not `farheen`.
- **No bulk formatter sweeps.** Prettier/Biome reflows that touch dozens of unrelated files are forbidden. If formatter config changes, raise it for discussion before applying — never bundle a formatter pass with feature work.
- **No "while I'm here" cleanups.** Renaming a shared variable, tweaking a layout primitive, or "fixing" an unrelated page in the same commit is out of scope.
- **Shared files that ARE allowed to change** when justified by the in-scope work: `apps/web/src/lib/nav-config.ts` (nav entry only) and `docs/web/WEB-PAGES.md` (inventory row only). Anything else is out of scope.

If a page genuinely needs a shared change (e.g. a new design token, a new layout primitive, a CSP allow-list entry), pause and coordinate — that work lands separately on `development` first, then `farheen` rebases.

### Forbidden git actions on this repo

- Force-pushing `main` — never. Use forward merges and back-merges to align.
- Creating new long-lived branches without updating this section first.
- Touching `apps/cms/` or other CMS-side paths from the `farheen` branch.
- Bulk formatter or cross-page commits on the `farheen` branch — see "Scoped-change rule" above.

---

## Repo layout

This directory (`cleanstart-website/`) is the monorepo root. The arch doc's §09 file map is authoritative.

```
cleanstart-website/                  monorepo · pnpm workspaces + Turborepo
├── apps/
│   ├── cms/                         Payload 3 admin + REST API · cms.cleanstart.com · port 3000
│   │   └── src/payload/{collections,globals,blocks,fields,access,lib,jobs,endpoints,hooks}/
│   └── web/                         @cleanstart/web marketing site · Next.js 16 · Tailwind v4 · port 3001
│       ├── src/{app,components,lib}/
│       ├── figma.config.json         Figma Code Connect (include: src/components/**/*.figma.tsx)
│       └── docs/RESPONSIVE-SYSTEM-AUDIT.md  Authoritative responsive/typography/sizing system (2026-05-21)
│       └── docs/_archive/           Legacy docs (RESPONSIVE-AUDIT.md, design-tokens.md, typography.md, web-responsiveness plan.md) — do NOT consult or copy from
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

**Full page inventory:** `docs/web/WEB-PAGES.md` — canonical list of all 31 pages, their URL slugs, types (Static / CMS Listing / CMS Detail / Legal / Utility), build status, and recommended build order. Update the status column there whenever a page is completed.

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

### Responsive system rules (canonical — supersedes v3 / Figma-tokens / RESPONSIVE-AUDIT)

> **Source of truth: `apps/web/docs/RESPONSIVE-SYSTEM-AUDIT.md` (2026-05-21).**
> All earlier docs (`apps/web/docs/_archive/RESPONSIVE-AUDIT.md`, `design-tokens.md`, `typography.md`, `web-responsiveness plan.md`) are archived. **Do NOT copy patterns from them**, do not reference them in new code or PRs, do not treat their "v3 Consistency Layer" tables as binding. Anything in those archived docs is historical.

**Layout primitives (use these, do not hand-roll wrappers):**
> - `<Container variant="default|wide|prose">` (`apps/web/src/components/layout/Container.tsx`) — wraps page content with the correct `--container-{default|wide|prose}` max-width (1440 / 1600 / 720). The 1440 cap, paired with the Container's inner `px-6` (24 px), gives a **constant 24 px side gutter at every viewport from 320 up through 1440**; above 1440 the cap kicks in and auto-margins grow the gutter uniformly. **Never hardcode `max-w-[1276px]` or `max-w-[1440px]`** — consume the token via `<Container>`.
> - `<Section padding="sm|md|lg|cta|none">` (`apps/web/src/components/layout/Section.tsx`) — wraps a section with one of the `--spacing-section-*` tokens. Default `padding="md"` (64 → 120 px fluid).

**Hero H1 (consume the role token, do not inline clamp):**
> - Marketing pages (home, about, teams) → `style={{ fontSize: "var(--text-hero-marketing)", letterSpacing: "var(--text-hero-marketing-ls)", lineHeight: "var(--text-hero-lh)" }}` → 40 → 72 px
> - Product pages (cleansight, cleanstart-images, ASR, FIPS, CISO, SBOM, SCA, vulnerability-remediation) → `var(--text-hero-product)` → 36 → 56 px
> - Listing + detail pages (blogs, news, events, podcast, webinars, resource-center, *[/slug]*) → `var(--text-hero-utility)` → 32 → 48 px. The shared `_shared/DetailHero.tsx` already consumes this; reuse it instead of building a new hero.
> - Tokens are fluid below `lg` (1024 px) and lock to fixed px from `lg+`. Do NOT inline `clamp(...)` for a new hero — it diverges from the role system.

**Card-grid interior scaling (use container queries, not viewport units):**
> - For cards in a multi-column grid (Factory pattern, Resources article cards, etc.) where the card width depends on grid columns, add `container-type: inline-size` to the card root and size interiors with `clamp(min, Xcqi, max)`. See `apps/web/src/components/ui/FactoryCard.tsx` (desktop variant) for the reference implementation.
> - The card's title-to-card-width ratio should land in the **8–13 %** band at every desktop viewport.
> - Do NOT use viewport-scoped `clamp(min, Xvw, max)` for card interiors — it produces the over-sizing bug that the Factory card had before the container-query refactor.

**CMS prose / blog rendering:**
> - Body content from RenderLexical lives inside `.article-body` (see `apps/web/src/components/sections/blog/BlogDetailContent.tsx`).
> - `.article-body .article-{paragraph|h1|h2|h3|h4|h5|h6|ul|ol|li|blockquote}` rules in `globals.css` consume the `--prose-*` token family. Body 17 → 18 px / lh 1.6 / column max 680 px / H3 ≥ 22 px (hierarchy must hold above body).
> - **Do NOT use `text-[clamp(...)]` directly on prose elements** — wrap the content in `.article-body` and let the rules apply.

**Form inputs (iOS Safari rule):**
> - `<input>`, `<textarea>`, `<select>` must have `font-size: 16 px` minimum (or `1rem`). Below 16 px, iOS Safari zooms in on focus. `FormRenderer.tsx`'s `fieldInputStyle` already sets this; never override with `text-sm` (14 px).

**Navbar logo:**
> - Logo `<a>` link uses `shrink-0`, and the `<Image>` uses `shrink-0 object-contain` with explicit `width`/`height` props. The fix in `Header.tsx` / `Logo.tsx` prevents flex from squashing the aspect ratio at narrow viewports.

**Carry-over rules from the prior system (still apply):**
> - **No bare `w-[Xpx]` without a `max-w` qualifier.** Card widths use `w-full max-w-[Xpx]`.
> - **Card heights → `min-h-[clamp()]` or `aspect-ratio`**, never `h-[Xpx]`.
> - **Every `<Image>` requires `sizes`** matching its rendered widths per breakpoint.
> - **SVG with intrinsic ratio uses `preserveAspectRatio="xMidYMid meet"`** (never `"none"`).
> - **No `<br />` in prose** (`<p>`, `<h1>`, `<h2>`, `<h3>`). Trust `max-width` + `text-wrap: balance` (applied globally on `h1`/`h2`/`h3`/`h4` via `@layer base`).
> - **Buttons use `--btn-fs-*` / `--btn-h-*` / `--btn-px-*`**, never `clamp()`. Primary CTAs ≥ 44 px tall.
> - **Section vertical padding uses `--spacing-section-*` tokens** via the `<Section padding>` prop or `py-section-*` utility classes. Do not invent new `pt-Xpx sm:pt-Ypx lg:pt-Zpx` shapes.
> - **Footer CTA-card geometry is owned by `Footer.tsx`**. Per-page CTAs paint inside the slot via the `cta` prop.
> - **Font weights**: 400 body / 500 button/nav/meta / 600 sub-head + card title + hero / 700 article body H1-H3. No `font-weight: 800`.

**The Figma artboard is 1920 px — that is the WRONG primary width.** The dev site targets 1440 as the primary viewport. When porting from Figma, scale interior dimensions (cards, illustrations, gaps, section padding) by ~0.75× where appropriate; keep absolute sizes (body text, buttons, form inputs, icons in text) at industry standards regardless of Figma. See RESPONSIVE-SYSTEM-AUDIT.md §17 decision 6 for the design-team handoff.

### Component structure

- One section per file: `src/components/sections/[page]/SectionName.tsx`
- Page entry point: `src/app/[page]/page.tsx`
- All nav links live in **one place only**: `src/lib/nav-config.ts`. Changing a page slug means changing it there — both desktop and mobile nav pick it up automatically.
- Do not restructure `src/components/` or delete `figma.config.json` without understanding the Figma Code Connect mapping.

### Figma-to-code rules

Every section is built directly from Figma design context. These rules are non-negotiable:

**Values must be exact — never approximated** (decorative gradients, shadows, radii):
- Copy gradient strings verbatim including angle, all stops, and opacities.
- Letter-spacing in `em` exactly as Figma reports — except when consuming the role tokens (which already encode the correct tracking).
- Border-radius in exact `px` — `40px` is not `rounded-2xl` (which is `16px`).
- Shadow strings copied in full including all layers.
- Use `style={{}}` inline for any value that cannot be expressed as an exact Tailwind class.

**Font sizes — use the token, not inline clamp:** Consume `--text-hero-{marketing|product|utility}`, `--text-display-{sm|md|lg}`, `--text-card-title-{sm|md|lg|xl}`, `--text-body-{xs|sm|md|lg|xl}`, or `--prose-*`. Inline `text-[clamp(...)]` for a new H1/H2 is forbidden — it bypasses the role system and produces the per-page H1-size drift the audit fixed.

**Section wrapper pattern (new code MUST use this):**
```tsx
import { Section, Container } from "@/components/layout";

<Section padding="md" className="relative overflow-hidden ...">
  {/* decorative elements — absolute positioned, parent of <Section> */}
  <Container>
    {/* content */}
  </Container>
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

- **Always lock Claude Preview to desktop viewport (1440×900) when running `preview_start` / `preview_resize`** — never verify `apps/web` at mobile or tablet widths unless explicitly asked.

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
- **Never commit `.env*`, secrets, R2 keys, HubSpot tokens, Webflow tokens, or 2FA seeds.** They live in the operator's secrets store (1Password / Bitwarden / macOS Keychain — whichever the team uses), GitHub Actions repository secrets, and `/opt/cleanstart/.env` on the production droplet (chmod 600).
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

Seven Payload cron tasks run in `apps/cms/src/payload/jobs/`. All are gated by `PAYLOAD_AUTO_RUN=true` — set this in `.env` to enable; omitting it (e.g. in test runs) prevents spurious fires.

| Job | Schedule (UTC) | File |
|-----|----------------|------|
| Lead queue drain | every 5 min | `drain-lead-queue.ts` |
| Webhook retry | every 5 min | `retry-webhook.ts` |
| Search-log purge (90-day retention) | daily 03:00 | `purge-search-log.ts` |
| Leads PII redaction (365-day retention) | daily 03:15 | `purge-leads-pii.ts` |
| Career-applications purge (resume delete + PII redaction, 365-day) | daily 03:45 | `purge-career-applications.ts` |
| Broken-links scan | daily 04:30 | `check-broken-links.ts` |
| Meilisearch reindex (drift check + self-heal) | daily 05:00 | `reindex-meili.ts` |

Never change a job schedule without updating this table. Every new job needs a test file and must respect the `PAYLOAD_AUTO_RUN` gate.

---

## Live integrations

These channels are wired and active (env-var configured). See `apps/cms/.env.example` for the full annotated list.

| Integration | Purpose | Key env vars |
|---|---|---|
| Cloudflare R2 | Media storage + lead fallback queue | `R2_BUCKET`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_BASE` |
| HubSpot | Lead relay (secondary handler) → Forms Submissions API; owns all lead email (follow-up + notifications). Forms keyed by `forms.hubspotFormGuid`. See `docs/integrations/forms-hubspot-verification.md`. | `HUBSPOT_PORTAL_ID` (relay), `HUBSPOT_PRIVATE_APP_TOKEN` (GDPR erasure only) |
| Microsoft Teams (Workflows) | Publish + lead notifications via Adaptive Cards | `WEBHOOK_TEAMS_URL`, `WEBHOOK_TEAMS_EVENTS` |
| Standard Webhooks | Generic HMAC-signed outbound webhook | `WEBHOOK_GENERIC_URL`, `WEBHOOK_GENERIC_EVENTS`, `WEBHOOK_GENERIC_SIGNING_SECRET` |
| Meilisearch | Full-text search + analytics | `MEILISEARCH_URL`, `MEILISEARCH_MASTER_KEY`, `MEILISEARCH_API_KEY` |
| Cloudflare Turnstile | Bot protection on `/api/leads/submit` | `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| Sentry | Error tracking + PII redaction | `SENTRY_DSN` (+ auth token, org, project) |
| IndexNow | Bing/Yandex ping on publish (7 collections) | `INDEXNOW_KEY` |
| Brevo | Careers/partner transactional email — HR notification (with resume attachment) on each job application, plus the partner-form pair (applicant confirmation + internal team notification) on each partner inquiry. Distinct from HubSpot, which owns lead-pipeline email and never receives careers/partner data. | `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `CAREERS_HR_EMAIL`, `PARTNER_USER_TEMPLATE_ID`, `PARTNER_ADMIN_TEMPLATE_ID`, `PARTNERS_NOTIFY_EMAIL` |

**Phase J2 planned:** Zoho CRM (OAuth 2.0 — primary CRM, build first), GA4 Measurement Protocol, Google Search Console. See `docs/integrations/INTEGRATIONS-RESEARCH-V2.md` for the full J1/J2/J3 milestone breakdown.

The `Integrations` collection (Phase J1) provides editor self-serve config for channels that don't require env-var changes (Teams channels, generic webhooks). The env-var channels above remain env-var-only until a J2 row migrates them.

---

## Test conventions

- **Unit:** Vitest, co-located as `*.test.ts` next to the file under test.
- **E2E:** Playwright, in `apps/cms/tests/e2e/`. Each spec tagged with the phase it covers (`@phase-d-preview`, `@phase-e-leads`, etc.) so CI can run a phase's gate suite.
- **Fixtures:** ETL fixtures (10 docs per collection) live in `migrations/webflow-export/fixtures/` per arch doc Phase 1. Don't seed dev DB from prod data.
- **Schema-validation tests:** every collection has at least one test asserting `payload generate:types` output matches a snapshot of the public type surface.

---

## Deploy rules

- `apps/cms` deploys via **GitHub Actions** (`.github/workflows/deploy-cms.yml`) on push to `main` (production). The workflow builds the Docker image, ships it to the droplet over SSH, and runs `docker compose up -d --wait`. Caddy on the droplet handles TLS termination. There is a **single CMS droplet** (`cleanstart-cms`, served at `cms.cleanstart.com`) — it is the staging server today and will become production later. There is no separate staging machine.
- `apps/web` has no production deployment yet.
- Postgres lives on the same droplet, localhost-bound. Migrations run via Payload's migration runner, never raw SQL.
- Cloudflare WAF sits in front of `cms.cleanstart.com`. Admin access is password-only at v1 — 2FA enrollment is deferred to a later hardening phase (see `docs/BACKLOG.md` A9, and the TOTP backend reserved in `apps/cms/src/payload/admin/components/auth/`). Once the TOTP backend lands, 2FA becomes mandatory for every admin user.
- Staging is a separate droplet (or DB) per arch doc §`#staging`. Never point staging at prod data.
- Backup-cron heartbeat is monitored as a P1 alert (arch doc §`#logging-alerting`). If a backup script is changed, verify the heartbeat fires.

---

## Production rollout checklist (run once when going live)

These are one-shot operations that **must** run against the prod Postgres on the droplet before / right after the first production deploy. They are not part of the normal CI deploy. Each item should be checked off in the deploy PR description.

1. **Lexical list-normalisation backfill.** `apps/cms/scripts/normalize-lexical-lists.ts` merges adjacent same-shape `list` nodes inside every Lexical body field. The `normalizeLexicalHook` only fixes docs on save — existing prod content needs this one-shot pass.
   - **Always run with `--bypass-hooks` in production.** Without it, `payload.update()` re-fires every `afterChange` hook on each updated row: Teams notifications spam the editor channel, IndexNow falsely pings Bing/Yandex, Meilisearch reindexes for nothing, `updatedAt` churn pollutes the sitemap `lastmod` and editor sort order, and a version row is created per doc.
   - Recommended sequence on the droplet (from inside the `cms` container, with `/opt/cleanstart/.env` mounted):
     ```bash
     # 1. Dry-run to see the blast radius (no writes):
     node --env-file=.env --no-warnings --experimental-strip-types \
       scripts/normalize-lexical-lists.ts --dry-run

     # 2. Real run, hooks bypassed (no Teams / IndexNow / search-sync side effects):
     node --env-file=.env --no-warnings --experimental-strip-types \
       scripts/normalize-lexical-lists.ts --bypass-hooks
     ```
   - Re-runnable. Already-clean docs are skipped via `needsListMerge`.
   - After the run, spot-check one blog and one guide on the live site — bullet lists should render as a single `<ul>`, not one `<ul>` per bullet.

2. **Job `experienceRange` backfill.** The Webflow→Payload import bucketed the free-text `experience` year range into the `experienceLevel` enum and dropped the original string, so the careers site showed "Mid experience" instead of "3-10 Years". `apps/cms/scripts/backfill-job-experience-range.ts` restores `jobs.experienceRange` from `migrations/webflow-export/raw/jobs.jsonl` (matched by slug). The import transform now preserves it going forward; this one-shot covers jobs already in prod.
   - From inside the `cms` container: `pnpm exec tsx --env-file=.env scripts/backfill-job-experience-range.ts`
   - Re-runnable / idempotent (skips rows whose range already matches). Note: `payload.update` re-fires the jobs afterChange hooks (search sync, IndexNow, webhooks) and creates a version row per job — run in a quiet window.
   - After the run, spot-check the careers list on the live site — experience should read e.g. "3-10 Years", not "Mid experience".

3. **Job `department` backfill.** The Webflow import read department from a non-existent `department` field — the value actually lives in `job-summary` ("Sales", "Engineering", "Human Resource", …) — so every prod job has a null department: no department pill on the careers card and an empty POSITION filter. `apps/cms/scripts/backfill-job-department.ts` restores `jobs.department` (mapped to the enum via `normalizeDepartment`, matched by slug). The import transform now reads the right field going forward.
   - From inside the `cms` container: `pnpm exec tsx --env-file=.env scripts/backfill-job-department.ts`
   - Re-runnable / idempotent. Same afterChange-hook / version-row caveat as above — run in a quiet window. Watch the log for "unmapped" warnings (a new Webflow department value that needs a `DEPARTMENT_MAP` entry).
   - After the run, spot-check the careers list — each job should show its department pill and the POSITION filter should list the departments.

4. **Job `hiringStatus` (open/closed) backfill.** Webflow has no open/closed field — a role's status is its draft state (`_meta.isDraft`/`isArchived`: draft = closed, live = open). The local/prod jobs were populated without that, so every job is `open`. `apps/cms/scripts/backfill-job-hiring-status.ts` restores it from the export by slug, **keeping every job published** (closed roles stay visible under the careers "Closed roles" filter — the decision was to show them, not hide them). Does not touch `_status`. The import transform already publishes jobs with the correct `hiringStatus` going forward.
   - From inside the `cms` container: `pnpm exec tsx --env-file=.env scripts/backfill-job-hiring-status.ts`
   - Re-runnable / idempotent. Closing a role stamps `closedAt = now` (the real Webflow close date isn't in the export). Same afterChange-hook / version-row caveat — run in a quiet window.
   - After the run, spot-check the careers list — the STATUS filter (Open / Closed / All roles) should partition correctly, with OPEN/CLOSED badges per card.

5. **Guide inline-FAQ strip.** The Webflow import stored guide FAQs twice — in the structured `faqs` field AND inline in the body rich-text (an "FAQs" heading + Q&A) — so the detail page rendered them as both an accordion and a stray heading/list, and the auto `tableOfContents` / word count included the FAQ text. `apps/cms/scripts/strip-guide-inline-faqs.ts` removes the inline copy from `body` and recomputes `tableOfContents`/`readingMinutes`/`wordCount`. The import transform (`migrations/webflow-import/transform/guides.ts`) now strips it going forward; this one-shot covers guides already in prod. Strip logic + tests: `apps/cms/src/payload/lib/webflow-import/strip-faqs.ts`.
   - Writes via `payload.update` (not the raw db adapter) so the relational `tableOfContents` sub-table is handled and `bodyStatsHook` recomputes the derived fields. The Teams (`webhooks-publish`) and IndexNow hooks are **transition-gated** — a re-save of an already-published guide does not fire them — so the only afterChange effects are a Meilisearch re-sync (desired) and a version row per guide. **Run in a quiet window**, same caveat as tasks 2–4.
   - From inside the `cms` container: `pnpm exec tsx --env-file=.env scripts/strip-guide-inline-faqs.ts --dry-run` then `… ` (no flag).
   - Re-runnable / idempotent. Only strips guides whose structured `faqs` field is populated (so the Q&A are never lost) and that still have an inline FAQ heading; also recomputes the TOC for any guide whose stored `tableOfContents` is empty while its body has headings (self-heals a half-applied run). Local-dev blast radius: 52 scanned, 47 stripped, 3 skipped(no-faqs), 2 skipped(clean).
   - After the run, spot-check a guide — FAQs should appear once (the accordion only), and "FAQs" should be gone from the CONTENTS sidebar.

6. **Legal documents seed.** The `legalDocuments` collection (the public `/legal/*` pages — Third-Party Terms, DPA, Limited Use Agreement, Policies & Commitments, Pre-GA Terms, Trademark Usage Policy, Vulnerability Disclosure Policies, Acceptable Use Policy) is populated from `apps/cms/scripts/data/legal-seed.ts` (the 8 launch documents) via `apps/cms/scripts/seed-legal.ts`, which converts each HTML body to Lexical with `htmlToLexical`. The collection's tables are created by the `20260605_094837_add_legal_documents` migration (runs via CI on deploy to `main`), so run the seed **after** the migration on first go-live. Distinct from the GDPR `Legal` *global* (`globals/legal.ts`, slug `legal`, `policyVersion`) — different thing, leave it alone.
   - **Skip-safe by default:** a document whose `slug` already exists is skipped, so a re-run never overwrites content editors have since customized in the admin. Pass `--force` to overwrite existing docs with the seed content (intentional refresh only); `--dry-run` to preview the plan without writing.
   - First run publishes 8 docs → IndexNow pings the 8 `/legal/<slug>` URLs and Meilisearch indexes them (both desired); the Teams publish webhook (`webhooks-publish`) fires once per doc (8 notifications) and a version row is created per doc. **Run in a quiet window.**
   - From inside the `cms` container: `pnpm exec tsx --env-file=.env scripts/seed-legal.ts --dry-run` then `pnpm exec tsx --env-file=.env scripts/seed-legal.ts` (no flag).
   - After the run, spot-check the live site: `/legal` redirects to `/legal/additional-third-party-terms`, the left sidebar lists all 8 documents (each with its icon), every document renders its body and an "Effective" date, and switching documents is inline (no full page reload). Going forward, editors manage this content in the CMS admin (Content → Legal Documents) — the seed is initial population only.

7. **Guide inline-CTA card backfill.** The Webflow import flattened inline CTA boxes (`<div class="artcileCtaBox"><h3>prompt <a>label</a></h3></div>`) to plain headings, so the web detail page rendered them as stray headings instead of cards. The new `inlineCta` Lexical block (registered in `editor-config.ts`, inserted via the slash menu, rendered by `apps/web/.../article/InlineCtaCard.tsx`) restores them. `apps/cms/scripts/migrate-guide-cta-cards.ts` converts the existing flattened CTAs in prod guide bodies into `inlineCta` blocks. Detection + conversion logic and tests: `apps/cms/src/payload/lib/webflow-import/cta-cards.ts`. The import transform (`html-to-lexical.ts`) now emits the block for `.artcileCtaBox` going forward; this one-shot covers guides already in prod. (Local-dev blast radius: 52 scanned, 45 cards converted across 27 guides, 18 deferred, 1 skipped.)
   - **Default converts only clean "prompt? + button" CTAs** (the link is the trailing element). CTAs whose link sits mid-sentence are deferred and logged for manual handling — pass `--include-mid-sentence` to convert those too (reworded heading text; give each a glance in the admin afterwards). Link-only headings (no prompt) are skipped.
   - Writes via `payload.update` so the richText block validation runs and `bodyStatsHook` recomputes TOC/word count (converted headings correctly drop out of the table-of-contents — a CTA card is not a section). The Teams (`webhooks-publish`) and IndexNow hooks are transition-gated, so a re-save of an already-published guide does NOT fire them; the only afterChange effects are a Meilisearch re-sync and a version row per guide. **Run in a quiet window**, same as tasks 1–6.
   - Re-runnable / idempotent (a converted block is no longer a heading, so a second pass is a no-op).
   - From inside the `cms` container: `pnpm exec tsx --env-file=.env scripts/migrate-guide-cta-cards.ts --dry-run` then `pnpm exec tsx --env-file=.env scripts/migrate-guide-cta-cards.ts` (no flag).
   - After the run, spot-check a guide (e.g. `/guide/nist-800-53-kubernetes-control-mapping`) — the inline CTA should render as a tinted card with a button, and its prompt should no longer appear in the CONTENTS sidebar.

8. **Event `country` backfill.** The new `country` select field on the `events` collection powers the country filter on the `/events` listing page, but events imported from Webflow only have a free-text `venue` — so existing rows have a null `country`. `apps/cms/scripts/backfill-event-country.ts` maps each event's `venue` to a country enum value (`india` / `united-states` / `uae` / `thailand`) via a substring table and sets `country`. The column is created by the `20260608_121245_add_event_country` migration (runs via CI on deploy to `main`), so run this **after** the migration on go-live.
   - Idempotent / re-runnable (only writes when the mapped country differs from what's stored). `--dry-run` previews. Venues that match no rule are logged, never guessed — add a `COUNTRY_RULES` entry + an Events collection enum option if a new country appears.
   - Writes via `payload.update`, which re-fires the events afterChange hooks. The Teams (`webhooks-publish`) and IndexNow hooks are publish-transition-gated, so a re-save of an already-published event does NOT fire them; the only afterChange effects are a Meilisearch re-sync and a version row per event. **Run in a quiet window.**
   - From inside the `cms` container: `pnpm exec tsx --env-file=.env scripts/backfill-event-country.ts --dry-run` then `pnpm exec tsx --env-file=.env scripts/backfill-event-country.ts` (no flag). Local-dev blast radius: 21 scanned, 21 updated, 0 unmapped.
   - After the run, spot-check `/events` — the COUNTRY filter should partition the past-events grid (e.g. `?country=united-states` shows only the US events).

9. **News `region` placeholder backfill.** The new `region` select on the `news` collection powers the region filter on the `/news` listing page. News has no `location`/region data to derive from, so `apps/cms/scripts/backfill-news-region.ts` assigns **PLACEHOLDER** regions round-robin across the enum (`asia-pacific`/`europe-middle-east`/`usa-north-america`) so the filter is functional. The column is created by the `20260608_140513_add_news_region` migration (runs via CI on deploy to `main`); run this after the migration.
   - ⚠ **Placeholder data — not accurate.** Replace per-item in the CMS admin once real regions are known. The script only fills rows whose `region` is null, so it never clobbers a real value set later (re-run-safe).
   - Same afterChange-hook caveat as tasks 1–8 (Teams/IndexNow are publish-transition-gated and won't fire on re-save of a published item; Meilisearch re-syncs + a version row per item). **Run in a quiet window.**
   - From inside the `cms` container: `pnpm exec tsx --env-file=.env scripts/backfill-news-region.ts --dry-run` then `pnpm exec tsx --env-file=.env scripts/backfill-news-region.ts` (no flag). Local-dev blast radius: 33 scanned, 33 filled (placeholder).
   - After the run, spot-check `/news` — the REGION filter should partition the grid (e.g. `?region=emea`).

10. **Knowledge Hub seed (Academy import).** Populates the `knowledgeBase` + `knowledgeCategories` collections from the committed manifest `apps/cms/scripts/data/academy-kb.json` (245 Academy articles) plus the 8 legacy articles. `apps/cms/scripts/seed-knowledge-base.ts` creates **50 categories** (4 legacy groups pinned via `displayOrder` 0–3; 8 de-numbered sections 10–80; 38 subcategories) and **253 published articles**, converting each HTML body to Lexical (tables → table nodes, code → `codeBlock` blocks). The `display_order` column is created by the `20260608_144837_add_kb_category_display_order` migration (runs via CI on deploy to `main`); run the seed **after** the migration. The web `/knowledge-hub` reads from these collections.
   - **Skip-safe by default** (a doc whose `slug` already exists is skipped, so editor edits are never clobbered); `--force` overwrites; `--dry-run` previews. Re-runnable / idempotent.
   - Publishing 253 docs fires the search-sync / Teams (`webhooks-publish`) / IndexNow afterChange hooks **per doc** (these are first-publish, so they DO fire — not transition-gated re-saves). Expect a Meilisearch index of all 253 (desired), an IndexNow ping per `/knowledge-hub/<slug>` URL, and a Teams publish notification per doc, plus a version row per doc. **Run in a quiet window** (consider temporarily unsetting `WEBHOOK_TEAMS_URL` to avoid 253 channel notifications).
   - From inside the `cms` container: `pnpm exec tsx --env-file=.env scripts/seed-knowledge-base.ts --dry-run` then `pnpm exec tsx --env-file=.env scripts/seed-knowledge-base.ts` (no flag). Local-dev blast radius: 50 categories + 253 articles, 2 slug collisions auto-prefixed (`secure-vendor-risk-assessment`, `secure-vex-documents`).
   - After the run, spot-check `/knowledge-hub` — the sidebar should show the 4 legacy groups on top, then the 8 sections (Understand…Reference) each expanding to subcategories → articles; an article with tables/code (e.g. `/knowledge-hub/dev-vs-prod-images`) should render styled tables and monospace code blocks.
   - **Lesson videos:** after the seed (and the `20260608_153417_add_kb_video_url` migration), run `pnpm exec tsx --env-file=.env scripts/backfill-knowledge-video.ts` to set `videoUrl` on the 24 Understand articles that have a lesson MP4 (the seed sets it on a fresh import; the backfill covers rows seeded before the field existed). Videos are hotlinked from the public bucket `storage.googleapis.com/cleanstart-academy-videos/<path>.mp4` (allow-listed in web CSP `media-src`). `scripts/data/kb-videos.ts` is the authoritative listing — if the Academy publishes more videos (sections 02–08 currently have none), re-list the bucket and extend it. Spot-check `/knowledge-hub/images-and-containers` — a "Watch the Lesson" player should appear above the body.

11. **Webflow media filename cleanup (DONE — executed 2026-06-09).** Every Webflow-imported media doc carried Webflow's leading 24-char asset ObjectID in its filename (`6a102c0f3f256301e63ecc97-whatsapp-20image-…-<hash>.webp`, all in `web/general/`), with the id also leaked into the auto-alt and `%20` spaces mangled to `-20`. **205 of 212** media were renamed to **document-derived** names `<doc-slug>[-<role>]-<hash>.<ext>` (role suffix only when a doc owns >1 image; e.g. case-study `…-cover/-logo/-asset`), with alts reset to the document title (human-written alts preserved). The **44 orphans** (referenced by no doc) fell back to the decoded original Webflow name; the 7 already-clean files were untouched.
   - **Reference-safe — verified.** A prod scan confirmed ZERO `cdn.cleanstart.com` URLs are baked into any document column; all image references are by media-id and resolve the current `url` at read time. So only the `media` rows needed touching — no per-document edits. (18 legacy `website-files.com` links in `about_galleries.image_link` + 1 KB row are dead Webflow source links, unrelated — separate optional cleanup.)
   - **Mechanism:** two scripts. `apps/cms/scripts/build-media-rename-plan.ts` (LOCAL) joins the media inventory + `migrations/webflow-export/.asset-progress.json` (original URLs, joined by leading id) → `scripts/data/media-rename-plan.json` (`{id, from, to, alt}`). `apps/cms/scripts/rename-media-objects.ts` (PROD) executes it with **`pg` + `@aws-sdk/client-s3` only — no Payload**, which is required because the Media `rejectFilenameRename` beforeChange hook throws on any filename change without a re-upload. Per item: R2 copy main+`sizes_*` (HEAD-verified) → one guarded `UPDATE media SET filename/url/thumbnail_u_r_l/sizes_*/alt WHERE id AND filename=from` → delete old keys. Idempotent, `--dry-run` default (needs `--execute`), `--limit N`, per-item rollback. Naming/alt logic + tests: `lib/webflow-import/clean-media-name.ts`.
   - **Run mechanism:** `scp` both files to the droplet → `docker cp` into `cleanstart-cms-1:/app/apps/cms/scripts/` → `docker exec -w /app/apps/cms cleanstart-cms-1 node --no-warnings --experimental-strip-types scripts/rename-media-objects.ts [--execute] [--limit N]` (env is already in the container; the executor only imports bare packages so plain `node --strip-types` resolves it — no `tsx` needed).
   - The import transform already emits clean names going forward (`buildMediaFilename` strips the id via `stripVendorAssetIdPrefix`; `upload-assets.ts` drops the collection prefix). **Caveat:** old R2 keys were deleted, so any externally-cached/indexed old URL 404s (acceptable pre-launch); a Meilisearch reindex refreshes any doc-thumbnail URLs cached in the search index.
   - To re-verify: `SELECT count(*) FROM media WHERE filename ~ '^[0-9a-f]{24}[-_]'` should be **0**.

12. **Meilisearch index backfill (after the doc-id fix deploys).** Meilisearch indexing had **never worked** in prod: `buildSearchDocumentId` joined `<collection>:<id>` with a colon, which Meili rejects (`Document identifier … is invalid`), so every `documentAdditionOrUpdate` task failed and the `content` index stayed empty (0 docs, `primaryKey: null`; 0 add-tasks ever succeeded). Fixed by switching the separator to `_` (`<collection>_<id>`) in `lib/search/index-schema.ts` (`buildSearchDocumentId` + the inline id in `buildSearchDocument`). The live `afterChange` sync uses the **built** app, so this only takes effect after a deploy to `main`.
   - **After the fix deploys:** populate the index with the one-shot `apps/cms/scripts/reindex-search.ts` (forces a FULL reindex regardless of the count-drift gate the daily `meiliReindex` job uses). From inside the `cms` container: `docker cp` it in, then `docker exec -w /app/apps/cms cleanstart-cms-1 pnpm dlx tsx scripts/reindex-search.ts` (`tsx` needed because it boots Payload; env is already in the container).
   - Verify with Node `fetch` (the container has no `curl`): `…/indexes/content/stats` `numberOfDocuments` should be ~508 and `…/tasks?statuses=failed` should stop growing. Local-dev/prod blast radius at time of fix: index was empty; nothing to migrate.

13. **Draft-content lockdown — provision the `preview-bot` API-key user.** The content collections' public REST read was tightened from `read: () => true` to `publishedOrAuthenticated` (anonymous → published only; authenticated → drafts too), closing a content-leak where anyone could fetch unpublished docs via `?draft=true`. The web draft-preview path authenticates as a dedicated API-key user — but that user does not exist yet, so this **must be provisioned or editor draft-preview shows the published version instead of the draft** (fail-safe: no crash, no leak). The `20260610_085422_add_users_api_key` migration (enables Payload API keys on `users`) runs via CI on deploy to `main`; do this **after** it applies.
   - In `/admin/collections/users`: create `preview-bot@cleanstart.com` with **no roles** (read-only by construction — `publishedOrAuthenticated` grants draft read to any authenticated user, while create/update/delete stay gated by `isAdminOrEditor`). Enable its **API Key** and copy the value.
   - Set `CMS_API_KEY=<that key>` in the **web** env (`/opt/cleanstart/.env` on the droplet for prod; Vercel env for staging). `CMS_API_KEY_COLLECTION=users` is the default. The web app already sends `Authorization: users API-Key <CMS_API_KEY>` on every draft-mode fetch.
   - Verify: open an editor preview link → the page renders the **draft** (not the published) version; then, unauthenticated, confirm `curl '<cms>/api/blogs?draft=true&where[_status][equals]=draft'` returns **zero** draft docs.
   - Re-runnable: rotating the key = regenerate it on the user and update `CMS_API_KEY`. No data migration; the only schema change is the three `users` API-key columns from the migration above.

14. **Legacy Webflow 301 redirects — seed before DNS cutover (DONE — executed 2026-06-11).** Seeded into the prod CMS `Redirects` collection (26 rows created; re-run idempotent/skipped 26) and verified live on staging: `curl -I https://staging.cleanstart.com/jobs` → `301 → /careers`, `/about → /about-us`, `/resources → /resource-center`, etc. Mechanism: `docker cp` the lib + script into `cleanstart-cms-1`, `docker exec -w /app/apps/cms … pnpm exec tsx scripts/seed-redirects.ts` (temp files removed after; the committed versions ship on the next `main` deploy). The droplet's DB is the same one that becomes production, so these persist through cutover. Re-run only if the DB is rebuilt before launch. — *Original context:* the old Webflow site at `cleanstart.com` is live now with 26 accumulated 301 redirects; the new site's `Redirects` collection (consumed by `apps/web/src/proxy.ts`) started empty, so without this every inbound link / bookmark to an old URL would 404 — permanent link-equity loss. Data + invariant guard: `apps/cms/src/payload/lib/webflow-import/redirects-seed.ts` (typed, unit-tested); seeder: `apps/cms/scripts/seed-redirects.ts`.
   - 18 targets point at a live static route, 3 at `https://www.cleanstart.com` (verbatim); 4 whose Webflow target no longer exists are **remapped** to the nearest live page (`/cleansight-campaign`→`/cleansight`; `/cleanstart-hitachi`,`/cleanstart-survey`→`/community`; `/new-year-event`→`/events`) — the `notes` field records the original target; review in admin (Content → SEO → Redirects) and adjust if a better destination exists.
   - 1 row targets a CMS blog slug `/blogs/busybox-container-security-risk` — **confirm that blog is published**, else the 301 lands on a 404.
   - From inside the `cms` container: `pnpm exec tsx --env-file=.env scripts/seed-redirects.ts --dry-run` then `… ` (no flag). Each row is `source: 'migration-seed'`. Idempotent / skip-safe (re-run skips existing `from`s; `--force` overwrites). Writes fire **no** publish/IndexNow/search hooks (the collection has none), so safe any time. Verified locally: 26 created, re-run skips all 26.
   - After the run, spot-check: `curl -I https://www.cleanstart.com/jobs` → `301`/`308` to `/careers`; the legacy URLs resolve instead of 404.

15. **SEO keywords consolidation + reindex.** The new shared `seo.keywords` field (string[] json on every content collection's `seo` group) supersedes the guides-only `keywords[]`. The `20260611_061406_add_seo_keywords` migration (in `src/migrations/`) adds the column (runs via CI on deploy to `main`); run the backfill **after** it applies.
    - **Backfill (guides only):** from inside the `cms` container, `pnpm exec tsx --env-file=.env scripts/backfill-seo-keywords-from-guides.ts --dry-run` then `pnpm exec tsx --env-file=.env scripts/backfill-seo-keywords-from-guides.ts` (no flag). Idempotent / re-runnable; copies each guide's legacy `keywords[]` into `seo.keywords`. Same afterChange caveat as tasks 1–13 (Teams/IndexNow are publish-transition-gated and won't fire on re-save of a published guide; Meilisearch re-syncs + a version row per guide). Run in a quiet window.
    - **Reindex (settings + facet):** the `content` index gains `keywords` as a searchable + filterable attribute. After deploy, push settings + reindex with the same `scripts/reindex-search.ts` used in checklist item 12. Verify the index's `filterableAttributes` includes `keywords`.
    - After the run, spot-check: a guide's `seo.keywords` chips (SEO sidebar → Topic keywords) match its old keyword list; a `?q=<a-keyword>` ⌘K search surfaces docs that only carry the term in keywords; a guide page's JSON-LD shows both `keywords` and `mentions[]`.

16. **Leaked `<style>` CSS strip.** One Webflow-imported blog (`what-if-mythos-claims-to-be-true`) had an embedded `<style>` block whose CSS rules (`.what-is-mythos-box { … }`) leaked into the Lexical `body` as a visible paragraph, because the old HTML→Lexical converter harvested `<style>` text as prose. The converter now drops `<style>`/`<script>`/etc. (`html-to-lexical.ts` `DROP_TAGS`) going forward; this one-shot strips the already-imported leak. Detector + strip logic and tests: `apps/cms/src/payload/lib/webflow-import/strip-style-css.ts`. Conservative — only a paragraph that *is* a stylesheet is removed (prose mentioning CSS and `codeBlock` samples are untouched). Local-dev blast radius: 1 blog (the only doc with a `<style>` block; guides/news/resources/KB scanned clean).
    - Writes via `payload.update` so `bodyStatsHook` recomputes TOC/word count. Teams (`webhooks-publish`) + IndexNow are publish-transition-gated (no fire on re-save of a published doc); the only afterChange effects are a Meilisearch re-sync, a web revalidate (desired — drops the CSS from the live page), and a version row per doc. **Run in a quiet window.**
    - Idempotent / re-runnable (a clean doc is skipped). From inside the `cms` container: `pnpm exec tsx --env-file=.env scripts/strip-leaked-style-css.ts --dry-run` then `pnpm exec tsx --env-file=.env scripts/strip-leaked-style-css.ts` (no flag).
    - After the run, spot-check `/blogs/what-if-mythos-claims-to-be-true` — the `.what-is-mythos-box { … }` CSS text under "What is Mythos?" should be gone.

17. **Inline body-image backfill (17 blogs / 38 images).** The old HTML→Lexical converter dropped `<img>` tags, so 17 Webflow-imported blogs lost their inline body images (present in Webflow, missing on our pages). The converter now emits `upload` nodes when given an image resolver (`html-to-lexical.ts` `ImageResolver`). `apps/cms/scripts/backfill-blog-body-images.ts` uploads each image (pulled from the still-live Webflow CDN) to the Media library and regenerates the affected blog bodies through the fixed converter so images land at their original positions. The 17 blogs' original HTML is committed in `scripts/data/blog-body-images.json` (self-contained — the droplet doesn't need the raw export). Source images live only on the Webflow CDN; **run before the Webflow DNS cutover** while `cdn.prod.website-files.com` is still serving.
    - Safe for blogs because the blog import transform is exactly `htmlToLexical(main-text)` — regenerating reproduces the import output plus images, and also drops any leaked `<style>` block (so it supersedes task 16 for these 17 blogs). **Caveat:** a body hand-edited in the admin post-import would revert to the import output — review the `--dry-run` list first.
    - Writes via `payload.update` so `bodyStatsHook`/`normalizeLexicalHook` run. Teams/IndexNow are publish-transition-gated (no fire on re-save of a published blog); only effects are a Meilisearch re-sync, a web revalidate (desired — images appear), and a version row per blog. **Run in a quiet window.**
    - Idempotent: a blog whose body already has `upload` nodes is skipped; an image whose derived filename (`<slug>-body-<n>.<ext>`) already exists in Media is reused, not re-uploaded.
    - From inside the `cms` container (the container has internet egress for the CDN download): `pnpm exec tsx --env-file=.env scripts/backfill-blog-body-images.ts --dry-run` then `pnpm exec tsx --env-file=.env scripts/backfill-blog-body-images.ts` (no flag). Offline-validated: 17/17 blogs, 38/38 images placed as upload nodes.
    - After the run, spot-check `/blogs/sbom-101` — the SBOM coverage / anatomy / SPDX-vs-CycloneDX images should render inline in the body.

(Add new one-shot production tasks under this list as they come up — Phase H imports, Meilisearch initial index, etc.)

---

## When stuck

- **Schema question?** Read arch doc §`#new-fields` for that collection.
- **Block question?** Arch doc §`#blocks`.
- **Editor workflow question?** Arch doc §`#authoring`, §`#publishing-checklist`, §`#preview-workflow`.
- **Ops/security question?** Arch doc §`#security-headers`, §`#rate-limiting`, §`#privacy-gdpr`.
- **Migration question?** Arch doc §`#migration` (and the seven subsections under it).
- **Integration question?** Read `docs/integrations/INTEGRATIONS-RESEARCH.md` (Teams/webhook deep-dive, Standard Webhooks signing) and `docs/integrations/INTEGRATIONS-RESEARCH-V2.md` (analytics read-back, inbound webhooks, J1/J2/J3 milestones).
- **Background job question?** Arch doc §`#cron-jobs` + the job file and its co-located test.
- **Which apps/web page to build next, or what slug/category a page uses?** `docs/web/WEB-PAGES.md`.
- **`apps/web` production question?** (deploy strategy, security headers, CSP, SEO, sitemap, JSON-LD, AI bots, cookie consent, DNS, rollback) → **`docs/web/WEB-PRODUCTION.md`** (canonical for everything web-prod). The HTML arch doc remains canonical for CMS prod only.
- **Decision not in arch doc and not in this file?** Stop and ask. Don't invent.
