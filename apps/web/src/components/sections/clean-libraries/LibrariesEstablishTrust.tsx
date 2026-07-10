import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { GlassIcon } from "./GlassIcon";

type IconKey = "source" | "verify" | "provenance" | "policy";

/** One trust pillar — how a verified library earns trust before adoption. */
interface TrustPillar {
  icon: IconKey;
  title: string;
  body: string;
  accent: string;
  tint: string;
}

const PILLARS: TrustPillar[] = [
  {
    icon: "source",
    title: "Source Verification",
    body: "Libraries rebuilt and verified directly from trusted upstream source.",
    accent: "#a974ff",
    tint: "rgba(169,116,255,0.14)",
  },
  {
    icon: "provenance",
    title: "Transparent Provenance",
    body: "Complete traceability from source to software artifact.",
    accent: "#5b9bff",
    tint: "rgba(91,155,255,0.14)",
  },
  {
    icon: "verify",
    title: "Continuous Validation",
    body: "Libraries continuously verified as upstream projects evolve.",
    accent: "#2dd4bf",
    tint: "rgba(45,212,191,0.14)",
  },
  {
    icon: "policy",
    title: "Policy Governance",
    body: "Only approved libraries become part of your software.",
    accent: "#f7a35c",
    tint: "rgba(247,163,92,0.14)",
  },
];

/** Line icons — stroke inherits the card accent via currentColor. */
function PillarIcon({ icon }: { icon: IconKey }): React.ReactElement {
  const common = {
    width: 28,
    height: 28,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (icon) {
    case "source":
      return (
        <svg {...common}>
          <line x1="6" y1="3" x2="6" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
      );
    case "verify":
      return (
        <svg {...common}>
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "provenance":
      return (
        <svg {...common}>
          <circle cx="6" cy="19" r="3" />
          <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
          <circle cx="18" cy="5" r="3" />
        </svg>
      );
    case "policy":
      return (
        <svg {...common}>
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v5h5" />
          <line x1="8.5" y1="13" x2="15" y2="13" />
          <line x1="8.5" y1="17" x2="13" y2="17" />
        </svg>
      );
  }
}

function PillarCard({ pillar }: { pillar: TrustPillar }): React.ReactElement {
  return (
    <div
      className="flex h-full flex-col gap-4 rounded-[22px] border p-7"
      style={{
        borderColor: `color-mix(in srgb, ${pillar.accent} 24%, transparent)`,
        background: `linear-gradient(160deg, color-mix(in srgb, ${pillar.accent} 6%, #ffffff) 0%, #ffffff 60%)`,
        boxShadow: "0 14px 34px rgba(17,24,39,0.08)",
      }}
    >
      <div className="relative w-[52px]">
        <GlassIcon accent={pillar.accent}>
          <PillarIcon icon={pillar.icon} />
        </GlassIcon>
        {/* "Verified" badge — the resolution of the Trust Gap's amber "pending"
            pip: the same shoulder position, now a confident green check. */}
        <span
          aria-hidden
          className="absolute -right-1.5 -top-1.5 flex size-[20px] items-center justify-center rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, #6ee7a8 0%, #22c55e 65%, #16a34a 100%)",
            boxShadow:
              "0 0 8px rgba(34,197,94,0.55), inset 0 1px 1px rgba(255,255,255,0.5)",
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#04220f"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
      </div>
      {/* Width cap forces every title onto two balanced lines; the two-line
          min-height keeps the four body paragraphs starting at the same y
          even if a title ever fits on one. */}
      <h3
        className="font-display text-[#111]"
        style={{
          fontSize: "var(--fs-h3)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.12,
          maxWidth: "12ch",
          minHeight: "2.24em",
        }}
      >
        {pillar.title}
      </h3>
      <p
        className="font-sans text-[#555]"
        style={{
          fontSize: "var(--fs-body-sm)",
          fontWeight: 400,
          letterSpacing: "-0.01em",
          lineHeight: 1.5,
        }}
      >
        {pillar.body}
      </p>
    </div>
  );
}

export function LibrariesEstablishTrust(): React.ReactElement {
  return (
    <Section
      padding="lg"
      className="overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #f6f4fc 0%, #ffffff 100%)",
      }}
    >
      {/* Corner accents — faint brand blobs + gridlines, the light-section
          treatment used across the site (cyan TR / purple BL here, flipped
          from the Governance section below so the two read distinctly). */}
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          right: "calc(20 / 1920 * 100%)",
          top: "-300px",
          width: "760px",
          height: "760px",
          background:
            "radial-gradient(50% 50% at 50% 50%, #2cc1eb 0%, rgba(44,193,235,0) 100%)",
          opacity: 0.08,
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/deal-registration/ecosystems-corner-grid.svg"
        alt=""
        className="pointer-events-none absolute right-0 top-0 hidden select-none lg:block"
        style={{ width: "340px", height: "343px" }}
        loading="lazy"
        decoding="async"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          left: "calc(20 / 1920 * 100%)",
          bottom: "-300px",
          width: "760px",
          height: "760px",
          background:
            "radial-gradient(50% 50% at 50% 50%, #9a51ff 0%, rgba(154,81,255,0) 100%)",
          opacity: 0.07,
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/deal-registration/ecosystems-corner-grid.svg"
        alt=""
        className="pointer-events-none absolute bottom-0 left-0 hidden select-none lg:block"
        style={{ width: "340px", height: "343px", transform: "scale(-1, -1)" }}
        loading="lazy"
        decoding="async"
      />
      <Container className="relative">
        <Reveal header>
          <div className="mx-auto max-w-[820px] text-center">
            <h2
              className="font-display text-[#111]"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              Verified by Design
            </h2>
            <p
              className="mx-auto mt-6 max-w-[800px] font-sans text-[#555]"
              style={{
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.5,
                textWrap: "balance",
              }}
            >
              Every library is backed by source verification, transparent
              provenance, continuous validation, and policy-driven governance.
            </p>
          </div>
        </Reveal>

        <RevealStagger className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {PILLARS.map((pillar) => (
            <RevealItem key={pillar.title}>
              <PillarCard pillar={pillar} />
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}
