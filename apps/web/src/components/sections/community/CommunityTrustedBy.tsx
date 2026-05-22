import Image from "next/image";
import { Container, Section } from "@/components/layout";

// Mirrors the Figma logo row (KPMG · Livlong · Hitachi · Aurascape · O9).
const LOGOS: { file: string; name: string }[] = [
  { file: "05-kpmg.png", name: "KPMG" },
  { file: "09-livlong.png", name: "Livlong" },
  { file: "06-hitachi.png", name: "Hitachi" },
  { file: "08-aurascape.png", name: "Aurascape" },
  { file: "07-o9.webp", name: "O9" },
];

/**
 * "Union" cube — Figma decorative parallelogram. 324×377, gradient +
 * 10% opacity + 4px white border, rotated by matrix(-0.78, 0.62, 0.62,
 * 0.78). Two appear in the Trusted-by section: top-left and
 * bottom-right corners.
 */
function UnionCube({
  leftPct,
  topPx,
}: {
  leftPct: number;
  topPx: number;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute hidden lg:block"
      style={{
        left: `${leftPct}%`,
        top: `${topPx}px`,
        width: "323.83px",
        height: "376.84px",
        background:
          "linear-gradient(334.43deg, rgba(44,193,235,0) -11.15%, #9A51FF 109.49%), #FFFFFF",
        opacity: 0.1,
        border: "4px solid #FFFFFF",
        transform: "matrix(-0.78, 0.62, 0.62, 0.78, 0, 0)",
        transformOrigin: "0 0",
      }}
    />
  );
}

/**
 * Community / Trusted-by section (Figma 732:3467).
 *
 * White section background with two #DF9BFF blurred ellipses softening
 * the corners and two tilted "Union" cube shapes echoing the brand
 * geometry. Headline + logo strip sit on top.
 */
export function CommunityTrustedBy() {
  return (
    <Section
      padding="lg"
      ariaLabel="Trusted by industry leaders"
      className="overflow-hidden bg-white"
    >
      {/* #DF9BFF blurred ellipse — top-left (Figma Ellipse 46685, -91,-66) */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "calc(-91 / 1920 * 100%)",
          top: "-66px",
          width: "258px",
          height: "258px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.5,
          filter: "blur(121.5px)",
        }}
      />
      {/* #DF9BFF blurred ellipse — bottom-right (Figma Ellipse 46684, 1784,349) */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "calc(1784 / 1920 * 100%)",
          top: "349px",
          width: "258px",
          height: "258px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.5,
          filter: "blur(121.5px)",
        }}
      />

      {/* Union cube — top-left (-215, -181) */}
      <UnionCube leftPct={(-215 / 1920) * 100} topPx={-181} />
      {/* Union cube — bottom-right (1660, 234) */}
      <UnionCube leftPct={(1660 / 1920) * 100} topPx={234} />

      <Container className="relative">
        <h2
          className="text-center font-display font-bold text-[#0B0B27]"
          style={{
            fontSize: "var(--text-display-md)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Trusted by industry{" "}
          <span
            style={{
              background:
                "linear-gradient(90deg, #3960F9 0%, #239CFF 60%, #82AEFF 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            leaders
          </span>
        </h2>

        <div className="mt-[clamp(40px,5vw,72px)] flex flex-wrap items-center justify-center gap-x-[clamp(32px,6vw,80px)] gap-y-8">
          {LOGOS.map(({ file, name }) => (
            <div key={file} className="flex h-10 items-center justify-center">
              <Image
                src={`/images/trusted/${file}`}
                alt={name}
                width={160}
                height={40}
                sizes="160px"
                className="h-10 w-auto max-w-[180px] object-contain opacity-90"
              />
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
