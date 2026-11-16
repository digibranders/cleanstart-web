import type React from 'react';
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
 * first problem names. The stack is composed from the site's existing slab
 * renders (the telecom journey's), each floating on its own delay, with a line
 * of light running down through all of them.
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
  { src: '/images/telecom/journey/standardize-tile.webp', top: '43%', width: '60%', delay: '-1.4s' },
  { src: '/images/telecom/journey/standardize-tile.webp', top: '56%', width: '64%', delay: '-2.8s' },
  { src: '/images/telecom/journey/standardize-base.webp', top: '68%', width: '70%', delay: '-4.2s' },
] as const;

function DependencyStack(): React.ReactElement {
  return (
    <div aria-hidden className="absolute inset-0">
      <span
        className="absolute left-1/2 top-[22%] bottom-[9%] w-[2px] -translate-x-1/2 rounded-full"
        style={{
          background: 'linear-gradient(180deg, rgba(44,193,235,0) 0%, #6EC8FF 30%, #9A51FF 100%)',
          boxShadow: '0 0 18px 2px rgba(110,200,255,0.45)',
        }}
      />
      {SLABS.map((slab) => (
        <div
          key={slab.top}
          className="cs-pqc-float absolute left-1/2 aspect-[379/199] -translate-x-1/2"
          style={{ top: slab.top, width: slab.width, animationDelay: slab.delay }}
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
      ))}
      <div className="cs-pqc-float absolute left-1/2 top-[-5%] aspect-square w-[78%] -translate-x-1/2">
        <Image
          src="/images/pqc/hero-lock.webp"
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
                className="relative mx-auto mt-8 aspect-[4/4.2] w-full max-w-[460px] overflow-hidden lg:mx-0 lg:mt-10"
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

          <ol className="m-0 list-none p-0">
            {CHALLENGES.map(({ Icon, title, body }, i) => {
              const last = i === CHALLENGES.length - 1;
              return (
                <li key={title} className="cs-pqc-row flex gap-5 sm:gap-7">
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
