// Home hero H1 with a layered, on-brand motion sequence:
//   1. "Hardened. Secure." (brand cyan→purple gradient) reveals via a
//      stepped clip "type-on" + blinking caret, then snaps from soft blur
//      into sharp focus.
//   2. "Hardened." gets struck through and desaturates to muted gray —
//      the industry's claim, rejected.
//   3. "Verified" rises into focus on its own line above, in the same
//      gradient as "Secure." — the correction, and the brand's actual
//      claim. A continuous gradient shine starts once it lands.
//   4. "Built for the AI Era." (white) focus-settles in last.
//
// Server component (no "use client") — the effect is pure CSS, so zero client JS
// ships for it and the FULL heading text is present in the server HTML (the
// type-on is a clip reveal, not character insertion). That is load-bearing: the
// H1 is the LCP element and screen readers must read the whole phrase. The
// struck-through "Hardened" is a visual/rhetorical device, not part of the
// coherent accessible name, so the visual markup is aria-hidden and the <h1>
// carries an explicit aria-label with the clean phrase instead. All motion
// lives in keyframes (never in base rules) so prefers-reduced-motion falls
// back to the final, static, fully-visible heading. Timing/keyframes: the
// cs-hh-* rules in globals.css. Typography stays on the role tokens
// (--fs-display-home / --fs-display-ls) exactly as before.
export function HeroHeading() {
  return (
    <h1
      className="cs-hero-h1 text-left font-display font-semibold text-white"
      style={{
        fontSize: "var(--fs-display-home)",
        letterSpacing: "var(--fs-display-ls)",
        lineHeight: 1.05,
      }}
      aria-label="Verified. Secure. Built for the AI Era."
    >
      <span aria-hidden="true">
        <span className="cs-hh-verified">Verified.</span>
        {/* Caret lives on the wrapper so the inner clip-path doesn't crop it. */}
        <span className="cs-hh-typewrap">
          <span className="cs-hh-line2">
            {/* The period sits outside .cs-hh-hardened so the strike crosses
                the word only, while still sharing its gradient→gray fade. */}
            <span className="cs-hh-hardened">
              <span className="cs-hh-hardened-grad">Hardened</span>
              <span className="cs-hh-hardened-gray">Hardened</span>
            </span>
            <span className="cs-hh-hardened-dot">
              <span className="cs-hh-hardened-grad">.</span>
              <span className="cs-hh-hardened-gray">.</span>
            </span>{" "}
            <span className="cs-hh-secure">Secure.</span>
          </span>
        </span>
        <span className="cs-hh-phrase">Built for the AI&nbsp;Era.</span>
      </span>
    </h1>
  );
}
