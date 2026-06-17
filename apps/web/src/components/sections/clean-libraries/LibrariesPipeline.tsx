import { Container, Section } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";

/** Top-of-orb-or-side corner card describing one dependency entry path. */
interface EntryCard {
  title: string;
  body: string;
  border: string;
  tint: string;
}

const ENTRY_CARDS: EntryCard[] = [
  {
    title: "Developer Added",
    body: "Libraries developers explicitly add to their projects.",
    border: "#c071f8",
    tint: "rgba(192,113,248,0.1)",
  },
  {
    title: "Open Source packages",
    body: "Direct dependencies from public registries.",
    border: "#14f2e4",
    tint: "rgba(20,240,230,0.1)",
  },
  {
    title: "AI-Introduced Dependencies",
    body: "Libraries introduced by AI coding assistants.",
    border: "#57d5fb",
    tint: "rgba(87,213,251,0.1)",
  },
  {
    title: "Transitive Dependencies",
    body: "Hidden dependencies pulled in automatically.",
    border: "#fc856f",
    tint: "rgba(253,148,110,0.1)",
  },
];

interface Outcome {
  icon: string;
  label: string;
}

const OUTCOMES: Outcome[] = [
  { icon: "/images/clean-libraries/out-visibility.svg", label: "Complete Dependency Visibility" },
  { icon: "/images/clean-libraries/out-risk.svg", label: "Reduced Dependency Risk" },
  { icon: "/images/clean-libraries/out-accountability.svg", label: "AI Dependency Accountability" },
  { icon: "/images/clean-libraries/out-policy1.svg", label: "Continuous Policy Enforcement" },
  { icon: "/images/clean-libraries/out-policy2.svg", label: "Continuous Policy Enforcement" },
];

const BALL_BG = "linear-gradient(180deg, #239cff 0%, #005be3 100%)";
const BALL_SHADOW =
  "0px 4.6px 10.9px 0px rgba(28,60,142,0.33), inset 0px -0.175px 0.218px 0px rgba(0,44,179,0.5), inset 0px 0.087px 0.436px 0px rgba(255,255,255,0.81)";
const DIVIDER =
  "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0) 100%)";

/** Corner card content — fonts come from the role-token system, not Figma px. */
function CardBody({ card }: { card: EntryCard }): React.ReactElement {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-[24px] border px-6 text-center text-white"
      style={{
        borderColor: card.border,
        background: `linear-gradient(125.6deg, ${card.tint} 4.65%, rgba(153,153,153,0.1) 77.64%)`,
      }}
    >
      <p
        className="font-display font-bold"
        style={{ fontSize: "var(--fs-h3)", letterSpacing: "-0.03em", lineHeight: 1.05 }}
      >
        {card.title}
      </p>
      <p
        className="font-sans opacity-80"
        style={{ fontSize: "var(--fs-body-sm)", letterSpacing: "-0.01em", lineHeight: 1.2 }}
      >
        {card.body}
      </p>
    </div>
  );
}

const CONNECTORS = [
  { src: "/images/clean-libraries/conn-tl.svg", left: 297, top: 61, flip: true },
  { src: "/images/clean-libraries/conn-tr.svg", left: 873, top: 56, flip: false },
  { src: "/images/clean-libraries/conn-bl.svg", left: 295, top: 404, flip: false },
  { src: "/images/clean-libraries/conn-br.svg", left: 874, top: 407, flip: true },
];

/** Card corner positions in the 1276×544 design space, paired by index with ENTRY_CARDS. */
const CARD_POSITIONS = [
  { left: 0, top: 2 }, // Developer Added (TL)
  { left: 981, top: 2 }, // Open Source (TR)
  { left: 0, top: 338 }, // AI-Introduced (BL)
  { left: 981, top: 330 }, // Transitive (BR)
] as const;

/** Desktop diagram — a 1276×544 design canvas scaled uniformly to fit. */
function DesktopDiagram(): React.ReactElement {
  const positionedCards = ENTRY_CARDS.map((card, i) => ({
    card,
    pos: CARD_POSITIONS[i] ?? { left: 0, top: 0 },
  }));

  return (
    <div
      className="mx-auto hidden lg:block"
      style={
        {
          "--lib-scale": "min(1, calc((min(100vw, 1440px) - 80px) / 1276px))",
          width: "calc(1276px * var(--lib-scale))",
          height: "calc(544px * var(--lib-scale))",
        } as React.CSSProperties
      }
    >
      <div
        className="relative"
        style={{
          width: "1276px",
          height: "544px",
          transform: "scale(var(--lib-scale))",
          transformOrigin: "top left",
        }}
      >
        {/* Central orb. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/clean-libraries/pipeline-orb.png"
          alt=""
          className="pointer-events-none absolute left-1/2 top-1/2 w-[589px] max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
          loading="lazy"
          decoding="async"
        />

        {/* Connectors. */}
        {CONNECTORS.map((c) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={c.src}
            aria-hidden
            src={c.src}
            alt=""
            className="pointer-events-none absolute select-none"
            style={{
              left: `${c.left}px`,
              top: `${c.top}px`,
              width: "107px",
              height: "77px",
              transform: c.flip ? "scaleX(-1)" : undefined,
            }}
            loading="lazy"
            decoding="async"
          />
        ))}

        {/* Corner cards. */}
        {positionedCards.map(({ card, pos }) => (
          <div
            key={card.title}
            className="absolute"
            style={{
              left: `${pos.left}px`,
              top: `${pos.top}px`,
              width: "295px",
              height: "176px",
            }}
          >
            <CardBody card={card} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Stacked mobile/tablet layout — orb above a 2-col card grid. */
function MobileDiagram(): React.ReactElement {
  return (
    <div className="lg:hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/clean-libraries/pipeline-orb.png"
        alt=""
        className="pointer-events-none mx-auto block w-full max-w-[420px] select-none"
        loading="lazy"
        decoding="async"
      />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ENTRY_CARDS.map((card) => (
          <div key={card.title} className="min-h-[160px]">
            <CardBody card={card} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LibrariesPipeline(): React.ReactElement {
  return (
    <Section
      padding="lg"
      className="overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #0a0826 0%, #0d0a30 50%, #0a0826 100%)",
      }}
    >
      {/* Central purple glow. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[38%] h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 select-none rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(110,64,255,0.22) 0%, rgba(110,64,255,0) 70%)",
        }}
      />
      <Container className="relative">
        <Reveal header>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-center lg:gap-12">
            <h2
              className="text-center font-display text-white lg:text-left"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              The Invisible Dependency{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(102deg, #9a51ff 0%, #2cc1eb 100%)",
                }}
              >
                Pipeline
              </span>
            </h2>
            <p
              className="text-center font-sans text-white/80 lg:text-left"
              style={{
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.4,
              }}
            >
              Dependencies can enter your software supply chain through
              developers, AI coding assistants, open-source packages, and
              transitive dependencies long before they are reviewed.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 lg:mt-16">
          <DesktopDiagram />
          <MobileDiagram />
        </div>

        {/* "No review" banner. */}
        <Reveal>
          <div
            className="mt-12 flex flex-col items-center gap-6 rounded-[24px] border px-6 py-7 text-center md:flex-row md:gap-8 md:px-10 md:text-left lg:mt-16"
            style={{
              borderColor: "rgba(154,81,255,0.4)",
              background:
                "linear-gradient(125.6deg, rgba(154,81,255,0.12) 0%, rgba(44,193,235,0.08) 100%)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              aria-hidden
              src="/images/clean-libraries/banner-hex.svg"
              alt=""
              className="pointer-events-none size-[84px] shrink-0 select-none"
              loading="lazy"
              decoding="async"
            />
            <p
              className="font-display font-bold text-white"
              style={{
                fontSize: "var(--fs-h3)",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              No review. No approval. No visibility.
            </p>
            <div
              aria-hidden
              className="hidden h-[100px] w-px shrink-0 md:block"
              style={{ background: DIVIDER }}
            />
            <p
              className="max-w-[420px] font-sans text-white/80"
              style={{
                fontSize: "var(--fs-body-sm)",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              Dependencies can become a permanent part of your software before
              anyone knows they exist.
            </p>
          </div>
        </Reveal>

        {/* Outcome row. */}
        <div
          aria-hidden
          className="mt-12 h-px w-full lg:mt-16"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
        <div className="mt-12 grid grid-cols-2 items-start gap-x-4 gap-y-10 sm:grid-cols-3 lg:flex lg:justify-between lg:gap-0">
          {OUTCOMES.map((o, i) => (
            <div key={`${o.label}-${i}`} className="contents lg:flex lg:items-start">
              <div className="flex flex-col items-center gap-5 px-2 text-center lg:w-[204px]">
                <div
                  className="flex size-[62px] items-center justify-center rounded-full"
                  style={{ background: BALL_BG, boxShadow: BALL_SHADOW }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    aria-hidden
                    src={o.icon}
                    alt=""
                    className="pointer-events-none size-10 select-none"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <p
                  className="font-display font-bold text-white"
                  style={{
                    fontSize: "var(--fs-h4)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                  }}
                >
                  {o.label}
                </p>
              </div>
              {i < OUTCOMES.length - 1 && (
                <div
                  aria-hidden
                  className="hidden h-[152px] w-px shrink-0 self-center lg:block"
                  style={{ background: DIVIDER }}
                />
              )}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
