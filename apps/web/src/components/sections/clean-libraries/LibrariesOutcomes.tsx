import { Container, Section } from "@/components/layout";
import { RevealItem, RevealStagger } from "@/components/ui/Reveal";

/** One measurable outcome of running dependencies through Clean Libraries. */
interface Outcome {
  /** Path to the outcome's line icon (white stroke on the blue ball). */
  icon: string;
  title: string;
  body: string;
}

/* Bodies are grounded in the page's own messaging: the Governance pillars and
   the Workflow stages (AI accountability, policy enforcement, production gates). */
const OUTCOMES: Outcome[] = [
  {
    icon: "/images/clean-libraries/out-visibility.svg",
    title: "Complete Dependency Visibility",
    body: "See every package across your software supply chain.",
  },
  {
    icon: "/images/clean-libraries/out-risk.svg",
    title: "Reduced Dependency Risk",
    body: "Catch vulnerable and untrusted packages before adoption.",
  },
  {
    icon: "/images/clean-libraries/out-accountability.svg",
    title: "AI Dependency Accountability",
    body: "Track the libraries AI coding tools introduce silently.",
  },
  {
    icon: "/images/clean-libraries/out-policy1.svg",
    title: "Continuous Policy Enforcement",
    body: "Apply dependency policies throughout software delivery.",
  },
  {
    icon: "/images/clean-libraries/out-policy2.svg",
    title: "Trusted Production Releases",
    body: "Only approved dependencies reach production.",
  },
];

const BALL_BG = "linear-gradient(180deg, #239cff 0%, #005be3 100%)";
const BALL_SHADOW =
  "0px 4.6px 10.9px 0px rgba(28,60,142,0.33), inset 0px -0.175px 0.218px 0px rgba(0,44,179,0.5), inset 0px 0.087px 0.436px 0px rgba(255,255,255,0.81)";

/** A single outcome card — glass surface, blue icon ball, hairline, body. */
function OutcomeCard({ outcome }: { outcome: Outcome }): React.ReactElement {
  return (
    <div
      className="group relative flex h-full flex-col items-center gap-4 overflow-hidden rounded-[22px] border border-white/10 px-5 py-8 text-center transition-colors duration-300 hover:border-white/20"
      style={{
        background:
          "linear-gradient(160deg, rgba(45,118,255,0.10) 0%, rgba(9,8,18,0.55) 60%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* Top accent hairline — fades in on hover. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px mx-auto h-px w-2/3 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "linear-gradient(90deg, transparent, #239cff, transparent)" }}
      />
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
        }}
      >
        {outcome.title}
      </h3>
      <span
        aria-hidden
        className="block h-[2px] w-8 rounded-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(45,193,235,0.8), transparent)" }}
      />
      <p
        className="font-sans text-white/65"
        style={{
          fontSize: "var(--fs-body-sm)",
          fontWeight: 400,
          letterSpacing: "-0.01em",
          lineHeight: 1.5,
        }}
      >
        {outcome.body}
      </p>
    </div>
  );
}

/**
 * Clean Libraries "Outcomes" section — the redesigned outcome row, lifted out of
 * the Pipeline diagram into its own standalone section directly above the CTA
 * card. The background bridges the dark Workflow section above (#08060f) into
 * the footer's #151021 below, so the white CTA card overlaps a continuous dark
 * surface. As the last section before `<Footer cta=…>`, it owns the CTA-overlap
 * reservation via `pb-section-cta`.
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
        <RevealStagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {OUTCOMES.map((outcome) => (
            <RevealItem key={outcome.title} className="h-full">
              <OutcomeCard outcome={outcome} />
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}
