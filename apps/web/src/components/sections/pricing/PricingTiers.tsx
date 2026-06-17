import Image from "next/image";
import Link from "next/link";
import { Container, Section } from "@/components/layout";
import { RevealStagger, RevealItem } from "@/components/ui/Reveal";

interface Tier {
  orb: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  ctaExternal?: boolean;
}

const TOP_TIERS: Tier[] = [
  {
    orb: "/images/pricing/orb-community.png",
    title: "Community Images",
    body: "Free, verified base images curated by CleanStart for developers and open-source users.",
    ctaLabel: "View Images",
    ctaHref: "https://images.cleanstart.com",
    ctaExternal: true,
  },
  {
    orb: "/images/pricing/orb-custom.png",
    title: "Custom Images",
    body: "Pre-built, optimized base images with near-zero CVEs and automatic versioned updates.",
    ctaLabel: "Contact Sales",
    ctaHref: "/contact-us",
  },
  {
    orb: "/images/pricing/orb-libraries.png",
    title: "Clean Libraries",
    body: "Pre-built, optimized base images with near-zero CVEs and automatic versioned updates.",
    ctaLabel: "Learn More",
    ctaHref: "/clean-libraries",
  },
];

const BOTTOM_TIER: Tier = {
  orb: "/images/pricing/orb-cleansight.png",
  title: "CleanSight",
  body: "Pre-built, optimized base images with near-zero CVEs and automatic versioned updates.",
  ctaLabel: "Contact Sales",
  ctaHref: "/contact-us",
};

const ADDITIONAL_SERVICES: string[] = [
  "Custom image hardening",
  "24x7 support",
  "On-premise deployment support",
  "Custom compliance framework integration",
];

// Cyan-bordered, white→lavender card matching the Figma offering cards.
const CARD_FRAME =
  "relative flex h-full w-full flex-col overflow-hidden rounded-[24px] border-[1.5px] border-[rgba(44,193,235,0.45)] bg-white";

export function PricingTiers(): React.ReactElement {
  return (
    <Section
      padding="none"
      className="relative overflow-hidden bg-white pt-section-sm pb-section-lg"
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
        {/* Cap the card content to the same width as the plans section above. */}
        <div className="mx-auto w-full max-w-[1080px]">
          {/* Top row — three offering cards. */}
          <div className="relative">
            <RevealStagger className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {TOP_TIERS.map((tier, i) => (
                <RevealItem key={`${tier.title}-${i}`} className="h-full">
                  <TierCard tier={tier} />
                </RevealItem>
              ))}
            </RevealStagger>
          </div>

          {/* Bottom row — two equal cards: Custom Images + Additional Services. */}
          <RevealStagger className="mt-5 lg:mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
            <RevealItem className="h-full">
              <BottomCustomCard tier={BOTTOM_TIER} />
            </RevealItem>
            <RevealItem className="h-full">
              <AdditionalServicesCard />
            </RevealItem>
          </RevealStagger>
        </div>
      </Container>
    </Section>
  );
}

/** Pink lavender glow + white guide-line grid shared by every card. */
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

function TierCard({ tier }: { tier: Tier }): React.ReactElement {
  return (
    <div className={`${CARD_FRAME} p-6`}>
      <CardDecor />
      <div className="relative self-start" style={{ width: "150px", height: "150px" }} aria-hidden>
        <Image
          src={tier.orb}
          alt=""
          fill
          unoptimized
          sizes="150px"
          className="object-contain object-left select-none pointer-events-none"
        />
      </div>
      <h3
        className="relative mt-5 font-display"
        style={{
          fontSize: "var(--fs-h3)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
          color: "#111",
        }}
      >
        {tier.title}
      </h3>
      <p
        className="relative mt-3 text-[#555]"
        style={{ fontSize: "var(--fs-body)", lineHeight: 1.5 }}
      >
        {tier.body}
      </p>
      <Link
        href={tier.ctaHref}
        {...(tier.ctaExternal
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        className="cs-btn-blue relative w-full"
        style={
          {
            "--cs-btn-fs": "var(--fs-button)",
            "--cs-btn-px": "20px",
            gap: "8px",
            // Consistent breathing room above the CTA across all offering cards.
            marginTop: "clamp(20px, 2.6vw, 30px)",
          } as React.CSSProperties
        }
      >
        <span>{tier.ctaLabel}</span>
        <Arrow />
      </Link>
    </div>
  );
}

function BottomCustomCard({ tier }: { tier: Tier }): React.ReactElement {
  return (
    <div className={`${CARD_FRAME} p-6 sm:p-8`}>
      <CardDecor />
      {/* Orb floats top-right; title + text sit at the top (matches the
          Additional Services card), with the CTA pinned to the bottom. */}
      <div
        aria-hidden
        className="absolute right-5 top-5 h-[140px] w-[140px] sm:right-7"
      >
        <Image
          src={tier.orb}
          alt=""
          fill
          unoptimized
          sizes="140px"
          className="object-contain select-none pointer-events-none"
        />
      </div>

      <h3
        className="relative font-display pr-[120px] sm:pr-[150px]"
        style={{
          fontSize: "var(--fs-h3)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
          color: "#111",
        }}
      >
        {tier.title}
      </h3>
      <p
        className="relative mt-3 text-[#555] pr-[120px] sm:pr-[150px]"
        style={{ fontSize: "var(--fs-body)", lineHeight: 1.5 }}
      >
        {tier.body}
      </p>
      <Link
        href={tier.ctaHref}
        className="cs-btn-blue relative"
        style={
          {
            "--cs-btn-fs": "var(--fs-button)",
            "--cs-btn-px": "20px",
            gap: "8px",
            width: "min(100%, 300px)",
            marginTop: "auto",
          } as React.CSSProperties
        }
      >
        <span>{tier.ctaLabel}</span>
        <Arrow />
      </Link>
    </div>
  );
}

function AdditionalServicesCard(): React.ReactElement {
  return (
    <div className={`${CARD_FRAME} p-6 sm:p-8`}>
      <CardDecor />
      <div
        aria-hidden
        className="absolute right-5 top-5 h-[130px] w-[130px]"
      >
        <Image
          src="/images/pricing/orb-services.png"
          alt=""
          fill
          unoptimized
          sizes="130px"
          className="object-contain select-none pointer-events-none"
        />
      </div>

      <h3
        className="relative font-display"
        style={{
          fontSize: "var(--fs-h3)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
          color: "#111",
        }}
      >
        Additional Services
      </h3>
      <p
        className="relative mt-2 text-[#555]"
        style={{ fontSize: "var(--fs-body)", lineHeight: 1.5 }}
      >
        Tailored solutions for your business
      </p>

      <ul className="relative mt-6 flex flex-col gap-3.5">
        {ADDITIONAL_SERVICES.map((service) => (
          <li key={service} className="flex items-start gap-3">
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
              {service}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Arrow(): React.ReactElement {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden
      focusable="false"
    >
      <path
        d="M3.75 9h10.5M9.75 4.5 14.25 9l-4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
