import Image from "next/image";

const BENEFITS: { title: string; desc: string }[] = [
  { title: "Reduced Security Exposure", desc: "Fewer inherited vulnerabilities." },
  { title: "Smaller CVE Backlogs", desc: "Less remediation overhead." },
  { title: "Faster Compliance Reviews", desc: "Cleaner, simpler SBOMs." },
  { title: "Lower Operational Overhead", desc: "Less patching and maintenance." },
];

export function ASRDelivers(): React.ReactElement {
  return (
    <section
      data-section="ASRDelivers"
      className="relative overflow-hidden"
      style={{ minHeight: "711px" }}
    >
      {/* Full-bleed person photo background */}
      <div className="absolute inset-0">
        <Image
          src="/images/attack-surface-reduction/s4-person.jpg"
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className="object-cover object-center"
          style={{ filter: "brightness(0.55)" }}
          loading="lazy"
        />
        {/* Dark gradient overlay left-to-right */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(19,30,143,0.92) 0%, rgba(71,30,192,0.7) 50%, rgba(0,0,0,0.15) 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div
        className="relative mx-auto max-w-[1276px] px-4 sm:px-6 py-section-md"
      >
        {/* Heading */}
        <h2
          style={{
            fontFamily: "var(--font-figtree)",
            fontSize: "clamp(28px, 3.23vw, 62px)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1.05,
            color: "white",
            maxWidth: "560px",
            marginBottom: "60px",
          }}
        >
          What this delivers for{" "}
          <span
            style={{
              background: "linear-gradient(95deg, #9A51FF 0%, #2CC1EB 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            your business
          </span>
        </h2>

        {/* 4 benefit columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" style={{ gap: "32px" }}>
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex flex-col" style={{ gap: "10px" }}>
              <h3
                style={{
                  fontFamily: "var(--font-figtree)",
                  fontSize: "clamp(16px, 1.67vw, 32px)",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.2,
                  color: "white",
                }}
              >
                {b.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-figtree)",
                  fontSize: "clamp(13px, 1.15vw, 22px)",
                  fontWeight: 400,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.5,
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
