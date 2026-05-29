// apps/web/src/app/api/og/render.ts
import type { OgVariant } from "@/lib/seo/og";

export function pickTitleSize(title: string, variant: OgVariant): number {
  const n = title.length;
  if (variant === "hero") return n <= 40 ? 76 : 64;
  if (n <= 55) return 60;
  if (n <= 80) return 52;
  return 46;
}

export interface TitleParts {
  lead: string;
  accent: string;
}

/**
 * Split `title` so a trailing `accent` phrase can render in the gradient.
 * Falls back to all-white (accent="") when accent is absent or not found.
 * Matches the last occurrence, case-insensitively, preserving original casing.
 */
export function splitTitleAccent(title: string, accent?: string): TitleParts {
  if (!accent) return { lead: title, accent: "" };
  const idx = title.toLowerCase().lastIndexOf(accent.toLowerCase());
  if (idx === -1) return { lead: title, accent: "" };
  return { lead: title.slice(0, idx), accent: title.slice(idx) };
}
