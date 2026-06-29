import Link from "next/link";
import { HeroReveal } from "@/components/ui/Reveal";

export function PricingHero(): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 -25.7%, #10123E 31.16%, #131E8F 51.01%, #471EC0 68.71%, #471FC3 79.83%, rgba(70, 30, 191, 0.85) 85.02%, rgba(66, 30, 188, 0.40) 93.72%, rgba(66, 30, 188, 0.00) 100.66%), #ffffff",
      }}
    >
      {/* Same subtle gridlines as the Partners hero (bg-cs-grid). */}
      <div
        aria-hidden
        className="bg-cs-grid pointer-events-none absolute inset-0"
      />

      {/* Faint purple ellipse glow, upper-left (Figma Ellipse 46640). */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "-15%",
          top: "-360px",
          width: "974px",
          height: "862px",
          borderRadius: "50%",
          background: "#7A59FF",
          opacity: 0.06,
          filter: "blur(125px)",
          transform: "rotate(43deg)",
        }}
      />

      <div className="relative z-[2] mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-[calc(clamp(112px,10vw,140px)+var(--cs-header-extra))] pb-[clamp(110px,13vw,190px)]">
        <div className="flex flex-col items-center text-center gap-7">
          <HeroReveal y={50} duration={1.0}>
            <h1
              className="font-display font-semibold text-white mx-auto"
              style={{
                fontSize: "var(--fs-display)",
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
                maxWidth: "860px",
              }}
            >
              Choose Your{" "}
              <span className="cs-text-gradient-impact">Deployment Model</span>
            </h1>
          </HeroReveal>

          <HeroReveal y={30} delay={0.15} duration={0.8}>
            <p
              className="text-white/80 mx-auto"
              style={{
                fontSize: "var(--fs-lead-sm)",
                lineHeight: 1.5,
                maxWidth: "640px",
              }}
            >
              From community-ready images to enterprise-grade
              <span className="block">software supply chain security.</span>
            </p>
          </HeroReveal>

          <HeroReveal y={30} delay={0.3} duration={0.8}>
            <Link
              href="/contact-us"
              className="cs-btn-glass"
              style={
                {
                  "--cs-btn-px": "24px",
                  "--cs-btn-fs": "16px",
                } as React.CSSProperties
              }
            >
              Talk to Sales
            </Link>
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
