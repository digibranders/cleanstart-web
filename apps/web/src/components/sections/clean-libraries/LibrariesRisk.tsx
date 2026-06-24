import { Container, Section } from "@/components/layout";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";

interface RiskCard {
  icon: string;
  title: string;
  body: string;
}

const CARDS: RiskCard[] = [
  {
    icon: "/images/clean-libraries/risk-ai.svg",
    title: "AI Dependencies",
    body: "Introduced through AI-generated code.",
  },
  {
    icon: "/images/clean-libraries/risk-vulnerable.svg",
    title: "Vulnerable Libraries",
    body: "Inherited from open source packages.",
  },
  {
    icon: "/images/clean-libraries/risk-transitive.svg",
    title: "Transitive Growth",
    body: "Expanded through indirect dependencies.",
  },
  {
    icon: "/images/clean-libraries/risk-visibility.svg",
    title: "Approval Gaps",
    body: "Added without review or approval.",
  },
];

function Ball({ icon }: { icon: string }): React.ReactElement {
  return (
    <div
      className="flex size-[96px] items-center justify-center overflow-hidden rounded-full"
      style={{
        background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
        boxShadow:
          "0px 6.171px 14.537px 0px rgba(28,60,142,0.33), inset 0px -0.233px 0.291px 0px rgba(0,44,179,0.5), inset 0px 0.116px 0.582px 0px rgba(255,255,255,0.81)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src={icon}
        alt=""
        className="pointer-events-none size-[54px] select-none"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

function Card({ card }: { card: RiskCard }): React.ReactElement {
  return (
    <div
      className="relative h-full min-h-[272px] overflow-hidden rounded-[28px] border-[1.5px] bg-white"
      style={{ borderColor: "rgba(44,193,235,0.45)" }}
    >
      {/* Top purple wash. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-7 h-[153px] w-[263px] -translate-x-1/2 select-none opacity-30"
        style={{ background: "#df9bff", filter: "blur(66.5px)" }}
      />
      {/* Horizontal grid lines. */}
      {[68, 170].map((y) => (
        <div
          key={y}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-px select-none opacity-30"
          style={{
            top: `${y}px`,
            background:
              "linear-gradient(90deg, transparent 0%, #fff 50.77%, transparent 100%)",
          }}
        />
      ))}
      {/* Vertical accent lines — proportional so they scale with card width. */}
      {[16.9, 41.8, 56.6, 81.5].map((x) => (
        <div
          key={x}
          aria-hidden
          className="pointer-events-none absolute top-0 h-[200px] w-px select-none opacity-80"
          style={{
            left: `${x}%`,
            background:
              "linear-gradient(180deg, transparent 0%, #fff 50.77%, transparent 100%)",
          }}
        />
      ))}

      <div className="relative z-10 flex h-full flex-col p-6">
        <Ball icon={card.icon} />
        <div className="mt-6 flex flex-col gap-2">
          <h3
            className="font-display text-[#111]"
            style={{
              fontSize: "var(--fs-h3)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
            }}
          >
            {card.title}
          </h3>
          <p
            className="font-sans text-[#555]"
            style={{
              fontSize: "var(--fs-body)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
            }}
          >
            {card.body}
          </p>
        </div>
      </div>
    </div>
  );
}

export function LibrariesRisk(): React.ReactElement {
  return (
    <Section
      padding="lg"
      className="overflow-hidden bg-white"
      style={{ paddingTop: "var(--spacing-section-sm)" }}
    >
      {/* Decorative corner washes. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-0 h-[315px] w-[315px] select-none rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(154,81,255,0.18) 0%, rgba(154,81,255,0) 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 h-[315px] w-[315px] select-none rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(44,193,235,0.16) 0%, rgba(44,193,235,0) 70%)",
        }}
      />
      <Container>
        <Reveal>
          <h2
            className="mx-auto max-w-[760px] text-center font-display text-[#111]"
            style={{
              fontSize: "var(--fs-h2)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Modern Dependency Risk Is{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(102deg, #9a51ff 0%, #2cc1eb 100%)",
              }}
            >
              Expanding
            </span>
          </h2>
        </Reveal>

        <RevealStagger className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {CARDS.map((card) => (
            <RevealItem key={card.title}>
              <Card card={card} />
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}
