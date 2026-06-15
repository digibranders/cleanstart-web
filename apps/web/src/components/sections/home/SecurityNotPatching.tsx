import { Fragment } from "react";
import { Reveal } from "@/components/ui/Reveal";

type Stage = { icon: string; title: string; desc: string };
type Guarantee = { title: string; desc: string };

// Software-lifecycle stages (where risk enters), left→right.
const STAGES: Stage[] = [
  { icon: "icon-open-source.svg", title: "Open Source", desc: "External sources and repositories" },
  { icon: "icon-dependencies.svg", title: "Dependencies", desc: "Direct and transitive dependencies" },
  { icon: "icon-build.svg", title: "Build", desc: "Your build environment" },
  { icon: "icon-registry.svg", title: "Public Registry", desc: "Images & packages in public registries" },
  { icon: "icon-deploy.svg", title: "Deploy", desc: "Deployed across environments" },
  { icon: "icon-runtime.svg", title: "Runtime", desc: "Running in production at scale" },
];

// CleanStart guarantees that map to each lifecycle stage.
const GUARANTEES: Guarantee[] = [
  { title: "Verified Sources", desc: "Curated and verified upstream sources" },
  { title: "Trusted Dependencies", desc: "Scanned, curated, and continuously validated" },
  { title: "Reproducible Pipelines", desc: "Deterministic, repeatable, and auditable builds" },
  { title: "Verified Artifacts", desc: "Zero-CVE images, signed and attested" },
  { title: "Continuous Visibility", desc: "Posture, drift, and risk visibility across your environment" },
  { title: "Proven Integrity", desc: "Continuously verified integrity from build to runtime" },
];

// Approximate column centres for the six connector beams (justify-between, 6-up).
const BEAM_X = ["9%", "25.4%", "41.8%", "58.2%", "74.6%", "91%"];

const titleStyle = {
  fontSize: "var(--fs-h3)",
  lineHeight: 1.1,
  letterSpacing: "-0.03em",
} as const;

const descStyle = {
  fontFamily: "var(--font-sora), Sora, sans-serif",
  fontSize: "var(--fs-body)",
  lineHeight: 1.35,
  letterSpacing: "-0.01em",
} as const;

function StageItem({ stage }: { stage: Stage }) {
  return (
    <div className="flex w-[44%] flex-col items-center gap-4 text-center sm:w-[150px] lg:w-[166px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/images/security/${stage.icon}`}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="size-12 select-none"
      />
      <div className="flex flex-col gap-2">
        <h3 className="font-display font-bold text-white" style={titleStyle}>
          {stage.title}
        </h3>
        <p className="text-white/70" style={descStyle}>
          {stage.desc}
        </p>
      </div>
    </div>
  );
}

function GuaranteeItem({ item }: { item: Guarantee }) {
  return (
    <div className="relative z-10 flex w-[44%] flex-col items-center gap-4 text-center sm:w-[160px] lg:w-[176px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/security/shield.png"
        alt=""
        aria-hidden
        width={72}
        height={72}
        loading="lazy"
        decoding="async"
        className="size-[68px] select-none"
      />
      <div className="flex flex-col gap-2">
        <h3 className="font-display font-bold text-white" style={titleStyle}>
          {item.title}
        </h3>
        <p className="text-white/70" style={descStyle}>
          {item.desc}
        </p>
      </div>
    </div>
  );
}

export function SecurityNotPatching() {
  return (
    <section
      className="relative overflow-hidden py-section-lg"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #10123E 22%, #131E8F 52%, #471EC0 82%, #4A1FCB 100%)",
      }}
    >
      {/* Faint tech grid overlay. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "linear-gradient(to bottom, #000 0%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 0%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Heading */}
        <Reveal header>
          <div className="mx-auto flex max-w-[820px] flex-col items-center gap-5 text-center">
            <h2
              className="font-display font-bold text-white"
              style={{
                fontSize: "var(--fs-h2)",
                lineHeight: 1.1,
                letterSpacing: "-0.04em",
              }}
            >
              Security Isn&rsquo;t Just{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(117deg, #9a51ff 0%, #2cc1eb 100%)",
                }}
              >
                Patching
              </span>
            </h2>
            <p
              className="max-w-[680px] text-white/80"
              style={{ fontSize: "var(--fs-lead)", lineHeight: 1.4, letterSpacing: "-0.02em" }}
            >
              Risk enters your software long before deployment. CleanStart
              continuously verifies trust across the software lifecycle.
            </p>
          </div>
        </Reveal>

        {/* Lifecycle bar + connector beams + guarantee enclosure */}
        <Reveal>
          <div className="relative mx-auto mt-14 max-w-[1240px]">
            <div
              className="relative rounded-[24px] border border-[#dab6f3] px-5 py-7 backdrop-blur-sm sm:px-8 sm:py-8"
              style={{
                background:
                  "linear-gradient(100deg, rgba(217,217,217,0.22) 0%, rgba(80,80,80,0.04) 100%)",
              }}
            >
              <div className="flex flex-wrap items-start justify-center gap-x-3 gap-y-9 lg:flex-nowrap lg:justify-between">
                {STAGES.map((stage, i) => (
                  <Fragment key={stage.title}>
                    <StageItem stage={stage} />
                    {i < STAGES.length - 1 && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src="/images/security/icon-arrow.svg"
                        alt=""
                        aria-hidden
                        loading="lazy"
                        decoding="async"
                        className="mt-3 hidden size-7 shrink-0 select-none opacity-70 lg:block"
                      />
                    )}
                  </Fragment>
                ))}
              </div>

            </div>

            {/* Connector flares — flush band between the bar and the enclosure
                (no gap), so each beam's bright core spans edge-to-edge and reads
                as a connection: the tapered ends tuck behind the bar (above) and
                the enclosure (below). Hidden when the stages wrap (below lg). */}
            <div
              aria-hidden
              className="relative hidden h-[46px] overflow-hidden lg:block"
            >
              {BEAM_X.map((x) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={x}
                  src="/images/cleanstart-factory/factory-beam.png"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="pointer-events-none absolute top-1/2 select-none"
                  style={{
                    left: x,
                    width: 150,
                    height: "auto",
                    transform: "translate(-50%, -50%) scaleX(1.3)",
                    mixBlendMode: "screen",
                    filter: "brightness(1.4) saturate(1.2)",
                  }}
                />
              ))}
            </div>

            {/* Guarantee enclosure */}
            <div
              className="relative overflow-hidden rounded-[24px] border border-[#dab6f3]"
              style={{
                background: "rgba(28,28,28,0.7)",
                boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
              }}
            >
              {/* Diagonal blue light-streak glow. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/cleanstart-factory/factory-overlay.png"
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
                className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                style={{ mixBlendMode: "lighten" }}
              />
              {/* Bottom cyan bloom. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
                style={{
                  background:
                    "radial-gradient(60% 100% at 50% 100%, rgba(60,150,255,0.28) 0%, rgba(60,150,255,0) 70%)",
                }}
              />

              <div className="relative flex flex-col gap-5 px-6 pb-6 pt-7 sm:px-8 sm:pb-6 sm:pt-8 lg:gap-6 lg:px-10 lg:pb-6 lg:pt-9">
                <div className="flex flex-wrap items-start justify-center gap-x-2 gap-y-10 lg:flex-nowrap lg:justify-between">
                  {GUARANTEES.map((item, i) => (
                    <Fragment key={item.title}>
                      <GuaranteeItem item={item} />
                      {i < GUARANTEES.length - 1 && (
                        <div
                          aria-hidden
                          className="hidden h-[120px] w-px shrink-0 self-center lg:block"
                          style={{
                            background:
                              "linear-gradient(to bottom, transparent, rgba(255,255,255,0.18), transparent)",
                          }}
                        />
                      )}
                    </Fragment>
                  ))}
                </div>

                {/* CleanStart branding lockup — gradient cube mark (full colour)
                    + faded wordmark, in a reserved band below the cards
                    (per Figma "Frame 2147238751"). */}
                <div
                  aria-hidden
                  className="pointer-events-none flex select-none items-center justify-center gap-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/security/cube-mark.svg"
                    alt=""
                    className="w-auto"
                    style={{ height: "var(--fs-h1)", aspectRatio: "53.86 / 62" }}
                  />
                  <span
                    className="font-display font-normal"
                    style={{
                      fontSize: "var(--fs-h1)",
                      lineHeight: 1,
                      letterSpacing: "-0.05em",
                      // Frosted-glass wordmark: translucent vertical sheen
                      // (brighter top/bottom, dim core) clipped to the glyphs,
                      // with a soft depth shadow + faint luminous edge.
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
        </Reveal>
      </div>
    </section>
  );
}
