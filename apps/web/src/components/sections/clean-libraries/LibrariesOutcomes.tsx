import { Fragment } from "react";
import { Container, Section } from "@/components/layout";
import { RevealItem, RevealStagger } from "@/components/ui/Reveal";

/** One measurable outcome of running dependencies through Clean Libraries. */
interface Outcome {
  /** Path to the outcome's line icon (white stroke on the blue ball). */
  icon: string;
  title: string;
}

const OUTCOMES: Outcome[] = [
  {
    icon: "/images/clean-libraries/out-visibility.svg",
    title: "Dependency Validation",
  },
  {
    icon: "/images/clean-libraries/out-risk.svg",
    title: "Reduced Dependency Risk",
  },
  {
    icon: "/images/clean-libraries/out-accountability.svg",
    title: "AI Dependency Accountability",
  },
  {
    icon: "/images/clean-libraries/out-policy1.svg",
    title: "Continuous Policy Enforcement",
  },
  {
    icon: "/images/clean-libraries/out-policy2.svg",
    // Forced two-line break (rendered via `white-space: pre-line`) so this short
    // title matches the other four, which wrap to two lines at the item width.
    title: "Trusted\nReleases",
  },
];

const BALL_BG = "linear-gradient(180deg, #239cff 0%, #005be3 100%)";
const BALL_SHADOW =
  "0px 4.6px 10.9px 0px rgba(28,60,142,0.33), inset 0px -0.175px 0.218px 0px rgba(0,44,179,0.5), inset 0px 0.087px 0.436px 0px rgba(255,255,255,0.81)";
/** Faded vertical hairline between items, same approach as the Pipeline row. */
const DIVIDER =
  "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%)";

/** A single outcome — borderless: just the blue icon ball and the title. */
function OutcomeItem({ outcome }: { outcome: Outcome }): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-5 px-2 text-center xl:w-[204px]">
      <div
        className="flex size-[62px] shrink-0 items-center justify-center rounded-full"
        style={{ background: BALL_BG, boxShadow: BALL_SHADOW }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src={outcome.icon}
          alt=""
          className="pointer-events-none size-9 select-none"
          loading="lazy"
          decoding="async"
        />
      </div>
      <h3
        className="font-display text-white"
        style={{
          fontSize: "var(--fs-h4)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
          whiteSpace: "pre-line",
        }}
      >
        {outcome.title}
      </h3>
    </div>
  );
}

/**
 * Clean Libraries "Outcomes" section — a borderless stat-style row of outcomes,
 * lifted out of the Pipeline diagram into its own standalone section directly
 * above the CTA card. The background bridges the dark Workflow section above
 * (#08060f) into the footer's #151021 below, so the white CTA card overlaps a
 * continuous dark surface. As the last section before `<Footer cta=…>`, it owns
 * the CTA-overlap reservation via `pb-section-cta`.
 */
export function LibrariesOutcomes(): React.ReactElement {
  return (
    <Section
      padding="none"
      className="overflow-hidden pt-section-sm pb-section-cta"
      style={{
        background:
          "linear-gradient(180deg, #08060f 0%, #0d0a26 55%, #151021 100%)",
      }}
    >
      {/* Central purple glow, echoing the Pipeline section it came from. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[30%] h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 select-none rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(110,64,255,0.16) 0%, rgba(110,64,255,0) 70%)",
        }}
      />
      <Container className="relative">
        {/* Stat row: 2/3-col grid on small screens, an even divided flex row at xl. */}
        <RevealStagger className="grid grid-cols-2 items-start gap-x-4 gap-y-10 sm:grid-cols-3 xl:flex xl:justify-between xl:gap-0">
          {OUTCOMES.map((outcome, i) => (
            <Fragment key={outcome.title}>
              <RevealItem className="flex justify-center">
                <OutcomeItem outcome={outcome} />
              </RevealItem>
              {i < OUTCOMES.length - 1 && (
                <div
                  aria-hidden
                  className="hidden w-px shrink-0 self-center xl:block xl:h-[112px]"
                  style={{ background: DIVIDER }}
                />
              )}
            </Fragment>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}
