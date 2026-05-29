import { Reveal } from "@/components/ui/Reveal";

// Title strings use \n to force a 2-line wrap; FeatureCard sets
// whiteSpace: "pre-line" so the break renders.
const FEATURE_CARDS = [
  {
    title: "Runtime\nVisibility",
    body: "Track container activity across environments.",
  },
  {
    title: "Inherited Risk\nDetection",
    body: "Identify vulnerable dependencies and image exposure.",
  },
  {
    title: "Compliance\nMonitoring",
    body: "Continuously monitor security and compliance posture.",
  },
  {
    title: "One-Click\nRemediation",
    body: "Accelerate remediation workflows and response.",
  },
] as const;

const WORKFLOW = [
  {
    label: "Continuous\nVisibility",
    body: "Maintain real-time awareness across environments.",
  },
  {
    label: "Risk Prioritization",
    body: "Focus on exploitable inherited vulnerabilities.",
  },
  {
    label: "Built-In\nCompliance",
    body: "Support audit readiness and policy enforcement.",
  },
  {
    label: "Faster Remediation",
    body: "Reduce operational response time and effort.",
  },
] as const;

function FeatureCard({
  title,
  body,
  side,
  variant = "shield",
}: {
  title: string;
  body: string;
  /** "left" / "right" puts extra padding on the inner edge (the shield side).
      Omit for symmetric padding when the card stands alone. */
  side?: "left" | "right";
  /** "shield": desktop card under the floating shield (2-line title, left-aligned).
      "stack":  mobile/standalone card (1-line title, centered, no shield interaction). */
  variant?: "shield" | "stack";
}) {
  const pad = "clamp(24px, 2.6vw, 44px)";
  const innerPad = "clamp(80px, 8vw, 140px)";
  const paddingLeft = side === "left" ? pad : side === "right" ? innerPad : pad;
  const paddingRight = side === "left" ? innerPad : side === "right" ? pad : pad;
  const isStack = variant === "stack";
  // On mobile/stack we render the title with no forced break so \n collapses to a space.
  const displayTitle = isStack ? title.replace(/\n/g, " ") : title;
  return (
    <div
      className="bg-white flex flex-col justify-center"
      style={{
        borderRadius: "24px",
        paddingTop: pad,
        paddingBottom: pad,
        paddingLeft: isStack ? pad : paddingLeft,
        paddingRight: isStack ? pad : paddingRight,
        gap: "12px",
        minHeight: isStack ? undefined : "clamp(180px, 15vw, 220px)",
        textAlign: isStack ? "center" : "left",
        alignItems: isStack ? "center" : "stretch",
      }}
    >
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-h3)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
          color: "#0F1419",
          whiteSpace: isStack ? "normal" : "pre-line",
        }}
      >
        {displayTitle}
      </h3>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-body)",
          fontWeight: 400,
          letterSpacing: "-0.01em",
          lineHeight: 1.5,
          color: "#4B5563",
        }}
      >
        {body}
      </p>
    </div>
  );
}

export function CleanSightSecurity(): React.ReactElement {
  return (
    <section
      data-section="CleanSightSecurity"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)",
      }}
    >
      {/* Decorative crystals — desktop only. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        src="/images/cleansight/security-crystal.png"
        alt=""
        style={{
          right: "-80px",
          top: "-157px",
          width: "min(630px, 35vw)",
          height: "auto",
          opacity: 0.4,
          transform: "scaleY(-1) rotate(148.85deg)",
        }}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        src="/images/cleansight/security-crystal.png"
        alt=""
        style={{
          left: "-163px",
          top: "-133px",
          width: "min(605px, 32vw)",
          height: "auto",
          opacity: 0.4,
          transform: "scaleY(-1) rotate(18.26deg)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* PART 1: Heading + Cards + Shield. */}
      <div
        className="relative mx-auto"
        style={{
          maxWidth: "var(--container-default)",
          paddingLeft: "clamp(16px, 4vw, 80px)",
          paddingRight: "clamp(16px, 4vw, 80px)",
          paddingTop: "var(--spacing-section-md)",
        }}
      >
        <Reveal header>
          <h2
            className="text-white text-center mx-auto"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h2)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              maxWidth: "744px",
            }}
          >
            Built for Continuous Container{" "}
            <span className="cs-text-gradient-impact">Security</span>
          </h2>
        </Reveal>

        {/* Desktop layout: 2×2 card grid with the shield floating dead-centre on top.
            Cards have extra padding on the inner edge so text never collides with the shield. */}
        <div
          className="hidden lg:block relative"
          style={{ marginTop: "clamp(48px, 6vw, 84px)" }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "auto auto",
              columnGap: "clamp(20px, 2vw, 40px)",
              rowGap: "clamp(20px, 2vw, 40px)",
            }}
          >
            <FeatureCard {...FEATURE_CARDS[0]} side="left" />
            <FeatureCard {...FEATURE_CARDS[1]} side="right" />
            <FeatureCard {...FEATURE_CARDS[2]} side="left" />
            <FeatureCard {...FEATURE_CARDS[3]} side="right" />
          </div>

          {/* Shield — absolutely centered on top of the 2×2 grid. The asset
              has the CleanStart logo baked in and is cropped tight to the
              shield, so a simple <img> at native aspect is all that's needed. */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "clamp(240px, 26vw, 360px)",
              aspectRatio: "444 / 470",
              zIndex: 10,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cleansight/security-shield-complete.png"
              alt="CleanSight security shield"
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                objectFit: "contain",
              }}
            />
          </div>
        </div>

        {/* Mobile / tablet: no shield — just a vertical stack of centered cards */}
        <div className="lg:hidden mt-10 flex flex-col gap-4">
          {FEATURE_CARDS.map((f) => (
            <FeatureCard key={f.title} {...f} variant="stack" />
          ))}
        </div>
      </div>

      {/* Hairline divider */}
      <div
        aria-hidden
        className="hidden lg:block mx-auto"
        style={{
          marginTop: "clamp(48px, 5vw, 80px)",
          maxWidth: "1280px",
          paddingLeft: "clamp(16px, 4vw, 80px)",
          paddingRight: "clamp(16px, 4vw, 80px)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          className="pointer-events-none select-none w-full"
          src="/images/cleansight/security-divider.svg"
          alt=""
          style={{ display: "block", width: "100%", height: "1px" }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* PART 2: From Visibility to Action — workflow chart.
          paddingBottom is intentionally 0 so the chart's curve reaches the
          bottom edge of the section. */}
      <div
        className="relative mx-auto"
        style={{
          maxWidth: "var(--container-default)",
          paddingLeft: "clamp(16px, 4vw, 80px)",
          paddingRight: "clamp(16px, 4vw, 80px)",
          paddingTop: "clamp(48px, 5vw, 80px)",
          paddingBottom: "0",
        }}
      >
        {/* Decorative unions — desktop only. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          className="pointer-events-none select-none absolute hidden lg:block"
          src="/images/cleansight/security-union-right.svg"
          alt=""
          style={{
            right: "-30vw",
            top: "200px",
            width: "min(1181px, 60vw)",
            height: "auto",
            opacity: 0.6,
          }}
          loading="lazy"
          decoding="async"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          className="pointer-events-none select-none absolute hidden lg:block"
          src="/images/cleansight/security-union-left.svg"
          alt=""
          style={{
            left: "-30vw",
            top: "0px",
            width: "min(1181px, 60vw)",
            height: "auto",
            opacity: 0.6,
          }}
          loading="lazy"
          decoding="async"
        />

        <div
          className="relative text-center text-white mx-auto flex flex-col"
          style={{ maxWidth: "753px", gap: "24px" }}
        >
          <Reveal header>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-h2)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
              }}
            >
              From Visibility to{" "}
              <span className="cs-text-gradient-impact">Action</span>
            </h2>
          </Reveal>
          <Reveal header delay={0.15} y={20}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.4,
              }}
            >
              Move beyond fragmented visibility with continuous remediation and
              operational security workflows.
            </p>
          </Reveal>
        </div>

        {/* Desktop chart — locked-group layout.
            container-type: inline-size makes every cqi unit inside resolve
            against THIS box's width. Combined with aspectRatio (height locked
            to width) and %-based positions, the curve + nodes + dashed lines +
            labels all scale together as one unit, with no relative drift at
            any viewport. */}
        <div
          className="hidden lg:block relative mx-auto"
          style={{
            marginTop: "clamp(40px, 4vw, 64px)",
            width: "100%",
            maxWidth: "1276px",
            // Taller aspect leaves room at the bottom for label text to fit
            // without clipping while the curve still hugs the section bottom.
            aspectRatio: "1276 / 540",
            containerType: "inline-size",
          }}
        >
          {/* Wavy connector line — natural aspect 1257:513. Pinned to bottom so
              the curve's lowest stretch reaches the chart's bottom edge. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            className="absolute pointer-events-none select-none"
            src="/images/cleansight/security-workflow-line.svg"
            alt=""
            style={{
              left: "1%",
              bottom: "0%",
              width: "98%",
              aspectRatio: "1257 / 513",
            }}
            loading="lazy"
            decoding="async"
          />

          {/* Node positions derived from the actual SVG path (viewBox 1257×513):
             - Curve start (left edge):  svg(1, 316)    → chart (1%,  64%)
             - First peak (bezier apex): svg(357, 113)  → chart (29%, 26%)
             - Valley (lowest mid pt):   svg(733, 230)  → chart (58%, 48%)
             - Right edge top:           svg(1256, 1)   → chart (99%, 6%)
             where chart x = 1% + (svg_x/1257)*98% and chart y = (30 + svg_y*510/513)/540*100%. */}
          {/* Per-pointer label positioning — each `labelY` is tuned independently
              so every label sits at a hand-picked distance from its own dot. */}
          {/* Step 1 — Continuous Visibility. Dot 64%, label 70% (gap 6%, below). */}
          <WorkflowStep
            x="1%"
            nodeSrc="security-node-1.svg"
            nodeY="64%"
            labelY="70%"
            labelAlign="left"
            label={WORKFLOW[0].label}
            body={WORKFLOW[0].body}
          />
          {/* Step 2 — Risk Prioritization. Dot 26%, label 12% (gap 14%, above). */}
          <WorkflowStep
            x="29%"
            nodeSrc="security-node-2.svg"
            nodeY="26%"
            labelY="12%"
            labelAlign="left"
            label={WORKFLOW[1].label}
            body={WORKFLOW[1].body}
          />
          {/* Step 3 — Built-In Compliance. Dot 48%, label 56% (gap 8%, below). */}
          <WorkflowStep
            x="58%"
            nodeSrc="security-node-3.svg"
            nodeY="48%"
            labelY="56%"
            labelAlign="left"
            label={WORKFLOW[2].label}
            body={WORKFLOW[2].body}
          />
          {/* Step 4 — Faster Remediation. Dot 6%, label anchored above the dot.
              labelAnchorY="bottom" means labelY refers to the BOTTOM edge of the
              label, so label extends upward from labelY=2%. Combined with align="right"
              the label sits above-and-left of the dot, just clear of the curve. */}
          <WorkflowStep
            x="99%"
            nodeSrc="security-node-4.svg"
            nodeY="6%"
            labelY="2%"
            labelAlign="right"
            labelAnchorY="bottom"
            label={WORKFLOW[3].label}
            body={WORKFLOW[3].body}
          />
        </div>

        {/* Mobile fallback — vertical glow rail + glassmorphic card stack.
            Mirrors the timeline pattern used on /for-ciso CisoSolution so the
            two visualisations feel consistent across the marketing site. */}
        <div
          className="lg:hidden relative mx-auto mt-10 pb-[clamp(48px,10vw,96px)]"
          style={{ maxWidth: "420px" }}
        >
          {/* Vertical connector rail — soft cyan glow that fades top/bottom. */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: "20px",
              top: "20px",
              bottom: "20px",
              width: "2px",
              background:
                "linear-gradient(180deg, rgba(122,189,255,0.0) 0%, rgba(122,189,255,0.55) 12%, rgba(122,189,255,0.55) 88%, rgba(122,189,255,0.0) 100%)",
              borderRadius: "32px",
              boxShadow: "0 0 12px rgba(122,189,255,0.35)",
            }}
          />

          <div className="flex flex-col gap-4">
            {WORKFLOW.map((w) => (
              <div
                key={w.label}
                style={{ position: "relative", paddingLeft: "48px" }}
              >
                {/* Bright cyan glow node anchored on the rail at the
                    vertical centre of the card. */}
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: "11px",
                    top: "50%",
                    width: "20px",
                    height: "20px",
                    transform: "translateY(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, #ffffff 0%, #7ad6ff 35%, rgba(36,140,255,0) 75%)",
                    boxShadow:
                      "0 0 16px rgba(122,189,255,0.9), 0 0 32px rgba(80,160,255,0.65)",
                    mixBlendMode: "plus-lighter",
                  }}
                />
                {/* Outer halo for the glow node. */}
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: "1px",
                    top: "50%",
                    width: "40px",
                    height: "40px",
                    transform: "translateY(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(122,189,255,0.45) 0%, rgba(122,189,255,0) 65%)",
                    pointerEvents: "none",
                    mixBlendMode: "plus-lighter",
                  }}
                />

                {/* Glassmorphic card */}
                <div
                  className="relative flex flex-col overflow-hidden"
                  style={{
                    borderRadius: "16px",
                    border: "1px solid rgba(122,189,255,0.35)",
                    background:
                      "linear-gradient(180deg, rgba(46,72,180,0.32) 0%, rgba(58,42,160,0.32) 60%, rgba(85,30,206,0.32) 100%)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    padding: "20px 22px",
                    gap: "8px",
                  }}
                >
                  <p
                    className="text-white font-semibold"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--fs-h5)",
                      letterSpacing: "-0.03em",
                      lineHeight: 1.2,
                      /* Collapse forced \n line-breaks from the WORKFLOW data
                         into spaces so each title renders on one line. */
                      whiteSpace: "normal",
                      margin: 0,
                    }}
                  >
                    {w.label.replace(/\n/g, " ")}
                  </p>
                  <p
                    className="text-white/75"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-body-sm)",
                      lineHeight: 1.45,
                      margin: 0,
                    }}
                  >
                    {w.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkflowStep({
  nodeSrc,
  x,
  nodeY,
  labelY,
  labelAlign,
  labelAnchorY = "top",
  label,
  body,
}: {
  nodeSrc: string;
  x: string;
  nodeY: string;
  /** Absolute Y position of the label (% of chart height). */
  labelY: string;
  /** Horizontal placement of the label relative to the vertical drop line at x. */
  labelAlign: "left" | "right" | "center";
  /** Which edge of the label labelY refers to:
      "top" (default) → labelY is the top of the label, label extends downward.
      "bottom" → labelY is the bottom of the label, label extends upward. */
  labelAnchorY?: "top" | "bottom";
  label: string;
  body: string;
}) {
  // Node size scales with chart width via cqi.
  const nodeSize = "clamp(14px, 1.8cqi, 22px)";
  // Gap between the vertical line and the label edge.
  const gap = "clamp(6px, 0.8cqi, 12px)";

  let xTransform: string;
  let textAlign: "left" | "right" | "center";
  switch (labelAlign) {
    case "left":
      xTransform = `translateX(${gap})`;
      textAlign = "left";
      break;
    case "right":
      xTransform = `translateX(calc(-100% - ${gap}))`;
      textAlign = "right";
      break;
    case "center":
      xTransform = "translateX(-50%)";
      textAlign = "center";
      break;
  }
  const yTransform = labelAnchorY === "bottom" ? " translateY(-100%)" : "";
  const labelTransform = `${xTransform}${yTransform}`;

  return (
    <>
      {/* Vertical dashed drop line — runs from the dot center down to chart bottom */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          left: x,
          top: nodeY,
          bottom: "0%",
          width: "0",
          borderLeft: "1px dashed rgba(255,255,255,0.4)",
          transform: "translateX(-0.5px)",
        }}
      />
      {/* Node circle */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src={`/images/cleansight/${nodeSrc}`}
        alt=""
        className="absolute pointer-events-none select-none"
        style={{
          left: x,
          top: nodeY,
          width: nodeSize,
          height: nodeSize,
          transform: "translate(-50%, -50%)",
        }}
        loading="lazy"
        decoding="async"
      />
      {/* Label — anchored at (x, labelY); transform shifts it left / right / centered around the drop line */}
      <WorkflowLabel
        label={label}
        body={body}
        textAlign={textAlign}
        style={{
          left: x,
          top: labelY,
          transform: labelTransform,
        }}
      />
    </>
  );
}

function WorkflowLabel({
  label,
  body,
  style,
  textAlign = "left",
}: {
  label: string;
  body: string;
  style: React.CSSProperties;
  textAlign?: "left" | "right" | "center";
}) {
  return (
    <div
      className="absolute text-white"
      style={{
        ...style,
        // Width scales with the chart (cqi) so labels never collide between viewports.
        width: "clamp(110px, 13cqi, 180px)",
        textAlign,
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(12px, 1.4cqi, 18px)",
          fontWeight: 600,
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
          whiteSpace: "pre-line",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "clamp(10px, 1cqi, 13px)",
          fontWeight: 400,
          letterSpacing: "-0.01em",
          lineHeight: 1.45,
          opacity: 0.75,
        }}
      >
        {body}
      </p>
    </div>
  );
}
