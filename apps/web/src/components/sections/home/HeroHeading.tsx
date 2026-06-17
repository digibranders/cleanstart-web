// Home hero H1 with a layered, on-brand motion sequence:
//   1. "Verified. Secure." (brand cyan→purple gradient) reveals via a stepped
//      clip "type-on" + blinking caret, then snaps from soft blur into sharp
//      focus, and drifts continuously thereafter.
//   2. "Built for the AI Era." (white) focus-settles in after.
//
// Server component (no "use client") — the effect is pure CSS, so zero client JS
// ships for it and the FULL heading text is present in the server HTML (the
// type-on is a clip reveal, not character insertion). That is load-bearing: the
// H1 is the LCP element and screen readers must read the whole phrase. All
// motion lives in keyframes (never in base rules) so prefers-reduced-motion
// falls back to the final, static, fully-visible heading. Timing/keyframes:
// the cs-hh-* rules in globals.css. Typography stays on the role tokens
// (--fs-display-home / --fs-display-ls) exactly as before.
export function HeroHeading() {
  return (
    <h1
      className="cs-hero-h1 font-display font-semibold text-white"
      style={{
        fontSize: "var(--fs-display-home)",
        letterSpacing: "var(--fs-display-ls)",
        lineHeight: 1.05,
      }}
    >
      {/* Caret lives on the wrapper so the inner clip-path doesn't crop it. */}
      <span className="cs-hh-typewrap">
        <span className="cs-hh-type">Verified. Secure.</span>
      </span>{" "}
      <span className="cs-hh-phrase">Built for the AI&nbsp;Era.</span>
    </h1>
  );
}
