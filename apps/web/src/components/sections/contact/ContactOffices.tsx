import { Section, Container } from "@/components/layout";

interface Office {
  flag: string;
  name: string;
  address: string;
}

const OFFICES: Office[] = [
  {
    flag: "🇸🇬",
    name: "Singapore",
    address: "1003 Bukit Merah Central, #07-23, Singapore 159836",
  },
  {
    flag: "🇮🇳",
    name: "India (Bengaluru)",
    address:
      "Bhive Platinum Address Maker, 114/5, Old Madras Road, Halasuru, Bengaluru, Karnataka, India – 560008",
  },
  {
    flag: "🇮🇳",
    name: "India (Ahmedabad)",
    address:
      "Block C, 9th floor Navratna Business Park, NR Sindhu Bhavan Rd, opp. Gtpl House, Bodakdev, Ahmedabad, Gujarat 380059",
  },
  {
    flag: "🇺🇸",
    name: "North America (HQ)",
    address:
      "CleanStart Security Inc. 16192 Coastal Highway, Lewes, Delaware 19958, County Of Sussex",
  },
];

export function ContactOffices() {
  return (
    <Section padding="md">
      <Container>
        {/* Title row with flanking hairlines + dots, matching Figma */}
        <div className="mb-10 flex items-center gap-4 sm:mb-14 sm:gap-6">
          <Hairline />
          <h2
            className="font-display font-semibold text-[#111111]"
            style={{
              fontSize: "var(--text-display-md)",
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            Our <span className="text-[#3960F9]">offices</span>
          </h2>
          <Hairline />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {OFFICES.map((o) => (
            <OfficeCard key={o.name} office={o} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

function Hairline() {
  return (
    <div
      aria-hidden
      className="hidden flex-1 items-center gap-2 sm:flex"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#D9D9D9]" />
      <span className="h-px flex-1 bg-[#D9D9D9]" />
      <span className="h-1.5 w-1.5 rounded-full bg-[#D9D9D9]" />
    </div>
  );
}

function OfficeCard({ office }: { office: Office }) {
  return (
    <div
      className="flex h-full flex-col gap-5 rounded-[20px] bg-white p-6 transition-shadow duration-200 hover:shadow-[0_24px_48px_-24px_rgba(60,30,150,0.18)]"
      style={{
        border: "1px solid #ECE6FF",
        background:
          "linear-gradient(180deg, #FFFFFF 0%, #FBF8FF 100%)",
        boxShadow:
          "0 1px 0 rgba(0,0,0,0.03), 0 12px 28px -16px rgba(60,30,150,0.10)",
      }}
    >
      <div
        aria-hidden
        className="flex h-12 w-16 items-center justify-center overflow-hidden rounded-md bg-white text-3xl leading-none"
        style={{
          border: "1px solid #E5E5E5",
        }}
      >
        <span style={{ filter: "saturate(1.1)" }}>{office.flag}</span>
      </div>

      <div className="flex flex-col gap-3">
        <h3
          className="font-display font-semibold text-[#111111]"
          style={{
            fontSize: "var(--text-card-title-md)",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
          }}
        >
          {office.name}
        </h3>
        <p
          className="text-[#555555]"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-body-md)",
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: "-0.01em",
          }}
        >
          {office.address}
        </p>
      </div>
    </div>
  );
}
