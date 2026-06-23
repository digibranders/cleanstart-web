import {
  DETAIL_HERO_GRADIENT,
  DETAIL_HERO_TITLE_STYLE,
} from "@/components/sections/_shared/DetailHero";
import { HeroBreadcrumb } from "@/components/sections/_shared/HeroBreadcrumb";
import { HeroReveal } from "@/components/ui/Reveal";

interface MetaItem {
  label: string;
  value: string;
}

interface CareerDetailHeroProps {
  title: string;
  meta: MetaItem[];
}

export function CareerDetailHero({
  title,
  meta,
}: CareerDetailHeroProps): React.ReactElement {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: DETAIL_HERO_GRADIENT }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blogs/cta-cube-right.webp"
        alt=""
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          width: "clamp(140px, 18vw, 240px)",
          height: "auto",
          right: "-30px",
          top: "20px",
          mixBlendMode: "screen",
          opacity: 0.85,
        }}
        loading="lazy"
        decoding="async"
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blogs/cta-cube-left.webp"
        alt=""
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          width: "clamp(140px, 18vw, 240px)",
          height: "auto",
          left: "-30px",
          bottom: "-20px",
          mixBlendMode: "screen",
          opacity: 0.85,
        }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <HeroBreadcrumb
          items={[{ label: "Careers", href: "/careers" }, { label: title }]}
          navClassName="pt-[calc(var(--cs-header-h)+env(safe-area-inset-top)+clamp(8px,2vw,24px))]"
        />

        <div className="flex justify-center mt-6 md:mt-10">
          <HeroReveal y={40} duration={0.9}>
            <h1
              className="font-display font-semibold text-white text-center"
              style={{ ...DETAIL_HERO_TITLE_STYLE, maxWidth: "860px" }}
            >
              {title}
            </h1>
          </HeroReveal>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blogs/hero-divider-line.svg"
          alt=""
          aria-hidden
          className="w-full mt-[28px] md:mt-[40px]"
          style={{ height: "1px", display: "block" }}
          loading="lazy"
          decoding="async"
        />

        <div className="flex flex-col items-stretch sm:flex-row sm:flex-wrap sm:items-center sm:justify-center gap-y-2 gap-x-6 pt-[14px] pb-[22px]">
          {meta.map((item, idx) => (
            <div
              key={item.label}
              className="flex items-center justify-center sm:justify-start gap-2"
            >
              <span
                className="font-sans"
                style={{
                  fontSize: "var(--fs-caption)",
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.7)",
                  letterSpacing: "-0.005em",
                }}
              >
                {item.label}:
              </span>
              <span
                className="font-sans"
                style={{
                  fontSize: "var(--fs-caption)",
                  fontWeight: 500,
                  color: "#fff",
                  letterSpacing: "-0.005em",
                }}
              >
                {item.value}
              </span>
              {idx < meta.length - 1 && (
                <span
                  aria-hidden
                  className="hidden sm:inline-block"
                  style={{
                    width: "1px",
                    height: "16px",
                    background: "rgba(255,255,255,0.18)",
                    marginLeft: "16px",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

