'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { Boxes, FileClock, Network, RefreshCw } from 'lucide-react';
import { Container, Section } from '@/components/layout';
import { Reveal } from '@/components/ui/Reveal';
import { BODY_STYLE, H2_STYLE } from './type';

/*
 * "The PQC Challenge": four problems that compound, so they are drawn as one
 * chain rather than four equal cards. Each problem hangs off a rail; as a row
 * scrolls into view its tile, its text and the rail segment above the next
 * tile light up in turn. The motion is CSS scroll-driven animation (see
 * .cs-pqc-row in globals.css), so it costs no JS, and where the browser lacks
 * it, or the visitor prefers reduced motion, every row simply stays lit.
 *
 * The left column sticks while the chain scrolls past: a dark card holding a
 * stack of glass slabs under the page's padlock cube, the dependency layers the
 * first problem names. The stack answers whichever problem is at the middle of
 * the viewport: it carries a signal down through its layers (dependencies),
 * the lower layers turn amber (legacy), the layers pull apart and are joined by
 * dashed links (migration), then each layer is refreshed in turn (adaptation).
 * No text is added; the state change is the only message. Slabs are the telecom
 * journey's existing renders, each floating on its own delay.
 *
 * Line icons in violet tiles, as in TelecomRisks: these are hazards, and
 * drawing them as the glossy 3D objects used for the solution would make them
 * read as products.
 *
 * Copy is the brief's, verbatim.
 */

interface Challenge {
  Icon: LucideIcon;
  title: string;
  body: string;
}

const CHALLENGES: readonly [Challenge, Challenge, Challenge, Challenge] = [
  {
    Icon: Boxes,
    title: 'Cryptographic Dependencies',
    body: 'Applications inherit cryptographic capabilities from underlying libraries and components.',
  },
  {
    Icon: FileClock,
    title: 'Legacy Software',
    body: 'Older libraries and runtimes may lack support for post-quantum algorithms.',
  },
  {
    Icon: Network,
    title: 'Migration Complexity',
    body: 'Identifying and updating cryptographic dependencies across environments is challenging.',
  },
  {
    Icon: RefreshCw,
    title: 'Continuous Adaptation',
    body: 'Cryptographic standards evolve. Your software foundations must keep pace.',
  },
];

const SLABS = [
  { src: '/images/telecom/journey/standardize-tile.webp', top: '43%', width: '60%', delay: '-1.4s', side: -1 },
  { src: '/images/telecom/journey/standardize-tile.webp', top: '56%', width: '64%', delay: '-2.8s', side: 1 },
  { src: '/images/telecom/journey/standardize-base.webp', top: '68%', width: '70%', delay: '-4.2s', side: -1 },
] as const;

function DependencyStack(): React.ReactElement {
  return (
    <div aria-hidden className="absolute inset-0">
      <span className="cs-pqc-ch-ring" />

      <span className="cs-pqc-ch-beam cs-pqc-ch-beam-a" />
      <span className="cs-pqc-ch-beam cs-pqc-ch-beam-b" />
      <span className="cs-pqc-ch-packet" />

      {SLABS.map((slab, i) => (
        <div
          key={slab.top}
          className="cs-pqc-float absolute left-1/2 aspect-[379/199] -translate-x-1/2"
          style={{ top: slab.top, width: slab.width, animationDelay: slab.delay }}
        >
          <div
            className="cs-pqc-ch-slab absolute inset-0"
            data-layer={i}
            style={{ '--i': i, '--side': slab.side } as React.CSSProperties}
          >
            <Image
              src={slab.src}
              alt=""
              fill
              sizes="(min-width: 1024px) 24vw, 70vw"
              className="object-contain"
              style={{ filter: 'drop-shadow(0 14px 18px rgba(10,5,40,0.45))' }}
            />
          </div>
        </div>
      ))}

      <svg className="cs-pqc-ch-links" viewBox="0 0 100 105" preserveAspectRatio="xMidYMid meet" fill="none">
        <path d="M44 61 L56 76 L44 90" />
        <circle cx="44" cy="61" r="1.6" />
        <circle cx="56" cy="76" r="1.6" />
        <circle cx="44" cy="90" r="1.6" />
      </svg>

      <div className="cs-pqc-float absolute left-1/2 top-[-6%] aspect-square w-[70%] -translate-x-1/2">
        <Image
          src="/images/pqc/challenge-components.webp"
          alt=""
          fill
          sizes="(min-width: 1024px) 24vw, 70vw"
          className="object-contain"
        />
      </div>
    </div>
  );
}

export function PqcChallenge(): React.ReactElement {
  const listRef = useRef<HTMLOListElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setStep(Number((entry.target as HTMLElement).dataset.step ?? 0));
        }
      },
      { rootMargin: '-42% 0px -42% 0px' },
    );
    for (const row of list.querySelectorAll('li')) observer.observe(row);
    return () => observer.disconnect();
  }, []);

  return (
    <Section data-section="PqcChallenge" className="overflow-hidden bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/for-developers/why/deco-union-right.svg"
        alt=""
        className="pointer-events-none absolute -right-24 top-0 hidden select-none opacity-70 lg:block"
        loading="lazy"
        decoding="async"
      />

      <Container className="relative">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-[clamp(40px,5vw,80px)]">
          <div className="lg:sticky lg:top-[128px] lg:self-start">
            <Reveal header>
              <h2 style={{ ...H2_STYLE, color: '#111111' }}>
                The PQC <span className="cs-text-gradient-impact">Challenge</span>
              </h2>
            </Reveal>

            <Reveal delay={0.12} y={24}>
              <div
                data-step={step}
                className="cs-pqc-ch-stage relative mx-auto mt-8 aspect-[4/4.2] w-full max-w-[460px] overflow-hidden lg:mx-0 lg:mt-10"
                style={{
                  borderRadius: '28px',
                  background: 'linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)',
                  boxShadow: '0 40px 80px -48px rgba(40,20,120,0.6)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  aria-hidden
                  src="/images/cleanstart-images/hero-vector-grid.svg"
                  alt=""
                  className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover opacity-60"
                  loading="lazy"
                  decoding="async"
                />
                <DependencyStack />
              </div>
            </Reveal>
          </div>

          <ol ref={listRef} className="m-0 list-none p-0">
            {CHALLENGES.map(({ Icon, title, body }, i) => {
              const last = i === CHALLENGES.length - 1;
              return (
                <li key={title} data-step={i} className="cs-pqc-row flex gap-5 sm:gap-7">
                  <div className="flex shrink-0 flex-col items-center">
                    <span
                      aria-hidden
                      className="cs-pqc-tile flex items-center justify-center"
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: 'linear-gradient(180deg, #FFFFFF 0%, #F6F2FF 100%)',
                        border: '1px solid rgba(154,81,255,0.22)',
                        boxShadow: '0 10px 24px -14px rgba(76,40,170,0.5)',
                        color: '#7C4FF0',
                      }}
                    >
                      <Icon size={26} strokeWidth={1.75} />
                    </span>
                    {last ? null : (
                      <span
                        aria-hidden
                        className="my-2 w-[2px] flex-1 overflow-hidden rounded-full"
                        style={{ background: 'rgba(124,79,240,0.14)' }}
                      >
                        <span
                          className="cs-pqc-seg block h-full w-full"
                          style={{ background: 'linear-gradient(180deg, #7C4FF0 0%, #2CC1EB 100%)' }}
                        />
                      </span>
                    )}
                  </div>

                  <div style={{ paddingBottom: last ? 0 : 'clamp(36px, 4vw, 60px)' }}>
                    <h3
                      style={{
                        margin: 0,
                        fontFamily: 'var(--font-display)',
                        fontSize: 'var(--fs-h3)',
                        fontWeight: 600,
                        letterSpacing: '-0.035em',
                        lineHeight: 1.2,
                        color: '#111111',
                      }}
                    >
                      {title}
                    </h3>
                    <p style={{ ...BODY_STYLE, marginTop: '10px', maxWidth: '44ch', color: 'rgba(17,17,17,0.68)' }}>
                      {body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </Container>
    </Section>
  );
}
