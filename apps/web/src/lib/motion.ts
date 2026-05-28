/**
 * Shared motion constants — keep every animation on the site tuned to the same
 * curves and reveal vocabulary. Mirrors the cleanstart-sample's recipe.
 *
 * Source of truth: cleanstart-sample/components/{home,products,shared}/* —
 * every section uses one of these two eases, a y-offset between 20–60 px, a
 * duration between 0.6–0.9 s, and a viewport margin of -60 to -80 px with
 * `once: true`.
 */

import type { Transition, Variants } from "motion/react";

// Primary curve — easeOutQuint variant. Used for ~85% of reveals in the sample.
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// Secondary — softer landing. Used for exits, transitions, slower lede reveals.
export const EASE_SOFT = [0.22, 1, 0.36, 1] as const;

/** Standard reveal transition for in-view animations. */
export const REVEAL_TRANSITION: Transition = {
  duration: 0.7,
  ease: EASE_OUT,
};

/** Viewport config for body-content reveals. */
export const REVEAL_VIEWPORT = {
  once: true,
  margin: "0px 0px -60px 0px",
  amount: 0.05,
} as const;

/** Viewport config for section headers — fires slightly later. */
export const HEADER_VIEWPORT = {
  once: true,
  margin: "0px 0px -80px 0px",
  amount: 0.05,
} as const;

/** Variant family for a parent that staggers its children's reveals. */
export const staggerParent = (gap = 0.08): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: gap } },
});

/** Child variant: pairs with `staggerParent` on the parent. */
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: REVEAL_TRANSITION },
};
