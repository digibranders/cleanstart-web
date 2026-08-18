---
target: /financial-services page
total_score: 20
max_score: 32
na_heuristics: 7,10
p0_count: 1
p1_count: 3
timestamp: 2026-08-17T08-41-26Z
slug: apps-web-src-app-financial-services-page-tsx
---
Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Little state to show; no orientation cue on a 4,831px page |
| 2 | Match System / Real World | 2 | "Financial Services Brochure" CTA resolves to /resource-center; "AI BOMs" never glossed |
| 3 | User Control and Freedom | 2 | 2 links in all of `<main>`, both in the hero; y≈570–4,321 has zero actions |
| 4 | Consistency and Standards | 2 | 3 header configs; hero gutter 40px vs body 48px; hero CTA 38px vs footer 44px |
| 5 | Error Prevention | 3 | Only trap is the mislabeled brochure CTA |
| 6 | Recognition Rather Than Recall | 2 | Stack's right column sits 170px from its owning h3, unlabeled |
| 7 | Flexibility and Efficiency | n/a | One-shot marketing surface, no repeat use |
| 8 | Aesthetic and Minimalist Design | 3 | 0 pills, 0 gradient tiles measured — but minimalism overshot into under-design |
| 9 | Error Recovery | 3 | No error states; no recovery from the brochure dead end |
| 10 | Help and Documentation | n/a | Marketing surface |
| **Total** | | **20/32** | **Acceptable (62.5%)** |

## Design Specificity Verdict

1 of 6 sections is unmistakably CleanStart-for-banks. The hero visual (pediment on widening isometric strata over lit bedrock, risk deflected at the boundary) argues the headline rather than decorating it. Below it, specificity collapses: strip the words "financial"/"regulated" and all five body sections are a generic supply-chain-security page. No DORA, PCI DSS, FFIEC, SWIFT CSP, no customer, no number. 304 words across 4,831px — one word per 16 vertical pixels.

Deterministic scan: CLI detector 0 findings, exit 0. Browser detector 144 overlays page-wide, only 4 in scope, and all 4 self-refuted as false positives (translucent-background contrast miscomposite 1.1:1 vs actual 10.3:1; cyan terminal-node accent measuring 14.06:1; all-caps flag on a string that is already acronyms). 28/28 measured text pairs pass WCAG AA. Reduced-motion coverage complete.

## Overall Impression

The AI-slop purge is real and measurable — 0 badge pills, 0 gradient icon tiles, 2 blur blobs (both site-convention footer), against ~35/4/5 before. The client's stated complaint is answered. But the rebuild removed the ornament and kept the grid: three consecutive sections compute to identical `332.25px × 4` column grids with identical top rules and identical dividers. Same rhythmic monotony, different skin. Biggest opportunity: break one section out of the template and move it to the end, where the page currently has its flattest 1,300px immediately before the ask.

## What's Working

1. The slop reduction is measurable, not cosmetic — an order-of-magnitude drop in decorative shapes.
2. `FinanceRiskChain` on mobile: real DOM vertical rail, per-segment red→cyan gradient, chain correctly terminating at the terminal node instead of running past it.
3. `prefers-reduced-motion` is architected, not bolted on — every animation holds its resolved state in the base rule.

## Priority Issues

**[P0] Zero conversion path across 4,300px, and the one CTA lies about its destination.** `<main>` has exactly 2 links, both in the hero. "Financial Services Brochure" resolves to `/resource-center`. A reader convinced at the risk chain (y≈1,900) has no action for another 2,900px. Fix: point the brochure at the real asset or gate it; make the two Foundation pillar h3s and the Compliance column into links to pages that already exist. Command: /impeccable clarify

**[P1] Three consecutive sections are the same 4-column ruled template.** Measured identical `332.25px × 4` in FinanceFoundation's loop, FinanceRequirements, FinanceOutcomes; FinanceStack is the same template rotated 90°. Fix: break FinanceOutcomes — asymmetric weight, and invert to the dark band so the page ends on a peak. Command: /impeccable layout

**[P1] 768px collision in FinanceRiskChain.** `md:grid-cols-6` engages at 768 giving 90px cells; three h3s overflow by +18/+28/+13px and visually collide; the grid overruns its own box by 13px. Clean at 375/1024/1440/1920. Fix: hold the vertical rail to `lg:` or use a 2×3 grid at md. Command: /impeccable adapt

**[P1] `margin: 0` silently kills `md:mt-7` on the risk-chain labels.** `FinanceRiskChain.tsx:144` sets the class, line 152 sets inline `margin: 0`; inline wins. Measured tick bottom 295.69 = h3 top 295.69, zero gap at every viewport. The section as designed has never rendered. Fix: delete `margin: 0`, retune risk markers from 46px to ~16px above the spine. Command: /impeccable polish

**[P2] Mobile loses both authored graphics and every dividing rule.** Hero visual `hidden lg:block`, risk markers `hidden md:block`, all `lg:border-l` dividers drop. 6,987px / 8.6 screens of unbroken type for 304 words. Mobile gets the costs of minimalism with none of its compensations. Fix: portrait viewBox variant of the hero visual; promote `lg:border-l` to `border-t` on stacked variants. Command: /impeccable adapt

## Persona Red Flags

**Jordan (first-timer):** Stack's right column is 14px, 170px from its owning h3, unlabeled — unparseable on first read. "Container Images" means a stratum in one section and a stage in the next, 570px apart, with no bridge. Nothing states what CleanStart sells until y≈2,004. Zero proof of any kind across 4,831px — no customer, logo, number, or quote; the incumbent CisoRisks leads every card with a stat.

**Riley (stress tester):** Finds 2 links and one lies. "Explore the Platform" has `scaleX(0)` underline at rest — no resting affordance at all. Primary CTA is 38px against the project's own ≥44px rule, and smaller than the footer CTA on the same page. 30 headings against 304 words, two-thirds single nouns.

**Casey (mobile):** Never sees the bank-on-a-foundation drawing or the falling risk markers — both desktop-gated. Scrolls 8.6 screens. Both hero actions measure 36px and 38px tall against the 44px floor, at every width, not just mobile.

## Minor Observations

- `--fin-gap: clamp(30px, 3vw, 24px)` has min > max — locked at 30px, the `3vw` intent is dead code.
- Hero gutter 40px vs body 48px: the page's single hard left edge jogs 8px right after the hero.
- FinanceRequirements' vertical dividers have ragged bottoms (3/3/3/4 items, no `h-full`).
- The STANDARDS line duplicates 5 of 6 tokens from the grid 40px above it.
- The two Foundation glyphs are not optically matched: 88×80 vs 92.5×92 units in the same viewBox.
- `FinanceFoundation.tsx:8` documents a dividing rule that is never drawn.
- Contrast passes AA everywhere; lowest is 4.93:1 at 13px — 0.43 above the floor.

## Questions to Consider

1. Is "four ruled columns ×3" actually a different design from "four icon tiles ×5", or the same design with the tiles turned off?
2. Why does the argument peak in the middle and end on its two flattest registers?
3. 240 lines of authored SVG that 100% of mobile visitors never see — is a desktop-only thesis a thesis?
4. Would a 3-section, 2,400px page made from exactly these 304 words be more persuasive to a bank than a 6-section, 4,831px one?
