# BRAND-GUIDELINES.md — CleanStart

> **Source PDF:** [`Cleanstart - Brand Guidline.pdf`](../Cleanstart%20-%20Brand%20Guidline.pdf)
> (24 MB — open externally; do not embed in repo for build size).
> This file is the **engineering distillation** of the PDF, scoped to
> what `apps/web` needs at implementation time.
>
> If anything below contradicts the source PDF, **the PDF wins** for product
> direction; for code, **`tokens.json` wins** because the script extracts
> from the live Figma file.

---

## 0 · One aesthetic principle, executed with restraint

CleanStart's design tone is **clean, technical, atmospheric** — chosen
once, applied everywhere. Three corollaries:

1. **Don't dilute by hedging.** A "clean *and* playful" mark, "technical
   *and* casual" prose, "atmospheric *and* flat" UI — those compromises
   read as inconsistency, not range. Pick the principle and let it cost
   you something.
2. **Restraint is the move.** Atmospheric does not mean every panel
   glowing. The signature glassmorphism + ambient-blur language is a
   **rare** treatment, reserved for hero panels and brand-anchoring
   surfaces. Body content, cards, and chrome stay quiet by default.
3. **One coordinated reveal beats scattered micro-interactions.** When
   motion happens (hero load, page enter), it's a single staggered
   sequence — not five different springs on five different elements. The
   timings are documented in [`DESIGN-SYSTEM.md §6`](./DESIGN-SYSTEM.md#6--motion);
   stay in budget.

Applies to: visual design, motion, voice, micro-copy, marketing imagery.
Read every choice through this lens before shipping.

## 1 · Voice & tone

CleanStart sells **trust** to security buyers. The voice reflects that:

- **Authoritative, not preachy.** State facts plainly; don't moralise about
  "secure by default" — show it.
- **Technical, not jargon-laden.** "Hardened container images" not
  "next-generation security paradigm".
- **Empathetic to the on-call CISO.** Acknowledge the real cost of
  CVE fatigue, false-positive triage, and supply-chain anxiety.
- **Confident under pressure.** Never apologise for being security-first;
  never hedge on compliance claims.

### Tone matrix

| Audience | Page examples | Voice |
|---|---|---|
| CISO / decision-maker | `/for-ciso`, `/pricing`, `/partners` | Outcome-led, ROI-led, regulatory ("FIPS 140-3"); short paragraphs; numbers up front. |
| Security engineer | `/for-developers`, `/cleansight`, `/attack-surface-reduction` | Implementation-led; code blocks; specifics ("zero CVEs", "SBOM analyzer"); skip the marketing fluff. |
| Compliance / procurement | `/fips`, `/legal`, `/privacy-policy` | Rigorous, footnoted, no hedging. |
| Casual visitor / press | `/`, `/news`, `/about-us` | Story-led; concrete examples; one sentence per benefit. |
| Editorial | `/blogs/*`, `/news/*`, `/guide/*` | Author voice; technical depth; bylined. |

### What we don't say

- "Game-changing"
- "Revolutionary"
- "Best-in-class" (use *measurable* claims instead)
- "AI-powered" as ornament — only when the AI is the product
- "Easy" (security is not easy; saying so insults the reader)
- "We are committed to..." (action, not commitment)

### Microcopy rules

- **Buttons:** verb + object. "Get a demo", not "Request a demo here".
- **Empty states:** explain *why* it's empty, then give one action.
- **Error messages:** what failed, why, what to do. Never just "Something
  went wrong."
- **404:** acknowledge ("We can't find that page") + offer (search or
  homepage); never blame the user.
- **Form labels:** sentence case. "Work email" not "Work Email" or
  "WORK EMAIL".
- **Required marker:** ` *` (asterisk after label); never red-only.
- **Confirmation copy:** what happened + what to expect next ("Thanks —
  someone will reach out within one business day").

The full UX-copy practice lives in [`design:ux-copy`](https://skills.sh/)
skill — invoke before drafting any new high-impact copy.

---

## 2 · Logo

### Primary mark

`cleanstart-logo.svg` at the repo root is the canonical SVG. It is *also*
inlined as JSX in `apps/cms/src/payload/admin/` for the Payload admin
header. **Don't fork it.** The web app imports from the same file via a
build-time `import logo from '@/public/cleanstart-logo.svg'` (or copy
into `apps/web/public/`).

### Clear-space

Minimum clear-space on all sides = **the height of the lowercase "c"** in
the wordmark. At 32px logo height that's ~16px — never let other UI
intrude.

### Minimum size

- **Web:** 24 px height for the favicon, 32 px for the header lockup.
- **Print / share images:** 80 px height minimum.

### On dark / on light

The Figma file uses the white-on-dark variant inside the hero gradient,
and the dark-on-white variant in the header chrome. Both ship as one SVG
with a `currentColor` fill; the consumer sets text color.

### Don'ts

- Never recolor the brand mark to anything other than `currentColor` or
  the brand cyan/purple.
- Never stretch or skew.
- Never re-render at low resolution from a raster — always SVG.
- Never animate the mark in chrome (Header / Footer). Hero treatments
  may animate as part of editorial — clear with designer first.

---

## 3 · Color identity

The full palette + tokens are in [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md).
The brand-level summary:

- **Primary:** Cyan `#2cc1eb` — trust, technology, scan/diagnostic.
- **Secondary:** Green `#4cba88` — health, compliance, "no CVEs".
- **Accent:** Purple `#df9bff` / Violet `#7a59ff` — depth, premium, rare.
- **Foundations:** Pure white `#fff`, deep slate `#130f26` for outlines,
  `#111` text.

### Brand color rules

- **Cyan + purple gradient is signature.** Use sparingly and only on
  brand-anchoring surfaces (hero, primary CTA glow, Logo treatment).
  Not as a fill on body content.
- **Green is for compliance & health states**, not generic positive
  feedback. Use the system `--color-success: #2efd54` for "saved",
  "deployed", etc.
- **Purple is hero-only** in a marketing context. Don't decorate UI
  controls with purple.
- **Border-strong (`#130f26`) defines almost every card outline.** Don't
  swap for a soft grey — that's a different aesthetic and breaks system
  consistency.

---

## 4 · Typography

- **Primary:** Figtree (variable weights 400/500/600/700). Display sizes
  use **negative letter-spacing** (-3% to -5%) for confident editorial
  feel.
- **Display alt:** Rethink Sans 700 for one specific 62px treatment.
- **UI tertiary:** Inter 400/500 for very small labels (<14px) where
  Figtree's character spacing reads soft. Keep usage minimal.

See [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) §typography for the full
scale and engineering rules.

### Hierarchy in marketing

- **Hero headline:** `display-xl` (62px) or `display-2xl` (80px).
- **Section anchor:** `display-md` (40px) or `display-sm` (36px).
- **Subhead under hero:** `subhead` (24px) or `heading-md` (30px) light weight.
- **Body lead:** `body-default` (19px) or `body-md` (18px).
- **Body prose (blogs, guides):** `body-sm` (16px). This is the comfortable
  reading size for the long-form audience.
- **Eyebrows / labels:** `caption` (11–12px) with **positive** tracking
  (+0.022em). Often uppercase + brand-cyan colored.

---

## 5 · Imagery

### Photography

The brand PDF is the source of truth for art direction. Implementation
guidance:

- **Studio + technical:** photography uses neutral lighting with brand
  cyan/purple ambient gels. Avoid stock photography.
- **People:** real customers / engineers; avoid generic "office worker"
  stock.
- **Crop:** prefer 21:9 hero crops; 16:9 standard; 4:3 cards.
- **File:** AVIF + WebP via Next `<Image>` (R2 origin); JPG fallback.
  Max 1920×1080 unless decorative.

### Illustration

- **Style:** flat geometric with the brand gradients applied; subtle grain
  on backgrounds (NOISE effect detected on 2 nodes — confirm with designer
  whether this scales).
- **Decorative blobs:** the heavy ambient blurs in the Figma file
  (200–400px radii) are **decorative only** — never overlay live content
  with them.

### Logos (third-party / community)

- 2,000+ marks ship in `community-logos/` (Cloud Native Computing
  Foundation + adjacents). Used by `IntegrationLogos` and `LogoCloud` blocks.
- Always size at native aspect ratio.
- Customer / partner logos ship via the CMS `media` collection; designer
  to confirm allowed treatments (color vs grayscale vs single-color).

### Don'ts

- Don't recolor third-party brand logos.
- Don't stretch product screenshots; use `AspectFrame`.
- Don't apply drop shadows to photos — only to UI cards.

---

## 6 · Naming & casing

| Surface | Preferred form |
|---|---|
| Brand name (prose) | **CleanStart** (one word, capital C, capital S) |
| Brand mark (logo) | per SVG (lowercase wordmark with mark) |
| Domain | `cleanstart.com` |
| Product names | **CleanSight**, **CleanStart Images**, **CleanStart SBOM** |
| URL slugs | kebab-case: `/cleanstart-images`, `/software-bill-materials` |
| Buttons / labels | sentence case ("Get a demo") |
| Headlines | sentence case unless designer-marked title case |
| Code identifiers | TypeScript convention: PascalCase types, camelCase values |
| Acronyms in copy | All caps when standalone (FIPS, SBOM, CVE, NIST); avoid in headlines unless meaningful |

### Trademarks

- "Kubernetes", "Docker", "OpenShift" — first mention italicised or note
  trademark holder where required.
- "CleanStart™" mark — designer to confirm whether trademark superscript
  is required in body prose. Default: omit unless legal flags it.

---

## 7 · Accessibility ↔ brand

The brand and accessibility are aligned, not in tension:

- **High contrast** comes from brand: `#111` on `#fff` is the design
  default, well above WCAG AAA.
- **Focus state** uses `--shadow-focus` (cobalt blue ring) — high contrast
  on every brand surface.
- **Reduced motion** preserved by primitives.
- **Reduced transparency** falls back from glass to `surface-soft`.
- **Forced colors mode** (Windows high-contrast): explicit
  `forced-color-adjust: none` on brand-anchoring surfaces; `auto` on
  body controls so OS contrast wins.

Full audit checklist: [`ACCESSIBILITY.md`](./ACCESSIBILITY.md).

---

## 8 · Legal copy & disclosures

- **Footer:** © year, "CleanStart Inc."; legal links to `/legal`,
  `/privacy-policy`, `/terms-and-condition`, `/acceptable-use-policy`.
- **Cookie banner:** consent-mode v2 — see
  [`FRONTEND-INTEGRATIONS.md`](./FRONTEND-INTEGRATIONS.md) §consent.
- **GDPR:** all PII flows through CMS; CMS handles right-to-erasure
  cascade per arch doc `#privacy-gdpr`. The web app never persists PII
  client-side beyond a session cookie.
- **NIST / FIPS claims:** use the exact wording designer + legal sign off
  on; do not paraphrase. Stored in the CMS `legal` global where
  applicable.

---

## 9 · Working with this system as a designer-engineer pair

- **Designer ships in Figma.** No engineering work begins until the
  artboard is signed off (per-page tickets in BACKLOG-WEB.md).
- **Engineer runs `pnpm figma:extract`** after every design update.
  Tokens regenerate; the diff is the change set.
- **Designer-engineer sync** for any new component: identify the Figma
  source frame, the closest existing primitive, the proposed prop
  surface, and edge cases. Capture in COMPONENT-MAP.md before writing
  code.
- **Hand-edits to `tokens.css`** are a code review failure. Re-run the
  extractor.
- **Visual review at the end of each ticket** uses the figma-snapshot
  PNG + the live Storybook story side by side. Below the diff threshold
  → ship.

---

## 10 · References

- **PDF:** [`docs/Cleanstart - Brand Guidline.pdf`](../Cleanstart%20-%20Brand%20Guidline.pdf)
- **Figma file:** <https://www.figma.com/design/doWR9Xbwgkz6dqR9n4m3BB/CleanStart-V4>
- **Logo SVG:** [`cleanstart-logo.svg`](../../cleanstart-logo.svg)
- **Tokens:** [`tokens.json`](./tokens.json) · [`tokens.css`](./tokens.css)
- **Design system:** [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md)
- **Page snapshots:** [`figma-snapshots/`](./figma-snapshots/)
