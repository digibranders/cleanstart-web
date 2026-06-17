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
    title: "AI-Introduced Dependencies",
    body: "AI coding assistants can introduce libraries that developers never explicitly reviewed or approved.",
  },
  {
    icon: "/images/clean-libraries/risk-vulnerable.svg",
    title: "Vulnerable & Outdated Libraries",
    body: "Public packages often contain known vulnerabilities that increase inherited software risk.",
  },
  {
    icon: "/images/clean-libraries/risk-transitive.svg",
    title: "Transitive Dependency Growth",
    body: "Dependencies often introduce additional packages that teams never explicitly selected or reviewed.",
  },
  {
    icon: "/images/clean-libraries/risk-visibility.svg",
    title: "Limited Dependency Visibility",
    body: "Engineering teams often lack a complete inventory of dependencies across repositories and environments.",
  },
];

function Ball({ icon }: { icon: string }): React.ReactElement {
  return (
    <div
      className="relative flex size-[88px] items-center justify-center overflow-hidden rounded-full"
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
        className="pointer-events-none size-[50px] select-none"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

function Card({ card }: { card: RiskCard }): React.ReactElement {
  return (
    <div
      className="rounded-[40px] p-[2px]"
      style={{
        background:
          "linear-gradient(180deg, rgba(44,193,235,0.45) 0%, rgba(44,193,235,0.15) 100%)",
      }}
    >
      <div className="relative flex min-h-[clamp(360px,38vw,442px)] flex-col overflow-hidden rounded-[36px] bg-white p-7">
        {/* Top pink wash. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-7 h-[153px] w-[262px] -translate-x-1/2 select-none opacity-30"
          style={{ background: "#df9bff", filter: "blur(66.5px)" }}
        />
        <div className="relative">
          <Ball icon={card.icon} />
        </div>
        <div className="relative mt-auto flex flex-col gap-3 pt-12">
          <h3
            className="font-display text-[#111]"
            style={{
              fontSize: "var(--fs-h3)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
            }}
          >
            {card.title}
          </h3>
          <p
            className="font-sans text-[#555]"
            style={{
              fontSize: "var(--fs-body-sm)",
              fontWeight: 400,
              letterSpacing: "-0.01em",
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
    <Section padding="lg" className="overflow-hidden bg-white">
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
