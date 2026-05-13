import Image from "next/image";

const FEATURE_CARDS = [
  {
    title: "Accelerates Development",
    description:
      "Security no longer slows innovation. CleanStart automates compliance and hardens builds from the source, giving developers freedom to move fast without risk.",
  },
  {
    title: "End-to-End Transparency",
    description:
      "Every artifact tells its story. With CleanStart, every software component from source to production carries full provenance and cryptographic proof of trust.",
  },
  {
    title: "Secure by Design",
    description:
      "Security is strongest when it starts at the foundation. CleanStart embeds trust and compliance deeply into every build, making every release inherently secure by default.",
  },
];

export function AboutPowering() {
  return (
    <section
      className="relative overflow-hidden bg-cs-hero"
      style={{ minHeight: "1017px" }}
    >
      {/* Background grid vectors — Figma: left at -525px/top:394px and right at 1521px/top:-210px */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/about/powering-bg-vector.svg"
        alt=""
        className="pointer-events-none absolute select-none"
        style={{ left: "-525px", top: "394px", width: "979px", height: "979px" }}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/about/powering-bg-vector.svg"
        alt=""
        className="pointer-events-none absolute select-none"
        style={{ left: "1521px", top: "-210px", width: "979px", height: "979px" }}
        loading="lazy"
        decoding="async"
      />
      {/* Decorative purple radial blobs on the sides */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "-80px",
          top: "150px",
          width: "432px",
          height: "432px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(122,89,255,0.25) 0%, transparent 100%)",
          filter: "blur(40px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          right: "-80px",
          top: "150px",
          width: "432px",
          height: "432px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(122,89,255,0.25) 0%, transparent 100%)",
          filter: "blur(40px)",
        }}
      />

      {/* Subtle vertical guide lines — matches Figma white gradient lines */}
      {[323, 726, 759, 1164, 1195, 1599].map((x) => (
        <div
          key={x}
          aria-hidden
          className="pointer-events-none absolute top-0 bottom-0 hidden xl:block"
          style={{
            left: `calc(${x}px / 1920 * 100%)`,
            width: "1px",
            background:
              "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.12) 65%, transparent 100%)",
          }}
        />
      ))}

      <div className="relative mx-auto max-w-[1276px] px-6 pt-[100px] pb-[120px]">
        {/* Section header */}
        <div className="mx-auto flex max-w-[969px] flex-col items-center gap-6 text-center text-white">
          <h2
            className="font-sans font-bold"
            style={{
              fontSize: "clamp(2rem, 3.5vw, 3.875rem)",
              lineHeight: "1.0",
              letterSpacing: "-0.05em",
            }}
          >
            Powering Trusted Software Delivery for Global Leaders.
          </h2>
          <p
            className="font-sans"
            style={{
              fontSize: "clamp(1rem, 1.8vw, 1.875rem)",
              fontWeight: 400,
              lineHeight: "1.4",
              letterSpacing: "-0.04em",
              opacity: 0.8,
              maxWidth: "835px",
            }}
          >
            Tailored solutions for every role in your organization — from
            security leaders to engineering teams.
          </p>
        </div>

        {/* Horizontal divider line */}
        <div
          aria-hidden
          className="my-16 h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
          }}
        />

        {/* Feature cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {FEATURE_CARDS.map((card) => (
            <FeatureCard key={card.title} {...card} />
          ))}
        </div>
      </div>

      {/* Bottom cyan glow flares */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-[285px] mix-blend-screen"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 100%, rgba(21,173,250,0.18) 0%, rgba(1,102,204,0.12) 40%, transparent 70%)",
        }}
      />
    </section>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="relative">
      {/* Outer cyan glow frame — Figma powering-card-glow.svg (404×478 at opacity 0.3) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/about/powering-card-glow.svg"
        alt=""
        className="pointer-events-none absolute select-none"
        style={{
          top: "-20px",
          left: "-22px",
          width: "calc(100% + 44px)",
          height: "calc(100% + 40px)",
        }}
      />
      {/* White card */}
      <div
        className="relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-white p-8"
        style={{
          boxShadow: "0 24px 48px -16px rgba(28,60,142,0.18)",
        }}
      >
        {/* Blue ball icon */}
        <div
          className="flex items-center justify-center overflow-hidden rounded-full shrink-0"
          style={{
            width: "96px",
            height: "96px",
            background: "linear-gradient(180deg, #239CFF 0%, #005BE3 100%)",
            boxShadow: "0 6px 14px rgba(28,60,142,0.33)",
          }}
        >
          <Image
            src="/images/about/feature-card-icon.svg"
            alt=""
            width={54}
            height={54}
            className="h-[54px] w-[54px] object-contain"
          />
        </div>

        <div className="flex flex-col gap-4">
          <h3
            className="font-sans font-bold text-[#111]"
            style={{
              fontSize: "32px",
              lineHeight: "1.0",
              letterSpacing: "-0.05em",
            }}
          >
            {title}
          </h3>
          <p
            className="font-sans text-[#555]"
            style={{
              fontSize: "20px",
              fontWeight: 400,
              lineHeight: "1.4",
              letterSpacing: "-0.05em",
            }}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
