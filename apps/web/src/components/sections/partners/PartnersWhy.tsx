import Image from "next/image";
import { Container, Section } from "@/components/layout";

interface BenefitCard {
  iconSrc: string;
  title: string;
  body: string;
}

const CARDS: BenefitCard[] = [
  {
    iconSrc: "/images/partners/Ball.png",
    title: "Differentiate Through Trust",
    body: "Deliver verified, zero-vulnerability components that strengthen your product.",
  },
  {
    iconSrc: "/images/partners/Ball2.png",
    title: "Accelerate Compliance Wins",
    body: "Help customers achieve FIPS, FedRAMP, and CIS goals faster through built-in automation.",
  },
  {
    iconSrc: "/images/partners/Ball3.png",
    title: "Drive Revenue with Confidence",
    body: "Win new business in regulated markets with a foundation customers can prove.",
  },
  {
    iconSrc: "/images/partners/Ball4.png",
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
                fontSize: "var(--fs-h2)",
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
              style={{ fontSize: "var(--fs-body)", lineHeight: 1.5 }}
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
      <div
        className="relative w-[88px] h-[88px] shrink-0"
        aria-hidden
      >
        <Image
          src={card.iconSrc}
          alt=""
          fill
          sizes="88px"
          className="object-contain select-none pointer-events-none"
        />
      </div>
      <h3
        className="font-display font-semibold text-[#0F123E]"
        style={{ fontSize: "var(--fs-h4)", lineHeight: 1.25 }}
      >
        {card.title}
      </h3>
      <p
        className="text-[#475569]"
        style={{ fontSize: "var(--fs-body-sm)", lineHeight: 1.55 }}
      >
        {card.body}
      </p>
    </div>
  );
}
