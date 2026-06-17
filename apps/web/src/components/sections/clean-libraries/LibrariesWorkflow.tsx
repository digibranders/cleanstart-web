import Image from "next/image";
import { Container, Section } from "@/components/layout";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";

interface WorkflowCard {
  orb: string;
  title: string;
  bullets?: string[];
  body?: string;
}

const TOP_CARDS: WorkflowCard[] = [
  {
    orb: "/images/clean-libraries/wf-developers.png",
    title: "Developers & AI Coding Tools",
    bullets: ["Cursor", "Claude Code", "GitHub Copilot"],
  },
  {
    orb: "/images/clean-libraries/wf-clean-library.png",
    title: "Clean Library",
    bullets: ["Dependency visibility", "validation", "policy enforcement"],
  },
  {
    orb: "/images/clean-libraries/wf-validated.png",
    title: "Validated Library Repository",
    body: "Approved packages and trusted dependencies.",
  },
];

const BOTTOM_CARDS: WorkflowCard[] = [
  {
    orb: "/images/clean-libraries/wf-cicd.png",
    title: "CI/CD Gates",
    body: "Automated enforcement before deployment.",
  },
  {
    orb: "/images/clean-libraries/wf-production.png",
    title: "Production Artifacts",
    body: "Only approved dependencies reach production.",
  },
];

const CARD_FRAME = "rounded-[36px] p-[3px]";
const CARD_FRAME_BG =
  "linear-gradient(135deg, rgba(44,193,235,0.4) 0%, rgba(44,193,235,0.1) 60%, rgba(255,255,255,0.6) 100%)";

function Orb({ src, alt, size }: { src: string; alt: string; size: number }): React.ReactElement {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {/* Cyan glow under the orb. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none rounded-full opacity-25"
        style={{ background: "#06b6d4", filter: "blur(28px)" }}
      />
      <Image
        src={src}
        alt={alt}
        width={160}
        height={178}
        sizes={`${size}px`}
        className="relative h-auto w-full select-none"
        draggable={false}
      />
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <h3
      className="font-display text-[#111]"
      style={{
        fontSize: "var(--fs-h3)",
        fontWeight: 700,
        letterSpacing: "-0.03em",
        lineHeight: 1.1,
      }}
    >
      {children}
    </h3>
  );
}

function Body({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <p
      className="font-sans text-[#555]"
      style={{
        fontSize: "var(--fs-body-sm)",
        fontWeight: 400,
        letterSpacing: "-0.01em",
        lineHeight: 1.4,
      }}
    >
      {children}
    </p>
  );
}

function Bullets({ items }: { items: string[] }): React.ReactElement {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-3">
          <span
            aria-hidden
            className="size-1.5 shrink-0 rounded-full"
            style={{ background: "#9a51ff" }}
          />
          <span
            className="font-sans text-[#333]"
            style={{
              fontSize: "var(--fs-body-sm)",
              fontWeight: 400,
              letterSpacing: "-0.01em",
              lineHeight: 1.4,
            }}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

function VerticalCard({ card }: { card: WorkflowCard }): React.ReactElement {
  return (
    <div className={CARD_FRAME} style={{ background: CARD_FRAME_BG }}>
      <div className="flex h-full min-h-[clamp(228px,23vw,260px)] flex-col gap-5 rounded-[33px] bg-white p-6">
        <Orb src={card.orb} alt={card.title} size={84} />
        <div className="mt-auto flex flex-col gap-3">
          <Title>{card.title}</Title>
          {card.bullets ? <Bullets items={card.bullets} /> : <Body>{card.body}</Body>}
        </div>
      </div>
    </div>
  );
}

function HorizontalCard({ card }: { card: WorkflowCard }): React.ReactElement {
  return (
    <div className={CARD_FRAME} style={{ background: CARD_FRAME_BG }}>
      <div className="flex min-h-[clamp(150px,15vw,176px)] items-center justify-between gap-6 rounded-[33px] bg-white px-8 py-7">
        <div className="flex max-w-[62%] flex-col gap-3">
          <Title>{card.title}</Title>
          <Body>{card.body}</Body>
        </div>
        <Orb src={card.orb} alt={card.title} size={116} />
      </div>
    </div>
  );
}

export function LibrariesWorkflow(): React.ReactElement {
  return (
    <Section padding="none" className="overflow-hidden bg-white pt-section-lg pb-section-cta">
      {/* Decorative corner washes. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-12 h-[360px] w-[360px] select-none rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(154,81,255,0.16) 0%, rgba(154,81,255,0) 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 bottom-0 h-[360px] w-[360px] select-none rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(44,193,235,0.14) 0%, rgba(44,193,235,0) 70%)",
        }}
      />
      <Container className="relative">
        <Reveal header>
          <h2
            className="mx-auto max-w-[760px] text-center font-display text-[#111]"
            style={{
              fontSize: "var(--fs-h2)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Built Into Your Existing{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(102deg, #9a51ff 0%, #2cc1eb 100%)",
              }}
            >
              Workflow
            </span>
          </h2>
        </Reveal>

        <RevealStagger className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {TOP_CARDS.map((card) => (
            <RevealItem key={card.title}>
              <VerticalCard card={card} />
            </RevealItem>
          ))}
        </RevealStagger>

        <RevealStagger className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {BOTTOM_CARDS.map((card) => (
            <RevealItem key={card.title}>
              <HorizontalCard card={card} />
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}
