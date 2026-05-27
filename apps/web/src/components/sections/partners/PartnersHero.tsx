import Link from "next/link";

export function PartnersHero(): React.ReactElement {
  return (
    <section className="relative bg-cs-hero bg-cs-grid overflow-hidden">
      {/* Decorative purple glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "calc(840px / 1920 * 100%)",
          top: "120px",
          width: "520px",
          height: "520px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(122,89,255,0.50) 0%, rgba(122,89,255,0) 100%)",
          filter: "blur(80px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "calc(280px / 1920 * 100%)",
          top: "300px",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(70,30,191,0.45) 0%, rgba(70,30,191,0) 100%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-[clamp(112px,10vw,140px)] pb-[clamp(60px,8vw,110px)]">
        <div className="flex flex-col items-center text-center gap-7">
          <h1
            className="font-display font-semibold text-white mx-auto"
            style={{
              fontSize: "clamp(36px, 4.45vw, 64px)",
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              maxWidth: "860px",
            }}
          >
            Join the Clean Software{" "}
            <span
              style={{
                background:
                  "linear-gradient(90deg, #B68CFF 0%, #7A59FF 50%, #4E2DEB 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Movement.
            </span>
          </h1>

          <p
            className="text-white/80 mx-auto"
            style={{
              fontSize: "var(--text-body-lg)",
              lineHeight: 1.5,
              maxWidth: "560px",
            }}
          >
            Together, we set a new standard for trusted software
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/book-a-demo"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#0F123E] px-5 py-3 font-semibold transition-colors hover:bg-white/90"
              style={{ fontSize: "16px", minHeight: "44px" }}
            >
              Become a Partner
              <ArrowIcon />
            </Link>
            <Link
              href="/deal-registration"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2F49E5] text-white px-5 py-3 font-semibold transition-colors hover:bg-[#2438C2]"
              style={{ fontSize: "16px", minHeight: "44px" }}
            >
              Deal Registration
              <ArrowIcon className="text-white" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArrowIcon({ className = "" }: { className?: string }): React.ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      role="img"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <title>Arrow right</title>
      <path
        d="M3.5 8h9m0 0L9 4.5M12.5 8 9 11.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
