import { Container, Section } from "@/components/layout";

interface BenefitCard {
  icon: React.ReactElement;
  title: string;
  body: string;
}

const CARDS: BenefitCard[] = [
  {
    icon: <ShieldIcon />,
    title: "Differentiate Through Trust",
    body: "Deliver verified, zero-vulnerability components that strengthen your product.",
  },
  {
    icon: <CheckBadgeIcon />,
    title: "Accelerate Compliance Wins",
    body: "Help customers achieve FIPS, FedRAMP, and CIS goals faster through built-in automation.",
  },
  {
    icon: <TrendingUpIcon />,
    title: "Drive Revenue with Confidence",
    body: "Win new business in regulated markets with a foundation customers can prove.",
  },
  {
    icon: <SparkleIcon />,
    title: "Partner for Lasting Growth",
    body: "Gain enablement, co-marketing, and support that scale your business and impact.",
  },
];

export function PartnersWhy(): React.ReactElement {
  return (
    <Section padding="lg" className="bg-white">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-5">
            <h2
              className="font-display font-semibold text-[#0F123E]"
              style={{
                fontSize: "var(--text-display-md)",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
              }}
            >
              Why Partner with{" "}
              <span
                style={{
                  background:
                    "linear-gradient(90deg, #7A59FF 0%, #4E2DEB 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                CleanStart
              </span>
            </h2>
          </div>
          <div className="lg:col-span-7 lg:pt-3">
            <p
              className="text-[#475569]"
              style={{ fontSize: "var(--text-body-lg)", lineHeight: 1.5 }}
            >
              As a partner, you help customers ship clean, compliant, and verifiable software with
              trust built in, not bolted on.
            </p>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CARDS.map((card) => (
            <BenefitCardView key={card.title} card={card} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

function BenefitCardView({ card }: { card: BenefitCard }): React.ReactElement {
  return (
    <div
      className="flex flex-col gap-4 rounded-[14px] p-6"
      style={{
        background:
          "linear-gradient(180deg, #FFFFFF 0%, #FAF7FF 60%, #F1E9FF 100%)",
        border: "1px solid #ECE2FF",
        boxShadow: "0 12px 32px -20px rgba(60,30,150,0.20)",
      }}
    >
      <span
        className="inline-flex items-center justify-center w-[64px] h-[64px] rounded-full text-white"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #6CB6FF 0%, #2E7BFF 45%, #1240D4 100%)",
          boxShadow: "0 8px 18px -8px rgba(30,80,220,0.45)",
        }}
        aria-hidden
      >
        {card.icon}
      </span>
      <h3
        className="font-display font-semibold text-[#0F123E]"
        style={{ fontSize: "var(--text-card-title-md)", lineHeight: 1.25 }}
      >
        {card.title}
      </h3>
      <p
        className="text-[#475569]"
        style={{ fontSize: "var(--text-body-sm)", lineHeight: 1.55 }}
      >
        {card.body}
      </p>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 48 48" fill="none" role="img" aria-hidden="true" focusable="false">
      <title>Handshake with shield</title>
      <path d="M24 6.5l-5.5 2v4.2c0 3.6 2.4 6.7 5.5 7.5 3.1-.8 5.5-3.9 5.5-7.5V8.5L24 6.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="m20.5 12.5 2.4 2.4 4.6-4.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 28l5-2.5 4 2 4 4 4-4 4-2 5 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 28v6l4 2 5-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M39 28v6l-4 2-5-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 31.5 22 35l2-1.5 2 1.5 4-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function CheckBadgeIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 48 48" fill="none" role="img" aria-hidden="true" focusable="false">
      <title>Trophy with sparkles</title>
      <path d="M19 11h12v6c0 3.3-2.7 6-6 6s-6-2.7-6-6v-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M19 14h-3c-1.1 0-2 .9-2 2 0 2.8 2.2 5 5 5M31 14h3c1.1 0 2 .9 2 2 0 2.8-2.2 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 22.5v3.5h6v-3.5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M18 26h14l-2 4H20l-2-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M22 30h6l-1 6h-4l-1-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M11 18l.7 1.5L13 20l-1.3.5L11 22l-.7-1.5L9 20l1.3-.5L11 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M37 16l.7 1.5L39 18l-1.3.5L37 20l-.7-1.5L35 18l1.3-.5L37 16Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M37 28l.7 1.5L39 30l-1.3.5L37 32l-.7-1.5L35 30l1.3-.5L37 28Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}
function TrendingUpIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 48 48" fill="none" role="img" aria-hidden="true" focusable="false">
      <title>Person with arrows and stars</title>
      <circle cx="24" cy="17" r="3" stroke="currentColor" strokeWidth="2"/>
      <path d="M24 20v5M18 26l6-1 6 1M16 30l8-5 8 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 13v6M14 15l2-2 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24 8v8M21.5 10.5 24 8l2.5 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M32 13v6M30 15l2-2 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="m13 34 1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L10 36.3l2-.3 1-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="m24 33 1.2 2.4 2.6.4-1.9 1.8.4 2.6-2.3-1.2-2.3 1.2.4-2.6-1.9-1.8 2.6-.4L24 33Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="m35 34 1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L32 36.3l2-.3 1-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 48 48" fill="none" role="img" aria-hidden="true" focusable="false">
      <title>Growth arrows with coins</title>
      <path d="M15 24v-8M13 18l2-2 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24 22v-12M21 13l3-3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M33 24v-7M31 19l2-2 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="15" cy="34" r="5" stroke="currentColor" strokeWidth="2"/>
      <path d="M15 31.5v5M14 33h2M14 35h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="24" cy="35" r="5.5" stroke="currentColor" strokeWidth="2"/>
      <path d="M24 32v6M22.8 33.5h2.4M22.8 36.5h2.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="33" cy="34" r="5" stroke="currentColor" strokeWidth="2"/>
      <path d="M33 31.5v5M32 33h2M32 35h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
