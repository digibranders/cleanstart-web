import type { ReactNode } from "react";

/**
 * Shared light-section wrapper for the "What sets us Apart?" row + the form
 * card. One continuous pure-white surface so neither block reads as having
 * its own background, with two restrained decorative floaters (a right purple
 * radial and a pink ellipse).
 */
export function BookDemoBody({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <section className="relative bg-white overflow-hidden">
      {/* Right purple radial. */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "calc(50% + 331px)",
          top: "-36px",
          width: "1101px",
          height: "1101px",
          background:
            "radial-gradient(circle closest-side at 50% 50%, rgba(100, 13, 251, 1) 0%, rgba(100, 13, 251, 0) 100%)",
          opacity: 0.1,
        }}
      />

      {/* Pink ellipse. */}
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
