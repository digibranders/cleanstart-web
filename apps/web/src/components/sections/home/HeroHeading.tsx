// Home hero H1 with the "Focus Settle + Living Accent" motion combo.
//
// Server component (no "use client") — the effect is pure CSS, so zero client JS
// ships for it and the full heading text is present in the server HTML. That is
// load-bearing: the H1 is the LCP element, so the text must paint at first render
// (see the cs-hh-* / cs-hero-reveal rules in globals.css). Typography stays on
// the role tokens (--fs-display-home / --fs-display-ls) exactly as before.
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
      <span className="cs-hh-phrase">Verified.</span>{" "}
      <span className="cs-hh-phrase">Secure.</span>{" "}
      <span className="cs-hh-phrase">
        Built for the <span className="cs-hh-accent">AI&nbsp;Era</span>.
      </span>
    </h1>
  );
}
