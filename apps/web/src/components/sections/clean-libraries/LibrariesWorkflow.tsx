"use client";

import { Fragment, useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";

type FeatureIcon = "source" | "verify" | "policy";

interface FeatureRow {
  icon: FeatureIcon;
  label: string;
}

interface Stage {
  /** Path to the stage's 3D glass icon (transparent PNG, 1024²). */
  image: string;
  title: string;
  accent: string;
  tint: string;
  /** Single description — every stage except the featured one. */
  body?: string;
  /** Icon-led feature rows — only the prominent Clean Library stage. */
  features?: FeatureRow[];
  featured?: boolean;
}

const STAGES: Stage[] = [
  {
    image: "/images/clean-libraries/flow-developers.webp",
    title: "Developers & AI Coding Assistants",
    accent: "#5b9bff",
    tint: "rgba(91,155,255,0.14)",
    body: "Build software using your preferred development tools.",
  },
  {
    // Reuse the homepage Clean Libraries product logo (shared asset).
    image: "/images/cleanstart-factory/clean-libraries-2.webp",
    title: "Clean Libraries",
    accent: "#a974ff",
    tint: "rgba(169,116,255,0.18)",
    featured: true,
    features: [
      { icon: "source", label: "Source Verification" },
      { icon: "verify", label: "Dependency Validation" },
      { icon: "policy", label: "Policy Governance" },
    ],
  },
  {
    image: "/images/clean-libraries/flow-repository.webp",
    title: "Approved Libraries",
    accent: "#2dd4bf",
    tint: "rgba(45,212,191,0.14)",
    body: "Verified libraries ready for secure software development.",
  },
  {
    image: "/images/clean-libraries/flow-cicd.webp",
    title: "CI/CD Gates",
    accent: "#f7a35c",
    tint: "rgba(247,163,92,0.14)",
    body: "Automatically enforce library policies before deployment.",
  },
  {
    image: "/images/clean-libraries/flow-production.webp",
    title: "Trusted Software",
    accent: "#5b9bff",
    tint: "rgba(91,155,255,0.14)",
    body: "Applications built on approved and verified libraries.",
  },
];

/**
 * Relay start offset of each stage, in steps. Stages normally occupy one step;
 * the featured (Clean Libraries) stage dwells for two, so everything after it
 * starts one step later. The CSS `--wf-cycle` must equal the total step count
 * (currently 6) × `--wf-step`.
 */
function relayStarts(stages: Stage[]): number[] {
  const starts: number[] = [];
  let t = 0;
  for (const stage of stages) {
    starts.push(t);
    t += stage.featured ? 2 : 1;
  }
  return starts;
}

const STAGE_STARTS = relayStarts(STAGES);

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Mini glyphs for the Clean Library feature rows. */
function FeatureGlyph({ icon }: { icon: FeatureIcon }): React.ReactElement {
  const common = { ...STROKE, width: 18, height: 18, viewBox: "0 0 24 24" };
  switch (icon) {
    case "source":
      return (
        <svg {...common}>
          <line x1="6" y1="3" x2="6" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
      );
    case "verify":
      return (
        <svg {...common}>
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "policy":
      return (
        <svg {...common}>
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v5h5" />
          <line x1="8.5" y1="13" x2="15" y2="13" />
          <line x1="8.5" y1="17" x2="13" y2="17" />
        </svg>
      );
  }
}

/** Self-contained 3D glass stage icon, lifted on a soft accent-tinted glow. */
function Medallion({
  image,
  alt,
  tint,
  size,
}: {
  image: string;
  alt: string;
  tint: string;
  size: number;
}): React.ReactElement {
  return (
    <div
      className="wf-medallion relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <span
        aria-hidden
        className="wf-icon-glow pointer-events-none absolute inset-[-22%] rounded-full"
        style={{ background: `radial-gradient(closest-side, ${tint} 0%, transparent 72%)` }}
      />
      <Image
        src={image}
        alt={alt}
        width={size}
        height={size}
        sizes={`${size}px`}
        className="relative select-none object-contain"
        draggable={false}
      />
    </div>
  );
}

function Title({
  children,
  featured,
}: {
  children: React.ReactNode;
  featured?: boolean;
}): React.ReactElement {
  return (
    <h3
      className="font-display text-white"
      style={{
        fontSize: featured ? "var(--fs-h3)" : "var(--fs-h4)",
        fontWeight: 700,
        letterSpacing: "-0.03em",
        lineHeight: 1.12,
      }}
    >
      {children}
    </h3>
  );
}

function AccentBar({ accent }: { accent: string }): React.ReactElement {
  return (
    <span
      aria-hidden
      className="mx-auto block h-[3px] w-8 rounded-full"
      style={{ backgroundColor: accent }}
    />
  );
}

function Body({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <p
      className="mx-auto max-w-[210px] text-center font-sans text-white/60"
      style={{
        fontSize: "var(--fs-body-sm)",
        fontWeight: 400,
        letterSpacing: "-0.01em",
        lineHeight: 1.45,
      }}
    >
      {children}
    </p>
  );
}

function FeatureList({
  features,
  accent,
}: {
  features: FeatureRow[];
  accent: string;
}): React.ReactElement {
  return (
    <ul className="mx-auto flex w-fit flex-col gap-3.5 text-left">
      {features.map((feature) => (
        <li key={feature.label} className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border"
            style={{
              color: accent,
              borderColor: `color-mix(in srgb, ${accent} 40%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
            }}
          >
            <FeatureGlyph icon={feature.icon} />
          </span>
          <span
            className="font-sans text-white/85"
            style={{
              fontSize: "var(--fs-body-sm)",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}
          >
            {feature.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * One stage card. Content is centred. Every non-featured card shares one fixed
 * height so the four reference stages read as a uniform set; the featured
 * (Clean Library) card is taller, wider, and carries the brand glow.
 */
function StageCard({
  stage,
  delaySteps,
  desktop = false,
}: {
  stage: Stage;
  delaySteps: number;
  /**
   * The desktop scene fixes each stage's height so the scaled 1240×368 canvas
   * stays deterministic; the stacked (mobile) layout uses natural heights.
   */
  desktop?: boolean;
}): React.ReactElement {
  const featured = stage.featured ?? false;
  return (
    <div
      data-featured={featured ? "true" : undefined}
      className={cn(
        "wf-card relative flex h-full flex-col items-center rounded-[22px] border text-center",
        featured ? "gap-4 px-7 py-7" : "gap-3.5 px-5 py-6",
        desktop && (featured ? "min-h-[368px]" : "min-h-[312px]"),
      )}
      style={{
        ["--accent" as string]: stage.accent,
        ["--wf-d" as string]: delaySteps,
        ["--wf-border" as string]: featured
          ? `color-mix(in srgb, ${stage.accent} 55%, transparent)`
          : "rgba(255,255,255,0.08)",
        background: `linear-gradient(160deg, ${stage.tint} 0%, rgba(9,8,18,0.62) 60%)`,
        boxShadow: featured
          ? `inset 0 1px 0 rgba(255,255,255,0.06), 0 28px 64px -34px ${stage.accent}`
          : "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {featured ? (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-px mx-auto h-px w-2/3 rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${stage.accent}, transparent)` }}
          />
          <span aria-hidden className="wf-beam" />
        </>
      ) : null}
      <Medallion
        image={stage.image}
        alt=""
        tint={stage.tint}
        size={featured ? 104 : 86}
      />
      <div className="flex flex-col items-center gap-2.5">
        <Title featured={featured}>{stage.title}</Title>
        <AccentBar accent={stage.accent} />
      </div>
      {stage.features ? (
        <FeatureList features={stage.features} accent={stage.accent} />
      ) : (
        <Body>{stage.body}</Body>
      )}
    </div>
  );
}

/**
 * Flow arrow between two stages: a flowing dotted accent track running into a
 * chevron. The dots stream continuously while the section is on-screen.
 * Horizontal in the desktop row, rotated down when stacked.
 */
function Connector({
  accent,
  delaySteps,
  vertical,
}: {
  accent: string;
  delaySteps: number;
  vertical?: boolean;
}): React.ReactElement {
  return (
    <div
      aria-hidden
      className={cn(
        "wf-arrow flex shrink-0 items-center justify-center",
        vertical ? "h-8 w-full" : "w-7",
      )}
      style={{ color: accent, ["--wf-d" as string]: delaySteps }}
    >
      <div className={cn("flex items-center gap-1", vertical && "rotate-90")}>
        <span className="wf-arrow-track" />
        <svg
          width="11"
          height="14"
          viewBox="0 0 11 14"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 2l5 5-5 5" />
        </svg>
      </div>
    </div>
  );
}

export function LibrariesWorkflow(): React.ReactElement {
  const flowRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(flowRef, { amount: 0.25, margin: "0px 0px -10% 0px" });
  // Gates the on-screen motion: the relay spotlight loop, flowing arrows,
  // floating medallions, and the Clean Library glow ring only animate while
  // the section is in view (and motion is allowed).
  const anim = inView && !reduce;

  return (
    <Section
      padding="none"
      className="overflow-hidden pt-section-sm pb-section-cta"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131E8F 50%, #151021 100%)",
      }}
    >
      {/* Decorative corner washes. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-12 h-[420px] w-[420px] select-none rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(169,116,255,0.16) 0%, rgba(169,116,255,0) 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 bottom-0 h-[420px] w-[420px] select-none rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(45,212,191,0.12) 0%, rgba(45,212,191,0) 70%)",
        }}
      />
      <Container className="relative">
        <Reveal header>
          <h2
            className="mx-auto max-w-[860px] text-center font-display text-white"
            style={{
              fontSize: "var(--fs-h2)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Built for Modern{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(102deg, #9a51ff 0%, #2cc1eb 100%)" }}
            >
              Software Delivery
            </span>
          </h2>
          <p
            className="mx-auto mt-6 max-w-[900px] text-center font-sans text-white/80"
            style={{
              fontSize: "var(--fs-lead)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.5,
              textWrap: "balance",
            }}
          >
            Integrates into your existing development workflow, ensuring trusted
            libraries become part of every application.
          </p>
        </Reveal>

        {/* The flow wrapper is the in-view target that gates the cascade. */}
        <div ref={flowRef} className={cn(anim && "wf-anim")}>
          {/* Desktop — horizontal flow with the Clean Library stage prominent.
              Rendered on a fixed 1240×368 design canvas that scales uniformly to
              fit its container (the same scale-to-fit technique as the Pipeline
              and Governance scenes on this page), so the row stays horizontal all
              the way down to `lg` instead of hard-switching to the stacked layout
              at `xl`. Cards and connectors are siblings so every non-featured card
              keeps an identical flex basis; each stage (and its arrow) reveals in
              sequence, left to right. */}
          <div
            className="relative mx-auto mt-12 hidden w-full max-w-[1240px] lg:block"
            style={{ aspectRatio: "1240 / 368", containerType: "inline-size" }}
          >
            <div
              className="absolute left-0 top-0"
              style={
                {
                  width: 1240,
                  height: 368,
                  transformOrigin: "top left",
                  transform: "scale(var(--wf-scale))",
                  // Divide by a length (1240px) so the ratio is unitless —
                  // `scale()` rejects a length-valued custom property.
                  "--wf-scale": "min(1, 100cqw / 1240px)",
                } as React.CSSProperties
              }
            >
              <RevealStagger
                gap={0.12}
                className="flex h-full items-center justify-center gap-2"
              >
                {STAGES.map((stage, i) => (
                  <Fragment key={stage.title}>
                    <RevealItem
                      className={`${stage.featured ? "relative z-10 flex-[1.32]" : "flex-1"} min-w-0`}
                    >
                      <StageCard stage={stage} delaySteps={STAGE_STARTS[i] ?? 0} desktop />
                    </RevealItem>
                    {i < STAGES.length - 1 ? (
                      <RevealItem className="shrink-0">
                        <Connector
                          accent={STAGES[i + 1]?.accent ?? stage.accent}
                          delaySteps={(STAGE_STARTS[i + 1] ?? 0) - 0.35}
                        />
                      </RevealItem>
                    ) : null}
                  </Fragment>
                ))}
              </RevealStagger>
            </div>
          </div>

          {/* Stacked — vertical flow for < lg (mobile / small tablet). */}
          <RevealStagger className="mx-auto mt-12 flex max-w-[440px] flex-col items-stretch gap-3 lg:hidden">
            {STAGES.map((stage, i) => (
              <RevealItem key={stage.title} className="flex flex-col items-stretch gap-3">
                <StageCard stage={stage} delaySteps={STAGE_STARTS[i] ?? 0} />
                {i < STAGES.length - 1 ? (
                  <Connector
                    accent={STAGES[i + 1]?.accent ?? stage.accent}
                    delaySteps={(STAGE_STARTS[i + 1] ?? 0) - 0.35}
                    vertical
                  />
                ) : null}
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </Container>
    </Section>
  );
}
