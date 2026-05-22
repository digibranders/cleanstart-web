import Image from "next/image";

/**
 * "What this delivers for your business" — Figma node 783:452.
 *
 * Layout:
 *   - Full-bleed person photo (right-weighted) with purple→navy left overlay
 *   - Title top-left ("your business" gradient)
 *   - 4 benefit columns at the bottom, each ~263 px wide, with a 1×123 px
 *     vertical gradient separator between them (Figma Rectangle 1000001844).
 *
 * Below md the benefits stack into a 2×2 grid (no vertical separators).
 */

const BENEFITS = [
  { title: "Reduced Security Exposure", desc: "Fewer inherited vulnerabilities." },
  { title: "Smaller CVE Backlogs",       desc: "Less remediation overhead." },
  { title: "Faster Compliance Reviews",  desc: "Cleaner, simpler SBOMs." },
  { title: "Lower Operational Overhead", desc: "Less patching and maintenance." },
] as const;

export function ASRDelivers(): React.ReactElement {
  return (
    <section
      data-section="ASRDelivers"
      className="relative overflow-hidden"
      style={{ minHeight: "clamp(560px, 50vw, 711px)" }}
    >
      {/* ---------- Background photo + overlay ---------- */}
      <div aria-hidden className="absolute inset-0">
        <Image
          src="/images/attack-surface-reduction/s4-person.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-right"
          style={{ filter: "brightness(0.55)" }}
          loading="lazy"
        />
        {/* Left-to-right purple overlay (Figma 783:458 — purple → transparent) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(19,30,143,0.92) 0%, rgba(71,30,192,0.70) 45%, rgba(71,30,192,0.30) 75%, rgba(0,0,0,0.10) 100%)",
          }}
        />
      </div>

      {/* ---------- Content ---------- */}
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 py-section-lg flex flex-col h-full">
        {/* Heading (top-left) — Figma 783:457: Figtree Bold 62/100%/-5% */}
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-t-display-2)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1,
            color: "white",
            maxWidth: "32.5rem", // Figma 519 / 16
            marginBottom: "clamp(3rem, 8vw, 8.75rem)", // Figma ~170 px title→items
          }}
        >
          What this delivers for{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(96deg, #9A51FF 0%, #2CC1EB 100%)",
            }}
          >
            your business
          </span>
        </h2>

        {/* ---------- Benefits row (md+): 4 columns + 3 separators ---------- */}
        <div className="hidden md:flex items-stretch justify-between gap-6 lg:gap-8">
          {BENEFITS.map((b, i) => (
            <div key={b.title} className="flex items-stretch gap-6 lg:gap-8 flex-1">
              <BenefitColumn title={b.title} desc={b.desc} />
              {i < BENEFITS.length - 1 && <Separator />}
            </div>
          ))}
        </div>

        {/* ---------- Benefits grid (sm and below): 2×2 ---------- */}
        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
          {BENEFITS.map((b) => (
            <BenefitColumn key={b.title} title={b.title} desc={b.desc} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitColumn({
  title,
  desc,
}: {
  title: string;
  desc: string;
}): React.ReactElement {
  return (
    <div className="flex flex-col flex-1 min-w-0" style={{ gap: "0.75rem", maxWidth: "16.4375rem" /* Figma 263 / 16 */ }}>
      {/* Figma 783:462: Figtree Bold 32/100%/-5% */}
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-card-title-lg)",
          fontWeight: 700,
          letterSpacing: "-0.05em",
          lineHeight: 1,
          color: "white",
        }}
      >
        {title}
      </h3>
      {/* Figma 783:463: Figtree Regular 22/130%/-5% color #DDD */}
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-body-lg)",
          fontWeight: 400,
          letterSpacing: "-0.05em",
          lineHeight: 1.3,
          color: "#DDDDDD",
        }}
      >
        {desc}
      </p>
    </div>
  );
}

function Separator(): React.ReactElement {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      aria-hidden
      src="/images/attack-surface-reduction/business-delivers-separator.svg"
      alt=""
      className="self-center shrink-0 pointer-events-none select-none"
      style={{
        width: "1px",
        height: "clamp(5rem, 9vw, 7.6875rem)", // Figma 123 px max
      }}
    />
  );
}
