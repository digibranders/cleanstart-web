import Image from "next/image";
import { Container, Section } from "@/components/layout";

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
        className="relative flex h-[190px] items-center justify-center overflow-hidden rounded-[12px] p-4"
        style={{
          background:
            "linear-gradient(135deg, #FFFFFF 0%, #F1E6FF 60%, #E4D0FF 100%)",
          border: "1px solid #ECE2FF",
        }}
        aria-hidden
      >
        <Image
          src={type.image}
          alt=""
          width={240}
          height={240}
          sizes="(max-width: 640px) 50vw, 240px"
          className="h-full max-h-[150px] w-auto object-contain"
        />
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

