import Image from "next/image";
import { Container, Section } from "@/components/layout";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";

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
          <Reveal header className="lg:col-span-5">
            <h2
              className="font-display font-semibold text-[#0F123E]"
              style={{
                fontSize: "var(--fs-h2)",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
              }}
            >
              Why Partner with{" "}
              <span className="cs-text-gradient-impact">CleanStart</span>
            </h2>
          </Reveal>
          <Reveal header delay={0.15} y={20} className="lg:col-span-7 lg:pt-3">
            <p
              className="text-[#475569]"
              style={{ fontSize: "var(--fs-body)", lineHeight: 1.5 }}
            >
              As a partner, you help customers ship clean, compliant, and verifiable software with
              trust built in, not bolted on.
            </p>
          </Reveal>
        </div>

        <RevealStagger className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6 xl:gap-8">
          {CARDS.map((card) => (
            <RevealItem key={card.title} className="h-full">
              <BenefitCardView card={card} />
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}

/**
 * Feature card with a ball icon on top. Fills its grid cell on every breakpoint
 * so the row never overflows; heights align via `h-full` on the grid item plus
 * flex content.
 */
function BenefitCardView({ card }: { card: BenefitCard }): React.ReactElement {
  return (
    <div
      className="relative flex h-full w-full rounded-[20px] lg:rounded-[36px] p-[4px]"
      style={{
        minHeight: "360px",
        background:
          "linear-gradient(90deg, rgba(44,193,235,0.30), rgba(44,193,235,0.30))",
      }}
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-white rounded-[16px] lg:rounded-[32px] p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            width: "85%",
            height: "150px",
            left: "50%",
            transform: "translateX(-50%)",
            top: "28px",
            background: "#df9bff",
            opacity: 0.3,
            filter: "blur(66.5px)",
          }}
        />

        {/* Vertical highlight lines positioned by % so they scale with the card. */}
        {[17, 41, 58, 82].map((leftPct) => (
          <div
            key={leftPct}
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              top: 0,
              left: `${leftPct}%`,
              width: "1px",
              height: "70%",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0) 0%, #ffffff 50.77%, rgba(255,255,255,0) 100%)",
              opacity: 0.8,
            }}
          />
        ))}

        {[23, 56].map((topPct) => (
          <div
            key={topPct}
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: 0,
              right: 0,
              top: `${topPct}%`,
              height: "1px",
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, #ffffff 50.77%, rgba(255,255,255,0) 100%)",
              opacity: 0.3,
            }}
          />
        ))}

        <div
          className="relative shrink-0"
          style={{ width: "88px", height: "88px" }}
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

        <div className="relative mt-5 flex flex-col gap-3">
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h3)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "#111",
              margin: 0,
            }}
          >
            {card.title}
          </h3>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-body)",
              fontWeight: 400,
              letterSpacing: "-0.01em",
              lineHeight: 1.5,
              color: "#555",
              margin: 0,
            }}
          >
            {card.body}
          </p>
        </div>
      </div>
    </div>
  );
}
