import Image from "next/image";
import Link from "next/link";

const AWARDS = [
  { src: "/images/cleansight/award-1.png", alt: "Cyber Security award badge" },
  { src: "/images/cleansight/award-2.png", alt: "Security vendor award badge" },
  { src: "/images/cleansight/award-3.png", alt: "ISO 27001 award badge" },
  { src: "/images/cleansight/award-4.png", alt: "AICPA SOC 2 award badge" },
];

export function CleanSightCTA(): React.ReactElement {
  return (
    <div
      className="relative mx-auto overflow-hidden rounded-[40px] bg-white"
      style={{
        maxWidth: "1276px",
        padding: "80px 100px",
        display: "flex",
        gap: "68px",
        alignItems: "flex-start",
      }}
    >
      {/* Decorative Union blob */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          left: "547px",
          top: "-220px",
          width: "1101px",
          height: "1101px",
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(154,81,255,0.06) 0%, transparent 60%)",
        }}
      />
      {/* Purple glow right */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          right: "-120px",
          top: "100px",
          width: "511px",
          height: "511px",
          borderRadius: "50%",
          background: "rgba(154, 81, 255, 0.08)",
          filter: "blur(80px)",
        }}
      />
      {/* Purple glow top-left */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          left: "-70px",
          top: "-84px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "rgba(44, 193, 235, 0.06)",
          filter: "blur(60px)",
        }}
      />

      {/* Floating product screenshot (desktop decorative) */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          left: "330px",
          bottom: "0px",
          width: "259px",
          height: "260px",
          transform: "rotate(-15deg)",
          opacity: 0.9,
        }}
      >
        <Image
          src="/images/cleansight/cta-screenshot.png"
          alt=""
          width={213}
          height={213}
          sizes="260px"
          className="object-cover"
        />
      </div>

      {/* Left: headline */}
      <h2
        className="relative flex-shrink-0"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(28px, 2.86vw, 55px)",
          fontWeight: 700,
          letterSpacing: "-0.05em",
          lineHeight: 1.0,
          color: "#111",
          width: "401px",
          zIndex: 1,
        }}
      >
        See Everything. Fix Everything.
      </h2>

      {/* Right: description + CTA */}
      <div className="relative flex flex-col gap-10 flex-1" style={{ zIndex: 1 }}>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(14px, 1.09vw, 21px)",
            fontWeight: 400,
            letterSpacing: "-0.04em",
            lineHeight: 1.4,
            color: "#111",
            opacity: 0.8,
            maxWidth: "607px",
          }}
        >
          Continuous container visibility with integrated remediation across
          modern environments.
        </p>

        <Link
          href="/contact-us"
          className="self-start inline-flex items-center gap-2 rounded-[8px] text-white font-medium"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(14px, 0.94vw, 18px)",
            letterSpacing: "-0.01em",
            background: "#3960F9",
            padding: "11px 20px",
            boxShadow: "0 0 0 1px #3960F9",
          }}
        >
          Book a Container Scan
          <svg
            aria-hidden
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export function CleanSightAwards(): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-4 mt-16 xl:mt-[80px]">
      <p
        className="text-white text-center font-semibold"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(14px, 1.04vw, 20px)",
          letterSpacing: "-0.04em",
          opacity: 0.9,
        }}
      >
        Awarded with
      </p>
      <div className="flex gap-6 items-center flex-wrap justify-center">
        {AWARDS.map((a) => (
          <div
            key={a.alt}
            className="relative rounded-[8px] overflow-hidden"
            style={{ width: "97px", height: "120px" }}
          >
            <Image
              src={a.src}
              alt={a.alt}
              fill
              sizes="97px"
              className="object-contain"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
