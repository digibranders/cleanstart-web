import Link from "next/link";
import { Container, Section } from "@/components/layout";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Reveal } from "@/components/ui/Reveal";

const IC = {
  code: "/images/pricing/ic-code.svg",
  grid: "/images/pricing/ic-grid.svg",
  checkDev: "/images/pricing/ic-check-dev.svg",
  checkEnt: "/images/pricing/ic-check-ent.svg",
  entHead: "/images/pricing/ic-ent-head.svg",
  subChevron: "/images/pricing/ic-subchevron.svg",
  addons: "/images/pricing/ic-addons.svg",
  decoChevron: "/images/pricing/deco-chevron.svg",
} as const;

// Deep-purple field with a blue glow at the lower-left and a lavender glow at
// the upper-right — sampled from the Figma card texture.
const ENTERPRISE_BG =
  "radial-gradient(115% 90% at 12% 100%, rgba(56,128,255,0.55) 0%, rgba(56,128,255,0) 46%), radial-gradient(90% 80% at 96% 2%, rgba(196,168,240,0.55) 0%, rgba(196,168,240,0) 48%), linear-gradient(158deg, #5B2DBA 0%, #4A18A0 56%, #4A1AA2 100%)";

interface IncludedItem {
  label: string;
  /** Secondary detail line, indented under the item with a chevron. */
  sub?: string;
  /** Muted explanatory copy rather than an indented spec line. */
  note?: string;
}

const DEV_FEATURES: string[] = [
  "Latest version of container images",
  "SBOM included",
  "Free for testing and deployment",
  "Debloated architecture",
  "SLSA Level 2 build",
  "No SLA commitment",
];

const ENTERPRISE_INCLUDED: IncludedItem[] = [
  {
    label:
      "CleanStart Image (both development and production versions) applied to language-based images: Python / Go etc.",
  },
  { label: "CleanStart versions are available in the latest three releases" },
  { label: "Image Artifacts", sub: "SBOM • SLA Level 3 Build" },
  {
    label: "CVE remediation SLA",
    sub: "7 Days for Critical • 14 Days for Medium / Low",
  },
];

const ENTERPRISE_ADDONS: IncludedItem[] = [
  {
    label: "All Enterprise features included",
    note: "If additional packages or components are necessary for your use case, we will create and provide them upon request.",
  },
  {
    label: "Volume Discount",
    note: "Applicable for Enterprise images (50 images and above)",
  },
];

export function PricingPlans(): React.ReactElement {
  return (
    <Section
      padding="none"
      className="relative pt-0 pb-section-sm -mt-[clamp(48px,7vw,120px)]"
    >
      <Container>
        <Reveal header className="relative mx-auto w-full max-w-[1080px]">
          {/* Purple glow halo framing the white panel. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-3 sm:-inset-4 rounded-[36px]"
            style={{
              background:
                "linear-gradient(135deg, rgba(165,103,255,0.45) 0%, rgba(122,89,255,0.18) 45%, rgba(165,103,255,0.45) 100%)",
              filter: "blur(2px)",
              opacity: 0.5,
            }}
          />

          {/* White panel that holds both plan cards. */}
          <div className="relative rounded-[28px] bg-white p-3 sm:p-4 lg:p-5 shadow-[0_30px_80px_-40px_rgba(70,30,191,0.45)]">
            <div className="grid grid-cols-1 items-stretch gap-3 sm:gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <DeveloperCard />
              <EnterpriseCard />
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

function DeveloperCard(): React.ReactElement {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[24px] border border-[#E7E7EC] bg-white p-6 sm:p-7">
      {/* Ellipse 46683 — pink→cyan ambient glow across the upper card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "8%",
          top: "-6px",
          width: "86%",
          aspectRatio: "389 / 441",
          borderRadius: "50%",
          background:
            "linear-gradient(180deg, rgba(223,155,255,0.7) 31.73%, rgba(44,193,235,0.7) 100%)",
          opacity: 0.5,
          filter: "blur(105px)",
        }}
      />
      {/* Ellipse 46684 — pink→cyan glow filling the lower card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "40%",
          top: "66%",
          width: "56%",
          aspectRatio: "250 / 284",
          borderRadius: "50%",
          background: "linear-gradient(180deg, #DF9BFF 31.73%, #2CC1EB 100%)",
          opacity: 0.55,
          filter: "blur(80px)",
        }}
      />
      <Flare src="/images/pricing/flare2.svg" style={{ left: "82%", top: "-6px" }} />
      <Flare
        src="/images/pricing/flare.svg"
        style={{ left: "24px", top: "62%" }}
      />

      <div className="relative flex items-center gap-3">
        <Glyph src={IC.code} size={30} />
        <h3
          className="font-display"
          style={{
            fontSize: "var(--fs-h3)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "#111",
          }}
        >
          For Developers
        </h3>
      </div>
      <p
        className="relative mt-2 text-[#555]"
        style={{ fontSize: "var(--fs-body)", lineHeight: 1.4 }}
      >
        Perfect for testing and development
      </p>

      <hr className="relative my-6 border-0 border-t border-[#ECECEC]" />

      <SectionLabel iconSrc={IC.grid}>What&apos;s Included:</SectionLabel>

      <ul className="relative mt-6 flex flex-col gap-[18px]">
        {DEV_FEATURES.map((feature) => (
          <li key={feature} className="flex items-center gap-3.5">
            <Glyph src={IC.checkDev} size={22} />
            <span
              style={{
                fontSize: "var(--fs-body)",
                fontWeight: 500,
                lineHeight: 1.5,
                color: "#111",
              }}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/contact-us"
        className="cs-btn-blue relative w-full"
        style={
          {
            "--cs-btn-fs": "var(--fs-button)",
            "--cs-btn-px": "22px",
            gap: "10px",
            marginTop: "auto",
          } as React.CSSProperties
        }
      >
        <span>Get Started for Free</span>
        <Arrow />
      </Link>
    </div>
  );
}

function EnterpriseCard(): React.ReactElement {
  return (
    <div className="relative h-full">
      <div
        className="relative flex h-full flex-col overflow-hidden rounded-[24px] p-5 pb-6 sm:p-6 sm:pb-7"
        style={{ background: ENTERPRISE_BG }}
      >
        {/* Translucent brand chevron behind the header. */}
        <Glyph
          src={IC.decoChevron}
          className="pointer-events-none absolute right-[-18px] top-[-10px] w-[210px] opacity-90"
        />

        <div className="relative z-[1] mt-2 flex items-center gap-3">
          <Glyph src={IC.entHead} size={30} />
          <h3
            className="font-display text-white"
            style={{
              fontSize: "var(--fs-h3)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Enterprise Image
          </h3>
        </div>
        <p
          className="relative z-[1] mt-1.5 text-white/70"
          style={{ fontSize: "var(--fs-body-sm)", lineHeight: 1.4 }}
        >
          (Application / build / distribution / language-base image)
        </p>

        <div className="relative z-[1] mt-5 flex flex-col gap-4">
          <InnerCard label="What's Included:" glow>
            {ENTERPRISE_INCLUDED.map((item) => (
              <IncludedRow key={item.label} item={item} />
            ))}
          </InnerCard>

          <InnerCard label="Add-ons" labelIconSrc={IC.addons}>
            {ENTERPRISE_ADDONS.map((item) => (
              <IncludedRow key={item.label} item={item} />
            ))}
          </InnerCard>
        </div>

        <Link
          href="/contact-us"
          className="cs-btn-glass relative z-[1] mt-5 w-full"
          style={
            {
              "--cs-btn-fs": "var(--fs-button)",
              "--cs-btn-px": "22px",
            } as React.CSSProperties
          }
        >
          Get a Custom Quote
          <Arrow />
        </Link>
      </div>

      {/* FIPS badge — straddles the card's top-left edge (Figma position),
          reusing the shared listing-card badge style. */}
      <div className="absolute left-6 top-0 z-20 -translate-y-1/2">
        <CategoryBadge label="FIPS Available" />
      </div>
    </div>
  );
}

function InnerCard({
  label,
  labelIconSrc = IC.grid,
  glow = false,
  children,
}: {
  label: string;
  labelIconSrc?: string;
  glow?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      className="rounded-[20px] bg-white p-5 sm:p-6"
      style={
        glow
          ? {
              border: "1.5px solid #2DB8F9",
              boxShadow:
                "0 0 0 1px rgba(45,184,249,0.35), 0 0 24px rgba(45,184,249,0.40), 0 10px 34px -10px rgba(45,184,249,0.45)",
            }
          : undefined
      }
    >
      <SectionLabel iconSrc={labelIconSrc}>{label}</SectionLabel>
      <ul className="mt-5 flex flex-col gap-[18px]">{children}</ul>
    </div>
  );
}

function IncludedRow({ item }: { item: IncludedItem }): React.ReactElement {
  return (
    <li className="flex flex-col gap-2">
      <div className="flex items-start gap-3.5">
        <Glyph src={IC.checkEnt} size={22} className="mt-0.5" />
        <span
          style={{
            fontSize: "var(--fs-body)",
            fontWeight: 500,
            lineHeight: 1.5,
            color: "#111",
          }}
        >
          {item.label}
        </span>
      </div>
      {item.sub ? (
        <div className="flex items-center gap-2 pl-[34px]">
          <Glyph src={IC.subChevron} size={18} />
          <span
            style={{
              fontSize: "var(--fs-body)",
              fontWeight: 500,
              lineHeight: 1.5,
              color: "#111",
            }}
          >
            {item.sub}
          </span>
        </div>
      ) : null}
      {item.note ? (
        <p
          className="pl-[34px]"
          style={{
            fontSize: "var(--fs-body)",
            fontWeight: 500,
            lineHeight: 1.5,
            color: "#666",
          }}
        >
          {item.note}
        </p>
      ) : null}
    </li>
  );
}

function SectionLabel({
  iconSrc,
  children,
}: {
  iconSrc: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-2.5">
      <Glyph src={iconSrc} size={26} />
      <p
        className="font-display"
        style={{
          fontSize: "var(--fs-lead-sm)",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "#333",
        }}
      >
        {children}
      </p>
    </div>
  );
}

/** Renders an extracted Figma SVG glyph; decorative, never announced. */
function Glyph({
  src,
  size,
  className = "",
}: {
  src: string;
  size?: number;
  className?: string;
}): React.ReactElement {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      className={`pointer-events-none select-none shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
      loading="lazy"
      decoding="async"
    />
  );
}

/** "光斑 flare" — the extracted Figma flare sprite, rendered as-is (no glow). */
function Flare({
  src,
  style,
  size = 72,
}: {
  src: string;
  style?: React.CSSProperties;
  size?: number;
}): React.ReactElement {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      className="pointer-events-none select-none absolute"
      style={{ height: size, width: "auto", ...style }}
      loading="lazy"
      decoding="async"
    />
  );
}

function Arrow(): React.ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      focusable="false"
    >
      <path
        d="M4 10h11m0 0-4.2-4.2M15 10l-4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
