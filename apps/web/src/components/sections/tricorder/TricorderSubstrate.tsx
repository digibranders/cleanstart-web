import Image from "next/image";
import Link from "next/link";
import { Clock3, Code2, Radar } from "lucide-react";

import { Container, Section } from "@/components/layout";
import { FlowBeam } from "@/components/ui/FlowBeam";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";

/**
 * "One Intelligence Layer. Multiple Security Decisions." — Tricorder rendered
 * literally as the layer the products stand on. The three product badges (the
 * site's own hexagonal product art, shared with the homepage factory) float on
 * glass pedestals; a current runs down from each into a lit floor that recedes
 * in perspective, and the Tricorder emblem is set into that floor with the
 * four analysis stages laid along it. The homepage already draws Tricorder as
 * the "Intelligence Center" bar the product cards plug into — this is the same
 * idea, built as a scene.
 *
 * Motion: the beams flow (FlowBeam), a scan band crosses the floor, the emblem
 * breathes. All CSS, all off under prefers-reduced-motion. Below lg the floor
 * becomes a compact layer panel and the pedestals stack.
 *
 * Last section on the page: the bottom padding reserves the footer CTA's
 * overlap zone (see Footer.tsx layout contract).
 */

type DecisionIcon = "release" | "build" | "fleet";

interface Product {
  key: string;
  title: string;
  desc: string;
  decision: string;
  icon: DecisionIcon;
  href: string;
  art: string;
  artAlt: string;
  /** Tint for the pedestal glow and the decision chip. */
  tint: string;
}

const PRODUCTS: Product[] = [
  {
    key: "images",
    title: "Clean Images",
    desc: "Verify images before release.",
    decision: "Release-time decisions",
    icon: "release",
    href: "/cleanstart-images",
    art: "/images/cleanstart-factory/clean-images-2.webp",
    artAlt: "Clean Images badge: a stack of hardened image layers with a verified shield",
    tint: "#5b9bff",
  },
  {
    key: "libraries",
    title: "Clean Libraries",
    desc: "Trust dependencies before they enter your build.",
    decision: "Build-time decisions",
    icon: "build",
    href: "/clean-libraries",
    art: "/images/cleanstart-factory/clean-libraries-2.webp",
    artAlt: "Clean Libraries badge: verified library volumes with a package seal",
    tint: "#34d399",
  },
  {
    key: "cleansight",
    title: "CleanSight",
    desc: "Map risk across your container estate.",
    decision: "Fleet-level intelligence",
    icon: "fleet",
    href: "/cleansight",
    art: "/images/cleanstart-factory/cleansight-2.webp",
    artAlt: "CleanSight badge: a dependency map under a magnifying lens",
    tint: "#a974ff",
  },
];

const STAGES = [
  { label: "Analyze", color: "#2dd4bf" },
  { label: "Compare", color: "#5b9bff" },
  { label: "Correlate", color: "#a974ff" },
  { label: "Enrich", color: "#f7a35c" },
] as const;

function DecisionGlyph({ icon, size }: { icon: DecisionIcon; size: number }): React.ReactElement {
  const props = { size, strokeWidth: 1.8, "aria-hidden": true } as const;
  switch (icon) {
    case "release":
      return <Clock3 {...props} />;
    case "build":
      return <Code2 {...props} />;
    case "fleet":
      return <Radar {...props} />;
  }
}

/** A product standing on the layer: badge art over a lit pedestal, name, decision. */
function Pedestal({ product, priority }: { product: Product; priority: boolean }): React.ReactElement {
  return (
    <Link
      href={product.href}
      className="group relative flex h-full w-full flex-col items-center overflow-hidden text-center outline-none transition-transform duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#33BAEC]"
      style={{
        borderRadius: "var(--radius-cs-card)",
        padding: "clamp(24px, 2.2vw, 32px) clamp(20px, 2vw, 28px) clamp(22px, 2vw, 28px)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.025) 100%)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.10), 0 30px 60px -36px rgba(0,0,0,0.8)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      {/* Tinted hairline along the top edge — the product's colour, not a border. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${product.tint} 50%, transparent)`,
          opacity: 0.9,
        }}
      />
      {/* Light pool behind the badge. */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{
          top: "-40px",
          width: "260px",
          height: "260px",
          background: `radial-gradient(closest-side, color-mix(in srgb, ${product.tint} 34%, transparent) 0%, transparent 70%)`,
          filter: "blur(6px)",
        }}
      />

      <div
        className="relative transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-[1.03]"
        style={{ width: "clamp(136px, 12vw, 172px)", aspectRatio: "1 / 1" }}
      >
        <Image
          src={product.art}
          alt={product.artAlt}
          fill
          sizes="(min-width: 1024px) 172px, 136px"
          priority={priority}
          draggable={false}
          className="select-none object-contain"
          style={{ filter: "drop-shadow(0 18px 24px rgba(0,0,0,0.45))" }}
        />
      </div>
      {/* The pad the badge floats over — a flattened ellipse of the tint. */}
      <span
        aria-hidden
        className="pointer-events-none relative -mt-3 block h-[14px] w-[112px] rounded-[50%]"
        style={{
          background: `radial-gradient(50% 50% at 50% 50%, color-mix(in srgb, ${product.tint} 55%, transparent) 0%, transparent 100%)`,
          filter: "blur(3px)",
        }}
      />

      <h3
        className="relative mt-4 font-display text-white"
        style={{ fontSize: "var(--fs-h4)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2 }}
      >
        {product.title}
      </h3>
      <p
        className="relative mb-5 mt-2 max-w-[260px] font-sans text-white/70"
        style={{ fontSize: "var(--fs-body)", lineHeight: 1.5, letterSpacing: "-0.01em", textWrap: "balance" }}
      >
        {product.desc}
      </p>

      <span
        className="relative mt-auto inline-flex items-center gap-2 rounded-full py-1.5 pl-2.5 pr-3.5 pt-1.5 font-display"
        style={{
          fontSize: "var(--fs-caption)",
          fontWeight: 600,
          letterSpacing: "0.01em",
          color: `color-mix(in srgb, ${product.tint} 70%, #ffffff)`,
          background: `color-mix(in srgb, ${product.tint} 14%, transparent)`,
          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${product.tint} 38%, transparent)`,
        }}
      >
        <DecisionGlyph icon={product.icon} size={15} />
        {product.decision}
      </span>

      <span
        aria-hidden
        className="pointer-events-none absolute right-5 top-5 text-white/35 transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 17 17 7" />
          <path d="M8 7h9v9" />
        </svg>
      </span>
    </Link>
  );
}

/** The Tricorder mark set into the floor: a bevelled hex in the product-art palette, the lens inside. */
function Emblem({ size }: { size: number }): React.ReactElement {
  return (
    <div className="cs-tri-emblem relative" style={{ width: size, height: size }}>
      <span
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          inset: "-45%",
          background: "radial-gradient(closest-side, rgba(154,81,255,0.55) 0%, rgba(44,193,235,0.18) 45%, transparent 72%)",
          filter: "blur(8px)",
        }}
      />
      <svg viewBox="0 0 100 100" className="relative h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="tri-emblem-rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7fe9ff" />
            <stop offset="45%" stopColor="#3b7bff" />
            <stop offset="100%" stopColor="#c05cff" />
          </linearGradient>
          <linearGradient id="tri-emblem-face" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d2a7a" />
            <stop offset="100%" stopColor="#0b0d2c" />
          </linearGradient>
          <linearGradient id="tri-emblem-sheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Outer bevel */}
        <polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5" fill="url(#tri-emblem-rim)" />
        {/* Inner face */}
        <polygon points="50,12 83,31 83,69 50,88 17,69 17,31" fill="url(#tri-emblem-face)" />
        <polygon points="50,12 83,31 83,50 17,50 17,31" fill="url(#tri-emblem-sheen)" />
        <polygon points="50,12 83,31 83,69 50,88 17,69 17,31" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" />
        {/* The lens */}
        <g fill="none" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="50" cy="50" r="16" />
          <path d="M50 27v7M50 66v7M27 50h7M66 50h7" />
          <path d="m42.5 50.5 5.2 5.2 10-10.6" />
        </g>
      </svg>
    </div>
  );
}

/** The four stages, laid along the floor under the emblem. */
function StageRail(): React.ReactElement {
  return (
    <ol className="flex flex-wrap items-center justify-center gap-y-2" aria-label="Analysis stages">
      {STAGES.map((s, i) => (
        <li key={s.label} className="flex items-center">
          {i > 0 ? (
            <span
              aria-hidden
              className="mx-1 hidden h-px w-6 sm:block"
              style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.35), rgba(255,255,255,0.05))" }}
            />
          ) : null}
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-display text-white/85"
            style={{
              fontSize: "var(--fs-caption)",
              fontWeight: 600,
              letterSpacing: "0.02em",
              background: "rgba(10,12,40,0.72)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14), 0 10px 24px -14px rgba(0,0,0,0.8)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          >
            <span aria-hidden className="block h-[6px] w-[6px] rounded-full" style={{ background: s.color, boxShadow: `0 0 10px ${s.color}` }} />
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** The lit floor: a gridded plane receding in perspective, with a scan band crossing it. */
function Floor(): React.ReactElement {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 select-none"
      style={{ height: "340px", perspective: "1000px", perspectiveOrigin: "50% 0%" }}
    >
      {/* Far edge = element width (transform-origin is the top edge), so the plane
          starts exactly under the brand line and only the near edge widens. */}
      <div
        className="absolute inset-x-0 top-0 h-[520px] overflow-hidden"
        style={{
          transform: "rotateX(64deg)",
          transformOrigin: "50% 0%",
          backgroundImage:
            "radial-gradient(52% 70% at 50% 0%, rgba(154,81,255,0.55) 0%, rgba(154,81,255,0) 100%), linear-gradient(rgba(150,140,255,0.30) 1px, transparent 1px), linear-gradient(90deg, rgba(150,140,255,0.30) 1px, transparent 1px), linear-gradient(180deg, rgba(19,30,143,0.85) 0%, rgba(21,16,33,0) 100%)",
          backgroundSize: "100% 100%, 100% 64px, 64px 100%, 100% 100%",
          WebkitMaskImage:
            "linear-gradient(180deg, #000 0%, #000 42%, rgba(0,0,0,0) 92%), linear-gradient(90deg, transparent 0%, #000 16%, #000 84%, transparent 100%)",
          maskImage:
            "linear-gradient(180deg, #000 0%, #000 42%, rgba(0,0,0,0) 92%), linear-gradient(90deg, transparent 0%, #000 16%, #000 84%, transparent 100%)",
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
        }}
      >
        {/* Scan band travelling across the plane. */}
        <div
          className="cs-tri-scan absolute inset-y-0 w-[26%]"
          style={{
            background:
              "linear-gradient(90deg, rgba(44,193,235,0) 0%, rgba(44,193,235,0.28) 50%, rgba(44,193,235,0) 100%)",
          }}
        />
      </div>
      {/* The far edge: a crisp brand line with a bloom under it. */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, rgba(44,193,235,0) 0%, #2cc1eb 18%, #9a51ff 50%, #2cc1eb 82%, rgba(44,193,235,0) 100%)",
          boxShadow: "0 0 18px rgba(120,150,255,0.9)",
        }}
      />
      <div
        className="absolute inset-x-[14%] -top-3 h-14"
        style={{
          background: "linear-gradient(180deg, rgba(120,140,255,0) 0%, rgba(120,140,255,0.22) 50%, rgba(120,140,255,0) 100%)",
          filter: "blur(6px)",
        }}
      />
    </div>
  );
}

function SceneDesktop(): React.ReactElement {
  return (
    <div className="relative mx-auto hidden w-full max-w-[1100px] lg:block">
      {/* Pedestals. */}
      <RevealStagger className="relative z-10 grid grid-cols-3 gap-7">
        {PRODUCTS.map((p, i) => (
          <RevealItem key={p.key} className="h-full">
            <Pedestal product={p} priority={i === 0} />
          </RevealItem>
        ))}
      </RevealStagger>

      {/* Currents from each pedestal down into the layer, with a flare where they land. */}
      <div className="relative z-10 grid h-[72px] grid-cols-3 gap-7">
        {PRODUCTS.map((p, i) => (
          <div key={p.key} aria-hidden className="relative">
            <FlowBeam
              className="absolute inset-y-0 left-1/2 -translate-x-1/2"
              style={{ ["--beam-delay" as string]: `${i * 0.14}s` }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cleanstart-factory/flare.webp"
              alt=""
              className="pointer-events-none absolute left-1/2 select-none"
              style={{
                bottom: "-96px",
                width: "150px",
                height: "auto",
                transform: "translateX(-50%)",
                mixBlendMode: "screen",
                opacity: 0.95,
              }}
              loading="lazy"
              decoding="async"
            />
          </div>
        ))}
      </div>

      {/* The layer. */}
      <div className="relative" style={{ height: "300px" }}>
        <Floor />
        <div className="absolute inset-x-0 top-9 z-10 flex flex-col items-center">
          <Emblem size={104} />
          <p
            className="mt-4 font-display text-white"
            style={{ fontSize: "var(--fs-h5)", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}
          >
            Tricorder
          </p>
          <p className="mt-0.5 font-sans text-white/60" style={{ fontSize: "var(--fs-caption)", letterSpacing: "0.01em" }}>
            Software intelligence
          </p>
          <div className="mt-5">
            <StageRail />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Below lg: the pedestals stack, a single current drops into a compact layer panel. */
function SceneMobile(): React.ReactElement {
  return (
    <div className="flex flex-col items-center lg:hidden">
      <RevealStagger className="grid w-full max-w-[440px] grid-cols-1 gap-4 sm:max-w-[720px] sm:grid-cols-3 sm:gap-3">
        {PRODUCTS.map((p) => (
          <RevealItem key={p.key} className="h-full">
            <Pedestal product={p} priority={false} />
          </RevealItem>
        ))}
      </RevealStagger>
      <div aria-hidden className="relative h-14 w-full">
        <FlowBeam className="absolute inset-y-0 left-1/2 -translate-x-1/2" />
      </div>
      <div
        className="relative flex w-full max-w-[720px] flex-col items-center overflow-hidden px-6 py-7 text-center"
        style={{
          borderRadius: "var(--radius-cs-card)",
          background: "linear-gradient(180deg, #151021 0%, #131E8F 71.2%, #551ECE 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 30px 60px -36px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.10)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "url(/images/cleanstart-factory/diagonal-lines.png)",
            backgroundRepeat: "repeat",
            backgroundSize: "22px 22px",
            mixBlendMode: "luminosity",
            opacity: 0.45,
          }}
        />
        <div className="relative">
          <Emblem size={88} />
        </div>
        <p
          className="relative mt-4 font-display text-white"
          style={{ fontSize: "var(--fs-h5)", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}
        >
          Tricorder
        </p>
        <p className="relative mt-0.5 font-sans text-white/60" style={{ fontSize: "var(--fs-caption)" }}>
          Software intelligence
        </p>
        <div className="relative mt-5">
          <StageRail />
        </div>
      </div>
    </div>
  );
}

export function TricorderSubstrate(): React.ReactElement {
  return (
    <Section
      id="one-intelligence-layer"
      padding="none"
      className="overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #151021 0%, #131e8f 67%, #471ec0 107%)",
        scrollMarginTop: "var(--cs-header-h)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/cleansight/stats-union.svg"
        alt=""
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          right: "-20px",
          top: "-206px",
          width: "469px",
          height: "488px",
          mixBlendMode: "overlay",
          transform: "rotate(-150deg) scaleY(-1)",
          opacity: 0.9,
        }}
        loading="lazy"
        decoding="async"
      />
      <Container
        className="relative py-section-lg"
        style={{ paddingBottom: "max(var(--spacing-section-cta), 175px)" }}
      >
        <Reveal header>
          <div className="mx-auto max-w-[820px] text-center">
            <h2
              className="font-display text-white"
              style={{ fontSize: "var(--fs-h2)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.08, textWrap: "balance" }}
            >
              One Intelligence Layer. Multiple Security Decisions.
            </h2>
            <p
              className="mx-auto mt-6 max-w-[700px] font-sans text-white/80"
              style={{ fontSize: "var(--fs-lead)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.5, textWrap: "balance" }}
            >
              Tricorder powers CleanStart with a shared intelligence substrate,
              bringing consistent software analysis wherever components enter
              and run.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 lg:mt-20">
          <SceneDesktop />
          <SceneMobile />
        </div>
      </Container>
    </Section>
  );
}
