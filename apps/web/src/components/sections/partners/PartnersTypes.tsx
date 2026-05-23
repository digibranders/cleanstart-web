import { Container, Section } from "@/components/layout";

interface PartnerType {
  icon: React.ReactElement;
  title: string;
  body: string;
}

const TYPES: PartnerType[] = [
  {
    icon: <CubeIcon />,
    title: "Technology Partners",
    body: "Integrate CleanStart assurance into your platform to deliver verified, zero-vulnerability software.",
  },
  {
    icon: <GearStackIcon />,
    title: "Value Sellers",
    body: "Provide verified, compliance-ready infrastructure for customers who need secure and trusted delivery.",
  },
  {
    icon: <CogsIcon />,
    title: "System Integrators and MSPs",
    body: "Embed CleanStart into managed services to simplify compliance and strengthen customer trust.",
  },
];

export function PartnersTypes(): React.ReactElement {
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
              Partner in the Way That{" "}
              <span
                style={{
                  background:
                    "linear-gradient(90deg, #7A59FF 0%, #4E2DEB 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Fits You Best
              </span>
            </h2>
          </div>
          <div className="lg:col-span-7 lg:pt-3">
            <p
              className="text-[#475569]"
              style={{ fontSize: "var(--text-body-lg)", lineHeight: 1.5 }}
            >
              Whether you integrate the technology, deliver it to customers, or embed it into
              managed services, each partnership creates shared value and growth.
            </p>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TYPES.map((type) => (
            <TypeCard key={type.title} type={type} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

function TypeCard({ type }: { type: PartnerType }): React.ReactElement {
  return (
    <div
      className="flex flex-col gap-5 rounded-[16px] p-6"
      style={{
        background:
          "linear-gradient(180deg, #FFFFFF 0%, #F6EEFF 70%, #EBDDFF 100%)",
        border: "1px solid #ECE2FF",
        boxShadow: "0 16px 40px -24px rgba(60,30,150,0.22)",
      }}
    >
      <div
        className="flex h-[150px] items-center justify-center rounded-[12px]"
        style={{
          background:
            "linear-gradient(135deg, #FFFFFF 0%, #F1E6FF 60%, #E4D0FF 100%)",
          border: "1px solid #ECE2FF",
        }}
        aria-hidden
      >
        <span className="text-[#5B3FE4]">{type.icon}</span>
      </div>
      <h3
        className="font-display font-semibold text-[#0F123E]"
        style={{ fontSize: "var(--text-card-title-lg)", lineHeight: 1.25 }}
      >
        {type.title}
      </h3>
      <p
        className="text-[#475569]"
        style={{ fontSize: "var(--text-body-sm)", lineHeight: 1.55 }}
      >
        {type.body}
      </p>
    </div>
  );
}

function CubeIcon() {
  return (
    <svg width="68" height="68" viewBox="0 0 64 64" fill="none" role="img" aria-hidden="true" focusable="false">
      <title>Cube</title>
      <path d="M32 8 12 18v28l20 10 20-10V18L32 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M12 18 32 28l20-10M32 28v28" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
}
function GearStackIcon() {
  return (
    <svg width="68" height="68" viewBox="0 0 64 64" fill="none" role="img" aria-hidden="true" focusable="false">
      <title>Gear stack</title>
      <circle cx="32" cy="32" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M32 8v6M32 50v6M8 32h6M50 32h6M15 15l4 4M45 45l4 4M15 49l4-4M45 19l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function CogsIcon() {
  return (
    <svg width="68" height="68" viewBox="0 0 64 64" fill="none" role="img" aria-hidden="true" focusable="false">
      <title>Cogs</title>
      <circle cx="24" cy="36" r="9" stroke="currentColor" strokeWidth="2"/>
      <circle cx="44" cy="22" r="7" stroke="currentColor" strokeWidth="2"/>
      <path d="M24 22v5M24 45v5M11 36h5M37 36h-5M44 11v4M44 29v4M35 22h4M53 22h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
