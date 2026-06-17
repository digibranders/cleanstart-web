/**
 * "Trust Begins at the Source" — 2×2 pinwheel card grid.
 *
 * Four trust-stage cards arranged in a 2×2 grid; each card's single large
 * (62px) corner points toward the grid centre, forming a pinwheel. Collapses
 * to a single column below `sm`. Ported 1:1 from Figma node 1199:2996.
 */

interface TrustCard {
  title: string;
  body: string;
  icon: string;
  /** Tailwind radius classes — one large corner points toward the grid centre. */
  radius: string;
}

const CARDS: TrustCard[] = [
  {
    title: "Analyze Before Artifacts Exist",
    body: "Source-level intelligence before packaging begins.",
    icon: "/images/cleanstart-platform/trust-ball-icon-2.svg",
    radius: "rounded-[8px] sm:rounded-br-[62px]",
  },
  {
    title: "Rebuild From Verified Source",
    body: "Deterministic reconstruction inside hermetic environments.",
    icon: "/images/cleanstart-platform/trust-ball-icon-1.svg",
    radius: "rounded-[8px] sm:rounded-bl-[62px]",
  },
  {
    title: "Assemble Minimal Runtimes",
    body: "Only the required components. Nothing is unnecessary.",
    icon: "/images/cleanstart-platform/trust-ball-icon-4.svg",
    radius: "rounded-[8px] sm:rounded-tr-[62px]",
  },
  {
    title: "Deliver Trusted Foundations",
    body: "Continuously rebuilt and verifiable runtime environments.",
    icon: "/images/cleanstart-platform/trust-ball-icon-3.svg",
    radius: "rounded-[8px] sm:rounded-tl-[62px]",
  },
];

export function PlatformTrustSource() {
  return (
    <section
      aria-label="Trust Begins at the Source"
      className="relative w-full overflow-hidden bg-[#f6f6f6]"
    >
      {/* Corner decorations — pinned to the 1440 frame corners, behind content */}
      <div className="pointer-events-none absolute inset-0 mx-auto max-w-[1440px]">
        {/* Cyan glow blobs (Ellipse 46691 / 46692) — pure CSS, blurred circles */}
        <div
          aria-hidden
          className="absolute -left-[73px] -top-[141px] size-[315px] rounded-full"
          style={{ background: "#2CC1EB", opacity: 0.2, filter: "blur(101.5px)" }}
        />
        <div
          aria-hidden
          className="absolute -right-[124px] bottom-[40px] size-[315px] rounded-full"
          style={{ background: "#2CC1EB", opacity: 0.2, filter: "blur(101.5px)" }}
        />
        {/* Cube clusters — full-frame SVG pinned to each corner; the opposite
            cluster is pushed off-frame and clipped by the section overflow. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-platform/trust-cubes.svg"
          alt=""
          aria-hidden
          className="absolute left-0 top-0 hidden h-[1103px] w-[1440px] max-w-none select-none lg:block"
          loading="lazy"
          decoding="async"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-platform/trust-cubes.svg"
          alt=""
          aria-hidden
          className="absolute bottom-0 right-0 hidden h-[1103px] w-[1440px] max-w-none select-none lg:block"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Header */}
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          className="mx-auto flex flex-col items-center gap-8 text-center"
          style={{ maxWidth: "1122px", paddingTop: "clamp(64px, 5.5vw, 80px)" }}
        >
          <h2
            className="w-full font-semibold text-[#111]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-display)",
              letterSpacing: "-0.05em",
              lineHeight: 1.1,
            }}
          >
            Trust Begins at the{" "}
            <span
              className="bg-clip-text"
              style={{
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundImage: "linear-gradient(123deg, #9a51ff 52.1%, #2cc1eb 98.8%)",
              }}
            >
              Source
            </span>
          </h2>
          <div
            className="flex flex-col gap-2 text-center text-[#333]/80"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-lead)",
              letterSpacing: "-0.06em",
              lineHeight: 1.4,
            }}
          >
            <p>Security must begin before software becomes a package, container, or runtime artifact.</p>
            <p>
              CleanStart analyzes software intent, reconstructs verified components, and assembles minimal runtime
              foundations before inherited risk can propagate downstream.
            </p>
          </div>
        </div>
      </div>

      {/* 2×2 pinwheel card grid */}
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div className="mx-auto mt-[clamp(40px,4vw,64px)] grid max-w-[730px] grid-cols-1 gap-[22px] sm:grid-cols-2">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className={`flex flex-col gap-3 border border-[#0096d7]/15 bg-white/70 p-6 shadow-[0_2px_24px_rgba(28,60,142,0.06)] backdrop-blur-sm ${card.radius}`}
            >
              <div
                className="flex size-[72px] shrink-0 items-center justify-center rounded-full shadow-[0_6px_15px_rgba(28,60,142,0.33),inset_0_1px_1px_rgba(255,255,255,0.6),inset_0_-1px_1px_rgba(0,44,179,0.4)]"
                style={{ background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.icon}
                  alt=""
                  aria-hidden
                  className="size-10 select-none object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h3
                className="font-semibold text-[#111]"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-h3)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                }}
              >
                {card.title}
              </h3>
              <p
                className="text-[#333]"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-body)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.4,
                }}
              >
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: "clamp(48px, 5vw, 80px)" }} />
    </section>
  );
}
