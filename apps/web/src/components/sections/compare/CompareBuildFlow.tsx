import { Section, Container } from "@/components/layout";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";
import { BUILD_FLOW, type BuildFlowColumn } from "./compare-data";
import {
  BAND_DARK,
  BRAND,
  DarkPanel,
  EllipseGlow,
  HexOutline,
} from "./compare-visuals";

/**
 * "How Do Docker Hardened Images and CleanStart Build Secure Container Images?"
 *
 * The document gives each platform an ordered build approach — five stages for
 * Docker, seven for CleanStart — so the section draws them as two pipelines on
 * one baseline. The panels are equal height and the stages are top-aligned,
 * which means the two extra verification stages read as the difference they
 * are instead of being flattened into a tidy pair of matching lists.
 *
 * On the site's dark band, because this is where the argument turns and the
 * page needs a change of ground between two light sections.
 */

function Pipeline({
  column,
}: {
  column: BuildFlowColumn;
}): React.ReactElement {
  const isCleanStart = column.id === "cleanstart";

  return (
    <DarkPanel className="flex flex-col">
      <span
        aria-hidden
        className="block h-[3px] w-11 rounded-full"
        style={{
          background: isCleanStart
            ? `linear-gradient(90deg, ${BRAND.violetLight}, ${BRAND.blue})`
            : "rgba(255,255,255,0.3)",
        }}
      />

      <p
        className="mt-5 font-display text-white"
        style={{
          fontSize: "var(--fs-h4)",
          fontWeight: 600,
          letterSpacing: "var(--fs-h4-ls)",
          lineHeight: "var(--fs-h4-lh)",
        }}
      >
        {column.label}
      </p>

      <p
        className="mt-3"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-body)",
          lineHeight: "var(--fs-body-lh)",
          color: "rgba(255,255,255,0.62)",
        }}
      >
        {column.body}
      </p>

      <p
        className="mt-8 font-display"
        style={{
          fontSize: "var(--fs-eyebrow)",
          fontWeight: 600,
          letterSpacing: "var(--fs-eyebrow-ls)",
          textTransform: "uppercase",
          color: isCleanStart ? BRAND.violetPale : "rgba(255,255,255,0.45)",
        }}
      >
        {column.stepsLabel}
      </p>

      {/* The rail. `<ol>` because the stages are an order, not a set. */}
      <ol className="relative mt-5 flex flex-col">
        <span
          aria-hidden
          className="absolute left-[5px] top-2 bottom-2 w-px"
          style={{
            background: isCleanStart
              ? `linear-gradient(180deg, ${BRAND.violetPale}, ${BRAND.blue})`
              : "rgba(255,255,255,0.18)",
          }}
        />
        {column.steps.map((step) => (
          <li
            key={step}
            className="relative flex items-start gap-4 py-[7px] pl-0"
          >
            <span
              aria-hidden
              className="relative z-10 mt-[7px] block size-[11px] shrink-0 rounded-full"
              style={{
                background: isCleanStart ? BRAND.violetLight : "#2B2455",
                border: `2px solid ${
                  isCleanStart ? "rgba(223,155,255,0.35)" : "rgba(255,255,255,0.3)"
                }`,
                boxShadow: isCleanStart
                  ? "0 0 0 4px rgba(169,116,255,0.12)"
                  : "none",
              }}
            />
            <span
              className="font-display"
              style={{
                fontSize: "15px",
                fontWeight: 500,
                letterSpacing: "-0.01em",
                lineHeight: 1.4,
                color: isCleanStart ? "#ffffff" : "rgba(255,255,255,0.8)",
              }}
            >
              {step}
            </span>
          </li>
        ))}
      </ol>

      <p
        className="mt-auto pt-9 font-display"
        style={{
          fontSize: "var(--fs-eyebrow)",
          fontWeight: 600,
          letterSpacing: "var(--fs-eyebrow-ls)",
          textTransform: "uppercase",
          color: isCleanStart ? BRAND.violetPale : "rgba(255,255,255,0.45)",
        }}
      >
        {column.traitsLabel}
      </p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {column.traits.map((trait) => (
          <li
            key={trait}
            className="rounded-full px-3.5 py-[7px]"
            style={{
              border: `1px solid ${
                isCleanStart ? "rgba(169,116,255,0.34)" : "rgba(255,255,255,0.14)"
              }`,
              background: isCleanStart
                ? "rgba(106,61,240,0.2)"
                : "rgba(255,255,255,0.04)",
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              lineHeight: 1.3,
              color: isCleanStart ? "#ffffff" : "rgba(255,255,255,0.72)",
            }}
          >
            {trait}
          </li>
        ))}
      </ul>
    </DarkPanel>
  );
}

export function CompareBuildFlow(): React.ReactElement {
  return (
    <Section
      padding="lg"
      data-section="CompareBuildFlow"
      className="overflow-hidden"
      style={{ background: BAND_DARK }}
    >
      <HexOutline side="right" />
      <EllipseGlow side="left" size="360px" />

      <Container className="relative">
        <div className="max-w-[860px]">
          <Reveal header>
            <h2
              id="how-secure-images-are-built"
              className="font-display text-white"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                letterSpacing: "var(--fs-h2-ls)",
                lineHeight: "var(--fs-h2-lh)",
              }}
            >
              {BUILD_FLOW.heading}
            </h2>
          </Reveal>

          <Reveal delay={0.1} y={20}>
            <p
              className="mt-5"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead-sm)",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.66)",
              }}
            >
              {BUILD_FLOW.intro}
            </p>
          </Reveal>
        </div>

        <RevealStagger className="mt-12 grid gap-6 lg:mt-16 lg:grid-cols-2 lg:gap-8">
          {BUILD_FLOW.columns.map((column) => (
            <RevealItem key={column.id} className="h-full">
              <Pipeline column={column} />
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}
