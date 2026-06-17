# Clean Libraries product page — design

**Date:** 2026-06-17
**Route:** `/clean-libraries`
**Figma:** `doWR9Xbwgkz6dqR9n4m3BB` node `1512:988`
**Scope:** `apps/web` only. Branch `development`.

## Goal

Add a new Products page for "Clean Libraries" — CleanStart's offering for discovering,
validating, and governing software dependencies (including AI-introduced libraries) across
the development lifecycle. Built 1:1 from the Figma frame, following the established
product-page pattern (`attack-surface-reduction` as the reference).

## Files

```
apps/web/src/app/clean-libraries/page.tsx                 entry point
apps/web/src/components/sections/clean-libraries/
  LibrariesHero.tsx        section 1 — hero
  LibrariesRisk.tsx        section 2 — risk cards
  LibrariesPipeline.tsx    section 3 — dark pipeline diagram
  LibrariesWorkflow.tsx    section 4 — workflow cards
  LibrariesCTA.tsx         section 5 — CTA card (painted into Footer slot)
apps/web/public/images/clean-libraries/                   Figma-extracted assets
```

## Sections

1. **LibrariesHero** — H1 "Your Codebase Now Has Dependencies You Never **Chose**" (last word
   accent), lead paragraph ("Continuously discover, validate, and govern software dependencies
   across your development lifecycle, including libraries introduced by AI coding assistants."),
   two CTAs (primary `Request a Demo` → `/book-a-demo`, secondary → `/contact-us`), 3D
   dependency-cube image on the right. Hero H1 token: `var(--text-hero-product)`.
2. **LibrariesRisk** — "Modern Dependency Risk Is **Expanding**" + 4 cards: AI-Introduced
   Dependencies, Vulnerable & Outdated Libraries, Transitive Dependency Growth, Limited
   Dependency Visibility. Container-query card interiors.
3. **LibrariesPipeline** — dark section "The Invisible Dependency **Pipeline**" + intro; central
   "Your Codebase" orb image; 4 labelled corner cards (Developer Added, Open Source packages,
   AI-Introduction Dependencies, Transitive Dependencies); "No review. No approval. No
   visibility." banner; 5 outcome icons row.
4. **LibrariesWorkflow** — "Built Into Your Existing **Workflow**" + 5 cards: Developers & AI
   Coding Tools, Clean Library, Validated Library Repository, CI/CD Gates, Production Artifacts.
5. **LibrariesCTA** — "Govern Every Dependency" card painted into the shared `Footer` slot via
   the `cta` prop, using the CTA↔Footer overlap geometry.

## Cross-file edits (only ones beyond the page's own tree)

- `apps/web/src/lib/nav-config.ts` — add `Clean Libraries` leaf to the Products mega group
  (3rd item, `description` + `icon`).
- `apps/web/src/components/sections/pricing/PricingTiers.tsx` — repoint the existing
  "Clean Libraries" tier `ctaHref` `/contact-us` → `/clean-libraries`, `ctaLabel` → "Learn More".
- `docs/web/WEB-PAGES.md` — add inventory row.

## Conventions

Typography role tokens only (no inline clamp); `Container`/`Section` primitives; exact Figma
gradients/radii/shadows via inline `style`; `next/image` + `sizes` for content images;
decorative SVGs as `<img>` with `aria-hidden`/`pointer-events-none`/`select-none`/`loading=lazy`;
real Figma asset extraction (no recreated SVGs); `FadeUp` on below-the-fold sections only;
breadcrumb JSON-LD + `buildPageMetadata({ eyebrow: "Products" })`.

## Verification

Claude Preview locked to 1440×900, screenshot each section vs Figma; then
`pnpm --filter @cleanstart/web lint · typecheck · build`.
