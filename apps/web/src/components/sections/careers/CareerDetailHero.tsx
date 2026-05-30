import Link from "next/link";
import {
  DETAIL_HERO_GRADIENT,
  DETAIL_HERO_TITLE_STYLE,
} from "@/components/sections/_shared/DetailHero";
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
        src="/images/blogs/cta-cube-right.png"
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
        src="/images/blogs/cta-cube-left.png"
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
        <Breadcrumb title={title} />

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

function Breadcrumb({ title }: { title: string }): React.ReactElement {
  const items: { label: string; href?: string }[] = [
    { label: "Careers", href: "/careers" },
    { label: "Jobs", href: "/careers" },
    { label: title },
  ];
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-y-1 gap-0 pt-[clamp(28px,5vw,58px)]"
    >
      <Link
        href="/"
        className="flex items-center justify-center w-11 h-11 rounded-full"
        aria-label="Home"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5Z"
            stroke="rgba(152,172,195,0.8)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M9 21V12h6v9"
            stroke="rgba(152,172,195,0.8)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={`${item.label}-${idx}`} className="flex items-center">
            <Chevron />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="flex items-center h-11 px-2 rounded-full text-xs leading-[1.4]"
                style={{ color: "#98ACC3" }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="flex items-center h-11 px-2 max-w-[200px] sm:max-w-[280px] truncate text-xs leading-[1.4]"
                style={{ color: "#BFCCDA" }}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

function Chevron(): React.ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M9 18l6-6-6-6"
        stroke="rgba(152,172,195,0.6)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
