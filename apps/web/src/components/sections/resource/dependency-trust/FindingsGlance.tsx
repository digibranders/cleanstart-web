import { Container, Section } from "@/components/layout";
import { FadeUp } from "@/components/ui/FadeUp";

import { CountUp } from "./CountUp";
import { GLANCE } from "./content";

const NUMERAL_STYLE = {
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  letterSpacing: "-0.04em",
  lineHeight: 1,
} as const;

const CAPTION_STYLE = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body)",
  lineHeight: 1.5,
} as const;

const CARD = "relative flex flex-col justify-between overflow-hidden rounded-[24px] p-7 lg:p-8";

export function FindingsGlance(): React.ReactElement {
  const { vulnerabilities, components, age, malicious, ai } = GLANCE.stats;

  return (
    <Section padding="lg" data-section="FindingsGlance" className="bg-[#F5F3FF]">
      <Container>
        <FadeUp>
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
            {GLANCE.heading}
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:mt-12 lg:auto-rows-fr lg:grid-cols-12 lg:gap-5">
            {/* Feature: the headline finding, with the two values it compares. */}
            <div
              className={`${CARD} min-h-[360px] gap-10 text-white md:col-span-2 lg:col-span-5 lg:row-span-2`}
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
                className="pointer-events-none absolute -right-28 -top-20 w-[460px] max-w-none select-none opacity-35"
                loading="lazy"
                decoding="async"
              />
              <div className="relative">
                <p style={{ ...NUMERAL_STYLE, fontSize: "calc(var(--fs-display) * 2)" }}>
                  <CountUp value={vulnerabilities.value} suffix={vulnerabilities.suffix} />
                </p>
                <p className="mt-5 max-w-[34ch] text-white/85" style={CAPTION_STYLE}>
                  {vulnerabilities.caption}
                </p>
              </div>
              <div aria-hidden className="relative flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <span className="w-10 text-right text-white/70 tabular-nums" style={CAPTION_STYLE}>
                    280
                  </span>
                  <div className="h-3 rounded-full bg-white/35" style={{ width: "48.2%" }} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-10 text-right font-semibold tabular-nums" style={CAPTION_STYLE}>
                    581
                  </span>
                  <div
                    className="h-3 rounded-full"
                    style={{
                      width: "100%",
                      background: "linear-gradient(90deg, #2CC1EB 0%, #A974FF 100%)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Estate size, split by how a component got there. */}
            <div
              className={`${CARD} gap-8 border-[1.5px] border-black/[0.06] bg-white shadow-[0_18px_40px_-24px_rgba(71,30,192,0.35)] lg:col-span-4`}
            >
              <div>
                <p className="text-[#111]" style={{ ...NUMERAL_STYLE, fontSize: "var(--fs-display)" }}>
                  <CountUp value={components.value} suffix={components.suffix} />
                </p>
                <p className="mt-4 max-w-[34ch] text-[rgba(17,17,17,0.8)]" style={CAPTION_STYLE}>
                  {components.caption}
                </p>
              </div>
              <div aria-hidden>
                <div className="flex h-3 w-full overflow-hidden rounded-full">
                  <div className="bg-[#D9D2FF]" style={{ width: "36%" }} />
                  <div className="bg-[#6A3DF0]" style={{ width: "64%" }} />
                </div>
                <div className="mt-2 flex text-[rgba(17,17,17,0.65)]" style={{ fontSize: "var(--fs-caption)" }}>
                  <span style={{ width: "36%" }}>Direct 36%</span>
                  <span>Indirect 64%</span>
                </div>
              </div>
            </div>

            <div className={`${CARD} gap-8 bg-[#EAE4FF] lg:col-span-3`}>
              <p className="text-[#111]" style={{ ...NUMERAL_STYLE, fontSize: "var(--fs-display)" }}>
                <CountUp value={age.value} suffix={age.suffix} />
              </p>
              <p className="max-w-[26ch] text-[rgba(17,17,17,0.8)]" style={CAPTION_STYLE}>
                {age.caption}
              </p>
            </div>

            <div
              className={`${CARD} gap-8 border-[1.5px] border-black/[0.06] bg-white shadow-[0_18px_40px_-24px_rgba(71,30,192,0.35)] lg:col-span-4`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                aria-hidden
                src="/images/for-developers/why/deco-union-right.svg"
                alt=""
                className="pointer-events-none absolute -bottom-10 -right-16 w-[260px] max-w-none select-none opacity-60"
                loading="lazy"
                decoding="async"
              />
              <p className="relative text-[#111]" style={{ ...NUMERAL_STYLE, fontSize: "var(--fs-display)" }}>
                <CountUp value={malicious.value} suffix={malicious.suffix} />
              </p>
              <p className="relative max-w-[30ch] text-[rgba(17,17,17,0.8)]" style={CAPTION_STYLE}>
                {malicious.caption}
              </p>
            </div>

            <div
              className={`${CARD} gap-8 text-white lg:col-span-3`}
              style={{ background: "linear-gradient(150deg, #076EFF 0%, #6A3DF0 100%)" }}
            >
              <p style={{ ...NUMERAL_STYLE, fontSize: "var(--fs-display)" }}>
                <CountUp value={ai.value} suffix={ai.suffix} />
              </p>
              <p className="max-w-[28ch] text-white/90" style={CAPTION_STYLE}>
                {ai.caption}
              </p>
            </div>
          </div>
        </FadeUp>
      </Container>
    </Section>
  );
}
