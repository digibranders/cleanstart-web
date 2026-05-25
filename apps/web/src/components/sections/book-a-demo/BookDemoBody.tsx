import type { ReactNode } from "react";

/**
 * Shared light-section wrapper for the "Whats sets us Apart?" row + the
 * form card. One continuous pure-white surface so neither block reads as
 * having its own background.
 *
 * Two restrained floaters drawn from the Figma:
 *  - Right purple radial (Figma 867:999 — fill_TTOII3 @ 10%, x:1051, y:437, 1101×1101)
 *  - Pink ellipse (Figma 867:1000 — #DF9BFF, x:1276, y:898, 258×258,
 *    opacity 0.8, blur(121.5px))
 *
 * The Figma also defines a left radial (867:934) and a grid pattern
 * (867:675), but both visually wrapped a rectangular region around the
 * heading content. They've been removed in favour of a clean surface.
 */
export function BookDemoBody({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <section className="relative bg-white overflow-hidden">
      {/* Right purple radial — Figma 867:999, x:1051, y:437 (local y = 437 - 473 = -36) */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "calc(50% + 331px)",
          top: "-36px",
          width: "1101px",
          height: "1101px",
          background:
            "radial-gradient(circle at 50% 50%, rgba(100, 13, 251, 1) 0%, rgba(100, 13, 251, 0) 100%)",
          opacity: 0.1,
        }}
      />

      {/* Pink ellipse — Figma 867:1000, x:1276, y:898 (local y = 898 - 473 = 425) */}
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          left: "calc(50% + 556px)",
          top: "425px",
          width: "258px",
          height: "258px",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
        }}
      />

      <div className="relative">{children}</div>
    </section>
  );
}
