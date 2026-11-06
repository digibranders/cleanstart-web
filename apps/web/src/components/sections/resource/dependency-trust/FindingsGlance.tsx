import { Reveal } from "@/components/ui/Reveal";

import { CountUp } from "./CountUp";
import { GLANCE } from "./content";
import { GrowBars, ShareRing } from "./GlanceVisuals";
import { CARD_PADDING, DarkSection, GLASS_CARD, GradientTitle, STAT_GRADIENT } from "./parts";

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
} as const;

const CELL =
  "relative flex h-full flex-col justify-between gap-8 overflow-hidden transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0";

/** The two values behind the 107% figure; they match its caption. */
const COMPARE = { from: 280, to: 581 } as const;

const DOT_FIELD = {
  backgroundImage: "radial-gradient(circle, rgba(177, 126, 255, 0.6) 1.3px, rgba(177, 126, 255, 0) 1.8px)",
  backgroundSize: "15px 15px",
  maskImage: "radial-gradient(farthest-corner at 100% 100%, #000 0%, rgba(0,0,0,0) 85%)",
  WebkitMaskImage: "radial-gradient(farthest-corner at 100% 100%, #000 0%, rgba(0,0,0,0) 85%)",
} as const;

export function FindingsGlance(): React.ReactElement {
  const { vulnerabilities, components, age, malicious, ai } = GLANCE.stats;

  return (
    <DarkSection dataSection="FindingsGlance">
      <Reveal header>
        <GradientTitle text={GLANCE.heading} accent="at a glance" tone="dark" />
      </Reveal>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:mt-14 lg:auto-rows-fr lg:grid-cols-12 lg:gap-5">
        {/* The headline finding, with the two values it compares. */}
        <Reveal y={24} className="md:col-span-2 lg:col-span-5 lg:row-span-2">
          <div
            className={`${CELL} cs-grad-border min-h-[360px] rounded-[24px] text-white`}
            style={{
              padding: CARD_PADDING,
              background: "linear-gradient(160deg, #151021 0%, #131E8F 62%, #471EC0 100%)",
              boxShadow: "0 40px 90px -30px rgba(8,4,24,0.6), inset 0 1px 0 rgba(255,255,255,0.10)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              aria-hidden
              src="/images/cleanstart-images/env-union-hex.svg"
              alt=""
              className="pointer-events-none absolute -right-28 -top-20 w-[460px] max-w-none select-none opacity-25"
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
            <GrowBars from={COMPARE.from} to={COMPARE.to} />
          </div>
        </Reveal>

        {/* Estate size, split by how a component got there. */}
        <Reveal y={24} delay={0.08} className="lg:col-span-4">
          <div className={`${CELL} cs-grad-border rounded-[24px]`} style={{ ...GLASS_CARD, padding: CARD_PADDING }}>
            <div>
              <p style={{ ...NUMERAL_STYLE, ...STAT_GRADIENT }}>
                <CountUp value={components.value} suffix={components.suffix} />
              </p>
              <p className="mt-4 max-w-[34ch] text-white/80" style={CAPTION_STYLE}>
                {components.caption}
              </p>
            </div>
            <div aria-hidden>
              <div className="flex h-3 w-full overflow-hidden rounded-full">
                <div style={{ width: "36%", background: "rgba(44, 193, 235, 0.35)" }} />
                <div style={{ width: "64%", background: "linear-gradient(90deg, #9A51FF 0%, #2CC1EB 100%)" }} />
              </div>
              <div className="mt-2 flex text-white/65" style={{ fontSize: "var(--fs-caption)" }}>
                <span style={{ width: "36%" }}>Direct 36%</span>
                <span>Indirect 64%</span>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal y={24} delay={0.16} className="lg:col-span-3">
          <div className={`${CELL} cs-grad-border rounded-[24px]`} style={{ ...GLASS_CARD, padding: CARD_PADDING }}>
            <div className="flex items-start justify-between gap-3">
              <p style={{ ...NUMERAL_STYLE, ...STAT_GRADIENT }}>
                <CountUp value={age.value} suffix={age.suffix} />
              </p>
              <ShareRing percent={age.value} />
            </div>
            <p className="max-w-[26ch] text-white/80" style={CAPTION_STYLE}>
              {age.caption}
            </p>
          </div>
        </Reveal>

        <Reveal y={24} delay={0.08} className="lg:col-span-4">
          <div className={`${CELL} cs-grad-border rounded-[24px]`} style={{ ...GLASS_CARD, padding: CARD_PADDING }}>
            <div aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-[85%] w-[75%]" style={DOT_FIELD} />
            <p className="relative" style={{ ...NUMERAL_STYLE, ...STAT_GRADIENT }}>
              <CountUp value={malicious.value} suffix={malicious.suffix} />
            </p>
            <p className="relative max-w-[30ch] text-white/80" style={CAPTION_STYLE}>
              {malicious.caption}
            </p>
          </div>
        </Reveal>

        <Reveal y={24} delay={0.16} className="lg:col-span-3">
          <div
            className={`${CELL} rounded-[24px] text-white`}
            style={{
              padding: CARD_PADDING,
              background: "linear-gradient(150deg, #076EFF 0%, #6A3DF0 100%)",
              boxShadow: "0 24px 48px -20px rgba(45, 90, 200, 0.35)",
            }}
          >
            <p style={NUMERAL_STYLE}>
              <CountUp value={ai.value} suffix={ai.suffix} />
            </p>
            <div aria-hidden className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((block) => (
                <span
                  key={block}
                  className="h-7 w-7 rounded-[8px]"
                  style={block === 0 ? { background: "#ffffff" } : { border: "1.5px solid rgba(255,255,255,0.55)" }}
                />
              ))}
            </div>
            <p className="max-w-[28ch] text-white/90" style={CAPTION_STYLE}>
              {ai.caption}
            </p>
          </div>
        </Reveal>
      </div>
    </DarkSection>
  );
}
