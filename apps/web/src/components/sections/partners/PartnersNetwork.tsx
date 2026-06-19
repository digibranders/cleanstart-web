"use client";

import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  useReducedMotion,
} from "motion/react";
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

const REGIONS = ["Global", "Asia Pacific", "Europe", "Middle East", "North America"] as const;
type Region = (typeof REGIONS)[number];

const INITIAL_VISIBLE = 8;

const CARD_SPRING = { type: "spring", stiffness: 280, damping: 30, mass: 0.8 } as const;

const tabId = (region: Region): string => `region-tab-${region.replace(/\s+/g, "-").toLowerCase()}`;

const PARTNERS: Record<Region, Partner[]> = {
  Global: [
    { name: "Nutanix", country: "San Jose, USA", logo: "/images/partners/global/nutanix.jpg" },
    { name: "Sysdig", country: "San Francisco, USA", logo: "/images/partners/global/sysdig.png" },
  ],
  "Asia Pacific": [
    { name: "Hitachi Systems", country: "India", logo: "/images/partners/global/hitachi.webp" },
    { name: "Citius Cloud", country: "India", logo: "/images/partners/global/citius.webp" },
    { name: "CyberNx", country: "India", logo: "/images/partners/global/cybernx.webp" },
    { name: "eCaps", country: "India", logo: "/images/partners/global/ecaps.webp" },
    { name: "SEESEC", country: "India", logo: "/images/partners/global/seesec.webp" },
    { name: "Imperium", country: "Singapore", logo: "/images/partners/global/imperium.webp" },
    { name: "R-Tech", country: "Indonesia", logo: "/images/partners/global/rtech.webp" },
    { name: "eSec Forte", country: "India", logo: "/images/partners/global/sec-forte.webp" },
    { name: "Raksha Technologies", country: "India", logo: "/images/partners/global/raksha.webp" },
  ],
  Europe: [
    { name: "NGIT", country: "Nordics", logo: "/images/partners/global/ngit.webp" },
    {
      name: "Mactech Consultants",
      country: "London, UK",
      logo: "/images/partners/global/MactechProperties_logo.png",
    },
  ],
  "Middle East": [
    {
      name: "Surakshate",
      country: "UAE",
      logo: "/images/partners/global/surakshate.webp",
      invertOnLight: true,
    },
    {
      name: "Help AG",
      country: "Dubai, UAE",
      logo: "/images/partners/global/help-ag-logo-2048x603.png",
    },
  ],
  "North America": [
    {
      name: "Fortifire",
      country: "North America",
      logo: "/images/partners/global/fortifire-icon.webp",
      wordmark: "FORTIFIRE",
    },
    {
      name: "Zensar",
      country: "San Jose, USA",
      logo: "/images/partners/global/zensar.svg",
      invertOnLight: true,
    },
  ],
};

export function PartnersNetwork(): React.ReactElement {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<Region>("Global");
  const [expanded, setExpanded] = useState(false);
  const partners = PARTNERS[active];
  const basePartners = partners.slice(0, INITIAL_VISIBLE);
  const extraPartners = partners.slice(INITIAL_VISIBLE);

  // The tab bar is a single horizontal row that scrolls (no wrap) when it overflows a
  // narrow viewport. Auto-center the active tab so the selection is never stuck off-screen;
  // the first tab ("Global") rests at the left edge so the bar reads from the start.
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (active === "Global") {
      scroller.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    const btn = scroller.querySelector<HTMLButtonElement>(`#${tabId(active)}`);
    if (!btn) return;
    const target = btn.offsetLeft - (scroller.clientWidth - btn.offsetWidth) / 2;
    scroller.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [active]);

  const selectRegion = (region: Region): void => {
    setActive(region);
    setExpanded(false);
  };

  return (
    <Section
      padding="lg"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #10123E 30%, #131E8F 65%, #471EC0 100%)",
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
                  background:
                    "linear-gradient(90deg, #B68CFF 0%, #7A59FF 100%)",
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
          <div
            ref={scrollerRef}
            className="mt-10 -mx-6 flex overflow-x-auto px-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div
              role="tablist"
              aria-label="Partner regions"
              className="mx-auto inline-flex shrink-0 items-center gap-1"
              style={{
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: "100px",
                padding: "4px",
                width: "fit-content",
              }}
            >
              {REGIONS.map((region) => {
                const isActive = region === active;
                return (
                  <button
                    key={region}
                    id={tabId(region)}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => selectRegion(region)}
                    className="flex shrink-0 items-center whitespace-nowrap font-semibold leading-[1.2] tracking-[-0.04em]"
                    style={{
                      fontSize: "var(--fs-body)",
                      minHeight: "44px",
                      padding: "8px 24px",
                      borderRadius: "100px",
                      cursor: "pointer",
                      border: "none",
                      background: isActive
                        ? "linear-gradient(180deg, #151021 0%, #131E8F 100%)"
                        : "transparent",
                      color: isActive ? "#fff" : "#555",
                      transition:
                        "background 360ms cubic-bezier(0.34, 1.56, 0.64, 1), color 280ms ease-out",
                    }}
                  >
                    {region}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {partners.length === 0 ? (
              <div className="col-span-full text-center text-white/70 py-12" style={{ fontSize: "var(--fs-body)" }}>
                We&apos;re actively expanding in this region. Check back soon.
              </div>
            ) : (
              basePartners.map((p) => <PartnerCard key={`${p.name}-${p.country}`} partner={p} />)
            )}
            {/* Mobile/tablet: show every partner up front — no View More toggle below lg. */}
            <div className="contents lg:hidden">
              {extraPartners.map((p) => (
                <PartnerCard key={`${p.name}-${p.country}`} partner={p} />
              ))}
            </div>
            {/* Desktop (lg+): reveal the remaining partners via View More, with the spring entrance. */}
            <div className="hidden lg:contents">
              <AnimatePresence initial={false}>
                {expanded &&
                  extraPartners.map((p, i) => (
                    <m.div
                      key={`${p.name}-${p.country}`}
                      initial={reduce ? false : { opacity: 0, y: 18, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.96 }}
                      transition={
                        reduce ? { duration: 0.15, ease: EASE_SOFT } : { ...CARD_SPRING, delay: i * 0.06 }
                      }
                    >
                      <PartnerCard partner={p} />
                    </m.div>
                  ))}
              </AnimatePresence>
            </div>
          </div>

          {partners.length > INITIAL_VISIBLE && (
            <div className="mt-10 hidden justify-center lg:flex">
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                aria-expanded={expanded}
                className="rounded-full px-6 py-3 text-[#0F123E] bg-white font-semibold hover:bg-white/90 transition-colors"
                style={{ fontSize: "var(--fs-body-sm)", minHeight: "44px" }}
              >
                {expanded ? "View Less" : "View More"}
              </button>
            </div>
          )}
        </LazyMotion>
      </Container>
    </Section>
  );
}

function PartnerCard({ partner }: { partner: Partner }): React.ReactElement {
  return (
    <div
      className="flex flex-col gap-3 rounded-[12px] bg-white p-5"
      style={{ border: "1px solid rgba(255,255,255,0.12)" }}
    >
      <div className="flex h-9 items-center gap-2">
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
            className="h-full w-auto object-contain object-left"
            style={partner.invertOnLight ? { filter: "brightness(0)" } : undefined}
          />
        ) : (
          <Image
            src={partner.logo}
            alt={`${partner.name} logo`}
            width={partner.wordmark ? 36 : 160}
            height={36}
            sizes={partner.wordmark ? "36px" : "160px"}
            className="h-full w-auto object-contain object-left"
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
        <h3
          className="font-display font-semibold text-[#0F123E]"
          style={{ fontSize: "var(--fs-h5)", lineHeight: 1.3 }}
        >
          {partner.name}
        </h3>
        <p className="text-[#475569]" style={{ fontSize: "var(--fs-caption)" }}>
          {partner.country}
        </p>
      </div>
    </div>
  );
}
