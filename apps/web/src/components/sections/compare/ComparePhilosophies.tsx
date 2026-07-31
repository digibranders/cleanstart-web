import { Section, Container } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import {
  PHILOSOPHIES_SECTION,
  PHILOSOPHY_CLEANSTART,
  PHILOSOPHY_DHI,
} from "./compare-data";
import { GemColumn, Glow, ThreadStyles, accentAt } from "./compare-visuals";

/**
 * Two Different Security Philosophies.
 *
 * A dark band with two gem-anchored columns split by a glowing vertical thread.
 * The two sides are deliberately unequal in shape — the article gives Docker a
 * six-item list and CleanStart four running paragraphs — and the gems plus the
 * thread carry the composition so neither side needs a card to hold it.
 */
export function ComparePhilosophies(): React.ReactElement {
  const dhiAccent = accentAt(1);
  const csAccent = accentAt(0);

  return (
    <Section
      data-section="ComparePhilosophies"
      padding="lg"
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #10123E 0%, #151021 100%)" }}
      aria-labelledby="compare-philosophies-title"
    >
      <ThreadStyles />
      <Glow color="rgba(169,116,255,0.2)" size="min(720px, 50%)" left="50%" top="-22%" />

      <Container className="relative">
        <Reveal header>
          <div className="mx-auto max-w-[760px] text-center">
            <h2
              id="compare-philosophies-title"
              className="font-display text-white"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
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

        <div className="relative mt-14 grid gap-14 lg:mt-20 lg:grid-cols-2 lg:gap-0">
          {/* Vertical thread between the two philosophies. */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 hidden w-[2px] select-none overflow-hidden rounded-full lg:block"
            style={{
              top: 0,
              bottom: 0,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0), rgba(169,116,255,0.4) 30%, rgba(91,155,255,0.4) 70%, rgba(255,255,255,0))",
            }}
          >
            <div className="cmp-thread-pulse-v absolute inset-0" />
          </span>

          <div className="lg:pr-14 xl:pr-20">
            <Reveal>
              <GemColumn
                icon="image"
                accent={dhiAccent}
                title={PHILOSOPHY_DHI.name}
                showDivider={false}
                size={76}
              />
            </Reveal>
            <Reveal delay={0.08}>
              <p
                className="mx-auto mt-7 max-w-[46ch] text-center text-white/76"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-body)",
                  lineHeight: 1.6,
                  letterSpacing: "-0.01em",
                }}
              >
                {PHILOSOPHY_DHI.lead}
              </p>
            </Reveal>
            <RevealStagger className="mx-auto mt-7 grid max-w-[520px] grid-cols-1 gap-x-9 gap-y-0 sm:grid-cols-2">
              {PHILOSOPHY_DHI.items.map((item) => (
                <RevealItem key={item}>
                  <div
                    className="flex items-center gap-3"
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.14)",
                      paddingTop: "clamp(10px, 0.9vw, 13px)",
                      paddingBottom: "clamp(10px, 0.9vw, 13px)",
                    }}
                  >
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: dhiAccent.dark }}
                    />
                    <span
                      className="text-white/90"
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--fs-body-sm)",
                        lineHeight: 1.4,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {item}
                    </span>
                  </div>
                </RevealItem>
              ))}
            </RevealStagger>
            <Reveal delay={0.12}>
              <p
                className="mx-auto mt-7 max-w-[44ch] text-center text-white/60"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-body-sm)",
                  lineHeight: 1.55,
                  letterSpacing: "-0.01em",
                }}
              >
                {PHILOSOPHY_DHI.close}
              </p>
            </Reveal>
          </div>

          <div className="lg:pl-14 xl:pl-20">
            <Reveal delay={0.06}>
              <GemColumn
                icon="build"
                accent={csAccent}
                title={PHILOSOPHY_CLEANSTART.name}
                showDivider={false}
                size={76}
              />
            </Reveal>
            <Reveal delay={0.12} className="mt-7 flex flex-col gap-4">
              {PHILOSOPHY_CLEANSTART.body.map((text, index) => (
                <p
                  key={text}
                  className="mx-auto max-w-[48ch] text-center"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize:
                      index === 0 ? "var(--fs-lead-sm)" : "var(--fs-body)",
                    fontWeight: index === 0 ? 500 : 400,
                    lineHeight: index === 0 ? 1.45 : 1.6,
                    letterSpacing: "-0.01em",
                    color:
                      index === 0 ? "#ffffff" : "rgba(255,255,255,0.76)",
                    textWrap: "pretty",
                  }}
                >
                  {text}
                </p>
              ))}
            </Reveal>
          </div>
        </div>
      </Container>
    </Section>
  );
}
