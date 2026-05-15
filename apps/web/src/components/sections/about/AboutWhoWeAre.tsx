import Image from "next/image";

const PILLARS = [
  {
    icon: "/images/about/icon-secure-foundation.png",
    title: "Secure Foundation",
    description: "Security built in from the start",
  },
  {
    icon: "/images/about/icon-continuous-compliance.png",
    title: "Continuous Compliance",
    description: "Always audit-ready",
  },
  {
    icon: "/images/about/icon-full-visibility.png",
    title: "Full Visibility",
    description: "Every artifact verifiable",
  },
];

export function AboutWhoWeAre() {
  return (
    <section className="relative overflow-hidden bg-white py-[120px]">
      {/* Decorative vector — Figma left edge, x=38 y=-244, 701×680 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/about/who-we-are-vector.svg"
        alt=""
        className="pointer-events-none absolute select-none"
        style={{
          left: "2%",
          top: "-244px",
          width: "min(701px, 37vw)",
          height: "auto",
          opacity: 0.55,
        }}
        loading="lazy"
        decoding="async"
      />
      {/* Decorative union — Figma right edge, rotated 141deg -scaleY */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/about/who-we-are-union.svg"
        alt=""
        className="pointer-events-none absolute select-none hidden xl:block"
        style={{
          right: "-80px",
          top: "50%",
          width: "380px",
          height: "auto",
          transform: "scaleY(-1) rotate(141.39deg)",
          opacity: 0.35,
        }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[1276px] px-6">
        {/* Heading row */}
        <div className="flex flex-col items-start gap-12 lg:flex-row lg:items-start lg:gap-[106px]">
          <h2
            className="shrink-0 font-sans font-bold"
            style={{
              fontSize: "clamp(2.5rem, 4vw, 3.875rem)",
              lineHeight: "1.0",
              letterSpacing: "-0.05em",
              color: "#111",
              whiteSpace: "nowrap",
            }}
          >
            Who We{" "}
            <span
              style={{
                background:
                  "linear-gradient(-22.7deg, #2CC1EB 0%, #9A51FF 64%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Are
            </span>
          </h2>

          <p
            className="font-sans"
            style={{
              fontSize: "clamp(1.1rem, 1.8vw, 1.875rem)",
              fontWeight: 400,
              lineHeight: "1.4",
              letterSpacing: "-0.04em",
              color: "rgba(17,17,17,0.8)",
              maxWidth: "840px",
            }}
          >
            CleanStart builds trusted software delivery by integrating security,
            compliance, and provenance into every build—giving enterprises
            confidence from source to production.
          </p>
        </div>

        {/* Three pillar columns */}
        <div className="relative mt-[60px]">
          {/* Vertical dividers */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/about/pillar-divider-1.svg"
            alt=""
            className="pointer-events-none absolute select-none hidden lg:block"
            style={{
              left: "calc(33.33% - 0.75px)",
              top: "0",
              width: "1.5px",
              height: "249px",
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/about/pillar-divider-2.svg"
            alt=""
            className="pointer-events-none absolute select-none hidden lg:block"
            style={{
              left: "calc(66.67% - 0.75px)",
              top: "0",
              width: "1.5px",
              height: "249px",
            }}
          />

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div key={pillar.title} className="flex flex-col gap-6 px-0 sm:px-8 first:pl-0 last:pr-0">
                <div className="relative h-[100px] w-[100px] overflow-hidden rounded-lg shrink-0">
                  <Image
                    src={pillar.icon}
                    alt={pillar.title}
                    width={100}
                    height={100}
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <h3
                    className="font-display text-[2rem] font-bold leading-none tracking-[-0.05em]"
                    style={{ color: "#333" }}
                  >
                    {pillar.title}
                  </h3>
                  <p
                    className="text-xl font-normal leading-[1.4] tracking-[-0.05em]"
                    style={{ color: "#333" }}
                  >
                    {pillar.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
