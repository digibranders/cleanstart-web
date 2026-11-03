import type { ReactNode } from "react";

import { ShieldCheckIcon } from "@/components/sections/book-a-demo/WhatsSetsUsApart";
import { ScanRequestForm } from "@/components/sections/forms/ScanRequestForm";

/*
 * Body of the CleanSight campaign page. The copy is the old Webflow page's,
 * unchanged apart from the em-dash the old copy used. Lists use the shielded
 * bullet from Book a Demo; the form sits beside the copy, as it did in Webflow.
 */

const IDENTIFIES: readonly string[] = [
  "Container inventory",
  "Inherited vulnerabilities",
  "Dependencies",
  "Unsupported images",
  "License exposure",
  "Remediation paths",
];

const RECEIVES: readonly { term: string; detail: string }[] = [
  {
    term: "Complete Runtime Visibility:",
    detail: "Know exactly what's running in production: every container across every cluster.",
  },
  {
    term: "Risk Visibility Reports:",
    detail:
      "Prioritize risks by severity with added runtime context, including how many running containers are affected.",
  },
  {
    term: "Vulnerable Image Identification:",
    detail:
      "Identify which container images contain vulnerabilities, where they're deployed, and which teams own them.",
  },
  {
    term: "Actionable Remediation Recommendations:",
    detail: "Get immediate remediation guidance to eliminate risks from vulnerable containers.",
  },
];

const DIFFERENTIATION: readonly string[] = [
  "Trusted replacement images",
  "Built from source",
  "Reproducible builds",
  "Minimal attack surface",
  "Verifiable software foundations",
];

const TEXT_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-sans), 'Sora', sans-serif",
  fontWeight: 400,
  fontSize: "var(--fs-body)",
  lineHeight: 1.5,
  letterSpacing: "-0.04em",
  color: "#111111",
  opacity: 0.8,
};

function Heading({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <h2
      className="mt-10 first:mt-0"
      style={{
        fontFamily: "var(--font-display), 'Manrope', sans-serif",
        fontWeight: 600,
        fontSize: "var(--fs-h3)",
        lineHeight: 1.1,
        letterSpacing: "-0.05em",
        color: "#111111",
      }}
    >
      {children}
    </h2>
  );
}

function ShieldList({ children }: { children: ReactNode }): React.ReactElement {
  return <ul className="mt-4 flex flex-col gap-3">{children}</ul>;
}

function ShieldItem({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <li className="flex items-start gap-[11px]" style={TEXT_STYLE}>
      <span className="mt-[3px] shrink-0">
        <ShieldCheckIcon />
      </span>
      <span>{children}</span>
    </li>
  );
}

export function ScanBody(): React.ReactElement {
  return (
    <div
      className="relative mx-auto"
      style={{
        maxWidth: "1276px",
        paddingLeft: "clamp(24px, 4vw, 80px)",
        paddingRight: "clamp(24px, 4vw, 80px)",
        paddingTop: "clamp(32px, 4vw, 64px)",
        paddingBottom: "clamp(48px, 6vw, 96px)",
      }}
    >
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,488px)] lg:gap-[clamp(40px,5vw,80px)]">
        <div className="max-w-[640px]">
          <p style={TEXT_STYLE}>
            Containers don&apos;t get built from scratch, they inherit layers of open source
            packages, base images, and dependencies. Most organizations have no clear view into
            what vulnerabilities came along for the ride, where they&apos;re running, or who&apos;s
            responsible for fixing them.
          </p>

          <Heading>What CleanSight Identifies</Heading>
          <ShieldList>
            {IDENTIFIES.map((item) => (
              <ShieldItem key={item}>{item}</ShieldItem>
            ))}
          </ShieldList>

          <Heading>What Customers Receive</Heading>
          <ShieldList>
            {RECEIVES.map(({ term, detail }) => (
              <ShieldItem key={term}>
                <strong style={{ fontWeight: 600 }}>{term}</strong> {detail}
              </ShieldItem>
            ))}
          </ShieldList>

          <Heading>Why Traditional Scanning Falls Short</Heading>
          <p className="mt-4" style={TEXT_STYLE}>
            Knowing you have vulnerable containers is not the same as being able to do something
            about it. Many organizations have invested heavily in visibility tooling only to find
            themselves with dashboards full of findings and no clear path to resolution.
          </p>
          <p className="mt-4" style={TEXT_STYLE}>
            Security teams need more than a list. They need{" "}
            <strong style={{ fontWeight: 600 }}>remediation guidance,</strong> specific,
            prioritized actions that tell them which vulnerable containers to remove first, how to
            reduce exposure quickly, and how to fix it. Without that, findings pile up, fatigue
            sets in, and real risk goes unaddressed.
          </p>

          <Heading>CleanStart Differentiation</Heading>
          <ShieldList>
            {DIFFERENTIATION.map((item) => (
              <ShieldItem key={item}>{item}</ShieldItem>
            ))}
          </ShieldList>
        </div>

        <div className="lg:sticky lg:top-28">
          <ScanRequestForm />
        </div>
      </div>
    </div>
  );
}
