import type { CSSProperties } from "react";

const HERO_GRADIENT =
  "linear-gradient(180deg, #151021 0%, #10123E 38%, #131E8F 67%, #471EC0 80%, #471FC3 100%)";

const TITLE_STYLE: CSSProperties = {
  fontSize: "var(--text-hero-utility)",
  lineHeight: 1.15,
  letterSpacing: "var(--text-hero-utility-ls)",
};

interface LegalHeroProps {
  title: string;
}

export function LegalHero({ title }: LegalHeroProps): React.ReactElement {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: HERO_GRADIENT }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blogs/hero-orb-top.png"
        alt=""
        className="pointer-events-none select-none absolute top-20 right-0 hidden xl:block"
        style={{ width: "265px", height: "265px", mixBlendMode: "lighten", opacity: 0.4 }}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blogs/hero-orb-top.png"
        alt=""
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          width: "265px",
          height: "265px",
          left: "-60px",
          bottom: "-40px",
          mixBlendMode: "lighten",
          opacity: 0.4,
          transform: "scaleX(-1)",
        }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-[clamp(80px,10vw,140px)] pb-[clamp(60px,8vw,100px)]">
        <h1
          className="font-display font-semibold text-white text-center mx-auto"
          style={{ ...TITLE_STYLE, maxWidth: "860px" }}
        >
          {title}
        </h1>
      </div>
    </section>
  );
}
