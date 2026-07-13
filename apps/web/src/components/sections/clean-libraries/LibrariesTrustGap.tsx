import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { GlassIcon } from "./GlassIcon";

/**
 * "Trust Is Built. Not Assumed." — the four facets of library trust (Identity,
 * Provenance, Authenticity, Policy) as a borderless row: a glass "gem" icon over
 * a title and a "Know…" line whose leading word is tinted to the column accent.
 * A glowing horizontal "continuous verification" thread runs through the icons
 * (an animated pulse travels it), with faint hairline dividers instead of card
 * boxes. Everything is CSS/SVG to match the page's other coded scenes; the
 * thread pulse is disabled under prefers-reduced-motion.
 */

type IconKey = "fingerprint" | "branch" | "shield" | "policy";

interface TrustCard {
  key: string;
  title: string;
  /** Full description; the leading "Know" is tinted at render time. */
  desc: string;
  icon: IconKey;
  accent: string;
}

const CARDS: TrustCard[] = [
  {
    key: "identity",
    title: "Identity",
    desc: "Know exactly what you’re using.",
    icon: "fingerprint",
    accent: "#a974ff",
  },
  {
    key: "provenance",
    title: "Provenance",
    desc: "Know where every library came from.",
    icon: "branch",
    accent: "#5b9bff",
  },
  {
    key: "authenticity",
    title: "Authenticity",
    desc: "Know it hasn’t been altered.",
    icon: "shield",
    accent: "#2dd4bf",
  },
  {
    key: "policy",
    title: "Policy",
    desc: "Know it meets your standards.",
    icon: "policy",
    accent: "#f7a35c",
  },
];

/** Flowing-pulse keyframes for the verification thread (reduced-motion safe). */
const THREAD_CSS = `
@keyframes tg-flow{from{background-position:-40% 0}to{background-position:140% 0}}
.tg-thread-pulse{background:linear-gradient(90deg,transparent,rgba(255,255,255,0.85) 12%,transparent 24%);background-size:38% 100%;animation:tg-flow 3.6s linear infinite}
@media (prefers-reduced-motion:reduce){.tg-thread-pulse{animation:none;opacity:0}}
`;

/** Attribute glyphs — thin line icons; stroke inherits white via currentColor. */
function AttrIcon({ icon, size }: { icon: IconKey; size: number }): React.ReactElement {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (icon) {
    case "fingerprint":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="1.3" />
          <path d="M8.6 12a3.4 3.4 0 0 1 6.8 0" />
          <path d="M6 12a6 6 0 0 1 12 0" />
          <path d="M3.6 12a8.4 8.4 0 0 1 16.8 0" />
        </svg>
      );
    case "branch":
      return (
        <svg {...common}>
          <line x1="6" y1="4" x2="6" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "policy":
      return (
        <svg {...common}>
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v5h5" />
          <line x1="8.5" y1="13" x2="15" y2="13" />
          <line x1="8.5" y1="17" x2="13" y2="17" />
        </svg>
      );
  }
}

/** One borderless trust column: glowing gem icon → title → tinted "Know…" line. */
function TrustColumn({
  card,
  showDivider,
}: {
  card: TrustCard;
  showDivider: boolean;
}): React.ReactElement {
  const knowColor = `color-mix(in srgb, ${card.accent} 50%, #ffffff)`;
  const glow = `color-mix(in srgb, ${card.accent} 42%, transparent)`;
  return (
    <div className="relative flex flex-col items-center px-6 text-center">
      {showDivider ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-1.5 bottom-1.5 hidden w-px select-none lg:block"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(255,255,255,0.14) 22%, rgba(255,255,255,0.14) 78%, transparent)",
          }}
        />
      ) : null}
      <div className="relative mb-6 flex items-center justify-center">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-[-32%] select-none rounded-full"
          style={{ background: `radial-gradient(closest-side, ${glow}, transparent 72%)`, filter: "blur(10px)" }}
        />
        <div className="relative z-10">
          <GlassIcon accent={card.accent} size={80}>
            <AttrIcon icon={card.icon} size={32} />
          </GlassIcon>
        </div>
      </div>
      <h3
        className="font-display text-white"
        style={{ fontSize: "var(--fs-h5)", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2 }}
      >
        {card.title}
      </h3>
      <p
        className="mt-2.5 max-w-[210px] font-sans text-white/62"
        style={{ fontSize: "var(--fs-body-sm)", fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.5, textWrap: "balance" }}
      >
        <span style={{ color: knowColor, fontWeight: 600 }}>Know</span>
        {card.desc.slice(4)}
      </p>
    </div>
  );
}

export function LibrariesTrustGap(): React.ReactElement {
  return (
    <Section
      padding="md"
      className="overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #151021 0%, #131E8F 68%, #471EC0 100%)",
      }}
    >
      {/* Ambient purple glow behind the row. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 select-none rounded-full"
        style={{
          background: "radial-gradient(closest-side, rgba(110,64,255,0.18) 0%, rgba(110,64,255,0) 70%)",
        }}
      />
      <Container className="relative">
        <Reveal header>
          <div className="mx-auto max-w-[720px] text-center">
            <h2
              className="font-display text-white"
              style={{ fontSize: "var(--fs-h2)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1 }}
            >
              Trust Is Built. Not Assumed.
            </h2>
            <p
              className="mx-auto mt-6 max-w-[640px] font-sans text-white/80"
              style={{ fontSize: "var(--fs-lead)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.5, textWrap: "balance" }}
            >
              Trust isn’t assumed. It’s established through continuous
              verification.
            </p>
          </div>
        </Reveal>

        <div className="relative mx-auto mt-16 max-w-[1160px] lg:mt-20">
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static keyframes string, no user input */}
          <style dangerouslySetInnerHTML={{ __html: THREAD_CSS }} />
          {/* Continuous-verification thread — runs through the icon centres,
              behind the gems (desktop only). Top offset = gem half-height (40). */}
          <div
            aria-hidden
            className="pointer-events-none absolute z-0 hidden select-none overflow-hidden rounded-full lg:block"
            style={{
              top: 40,
              left: "12.5%",
              right: "12.5%",
              height: 2,
              background:
                "linear-gradient(90deg, rgba(169,116,255,0), rgba(169,116,255,0.5), rgba(91,155,255,0.5), rgba(45,212,191,0.5), rgba(247,163,92,0.5), rgba(247,163,92,0))",
            }}
          >
            <div className="tg-thread-pulse absolute inset-0" />
          </div>

          <RevealStagger className="grid grid-cols-1 gap-y-14 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 lg:gap-y-0">
            {CARDS.map((card, i) => (
              <RevealItem key={card.key} className="relative z-10">
                <TrustColumn card={card} showDivider={i > 0} />
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </Container>
    </Section>
  );
}
