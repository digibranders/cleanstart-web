import { ArrowRightShort } from "@/components/icons/ArrowRightShort";
import { HeroOrb } from "@/components/sections/home/HeroOrb";
import { TrustedByMarquee } from "@/components/sections/home/TrustedByMarquee";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-[88px] sm:pt-[110px] lg:pt-[126px]">

      <div className="mx-auto max-w-[1276px] px-6">
        <div className="mx-auto flex max-w-[1201px] flex-col items-center gap-6 text-center sm:gap-8">
          <h1 className="font-display text-[clamp(2.25rem,6.5vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.05em] text-white lg:leading-[1]">
            Secure by Design. Built from Source.
            <br className="hidden sm:inline" />
            <span className="sm:hidden"> </span>
            Verified Container Images
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
