import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { HeroReveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import { STATE_PRESETS, type StateVariant } from "./state-presets";

const HERO_GRADIENT =
  "linear-gradient(180deg, #0B0820 0%, #131248 38%, #2E1D8E 70%, #5A2EE0 95%, #6E3CFF 100%)";

// Full-page "glass" hero title — Figma spec (Manrope SemiBold, line-height
// 100%, letter-spacing -0.05em, white @35%). Figma authors it at 190px on the
// 1440 frame, but that reads oversized in-app; dialled back to a 128px desktop
// cap (clamp(2.5rem, 9vw, 8rem)) that stays a bold display tier without
// dominating the viewport. Scales fluidly down to 40px on phones. Inline
// light-tone states use --fs-h3 instead.
const TITLE_STYLE: CSSProperties = {
  fontSize: "clamp(2.5rem, 9vw, 8rem)",
  lineHeight: 1,
  letterSpacing: "-0.05em",
  color: "rgba(255, 255, 255, 0.35)",
  fontWeight: 600,
};

export interface StateViewProps {
  /** Which illustrated state to render — see `STATE_PRESETS`. */
  variant: StateVariant;
  /** Override the preset title. */
  title?: string;
  /** Override the preset description. Pass `null` to hide it. */
  description?: string | null;
  /** CTA slot rendered below the description. */
  actions?: ReactNode;
  /** Reference id rendered below the illustration (dark tone only). */
  referenceId?: string | undefined;
  className?: string;
}

/**
 * One illustrated state component for the whole site. `tone === "dark"` renders
 * the full-page hero chrome (gradient + grid + blobs) used by `not-found` and
 * the error boundary; `tone === "light"` renders a compact centered block for
 * inline use inside listings, modals, and forms.
 */
export function StateView({
  variant,
  title,
  description,
  actions,
  referenceId,
  className,
}: StateViewProps): React.ReactElement {
  const preset = STATE_PRESETS[variant];
  const resolvedTitle = title ?? preset.title;
  const resolvedDescription =
    description === null ? null : (description ?? preset.description);

  if (preset.tone === "dark") {
    return (
      <section
        className={cn("relative w-full overflow-hidden", className)}
        style={{ background: HERO_GRADIENT }}
      >
        {/* Bordered grid + purple glow ellipses + accent lines — exact Figma
            asset (node 857:18365). 1920px-wide, centred and clipped to the
            section like the design (left: calc(50% - 1920px/2)). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/error/hero-grid.svg"
          alt=""
          aria-hidden
          className="pointer-events-none select-none absolute top-0 left-1/2 -translate-x-1/2"
          style={{ width: "1920px", maxWidth: "none", height: "auto" }}
          loading="lazy"
          decoding="async"
        />

        {/* Glassy title tint — soft cyan + purple light behind the title band.
            The 35%-opacity letters are translucent, so this colour bleeds
            through them (neutral → teal → purple, matching the Figma "Glass"
            reference). Screen blend adds light to the gradient, never darkens. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 mix-blend-screen"
          style={{ height: "clamp(300px, 32vw, 440px)" }}
        >
          <div
            className="absolute"
            style={{
              left: "42%",
              top: "58%",
              width: "min(700px, 54vw)",
              height: "min(320px, 24vw)",
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background:
                "radial-gradient(closest-side, rgba(51, 186, 236, 0.42) 0%, rgba(51, 186, 236, 0) 72%)",
              filter: "blur(72px)",
            }}
          />
          <div
            className="absolute"
            style={{
              left: "71%",
              top: "62%",
              width: "min(640px, 48vw)",
              height: "min(300px, 22vw)",
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background:
                "radial-gradient(closest-side, rgba(122, 89, 255, 0.50) 0%, rgba(122, 89, 255, 0) 72%)",
              filter: "blur(72px)",
            }}
          />
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{
            top: "38%",
            width: "min(820px, 80vw)",
            height: "min(820px, 80vw)",
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, rgba(122,89,255,0.40) 0%, rgba(122,89,255,0) 70%)",
            filter: "blur(60px)",
          }}
        />

        <Container variant="default" className="relative">
          <div className="flex flex-col items-center pt-[clamp(80px,10vw,140px)] pb-[clamp(48px,6vw,96px)] text-center">
            <HeroReveal y={50} duration={1.0}>
              <h1 className="font-display text-balance" style={TITLE_STYLE}>
                {resolvedTitle}
              </h1>
            </HeroReveal>

            {/* Scale the illustration to the smaller of viewport width / height
                so it always fits without overflowing the fold or pushing the
                CTA off-screen. width/height auto + dual max keeps the aspect
                ratio while fitting within both bounds. */}
            <div className="relative mt-[clamp(24px,3vw,48px)] flex w-full justify-center">
              <Image
                src={preset.illustration}
                alt={preset.alt}
                width={preset.width}
                height={preset.height}
                priority
                sizes="(min-width: 1280px) 600px, (min-width: 640px) 56vw, 85vw"
                className="select-none"
                style={{
                  width: "auto",
                  height: "auto",
                  maxWidth: "min(56vw, 600px)",
                  maxHeight: "min(50vh, 600px)",
                }}
                draggable={false}
              />
            </div>

            {actions ? (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {actions}
              </div>
            ) : null}

            {referenceId ? (
              <p className="mt-6 font-mono text-xs text-white/55">
                trace · <span className="text-white/80">{referenceId}</span>
              </p>
            ) : null}
          </div>
        </Container>
      </section>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        className,
      )}
    >
      <Image
        src={preset.illustration}
        alt={preset.alt}
        width={preset.width}
        height={preset.height}
        sizes="(min-width: 640px) 280px, 60vw"
        className="h-auto w-full max-w-[clamp(180px,40vw,280px)] select-none"
        draggable={false}
      />
      <h2
        className="mt-6 font-display text-balance text-[color:var(--foreground)]"
        style={{
          fontSize: "var(--fs-h3)",
          fontWeight: 600,
          letterSpacing: "-0.02em",
        }}
      >
        {resolvedTitle}
      </h2>
      {resolvedDescription ? (
        <p
          className="mt-2 max-w-[42ch] text-balance"
          style={{
            fontSize: "var(--fs-body)",
            color: "rgba(17,17,17,0.54)",
          }}
        >
          {resolvedDescription}
        </p>
      ) : null}
      {actions ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
