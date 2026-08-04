import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import {
  PHILOSOPHIES_SECTION,
  PHILOSOPHY_CLEANSTART,
  PHILOSOPHY_DHI,
} from "./compare-data";
import {
  BAND_DARK,
  EllipseGlow,
  VectorGrid,
} from "./compare-visuals";

/**
 * Two Different Security Philosophies.
 *
 * The two sides are deliberately unequal in shape — the article gives Docker a
 * six-item list and CleanStart four running paragraphs — so they are set as two
 * panels free to differ in length rather than forced into matching boxes.
 *
 * Each side is headed by the vendor's own mark rather than an invented glyph.
 * On a page that names a competitor, the real logo is both more legible and
 * more honest than a stand-in icon.
 */

const BODY_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body)",
  fontWeight: 400,
  lineHeight: 1.6,
  letterSpacing: "-0.01em",
  color: "rgba(255,255,255,0.78)",
};

export function ComparePhilosophies(): React.ReactElement {
  return (
    <Section
      data-section="ComparePhilosophies"
      padding="lg"
      className="relative overflow-hidden"
      style={{ background: BAND_DARK }}
      aria-labelledby="compare-philosophies-title"
    >
      <VectorGrid side="right" top="-14%" opacity={0.5} />
      <EllipseGlow side="left" />

      <Container className="relative">
        <Reveal header>
          <div className="mx-auto max-w-[760px] text-center">
            <h2
              id="compare-philosophies-title"
              className="font-display text-white"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.15,
                textWrap: "balance",
              }}
            >
              {PHILOSOPHIES_SECTION.heading}
            </h2>
            <p
              className="mx-auto mt-6 max-w-[640px] text-white/80"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.5,
                textWrap: "balance",
              }}
            >
              {PHILOSOPHIES_SECTION.body[0]}
            </p>
          </div>
        </Reveal>

        {/* A luminous rule, not two boxes. Translucent panels on a dark band are
            low-contrast filler; the contrast the article draws is between the
            two arguments, and a divider states that without enclosing either.
            The two sides are also free to differ in length here, which the
            article intends — Docker gets a list, CleanStart running prose. */}
        <RevealStagger className="mt-14 grid grid-cols-1 gap-12 lg:mt-20 lg:grid-cols-2 lg:gap-0">
          <RevealItem className="h-full lg:pr-14 xl:pr-20">
            <div className="flex h-full flex-col">
              <VendorMark
                src="/images/cleanstart-images/workflows-docker.webp"
                name={PHILOSOPHY_DHI.name}
              />
              <p className="mt-6" style={BODY_STYLE}>
                {PHILOSOPHY_DHI.lead}
              </p>
              <ul className="mt-5 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                {PHILOSOPHY_DHI.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 border-t border-white/[0.14] py-3"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-body-sm)",
                      lineHeight: 1.45,
                      letterSpacing: "-0.01em",
                      color: "rgba(255,255,255,0.9)",
                    }}
                  >
                    <Tick />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p
                className="mt-6"
                style={{ ...BODY_STYLE, color: "rgba(255,255,255,0.62)" }}
              >
                {PHILOSOPHY_DHI.close}
              </p>
            </div>
          </RevealItem>

          <RevealItem className="h-full lg:border-l lg:border-white/[0.16] lg:pl-14 xl:pl-20">
            <div className="flex h-full flex-col">
              {/* The panel tint that used to sit here is gone with the panel.
                  It was absolutely positioned against the panel; without one it
                  would have spread across the whole section. The CleanStart
                  side is now distinguished by its lead line instead. */}
              <div>
                <VendorMark
                  src="/images/security/cs-logomark.svg"
                  name={PHILOSOPHY_CLEANSTART.name}
                />
                <div className="mt-6 flex flex-col gap-4">
                  {PHILOSOPHY_CLEANSTART.body.map((text, index) => (
                    <p
                      key={text}
                      style={
                        index === 0
                          ? { ...BODY_STYLE, color: "#ffffff", fontWeight: 600 }
                          : BODY_STYLE
                      }
                    >
                      {text}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </RevealItem>
        </RevealStagger>
      </Container>
    </Section>
  );
}

/** Vendor logo in a glass tile, with the vendor name beside it. */
function VendorMark({
  src,
  name,
}: {
  src: string;
  name: string;
}): React.ReactElement {
  return (
    <div className="relative flex items-center gap-4">
      <span
        aria-hidden
        className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.08)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.16)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          aria-hidden
          className="pointer-events-none select-none"
          style={{ width: 30, height: 30, objectFit: "contain" }}
          loading="lazy"
          decoding="async"
        />
      </span>
      <h3
        className="font-display text-white"
        style={{
          fontSize: "var(--fs-h4)",
          fontWeight: 600,
          letterSpacing: "var(--fs-h4-ls)",
          lineHeight: 1.2,
        }}
      >
        {name}
      </h3>
    </div>
  );
}

function Tick(): React.ReactElement {
  return (
    <svg
      aria-hidden
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      className="mt-[3px] shrink-0"
    >
      <path
        d="M2.5 8L5.5 11L12.5 4"
        stroke="rgba(201,166,255,0.95)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
