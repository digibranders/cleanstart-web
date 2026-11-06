import Image from "next/image";

import { HeroReveal } from "@/components/ui/Reveal";

import { HERO } from "./content";
import { ReportDownloadButton } from "./ReportDownloadButton";

const PAGE_CLASS =
  "absolute w-[56%] overflow-hidden rounded-[8px] bg-white ring-1 ring-white/25 shadow-[0_34px_64px_-20px_rgba(7,6,40,0.7),0_10px_20px_rgba(7,6,40,0.35)] origin-bottom-left transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none";

/**
 * The report as an object: the real cover with two of its inner pages fanned
 * behind it. The fan opens a little on hover, which says "there are pages
 * inside" before anyone reads a word.
 */
function ReportStack(): React.ReactElement {
  return (
    <div className="group relative mx-auto aspect-[1/1.04] w-full max-w-[470px] lg:max-w-[540px]">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[12%] top-[2%] h-[62%] w-[62%] rounded-full opacity-90 blur-[56px]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(192,59,255,0.5) 0%, rgba(192,59,255,0) 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[10%] bottom-[0%] h-[62%] w-[62%] rounded-full opacity-90 blur-[56px]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(44,193,235,0.45) 0%, rgba(44,193,235,0) 70%)",
        }}
      />

      <div className={`${PAGE_CLASS} left-[36%] top-[5%] rotate-[10deg] group-hover:rotate-[14deg]`}>
        <Image
          src="/images/resources/dependency-trust/report-page-chart.webp"
          alt=""
          width={910}
          height={1287}
          sizes="(min-width: 1024px) 300px, 50vw"
          className="h-auto w-full"
        />
      </div>
      <div className={`${PAGE_CLASS} left-[20%] top-[3%] rotate-[4deg] group-hover:rotate-[7deg]`}>
        <Image
          src="/images/resources/dependency-trust/report-page-glance.webp"
          alt=""
          width={910}
          height={1287}
          sizes="(min-width: 1024px) 300px, 50vw"
          className="h-auto w-full"
        />
      </div>
      <div className={`${PAGE_CLASS} left-[3%] top-[8%] -rotate-[4deg] group-hover:-rotate-[6deg]`}>
        <Image
          src="/images/resources/dependency-trust/report-cover.webp"
          alt="Cover of the State of Software Dependency Trust 2026 research report"
          width={910}
          height={1287}
          sizes="(min-width: 1024px) 300px, 50vw"
          priority
          className="h-auto w-full"
        />
      </div>
    </div>
  );
}

export function DependencyTrustHero(): React.ReactElement {
  return (
    <section
      data-section="DependencyTrustHero"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #10123E 36%, #131E8F 70%, #471EC0 100%)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/cleanstart-images/hero-vector-grid.svg"
        alt=""
        className="pointer-events-none absolute left-1/2 top-0 hidden w-[1500px] max-w-none -translate-x-1/2 select-none opacity-70 md:block"
        loading="eager"
        decoding="async"
      />
      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: "calc(clamp(96px, 9.5vw, 138px) + var(--cs-header-extra))",
          paddingBottom: "clamp(56px, 6vw, 96px)",
        }}
      >
        <div className="grid items-center gap-14 lg:grid-cols-[1.06fr_0.94fr] lg:gap-8">
          <div className="flex flex-col items-start">
            <HeroReveal y={50} delay={0.08} duration={1} lcp>
              <h1
                className="text-white"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-display)",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                  textWrap: "balance",
                }}
              >
                {HERO.title}
              </h1>
            </HeroReveal>

            <HeroReveal y={30} delay={0.2} duration={0.8}>
              <p
                className="mt-5 max-w-[560px] text-white"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-lead)",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.4,
                  opacity: 0.82,
                  textWrap: "balance",
                }}
              >
                {HERO.subtitle}
              </p>
            </HeroReveal>

            <HeroReveal y={30} delay={0.32} duration={0.8}>
              <div className="mt-9">
                <ReportDownloadButton label={HERO.cta} tone="glass" />
              </div>
            </HeroReveal>
          </div>

          <HeroReveal y={40} delay={0.2} duration={1} className="w-full">
            <ReportStack />
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
