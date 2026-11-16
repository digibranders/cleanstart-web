import Image from "next/image";

import { HeroReveal } from "@/components/ui/Reveal";

import { ReportButton } from "./ReportButton";
import { HERO } from "./content";
import { buildDotColumns } from "./field";
import { DotField } from "./visuals";

const COLUMNS = buildDotColumns(46, 16, 31, 2026);

const PAGE =
  "absolute w-full overflow-hidden rounded-[8px] bg-white shadow-[0_30px_60px_-24px_rgba(7,6,40,0.75)] ring-1 ring-white/20";

/**
 * The report as an object, turned a little on its plane. Two inner pages show
 * behind the cover and the whole stack levels out on hover, so it reads as
 * something with pages in it.
 */
function ReportObject(): React.ReactElement {
  return (
    <div className="group relative ml-auto mr-[clamp(24px,3.5vw,56px)] w-full max-w-[280px] [perspective:1400px] xl:max-w-[300px]">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[14%] rounded-full opacity-80 blur-[70px]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(106,61,240,0.55) 0%, rgba(44,193,235,0.18) 55%, rgba(44,193,235,0) 100%)",
        }}
      />
      <div
        className="relative aspect-[910/1287] w-[87%] transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] [transform-style:preserve-3d] [transform:rotateY(-12deg)_rotateX(4deg)_rotateZ(1.5deg)] group-hover:[transform:rotateY(-5deg)_rotateX(2deg)_rotateZ(1deg)] motion-reduce:transition-none"
      >
        <div className={`${PAGE} left-[9%] top-[-5%] opacity-80 [transform:translateZ(-60px)]`}>
          <Image
            src="/images/resources/dependency-trust/report-page-chart.webp"
            alt=""
            width={910}
            height={1287}
            sizes="270px"
            className="h-auto w-full"
          />
        </div>
        <div className={`${PAGE} left-[4.5%] top-[-2.5%] opacity-90 [transform:translateZ(-30px)]`}>
          <Image
            src="/images/resources/dependency-trust/report-page-glance.webp"
            alt=""
            width={910}
            height={1287}
            sizes="270px"
            className="h-auto w-full"
          />
        </div>
        <div className={`${PAGE} left-0 top-0`}>
          <Image
            src="/images/resources/dependency-trust/report-cover.webp"
            alt="Cover of the State of Software Dependency Trust 2026 research report"
            width={910}
            height={1287}
            sizes="270px"
            className="h-auto w-full"
          />
        </div>
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
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 lg:flex lg:min-h-[732px] lg:items-center"
        style={{
          paddingTop: "calc(clamp(88px, 7.5vw, 112px) + var(--cs-header-extra))",
          paddingBottom: "clamp(48px, 5vw, 80px)",
        }}
      >
        <div className="grid items-center gap-16 lg:w-full lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
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
            <ReportObject />
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
