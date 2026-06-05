import { ArrowRightShort } from "@/components/icons/ArrowRightShort";
import { TrustedByMarquee } from "@/components/sections/home/TrustedByMarquee";
import { HeroReveal } from "@/components/ui/Reveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-[clamp(72px,8vw,128px)]">

      <div className="mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div className="mx-auto flex max-w-[1201px] flex-col items-center gap-6 text-center sm:gap-8">
          <HeroReveal y={50} duration={1.0}>
            <h1
              className="font-display font-semibold text-white"
              style={{
                fontSize: "var(--fs-display)",
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
              }}
            >
              Trusted Foundations for Modern Software
            </h1>
          </HeroReveal>

          <HeroReveal y={30} delay={0.2} duration={0.8}>
            <a
              href="https://images.cleanstart.com"
              target="_blank"
              rel="noopener noreferrer"
              className="cs-btn-glass"
              style={{
                ["--cs-btn-px" as string]: "18px",
                ["--cs-btn-fs" as string]: "20px",
                color: "#111111",
                letterSpacing: "-0.05em",
                fontWeight: 500,
              }}
            >
              <span>Browse Images</span>
              <ArrowRightShort className="cs-cta-arrow text-[#111111]" />
            </a>
          </HeroReveal>
        </div>

        <div className="pb-8 pt-24">
          <TrustedByMarquee />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px" />
    </section>
  );
}
