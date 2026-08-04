import Image from "next/image";
import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import { SOCIAL_PROOF } from "./compare-data";
import { WASH_LIGHT } from "./compare-visuals";

/**
 * The plaque uses a shallower ramp than the page's `BAND_DARK`. That token runs
 * #151021 → #131E8F → #471EC0 across a full-height section; compressed into a
 * ~240px panel the same three stops read as a gradient smear rather than as a
 * dark ground.
 */
const PLAQUE_DARK =
  "linear-gradient(135deg, #12101F 0%, #191545 55%, #241A6B 100%)";

/**
 * Third-party credentials, in the slot the SEO review marked with an empty
 * placeholder heading and the note "Social proof is missing" (2026-07-30).
 *
 * Position is the whole point: it lands immediately after the capability table,
 * where the reader has just seen both vendors tick nearly every row and the
 * honest answer to "so why you?" has to be evidence rather than another claim.
 *
 * The credentials sit on ONE dark plaque rather than four separate dark tiles
 * on a light band. All four badges are transparent artwork drawn for the dark
 * footer — the Docker verified-publisher mark is white line art and disappears
 * on white — so a dark ground is required, and a single panel divided by
 * hairlines reads as a deliberate credential plate instead of four chips that
 * happen to be dark.
 *
 * Badges only — no customer names, logos, or testimonials: none are cleared for
 * use on a page that names a competitor. Nothing here is a new claim; every
 * credential is already published in the site footer.
 */
export function CompareSocialProof(): React.ReactElement {
  return (
    <Section
      data-section="CompareSocialProof"
      padding="md"
      className="relative overflow-hidden"
      style={{ background: WASH_LIGHT }}
      aria-labelledby="compare-social-proof-title"
    >
      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end lg:gap-16">
          <Reveal header>
            <h2
              id="compare-social-proof-title"
              className="font-display text-[#111111]"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                letterSpacing: "var(--fs-h2-ls)",
                lineHeight: "var(--fs-h2-lh)",
                maxWidth: "16ch",
                textWrap: "balance",
              }}
            >
              {SOCIAL_PROOF.heading}
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p
              className="text-[#3A3A3A]"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead-sm)",
                lineHeight: 1.55,
                letterSpacing: "-0.015em",
                maxWidth: "52ch",
                textWrap: "pretty",
              }}
            >
              {SOCIAL_PROOF.lead}
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.16} className="mt-10 lg:mt-12">
          <div
            className="relative overflow-hidden"
            style={{
              borderRadius: "28px",
              background: PLAQUE_DARK,
              padding: "clamp(28px, 2.8vw, 48px) clamp(20px, 2vw, 32px)",
            }}
          >
            {/* Single ambient glow, centred behind the row. */}
            <span
              aria-hidden
              className="pointer-events-none absolute select-none rounded-full"
              style={{
                left: "50%",
                top: "-40%",
                width: "min(760px, 78%)",
                aspectRatio: "1 / 1",
                transform: "translateX(-50%)",
                background:
                  "radial-gradient(closest-side, rgba(169,116,255,0.28), transparent 70%)",
              }}
            />

            <RevealStagger className="relative grid grid-cols-2 gap-y-10 sm:grid-cols-4 sm:gap-y-0">
              {SOCIAL_PROOF.credentials.map((credential, index) => (
                <RevealItem key={credential.name}>
                  <div
                    className={cn(
                      "flex h-full flex-col items-center gap-5 px-3 text-center sm:px-6",
                      "border-white/[0.14]",
                      /* Hairline between columns only — never at the start of a
                         row. The grid is 2-up below sm and 4-up from sm, so the
                         third item leads a row on mobile and only gains its
                         divider once the row widens to four. */
                      index % 2 === 1
                        ? "border-l"
                        : index > 0
                          ? "sm:border-l"
                          : "",
                    )}
                  >
                    <div className="flex h-[84px] items-center justify-center">
                      <Image
                        src={credential.src}
                        alt={credential.name}
                        width={credential.w}
                        height={credential.h}
                        sizes="84px"
                        className="max-h-[84px] w-auto object-contain"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "var(--fs-caption)",
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "#C9A6FF",
                        }}
                      >
                        {credential.label}
                      </span>
                      <span
                        className="text-white"
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "var(--fs-body-sm)",
                          fontWeight: 500,
                          lineHeight: 1.4,
                          letterSpacing: "-0.01em",
                          textWrap: "balance",
                        }}
                      >
                        {credential.name}
                      </span>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
