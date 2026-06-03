/**
 * "Trust Begins at the Source" — circular flow diagram.
 *
 * The diagram is a 1:1 port of the Figma 1440-px frame. Every node, arrow,
 * connector line and text label is positioned/sized in `em`, where the stage's
 * font-size is pinned to `calc(100cqw / 1440)` — i.e. **1em === 1 Figma px**.
 * Because the whole composition shares that one unit, it scales as a single
 * locked illustration: positions, art and text shrink together with the
 * container width, so labels never reflow or overflow regardless of viewport.
 * The scope is capped at 1440 px so it never scales beyond the native design.
 */

const px = (n: number) => `${n}em`;

interface FlowNode {
  icon: string;
  /** native Figma top-left (px) of the 72px ball */
  left: number;
  top: number;
}

const NODES: FlowNode[] = [
  { icon: "/images/cleanstart-platform/trust-ball-icon-2.svg", left: 772.99, top: 78 }, // top
  { icon: "/images/cleanstart-platform/trust-ball-icon-1.svg", left: 1099.99, top: 460 }, // right
  { icon: "/images/cleanstart-platform/trust-ball-icon-4.svg", left: 597.99, top: 730 }, // bottom
  { icon: "/images/cleanstart-platform/trust-ball-icon-3.svg", left: 267.99, top: 339 }, // left
];

interface FlowLabel {
  title: string;
  body: string;
  /** ball icon (mobile stack pairs icon + label in one card) */
  icon: string;
  left: number;
  top: number;
}

const LABELS: FlowLabel[] = [
  {
    title: "Analyze Before Artifacts Exist",
    body: "Source-level intelligence before packaging begins.",
    icon: "/images/cleanstart-platform/trust-ball-icon-2.svg",
    left: 424.99,
    top: 193,
  },
  {
    title: "Rebuild From Verified Source",
    body: "Deterministic reconstruction inside hermetic environments.",
    icon: "/images/cleanstart-platform/trust-ball-icon-1.svg",
    left: 751.99,
    top: 226,
  },
  {
    title: "Assemble Minimal Runtimes",
    body: "Only the required components. Nothing is unnecessary.",
    icon: "/images/cleanstart-platform/trust-ball-icon-4.svg",
    left: 424.99,
    top: 451,
  },
  {
    title: "Deliver Trusted Foundations",
    body: "Continuously rebuilt and verifiable runtime environments.",
    icon: "/images/cleanstart-platform/trust-ball-icon-3.svg",
    left: 751.99,
    top: 498,
  },
];

interface FlowLine {
  src: string;
  left: number;
  top: number;
  w: number;
  h: number;
  transform?: string;
}

const LINES: FlowLine[] = [
  { src: "/images/cleanstart-platform/trust-flow-line-1.svg", left: 409.25, top: 61.96, w: 462.38, h: 346.09 },
  {
    src: "/images/cleanstart-platform/trust-flow-line-2.svg",
    left: 736.56,
    top: 202.04,
    w: 462.24,
    h: 345.96,
    transform: "rotate(180deg) scaleX(-1)",
  },
  {
    src: "/images/cleanstart-platform/trust-flow-line-3.svg",
    left: 569.38,
    top: 474,
    w: 462.38,
    h: 345.96,
    transform: "rotate(180deg)",
  },
  {
    src: "/images/cleanstart-platform/trust-flow-line-3.svg",
    left: 242.06,
    top: 321.14,
    w: 462.24,
    h: 345.96,
    transform: "scaleX(-1)",
  },
];

interface FlowArrow {
  left: number;
  top: number;
  size: number;
  rotate: number;
}

const ARROWS: FlowArrow[] = [
  { left: 898.99, top: 76, size: 92, rotate: 0 },
  { left: 1088.99, top: 635, size: 92.37, rotate: 89.77 },
  { left: 426, top: 718, size: 92, rotate: 180 },
  { left: 258, top: 189, size: 92, rotate: -90 },
];

/** Diagram stage native dimensions (Figma frame width × diagram band height). */
const STAGE_W = 1440;
const STAGE_H = 820;

export function PlatformTrustSource() {
  return (
    <section
      aria-label="Trust Begins at the Source"
      className="relative w-full overflow-hidden bg-[#f6f6f6]"
    >
      {/* Corner decorations — pinned to the 1440 frame corners, behind content */}
      <div className="pointer-events-none absolute inset-0 mx-auto max-w-[1440px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-platform/trust-corner-glow.svg"
          alt=""
          aria-hidden
          className="absolute -left-[73px] -top-[141px] size-[315px] opacity-60"
          loading="lazy"
          decoding="async"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-platform/trust-corner-glow.svg"
          alt=""
          aria-hidden
          className="absolute -right-[66px] bottom-[40px] size-[315px] opacity-60"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Header — responsive (site type scale) */}
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          className="mx-auto flex flex-col items-center gap-8 text-center"
          style={{ maxWidth: "1122px", paddingTop: "clamp(64px, 5.5vw, 80px)" }}
        >
          <h2
            className="w-full font-bold text-[#111]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-display)",
              letterSpacing: "-0.05em",
              lineHeight: 1.1,
            }}
          >
            Trust Begins at the{" "}
            <span
              className="bg-clip-text"
              style={{
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundImage: "linear-gradient(123deg, #9a51ff 52.1%, #2cc1eb 98.8%)",
              }}
            >
              Source
            </span>
          </h2>
          <div
            className="flex flex-col gap-2 text-center text-[#333]/80"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-lead)",
              letterSpacing: "-0.06em",
              lineHeight: 1.4,
            }}
          >
            <p>Security must begin before software becomes a package, container, or runtime artifact.</p>
            <p>
              CleanStart analyzes software intent, reconstructs verified components, and assembles minimal runtime
              foundations before inherited risk can propagate downstream.
            </p>
          </div>
        </div>
      </div>

      {/* Diagram — locked composition, uniformly scaled via container-query unit */}
      {/* Mobile: vertical card stack with down-arrows between (lg hides this) */}
      <div className="mx-auto flex max-w-[420px] flex-col items-center gap-4 px-6 pb-[clamp(48px,5vw,80px)] pt-10 lg:hidden">
        {LABELS.map((label, i) => (
          <div key={`m-${label.title}`} className="contents">
            <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-black/5 bg-white p-6 text-center shadow-sm">
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-full shadow-[0_4px_11px_rgba(28,60,142,0.33)]"
                style={{ background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={label.icon} alt="" aria-hidden className="size-8 object-contain" loading="lazy" decoding="async" />
              </div>
              <p
                className="font-bold text-[#111]"
                style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h4)", letterSpacing: "-0.03em", lineHeight: 1.15 }}
              >
                {label.title}
              </p>
              <p
                className="text-[#555]"
                style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body-sm)", letterSpacing: "-0.02em", lineHeight: 1.4 }}
              >
                {label.body}
              </p>
            </div>
            {i < LABELS.length - 1 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/images/cleanstart-platform/trust-arrow-right.svg"
                alt=""
                aria-hidden
                className="size-8 rotate-90"
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
        ))}
      </div>

      {/* Desktop: locked circular flow diagram */}
      <div
        className="relative mx-auto hidden w-full lg:block"
        style={{ maxWidth: `${STAGE_W}px`, containerType: "inline-size" }}
      >
        <div
          className="relative"
          style={{
            width: "100%",
            aspectRatio: `${STAGE_W} / ${STAGE_H}`,
            // 1em === 1 Figma px (capped at native size by the max-width above)
            fontSize: `calc(100cqw / ${STAGE_W})`,
          }}
        >
          {/* Connector lines (behind nodes) */}
          {LINES.map((l) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`line-${l.left}-${l.top}`}
              src={l.src}
              alt=""
              aria-hidden
              className="absolute"
              style={{
                left: px(l.left),
                top: px(l.top),
                width: px(l.w),
                height: px(l.h),
                transform: l.transform,
              }}
              loading="lazy"
              decoding="async"
            />
          ))}

          {/* Directional arrows */}
          {ARROWS.map((a) => (
            <div
              key={`arrow-${a.left}-${a.top}`}
              className="absolute flex items-center justify-center"
              style={{ left: px(a.left), top: px(a.top), width: px(a.size), height: px(a.size) }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/cleanstart-platform/trust-arrow-right.svg"
                alt=""
                aria-hidden
                style={{ width: px(a.size), height: px(a.size), transform: `rotate(${a.rotate}deg)` }}
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}

          {/* Nodes (blue balls) */}
          {NODES.map((n) => (
            <div
              key={n.icon}
              className="absolute flex items-center justify-center rounded-full"
              style={{
                left: px(n.left),
                top: px(n.top),
                width: px(72),
                height: px(72),
                background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
                boxShadow: `0 ${px(4.629)} ${px(10.903)} rgba(28,60,142,0.33)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={n.icon}
                alt=""
                aria-hidden
                style={{ width: px(40.5), height: px(40.5) }}
                className="object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}

          {/* Text labels */}
          {LABELS.map((t) => (
            <div
              key={t.title}
              className="absolute flex flex-col"
              style={{ left: px(t.left), top: px(t.top), width: px(263), gap: px(24) }}
            >
              <p
                className="font-bold text-[#111]"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: px(32),
                  letterSpacing: "-0.05em",
                  lineHeight: 1,
                }}
              >
                {t.title}
              </p>
              <p
                className="text-[#333]"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: px(20),
                  letterSpacing: "-0.05em",
                  lineHeight: 1.4,
                }}
              >
                {t.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: "clamp(48px, 5vw, 80px)" }} />
    </section>
  );
}
