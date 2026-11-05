import { ChevronDown } from "lucide-react";

import { Reveal } from "@/components/ui/Reveal";

import { ABOUT_RESEARCH } from "./content";
import { Bezel, GradientTitle, PageSection, TONES } from "./parts";

const TONE = "light";
const t = TONES[TONE];

const BODY_STYLE = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body)",
  fontWeight: 400,
  letterSpacing: "-0.02em",
  lineHeight: 1.6,
  color: t.body,
} as const;

const H3_STYLE = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--fs-h4)",
  fontWeight: 700,
  letterSpacing: "-0.04em",
  lineHeight: 1.25,
  color: t.heading,
} as const;

export function AboutResearch(): React.ReactElement {
  return (
    <PageSection dataSection="AboutResearch" tone={TONE}>
      <Reveal header>
        <GradientTitle text={ABOUT_RESEARCH.heading} accent="research" tone={TONE} />
      </Reveal>

      <Reveal y={24} delay={0.08}>
        <div className="mx-auto mt-8 flex max-w-[820px] flex-col gap-4 text-center">
          {ABOUT_RESEARCH.paragraphs.map((paragraph) => (
            <p key={paragraph} style={{ ...BODY_STYLE, fontSize: "var(--fs-lead-sm)" }}>
              {paragraph}
            </p>
          ))}
        </div>

        {/* A native disclosure: keyboard and screen-reader accessible with no
            script, and the text stays in the page for search engines. */}
        <details className="group mx-auto mt-10 max-w-[1120px]">
          <summary
            className="mx-auto flex min-h-12 w-fit cursor-pointer list-none items-center gap-2.5 rounded-[8px] border border-[#3960F9]/35 bg-white px-[22px] py-2.5 text-left text-[#1B1F4F] outline-offset-4 transition-colors duration-300 hover:bg-[#F5F3FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3960F9] [&::-webkit-details-marker]:hidden"
            style={{
              fontFamily: "var(--font-sora), ui-sans-serif, system-ui, sans-serif",
              fontSize: "var(--fs-button)",
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          >
            <span>{ABOUT_RESEARCH.sourcesButton}</span>
            <ChevronDown
              aria-hidden
              size={18}
              strokeWidth={2}
              className="shrink-0 transition-transform duration-300 group-open:rotate-180 motion-reduce:transition-none"
            />
          </summary>

          <div className="mt-6">
            <Bezel tone={TONE} innerClassName="p-6 sm:p-10 lg:p-12">
              <h3 style={H3_STYLE}>{ABOUT_RESEARCH.methodologyHeading}</h3>
              <div className="mt-4 flex max-w-[78ch] flex-col gap-4">
                {ABOUT_RESEARCH.methodology.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} style={{ ...BODY_STYLE, fontSize: "var(--fs-body-sm)" }}>
                    {paragraph}
                  </p>
                ))}
              </div>

              <h3 className="mt-10" style={H3_STYLE}>
                {ABOUT_RESEARCH.referencesHeading}
              </h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ABOUT_RESEARCH.references.map((reference) => (
                  <li
                    key={`${reference.publisher}-${reference.title}`}
                    className={`rounded-[14px] border p-4 ${t.chip}`}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--fs-body-sm)",
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        color: t.publisher,
                      }}
                    >
                      {reference.publisher}
                    </p>
                    <p className="mt-1" style={{ ...BODY_STYLE, fontSize: "var(--fs-body-sm)", lineHeight: 1.4 }}>
                      {reference.title}
                    </p>
                  </li>
                ))}
              </ul>
            </Bezel>
          </div>
        </details>
      </Reveal>
    </PageSection>
  );
}
