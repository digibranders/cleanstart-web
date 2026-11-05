import { Reveal } from "@/components/ui/Reveal";

import { CountUp } from "./CountUp";
import { GLANCE } from "./content";
import { Bezel, CARD_PADDING, DarkSection, GradientTitle, STAT_GRADIENT } from "./parts";

const NUMERAL_STYLE = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--fs-display)",
  fontWeight: 700,
  letterSpacing: "-0.04em",
  lineHeight: 1,
} as const;

const CAPTION_STYLE = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body)",
  fontWeight: 500,
  letterSpacing: "-0.01em",
  lineHeight: 1.4,
  color: "rgba(255, 255, 255, 0.72)",
} as const;

const CELL = "relative flex h-full flex-col justify-between gap-8";

export function FindingsGlance(): React.ReactElement {
  const { vulnerabilities, components, age, malicious, ai } = GLANCE.stats;

  return (
    <DarkSection dataSection="FindingsGlance">
      <Reveal header>
        <GradientTitle text={GLANCE.heading} accent="at a glance" />
      </Reveal>

      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:mt-16 lg:auto-rows-fr lg:grid-cols-12 lg:gap-5">
        {/* The headline finding, with the two values it compares. */}
        <Reveal y={24} className="md:col-span-2 lg:col-span-5 lg:row-span-2">
          <Bezel
            innerClassName="min-h-[380px]"
            innerStyle={{ background: "linear-gradient(160deg, #1A1470 0%, #131E8F 58%, #471EC0 100%)" }}
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
            <div className={`${CELL} text-white`} style={{ padding: CARD_PADDING }}>
              <div className="relative">
                <p style={{ ...NUMERAL_STYLE, fontSize: "calc(var(--fs-display) * 2)" }}>
                  <CountUp value={vulnerabilities.value} suffix={vulnerabilities.suffix} />
                </p>
                <p className="mt-5 max-w-[34ch]" style={{ ...CAPTION_STYLE, color: "rgba(255,255,255,0.85)" }}>
                  {vulnerabilities.caption}
                </p>
              </div>
              <div aria-hidden className="relative flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <span className="w-10 text-right tabular-nums" style={{ ...CAPTION_STYLE, color: "rgba(255,255,255,0.7)" }}>
                    280
                  </span>
                  <div className="h-3 rounded-full bg-white/35" style={{ width: "48.2%" }} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-10 text-right font-semibold tabular-nums" style={{ ...CAPTION_STYLE, color: "#fff" }}>
                    581
                  </span>
                  <div
                    className="h-3 rounded-full"
                    style={{ width: "100%", background: "linear-gradient(90deg, #2CC1EB 0%, #9A51FF 100%)" }}
                  />
                </div>
              </div>
            </div>
          </Bezel>
        </Reveal>

        {/* Estate size, split by how a component got there. */}
        <Reveal y={24} delay={0.08} className="lg:col-span-4">
          <Bezel>
            <div className={CELL} style={{ padding: CARD_PADDING }}>
              <div>
                <p style={{ ...NUMERAL_STYLE, ...STAT_GRADIENT }}>
                  <CountUp value={components.value} suffix={components.suffix} />
                </p>
                <p className="mt-4 max-w-[34ch]" style={CAPTION_STYLE}>
                  {components.caption}
                </p>
              </div>
              <div aria-hidden>
                <div className="flex h-3 w-full overflow-hidden rounded-full">
                  <div style={{ width: "36%", background: "rgba(79, 209, 245, 0.4)" }} />
                  <div style={{ width: "64%", background: "linear-gradient(90deg, #9A51FF 0%, #2CC1EB 100%)" }} />
                </div>
                <div className="mt-2 flex text-white/60" style={{ fontSize: "var(--fs-caption)" }}>
                  <span style={{ width: "36%" }}>Direct 36%</span>
                  <span>Indirect 64%</span>
                </div>
              </div>
            </div>
          </Bezel>
        </Reveal>

        <Reveal y={24} delay={0.16} className="lg:col-span-3">
          <Bezel>
            <div className={CELL} style={{ padding: CARD_PADDING }}>
              <p style={{ ...NUMERAL_STYLE, ...STAT_GRADIENT }}>
                <CountUp value={age.value} suffix={age.suffix} />
              </p>
              <p className="max-w-[26ch]" style={CAPTION_STYLE}>
                {age.caption}
              </p>
            </div>
          </Bezel>
        </Reveal>

        <Reveal y={24} delay={0.08} className="lg:col-span-4">
          <Bezel>
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-16 -right-16 h-[262px] w-[262px]"
              style={{
                background:
                  "radial-gradient(50% 50% at 50% 50%, rgba(177, 126, 255, 0.3) 0%, rgba(177, 126, 255, 0) 70%)",
              }}
            />
            <div className={CELL} style={{ padding: CARD_PADDING }}>
              <p style={{ ...NUMERAL_STYLE, ...STAT_GRADIENT }}>
                <CountUp value={malicious.value} suffix={malicious.suffix} />
              </p>
              <p className="max-w-[30ch]" style={CAPTION_STYLE}>
                {malicious.caption}
              </p>
            </div>
          </Bezel>
        </Reveal>

        <Reveal y={24} delay={0.16} className="lg:col-span-3">
          <Bezel innerStyle={{ background: "linear-gradient(150deg, #076EFF 0%, #6A3DF0 100%)" }}>
            <div className={`${CELL} text-white`} style={{ padding: CARD_PADDING }}>
              <p style={NUMERAL_STYLE}>
                <CountUp value={ai.value} suffix={ai.suffix} />
              </p>
              <p className="max-w-[28ch]" style={{ ...CAPTION_STYLE, color: "rgba(255,255,255,0.92)" }}>
                {ai.caption}
              </p>
            </div>
          </Bezel>
        </Reveal>
      </div>
    </DarkSection>
  );
}
