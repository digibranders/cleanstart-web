"use client";

import { useState } from "react";
import { Container, Section } from "@/components/layout";

interface Partner {
  name: string;
  country: string;
  initial: string;
}

const REGIONS = ["Asia Pacific", "Europe & Middle East", "North America"] as const;
type Region = (typeof REGIONS)[number];

const PARTNERS: Record<Region, Partner[]> = {
  "Asia Pacific": [
    { name: "Hitachi Systems", country: "India", initial: "H" },
    { name: "Citius Cloud", country: "India", initial: "C" },
    { name: "CyberNx", country: "India", initial: "C" },
    { name: "eCaps", country: "India", initial: "e" },
    { name: "SEESEC", country: "India", initial: "S" },
    { name: "Imperium", country: "Singapore", initial: "I" },
    { name: "R-Tech", country: "Indonesia", initial: "R" },
    { name: "eSec Forte", country: "India", initial: "e" },
  ],
  "Europe & Middle East": [],
  "North America": [],
};

export function PartnersNetwork(): React.ReactElement {
  const [active, setActive] = useState<Region>("Asia Pacific");
  const partners = PARTNERS[active];

  return (
    <Section
      padding="lg"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #10123E 30%, #131E8F 65%, #471EC0 100%)",
      }}
    >
      {/* Decorative glow */}
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
          <h2
            className="font-display font-semibold text-white"
            style={{
              fontSize: "var(--text-display-md)",
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
          <p
            className="mt-5 text-white/75"
            style={{ fontSize: "var(--text-body-md)", lineHeight: 1.55 }}
          >
            From technology providers and cloud platforms to integrators and value sellers,
            CleanStart partners are shaping how trusted software is built, verified, and delivered
            worldwide. Explore our growing partner network around the world.
          </p>
        </div>

        {/* Region tabs */}
        <div
          className="mx-auto mt-10 flex w-fit items-center gap-1 rounded-full p-1"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.16)",
          }}
          role="tablist"
          aria-label="Partner regions"
        >
          {REGIONS.map((region) => {
            const isActive = region === active;
            return (
              <button
                key={region}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(region)}
                className={`rounded-full px-4 py-2 transition-colors ${
                  isActive
                    ? "bg-white text-[#0F123E] font-semibold"
                    : "text-white/80 hover:text-white"
                }`}
                style={{ fontSize: "var(--text-body-sm)" }}
              >
                {region}
              </button>
            );
          })}
        </div>

        {/* Partner cards grid */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {partners.length === 0 ? (
            <div className="col-span-full text-center text-white/70 py-12" style={{ fontSize: "var(--text-body-md)" }}>
              We&apos;re actively expanding in this region — check back soon.
            </div>
          ) : (
            partners.map((p) => <PartnerCard key={`${p.name}-${p.country}`} partner={p} />)
          )}
        </div>

        {partners.length > 0 && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              className="rounded-full px-6 py-3 text-[#0F123E] bg-white font-semibold hover:bg-white/90 transition-colors"
              style={{ fontSize: "var(--text-body-sm)", minHeight: "44px" }}
            >
              View More
            </button>
          </div>
        )}
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
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#EEF1FF] text-[#2F49E5] font-bold"
          aria-hidden
        >
          {partner.initial}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <h3
          className="font-display font-semibold text-[#0F123E]"
          style={{ fontSize: "var(--text-card-title-sm)", lineHeight: 1.3 }}
        >
          {partner.name}
        </h3>
        <p className="text-[#475569]" style={{ fontSize: "var(--text-body-xs)" }}>
          {partner.country}
        </p>
      </div>
    </div>
  );
}
