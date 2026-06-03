import Image from "next/image";

/**
 * "The CleanStart Trust Architecture" — four corner product cards around a
 * central 3D-cube card. Ported 1:1 from the Figma 1440-px frame: the card grid
 * is an em-locked stage where `1em === 1 Figma px` (font-size pinned to
 * `calc(100cqw / 1440)`), so the whole composition scales as one unit with no
 * text reflow or overflow, capped at the native design width.
 */

/**
 * Stage unit. `--u` is pinned to `calc(100cqw / 1440)` on the stage, so
 * `u(n)` === n Figma px regardless of an element's own font-size (avoids the
 * `em`-resolves-against-own-font-size trap when a node sets both font + width).
 */
const px = (n: number) => `calc(${n} * var(--u))`;

interface CardData {
  name: string;
  subtitle: string;
  description: string;
  features: string[];
  number: string;
  /** stage-local top-left (px) */
  left: number;
  top: number;
}

const CARDS: CardData[] = [
  {
    name: "Tricorder",
    subtitle: "AI Logic Engine",
    description: "Analyze software before artifacts exist.",
    features: ["Source-level intelligence", "Behavioral graph mapping", "AI-native anomaly detection"],
    number: "1",
    left: 82,
    top: 0,
  },
  {
    name: "CleanImage",
    subtitle: "Trusted Runtime Assembly",
    description: "Assemble minimal, hardened runtime environments.",
    features: ["Minimal runtime images", "BusyBox replacement", "CleanStart OS foundations"],
    number: "3",
    left: 82,
    top: 296,
  },
  {
    name: "CleanCompile",
    subtitle: "Deterministic Reconstruction",
    description: "Rebuild verified software in hermetic environments.",
    features: ["Hermetic build pipelines", "Reproducible outputs", "Cryptographic attestation"],
    number: "2",
    left: 954,
    top: 0,
  },
  {
    name: "The Vault",
    subtitle: "Trusted Runtime Foundations",
    description: "Deliver continuously rebuilt and verifiable outputs.",
    features: ["Zero known CVE foundations", "Shell-less environments", "Continuously verifiable outputs"],
    number: "4",
    left: 954,
    top: 296,
  },
];

const STAGE_W = 1440;
const STAGE_H = 592;
const CARD_W = 404;
const CARD_H = 296;

function CornerCard({ card }: { card: CardData }) {
  return (
    <div
      className="absolute rounded-[24px]"
      style={{
        left: px(card.left),
        top: px(card.top),
        width: px(CARD_W),
        height: px(CARD_H),
        border: "1px solid rgba(255,255,255,0.12)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)",
      }}
    >
      {/* Ghost number */}
      <span
        aria-hidden
        className="pointer-events-none absolute select-none bg-clip-text font-bold opacity-30"
        style={{
          top: px(4),
          right: px(12),
          fontFamily: "var(--font-display)",
          fontSize: px(52),
          lineHeight: 1.1,
          background: "linear-gradient(180deg, #fff 24.2%, rgba(255,255,255,0) 87.1%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {card.number}
      </span>

      {/* Title + subtitle */}
      <p
        className="absolute font-bold leading-none text-white"
        style={{ left: px(24), top: px(24), width: px(356), fontFamily: "var(--font-display)", fontSize: px(32), letterSpacing: "-0.05em" }}
      >
        {card.name}
      </p>
      <p
        className="absolute font-medium leading-none"
        style={{ left: px(24), top: px(64), width: px(356), fontFamily: "var(--font-display)", fontSize: px(26), letterSpacing: "-0.05em", color: "#b23eff" }}
      >
        {card.subtitle}
      </p>

      {/* Description */}
      <p
        className="absolute text-white"
        style={{ left: px(24), top: px(106), width: px(356), fontFamily: "var(--font-display)", fontSize: px(22), letterSpacing: "-0.05em", lineHeight: 1.3 }}
      >
        {card.description}
      </p>

      {/* Feature list */}
      <div className="absolute" style={{ left: px(24), top: px(169), width: px(356) }}>
        {card.features.map((feat, i) => (
          <div key={feat} className="absolute flex items-center" style={{ top: px(i * 37), width: px(356) }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cleanstart-platform/tick-circle.svg"
              alt=""
              aria-hidden
              style={{ width: px(24), height: px(24), marginRight: px(8) }}
              loading="lazy"
              decoding="async"
            />
            <span
              className="text-white"
              style={{ fontFamily: "var(--font-display)", fontSize: px(22), letterSpacing: "-0.05em", lineHeight: 1.3 }}
            >
              {feat}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Center-card edge rail — a rounded stepped-bracket line that hugs the left (or,
 * when `flip`, the right) edge of the card. Rendered from the sharp Figma vector
 * (`preserveAspectRatio:none`, so it fills the box exactly as in Figma) with a
 * CSS glow to match the design's additive light.
 */
function Rail({
  src,
  left,
  top,
  w,
  h,
  flip = false,
}: {
  src: string;
  left: number;
  top: number;
  w: number;
  h: number;
  flip?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      className="absolute"
      style={{
        left: px(left),
        top: px(top),
        width: px(w),
        height: px(h),
        transform: flip ? "scaleX(-1)" : undefined,
        transformOrigin: "center",
        filter: "drop-shadow(0 0 2px rgba(210,119,255,0.9)) drop-shadow(0 0 6px rgba(178,62,255,0.55))",
      }}
      loading="lazy"
      decoding="async"
    />
  );
}

function CenterCard() {
  return (
    <div
      className="absolute overflow-hidden rounded-[24px]"
      style={{
        left: px(486),
        top: px(0),
        width: px(468),
        height: px(584),
        border: "1px solid #9a51ff",
        background: "linear-gradient(-27.6deg, rgba(255,255,255,0) 13.2%, rgba(154,81,255,0.3) 85.3%)",
      }}
    >
      {/* Soft texture wash */}
      <div className="pointer-events-none absolute opacity-30 mix-blend-soft-light" style={{ left: px(-29), top: px(-152), width: px(736), height: px(1031) }}>
        <Image src="/images/cleanstart-platform/arch-bg-texture.png" alt="" fill className="object-cover" sizes="736px" loading="lazy" />
      </div>

      {/* Corner flares */}
      {[
        { left: -106, top: 37 },
        { left: 356, top: 34 },
        { left: -107, top: 339 },
        { left: 356, top: 334 },
      ].map((f) => (
        <div
          key={`${f.left}-${f.top}`}
          aria-hidden
          className="pointer-events-none absolute rounded-full mix-blend-lighten"
          style={{
            left: px(f.left),
            top: px(f.top),
            width: px(218),
            height: px(218),
            background: "radial-gradient(closest-side, rgba(178,62,255,0.5) 0%, rgba(44,193,235,0.18) 45%, transparent 72%)",
          }}
        />
      ))}

      {/* Edge rails — rounded stepped brackets at the left/right card edges */}
      <Rail src="/images/cleanstart-platform/rail-477.svg" left={3} top={146} w={85} h={274.5} />
      <Rail src="/images/cleanstart-platform/rail-475.svg" left={3} top={448} w={80} h={76.5} />
      <Rail src="/images/cleanstart-platform/rail-477.svg" left={378} top={143} w={91} h={274.5} flip />
      <Rail src="/images/cleanstart-platform/rail-475.svg" left={385} top={443} w={80} h={76.5} flip />

      {/* Concentric circles behind the cube */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/cleanstart-platform/arch-circles.svg" alt="" aria-hidden className="absolute mix-blend-soft-light" style={{ left: px(103), top: px(51), width: px(262.67), height: px(262.67) }} loading="lazy" decoding="async" />

      {/* 3D cube */}
      <div className="absolute mix-blend-luminosity" style={{ left: px(130), top: px(71), width: px(204), height: px(204) }}>
        <Image src="/images/cleanstart-platform/arch-cube.png" alt="CleanStart Trust Architecture" width={204} height={204} className="h-full w-full object-contain" loading="lazy" />
      </div>

      {/* SOURCE CODE label */}
      <div
        className="absolute rounded-[24px]"
        style={{
          left: px(83),
          top: px(409),
          width: px(302),
          height: px(147),
          padding: px(12),
          border: "1px solid #9a51ff",
          background: "linear-gradient(-15.2deg, rgba(71,30,192,0.63) 66.4%, rgba(178,62,255,0.63) 75.5%)",
        }}
      >
        <p
          className="text-center font-bold text-white"
          style={{ fontFamily: "var(--font-display)", fontSize: px(32), letterSpacing: "-0.05em", lineHeight: 1 }}
        >
          SOURCE CODE
        </p>
        <p
          className="text-center text-white"
          style={{ marginTop: px(12), fontFamily: "var(--font-display)", fontSize: px(22), letterSpacing: "-0.05em", lineHeight: 1.3 }}
        >
          Verified repositories and trusted upstream software sources.
        </p>
      </div>
    </div>
  );
}

/** Glowing vertical connector between mobile stack cards (Figma "vector lines"). */
function ArchConnector() {
  return (
    <div className="relative flex h-10 w-full items-center justify-center" aria-hidden>
      {/* soft purple halo */}
      <div
        className="absolute size-20 rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(178,62,255,0.5) 0%, transparent 70%)", filter: "blur(10px)" }}
      />
      {/* bright beam */}
      <div
        className="relative h-full w-[2px] rounded-full"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, #c98bff 50%, rgba(255,255,255,0.05) 100%)",
          boxShadow: "0 0 8px 1.5px rgba(178,62,255,0.75)",
        }}
      />
    </div>
  );
}

function MobileCard({ card }: { card: CardData }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6"
      style={{
        border: "1px solid rgba(154,81,255,0.4)",
        background: "linear-gradient(135deg, rgba(154,81,255,0.14) 0%, rgba(71,30,192,0.06) 100%)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute right-4 top-2 select-none bg-clip-text font-bold opacity-30"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "44px",
          lineHeight: 1.1,
          background: "linear-gradient(180deg, #fff 24%, rgba(255,255,255,0) 87%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {card.number}
      </span>
      <p className="font-bold text-white" style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h4)", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
        {card.name}
      </p>
      <p className="mt-1 font-medium" style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-body-sm)", letterSpacing: "-0.02em", color: "#b23eff" }}>
        {card.subtitle}
      </p>
      <p className="mt-3 text-white/85" style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body-sm)", letterSpacing: "-0.02em", lineHeight: 1.4 }}>
        {card.description}
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {card.features.map((feat) => (
          <li key={feat} className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/cleanstart-platform/tick-circle.svg" alt="" aria-hidden className="size-5 shrink-0" loading="lazy" decoding="async" />
            <span className="text-white/90" style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body-sm)", letterSpacing: "-0.02em" }}>
              {feat}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MobileCubeCard() {
  return (
    <div
      className="relative flex flex-col items-center overflow-hidden rounded-3xl px-6 pb-6 pt-8"
      style={{ border: "1px solid #9a51ff", background: "linear-gradient(-27.6deg, rgba(255,255,255,0) 13.2%, rgba(154,81,255,0.3) 85.3%)" }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-soft-light">
        <Image src="/images/cleanstart-platform/arch-bg-texture.png" alt="" fill className="object-cover" sizes="360px" loading="lazy" />
      </div>
      <div className="relative flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/cleanstart-platform/arch-circles.svg" alt="" aria-hidden className="absolute size-[190px] mix-blend-soft-light" loading="lazy" decoding="async" />
        <Image src="/images/cleanstart-platform/arch-cube.png" alt="CleanStart Trust Architecture" width={150} height={150} className="relative mix-blend-luminosity" loading="lazy" />
      </div>
      <div
        className="relative mt-6 w-full max-w-[260px] rounded-2xl p-3 text-center"
        style={{ border: "1px solid #9a51ff", background: "linear-gradient(-15.2deg, rgba(71,30,192,0.63) 66.4%, rgba(178,62,255,0.63) 75.5%)" }}
      >
        <p className="font-bold text-white" style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h4)", letterSpacing: "-0.03em" }}>
          SOURCE CODE
        </p>
        <p className="mt-1.5 text-white" style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body-sm)", letterSpacing: "-0.02em", lineHeight: 1.35 }}>
          Verified repositories and trusted upstream software sources.
        </p>
      </div>
    </div>
  );
}

export function PlatformTrustArchitecture() {
  return (
    <section
      aria-label="The CleanStart Trust Architecture"
      className="relative w-full overflow-hidden"
      style={{ background: "linear-gradient(180deg, #151021 0%, #131e8f 62.5%, #471ec0 100%)" }}
    >
      {/* Header — responsive */}
      <div className="mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          className="mx-auto flex flex-col items-center gap-4 text-center text-white"
          style={{
            maxWidth: "949px",
            paddingTop: "clamp(64px, 6.9vw, 100px)",
            paddingBottom: "clamp(40px, 4.2vw, 60px)",
          }}
        >
          <h2
            className="w-full font-bold"
            style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-display)", letterSpacing: "-0.05em", lineHeight: 1.1 }}
          >
            The CleanStart Trust{" "}
            <span
              className="bg-clip-text"
              style={{
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundImage: "linear-gradient(119deg, #9a51ff 71.3%, #2cc1eb 98.8%)",
              }}
            >
              Architecture
            </span>
          </h2>
          <p
            className="opacity-80"
            style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-lead)", letterSpacing: "-0.04em", lineHeight: 1.4 }}
          >
            AI-native trust reconstruction. Deterministic by design.
          </p>
        </div>
      </div>

      {/* Mobile: cube card on top, then product cards (order 1→4) joined by
          glowing vertical connector lines (lg hides this) */}
      <div className="mx-auto flex max-w-[360px] flex-col px-6 pb-[clamp(48px,6vw,80px)] lg:hidden">
        <MobileCubeCard />
        {[...CARDS]
          .sort((a, b) => Number(a.number) - Number(b.number))
          .map((card) => (
            <div key={`m-${card.name}`} className="contents">
              <ArchConnector />
              <MobileCard card={card} />
            </div>
          ))}
      </div>

      {/* Desktop: em-locked card composition */}
      <div className="relative mx-auto hidden w-full lg:block" style={{ maxWidth: `${STAGE_W}px`, containerType: "inline-size" }}>
        <div
          className="relative"
          style={
            {
              width: "100%",
              aspectRatio: `${STAGE_W} / ${STAGE_H}`,
              "--u": `calc(100cqw / ${STAGE_W})`,
            } as React.CSSProperties
          }
        >
          {CARDS.map((card) => (
            <CornerCard key={card.name} card={card} />
          ))}
          <CenterCard />
        </div>
      </div>

      <div style={{ height: "clamp(64px, 6.9vw, 100px)" }} />
    </section>
  );
}
