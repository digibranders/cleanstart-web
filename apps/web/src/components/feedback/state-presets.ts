/**
 * Single source of truth for every illustrated error / empty / success state.
 * Adding a new state is one row here — no new component. `StateView` reads a
 * preset by `variant` key and renders the matching illustration + copy.
 *
 * Illustrations live in `public/error/*.webp` (converted from the source 3D
 * PNGs; each < 150 KB). `width`/`height` are the on-disk WebP dimensions so
 * `next/image` reserves the correct aspect ratio and avoids layout shift.
 */

export type StateVariant =
  | "not-found"
  | "server-error"
  | "maintenance"
  | "bad-request"
  | "offline"
  | "forbidden"
  | "rate-limited"
  | "empty"
  | "no-results"
  | "load-failed"
  | "success";

/** Dark = full-page hero with gradient chrome. Light = inline on a page bg. */
export type StateTone = "dark" | "light";

export interface StatePreset {
  /** Public path to the WebP illustration. */
  illustration: string;
  /** Intrinsic width of the WebP (px) — drives the aspect ratio. */
  width: number;
  /** Intrinsic height of the WebP (px). */
  height: number;
  /** Decorative alt; the visible title carries the real meaning. */
  alt: string;
  title: string;
  description: string;
  tone: StateTone;
}

export const STATE_PRESETS: Record<StateVariant, StatePreset> = {
  "not-found": {
    illustration: "/error/404.webp",
    width: 700,
    height: 650,
    alt: "",
    title: "Page Not Found",
    description: "The page you're looking for doesn't exist or has moved.",
    tone: "dark",
  },
  "server-error": {
    illustration: "/error/500.webp",
    width: 760,
    height: 679,
    alt: "",
    title: "Something Went Wrong",
    description: "An unexpected error occurred on our end. Please try again.",
    tone: "dark",
  },
  maintenance: {
    illustration: "/error/503.webp",
    width: 839,
    height: 752,
    alt: "",
    title: "We'll Be Right Back",
    description: "This service is temporarily unavailable for maintenance.",
    tone: "dark",
  },
  "bad-request": {
    illustration: "/error/400.webp",
    width: 720,
    height: 705,
    alt: "",
    title: "That Request Didn't Work",
    description: "Something about that request wasn't valid. Try again.",
    tone: "dark",
  },
  offline: {
    illustration: "/error/no-internet.webp",
    width: 751,
    height: 729,
    alt: "",
    title: "You're Offline",
    description: "Check your internet connection and try again.",
    tone: "dark",
  },
  forbidden: {
    illustration: "/error/403.webp",
    width: 511,
    height: 470,
    alt: "",
    title: "Access Denied",
    description: "You don't have permission to view this.",
    tone: "light",
  },
  "rate-limited": {
    illustration: "/error/429.webp",
    width: 482,
    height: 496,
    alt: "",
    title: "Slow Down a Moment",
    description: "Too many requests in a short time. Please wait and retry.",
    tone: "light",
  },
  empty: {
    illustration: "/error/empty-state.webp",
    width: 1024,
    height: 1024,
    alt: "",
    title: "Nothing here yet",
    description: "Check back soon — new content is on the way.",
    tone: "light",
  },
  "no-results": {
    illustration: "/error/empty-search.webp",
    width: 760,
    height: 667,
    alt: "",
    title: "No results found",
    description: "Try a different search or clear your filters.",
    tone: "light",
  },
  "load-failed": {
    illustration: "/error/offline.webp",
    width: 700,
    height: 667,
    alt: "",
    title: "Couldn't load this",
    description: "We hit a problem loading this content. Please try again.",
    tone: "light",
  },
  success: {
    illustration: "/error/success.webp",
    width: 514,
    height: 494,
    alt: "",
    title: "Thank you!",
    description: "We've received your submission and will be in touch.",
    tone: "light",
  },
};
