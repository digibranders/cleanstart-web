import React from "react";
import Image from "next/image";
import { Section, Container } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";

interface Office {
  flag: string;
  flagAlt: string;
  name: string;
  address: string;
}

const OFFICES: Office[] = [
  {
    flag: "/images/contact/flags/flag-sg.webp",
    flagAlt: "Singapore flag",
    name: "Singapore",
    address: "1003 Bukit Merah Central, #07-23, Singapore 159836",
  },
  {
    flag: "/images/contact/flags/flag-in.webp",
    flagAlt: "India flag",
    name: "India (Bengaluru)",
    address:
      "Bhive Platinum Address Maker, 114/5, Old Madras Road, Halasuru, Bengaluru, Karnataka, India – 560008",
  },
  {
    flag: "/images/contact/flags/flag-in.webp",
    flagAlt: "India flag",
    name: "India (Ahmedabad)",
    address:
      "Block C, 9th floor Navratna Business Park, NR Sindhu Bhavan Rd, opp. Gtpl House, Bodakdev, Ahmedabad, Gujarat 380059",
  },
  {
    flag: "/images/contact/flags/flag-us.webp",
    flagAlt: "United States flag",
    name: "North America (HQ)",
    address:
      "CleanStart Security Inc. 16192 Coastal Highway, Lewes, Delaware 19958, County Of Sussex",
  },
];

export function ContactOffices() {
  return (
    <Section padding="md">
      <Container>
        <Reveal header className="mb-10 flex items-center gap-4 sm:mb-12 sm:gap-6">
          <Hairline />
          <h2
            className="font-display font-semibold text-[#111111] whitespace-nowrap"
            style={{
              fontSize: "var(--fs-h2)",
              lineHeight: 1,
              letterSpacing: "-0.05em",
            }}
          >
            Our{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, #2CC1EB 0%, #9A51FF 100%)",
              }}
            >
              offices
            </span>
          </h2>
          <Hairline />
        </Reveal>

        <div
          className="relative overflow-hidden rounded-[28px] px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14"
          style={{
            background:
              "linear-gradient(135deg, #2A1B6B 0%, #3A22A0 45%, #5E3FE0 100%)",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.06) inset, 0 30px 60px -30px rgba(60,30,150,0.40)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              top: "-120px",
              right: "-80px",
              width: "420px",
              height: "420px",
              borderRadius: "50%",
              background:
                "radial-gradient(closest-side, rgba(122,89,255,0.45) 0%, rgba(122,89,255,0) 100%)",
              filter: "blur(40px)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              bottom: "-120px",
              left: "-80px",
              width: "420px",
              height: "420px",
              borderRadius: "50%",
              background:
                "radial-gradient(closest-side, rgba(70,30,191,0.55) 0%, rgba(70,30,191,0) 100%)",
              filter: "blur(40px)",
            }}
          />

          <div className="relative flex flex-col gap-6 sm:grid sm:grid-cols-2 sm:gap-y-8 lg:grid lg:[grid-template-columns:1fr_1px_1fr_1px_1fr_1px_1fr] lg:gap-0">
            {OFFICES.map((o, i) => (
              <React.Fragment key={o.name}>
                <OfficeCard office={o} />
                {i < OFFICES.length - 1 && (
                  <>
                    <div
                      aria-hidden
                      className="block h-px w-full sm:hidden"
                      style={{
                        backgroundImage:
                          "linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.05) 100%)",
                        backgroundSize: "8px 1px",
                        backgroundRepeat: "repeat-x",
                      }}
                    />
                    <div
                      aria-hidden
                      className="hidden self-stretch lg:block"
                      style={{
                        width: "1px",
                        backgroundImage:
                          "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.05) 100%)",
                        backgroundSize: "1px 8px",
                        backgroundRepeat: "repeat-y",
                      }}
                    />
                  </>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

function Hairline() {
  return (
    <div aria-hidden className="hidden flex-1 items-center sm:flex">
      <span
        className="block shrink-0"
        style={{
          width: "13px",
          height: "12px",
          backgroundColor: "#333333",
          borderRadius: "1px",
          transform: "rotate(45deg)",
        }}
      />
      <span className="h-px flex-1 bg-black" />
      <span
        className="block shrink-0"
        style={{
          width: "13px",
          height: "12px",
          backgroundColor: "#333333",
          borderRadius: "1px",
          transform: "rotate(45deg)",
        }}
      />
    </div>
  );
}

function OfficeCard({ office }: { office: Office }) {
  return (
    <div className="flex h-full flex-col gap-5 px-2 sm:px-4 lg:px-5">
      <div className="relative h-[51px] w-[77px] overflow-hidden rounded-[8px]">
        <Image
          src={office.flag}
          alt={office.flagAlt}
          width={77}
          height={51}
          sizes="77px"
          className="block h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-col gap-2.5">
        <h3
          className="font-display font-semibold text-white"
          style={{
            fontSize: "var(--fs-h4)",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
          }}
        >
          {office.name}
        </h3>
        <p
          className="text-white/75"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-body)",
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
