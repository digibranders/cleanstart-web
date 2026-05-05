# COMPONENT-MAP.md — Payload blocks → React components

Strictest anti-hallucination doc. **Every block in
[`apps/cms/src/payload/blocks/`](../../apps/cms/src/payload/blocks/) and
every global in [`apps/cms/src/payload/globals/`](../../apps/cms/src/payload/globals/)
must have a row.** Missing rows fail the verification grep in
[`docs/web/`](./BACKLOG-WEB.md) §Verification.

> Props shapes come from `packages/types` (re-export of generated
> `apps/cms/payload-types.ts`). **Never redefine prop types in
> `apps/web`** — import the typed block from `@cleanstart/types`.
>
> Primitives reference: [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) §8.

## Component-engineering rules (apply to every block)

1. **CVA variant names must match Figma variant names verbatim.** If
   Figma exposes `variant: 'primary' | 'secondary' | 'outline'`, the
   `cva()` definition uses those exact strings. Mismatch is treated as a
   sync defect, not a stylistic choice.
2. **React 19 ref-as-prop, no `forwardRef`.** Type as
   `ref?: React.Ref<HTMLElement>` and destructure. Do not introduce
   `React.forwardRef` to new code.
3. **Server Component by default.** Add `'use client'` only when a
   primitive needs hooks, browser APIs, event handlers, or refs. Each
   client boundary is a measured JS chunk; split aggressively (push
   `'use client'` to leaves: `<DialogTrigger>` is client, `<Dialog>` need
   not be).
4. **No new icon libraries.** Use `lucide-react` for UI icons and
   `community-logos/*.svg` for integration marks. Do not import from
   `react-icons`, `heroicons`, `phosphor-icons`, etc. — assets come from
   the established design system.
5. **Figma is design intent, not final code.** The MCP / extract output
   represents visual specification. Translate to project conventions
   (semantic token names, primitive composition, prop surfaces) before
   shipping. Document each deviation from the Figma artboard in the
   ticket if not pixel-perfect.
6. **Validate against the screenshot last.** Before merging a block PR,
   place the live Storybook story side-by-side with
   `docs/web/figma-snapshots/<page>.png` (or the dev-mode Figma URL).
   Visual diff < threshold ships; above threshold loops back.
7. **No prop type duplication.** If the Payload type lacks something
   you need (rare), extend at the consumer:
   `type Props = HeroBlock & { extraThing?: string }` — never redefine
   the base.

---

## Block registry

The block-name → component import wires up in
`apps/web/components/blocks/index.ts`:

```ts
export const BLOCK_REGISTRY = {
  hero: HeroBlock,
  cta: CtaBlock,
  richText: RichTextBlock,
  formBlock: FormBlockComponent,
  featureGrid: FeatureGridBlock,
  logoCloud: LogoCloudBlock,
  integrationLogos: IntegrationLogosBlock,
  testimonial: TestimonialBlock,
  stats: StatsBlock,
  metricsBar: MetricsBarBlock,
  faq: FaqBlock,
  gallery: GalleryBlock,
  embed: EmbedBlock,
  codeBlock: CodeBlockComponent,
  pricing: PricingBlock,
  jobsList: JobsListBlock,
  table: TableBlock,
  section: SectionBlock,
} as const satisfies Record<string, ComponentType<any>>;
```

Lookup at render time uses `block.blockType`. Unknown types are silently
ignored with a `Sentry.addBreadcrumb({ category: 'block-registry', level: 'warning' })`.

---

## 18 blocks (one per file)

### `Hero` → `<HeroBlock>`

| | |
|---|---|
| File | `apps/cms/src/payload/blocks/Hero.ts` |
| Web component | `apps/web/components/blocks/HeroBlock.tsx` |
| Props (from types) | `HeroBlock` |
| Primitives | `Container`, `MaxWidth`, `Section`, `GlassSurface` (when overlaid on gradient bg), `Button`, `IconButton`, `AspectFrame` (for inline media) |
| Typography | `display-xl` headline, `subhead` lede, `body-md` supporting copy |
| Background variants | `solid`, `gradient-deep-violet`, `gradient-aurora`, `image` (R2-served) |
| CTA | one primary + one secondary (Button); a `link` variant for tertiary |
| Visual diff baselines | desktop-1920 + desktop-1280 + tablet-768 + mobile-360 |
| A11y | `<h1>` is the headline; supporting copy ≠ heading; CTAs labelled (no "Click here") |
| Open Q | does Hero support a `<video>` background? Pending W2 sign-off |

### `CTA` → `<CtaBlock>`

| | |
|---|---|
| File | `apps/cms/src/payload/blocks/CTA.ts` |
| Component | `CtaBlock.tsx` |
| Props | `CtaBlock` |
| Primitives | `Section`, `Container`, `Button`, `Pill`, `GlassSurface` |
| Typography | `display-md` or `display-sm` headline, `body-md` lede |
| Variants | `simple`, `split` (text + media), `panel` (full-bleed gradient) |
| Helper | uses shared `cta-button.ts` field group from CMS |

### `RichText` → `<RichTextBlock>`

| | |
|---|---|
| File | `apps/cms/src/payload/blocks/RichText.ts` |
| Component | `RichTextBlock.tsx` |
| Props | `RichTextBlock` |
| Primitives | `MaxWidth.prose` (constrains to ~65ch), `Card` (for code-block sub-renders), Lexical → React renderer in `lib/lexical/` |
| Custom Lexical nodes | `linkField` (`{ kind: 'internal' \| 'media' \| 'url', target?, mediaTarget?, url?, newTab, text }` — see [`apps/cms/src/payload/fields/link.ts`](../../apps/cms/src/payload/fields/link.ts)), table (with colspan/rowspan), heading (with anchor IDs from CMS-computed `bodyStats`) |
| Prose styles | configured via Tailwind v4 `@layer base` — `h2/h3/h4` get the heading scale, `p` gets `body-sm`, `ul/ol` use `list-disc/list-decimal` with proper indentation |
| Media | block-level images render via `<AspectFrame>` |

### `FormBlock` → `<FormBlockComponent>`

| | |
|---|---|
| File | `apps/cms/src/payload/blocks/FormBlock.ts` |
| Component | `FormBlockComponent.tsx` |
| Props | `FormBlockBlock` (relation → `forms`) |
| Primitives | `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `Button`, `LeadForm` (composite) |
| Wires to | `lib/forms/lead-submit.ts` server action → proxies to CMS `/api/leads/submit` |
| Conditional logic | `forms.fields[].conditional` — implemented client-side via React state; never fetched again |
| Validation | shared Zod schema generated from `forms.fields[]` shape; server still re-validates |
| Turnstile | rendered via `components/integrations/Turnstile.tsx` when `forms.requireCaptcha` |
| Honeypot | hidden `<input name="hp_">` — non-empty fails server-side |
| Confirmation | inline success state replaces form; copy from `forms.successMessage` |

### `FeatureGrid` → `<FeatureGridBlock>`

| | |
|---|---|
| File | `apps/cms/src/payload/blocks/FeatureGrid.ts` |
| Component | `FeatureGridBlock.tsx` |
| Props | `FeatureGridBlock` |
| Primitives | `Section`, `Container`, `Card`, `IconButton` (per feature), Lucide icon support |
| Layout | 1 column mobile, 2 column tablet, 3 column desktop (configurable: `cols` field — `2 \| 3 \| 4`) |
| Variants | `card` (default — outlined card with icon), `panel` (glass surface), `simple` (icon + text only, no card) |
| Cell content | icon + headline (`heading-sm`) + body (`body-sm`) + optional CTA |

### `LogoCloud` → `<LogoCloudBlock>`

| | |
|---|---|
| File | `apps/cms/src/payload/blocks/LogoCloud.ts` |
| Component | `LogoCloudBlock.tsx` |
| Props | `LogoCloudBlock` |
| Primitives | `Section`, `Container`, custom `LogoMarquee` (W-B if marquee variant ships) |
| Variants | `static` (grid), `marquee` (horizontal scroll, paused on hover, paused under `prefers-reduced-motion`) |
| Image source | CMS `media` collection; renders via `<Image>` with `unoptimized={false}` |
| Greyscale option | optional `tone='grey'` per-block; reuses the same media (CSS filter) |
| Editor copy | "As trusted by" / "Powering security at" — editor-supplied |

### `IntegrationLogos` → `<IntegrationLogosBlock>`

| | |
|---|---|
| File | `apps/cms/src/payload/blocks/IntegrationLogos.ts` |
| Component | `IntegrationLogosBlock.tsx` |
| Props | `IntegrationLogosBlock` |
| Primitives | `Section`, `Container`, `Pill` (filterable categories) |
| Asset source | `community-logos/*.svg` at repo root (2,000+ marks, CNCF + adjacents). Editor picks logos by ID; component resolves via a Vite-style import (or static lookup) at build time |
| Layout | filterable grid by category (storage, runtime, observability, security, …) |
| Categories | enum sourced from a CMS-side select on the block; designer to confirm canonical list |

### `Testimonial` → `<TestimonialBlock>`

| | |
|---|---|
| File | `apps/cms/src/payload/blocks/Testimonial.ts` |
| Component | `TestimonialBlock.tsx` |
| Props | `TestimonialBlock` |
| Primitives | `Section`, `Container`, `GlassSurface`, `AspectFrame` (avatar) |
| Variants | `single` (large quote), `carousel` (3+ quotes, Embla — pause under reduced motion) |
| JSON-LD | `Review` (when block is on a page about a product/service); generator in `lib/seo/jsonld.ts` |

### `Stats` → `<StatsBlock>`

| | |
|---|---|
| File | `apps/cms/src/payload/blocks/Stats.ts` |
| Component | `StatsBlock.tsx` |
| Props | `StatsBlock` |
| Primitives | `Section`, `Container`, `Card`, tabular-nums typography |
| Animation | count-up on viewport-enter (Intersection Observer); skipped under `prefers-reduced-motion` |
| Variants | `2-up`, `3-up`, `4-up`, `dense` (5+) |

### `MetricsBar` → `<MetricsBarBlock>`

| | |
|---|---|
| File | `apps/cms/src/payload/blocks/MetricsBar.ts` |
| Component | `MetricsBarBlock.tsx` |
| Props | `MetricsBarBlock` |
| Primitives | `Section.compact`, `Container`, divider lines |
| Layout | horizontal strip of 4–6 metrics; collapses to vertical on mobile |
| Difference vs Stats | `Stats` is a section; `MetricsBar` is a strip — usually below Hero |

### `FAQ` → `<FaqBlock>`

| | |
|---|---|
| File | `apps/cms/src/payload/blocks/FAQ.ts` |
| Component | `FaqBlock.tsx` |
| Props | `FaqBlock` |
| Primitives | `Section`, `Container`, native `<details>`/`<summary>` (no JS to open/close) |
| JSON-LD | `FAQPage` automatically appended to `<head>` when this block exists on the page |
| Anchor links | each Q gets an `id` from CMS slug-of-question; URL `#q-…` opens that one |
| Min rows | 1 (validated server-side) |

### `Gallery` → `<GalleryBlock>`

| | |
|---|---|
| File | `apps/cms/src/payload/blocks/Gallery.ts` |
| Component | `GalleryBlock.tsx` |
| Props | `GalleryBlock` |
| Primitives | `Section`, `AspectFrame`, lightbox (Dialog primitive) |
| Variants | `grid`, `masonry`, `carousel` |
| Lightbox | keyboard navigable (arrow keys, Esc); focus-trapped; respects reduced motion |

### `Embed` → `<EmbedBlock>`

| | |
|---|---|
| File | `apps/cms/src/payload/blocks/Embed.ts` |
| Component | `EmbedBlock.tsx` |
| Props | `EmbedBlock` |
| Allow-list | only embed URLs matching CSP-approved hosts (YouTube, Calendly, Vimeo, internal media) — others rendered as a labelled link instead of `<iframe>` |
| Privacy-by-default | YouTube uses `youtube-nocookie.com`; lazy-loaded with click-to-play poster |
| Safe attrs | `loading='lazy'`, `referrerpolicy='strict-origin-when-cross-origin'`, `allow='fullscreen; picture-in-picture'`, no `allow='*'` |

### `CodeBlock` → `<CodeBlockComponent>`

| | |
|---|---|
| File | `apps/cms/src/payload/blocks/CodeBlock.ts` |
| Component | `CodeBlockComponent.tsx` |
| Props | `CodeBlockBlock` |
| Highlighting | `shiki` SSR-side, `tokyoNight`/`light-plus` themes (designer to confirm) |
| Copy button | top-right; uses `navigator.clipboard.writeText`; "Copied!" affordance for 1500ms |
| Languages | restricted set: `bash`, `dockerfile`, `yaml`, `json`, `tsx`, `ts`, `go`, `python` — others fall back to `text` |
| Line numbers | optional toggle (`showLineNumbers`) |

### `Pricing` → `<PricingBlock>`

| | |
|---|---|
| File | `apps/cms/src/payload/blocks/Pricing.ts` |
| Component | `PricingBlock.tsx` |
| Props | `PricingBlock` |
| Primitives | `Section`, `Container`, `Card`, `Pill` (badge for popular plan), `Button` |
| JSON-LD | `Product` + `Offer` per plan when block is on `/pricing` |
| Layout | up to 4 plans side-by-side; collapses to vertical at `md` |
| Toggle | optional monthly/annual switch; updates `<Switch>` ARIA-pressed state |

### `JobsList` → `<JobsListBlock>`

| | |
|---|---|
| File | `apps/cms/src/payload/blocks/JobsList.ts` |
| Component | `JobsListBlock.tsx` |
| Props | `JobsListBlock` |
| Data source | server-side fetch of `jobs` collection at render time; cached `jobs:list` |
| Filters | location (from `jobLocations`), team (if a `team` field exists; designer to confirm), source |
| Per-row | role title, location pill, source pill (`CMS` vs `ATS`), apply CTA — links to `/job/<slug>` |
| Empty state | "No open positions right now — drop your résumé" CTA → mailto: or generic LeadForm |

### `Table` → `<TableBlock>`

| | |
|---|---|
| File | `apps/cms/src/payload/blocks/Table.ts` |
| Component | `TableBlock.tsx` |
| Props | `TableBlock` |
| Renders | Lexical custom table node (colspan/rowspan support per arch doc `#table-handling`); uses our Lexical → React renderer |
| Mobile | horizontal scroll wrapper with sticky first column |
| A11y | `<caption>` (block-level title); `<th scope="col\|row">` correct; `aria-rowcount`/`aria-colcount` set |

### `Section` → `<SectionBlock>`

| | |
|---|---|
| File | `apps/cms/src/payload/blocks/Section.ts` |
| Component | `SectionBlock.tsx` |
| Props | `SectionBlock` |
| Purpose | composition primitive — wraps **one level** of nested blocks (arch doc rule: never nested inside itself) |
| Variants | `default`, `dark` (gradient bg), `narrow` (constrained to `MaxWidth.prose`) |
| Children | recursively renders `layout[]` via the same registry |

---

## Helper field group: `cta-button`

`apps/cms/src/payload/blocks/cta-button.ts` is **not** a block — it's a
shared field group used by `Hero`, `CTA`, `FAQ`, etc. for the
"label + link + variant" shape. It composes the `linkField` helper from
[`apps/cms/src/payload/fields/link.ts`](../../apps/cms/src/payload/fields/link.ts).
The web side imports the matching TS type from `packages/types` and
renders via `<Button asChild>` with a link resolver in `lib/cms.ts`.

---

## Globals

| Global | Component | Notes |
|---|---|---|
| `siteSettings` | layout-level | `<Header>` reads `siteName`, `socialLinks`; `<Footer>` reads `supportEmail`, `socialLinks` |
| `mainNav` | `<Header>` + `<NavMega>` | Recursive `_navItem` blocks; `<NavLink>` for leaves, `<NavMega>` for parents with children |
| `footerNav` | `<Footer>` | Same recursion model; renders as columns |
| `legal` | `/legal/*` route group | One rich-text field per legal page; rendered with the prose Lexical → React renderer |
| `seoDefaults` | `app/layout.tsx` `generateMetadata` | Title template (`'%s | CleanStart'`), default description, default OG, twitter handle |
| `announcements` | `<AnnouncementsBar>` | Rendered atop `(marketing)` chrome; max one published row at a time |

Helper: `_navItem.ts` is a shared field group (recursive nav block); not
its own component.

---

## Verification (run before W-C closes for each block)

```sh
ls apps/cms/src/payload/blocks/ | grep -v -E '^(index\.ts|cta-button\.ts)$' | wc -l   # expect 18
grep -c '^### `' docs/web/COMPONENT-MAP.md                                            # must equal 18

ls apps/cms/src/payload/globals/ | grep -v '^_' | wc -l                               # expect 6
grep -c '^| `siteSettings\|`mainNav\|`footerNav\|`legal\|`seoDefaults\|`announcements\| docs/web/COMPONENT-MAP.md  # 6 hits
```

If any of those checks fail, the row is missing or out of sync.

---

## Future blocks (not yet in CMS)

- **Comparison** — listed in arch doc `#blocks` but **not in code** today.
  When added, it follows the same shape as `Pricing` + `FeatureGrid`. Add
  here when the CMS ships it.
- **Knowledge Hub variants** — depend on schema decision (W4-00 blocker).
