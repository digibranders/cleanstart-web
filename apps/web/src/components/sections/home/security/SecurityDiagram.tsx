"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";

import { cn } from "@/lib/cn";
import { FlowArrow } from "@/components/ui/FlowArrow";
import { ShieldCheck } from "./ShieldCheck";
import { VerifyBeams } from "./VerifyBeams";

type Stage = { icon: string; title: string; desc: string };
type Guarantee = { title: string; desc: string };

const STAGES: Stage[] = [
  { icon: "icon-open-source.svg", title: "Open Source", desc: "External sources and repositories" },
  { icon: "icon-dependencies.svg", title: "Dependencies", desc: "Direct and transitive dependencies" },
  { icon: "icon-build.svg", title: "Build", desc: "Your build environment" },
  { icon: "icon-registry.svg", title: "Public Registry", desc: "Images & packages in public registries" },
  { icon: "icon-deploy.svg", title: "Deploy", desc: "Deployed across environments" },
  { icon: "icon-runtime.svg", title: "Runtime", desc: "Running in production at scale" },
];

const GUARANTEES: Guarantee[] = [
  { title: "Verified Sources", desc: "Curated and verified upstream sources" },
  { title: "Trusted Dependencies", desc: "Scanned, curated, and continuously validated" },
  { title: "Reproducible Pipelines", desc: "Deterministic, repeatable, and auditable builds" },
  { title: "Verified Artifacts", desc: "Zero-CVE images, signed and attested" },
  { title: "Continuous Visibility", desc: "Posture, drift, and risk visibility across your environment" },
  { title: "Proven Integrity", desc: "Continuously verified integrity from build to runtime" },
];

const titleStyle = {
  fontSize: "var(--fs-h3)",
  lineHeight: 1.1,
  letterSpacing: "-0.03em",
} as const;

const descStyle = {
  fontFamily: "var(--font-sora), Sora, sans-serif",
  fontSize: "var(--fs-body)",
  lineHeight: 1.35,
  letterSpacing: "-0.01em",
} as const;

const NOISE_TEXTURE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E\")";

type LaneState = {
  hovered: number | null;
  setHovered: (i: number | null) => void;
};

function StageItem({
  stage,
  index,
  hovered,
  setHovered,
}: { stage: Stage; index: number } & LaneState): React.ReactElement {
  const dimmed = hovered !== null && hovered !== index;
  return (
    <div
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "cs-sec-rise flex w-[166px] flex-col items-center gap-4 text-center",
        dimmed && "cs-sec-dim",
      )}
      style={{ ["--d" as string]: `${index * 0.07}s` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/images/security/${stage.icon}`}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="size-12 select-none"
      />
      <div className="flex flex-col gap-2">
        <h3 className="font-display font-bold text-white" style={titleStyle}>
          {stage.title}
        </h3>
        <p className="text-white/70" style={descStyle}>
          {stage.desc}
        </p>
      </div>
    </div>
  );
}

function GuaranteeItem({
  item,
  index,
  hovered,
  setHovered,
}: { item: Guarantee; index: number } & LaneState): React.ReactElement {
  const dimmed = hovered !== null && hovered !== index;
  return (
    <div
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "cs-sec-rise relative z-10 flex w-[176px] flex-col items-center gap-4 text-center",
        dimmed && "cs-sec-dim",
      )}
      style={{
        ["--d" as string]: `${0.5 + index * 0.09}s`,
        ["--ld" as string]: `${index * 0.12}s`,
      }}
    >
      <div className="relative grid place-items-center" style={{ width: 68, height: 68 }}>
        <div className="cs-sec-shield-halo pointer-events-none absolute inset-0 rounded-full" />
        <ShieldCheck className="cs-sec-shield relative size-[68px] select-none" />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="font-display font-bold text-white" style={titleStyle}>
          {item.title}
        </h3>
        <p className="text-white/70" style={descStyle}>
          {item.desc}
        </p>
      </div>
    </div>
  );
}

export function SecurityDiagram(): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { margin: "0px 0px -80px 0px", amount: 0.05 });
  const [started, setStarted] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    if (inView) {
      setStarted(true);
      return;
    }
    // Fail-open: if the observer hasn't reported an already-visible element
    // shortly after mount (a race seen on client-side navigation), reveal via a
    // geometry check so the section is never stranded hidden. Mirrors Reveal.
    const id = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < vh && rect.bottom > 0) setStarted(true);
    }, 250);
    return () => window.clearTimeout(id);
  }, [inView]);

  // `on`   → build-in one-shots have fired (or reduced-motion shows final state)
  // `anim` → ambient loops run only while the section is on-screen
  const on = started || reduce;
  const anim = inView && !reduce;

  return (
    <div
      ref={ref}
      className={cn(
        "relative mt-14 w-full",
        on && "cs-sec-on",
        anim && "cs-sec-anim",
      )}
    >
      {/* Lifecycle bar. `isolate` scopes the noise mix-blend to this panel and
          keeps compositing stable; no backdrop-filter — it re-rasterised every
          frame while the arrows/stages animate, which produced GPU tile-seam
          lines on real hardware (invisible in the software-rendered preview). */}
      <div
        className="relative isolate overflow-hidden rounded-[24px] border border-[#dab6f3] px-8 py-8"
        style={{
          background:
            "linear-gradient(100deg, rgba(217,217,217,0.22) 0%, rgba(80,80,80,0.04) 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: NOISE_TEXTURE,
            backgroundSize: "180px 180px",
            opacity: 0.22,
            mixBlendMode: "overlay",
          }}
        />
        <div className="relative z-10 flex flex-nowrap items-start justify-between gap-x-3">
          {STAGES.map((stage, i) => (
            <Fragment key={stage.title}>
              <StageItem stage={stage} index={i} hovered={hovered} setHovered={setHovered} />
              {i < STAGES.length - 1 && (
                <FlowArrow
                  className="mt-3 flex h-7 shrink-0"
                  style={{ ["--arrow-delay" as string]: `${i * 0.12}s` }}
                />
              )}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Verification current */}
      <VerifyBeams hovered={hovered} />

      {/* Trust enclosure */}
      <div
        className="relative overflow-hidden rounded-[24px] border border-[#dab6f3]"
        style={{
          background: "rgba(28,28,28,0.7)",
          boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
        }}
      >
        {/* Custom diagonal light field (replaces the factory-overlay raster).
            A static base sheen for depth, plus a bright shine that sweeps across
            on an infinite loop — clipped by the enclosure's overflow-hidden so
            it never exposes an edge. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, transparent 26%, rgba(96,156,255,0.10) 39%, transparent 47%), linear-gradient(115deg, transparent 56%, rgba(120,180,255,0.13) 66%, transparent 74%)",
            mixBlendMode: "screen",
          }}
        />
        {/* Specular sheen — a soft diagonal glint that eases across, then rests.
            The gradient is pre-softened (no filter: blur) so the sweep animates
            on transform/opacity only and stays GPU-composited (no stutter). */}
        <div
          aria-hidden
          className="cs-sec-sheen pointer-events-none absolute"
          style={{
            top: "-25%",
            bottom: "-25%",
            left: "-48%",
            width: "52%",
            background:
              "linear-gradient(100deg, transparent 0%, rgba(178,206,255,0.09) 38%, rgba(212,230,255,0.20) 50%, rgba(178,206,255,0.09) 62%, transparent 100%)",
            mixBlendMode: "screen",
            transform: "rotate(9deg)",
            willChange: "transform, opacity",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
          style={{
            background:
              "radial-gradient(60% 100% at 50% 100%, rgba(60,150,255,0.28) 0%, rgba(60,150,255,0) 70%)",
          }}
        />

        <div className="relative flex flex-col gap-6 px-10 pb-6 pt-9">
          <div className="flex flex-nowrap items-start justify-between gap-x-2">
            {GUARANTEES.map((item, i) => (
              <Fragment key={item.title}>
                <GuaranteeItem item={item} index={i} hovered={hovered} setHovered={setHovered} />
                {i < GUARANTEES.length - 1 && (
                  <div
                    aria-hidden
                    className="block h-[120px] w-px shrink-0 self-center"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent, rgba(255,255,255,0.18), transparent)",
                    }}
                  />
                )}
              </Fragment>
            ))}
          </div>

          <div
            aria-hidden
            className="pointer-events-none flex select-none items-center justify-center gap-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/security/cube-mark.svg"
              alt=""
              className="w-auto"
              style={{ height: "var(--fs-h1)", aspectRatio: "53.86 / 62" }}
            />
            <span
              className="font-display font-normal"
              style={{
                fontSize: "var(--fs-h1)",
                lineHeight: 1,
                letterSpacing: "-0.05em",
                backgroundImage:
                  "linear-gradient(180deg, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.34) 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
                filter:
                  "drop-shadow(0 1px 1px rgba(0,0,0,0.30)) drop-shadow(0 0 0.5px rgba(255,255,255,0.35))",
              }}
            >
              CleanStart
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
