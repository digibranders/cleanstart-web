/**
 * Clean Libraries hero product video — single source of truth for the embed,
 * the CTA duration chip, and the page's VideoObject JSON-LD.
 *
 * Metadata is pinned here rather than fetched from YouTube: `/clean-libraries`
 * is statically prerendered, so a third-party fetch on that path would either
 * fail the build when YouTube is unreachable or force the route dynamic. The
 * values come from the video's own player metadata (`lengthSeconds`,
 * `publishDate`) and only change if the video is re-uploaded.
 */

export interface HeroVideo {
  readonly videoId: string;
  /** YouTube title — reused as the iframe's accessible name. */
  readonly title: string;
  /** Synopsis for VideoObject.description. Not rendered in the UI. */
  readonly description: string;
  /** ISO-8601 publish timestamp. */
  readonly uploadDate: string;
  readonly durationSeconds: number;
  /** Poster frame, self-hosted so no third-party image lands in the hero. */
  readonly posterPath: string;
  readonly posterWidth: number;
  readonly posterHeight: number;
}

export const CLEAN_LIBRARIES_VIDEO: HeroVideo = {
  videoId: "Il4uk_RPD5M",
  title: "Clean Libraries | Secure Software Dependencies at the Source",
  description:
    "Every release introduces hundreds of dependencies, including transitive packages and AI-generated libraries. Clean Libraries verifies every dependency against security, provenance, and organizational policy before it enters production.",
  uploadDate: "2026-07-24T02:56:59-07:00",
  durationSeconds: 159,
  posterPath: "/images/clean-libraries/library-video-poster.jpg",
  posterWidth: 640,
  posterHeight: 360,
};

/** `159` → `"2:39"`. Seconds are always two digits; hours are omitted when 0. */
export function formatDurationLabel(totalSeconds: number): string {
  const total = Math.floor(totalSeconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number): string => String(n).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
}

/** `159` → `"PT2M39S"`, for schema.org `VideoObject.duration`. */
export function toIso8601Duration(totalSeconds: number): string {
  const total = Math.floor(totalSeconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  // "PT0S" is the correct representation of a zero-length duration; every other
  // component is omitted when it would be zero.
  if (total === 0) return "PT0S";
  return `PT${hours > 0 ? `${hours}H` : ""}${minutes > 0 ? `${minutes}M` : ""}${
    seconds > 0 ? `${seconds}S` : ""
  }`;
}

/** Spoken duration for the CTA's accessible name, e.g. "2 min 39 sec". */
export function spokenDuration(totalSeconds: number): string {
  const total = Math.floor(totalSeconds);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes === 0) return `${seconds} sec`;
  return seconds > 0 ? `${minutes} min ${seconds} sec` : `${minutes} min`;
}
