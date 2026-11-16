import Image from "next/image";

import { HeroReveal } from "@/components/ui/Reveal";

import { ReportButton } from "./ReportButton";
import { HERO } from "./content";
import { buildDotColumns } from "./field";
import { DotField } from "./visuals";

const COLUMNS = buildDotColumns(46, 16, 31, 2026);

const PAGE_CLASS =
  "absolute w-[56%] overflow-hidden rounded-[8px] bg-white ring-1 ring-white/25 shadow-[0_34px_64px_-20px_rgba(7,6,40,0.7),0_10px_20px_rgba(7,6,40,0.35)] origin-bottom-left transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none";

/**
 * The report as an object: the real cover with two of its inner pages fanned
 * behind it. The fan opens a little on hover, which says "there are pages
 * inside" before anyone reads a word.
 */
function ReportStack(): React.ReactElement {
  return (
    <div className="group relative mx-auto aspect-[1/1.04] w-[90%] max-w-[440px] lg:max-w-[500px]">
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
          sizes="(min-width: 1024px) 280px, 50vw"
          className="h-auto w-full"
        />
      </div>
      <div className={`${PAGE_CLASS} left-[20%] top-[3%] rotate-[4deg] group-hover:rotate-[7deg]`}>
        <Image
          src="/images/resources/dependency-trust/report-page-glance.webp"
          alt=""
          width={910}
          height={1287}
          sizes="(min-width: 1024px) 280px, 50vw"
          className="h-auto w-full"
        />
      </div>
      <div className={`${PAGE_CLASS} left-[3%] top-[8%] -rotate-[4deg] group-hover:-rotate-[6deg]`}>
        <Image
          src="/images/resources/dependency-trust/report-cover.webp"
          alt="Cover of the State of Software Dependency Trust 2026 research report"
          width={910}
          height={1287}
          sizes="(min-width: 1024px) 280px, 50vw"
          className="h-auto w-full"
        />
      </div>
    </div>
  );
}

export function Hero(): React.ReactElement {
  return (
    <section
      data-section="ReportHero"
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #151021 0%, #10123E 40%, #131E8F 78%, #471EC0 100%)" }}
    >
      {/* The estate lies on a receding plane under the report: live components lit, aged ones hollow. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] select-none overflow-hidden"
        style={{
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 60%)",
          WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 60%)",
        }}
      >
        <div
          className="absolute bottom-[-12%] left-1/2 w-[190%] max-w-[2600px] origin-bottom opacity-80 lg:w-[150%]"
          style={{ transform: "translateX(-50%) perspective(900px) rotateX(64deg)" }}
        >
          <DotField columns={COLUMNS} variant="estate" shape="circle" label="" ambient />
        </div>
      </div>

      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: "calc(clamp(88px, 7.5vw, 112px) + var(--cs-header-extra))",
          paddingBottom: "clamp(48px, 5vw, 80px)",
        }}
      >
        <div className="grid items-center gap-14 lg:grid-cols-[1.06fr_0.94fr] lg:gap-8">
          <div className="flex flex-col items-start">
            <HeroReveal y={30} delay={0} duration={0.8}>
              <p
                className="mb-5 inline-flex items-center rounded-full border border-white/20 bg-white/[0.06] px-3.5 py-1.5 text-white/85"
                style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-eyebrow)", fontWeight: 500, letterSpacing: "0.02em" }}
              >
                {HERO.eyebrow}
              </p>
            </HeroReveal>
            <HeroReveal y={50} delay={0.08} duration={1} lcp>
              <h1
                className="max-w-[14ch] text-white"
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
                className="mt-5 max-w-[34ch] text-white"
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
                <ReportButton label={HERO.cta} tone="glass" />
              </div>
            </HeroReveal>
          </div>

          <HeroReveal y={40} delay={0.2} duration={1} className="hidden w-full lg:block">
            <ReportStack />
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
