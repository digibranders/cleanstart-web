import { Section, Container } from "@/components/layout";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";
import { FOUNDATIONS } from "./compare-data";
import { BRAND, LightBandDecor, WASH_LIGHT } from "./compare-visuals";

/**
 * "What Are Docker Hardened Images and How Do They Compare With CleanStart?"
 *
 * Two panels, deliberately not symmetrical in weight. The Docker panel is a
 * plain white tile with a slate rule; the CleanStart panel carries the site's
 * gradient assurance card. Same structure, same type scale, same bullet count —
 * the page is not hiding the comparison, it is just clear about whose site this
 * is.
 *
 * The vendor names and the two "focuses on" lead-ins are `<p>`, not headings:
 * the source document does not set them as headings, and promoting them would
 * add an outline level SEO never wrote.
 */

function FocusMarker({
  tone,
}: {
  tone: "docker" | "cleanstart";
}): React.ReactElement {
  return (
    <span
      aria-hidden
      className="mt-[7px] block size-[7px] shrink-0 rotate-45 rounded-[1.5px]"
      style={{
        background:
          tone === "cleanstart"
            ? `linear-gradient(135deg, ${BRAND.violetLight}, ${BRAND.violet})`
            : "rgba(51, 65, 85, 0.42)",
      }}
    />
  );
}

function Panel({
  column,
  tone,
}: {
  column: (typeof FOUNDATIONS.columns)[number];
  tone: "docker" | "cleanstart";
}): React.ReactElement {
  const isCleanStart = tone === "cleanstart";
  return (
    <article
      className="relative flex h-full flex-col overflow-hidden"
      style={{
        borderRadius: "24px",
        padding: "clamp(24px, 2.2vw, 38px)",
        ...(isCleanStart
          ? {
              border: "1px solid rgba(120,180,255,0.45)",
              background:
                "linear-gradient(150deg, #ffffff 0%, #ffffff 38%, #F6EDFF 78%, #EFDCFF 100%)",
              boxShadow:
                "0 1px 2px rgba(17,17,17,0.04), 0 18px 44px -22px rgba(70,30,190,0.24)",
            }
          : {
              border: "1px solid rgba(17,17,17,0.09)",
              background: "#ffffff",
              boxShadow: "0 1px 2px rgba(17,17,17,0.04)",
            }),
      }}
    >
      {isCleanStart && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 select-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(120,120,200,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(120,120,200,0.07) 1px, transparent 1px)",
            backgroundSize: "68px 68px",
          }}
        />
      )}

      <div className="relative flex h-full flex-col">
        {/* Accent rule above the name: the page's one colour-coded axis. */}
        <span
          aria-hidden
          className="block h-[3px] w-11 rounded-full"
          style={{
            background: isCleanStart
              ? `linear-gradient(90deg, ${BRAND.violet}, ${BRAND.blue})`
              : "rgba(51,65,85,0.3)",
          }}
        />

        <p
          className="mt-5 font-display text-[#111111]"
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
            color: "rgba(17,17,17,0.66)",
          }}
        >
          {column.body}
        </p>

        <p
          className="mt-auto pt-8 font-display"
          style={{
            fontSize: "var(--fs-eyebrow)",
            fontWeight: 600,
            letterSpacing: "var(--fs-eyebrow-ls)",
            textTransform: "uppercase",
            color: isCleanStart ? BRAND.violet : "rgba(51,65,85,0.72)",
          }}
        >
          {column.focusLabel}
        </p>

        <ul className="mt-4 flex flex-col gap-3">
          {column.focus.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <FocusMarker tone={tone} />
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-body)",
                  lineHeight: 1.5,
                  color: "#1A1A1A",
                }}
              >
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function CompareFoundations(): React.ReactElement {
  return (
    <Section
      padding="lg"
      data-section="CompareFoundations"
      className="overflow-hidden"
      style={{ background: WASH_LIGHT }}
    >
      <LightBandDecor />

      <Container className="relative">
        <div className="max-w-[760px]">
          <Reveal header>
            <h2
              id="what-are-docker-hardened-images"
              className="font-display text-[#111111]"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                letterSpacing: "var(--fs-h2-ls)",
                lineHeight: "var(--fs-h2-lh)",
              }}
            >
              {FOUNDATIONS.heading}
            </h2>
          </Reveal>

          <Reveal delay={0.1} y={20}>
            <p
              className="mt-5"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead-sm)",
                lineHeight: 1.6,
                color: "rgba(17,17,17,0.68)",
              }}
            >
              {FOUNDATIONS.intro}
            </p>
          </Reveal>
        </div>

        <RevealStagger className="mt-12 grid gap-6 lg:mt-16 lg:grid-cols-2 lg:gap-8">
          {FOUNDATIONS.columns.map((column) => (
            <RevealItem key={column.id}>
              <Panel
                column={column}
                tone={column.id === "cleanstart" ? "cleanstart" : "docker"}
              />
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}
