import Image from "next/image";
import type { CSSProperties } from "react";

import { Container, Section } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";

import { GradientTitle } from "../dependency-trust/parts";
import { VOICE } from "./content";
import styles from "./voice.module.css";

const MARK: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "clamp(64px, 7vw, 100px)",
  fontWeight: 700,
  lineHeight: 0.7,
  background: "linear-gradient(160deg, #9A51FF 0%, #2CC1EB 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

const WORDS = VOICE.quote.split(" ");

/**
 * The leadership quote, set as the page's one typographic moment, followed by
 * the note on where the research comes from.
 */
export function Voice(): React.ReactElement {
  return (
    <Section padding="md" data-section="ReportVoice" className="bg-white">
      <Container>
        <Reveal header>
          <GradientTitle text={VOICE.heading} accent={VOICE.accent} align="left" />
        </Reveal>

        <figure className="mt-8 grid gap-3 lg:mt-10 lg:grid-cols-[auto_1fr] lg:gap-8">
          <span aria-hidden className="select-none" style={MARK}>
            {"“"}
          </span>
          <div>
            <blockquote>
              <p
                className="max-w-[40ch]"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "calc(var(--fs-h2) * 0.7)",
                  fontWeight: 600,
                  letterSpacing: "-0.035em",
                  lineHeight: 1.2,
                  textWrap: "pretty",
                }}
              >
                {WORDS.map((word, index) => (
                  <span key={`${word}-${index}`} className={styles.word}>
                    {word}{" "}
                  </span>
                ))}
              </p>
            </blockquote>
            <figcaption className="mt-7 flex items-center gap-4">
              <Image
                src={VOICE.photo}
                alt=""
                width={64}
                height={64}
                sizes="64px"
                className="h-16 w-16 rounded-full object-cover ring-1 ring-black/10"
              />
              <span className="flex flex-col">
                <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h5)", fontWeight: 600, letterSpacing: "-0.02em", color: "#111" }}>
                  {VOICE.name}
                </span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body-sm)", color: "rgba(17,17,17,0.7)" }}>
                  {VOICE.role}
                </span>
              </span>
            </figcaption>
          </div>
        </figure>

      </Container>
    </Section>
  );
}
