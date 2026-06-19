"use client";

import { Fragment, useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";

type FeatureIcon = "visibility" | "validation" | "policy";

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
  /** Bullet list (devtools) or single description (repository, cicd, production). */
  bullets?: string[];
  body?: string;
  /** Icon-led feature rows — only the prominent Clean Library stage. */
  features?: FeatureRow[];
  featured?: boolean;
}

const STAGES: Stage[] = [
  {
    image: "/images/clean-libraries/flow-developers.png",
    title: "Developers & AI Coding Tools",
    accent: "#5b9bff",
    tint: "rgba(91,155,255,0.14)",
    bullets: ["Cursor", "Claude Code", "GitHub Copilot"],
  },
  {
    image: "/images/clean-libraries/flow-clean-library.png",
    title: "Clean Library",
    accent: "#a974ff",
    tint: "rgba(169,116,255,0.18)",
    featured: true,
    features: [
      { icon: "visibility", label: "Dependency visibility" },
      { icon: "validation", label: "Validation" },
      { icon: "policy", label: "Policy enforcement" },
    ],
  },
  {
    image: "/images/clean-libraries/flow-repository.png",
    title: "Validated Library Repository",
    accent: "#2dd4bf",
    tint: "rgba(45,212,191,0.14)",
    body: "Approved packages and trusted sources.",
  },
  {
    image: "/images/clean-libraries/flow-cicd.png",
    title: "CI/CD Gates",
    accent: "#f7a35c",
    tint: "rgba(247,163,92,0.14)",
    body: "Automated policy enforcement.",
  },
  {
    image: "/images/clean-libraries/flow-production.png",
    title: "Production Artifacts",
    accent: "#5b9bff",
    tint: "rgba(91,155,255,0.14)",
    body: "Only approved dependencies reach production.",
  },
];

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
    case "visibility":
      return (
        <svg {...common}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "validation":
      return (
        <svg {...common}>
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "policy":
      return (
        <svg {...common}>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="m9 14 2 2 4-4" />
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
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
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
      className="mx-auto max-w-[220px] text-center font-sans text-white/60"
      style={{
        fontSize: "var(--fs-body-sm)",
        fontWeight: 400,
        letterSpacing: "-0.01em",
        lineHeight: 1.55,
      }}
    >
      {children}
    </p>
  );
}

function Bullets({ items, accent }: { items: string[]; accent: string }): React.ReactElement {
  return (
    <ul className="mx-auto flex w-fit flex-col gap-2.5 text-left">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2.5">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: accent }} />
          <span
            className="font-sans text-white/75"
            style={{
              fontSize: "var(--fs-body-sm)",
              fontWeight: 400,
              letterSpacing: "-0.01em",
              lineHeight: 1.4,
            }}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
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
function StageCard({ stage }: { stage: Stage }): React.ReactElement {
  const featured = stage.featured ?? false;
  return (
    <div
      data-featured={featured ? "true" : undefined}
      className={cn(
        "wf-card relative flex h-full flex-col items-center rounded-[22px] border text-center",
        featured ? "gap-5 px-8 py-9 xl:min-h-[420px]" : "gap-4 px-6 py-8 xl:min-h-[356px]",
      )}
      style={{
        ["--accent" as string]: stage.accent,
        borderColor: featured
          ? `color-mix(in srgb, ${stage.accent} 55%, transparent)`
          : "rgba(255,255,255,0.08)",
        background: `linear-gradient(160deg, ${stage.tint} 0%, rgba(9,8,18,0.62) 60%)`,
        boxShadow: featured
          ? `inset 0 1px 0 rgba(255,255,255,0.06), 0 28px 64px -34px ${stage.accent}`
          : "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {featured ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-px mx-auto h-px w-2/3 rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${stage.accent}, transparent)` }}
        />
      ) : null}
      <Medallion
        image={stage.image}
        alt=""
        tint={stage.tint}
        size={featured ? 132 : 108}
      />
      <div className="flex flex-col items-center gap-3">
        <Title featured={featured}>{stage.title}</Title>
        <AccentBar accent={stage.accent} />
      </div>
      {stage.features ? (
        <FeatureList features={stage.features} accent={stage.accent} />
      ) : stage.bullets ? (
        <Bullets items={stage.bullets} accent={stage.accent} />
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
  vertical,
}: {
  accent: string;
  vertical?: boolean;
}): React.ReactElement {
  return (
    <div
      aria-hidden
      className={cn(
        "wf-arrow flex shrink-0 items-center justify-center",
        vertical ? "h-8 w-full" : "w-9",
      )}
      style={{ color: accent }}
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
  // Gates the on-screen motion: the flowing arrows and the Clean Library glow
  // ring only animate while the section is in view (and motion is allowed).
  const anim = inView && !reduce;

  return (
    <Section
      padding="sm"
      className="overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #08060f 0%, #0a0a1c 50%, #08060f 100%)",
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
            Built Into Your Existing{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(102deg, #9a51ff 0%, #2cc1eb 100%)" }}
            >
              Software Delivery Workflow
            </span>
          </h2>
        </Reveal>

        {/* The flow wrapper is the in-view target that gates the cascade. */}
        <div ref={flowRef} className={cn(anim && "wf-anim")}>
          {/* Desktop — horizontal flow with the Clean Library stage prominent.
              Cards and connectors are siblings so every non-featured card keeps
              an identical flex basis (equal width); connectors never steal width. */}
          <Reveal className="mt-14 hidden xl:block">
            <div className="flex items-center justify-center gap-2">
              {STAGES.map((stage, i) => (
                <Fragment key={stage.title}>
                  <div className={`${stage.featured ? "flex-[1.32]" : "flex-1"} min-w-0`}>
                    <StageCard stage={stage} />
                  </div>
                  {i < STAGES.length - 1 ? (
                    <Connector accent={STAGES[i + 1]?.accent ?? stage.accent} />
                  ) : null}
                </Fragment>
              ))}
            </div>
          </Reveal>

          {/* Stacked — vertical flow for < xl. */}
          <RevealStagger className="mx-auto mt-12 flex max-w-[440px] flex-col items-stretch gap-3 xl:hidden">
            {STAGES.map((stage, i) => (
              <RevealItem key={stage.title} className="flex flex-col items-stretch gap-3">
                <StageCard stage={stage} />
                {i < STAGES.length - 1 ? (
                  <Connector accent={STAGES[i + 1]?.accent ?? stage.accent} vertical />
                ) : null}
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </Container>
    </Section>
  );
}
