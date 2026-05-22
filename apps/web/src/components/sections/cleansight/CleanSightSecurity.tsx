/**
 * Pattern-11 partial collapse (Sprint 3 Day 4):
 *   - Lowered `hidden xl:block` / `xl:hidden` -> `lg:block` / `lg:hidden`.
 *     The 1024-1279 dead zone (where neither the desktop chart nor the
 *     mobile fallback rendered cleanly) now picks up the desktop layout.
 *   - Replaced the 8 flat-px `fontSize: 20px / 16px` workflow labels with
 *     `text-body-lg` / `text-body-md` tokens (v3 Consistency Layer).
 *
 * Still owed (v3 plan Sprint 3 follow-up): the workflow-chart geometry
 * (wavy line + 4 nodes + 4 connector lines + 4 labels) is still drawn
 * with 1276-frame absolute coordinates inside a `width: 1276px` chart
 * container. At lg+ (>=1024) the container is wider than 1276 px only
 * at >=1440 viewports, so between 1024-1439 the chart visually overflows
 * the content rail until viewport >= 1440 where it fits. Full collapse
 * to a proportional-scaled (transform: scale(min(1, container/1276)))
 * or percent-coordinate layout is the next step. */
const WORKFLOW = [
  {
    label: "Continuous Visibility",
    body: "Maintain real-time awareness across environments.",
  },
  {
    label: "Risk Prioritization",
    body: "Focus on exploitable inherited vulnerabilities.",
  },
  {
    label: "Built-In Compliance",
    body: "Support audit readiness and policy enforcement.",
  },
  {
    label: "Faster Remediation",
    body: "Reduce operational response time and effort.",
  },
];

export function CleanSightSecurity(): React.ReactElement {
  return (
    <section
      data-section="CleanSightSecurity"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)",
        minHeight: "1708px",
      }}
    >
      {/* Crystal decoration — top-right (xl only) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        src="/images/cleansight/security-crystal.png"
        alt=""
        style={{
          left: "1564px",
          top: "-157px",
          width: "630px",
          height: "578px",
          opacity: 0.4,
          transform: "scaleY(-1) rotate(148.85deg)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Crystal decoration — top-left (xl only) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        src="/images/cleansight/security-crystal.png"
        alt=""
        style={{
          left: "-163px",
          top: "-133px",
          width: "605px",
          height: "506px",
          opacity: 0.4,
          transform: "scaleY(-1) rotate(18.26deg)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ════ PART 1: Feature Cards + Shield ════ */}
      <div className="relative mx-auto max-w-[var(--container-default)] px-4 sm:px-6 pt-section-md">
        {/* Heading — 744px wide, centered */}
        <h2
          className="text-white text-center mx-auto"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 3.23vw, 62px)",
            fontWeight: 600,
            letterSpacing: "-0.05em",
            lineHeight: 1.05,
            maxWidth: "744px",
          }}
        >
          Built for Continuous Container{" "}
          <span
            style={{
              background:
                "linear-gradient(102.33deg, rgb(154, 81, 255) 45.138%, rgb(44, 193, 235) 98.781%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Security
          </span>
        </h2>

        {/* ── Desktop: absolutely-positioned cards + shield ──
            All from Figma (1920px) offset by 322px:
            Left cards:  left=1px,   width=606, height=207, row-gap=44px (top=0 / top=251)
            Right cards: left=682px, width=595, height=207
            Shield:      left=427px, width=444, height=470  */}
        <div
          className="relative hidden lg:block"
          style={{ marginTop: "84px", height: "510px" }}
        >
          {/* Left card — top row */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            className="absolute pointer-events-none select-none"
            src="/images/cleansight/security-card-left.svg"
            alt=""
            style={{ left: "1px", top: "0px", width: "606px", height: "207px" }}
            loading="lazy"
            decoding="async"
          />
          {/* Left card — bottom row */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            className="absolute pointer-events-none select-none"
            src="/images/cleansight/security-card-left.svg"
            alt=""
            style={{ left: "1px", top: "251px", width: "606px", height: "207px" }}
            loading="lazy"
            decoding="async"
          />

          {/* Right card — top row */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            className="absolute pointer-events-none select-none"
            src="/images/cleansight/security-card-right.svg"
            alt=""
            style={{ left: "682px", top: "0px", width: "595px", height: "207px" }}
            loading="lazy"
            decoding="async"
          />
          {/* Right card — bottom row */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            className="absolute pointer-events-none select-none"
            src="/images/cleansight/security-card-right.svg"
            alt=""
            style={{ left: "682px", top: "251px", width: "595px", height: "207px" }}
            loading="lazy"
            decoding="async"
          />

          {/* Shield connector — vertical line top */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            className="absolute pointer-events-none select-none"
            src="/images/cleansight/security-shield-vline.svg"
            alt=""
            style={{ left: "646px", top: "87px", width: "2px", height: "100px" }}
            loading="lazy"
            decoding="async"
          />
          {/* Shield connector — vertical line bottom */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            className="absolute pointer-events-none select-none"
            src="/images/cleansight/security-shield-vline.svg"
            alt=""
            style={{ left: "646px", top: "307px", width: "2px", height: "100px" }}
            loading="lazy"
            decoding="async"
          />

          {/* Shield connector — arc right */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            className="absolute pointer-events-none select-none"
            src="/images/cleansight/security-shield-arc-right.svg"
            alt=""
            style={{ left: "695px", top: "122px", width: "39px", height: "124px" }}
            loading="lazy"
            decoding="async"
          />
          {/* Shield connector — arc left */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            className="absolute pointer-events-none select-none"
            src="/images/cleansight/security-shield-arc-left.svg"
            alt=""
            style={{ left: "552px", top: "122px", width: "39px", height: "124px" }}
            loading="lazy"
            decoding="async"
          />

          {/* Shield — 444×470 container, overflow-hidden clips the large PNG */}
          <div
            className="absolute z-10 overflow-hidden pointer-events-none"
            style={{ left: "427px", top: "0px", width: "444px", height: "470px" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cleansight/security-shield-hero.png"
              alt="CleanSight security shield"
              style={{
                position: "absolute",
                width: "196.86%",
                height: "139.48%",
                left: "-49.08%",
                top: "-19.78%",
                maxWidth: "none",
              }}
            />
          </div>

          {/* Shield logo — viewBox 110.515×129.179, centred over shield
               Shield centre: (427+222, 235) = (649, 235)
               Logo: left=649-55=594, top=235-65=170 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            className="absolute pointer-events-none select-none z-20"
            src="/images/cleansight/security-shield-logo.svg"
            alt=""
            style={{ left: "594px", top: "170px", width: "111px", height: "129px" }}
            loading="lazy"
            decoding="async"
          />

          {/* Text — Runtime Visibility (top-left) */}
          <div className="absolute" style={{ left: "45px", top: "32px", width: "260px" }}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(18px, 1.67vw, 32px)",
                fontWeight: 700,
                letterSpacing: "-0.05em",
                lineHeight: 1.1,
                color: "#111",
              }}
            >
              Runtime Visibility
            </h3>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(13px, 1.15vw, 22px)",
                fontWeight: 400,
                letterSpacing: "-0.05em",
                lineHeight: 1.3,
                color: "#111",
                marginTop: "16px",
              }}
            >
              Track container activity across environments.
            </p>
          </div>

          {/* Text — Compliance Monitoring (bottom-left) */}
          <div className="absolute" style={{ left: "45px", top: "283px", width: "260px" }}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(18px, 1.67vw, 32px)",
                fontWeight: 700,
                letterSpacing: "-0.05em",
                lineHeight: 1.1,
                color: "#111",
              }}
            >
              Compliance Monitoring
            </h3>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(13px, 1.15vw, 22px)",
                fontWeight: 400,
                letterSpacing: "-0.05em",
                lineHeight: 1.3,
                color: "#111",
                marginTop: "16px",
              }}
            >
              Continuously monitor security and compliance posture.
            </p>
          </div>

          {/* Text — Inherited Risk Detection (top-right) */}
          <div className="absolute" style={{ left: "899px", top: "32px", width: "260px" }}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(18px, 1.67vw, 32px)",
                fontWeight: 700,
                letterSpacing: "-0.05em",
                lineHeight: 1.1,
                color: "#111",
              }}
            >
              Inherited Risk Detection
            </h3>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(13px, 1.15vw, 22px)",
                fontWeight: 400,
                letterSpacing: "-0.05em",
                lineHeight: 1.3,
                color: "#111",
                marginTop: "16px",
              }}
            >
              Identify vulnerable dependencies and image exposure.
            </p>
          </div>

          {/* Text — One-Click Remediation (bottom-right) */}
          <div className="absolute" style={{ left: "899px", top: "283px", width: "260px" }}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(18px, 1.67vw, 32px)",
                fontWeight: 700,
                letterSpacing: "-0.05em",
                lineHeight: 1.1,
                color: "#111",
              }}
            >
              One-Click Remediation
            </h3>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(13px, 1.15vw, 22px)",
                fontWeight: 400,
                letterSpacing: "-0.05em",
                lineHeight: 1.3,
                color: "#111",
                marginTop: "16px",
              }}
            >
              Accelerate remediation workflows and response.
            </p>
          </div>
        </div>

        {/* ── Mobile: shield + 2×2 card grid ── */}
        <div className="lg:hidden mt-10">
          <div className="flex justify-center mb-8">
            <div
              className="relative overflow-hidden"
              style={{ width: "220px", height: "234px" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/cleansight/security-shield-hero.png"
                alt="CleanSight security shield"
                style={{
                  position: "absolute",
                  width: "196.86%",
                  height: "139.48%",
                  left: "-49.08%",
                  top: "-19.78%",
                  maxWidth: "none",
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(
              [
                {
                  title: "Runtime Visibility",
                  body: "Track container activity across environments.",
                },
                {
                  title: "Inherited Risk Detection",
                  body: "Identify vulnerable dependencies and image exposure.",
                },
                {
                  title: "Compliance Monitoring",
                  body: "Continuously monitor security and compliance posture.",
                },
                {
                  title: "One-Click Remediation",
                  body: "Accelerate remediation workflows and response.",
                },
              ] as const
            ).map((f) => (
              <div
                key={f.title}
                className="bg-white flex flex-col"
                style={{
                  borderRadius: "32px",
                  padding: "32px",
                  border: "1px solid rgba(44,193,235,0.25)",
                  gap: "16px",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(18px, 4vw, 28px)",
                    fontWeight: 700,
                    letterSpacing: "-0.05em",
                    lineHeight: 1.1,
                    color: "#111",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(13px, 3.5vw, 18px)",
                    fontWeight: 400,
                    letterSpacing: "-0.05em",
                    lineHeight: 1.3,
                    color: "#111",
                  }}
                >
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Divider — 1px hairline, 1280px wide, centred (xl only) */}
      <div
        aria-hidden
        className="hidden lg:block mx-auto"
        style={{ marginTop: "80px", maxWidth: "1280px", height: "1px", overflow: "hidden" }}
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

      {/* ════ PART 2: From Visibility to Action ════
          Figma: 1920×814px block.
          Content-box offset = (1920-1276)/2 = 322px → Figma_left - 322 = content-box left.

          Wavy line (373:1139):  left=331-322=9,  top=342, w=1255, h=511  (viewBox 1257×513)
          Node 1 (22×22):        left=322-322=0,  top=644
          Node 2 (26×26):        left=671-322=349,top=437
          Node 3 (26×26):        left=1163-322=841,top=569
          Node 4 (26×26):        left=1572-322=1250,top=329
          Vline near N1 (292px): flex left=330-322=8,   top=663, h=292
          Vline near N2 (381px): flex left=684-322=362, top=459, h=381
          Vline near N3 (292px): flex left=1176-322=854,top=581, h=292
          Label 1: left=347-322=25,   top=666, w=194
          Label 2: left=704-322=382,  top=339, w=170
          Label 3: left=1192-322=870, top=595, w=194
          Label 4: left=1380-322=1058,top=306, w=184
      */}
      <div
        className="relative overflow-hidden"
        style={{ minHeight: "814px" }}
      >
        {/* Union — right: Figma left=1228, top=252, size=1181 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          className="pointer-events-none select-none absolute hidden lg:block"
          src="/images/cleansight/security-union-right.svg"
          alt=""
          style={{
            left: "calc(1228 / 1920 * 100%)",
            top: "252px",
            width: "1181px",
            height: "1181px",
          }}
          loading="lazy"
          decoding="async"
        />

        {/* Union — left: Figma left=-631, top=55, size=1181 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          className="pointer-events-none select-none absolute hidden lg:block"
          src="/images/cleansight/security-union-left.svg"
          alt=""
          style={{
            left: "calc(-631 / 1920 * 100%)",
            top: "55px",
            width: "1181px",
            height: "1181px",
          }}
          loading="lazy"
          decoding="async"
        />

        {/* Heading — Figma: left=599, top=80, w=753, gap=24 (centred in 1920px) */}
        <div
          className="absolute left-1/2 -translate-x-1/2 text-center text-white"
          style={{
            top: "80px",
            width: "min(753px, 90vw)",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3.23vw, 62px)",
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1.05,
            }}
          >
            From Visibility to{" "}
            <span
              style={{
                background:
                  "linear-gradient(113.87deg, #9A51FF 45.605%, #2CC1EB 93.65%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Action
            </span>
          </h2>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(14px, 1.35vw, 26px)",
              fontWeight: 400,
              letterSpacing: "-0.05em",
              lineHeight: 1.5,
            }}
          >
            Move beyond fragmented visibility with continuous remediation and
            operational security workflows.
          </p>
        </div>

        {/* ── Desktop chart — 1276px content box absolutely centred ── */}
        <div
          className="absolute left-1/2 -translate-x-1/2 hidden lg:block"
          style={{ top: "0px", width: "1276px", height: "814px" }}
        >
          {/* Wavy line: left=9, top=342, w=1255, h=511 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            className="absolute pointer-events-none select-none"
            src="/images/cleansight/security-workflow-line.svg"
            alt=""
            style={{ left: "9px", top: "342px", width: "1255px", height: "511px" }}
            loading="lazy"
            decoding="async"
          />

          {/* Node 1 — Continuous Visibility (22×22) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            className="absolute pointer-events-none select-none"
            src="/images/cleansight/security-node-1.svg"
            alt=""
            style={{ left: "0px", top: "644px", width: "22px", height: "22px" }}
            loading="lazy"
            decoding="async"
          />

          {/* Node 2 — Risk Prioritization (26×26) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            className="absolute pointer-events-none select-none"
            src="/images/cleansight/security-node-2.svg"
            alt=""
            style={{ left: "349px", top: "437px", width: "26px", height: "26px" }}
            loading="lazy"
            decoding="async"
          />

          {/* Node 3 — Built-In Compliance (26×26) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            className="absolute pointer-events-none select-none"
            src="/images/cleansight/security-node-3.svg"
            alt=""
            style={{ left: "841px", top: "569px", width: "26px", height: "26px" }}
            loading="lazy"
            decoding="async"
          />

          {/* Node 4 — Faster Remediation (26×26) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            className="absolute pointer-events-none select-none"
            src="/images/cleansight/security-node-4.svg"
            alt=""
            style={{ left: "1250px", top: "329px", width: "26px", height: "26px" }}
            loading="lazy"
            decoding="async"
          />

          {/*
            Vertical connector lines.
            The SVGs are horizontal (292×2 or 381×2, preserveAspectRatio="none").
            Figma renders them via a flex+rotate90 pattern, mirrored exactly below.
            Outer div: w=0, h=line_length, flex centering → inner rotated img fills height.
          */}

          {/* Vline near Node 1 (292px) — Figma left=330→content:8, top=663 */}
          <div
            aria-hidden
            className="absolute flex items-center justify-center pointer-events-none select-none"
            style={{ left: "8px", top: "663px", width: "0", height: "292px" }}
          >
            <div style={{ transform: "rotate(90deg)", flexShrink: 0 }}>
              <div style={{ position: "relative", width: "292px", height: "0" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  src="/images/cleansight/security-vline-short.svg"
                  style={{
                    position: "absolute",
                    inset: "-2px 0 0 0",
                    width: "292px",
                    height: "2px",
                    display: "block",
                    maxWidth: "none",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Vline near Node 2 (381px tall) — Figma left=684→content:362, top=459 */}
          <div
            aria-hidden
            className="absolute flex items-center justify-center pointer-events-none select-none"
            style={{ left: "362px", top: "459px", width: "0", height: "381px" }}
          >
            <div style={{ transform: "rotate(90deg)", flexShrink: 0 }}>
              <div style={{ position: "relative", width: "381px", height: "0" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  src="/images/cleansight/security-vline-tall.svg"
                  style={{
                    position: "absolute",
                    inset: "-2px 0 0 0",
                    width: "381px",
                    height: "2px",
                    display: "block",
                    maxWidth: "none",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Vline near Node 3 (292px) — Figma left=1176→content:854, top=581 */}
          <div
            aria-hidden
            className="absolute flex items-center justify-center pointer-events-none select-none"
            style={{ left: "854px", top: "581px", width: "0", height: "292px" }}
          >
            <div style={{ transform: "rotate(90deg)", flexShrink: 0 }}>
              <div style={{ position: "relative", width: "292px", height: "0" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  src="/images/cleansight/security-vline-short.svg"
                  style={{
                    position: "absolute",
                    inset: "-2px 0 0 0",
                    width: "292px",
                    height: "2px",
                    display: "block",
                    maxWidth: "none",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Label — "Continuous Visibility": left=25, top=666, w=194 */}
          <div
            className="absolute text-white"
            style={{
              left: "25px",
              top: "666px",
              width: "194px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <p
              className="text-body-lg"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                letterSpacing: "-0.037em",
                lineHeight: 1.3,
              }}
            >
              Continuous Visibility
            </p>
            <p
              className="text-body-md"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                letterSpacing: "-0.037em",
                lineHeight: 1.3,
                opacity: 0.8,
              }}
            >
              Maintain real-time awareness across environments.
            </p>
          </div>

          {/* Label — "Risk Prioritization": left=382, top=339, w=170 */}
          <div
            className="absolute text-white"
            style={{
              left: "382px",
              top: "339px",
              width: "170px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <p
              className="text-body-lg"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                letterSpacing: "-0.037em",
                lineHeight: 1.3,
              }}
            >
              Risk Prioritization
            </p>
            <p
              className="text-body-md"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                letterSpacing: "-0.037em",
                lineHeight: 1.3,
                opacity: 0.8,
              }}
            >
              Focus on exploitable inherited vulnerabilities.
            </p>
          </div>

          {/* Label — "Built-In Compliance": left=870, top=595, w=194 */}
          <div
            className="absolute text-white"
            style={{
              left: "870px",
              top: "595px",
              width: "194px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <p
              className="text-body-lg"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                letterSpacing: "-0.037em",
                lineHeight: 1.3,
              }}
            >
              Built-In Compliance
            </p>
            <p
              className="text-body-md"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                letterSpacing: "-0.037em",
                lineHeight: 1.3,
                opacity: 0.8,
              }}
            >
              Support audit readiness and policy enforcement.
            </p>
          </div>

          {/* Label — "Faster Remediation": left=1058, top=306, w=184 */}
          <div
            className="absolute text-white"
            style={{
              left: "1058px",
              top: "306px",
              width: "184px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <p
              className="text-body-lg"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                letterSpacing: "-0.037em",
                lineHeight: 1.3,
              }}
            >
              Faster Remediation
            </p>
            <p
              className="text-body-md"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                letterSpacing: "-0.037em",
                lineHeight: 1.3,
                opacity: 0.8,
              }}
            >
              Reduce operational response time and effort.
            </p>
          </div>
        </div>

        {/* Mobile fallback */}
        <div
          className="lg:hidden relative mx-auto max-w-[var(--container-default)] px-4 sm:px-6"
          style={{ paddingTop: "240px", paddingBottom: "64px" }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {WORKFLOW.map((w, i) => (
              <div key={w.label} className="flex gap-4 items-start">
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-full text-white font-bold"
                  style={{
                    width: "36px",
                    height: "36px",
                    background: "linear-gradient(to bottom, #239CFF, #005BE3)",
                    fontFamily: "var(--font-display)",
                    // eslint-disable-next-line no-restricted-syntax -- v3 exception: anchored Figma spec inside a constrained component (button/pill/badge/card internal). See RESPONSIVE-AUDIT.md §14.3.
                    fontSize: "14px",
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <p
                    className="text-white font-semibold"
                    style={{
                      fontFamily: "var(--font-display)",
                      // eslint-disable-next-line no-restricted-syntax -- v3 exception: anchored Figma spec inside a constrained component (button/pill/badge/card internal). See RESPONSIVE-AUDIT.md §14.3.
                      fontSize: "18px",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {w.label}
                  </p>
                  <p
                    className="text-white mt-1"
                    style={{
                      fontFamily: "var(--font-display)",
                      // eslint-disable-next-line no-restricted-syntax -- v3 exception: anchored Figma spec inside a constrained component (button/pill/badge/card internal). See RESPONSIVE-AUDIT.md §14.3.
                      fontSize: "15px",
                      opacity: 0.8,
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
