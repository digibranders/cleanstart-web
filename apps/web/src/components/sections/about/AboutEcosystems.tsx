import Image from "next/image";

/**
 * Ecosystem partners on the About Us page. Full-colour brand SVGs from
 * vectorlogo.zone (and Notion from svgl.app) — render directly on this
 * section's white background with no recolouring required.
 */
// Intrinsic dimensions match each SVG's tight content-bbox viewBox so all
// logos render at the same effective height with no transparent padding.
const PARTNERS = [
  { name: "Debian",         src: "/images/about/ecosystems-color/debian.svg",     width: 154, height: 60 },
  { name: "Apache CouchDB", src: "/images/about/ecosystems-color/couchdb.svg",    width: 247, height: 60 },
  { name: "PostgreSQL",     src: "/images/about/ecosystems-color/postgresql.svg", width: 133, height: 60 },
  { name: "Redis",          src: "/images/about/ecosystems-color/redis.svg",      width: 181, height: 60 },
  { name: "Ubuntu",         src: "/images/about/ecosystems-color/ubuntu.svg",     width: 250, height: 60 },
  { name: "PHP",            src: "/images/about/ecosystems-color/php.svg",        width: 114, height: 60 },
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
}

export function AboutEcosystems({ bottomPadding = "cta" }: AboutEcosystemsProps = {}) {
  const bottomClass = bottomPadding === "compact" ? "pb-section-md" : "pb-section-cta";
  return (
    <section className={`relative overflow-hidden bg-white pt-section-md ${bottomClass}`}>
      {/* Decorative blobs */}
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
        {/* Heading */}
        <h2
          className="text-center font-display text-black"
          style={{
            fontSize: "var(--fs-h2)",
            fontWeight: 700,
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

      </div>

      {/* Logo strip — infinite RTL marquee, single line, faded edges */}
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
