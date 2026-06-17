import { Fragment } from "react";
import { FlowArrow } from "@/components/ui/FlowArrow";
import { Reveal } from "@/components/ui/Reveal";

type Step = { icon: string; title: string; tagline: string; desc: string };

const STEPS: Step[] = [
  {
    icon: "icon-discover.svg",
    title: "Discover",
    tagline: "with CleanSight",
    desc: "Continuously identify inherited risks across your environments.",
  },
  {
    icon: "icon-eliminate.svg",
    title: "Eliminate",
    tagline: "with Clean Images & Libraries",
    desc: "Replace vulnerable components with verified, zero-CVE alternatives.",
  },
  {
    icon: "icon-prove.svg",
    title: "Prove",
    tagline: "with CleanSight",
    desc: "Continuously validate integrity and compliance readiness.",
  },
];

function StepItem({ step }: { step: Step }) {
  return (
    <div className="flex w-full max-w-[280px] flex-col items-start gap-4 text-left">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/images/process/${step.icon}`}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="size-[52px] select-none"
      />
      <div className="flex flex-col gap-2.5">
        <h3
          className="font-display font-semibold text-white"
          style={{ fontSize: "var(--fs-h3)", lineHeight: 1, letterSpacing: "-0.03em" }}
        >
          {step.title}
        </h3>
        <p
          className="whitespace-nowrap text-[#9a51ff]"
          style={{
            fontFamily: "var(--font-sora), Sora, sans-serif",
            fontSize: "var(--fs-body)",
            lineHeight: 1,
            letterSpacing: "-0.01em",
          }}
        >
          {step.tagline}
        </p>
        <p
          className="text-white/85"
          style={{
            fontFamily: "var(--font-sora), Sora, sans-serif",
            fontSize: "var(--fs-body)",
            lineHeight: 1.35,
            letterSpacing: "-0.01em",
          }}
        >
          {step.desc}
        </p>
      </div>
    </div>
  );
}

export function ProcessBand() {
  return (
    <section className="relative overflow-hidden" style={{ background: "#241259" }}>
      {/* Blended office photo behind the band. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/process/bg-photo.png"
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-[68%_center]"
        style={{ filter: "blur(4px)", opacity: 0.85 }}
      />
      {/* Purple wash — opaque on the left for legibility, lets the photo show
          through toward the centre-right. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(36,18,89,0.96) 0%, rgba(45,23,112,0.82) 32%, rgba(60,30,150,0.45) 60%, rgba(40,20,100,0.6) 100%)",
        }}
      />
      {/* Vertical edge fades to blend with the light sections above/below. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(36,18,89,0.55) 0%, rgba(36,18,89,0) 26%, rgba(36,18,89,0) 74%, rgba(36,18,89,0.55) 100%)",
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <Reveal>
          <div className="flex flex-col items-start gap-10 py-14 sm:gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-6 lg:py-20">
            {STEPS.map((step, i) => (
              <Fragment key={step.title}>
                <StepItem step={step} />
                {i < STEPS.length - 1 && (
                  <FlowArrow
                    scale={1.4}
                    className="hidden shrink-0 self-center lg:flex"
                    style={{ ["--arrow-delay" as string]: `${i * 0.12}s` }}
                  />
                )}
              </Fragment>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
