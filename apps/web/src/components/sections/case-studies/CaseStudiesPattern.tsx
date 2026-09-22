import type React from "react";
import Image from "next/image";
import { Container, Section } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";

/**
 * What the studies have in common.
 *
 * The reference mock put a four-tile benefits band here ("Reduce risk",
 * "Improve visibility"). Those claims already sit on the product pages, and
 * repeating them on the evidence page spends the reader's attention on
 * something no customer said. What a listing of case studies can say, and
 * nothing else on the site can, is the shape every engagement takes. Each step
 * below carries a line from a real study rather than an adjective.
 */

interface Step {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
  readonly proof: string;
  readonly attribution: string;
}

const STEPS: readonly [Step, Step, Step] = [
  {
    icon: "/images/compare/icon-origin.webp",
    title: "Standardize the foundation",
    body: "An unmanaged mix of public base images is replaced by a verified, minimal set the team controls, with the same build discipline behind every one.",
    proof:
      "Migrated from Bitnami images to customized, production-ready images built with zero known CVEs.",
    attribution: "o9 Solutions",
  },
  {
    icon: "/images/attack-surface-reduction/approach-icon-minimal.webp",
    title: "Cut what you inherited",
    body: "Packages nobody calls stop shipping, and everything that remains is rebuilt from verified source. The backlog shrinks because the surface does.",
    proof: "Up to 88% less vulnerability noise and up to 3x faster path to secure deployment.",
    attribution: "o9 Solutions",
  },
  {
    icon: "/images/compare/icon-provenance.webp",
    title: "Hold the line without the manual work",
    body: "Continuous rebuilds, SBOMs and provenance keep the foundation current, so the gain from the migration does not quietly decay over the next two quarters.",
    proof:
      "Tasks that previously required significant manual effort are eliminated, and deployments are faster.",
    attribution: "IIFL Finance",
  },
];

function StepCard({ step, index }: { step: Step; index: number }): React.ReactElement {
  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex items-center gap-4">
        <div className="relative size-[68px] shrink-0">
          <Image
            src={step.icon}
            alt=""
            aria-hidden
            fill
            sizes="68px"
            className="object-contain"
          />
        </div>
        <span
          className="font-display font-semibold text-black/15"
          style={{ fontSize: "var(--fs-h2)", lineHeight: 1, letterSpacing: "-0.04em" }}
          aria-hidden
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <h3
        className="font-display text-[#111]"
        style={{
          fontSize: "var(--fs-h4)",
          fontWeight: "var(--fs-h4-weight)",
          letterSpacing: "var(--fs-h4-ls)",
          lineHeight: "var(--fs-h4-lh)",
        }}
      >
        {step.title}
      </h3>

      <p
        className="font-sans"
        style={{
          fontSize: "var(--fs-body)",
          lineHeight: "var(--fs-body-lh)",
          color: "rgba(17,17,17,0.62)",
        }}
      >
        {step.body}
      </p>

      <figure
        className="mt-auto rounded-[20px] p-5"
        style={{ background: "#f6f6f6", border: "1px solid rgba(17,17,17,0.06)" }}
      >
        <blockquote
          className="font-sans text-[#111]"
          style={{ fontSize: "var(--fs-body-sm)", lineHeight: 1.55 }}
        >
          {step.proof}
        </blockquote>
        <figcaption
          className="mt-3 font-sans font-medium text-[#4a3bf1]"
          style={{ fontSize: "var(--fs-caption)" }}
        >
          {step.attribution}
        </figcaption>
      </figure>
    </div>
  );
}

export function CaseStudiesPattern(): React.ReactElement {
  return (
    <Section
      padding="md"
      data-section="CaseStudiesPattern"
      className="relative overflow-hidden bg-white"
      aria-labelledby="case-studies-pattern-title"
    >
      {/* Lavender wash, top-right. Two decorated bands per page is the budget;
          this one and the FAQ carry it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          right: "-80px",
          top: "40px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          backgroundColor: "#DF9BFF",
          opacity: 0.35,
          filter: "blur(120px)",
        }}
      />

      <Container className="relative">
        <Reveal header style={{ maxWidth: "760px" }}>
          <p
            className="font-sans uppercase text-[#4a3bf1]"
            style={{
              fontSize: "var(--fs-eyebrow)",
              fontWeight: "var(--fs-eyebrow-weight)",
              letterSpacing: "var(--fs-eyebrow-ls)",
              lineHeight: "var(--fs-eyebrow-lh)",
            }}
          >
            The pattern
          </p>
          <h2
            id="case-studies-pattern-title"
            className="mt-3 font-display text-[#111]"
            style={{
              fontSize: "var(--fs-h2)",
              fontWeight: "var(--fs-h2-weight)",
              letterSpacing: "var(--fs-h2-ls)",
              lineHeight: "var(--fs-h2-lh)",
            }}
          >
            Different industries, the same three moves
          </h2>
          <p
            className="mt-4 font-sans"
            style={{
              fontSize: "var(--fs-lead-sm)",
              lineHeight: 1.5,
              color: "rgba(17,17,17,0.62)",
            }}
          >
            Read enough of these and the shape repeats. Here it is, with the line
            from the study that shows it.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3 lg:mt-12 lg:gap-10">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={0.08 * i} y={28} className="h-full">
              <StepCard step={step} index={i} />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
