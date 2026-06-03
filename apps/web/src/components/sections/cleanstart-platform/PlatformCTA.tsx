import Link from "next/link";
import { ArrowRightShort } from "@/components/icons/ArrowRightShort";

export function PlatformCTA() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #131e8f 0%, #471ec0 111%)",
      }}
    >
      {/* Decorative union bg pattern */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/cleanstart-platform/cta-bg-union.svg"
        alt=""
        aria-hidden
        className="pointer-events-none select-none absolute opacity-[0.12]"
        style={{ left: "38%", top: "-60%", width: "86%", height: "auto" }}
        loading="lazy"
        decoding="async"
      />

      {/* Purple glow — top-left */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[139px] -top-[168px] size-[320px] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(154,81,255,0.55) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Cyan glow — bottom-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          right: "-80px",
          bottom: "-100px",
          width: "511px",
          height: "511px",
          background:
            "radial-gradient(closest-side, rgba(44,193,235,0.25) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Textured cube — bleeds out bottom-right corner */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/cleanstart-platform/cta-cube-textured.png"
        alt=""
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          right: "-50px",
          bottom: "-60px",
          width: "220px",
          height: "220px",
          objectFit: "contain",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Content */}
      <div
        className="relative z-10 flex h-full flex-col items-start justify-center lg:flex-row lg:items-center"
        style={{
          padding: "clamp(28px, 4vw, 56px) clamp(28px, 5vw, 80px)",
          gap: "clamp(20px, 5vw, 68px)",
        }}
      >
        {/* Left: title */}
        <p
          className="shrink-0 font-bold text-white"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            maxWidth: "min(460px, 100%)",
          }}
        >
          Reconstruct Trust from the Source
        </p>

        {/* Right: description + button */}
        <div
          className="flex flex-col"
          style={{ gap: "clamp(16px, 1.5vw, 28px)", maxWidth: "520px" }}
        >
          <p
            className="text-white/80"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--cta-card-desc)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
            }}
          >
            Explore how CleanStart builds trusted software foundations through
            AI-native intelligence and deterministic trust architecture.
          </p>

          <Link
            href="/book-a-demo"
            className="cs-btn-glass self-start"
            style={
              {
                "--cs-btn-h": "44px",
                "--cs-btn-px": "18px",
                "--cs-btn-fs": "16px",
                color: "#111111",
                letterSpacing: "-0.01em",
                fontWeight: 500,
              } as React.CSSProperties
            }
          >
            <span>Read the Architecture Brief</span>
            <ArrowRightShort className="cs-cta-arrow text-[#111111]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
