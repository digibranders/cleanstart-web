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
  { icon: "icon-open-source.svg", title: "Source", desc: "Curated upstream software" },
  { icon: "icon-dependencies.svg", title: "Dependencies", desc: "Direct and transitive packages" },
  { icon: "icon-build.svg", title: "Build", desc: "Controlled build environments" },
  { icon: "icon-registry.svg", title: "Registry", desc: "Published software artifacts" },
  { icon: "icon-deploy.svg", title: "Deploy", desc: "Managed deployment environments" },
  { icon: "icon-runtime.svg", title: "Runtime", desc: "Running production workloads" },
];

const GUARANTEES: Guarantee[] = [
  { title: "Verified Sources", desc: "Curated upstream sources" },
  { title: "Trusted Dependencies", desc: "Continuously validated" },
  { title: "Reproducible Pipelines", desc: "Deterministic build pipelines" },
  { title: "Verified Artifacts", desc: "Signed and attested artifacts" },
  { title: "Continuous Visibility", desc: "Posture and drift visibility" },
  { title: "Proven Integrity", desc: "Continuously verified integrity" },
];

const LANE_COUNT = STAGES.length;

/* Cascade timing (ms). One cycle ≈ 10s — deliberately slow and SEQUENTIAL: each
   lane fully resolves before the next begins. Per lane: the stage glows, a trust
   comet glides down (TRAVEL), the guarantee card BUILDS (box ignites, interior
   materialises, shield draws), then a persistent dashed "current" lights and
   stays. LANE_GAP > TRAVEL so the card has landed and its current is established
   before the next stage fires. After the sixth card the wordmark ignites and the
   enclosure floods (climax), holds, then everything resets and the cycle loops. */
const LANE_GAP = 1200;
const TRAVEL = 1000;
const START_DELAY = 450;
/* Beat between the landing glow and the dotted-current + card-content reveal. */
const GLOW_LEAD = 150;
const CLIMAX_AT = (LANE_COUNT - 1) * LANE_GAP + TRAVEL + 400;
const RESET_AT = CLIMAX_AT + 1900;
const CYCLE = RESET_AT + 800;

const titleStyle = {
  fontSize: "var(--fs-h3)",
  lineHeight: 1.1,
  letterSpacing: "-0.03em",
} as const;

/* Guarantee-card titles use the smaller h4 role: the cards are boxed and dense,
   so the longest words ("Dependencies", "Reproducible") would otherwise overrun
   the card walls at the h3 size. Stage titles above keep h3 (they aren't boxed). */
const cardTitleStyle = {
  fontSize: "var(--fs-h4)",
  lineHeight: 1.12,
  letterSpacing: "-0.02em",
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
  lit,
  hovered,
  setHovered,
}: { stage: Stage; index: number; lit: boolean } & LaneState): React.ReactElement {
  const dimmed = hovered !== null && hovered !== index;
  return (
    <div
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      data-lit={lit ? "true" : undefined}
      className={cn(
        "cs-sec-rise cs-sec-stage flex w-[166px] flex-col items-center gap-4 text-center",
        dimmed && "cs-sec-dim",
      )}
      style={{ ["--d" as string]: `${index * 0.07}s` }}
    >
      <div className="relative grid size-12 place-items-center">
        <div className="cs-sec-stage-halo pointer-events-none absolute -inset-2 rounded-full" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/images/security/${stage.icon}`}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="relative size-12 select-none"
        />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="font-display font-semibold text-white" style={titleStyle}>
          {stage.title}
        </h3>
        <p className="text-white/70" style={descStyle}>
          {stage.desc}
        </p>
      </div>
    </div>
  );
}

function GuaranteeCard({
  item,
  index,
  built,
  hovered,
  setHovered,
}: {
  item: Guarantee;
  index: number;
  built: boolean;
} & LaneState): React.ReactElement {
  const dimmed = hovered !== null && hovered !== index;
  return (
    <div
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      data-built={built ? "true" : undefined}
      className={cn(
        "cs-sec-rise cs-sec-card relative z-10 flex flex-col items-center justify-center px-3 py-6 text-center",
        dimmed && "cs-sec-dim",
      )}
      style={{ ["--d" as string]: `${0.5 + index * 0.09}s` }}
    >
      <div className="cs-sec-card-inner flex flex-col items-center gap-4">
        <div className="relative grid place-items-center" style={{ width: 68, height: 68 }}>
          <div className="cs-sec-shield-halo pointer-events-none absolute inset-0 rounded-full" />
          <ShieldCheck className="cs-sec-shield relative size-[68px] select-none" />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="font-display font-semibold text-white" style={cardTitleStyle}>
            {item.title}
          </h3>
          <p className="text-white/70" style={descStyle}>
            {item.desc}
          </p>
        </div>
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

  // Cascade state, driven by the JS master clock below.
  const [litCount, setLitCount] = useState(reduce ? LANE_COUNT : 0);
  const [climax, setClimax] = useState<boolean>(!!reduce);
  const [flying, setFlying] = useState<ReadonlySet<number>>(() => new Set());
  const [dotted, setDotted] = useState<ReadonlySet<number>>(() =>
    reduce ? new Set(Array.from({ length: LANE_COUNT }, (_, i) => i)) : new Set(),
  );
  const [landing, setLanding] = useState<ReadonlySet<number>>(() => new Set());
  const [arrowOn, setArrowOn] = useState<ReadonlySet<number>>(() =>
    reduce ? new Set(Array.from({ length: LANE_COUNT - 1 }, (_, i) => i)) : new Set(),
  );

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
  // `anim` → the verification cascade runs only while the section is on-screen
  const on = started || reduce;
  const anim = inView && !reduce;

  useEffect(() => {
    if (reduce) {
      setLitCount(LANE_COUNT);
      setClimax(true);
      setFlying(new Set());
      setDotted(new Set(Array.from({ length: LANE_COUNT }, (_, i) => i)));
      setLanding(new Set());
      setArrowOn(new Set(Array.from({ length: LANE_COUNT - 1 }, (_, i) => i)));
      return;
    }
    if (!anim) return;

    const timers: number[] = [];
    let cancelled = false;
    const at = (delay: number, fn: () => void): void => {
      timers.push(window.setTimeout(fn, delay));
    };

    const toggle = (
      set: typeof setFlying,
      i: number,
      add: boolean,
    ): void =>
      set((s) => {
        const next = new Set(s);
        if (add) next.add(i);
        else next.delete(i);
        return next;
      });

    const runCycle = (): void => {
      if (cancelled) return;
      setLitCount(0);
      setClimax(false);
      setFlying(new Set());
      setDotted(new Set());
      setLanding(new Set());
      setArrowOn(new Set());

      for (let i = 0; i < LANE_COUNT; i += 1) {
        const land = i * LANE_GAP + TRAVEL;
        // 1. Launch the trust comet down lane i. As the wave reaches this stage,
        //    surge the outgoing lifecycle arrow toward the next stage.
        at(i * LANE_GAP, () => toggle(setFlying, i, true));
        if (i < LANE_COUNT - 1) {
          at(i * LANE_GAP + 150, () => toggle(setArrowOn, i, true));
        }
        // 2. Comet reaches the end: retire it and bloom the fixed landing glow.
        at(land, () => {
          toggle(setFlying, i, false);
          toggle(setLanding, i, true);
        });
        // 3. Instantly after the glow: light the persistent dashed current AND
        //    reveal the card's content together.
        at(land + GLOW_LEAD, () => {
          toggle(setDotted, i, true);
          setLitCount((c) => Math.max(c, i + 1));
        });
        at(land + 700, () => toggle(setLanding, i, false));
      }
      at(CLIMAX_AT, () => setClimax(true));
      at(RESET_AT, () => {
        setLitCount(0);
        setClimax(false);
        setDotted(new Set());
        setArrowOn(new Set());
      });
      at(CYCLE, runCycle);
    };

    at(START_DELAY, runCycle);
    return () => {
      cancelled = true;
      for (const t of timers) window.clearTimeout(t);
    };
  }, [anim, reduce]);

  return (
    <div
      ref={ref}
      data-climax={climax ? "true" : undefined}
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
              <StageItem
                stage={stage}
                index={i}
                lit={flying.has(i)}
                hovered={hovered}
                setHovered={setHovered}
              />
              {i < STAGES.length - 1 && (
                <FlowArrow
                  className={cn(
                    "cs-sec-arrow mt-3 flex h-7 shrink-0",
                    arrowOn.has(i) && "cs-sec-arrow-on",
                  )}
                  style={{ ["--arrow-delay" as string]: `${i * 0.12}s` }}
                />
              )}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Verification current */}
      <VerifyBeams
        flying={flying}
        dotted={dotted}
        landing={landing}
        hovered={hovered}
        durMs={TRAVEL}
      />

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
        {/* Climax flood — aurora bloom once all six lanes verify. */}
        <div
          aria-hidden
          className="cs-sec-flood pointer-events-none absolute inset-0"
        />

        <div className="relative flex flex-col gap-6 px-[18px] pb-6 pt-9">
          {/* 6-up grid: even columns with gap === the container's side padding,
              so the left gutter, every inter-card gap, and the right gutter are
              all identical (18px). Cards auto-size equally to fill. */}
          <div className="grid grid-cols-6 items-stretch gap-[18px]">
            {GUARANTEES.map((item, i) => (
              <GuaranteeCard
                key={item.title}
                item={item}
                index={i}
                built={i < litCount}
                hovered={hovered}
                setHovered={setHovered}
              />
            ))}
          </div>

          <div
            data-climax={climax ? "true" : undefined}
            aria-hidden
            className="cs-sec-wordmark pointer-events-none flex select-none items-center justify-center gap-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/security/cs-logomark.png"
              alt=""
              className="w-auto"
              style={{ height: "var(--fs-h1)", aspectRatio: "54 / 62" }}
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
