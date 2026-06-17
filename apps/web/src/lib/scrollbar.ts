/**
 * Premium custom scrollbar — a thin, floating, rounded thumb on a transparent
 * track that darkens on hover. Replaces the chunky default OS scrollbar.
 *
 * The class name maps to real CSS in `apps/web/src/app/scrollbar.css` (imported
 * once in the root layout). Tailwind does NOT emit `::-webkit-scrollbar`
 * pseudo-element arbitrary variants, so this is authored as plain CSS instead.
 *
 * Usage: add `premiumScrollbar` to any `overflow-y-auto` container's className.
 */
export const premiumScrollbar = 'scrollbar-premium';
