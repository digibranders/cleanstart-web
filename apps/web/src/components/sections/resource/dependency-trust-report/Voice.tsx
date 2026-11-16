import Image from "next/image";
import type { CSSProperties } from "react";

import { Container, Section } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";

import { GradientTitle } from "../dependency-trust/parts";
import { VOICE } from "./content";
import { InView } from "./InView";
import { Spotlight } from "./Spotlight";
import styles from "./voice.module.css";

const WORDS = VOICE.quote.split(" ");
const HIGHLIGHT_FROM = WORDS.length - VOICE.highlight.split(" ").length;

/** Entry timing in ms, matched to `voice.module.css`: words start at 650ms, 34ms apart. */
const WORDS_START = 650;
const WORD_STEP = 34;
const HIGHLIGHT_DELAY = WORDS_START + WORDS.length * WORD_STEP + 250;
const META_DELAY = HIGHLIGHT_DELAY + 500;

const RINGS = [64, 92, 122] as const;

function Word({ word, index }: { word: string; index: number }): React.ReactElement {
  return (
    <span className={styles.word} style={{ "--i": index } as CSSProperties}>
      {word}
    </span>
  );
}

/** The quote, word by word, with its closing words inside one highlighter span. */
function QuoteWords(): React.ReactElement {
  const lead = WORDS.slice(0, HIGHLIGHT_FROM);
  const close = WORDS.slice(HIGHLIGHT_FROM);
  return (
    <>
      {lead.map((word, index) => (
        <span key={`${word}-${index}`}>
          <Word word={word} index={index} />{" "}
        </span>
      ))}
      <span className={styles.highlight} style={{ "--hl-delay": `${HIGHLIGHT_DELAY}ms` } as CSSProperties}>
        {close.map((word, offset) => (
          <span key={`${word}-${offset}`}>
            <Word word={word} index={HIGHLIGHT_FROM + offset} />
            {offset < close.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    </>
  );
}

/**
 * The CEO's quote, the page's main moment: the CEO stands in a pool of light on
 * a dark stage, and the quote lands beside him word by word, its closing words
 * swept with a highlighter. The entry plays once (see `voice.module.css`).
 */
export function Voice(): React.ReactElement {
  return (
    <Section padding="md" data-section="ReportVoice" className="bg-white">
      <Container>
        <Reveal header>
          <GradientTitle text={VOICE.heading} accent={VOICE.accent} align="left" />
        </Reveal>

        <InView className={`${styles.root} mt-8 lg:mt-10`}>
          <figure className={styles.card}>
            <Spotlight className={styles.spot} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              aria-hidden
              src="/images/cleanstart-images/hero-vector-grid.svg"
              alt=""
              className="pointer-events-none absolute -right-[20%] top-0 h-full w-auto max-w-none select-none opacity-30"
              loading="lazy"
              decoding="async"
            />

            <div className="relative grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <div className="relative flex h-[300px] items-end justify-center overflow-hidden sm:h-[360px] lg:h-auto lg:min-h-[540px]">
                <span aria-hidden className={styles.halo} />
                {RINGS.map((size, index) => (
                  <span
                    key={size}
                    aria-hidden
                    className={styles.ring}
                    style={{ width: `${size}%`, "--r": index } as CSSProperties}
                  />
                ))}
                <Image
                  src={VOICE.photo}
                  alt={`${VOICE.name}, ${VOICE.role}`}
                  width={1000}
                  height={1206}
                  sizes="(min-width: 1024px) 400px, 260px"
                  className={`${styles.portrait} w-[230px] sm:w-[280px] lg:w-[min(400px,84%)]`}
                />
              </div>

              <div className="relative flex flex-col justify-center px-6 pb-10 sm:px-10 lg:py-16 lg:pl-2 lg:pr-16">
                <span aria-hidden className={styles.mark}>
                  {"“"}
                </span>
                <blockquote className="mt-6 lg:mt-8">
                  <p className={`${styles.quote} max-w-[30ch]`}>
                    <QuoteWords />
                  </p>
                </blockquote>
                <figcaption
                  className={`${styles.meta} mt-8 lg:mt-10`}
                  style={{ "--meta-delay": `${META_DELAY}ms` } as CSSProperties}
                >
                  <span
                    className="block text-white"
                    style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h4)", fontWeight: 600, letterSpacing: "-0.02em" }}
                  >
                    {VOICE.name}
                  </span>
                  <span
                    className="mt-1 block text-white/70"
                    style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body-sm)" }}
                  >
                    {VOICE.role}
                  </span>
                </figcaption>
              </div>
            </div>
          </figure>
        </InView>
      </Container>
    </Section>
  );
}
