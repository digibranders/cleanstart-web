import Image from "next/image";
import { Container, Section } from "@/components/layout";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";

interface PartnerType {
  image: string;
  title: string;
  body: string;
}

const TYPES: PartnerType[] = [
  {
    image: "/images/partners/technology.png",
    title: "Technology Partners",
    body: "Integrate CleanStart assurance into your platform to deliver verified, zero-vulnerability software.",
  },
  {
    image: "/images/partners/sys.png",
    title: "Value Sellers",
    body: "Provide verified, compliance-ready infrastructure for customers who need secure and trusted delivery.",
  },
  {
    image: "/images/partners/value.png",
    title: "System Integrators and MSPs",
    body: "Embed CleanStart into managed services to simplify compliance and strengthen customer trust.",
  },
];

export function PartnersTypes(): React.ReactElement {
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
              Partner in the Way That{" "}
              <span className="cs-text-gradient-impact">Fits You Best</span>
            </h2>
          </Reveal>
          <Reveal header delay={0.15} y={20} className="lg:col-span-7 lg:pt-3">
            <p
              className="text-[#475569]"
              style={{ fontSize: "var(--fs-body)", lineHeight: 1.5 }}
            >
              Whether you integrate the technology, deliver it to customers, or embed it into
              managed services, each partnership creates shared value and growth.
            </p>
          </Reveal>
        </div>

        <RevealStagger className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6 xl:gap-8">
          {TYPES.map((type) => (
            <RevealItem key={type.title} className="h-full">
              <TypeCard type={type} />
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}

/**
 * Matches the DeveloperWorkflows feature-card chrome — cyan gradient ring,
 * purple bloom, faint highlight lines — adapted to a 3-up layout with a hero
 * image panel at the top. Fluid width: fills its grid cell so the row never
 * overflows at any breakpoint between 320 and 1920+.
 */
function TypeCard({ type }: { type: PartnerType }): React.ReactElement {
  return (
    <div
      className="relative flex h-full w-full rounded-[20px] lg:rounded-[36px] p-[4px]"
      style={{
        minHeight: "480px",
        background:
          "linear-gradient(90deg, rgba(44,193,235,0.30), rgba(44,193,235,0.30))",
      }}
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-white rounded-[16px] lg:rounded-[32px] p-5 sm:p-6">
        {/* Purple bloom */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            width: "85%",
            height: "180px",
            left: "50%",
            transform: "translateX(-50%)",
            top: "40px",
            background: "#df9bff",
            opacity: 0.3,
            filter: "blur(66.5px)",
          }}
        />

        {/* 4 faint vertical highlight lines — positioned by % so they scale */}
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

        {/* 2 faint horizontal highlight lines */}
        {[20, 53].map((topPct) => (
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

        {/* Image — sits directly on the card surface (no inner container),
            matching the PartnersWhy ball pattern. */}
        <div
          className="relative flex w-full items-center justify-center"
          style={{ height: "180px" }}
          aria-hidden
        >
          <Image
            src={type.image}
            alt=""
            width={240}
            height={240}
            sizes="(max-width: 640px) 60vw, (max-width: 1024px) 30vw, 200px"
            className="h-full max-h-[180px] w-auto object-contain select-none pointer-events-none"
          />
        </div>

        {/* Title + body */}
        <div className="relative mt-5 flex flex-col gap-3">
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h3)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.15,
              color: "#111",
              margin: 0,
            }}
          >
            {type.title}
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
            {type.body}
          </p>
        </div>
      </div>
    </div>
  );
}

