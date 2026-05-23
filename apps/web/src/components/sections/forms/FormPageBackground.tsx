import type { ReactNode } from "react";

const HERO_GRADIENT =
  "linear-gradient(180deg, #151021 0%, #10123E 38%, #131E8F 67%, #471EC0 80%, #471FC3 100%)";

interface FormPageBackgroundProps {
  children: ReactNode;
}

/**
 * Shared dark-gradient backdrop for full-page form layouts (Book a Demo,
 * Deal Registration). Renders decorative cubes on either side at xl+.
 */
export function FormPageBackground({ children }: FormPageBackgroundProps): React.ReactElement {
  return (
    <section className="relative w-full overflow-hidden" style={{ background: HERO_GRADIENT }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blogs/hero-orb-top.png"
        alt=""
        className="pointer-events-none select-none absolute top-32 right-0 hidden xl:block"
        style={{ width: "265px", height: "265px", mixBlendMode: "lighten", opacity: 0.45 }}
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
          top: "240px",
          mixBlendMode: "lighten",
          opacity: 0.45,
          transform: "scaleX(-1)",
        }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-[clamp(80px,9vw,120px)] pb-[clamp(60px,8vw,100px)]">
        {children}
      </div>
    </section>
  );
}
