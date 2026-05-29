import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { HeroReveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import { STATE_PRESETS, type StateVariant } from "./state-presets";

const HERO_GRADIENT =
  "linear-gradient(180deg, #0B0820 0%, #131248 38%, #2E1D8E 70%, #5A2EE0 95%, #6E3CFF 100%)";

const GRID_CELL = "71.11px";
const GRID_BORDER = "1px";
const GRID_COLOR = "rgba(255, 255, 255, 0.06)";

const GRID_BG: CSSProperties = {
  backgroundImage: `linear-gradient(to right, ${GRID_COLOR} ${GRID_BORDER}, transparent ${GRID_BORDER}), linear-gradient(to bottom, ${GRID_COLOR} ${GRID_BORDER}, transparent ${GRID_BORDER})`,
  backgroundSize: `${GRID_CELL} ${GRID_CELL}`,
  backgroundPosition: "0 0",
};

const TITLE_STYLE: CSSProperties = {
  fontSize: "var(--fs-display)",
  lineHeight: 1.05,
  letterSpacing: "-0.03em",
  color: "rgba(255, 255, 255, 0.92)",
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
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{
            ...GRID_BG,
            height: "clamp(420px, 32vw, 498px)",
            maskImage:
              "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage:
              "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
          }}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: "calc(-280.57px / 1920 * 100%)",
            top: "-358px",
            width: "min(974px, 60vw)",
            aspectRatio: "974 / 862",
            background: "#7A59FF",
            opacity: 0.08,
            filter: "blur(125px)",
            transform: "rotate(43deg)",
            borderRadius: "50%",
          }}
        />

        <span
          aria-hidden
          className="pointer-events-none absolute hidden md:block"
          style={{
            left: "calc(213.33px / 1920 * 100%)",
            top: "142.22px",
            width: "1px",
            height: "142.22px",
            background: "rgba(255,255,255,0.55)",
            opacity: 0.28,
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute hidden md:block"
          style={{
            left: "calc(426.67px / 1920 * 100%)",
            top: "285.74px",
            width: "1px",
            height: "142.22px",
            background: "rgba(255,255,255,0.55)",
            opacity: 0.28,
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute hidden md:block"
          style={{
            left: "calc(142.22px / 1920 * 100%)",
            top: "355.56px",
            width: "1px",
            height: "142.22px",
            background: "rgba(255,255,255,0.55)",
            opacity: 0.18,
          }}
        />

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
              {resolvedDescription ? (
                <p
                  className="mx-auto mt-4 max-w-[36ch] text-balance text-white/70"
                  style={{ fontSize: "var(--fs-lead)" }}
                >
                  {resolvedDescription}
                </p>
              ) : null}
            </HeroReveal>

            <div
              className="relative mt-[clamp(32px,4vw,56px)] w-full"
              style={{ maxWidth: "clamp(260px, 42vw, 520px)" }}
            >
              <Image
                src={preset.illustration}
                alt={preset.alt}
                width={preset.width}
                height={preset.height}
                priority
                sizes="(min-width: 1280px) 520px, (min-width: 640px) 42vw, 80vw"
                className="h-auto w-full select-none"
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
