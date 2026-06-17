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
    orb: "/images/clean-libraries/icon-developers.png",
    title: "Developers & AI Coding Tools",
    bullets: ["Cursor", "Claude Code", "GitHub Copilot"],
  },
  {
    orb: "/images/clean-libraries/icon-clean-library.png",
    title: "Clean Library",
    bullets: ["Dependency visibility", "validation", "policy enforcement"],
  },
  {
    orb: "/images/clean-libraries/icon-validated.png",
    title: "Validated Library Repository",
    body: "Approved packages and trusted dependencies.",
  },
];

const BOTTOM_CARDS: WorkflowCard[] = [
  {
    orb: "/images/clean-libraries/icon-cicd.png",
    title: "CI/CD Gates",
    body: "Automated enforcement before deployment.",
  },
  {
    orb: "/images/clean-libraries/icon-production.png",
    title: "Production Artifacts",
    body: "Only approved dependencies reach production.",
  },
];

/** White card chrome — full border, top purple wash, and a faint grid that fills the card. */
function Shell({
  children,
  minHeight,
}: {
  children: React.ReactNode;
  minHeight: string;
}): React.ReactElement {
  return (
    <div
      className="relative h-full overflow-hidden rounded-[28px] border-[1.5px] bg-white"
      style={{ borderColor: "rgba(44,193,235,0.45)", minHeight }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-7 h-[153px] w-[263px] -translate-x-1/2 select-none opacity-30"
        style={{ background: "#df9bff", filter: "blur(66.5px)" }}
      />
      {[68, 184].map((y) => (
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
      {[16.9, 41.8, 56.6, 81.5].map((x) => (
        <div
          key={x}
          aria-hidden
          className="pointer-events-none absolute top-0 h-[264px] w-px select-none opacity-80"
          style={{
            left: `${x}%`,
            background:
              "linear-gradient(180deg, transparent 0%, #fff 50.77%, transparent 100%)",
          }}
        />
      ))}
      <div className="relative z-10 flex h-full flex-col">{children}</div>
    </div>
  );
}

function Orb({ src, alt, size }: { src: string; alt: string; size: number }): React.ReactElement {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none rounded-full opacity-25"
        style={{ background: "#9a51ff", filter: "blur(24px)" }}
      />
      <Image
        src={src}
        alt={alt}
        width={200}
        height={200}
        sizes={`${size}px`}
        className="relative h-full w-full select-none object-contain"
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
        letterSpacing: "-0.04em",
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
        fontSize: "var(--fs-body)",
        fontWeight: 400,
        letterSpacing: "-0.02em",
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
    <Shell minHeight="300px">
      <div className="flex h-full flex-col gap-6 p-6">
        <Orb src={card.orb} alt={card.title} size={84} />
        <div className="flex flex-col gap-3">
          <Title>{card.title}</Title>
          {card.bullets ? <Bullets items={card.bullets} /> : <Body>{card.body}</Body>}
        </div>
      </div>
    </Shell>
  );
}

function HorizontalCard({ card }: { card: WorkflowCard }): React.ReactElement {
  return (
    <Shell minHeight="180px">
      <div className="flex h-full w-full items-center justify-between gap-6 px-8 py-7">
        <div className="flex max-w-[62%] flex-col gap-3">
          <Title>{card.title}</Title>
          <Body>{card.body}</Body>
        </div>
        <Orb src={card.orb} alt={card.title} size={104} />
      </div>
    </Shell>
  );
}

export function LibrariesWorkflow(): React.ReactElement {
  return (
    <Section
      padding="none"
      className="overflow-hidden bg-white pt-section-lg pb-section-cta"
    >
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

        <RevealStagger className="mx-auto mt-12 grid max-w-[1180px] grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {TOP_CARDS.map((card) => (
            <RevealItem key={card.title}>
              <VerticalCard card={card} />
            </RevealItem>
          ))}
        </RevealStagger>

        <RevealStagger className="mx-auto mt-6 grid max-w-[1180px] grid-cols-1 gap-6 lg:grid-cols-2">
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
