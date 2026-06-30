import { Container, Section } from "@/components/layout";
import { RevealItem, RevealStagger } from "@/components/ui/Reveal";

interface Offering {
  title: string;
  body: string;
  bullets?: string[];
}

const OFFERINGS: Offering[] = [
  {
    title: "CleanSight",
    body: "Discover containers, registries, and software assets across your environments.",
  },
  {
    title: "Clean Libraries",
    body: "Secure software dependencies with verified, policy-driven libraries.",
  },
  {
    title: "Custom Images",
    body: "Build images tailored to your compliance, operating systems, and internal software.",
  },
  {
    title: "Helm Charts",
    body: "Deploy enterprise-ready Helm charts maintained for Kubernetes environments.",
  },
];

// Cyan-bordered, white→lavender card matching the Figma offering cards.
const CARD_FRAME =
  "relative flex w-full flex-col overflow-hidden rounded-[24px] border-[1.5px] border-[rgba(44,193,235,0.45)] bg-white";

export function PricingTiers(): React.ReactElement {
  return (
    <Section
      padding="none"
      className="relative overflow-hidden bg-white pt-0 pb-[var(--spacing-section-cta)]"
    >
      {/* Decorative grid SVGs anchored to the bottom corners (Figma "Union"). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/pricing/grid-union.svg"
        alt=""
        className="pointer-events-none select-none absolute bottom-0 left-0 w-[clamp(320px,40vw,560px)]"
        style={{ transform: "scaleX(-1)" }}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/pricing/grid-union.svg"
        alt=""
        className="pointer-events-none select-none absolute bottom-0 right-0 w-[clamp(320px,40vw,560px)]"
        loading="lazy"
        decoding="async"
      />
      {/* Pink→cyan gradient ellipses glowing from the bottom corners
          (Figma Ellipse 46685 / 46686). */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "-138px",
          bottom: "-76px",
          width: "250px",
          height: "284px",
          borderRadius: "50%",
          background: "linear-gradient(180deg, #DF9BFF 31.73%, #2CC1EB 100%)",
          opacity: 0.6,
          filter: "blur(91.5px)",
          transform: "rotate(-14.89deg)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          right: "5px",
          bottom: "-77px",
          width: "250px",
          height: "284px",
          borderRadius: "50%",
          background: "linear-gradient(180deg, #DF9BFF 31.73%, #2CC1EB 100%)",
          opacity: 0.6,
          filter: "blur(91.5px)",
          transform: "rotate(32.6deg)",
        }}
      />

      <Container className="relative">
        {/* Cap the panel to the same width as the plans section above. */}
        <div className="mx-auto w-full max-w-[1080px]">
          <div className={`${CARD_FRAME} px-6 py-10 sm:px-10 sm:py-12`}>
            <CardDecor />

            {/* Four offering cells in a 2×2 grid with a centred divider cross. */}
            <RevealStagger className="relative grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-0">
              {OFFERINGS.map((offering, i) => (
                <RevealItem
                  key={offering.title}
                  className={`h-full md:px-10 ${
                    i % 2 === 0
                      ? "md:border-r md:border-[rgba(44,193,235,0.28)]"
                      : ""
                  } ${
                    i < 2
                      ? "md:border-b md:border-[rgba(44,193,235,0.28)] md:pb-10"
                      : "md:pt-10"
                  }`}
                >
                  <OfferingColumn offering={offering} />
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function OfferingColumn({
  offering,
}: {
  offering: Offering;
}): React.ReactElement {
  return (
    <div className="flex h-full flex-col text-center">
      <h3
        className="font-display"
        style={{
          fontSize: "var(--fs-h3)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
          color: "#111",
        }}
      >
        {offering.title}
      </h3>
      <p
        className="mt-3 text-[#555]"
        style={{ fontSize: "var(--fs-body)", lineHeight: 1.5 }}
      >
        {offering.body}
      </p>
      {offering.bullets ? (
        <ul className="mt-5 flex flex-col gap-3 text-left">
          {offering.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-[10px] h-[6px] w-[6px] shrink-0 rounded-full"
                style={{ background: "#4A3BF1" }}
              />
              <span
                style={{
                  fontSize: "var(--fs-body)",
                  fontWeight: 500,
                  lineHeight: 1.5,
                  color: "#111",
                }}
              >
                {bullet}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Pink lavender glow + white guide-line grid shared by the panel. */
function CardDecor(): React.ReactElement {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          width: "88%",
          height: "190px",
          left: "50%",
          transform: "translateX(-50%)",
          top: "40px",
          background: "#df9bff",
          opacity: 0.32,
          filter: "blur(66px)",
        }}
      />
      {[17, 41, 58, 82].map((leftPct) => (
        <div
          key={`v-${leftPct}`}
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            top: 0,
            left: `${leftPct}%`,
            width: "1px",
            height: "72%",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0) 0%, #ffffff 50.77%, rgba(255,255,255,0) 100%)",
            opacity: 0.85,
          }}
        />
      ))}
      {[26, 58].map((topPct) => (
        <div
          key={`h-${topPct}`}
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: 0,
            right: 0,
            top: `${topPct}%`,
            height: "1px",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, #ffffff 50.77%, rgba(255,255,255,0) 100%)",
            opacity: 0.3,
          }}
        />
      ))}
    </>
  );
}
