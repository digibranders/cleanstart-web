import Link from "next/link";
import { HeroReveal } from "@/components/ui/Reveal";
import { BecomePartnerCta } from "@/components/sections/partners/BecomePartnerCta";

export function PartnersHero(): React.ReactElement {
  return (
    <section className="relative bg-cs-hero bg-cs-grid overflow-hidden">
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

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-[calc(clamp(112px,10vw,140px)+var(--cs-header-extra))] pb-[clamp(60px,8vw,110px)]">
        <div className="flex flex-col items-center text-center gap-7">
          <HeroReveal y={50} duration={1.0} lcp>
            <h1
              className="font-display font-semibold text-white mx-auto"
              style={{
                fontSize: "var(--fs-display)",
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
                maxWidth: "860px",
              }}
            >
              Join the Clean Software Movement.
            </h1>
          </HeroReveal>

          <HeroReveal y={30} delay={0.15} duration={0.8}>
            <p
              className="text-white/80 mx-auto"
              style={{
                fontSize: "var(--fs-lead-sm)",
                lineHeight: 1.5,
                maxWidth: "560px",
              }}
            >
              Together, we set a new standard for trusted software
            </p>
          </HeroReveal>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <BecomePartnerCta />
            <Link
              href="/deal-registration"
              className="cs-btn-blue"
              style={
                {
                  ["--cs-btn-fs" as string]: "var(--fs-button)",
                  ["--cs-btn-px" as string]: "22px",
                  gap: "10px",
                } as React.CSSProperties
              }
            >
              <span>Deal Registration</span>
              <ArrowIcon />
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
