import Image from "next/image";
import { Section, Container } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { SOCIAL_PROOF } from "./compare-data";
import { RULE } from "./compare-editorial";

/**
 * Third-party credentials, sitting in the slot the SEO review marked with an
 * empty placeholder heading and the note "Social proof is missing".
 *
 * Position is the whole point: it lands immediately after the capability table,
 * where the reader has just seen both vendors tick nearly every row and the
 * honest answer to "so why you?" has to be evidence rather than another claim.
 *
 * Badges only — no customer names, logos, or testimonials. Nothing here is a new
 * claim; every credential is already published in the site footer.
 */
export function CompareSocialProof(): React.ReactElement {
  return (
    <Section
      data-section="CompareSocialProof"
      padding="md"
      className="bg-[#f7f7f7]"
      aria-labelledby="compare-social-proof-title"
    >
      <Container>
        <Reveal header>
          <h2
            id="compare-social-proof-title"
            className="font-display text-[#111111]"
            style={{
              fontSize: "var(--fs-h3)",
              fontWeight: 600,
              letterSpacing: "var(--fs-h3-ls)",
              lineHeight: "var(--fs-h3-lh)",
              maxWidth: "22ch",
              textWrap: "balance",
            }}
          >
            {SOCIAL_PROOF.heading}
          </h2>
          <p
            className="mt-4 text-[#4A4A4A]"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-body)",
              lineHeight: 1.6,
              letterSpacing: "-0.01em",
              maxWidth: "58ch",
              textWrap: "pretty",
            }}
          >
            {SOCIAL_PROOF.lead}
          </p>
        </Reveal>

        <RevealStagger
          className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4"
          style={{ borderTop: RULE, paddingTop: "clamp(24px, 2.2vw, 36px)" }}
        >
          {SOCIAL_PROOF.credentials.map((credential) => (
            <RevealItem key={credential.name}>
              <div className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
                {/*
                 * Dark tile for every badge, not just the Docker one: the
                 * verified-publisher mark is white line art and vanishes on a
                 * light band, and tinting a single tile would read as an error.
                 */}
                <div className="flex h-[112px] w-full max-w-[168px] items-center justify-center rounded-2xl bg-[#151021] px-5">
                  <Image
                    src={credential.src}
                    alt={credential.name}
                    width={credential.w}
                    height={credential.h}
                    sizes="72px"
                    className="max-h-[72px] w-auto object-contain"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span
                    className="text-[#767676]"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-caption)",
                      fontWeight: 500,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {credential.label}
                  </span>
                  <span
                    className="text-[#111111]"
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
      </Container>
    </Section>
  );
}
