import Image from "next/image";
import { ChevronDown } from "lucide-react";

import { Container, Section } from "@/components/layout";
import { FadeUp } from "@/components/ui/FadeUp";

import { ABOUT_RESEARCH } from "./content";

const BODY_STYLE = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body)",
  lineHeight: "var(--fs-body-lh)",
} as const;

const H3_STYLE = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--fs-h4)",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  lineHeight: "var(--fs-h4-lh)",
} as const;

export function AboutResearch(): React.ReactElement {
  return (
    <Section padding="lg" data-section="AboutResearch" className="bg-white">
      <Container>
        <FadeUp>
          <div className="grid items-stretch gap-12 lg:grid-cols-12 lg:gap-16">
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
                {ABOUT_RESEARCH.heading}
              </h2>
              <div className="mt-8 flex max-w-[68ch] flex-col gap-5">
                {ABOUT_RESEARCH.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-[rgba(17,17,17,0.8)]" style={BODY_STYLE}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* The report's own methodology page, rising out of a tinted panel. */}
            <div
              aria-hidden
              className="relative hidden min-h-[300px] overflow-hidden rounded-[24px] bg-[#F5F3FF] lg:col-span-5 lg:block"
            >
              <div className="absolute left-[14%] top-[14%] w-[72%] origin-bottom-left rotate-[3deg] overflow-hidden rounded-t-[8px] bg-white shadow-[0_24px_48px_-16px_rgba(71,30,192,0.45)] ring-1 ring-black/[0.06]">
                <Image
                  src="/images/resources/dependency-trust/report-page-methodology.webp"
                  alt=""
                  width={910}
                  height={1287}
                  sizes="340px"
                  className="h-auto w-full"
                />
              </div>
            </div>
          </div>

          {/* A native disclosure: keyboard and screen-reader accessible with no
              script, and the text stays in the page for search engines. */}
          <details className="group mt-9">
            <summary
              className="inline-flex min-h-12 cursor-pointer list-none items-center gap-2.5 rounded-[8px] border border-[#3960F9]/35 bg-white px-[22px] py-2.5 text-left text-[#1B1F4F] outline-offset-4 transition-colors duration-200 hover:bg-[#F5F3FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3960F9] [&::-webkit-details-marker]:hidden"
              style={{
                fontFamily: "var(--font-sora), ui-sans-serif, system-ui, sans-serif",
                fontSize: "16px",
                fontWeight: 500,
                letterSpacing: "-0.01em",
              }}
            >
              <span>{ABOUT_RESEARCH.sourcesButton}</span>
              <ChevronDown
                aria-hidden
                size={18}
                strokeWidth={2}
                className="transition-transform duration-300 group-open:rotate-180 motion-reduce:transition-none"
              />
            </summary>

            <div className="mt-6 rounded-[24px] bg-[#F5F3FF] p-7 lg:p-10">
              <h3 className="text-[#111]" style={H3_STYLE}>
                {ABOUT_RESEARCH.methodologyHeading}
              </h3>
              <div className="mt-5 flex max-w-[78ch] flex-col gap-4">
                {ABOUT_RESEARCH.methodology.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 40)}
                    className="text-[rgba(17,17,17,0.8)]"
                    style={{ ...BODY_STYLE, fontSize: "var(--fs-body-sm)" }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              <h3 className="mt-10 text-[#111]" style={H3_STYLE}>
                {ABOUT_RESEARCH.referencesHeading}
              </h3>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ABOUT_RESEARCH.references.map((reference) => (
                  <li
                    key={`${reference.publisher}-${reference.title}`}
                    className="rounded-[16px] border border-black/[0.06] bg-white p-4"
                  >
                    <p
                      className="text-[#471EC0]"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--fs-body-sm)",
                        fontWeight: 600,
                      }}
                    >
                      {reference.publisher}
                    </p>
                    <p
                      className="mt-1 text-[rgba(17,17,17,0.8)]"
                      style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body-sm)", lineHeight: 1.4 }}
                    >
                      {reference.title}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </FadeUp>
      </Container>
    </Section>
  );
}
