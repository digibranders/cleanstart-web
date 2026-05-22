import { ArrowRightShort } from "@/components/icons/ArrowRightShort";
import { HeroOrb } from "@/components/sections/home/HeroOrb";
import { TrustedByMarquee } from "@/components/sections/home/TrustedByMarquee";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-[clamp(96px,11vw,178px)]">

      <div className="mx-auto max-w-[var(--container-default)] px-6">
        <div className="mx-auto flex max-w-[1201px] flex-col items-center gap-6 text-center sm:gap-8">
          <h1
            className="font-display font-semibold text-white"
            style={{
              // Figma node 763:3567 exact spec (1440 home design):
              // Manrope SemiBold 72px / line-none / tracking -3.6px (= -0.05em)
              fontSize: "var(--text-hero-marketing)",
              letterSpacing: "-0.05em",
              lineHeight: 1,
            }}
          >
            Secure by Design. Built from Source. Verified Container Images
          </h1>

          <a
            href="#browse-images"
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
        </div>

        <div className="mt-12">
          <HeroOrb />
        </div>

        <div className="pb-16">
          <TrustedByMarquee />
        </div>
      </div>

      {/* fade to white at bottom for next section transition */}
      <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px" />
    </section>
  );
}
