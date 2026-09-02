import type { ReactNode } from 'react';

/**
 * SVG glyph map. All glyphs are 24×24 viewBox, 1.6 px stroke, currentColor.
 * Consumed by NavIcon.tsx, which renders them inside an icon tile.
 *
 * Add a new id here; reference it from nav-config.ts; that's the entire surface.
 */
export const glyphs: Record<string, ReactNode> = {
  container: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M3 11h18" />
      <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
      <circle cx="8" cy="15" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  'doc-signed': (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
      <circle cx="17" cy="17" r="2" fill="none" />
    </>
  ),
  radar: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  // Half-dial with a needle: the Impact Estimator's own radial gauge, reduced.
  gauge: (
    <>
      <path d="M4 16a8 8 0 0 1 16 0" />
      <path d="M12 16l4.5-5" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
      <path d="M3 20h18" />
    </>
  ),
  'shield-check': (
    <>
      <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  gears: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 10v6M4.22 4.22l4.24 4.24m7.07 7.07 4.24 4.24M1 12h6m10 0h6M4.22 19.78l4.24-4.24m7.07-7.07 4.24-4.24" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-3.5-7.1" />
      <path d="M21 4v5h-5" />
    </>
  ),
  minimize: (
    <>
      <path d="M3 12h6" />
      <path d="M15 12h6" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  tools: (
    <>
      <path d="m7 8-4 4 4 4" />
      <path d="m17 8 4 4-4 4" />
      <path d="m14 4-4 16" />
    </>
  ),
  hash: (
    <>
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  folder: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
  library: (
    <>
      {/* Books standing on the shelf — one leaning, two upright (mirrored). */}
      <path d="m9.5 5.4-3.4 11.6" />
      <path d="M13.5 5v12" />
      <path d="M18 5v12" />
      {/* Rounded shelf bar. */}
      <rect x="3" y="18.5" width="18" height="3" rx="1.5" />
    </>
  ),
  newspaper: (
    <>
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z" />
    </>
  ),
  'book-open': <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />,
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  play: <polygon points="5 3 19 12 5 21 5 3" />,
  mic: (
    <>
      <rect x="9" y="2" width="6" height="13" rx="3" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
      <path d="M12 19v3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  network: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="5" cy="6" r="2" />
      <circle cx="19" cy="6" r="2" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="19" cy="18" r="2" />
    </>
  ),
  bank: (
    <>
      <path d="M3 10 12 4l9 6" />
      <path d="M6 10v8" />
      <path d="M10 10v8" />
      <path d="M14 10v8" />
      <path d="M18 10v8" />
      <path d="M3.5 21h17" />
    </>
  ),
  // Currently unreferenced: the Solutions > By industry > SaaS row is commented
  // out in nav-config until that page's copy is approved. Kept rather than
  // deleted because it has already been removed and re-added twice as that row
  // came and went.
  cloud: (
    <>
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </>
  ),
  // Stacked components: the same mark the Modern Applications hero uses for
  // Verified Components, so the menu row and the page it opens share a symbol.
  layers: (
    <>
      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </>
  ),
  star: <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9 12 2" />,
  mail: (
    <>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </>
  ),
};

export type GlyphId = keyof typeof glyphs;
