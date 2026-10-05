# Blog sidebar CTAs: the three layouts and how to revive the Dock

Reviewed with the client on 2026-10-05. Option A, the **Intent Ladder**, is
live. Option C, the **Edge Dock**, is kept in git so it can be tried later.

## What each option was

| Option | What it is | Status |
|---|---|---|
| A. Intent Ladder | One sticky card in the right column (xl and wider) that steps from the matched images portal entry to the related resource to the free POC at 35% and 75% reading depth. A bottom bar below xl. | Live |
| B. Stack | The three cards as a wallet-style deck in the same column, POC on top, fanning out on hover. | Dropped. Not kept. |
| C. Edge Dock | A tab docked to the right wall of the browser with a reading-progress ring. Its label names the current ask. At 35% and 75% a short suggestion slides out of the tab. Clicking the tab opens a side panel with all three cards. Hidden below `md`, where the bottom bar takes over. | Kept in history |

The Ladder is described in `CLAUDE.md` (Schema decisions, "Blog sidebar CTAs")
and lives in `apps/web/src/components/sections/blog/cta/` and
`apps/web/src/lib/blog-cta/`.

## Where the Dock is

- **Tag:** `design/blog-cta-edge-dock`, pointing at commit `34a192f0`.
- **History:** the Dock's 9 commits are part of `development`'s history through
  the merge commit "chore: keep the Edge Dock blog CTA design in history", which
  changes no files.
- Browse it with `git show design/blog-cta-edge-dock --stat` or read a file with
  `git show design/blog-cta-edge-dock:apps/web/src/components/sections/blog/cta/BlogCtaDock.tsx`.

What the Dock includes beyond the layout: the tab label follows the current ask
(the matched image, then the resource's own button text, then "Book a free POC"),
the tab stays flush with the browser edge on hover, the panel scrolls with the
mouse wheel (`data-lenis-prevent`), and the nudge is a narrow card that fits the
gap beside the article.

## Before you revive it

The Dock was written against the rail's API as it was on 2026-10-05, before the
Ladder was rebuilt without the animation library. It will not compile against
today's code until these are adapted.

1. **Progress API.** The Dock calls `const { progress, stage } = useArticleProgress()`
   and drives its ring with `useSpring` and `useTransform` on the `progress`
   motion value. The hook now returns `{ stage, subscribe }` and no motion value.
   Write the ring's `strokeDashoffset` from a `subscribe` callback instead, as
   `BlogCtaLadder.tsx` does for its bar.
2. **Card context.** `CtaCardContext` took `progress`; it now takes `subscribe`.
3. **Types.** Add `"dock"` back to `BlogCtaLayout` and `BlogCtaPlacement` in
   `lib/blog-cta/types.ts`. They are `"ladder"` and `"rail" | "bar"` today.
4. **Removed helpers.** `preloadResourceCover` and the bottom bar's `fixedStage`
   prop no longer exist. The Dock's panel can render the Learn cover directly.
5. **Wiring in `app/blogs/[slug]/page.tsx`.** The Dock replaces the `rail` prop
   on `BlogDetailContent`:

   ```tsx
   <BlogCtaDock ctas={ctas} />
   <BlogCtaBottomBar ctas={ctas} layout="dock" className="md:hidden" />
   ```

## The cost that matters: bundle size

The Dock uses motion's value hooks, springs and `AnimatePresence`. The rest of
the site uses only the slim `m` component. Imported as it was, those land in the
motion chunk **every page downloads**: the first Ladder release did this and grew
the home page by 6 to 8 KB gzipped, which failed `pnpm bundle:budget` (tolerance
5 KB) and turned the "Playwright" CI check red on `main`.

- `next/dynamic` did not help. It made the home page worse.
- Removing only `LayoutGroup` and `useScroll` left +2.6 KB.
- What worked was no animation library in the rail: CSS transitions, direct
  style writes, one passive scroll listener. Build the Dock the same way (the
  slide-out panel, the nudge and the tab are all transitions and transforms).
- Measure before releasing: build the previous commit and the new one, compare
  each route's chunks, and run `pnpm bundle:budget` against `next start --port 3001`.

The CMS side is shared. The two editor picks (Sidebar resource, Images portal
entry) and the automatic-pick lines apply to whichever layout is live.

## Previewing a variant

Vercel only builds `main` automatically. To share a branch for review, export it
with `git archive` into a clean folder and run `vercel deploy` from the project
root. Preview URLs are public only while Vercel Authentication is off for the
project, so turn it back on afterwards.
