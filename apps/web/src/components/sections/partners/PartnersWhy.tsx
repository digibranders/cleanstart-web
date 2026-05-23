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
        className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white text-[#5B3FE4]"
        style={{ border: "1px solid #ECE2FF" }}
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" role="img" aria-hidden="true" focusable="false">
      <title>Shield</title>
      <path d="M12 3 4 6v6.5c0 4.5 3.4 8.4 8 9 4.6-.6 8-4.5 8-9V6l-8-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}
function CheckBadgeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" role="img" aria-hidden="true" focusable="false">
      <title>Check badge</title>
      <path d="m9 12 2.2 2.2L15 10.5M12 3 4 6v6.5c0 4.5 3.4 8.4 8 9 4.6-.6 8-4.5 8-9V6l-8-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}
function TrendingUpIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" role="img" aria-hidden="true" focusable="false">
      <title>Trending up</title>
      <path d="M3 17 9 11l4 4 8-8M14 5h7v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" role="img" aria-hidden="true" focusable="false">
      <title>Sparkle</title>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}
