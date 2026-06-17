import type React from "react";
import { Section, Container } from "@/components/layout";
import { LifecycleFlow } from "@/components/sections/ciso/lifecycle-flow/LifecycleFlow";
import { LifecycleMobile } from "@/components/sections/ciso/lifecycle-flow/LifecycleMobile";

/** Ambient mesh-grid glow, anchored to the centred 1440 design frame. xl-only. */
function Glow({
  left,
  top,
}: {
  left: string;
  top: string;
}): React.ReactElement {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      aria-hidden
      src="/images/ciso/lifecycle-glow.svg"
      alt=""
      className="absolute hidden xl:block pointer-events-none select-none"
      style={{ left, top, width: "979px", height: "979px" }}
      loading="lazy"
      decoding="async"
    />
  );
}

export function CisoLifecycle(): React.ReactElement {
  return (
    <Section
      padding="none"
      data-section="CisoLifecycle"
      className="overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 23.15%, #131e8f 53.815%, #471ec0 100%)",
        // Match the page's hand-built sections (CisoRisks / CisoValidationOutcomes) so the
        // top gap above the heading reads consistently across the page.
        paddingTop: "clamp(64px, 6.25vw, 120px)",
        paddingBottom: "clamp(64px, 6.25vw, 120px)",
      }}
    >
      <Glow left="calc(50% + 724px)" top="-392px" />
      <Glow left="calc(50% - 1230px)" top="-554px" />
      <Glow left="calc(50% + 285px)" top="-544px" />

      <Container className="relative">
        <div className="mx-auto flex max-w-[1058px] flex-col items-center gap-6 text-center">
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              letterSpacing: "var(--fs-h2-ls)",
              lineHeight: "var(--fs-h2-lh)",
              color: "#fff",
            }}
          >
            Modern Software Risk Spans the Entire{" "}
            <span className="cs-text-gradient-impact">Delivery Lifecycle</span>
          </h2>
          <p
            className="max-w-[820px] text-white/80"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-lead)",
              fontWeight: 400,
              letterSpacing: "var(--fs-lead-ls)",
              lineHeight: "var(--fs-lead-lh)",
            }}
          >
            Risk enters through dependencies, artifacts, AI-generated code, and
            deployment pipelines long before production environments.
          </p>
        </div>

        <div className="mx-auto mt-[clamp(12px,2vw,32px)] flex max-w-[1276px] flex-col items-center">
          {/* Tablet + desktop (≥ md): the hub-and-spoke canvas scaled down.
              Phones (< md): a portrait re-flow of the same diagram (the wide
              canvas can't shrink legibly to phone width). */}
          <div className="hidden w-full justify-center md:flex">
            <LifecycleFlow />
          </div>
          <div className="w-full md:hidden">
            <LifecycleMobile />
          </div>
        </div>
      </Container>
    </Section>
  );
}
