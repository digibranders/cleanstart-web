import type { CSSProperties } from "react";

import { Reveal } from "@/components/ui/Reveal";

import { CountUp } from "../dependency-trust/CountUp";
import { CARD_PADDING, DarkSection, GLASS_CARD, GradientTitle, STAT_GRADIENT } from "../dependency-trust/parts";
import { ReportButton } from "./ReportButton";
import { GLANCE } from "./content";
import { ASSURANCE, buildDotColumns, ESTATE } from "./field";
import { DotField, GrowthBars } from "./visuals";

const ESTATE_COLUMNS = buildDotColumns(ESTATE.cols, ESTATE.rows, ESTATE.aged, ESTATE.seed);
const ASSURANCE_COLUMNS = buildDotColumns(ASSURANCE.cols, ASSURANCE.rows, ASSURANCE.lit, ASSURANCE.seed);

const NUMERAL: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--fs-h2)",
  fontWeight: 700,
  letterSpacing: "-0.04em",
  lineHeight: 1,
};

const CAPTION: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body-sm)",
  fontWeight: 500,
  letterSpacing: "-0.01em",
  lineHeight: 1.45,
};

const TILE_TITLE: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--fs-h4)",
  fontWeight: 600,
  letterSpacing: "-0.03em",
  lineHeight: 1.2,
  textWrap: "balance",
};

/** Every tile is a text column beside its picture, so a row stays short. */
const TILE =
  "cs-grad-border relative flex h-full flex-col gap-5 overflow-hidden rounded-[24px] text-white sm:flex-row sm:items-center sm:justify-between sm:gap-6";

const LIVE_SWATCH: CSSProperties = { background: "#2CC1EB" };
const AGED_SWATCH: CSSProperties = {
  background: "rgba(44,193,235,0.06)",
  boxShadow: "inset 0 0 0 1.5px rgba(177,156,255,0.85)",
};

function Legend({
  items,
}: {
  items: readonly { swatch: CSSProperties; round?: boolean; label: string }[];
}): React.ReactElement {
  return (
    <ul
      className="flex flex-wrap gap-x-5 gap-y-1.5 text-white/75"
      style={{ fontSize: "var(--fs-caption)", fontFamily: "var(--font-sans)" }}
    >
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span
            aria-hidden
            className={`inline-block h-2.5 w-2.5 shrink-0 ${item.round ? "rounded-full" : "rounded-[3px]"}`}
            style={item.swatch}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function Findings(): React.ReactElement {
  const { ai, components, age, vulnerabilities, more } = GLANCE;

  return (
    <DarkSection dataSection="ReportFindings">
      <Reveal header>
        <GradientTitle text={GLANCE.heading} accent={GLANCE.accent} tone="dark" />
      </Reveal>

      <div className="mt-8 grid gap-4 lg:mt-10 lg:grid-cols-12 lg:gap-5">
        {/* 20%: a hundred tested recommendations, twenty of them lit. */}
        <Reveal y={24} className="lg:col-span-5">
          <div className={TILE} style={{ ...GLASS_CARD, padding: CARD_PADDING, background: "linear-gradient(180deg, #151021 0%, #17115C 100%)" }}>
            <div className="min-w-0">
              <p style={{ ...NUMERAL, fontSize: "var(--fs-display)" }}>
                <CountUp value={ai.value} suffix={ai.suffix} />
              </p>
              <h3 className="mt-3 max-w-[22ch]" style={TILE_TITLE}>
                {ai.label}
              </h3>
              <p className="mt-2 max-w-[34ch] text-white/80" style={CAPTION}>
                {ai.caption}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:w-[148px]">
              <DotField
                columns={ASSURANCE_COLUMNS}
                variant="assure"
                shape="square"
                label={`${ai.value} of 100 tested recommendations were valid and free of known vulnerabilities`}
                className="w-[148px] max-w-full"
              />
              <Legend items={[{ swatch: LIVE_SWATCH, label: ai.legend }]} />
            </div>
          </div>
        </Reveal>

        {/* 1,180 and 68%: the same estate, read two ways. */}
        <Reveal y={24} delay={0.08} className="lg:col-span-7">
          <div className={TILE} style={{ ...GLASS_CARD, padding: CARD_PADDING }}>
            <div className="flex shrink-0 gap-8 sm:w-[190px] sm:flex-col sm:gap-5">
              <div>
                <p style={{ ...NUMERAL, ...STAT_GRADIENT }}>
                  <CountUp value={components.value} />
                </p>
                <p className="mt-2 max-w-[24ch] text-white/80" style={CAPTION}>
                  {components.caption}
                </p>
              </div>
              <div>
                <p style={{ ...NUMERAL, ...STAT_GRADIENT }}>
                  <CountUp value={age.value} suffix={age.suffix} />
                </p>
                <p className="mt-2 max-w-[24ch] text-white/80" style={CAPTION}>
                  {age.caption}
                </p>
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <DotField
                columns={ESTATE_COLUMNS}
                variant="estate"
                shape="circle"
                label={`The ${components.value.toLocaleString("en-US")} components of an average application, ${age.value}% of them more than two years old`}
              />
              <Legend
                items={[
                  { swatch: LIVE_SWATCH, round: true, label: components.legend },
                  { swatch: AGED_SWATCH, round: true, label: age.legend },
                ]}
              />
            </div>
          </div>
        </Reveal>

        {/* 107%: from 280 to 581. */}
        <Reveal y={24} delay={0.12} className="lg:col-span-7">
          <div className={TILE} style={{ ...GLASS_CARD, padding: CARD_PADDING }}>
            <div className="min-w-0">
              <p style={{ ...NUMERAL, ...STAT_GRADIENT }}>
                <CountUp value={vulnerabilities.value} suffix={vulnerabilities.suffix} />
              </p>
              <p className="mt-3 max-w-[36ch] text-white/80" style={CAPTION}>
                {vulnerabilities.caption}
              </p>
            </div>
            <GrowthBars
              from={vulnerabilities.from}
              to={vulnerabilities.to}
              label={`Average vulnerabilities per audited codebase rose from ${vulnerabilities.from} to ${vulnerabilities.to}`}
            />
          </div>
        </Reveal>

        {/* The way on: opens the same download form as every other button. */}
        <Reveal y={24} delay={0.16} className="lg:col-span-5">
          <div
            className="relative flex h-full flex-col items-start justify-between gap-5 overflow-hidden rounded-[24px] text-white"
            style={{
              padding: CARD_PADDING,
              background: "linear-gradient(150deg, #3960F9 0%, #6A3DF0 60%, #8B3DF0 100%)",
              boxShadow: "0 24px 48px -20px rgba(45,90,200,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            <div>
              <h3 style={{ ...TILE_TITLE, fontSize: "var(--fs-h3)" }}>{more.heading}</h3>
              <p className="mt-2 max-w-[34ch] text-white/90" style={CAPTION}>
                {more.body}
              </p>
            </div>
            <ReportButton label={more.cta} tone="glass" icon="arrow" />
          </div>
        </Reveal>
      </div>
    </DarkSection>
  );
}
