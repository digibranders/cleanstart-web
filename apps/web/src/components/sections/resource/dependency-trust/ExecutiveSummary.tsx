import Image from "next/image";

import { Container, Section } from "@/components/layout";
import { FadeUp } from "@/components/ui/FadeUp";

import { EXECUTIVE_SUMMARY } from "./content";

const BODY_STYLE = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body)",
  lineHeight: "var(--fs-body-lh)",
  color: "rgba(17, 17, 17, 0.8)",
} as const;

export function ExecutiveSummary(): React.ReactElement {
  const [lead, ...rest] = EXECUTIVE_SUMMARY.paragraphs;

  return (
    <Section padding="lg" data-section="ExecutiveSummary" className="bg-white">
      <Container>
        <FadeUp>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <h2
                className="text-[#111]"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-h2)",
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  lineHeight: "var(--fs-h2-lh)",
                  textWrap: "balance",
                }}
              >
                {EXECUTIVE_SUMMARY.heading}
              </h2>

              <p
                className="mt-8 max-w-[62ch] text-[#111]"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-lead-sm)",
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.5,
                }}
              >
                {lead}
              </p>
              <div className="mt-6 flex max-w-[62ch] flex-col gap-5">
                {rest.map((paragraph) => (
                  <p key={paragraph} style={BODY_STYLE}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <aside className="lg:col-span-5">
              <div
                className="relative flex h-full min-h-[320px] flex-col justify-between overflow-hidden rounded-[24px] p-8 text-white lg:p-10"
                style={{
                  background:
                    "linear-gradient(160deg, #151021 0%, #131E8F 62%, #471EC0 100%)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  aria-hidden
                  src="/images/cleanstart-images/env-union-hex.svg"
                  alt=""
                  className="pointer-events-none absolute -right-24 -top-16 w-[420px] max-w-none select-none opacity-40"
                  loading="lazy"
                  decoding="async"
                />
                <Image
                  src="/images/security/cs-logomark.svg"
                  alt=""
                  aria-hidden
                  width={44}
                  height={44}
                  className="relative"
                />
                <p
                  className="relative mt-10"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--fs-h3)",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    lineHeight: "var(--fs-h3-lh)",
                    textWrap: "balance",
                  }}
                >
                  {EXECUTIVE_SUMMARY.statement}
                </p>
              </div>
            </aside>
          </div>
        </FadeUp>
      </Container>
    </Section>
  );
}
