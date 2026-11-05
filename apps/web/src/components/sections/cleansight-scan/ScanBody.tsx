import { ShieldCheckIcon } from "@/components/sections/book-a-demo/WhatsSetsUsApart";
import { ScanRequestForm } from "@/components/sections/forms/ScanRequestForm";

import { CONTAINER_STYLE, SectionHeading, TERM_STYLE, TEXT_STYLE } from "./scan-ui";

const INCIDENTS: readonly { name: string; detail: string }[] = [
  {
    name: "PHP2Shell",
    detail: "A flaw in the PHP runtime itself. Updating your website or plugins leaves it in place.",
  },
  {
    name: "Brotli2Shell",
    detail:
      "A flaw in a compression library that comes built into other software, including Node.js and Python tools. You can be affected without ever installing it directly.",
  },
  {
    name: "LiteLLM",
    detail:
      "A tampered release of a popular AI library that stole credentials, even from applications that never used it.",
  },
];

const ANSWERS: readonly { number: string; title: string; detail: string }[] = [
  {
    number: "01",
    title: "Where affected software is running",
    detail: "Trace vulnerable images to the applications, workloads and environments using them.",
  },
  {
    number: "02",
    title: "What’s live in production",
    detail:
      "See which affected images are actually running across cloud and data center environments.",
  },
  {
    number: "03",
    title: "What to do next",
    detail:
      "Get clear remediation guidance and access to hardened, patched images that are ready to deploy.",
  },
];

const REPORT: readonly { term: string; detail: string }[] = [
  {
    term: "A full container inventory",
    detail: "Every image running across AWS, GCP, Azure and your data centers, in one view.",
  },
  {
    term: "Vulnerabilities, ranked by real risk",
    detail: "Prioritized by severity and by how many running containers each one affects.",
  },
  {
    term: "Complete Runtime Visibility",
    detail: "Know exactly what's running in production: every container across every cluster.",
  },
  {
    term: "Actionable Remediation Recommendations",
    detail: "Get immediate remediation guidance to eliminate risks from vulnerable containers.",
  },
];

export function ScanBody(): React.ReactElement {
  return (
    <div
      className="relative mx-auto"
      style={{
        ...CONTAINER_STYLE,
        paddingTop: "clamp(32px, 4vw, 64px)",
        paddingBottom: "clamp(48px, 6vw, 96px)",
      }}
    >
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,488px)] lg:gap-[clamp(40px,5vw,80px)]">
        <div className="max-w-[640px]">
          <SectionHeading>Why “Are we exposed?” is hard to answer</SectionHeading>
          <p className="mt-4" style={TEXT_STYLE}>
            Containers are assembled from base images, open source packages and dependencies, each
            with its own layers. A vulnerability can arrive through any of them, which makes it
            hard to know what you’re actually running.
          </p>
          <p className="mt-4" style={{ ...TEXT_STYLE, opacity: 1, fontWeight: 600 }}>
            Black October showed how that plays out:
          </p>

          <ul className="mt-3 divide-y divide-[#E6E8F4] rounded-[14px] border border-[#E6E8F4] bg-white">
            {INCIDENTS.map(({ name, detail }) => (
              <li
                key={name}
                className="grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-5"
              >
                <span style={{ ...TERM_STYLE, color: "#2F49E5" }}>{name}</span>
                <span style={{ ...TEXT_STYLE, fontSize: "var(--fs-body-sm)" }}>{detail}</span>
              </li>
            ))}
          </ul>

          <p className="mt-4" style={TEXT_STYLE}>
            Finding these by hand means checking every image, in every environment, one at a time.
          </p>

          <SectionHeading className="mt-14">CleanSight gives you three answers</SectionHeading>
          <ol className="mt-5 flex flex-col gap-3">
            {ANSWERS.map(({ number, title, detail }) => (
              <li
                key={number}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 rounded-[14px] bg-[#F4F5FE] p-5"
              >
                <span
                  aria-hidden
                  style={{
                    fontFamily: "var(--font-display), 'Manrope', sans-serif",
                    fontWeight: 600,
                    fontSize: "var(--fs-h3)",
                    lineHeight: 1,
                    letterSpacing: "-0.05em",
                    color: "#2F49E5",
                  }}
                >
                  {number}
                </span>
                <div>
                  <p style={TERM_STYLE}>{title}</p>
                  <p className="mt-1" style={{ ...TEXT_STYLE, fontSize: "var(--fs-body-sm)" }}>
                    {detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <SectionHeading className="mt-14">What’s in your report</SectionHeading>
          <ul className="mt-5 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
            {REPORT.map(({ term, detail }) => (
              <li key={term} className="flex items-start gap-[11px]">
                <span className="mt-[3px] shrink-0">
                  <ShieldCheckIcon />
                </span>
                <div>
                  <p style={TERM_STYLE}>{term}</p>
                  <p className="mt-1" style={{ ...TEXT_STYLE, fontSize: "var(--fs-body-sm)" }}>
                    {detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:sticky lg:top-28">
          <ScanRequestForm />
        </div>
      </div>
    </div>
  );
}
