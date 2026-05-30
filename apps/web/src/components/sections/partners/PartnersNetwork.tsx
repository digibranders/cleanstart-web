"use client";

import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  useReducedMotion,
} from "motion/react";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Container, Section } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import { EASE_SOFT } from "@/lib/motion";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface Partner {
  name: string;
  country: string;
  logo: string;
  invertOnLight?: boolean;
  wordmark?: string;
}

const REGIONS = ["Asia Pacific", "Europe & Middle East", "North America"] as const;
type Region = (typeof REGIONS)[number];

const INITIAL_VISIBLE = 8;

const PILL_SPRING = { type: "spring", stiffness: 360, damping: 32, mass: 0.9 } as const;
const CARD_SPRING = { type: "spring", stiffness: 280, damping: 30, mass: 0.8 } as const;

const PARTNERS: Record<Region, Partner[]> = {
  "Asia Pacific": [
    { name: "Hitachi Systems", country: "India", logo: "/images/partners/global/hitachi.png" },
    { name: "Citius Cloud", country: "India", logo: "/images/partners/global/citius.png" },
    { name: "CyberNx", country: "India", logo: "/images/partners/global/cybernx.png" },
    { name: "eCaps", country: "India", logo: "/images/partners/global/ecaps.png" },
    { name: "SEESEC", country: "India", logo: "/images/partners/global/seesec.png" },
    { name: "Imperium", country: "Singapore", logo: "/images/partners/global/imperium.png" },
    { name: "R-Tech", country: "Indonesia", logo: "/images/partners/global/rtech.png" },
    { name: "eSec Forte", country: "India", logo: "/images/partners/global/sec-forte.webp" },
    { name: "Raksha Technologies", country: "India", logo: "/images/partners/global/raksha.webp" },
  ],
  "Europe & Middle East": [
    {
      name: "Surakshate",
      country: "UAE",
      logo: "/images/partners/global/surakshate.webp",
      invertOnLight: true,
    },
    { name: "NGIT", country: "Nordics", logo: "/images/partners/global/ngit.webp" },
  ],
  "North America": [
    {
      name: "Fortifire",
      country: "North America",
      logo: "/images/partners/global/fortifire-icon.png",
      wordmark: "FORTIFIRE",
    },
  ],
};

export function PartnersNetwork(): React.ReactElement {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<Region>("Asia Pacific");
  const [expanded, setExpanded] = useState(false);
  const partners = PARTNERS[active];
  const basePartners = partners.slice(0, INITIAL_VISIBLE);
  const extraPartners = partners.slice(INITIAL_VISIBLE);

  const tablistRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useIsomorphicLayoutEffect(() => {
    const el = tablistRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
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
              Why Partner with{" "}
              <span
                style={{
                  background:
                    "linear-gradient(90deg, #B68CFF 0%, #7A59FF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                CleanStart
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
            ref={tablistRef}
            className="relative mx-auto mt-10 flex w-fit items-center gap-1 rounded-full p-1"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.16)",
            }}
            role="tablist"
            aria-label="Partner regions"
          >
            {pill.width > 0 && (
              <m.span
                aria-hidden
                className="absolute top-1 bottom-1 left-0 rounded-full bg-white"
                initial={false}
                animate={{ x: pill.left, width: pill.width }}
                transition={reduce ? { duration: 0 } : PILL_SPRING}
              />
            )}
            {REGIONS.map((region) => {
              const isActive = region === active;
              return (
                <button
                  key={region}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => selectRegion(region)}
                  className={`relative z-10 rounded-full px-4 py-2 transition-colors ${
                    isActive ? "text-[#0F123E] font-semibold" : "text-white/80 hover:text-white"
                  }`}
                  style={{ fontSize: "var(--fs-body-sm)" }}
                >
                  {region}
                </button>
              );
            })}
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {partners.length === 0 ? (
              <div className="col-span-full text-center text-white/70 py-12" style={{ fontSize: "var(--fs-body)" }}>
                We&apos;re actively expanding in this region — check back soon.
              </div>
            ) : (
              basePartners.map((p) => <PartnerCard key={`${p.name}-${p.country}`} partner={p} />)
            )}
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

          {partners.length > INITIAL_VISIBLE && (
            <div className="mt-10 flex justify-center">
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
        <Image
          src={partner.logo}
          alt={`${partner.name} logo`}
          width={partner.wordmark ? 36 : 160}
          height={36}
          sizes={partner.wordmark ? "36px" : "160px"}
          className="h-full w-auto object-contain object-left"
          style={partner.invertOnLight ? { filter: "brightness(0)" } : undefined}
        />
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
