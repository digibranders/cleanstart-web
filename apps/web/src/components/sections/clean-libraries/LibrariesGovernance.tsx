import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";

type IconKey = "repository" | "search" | "sparkles" | "shield";
type Pos = "tl" | "tr" | "bl" | "br";

interface GovCard {
  key: string;
  icon: IconKey;
  title: string;
  body: string;
  accent: string;
  /** Card background tint (gradient start). */
  tint: string;
  pos: Pos;
}

const CARDS: GovCard[] = [
  {
    key: "repository",
    icon: "repository",
    title: "Trusted Repository",
    body: "Approved libraries from trusted sources.",
    accent: "#7c3aed",
    tint: "#f5f2fe",
    pos: "tl",
  },
  {
    key: "validation",
    icon: "search",
    title: "Dependency Validation",
    body: "Validate every library before adoption.",
    accent: "#0d9488",
    tint: "#edfbf7",
    pos: "tr",
  },
  {
    key: "ai",
    icon: "sparkles",
    title: "AI Controls",
    body: "Validate AI-suggested libraries before use.",
    accent: "#6366f1",
    tint: "#f1f2fe",
    pos: "bl",
  },
  {
    key: "policy",
    icon: "shield",
    title: "Policy Enforcement",
    body: "Enforce dependency policies across the software lifecycle.",
    accent: "#ea580c",
    tint: "#fff4ec",
    pos: "br",
  },
];

function GovIcon({ icon, size = 26 }: { icon: IconKey; size?: number }): React.ReactElement {
  const c = {
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
    case "repository":
      return (
        <svg {...c}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m8.6 12 2.3 2.3 4.7-4.7" />
        </svg>
      );
    case "search":
      return (
        <svg {...c}>
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...c}>
          <path d="M12 3 13.8 10.2 21 12 13.8 13.8 12 21 10.2 13.8 3 12 10.2 10.2Z" />
          <path d="M18.5 4 19 6 21 6.5 19 7 18.5 9 18 7 16 6.5 18 6Z" />
        </svg>
      );
    case "shield":
      return (
        <svg {...c}>
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
  }
}

function IconCircle({
  accent,
  icon,
  size = 60,
  glyph = 28,
}: {
  accent: string;
  icon: IconKey;
  size?: number;
  glyph?: number;
}): React.ReactElement {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        color: accent,
        background: `color-mix(in srgb, ${accent} 7%, #ffffff)`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 14%, transparent), 0 6px 16px -8px color-mix(in srgb, ${accent} 60%, transparent)`,
      }}
    >
      <GovIcon icon={icon} size={glyph} />
    </div>
  );
}

/** Alignment of a card's content toward its outer corner (desktop only). */
const POS_ALIGN: Record<Pos, string> = {
  tl: "items-start",
  tr: "items-start lg:pl-[22%]",
  bl: "items-end",
  br: "items-end lg:pl-[22%]",
};

function GovCardView({ card, mobile = false }: { card: GovCard; mobile?: boolean }): React.ReactElement {
  return (
    <div
      className={
        mobile
          ? "flex rounded-[22px] border p-6"
          : `flex min-h-[248px] rounded-[24px] border p-8 ${POS_ALIGN[card.pos]}`
      }
      style={{
        background: `linear-gradient(145deg, ${card.tint} 0%, #ffffff 60%)`,
        borderColor: `color-mix(in srgb, ${card.accent} 22%, transparent)`,
        boxShadow: `0 22px 44px -30px color-mix(in srgb, ${card.accent} 80%, transparent)`,
      }}
    >
      <div className="flex gap-4">
        <IconCircle accent={card.accent} icon={card.icon} />
        <div className="flex max-w-[215px] flex-col gap-2.5 pt-0.5">
          <h3
            className="font-display text-[#1a1633]"
            style={{ fontSize: "var(--fs-h3)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1 }}
          >
            {card.title}
          </h3>
          <span
            aria-hidden
            className="block h-[3px] w-11 rounded-full"
            style={{ background: card.accent }}
          />
          <p
            className="font-sans text-[#6b7280]"
            style={{ fontSize: "var(--fs-body-sm)", fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.45 }}
          >
            {card.body}
          </p>
        </div>
      </div>
    </div>
  );
}

function Hub({ size = 210 }: { size?: number }): React.ReactElement {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-full bg-white text-center"
      style={{
        width: size,
        height: size,
        boxShadow:
          "0 26px 54px -22px rgba(84,44,160,0.36), 0 0 0 1px rgba(124,58,237,0.08), inset 0 0 0 7px rgba(248,246,255,0.85)",
      }}
    >
      <IconCircle accent="#7c3aed" icon="shield" size={58} glyph={28} />
      <span
        className="font-display text-[#1a1633]"
        style={{ fontSize: "var(--fs-body)", fontWeight: 600, lineHeight: 1.22, maxWidth: "132px" }}
      >
        Software Dependency Governance
      </span>
    </div>
  );
}

function DiagramDesktop(): React.ReactElement {
  return (
    <div className="relative mx-auto hidden w-full max-w-[920px] lg:block">
      <RevealStagger className="grid grid-cols-2 gap-5">
        {CARDS.map((card) => (
          <RevealItem key={card.key}>
            <GovCardView card={card} />
          </RevealItem>
        ))}
      </RevealStagger>
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <Reveal header>
          <Hub />
        </Reveal>
      </div>
    </div>
  );
}

function DiagramMobile(): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-6 lg:hidden">
      <Reveal header>
        <Hub size={168} />
      </Reveal>
      <RevealStagger className="grid w-full max-w-[440px] grid-cols-1 gap-4">
        {CARDS.map((card) => (
          <RevealItem key={card.key}>
            <GovCardView card={card} mobile />
          </RevealItem>
        ))}
      </RevealStagger>
    </div>
  );
}

export function LibrariesGovernance(): React.ReactElement {
  return (
    <Section
      padding="lg"
      className="overflow-hidden"
      style={{ background: "linear-gradient(180deg, #ffffff 0%, #faf9ff 100%)" }}
    >
      <Container className="relative">
        <Reveal header>
          <div className="text-center">
            <h2
              className="mx-auto max-w-[1180px] font-display text-[#1a1633]"
              style={{ fontSize: "var(--fs-h2)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.12 }}
            >
              Govern every dependency. Build with confidence.
            </h2>
            <p
              className="mx-auto mt-5 max-w-[840px] font-sans text-[#6b7280]"
              style={{ fontSize: "var(--fs-lead)", fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.5, textWrap: "balance" }}
            >
              Clean Libraries enforces policy, validates every dependency, and
              governs AI-suggested libraries across the software lifecycle.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 lg:mt-16">
          <DiagramDesktop />
          <DiagramMobile />
        </div>
      </Container>
    </Section>
  );
}
