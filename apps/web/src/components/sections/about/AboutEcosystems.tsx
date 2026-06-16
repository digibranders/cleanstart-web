import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Ecosystem partners on the About Us page. Full-colour brand SVGs render
 * directly on this section's white background with no recolouring required.
 *
 * Intrinsic dimensions match each SVG's tight content-bbox viewBox so all
 * logos render at the same effective height with no transparent padding.
 */
const PARTNERS = [
  { name: "Debian",         src: "/images/about/ecosystems-color/debian.svg",     width: 48,  height: 60 },
  { name: "Apache CouchDB", src: "/images/about/ecosystems-color/couchdb.svg",    width: 247, height: 60 },
  { name: "PostgreSQL",     src: "/images/about/ecosystems-color/postgresql.svg", width: 61,  height: 60 },
  { name: "Redis",          src: "/images/about/ecosystems-color/redis.svg",      width: 70,  height: 60 },
  { name: "Ubuntu",         src: "/images/about/ecosystems-color/ubuntu.svg",     width: 60,  height: 60 },
  { name: "PHP",            src: "/images/about/ecosystems-color/php.svg",        width: 112, height: 60 },
  { name: "Python",         src: "/images/about/ecosystems-color/python.svg",     width: 197, height: 60 },
  { name: "Notion",         src: "/images/about/ecosystems-color/notion.svg",     width: 58,  height: 60 },
];

interface AboutEcosystemsProps {
  /**
   * Bottom padding variant.
   *  - "cta"     → reserves space for an overlapping Footer CTA card (default,
   *                matches the /about page where `<Footer cta={...} />` is used).
   *  - "compact" → standard section padding for pages whose Footer has no CTA
   *                overlap (e.g. /deal-registration).
   */
  bottomPadding?: "cta" | "compact";
  /**
   * When true, render the top-right corner accent (purple grid + radial glow +
   * soft ellipse) used on /deal-registration. Off by default so the /about page
   * keeps its plain treatment.
   */
  cornerAccent?: boolean;
}

export function AboutEcosystems({
  bottomPadding = "cta",
  cornerAccent = false,
}: AboutEcosystemsProps = {}) {
  const bottomClass = bottomPadding === "compact" ? "pb-section-md" : "pb-section-cta";
  return (
    <section className={`relative overflow-hidden bg-white pt-section-md ${bottomClass}`}>
      {/* Top-right corner accent — grid + radial glow + soft ellipse.
          Proportional horizontal offsets keep it pinned to the corner across
          viewports; the section's overflow-hidden clips the off-canvas bleed. */}
      {cornerAccent && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute hidden lg:block"
            style={{
              right: "calc(20.25 / 1920 * 100%)",
              top: "-316.5px",
              width: "825.75px",
              height: "825.75px",
              background:
                "radial-gradient(50% 50% at 50% 50%, #640DFB 0%, rgba(100, 13, 251, 0) 100%)",
              opacity: 0.06,
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/deal-registration/ecosystems-corner-grid.svg"
            alt=""
            className="pointer-events-none select-none absolute right-0 top-0 hidden lg:block"
            style={{ width: "366px", height: "369px" }}
            loading="lazy"
            decoding="async"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute hidden lg:block"
            style={{
              left: "calc(1265.25 / 1920 * 100%)",
              top: "-68.25px",
              width: "193.5px",
              height: "193.5px",
              borderRadius: "50%",
              background: "#DF9BFF",
              opacity: 0.45,
              filter: "blur(91.125px)",
            }}
          />
        </>
      )}

      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          right: "-80px",
          top: "-60px",
          width: "315px",
          height: "315px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(154,81,255,0.08) 0%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "-80px",
          bottom: "-50px",
          width: "315px",
          height: "315px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(44,193,235,0.06) 0%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <Reveal header>
          <h2
            className="text-center font-display text-black"
            style={{
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            <span className="block">Built for The</span>
            <span className="block">
              Ecosystems{" "}
              <span className="cs-text-gradient-impact">You Trust</span>
            </span>
          </h2>
        </Reveal>

      </div>

      {/* Logo strip — infinite RTL marquee, single line, faded edges. */}
      <div
        className="relative mt-[60px] w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]"
      >
        <div className="cs-marquee items-center gap-x-[clamp(28px,4vw,64px)] py-2">
          {[...PARTNERS, ...PARTNERS].map((p, i) => (
            <div
              key={`${p.name}-${i}`}
              className="flex shrink-0 items-center justify-center"
              style={{ height: "88px" }}
            >
              <Image
                src={p.src}
                alt={p.name}
                width={p.width}
                height={p.height}
                sizes="200px"
                className="h-auto object-contain"
                style={{ maxHeight: "56px", maxWidth: p.width }}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
