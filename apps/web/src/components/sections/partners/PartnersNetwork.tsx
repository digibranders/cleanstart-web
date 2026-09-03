"use client";

import { domAnimation, LazyMotion, m, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Container, Section } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import { EASE_SOFT } from "@/lib/motion";

interface Partner {
  name: string;
  country: string;
  logo: string;
  invertOnLight?: boolean;
  wordmark?: string;
}

interface RegionGroup {
  region: string;
  partners: Partner[];
}

const TRACKS = [
  { id: "technology-alliances", label: "Technology Alliances" },
  { id: "channel-partners", label: "Channel Partners" },
] as const;

type TrackId = (typeof TRACKS)[number]["id"];

const ALLIANCES: Partner[] = [
  { name: "Nutanix", country: "San Jose, USA", logo: "/images/partners/global/nutanix.jpg" },
  { name: "Sysdig", country: "San Francisco, USA", logo: "/images/partners/global/sysdig.png" },
  {
    name: "Orca Security",
    country: "Portland, USA",
    logo: "/images/partners/global/orca-security.svg",
  },
  {
    name: "Zensar",
    country: "San Jose, USA",
    logo: "/images/partners/global/zensar.svg",
    invertOnLight: true,
  },
];

const CHANNEL: RegionGroup[] = [
  {
    region: "Asia Pacific",
    partners: [
      { name: "Hitachi Systems", country: "India", logo: "/images/partners/global/hitachi.webp" },
      { name: "Citius Cloud", country: "India", logo: "/images/partners/global/citius.webp" },
      { name: "CyberNx", country: "India", logo: "/images/partners/global/cybernx.webp" },
      { name: "eCaps", country: "India", logo: "/images/partners/global/ecaps.webp" },
      { name: "SEESEC", country: "India", logo: "/images/partners/global/seesec.webp" },
      { name: "eSec Forte", country: "India", logo: "/images/partners/global/sec-forte.webp" },
      {
        name: "Raksha Technologies",
        country: "India",
        logo: "/images/partners/global/raksha.webp",
      },
      {
        name: "Flying Stars",
        country: "India",
        logo: "/images/partners/global/flying-stars.webp",
      },
      { name: "Softcell", country: "India", logo: "/images/partners/global/softcell.png" },
      { name: "Imperium", country: "Singapore", logo: "/images/partners/global/imperium.webp" },
      { name: "R-Tech", country: "Indonesia", logo: "/images/partners/global/rtech.webp" },
    ],
  },
  {
    region: "Middle East & Africa",
    partners: [
      {
        name: "Help AG",
        country: "Dubai, UAE",
        logo: "/images/partners/global/help-ag-logo-2048x603.png",
      },
      {
        name: "Paramount Assure",
        country: "Dubai, UAE",
        logo: "/images/partners/global/paramount.png",
      },
      { name: "Gulf IT", country: "Dubai, UAE", logo: "/images/partners/global/gulf-it.svg" },
      {
        name: "Sandbox Security",
        country: "Dubai, UAE",
        logo: "/images/partners/global/sandbox-security.png",
      },
      {
        name: "Surakshate",
        country: "UAE",
        logo: "/images/partners/global/surakshate.webp",
        invertOnLight: true,
      },
      { name: "TecCentric", country: "Doha, Qatar", logo: "/images/partners/global/teccentric.svg" },
      {
        name: "Sechpoint Tech",
        country: "Nairobi, Kenya",
        logo: "/images/partners/global/sechpoint.svg",
      },
    ],
  },
  {
    region: "Europe",
    partners: [
      { name: "NGIT", country: "Nordics", logo: "/images/partners/global/ngit.webp" },
      {
        name: "Mactech Consultants",
        country: "London, UK",
        logo: "/images/partners/global/MactechProperties_logo.png",
      },
    ],
  },
  {
    region: "North America",
    partners: [
      { name: "PacGenesis", country: "USA", logo: "/images/partners/global/pacgenesis.png" },
      {
        name: "Fortifire",
        country: "North America",
        logo: "/images/partners/global/fortifire-icon.webp",
        wordmark: "FORTIFIRE",
      },
    ],
  },
];

export function PartnersNetwork(): React.ReactElement {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<TrackId>("technology-alliances");
  const showAlliances = active === "technology-alliances";
  const activeIndex = showAlliances ? 0 : 1;
  // The panel fades only when the reader switches tracks. On first paint the section's own
  // FadeUp wrapper owns the entrance, so a second fade here would double up.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  return (
    <Section
      padding="lg"
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #151021 0%, #10123E 30%, #131E8F 65%, #471EC0 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          right: "-120px",
          top: "60px",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(122,89,255,0.35) 0%, rgba(122,89,255,0) 100%)",
          filter: "blur(80px)",
        }}
      />

      <Container>
        <div className="text-center mx-auto" style={{ maxWidth: "780px" }}>
          <Reveal header>
            <h2
              className="font-display font-semibold text-white"
              style={{
                fontSize: "var(--fs-h2)",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
              }}
            >
              A Global Network of Trusted{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #B68CFF 0%, #7A59FF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Innovators
              </span>
            </h2>
          </Reveal>
          <Reveal header delay={0.15} y={20}>
            <p
              className="mt-5 text-white/75"
              style={{ fontSize: "var(--fs-body)", lineHeight: 1.55 }}
            >
              From technology providers and cloud platforms to integrators and value sellers,
              CleanStart partners are shaping how trusted software is built, verified, and delivered
              worldwide. Explore our growing partner network around the world.
            </p>
          </Reveal>
        </div>

        <LazyMotion features={domAnimation}>
          {/* Two equal grid columns let the sliding indicator be exactly 50% wide with no
              measurement: translateX(100%) lands it on the second column. */}
          <div
            role="tablist"
            aria-label="Partner tracks"
            className="relative mx-auto mt-10 grid w-full max-w-[480px] grid-cols-2"
            style={{
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: "100px",
              padding: "4px",
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute top-[4px] bottom-[4px] left-[4px] w-[calc(50%-4px)]"
              style={{
                borderRadius: "100px",
                background: "linear-gradient(180deg, #151021 0%, #131E8F 100%)",
                transform: `translateX(${activeIndex * 100}%)`,
                transition: "transform 360ms cubic-bezier(0.34, 1.4, 0.64, 1)",
              }}
            />
            {TRACKS.map((track) => {
              const isActive = track.id === active;
              return (
                <button
                  key={track.id}
                  id={`partner-track-tab-${track.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`partner-track-panel-${track.id}`}
                  onClick={() => setActive(track.id)}
                  className="relative z-10 flex items-center justify-center whitespace-nowrap px-3 font-semibold leading-[1.2] tracking-[-0.04em] text-[length:var(--fs-body-sm)] sm:px-4 sm:text-[length:var(--fs-body)]"
                  style={{
                    minHeight: "44px",
                    borderRadius: "100px",
                    cursor: "pointer",
                    border: "none",
                    background: "transparent",
                    color: isActive ? "#fff" : "#555",
                    transition: "color 280ms ease-out",
                  }}
                >
                  {track.label}
                </button>
              );
            })}
          </div>

          {/* Swapping the panel changes the section height by ~1500px (4 cards vs 22). Doing
              that in one frame, with an opacity-only fade and no exit phase, means the reader
              sees a single layout change instead of a blank gap followed by a jump. */}
          <m.div
            key={active}
            id={`partner-track-panel-${active}`}
            role="tabpanel"
            aria-labelledby={`partner-track-tab-${active}`}
            initial={mounted.current && !reduce ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.16, ease: EASE_SOFT }}
            className="mt-10"
          >
            {showAlliances ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {ALLIANCES.map((partner) => (
                  <PartnerCard key={partner.name} partner={partner} headingLevel="h3" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-12">
                {CHANNEL.map((group) => (
                  <div key={group.region}>
                    <div className="flex items-center gap-5">
                      <h3
                        className="font-display font-semibold text-white"
                        style={{
                          fontSize: "var(--fs-h3)",
                          lineHeight: 1.2,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {group.region}
                      </h3>
                      <span
                        aria-hidden
                        className="h-px flex-1"
                        style={{ background: "rgba(255,255,255,0.16)" }}
                      />
                    </div>
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {group.partners.map((partner) => (
                        <PartnerCard
                          key={`${group.region}-${partner.name}`}
                          partner={partner}
                          headingLevel="h4"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </m.div>
        </LazyMotion>
      </Container>
    </Section>
  );
}

function PartnerCard({
  partner,
  headingLevel: NameTag,
}: {
  partner: Partner;
  headingLevel: "h3" | "h4";
}): React.ReactElement {
  return (
    <div
      className="flex flex-col gap-3 rounded-[12px] bg-white p-5"
      style={{ border: "1px solid rgba(255,255,255,0.12)" }}
    >
      <div className="flex h-9 max-w-[150px] items-center gap-2">
        {partner.logo.endsWith(".svg") ? (
          // SVG logos render via plain <img> — next/image needs dangerouslyAllowSVG, and
          // vectors gain nothing from the optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={partner.logo}
            alt={`${partner.name} logo`}
            width={partner.wordmark ? 36 : 160}
            height={36}
            loading="lazy"
            decoding="async"
            className="h-full w-auto max-w-full object-contain object-left"
            style={partner.invertOnLight ? { filter: "brightness(0)" } : undefined}
          />
        ) : (
          <Image
            src={partner.logo}
            alt={`${partner.name} logo`}
            width={partner.wordmark ? 36 : 160}
            height={36}
            sizes={partner.wordmark ? "36px" : "160px"}
            className="h-full w-auto max-w-full object-contain object-left"
            style={partner.invertOnLight ? { filter: "brightness(0)" } : undefined}
          />
        )}
        {partner.wordmark ? (
          <span
            className="font-display font-bold text-[#0F123E] tracking-tight"
            style={{ fontSize: "var(--fs-h5)", lineHeight: 1 }}
          >
            {partner.wordmark}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <NameTag
          className="font-display font-semibold text-[#0F123E]"
          style={{ fontSize: "var(--fs-h5)", lineHeight: 1.3 }}
        >
          {partner.name}
        </NameTag>
        <p className="text-[#475569]" style={{ fontSize: "var(--fs-caption)" }}>
          {partner.country}
        </p>
      </div>
    </div>
  );
}
