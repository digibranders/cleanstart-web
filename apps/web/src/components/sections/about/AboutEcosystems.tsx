import Image from "next/image";

const PARTNERS = [
  {
    name: "Apache CouchDB",
    src: "/images/about/logo-couchdb.svg",
    width: 176,
    height: 88,
  },
  {
    name: "PostgreSQL",
    src: "/images/about/logo-postgresql.png",
    width: 295,
    height: 56,
  },
  {
    name: "Redis",
    src: "/images/about/logo-redis.svg",
    width: 149,
    height: 47,
  },
  {
    name: "Ubuntu",
    src: "/images/about/logo-ubuntu.svg",
    width: 169,
    height: 65,
  },
  {
    name: "ph",
    src: "/images/about/logo-ph.svg",
    width: 96,
    height: 47,
  },
];

export function AboutEcosystems() {
  return (
    <section className="relative overflow-hidden bg-white pt-[100px] pb-[250px]">
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

      <div className="relative mx-auto max-w-[1276px] px-6">
        {/* Heading */}
        <h2
          className="text-center font-display font-bold text-black"
          style={{
            fontSize: "clamp(2rem, 4vw, 3.875rem)",
            lineHeight: "1.0",
            letterSpacing: "-0.05em",
          }}
        >
          Built for The <br /> Ecosystems{" "}
          <span
            style={{
              background:
                "linear-gradient(-12.5deg, #2CC1EB 0%, #9A51FF 64%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            You Trust
          </span>
        </h2>

      </div>

      {/* Logo strip — full-width, single row, faded edges */}
      <div className="relative mt-[60px] overflow-hidden">
        {/* Left fade */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[180px]"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)",
          }}
        />
        {/* Right fade */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[180px]"
          style={{
            background:
              "linear-gradient(270deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)",
          }}
        />

        <div className="flex items-center justify-center gap-x-[120px] px-[180px]">
          {PARTNERS.map((p) => (
            <div key={p.name} className="flex shrink-0 items-center justify-center">
              <Image
                src={p.src}
                alt={p.name}
                width={p.width}
                height={p.height}
                className="h-auto object-contain opacity-80 transition-opacity hover:opacity-100"
                style={{ maxHeight: "88px", maxWidth: p.width }}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
