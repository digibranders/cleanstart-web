import type React from 'react';
import Image from 'next/image';
import { ArrowUp, ChevronRight } from 'lucide-react';
import { Container, Section } from '@/components/layout';
import { Reveal } from '@/components/ui/Reveal';
import { H2_STYLE } from './type';

/*
 * "How It Works": four stages on one rail, closed into a loop.
 *
 * One packet runs the rail left to right and each station lights as it
 * arrives (a 9s cycle: the packet takes 6s, so stations light at 0, 2, 4 and
 * 6s). The last 3s belong to the return path: a dashed bracket under the row
 * carries a second packet from Continuous Updates back to Hardened Images,
 * which is the point of the last stage. All motion is CSS keyframes on
 * transform and opacity; positions use container-query units, so the packet
 * travels the rail's own width at any viewport.
 *
 * The brief gives titles only, so the stations carry no body copy. Below lg the
 * stations stack as rows on a vertical rail, with no packet and no bracket;
 * each station still lights in turn.
 */

interface Stage {
  title: string;
  image: string;
  alt: string;
}

const STAGES: readonly [Stage, Stage, Stage, Stage] = [
  {
    title: 'Hardened Images',
    image: '/images/compare/icon-fips.webp',
    alt: '3D icon of a shield with a rosette',
  },
  {
    title: 'Component Visibility',
    image: '/images/telecom/journey/discover-lens.webp',
    alt: '3D icon of a magnifying glass',
  },
  {
    title: 'Verified Builds',
    image: '/images/compare/icon-signed-artifact.webp',
    alt: '3D icon of a signed and sealed artifact',
  },
  {
    title: 'Continuous Updates',
    image: '/images/telecom/journey/gear.webp',
    alt: '3D icon of a gear',
  },
];

const DASHES =
  'repeating-linear-gradient(90deg, rgba(124,79,240,0.55) 0 6px, rgba(124,79,240,0) 6px 12px)';

export function PqcHowItWorks(): React.ReactElement {
  return (
    <Section data-section="PqcHowItWorks" className="overflow-hidden" style={{ background: '#EFEDF7' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/enterprise-union.svg"
        alt=""
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          left: '-218px',
          bottom: '-190px',
          width: '488px',
          height: '496px',
          transform: 'rotate(141.39deg) scaleY(-1)',
        }}
        loading="lazy"
        decoding="async"
      />

      <Container className="relative">
        <Reveal header className="text-center">
          <h2 style={{ ...H2_STYLE, color: '#111111' }}>
            How It <span className="cs-text-gradient-impact">Works</span>
          </h2>
        </Reveal>

        <Reveal delay={0.12} y={24}>
          <div
            className="relative mx-auto max-w-[1100px] [--disc:96px] lg:[--disc:clamp(112px,10.5vw,148px)]"
            style={{ marginTop: 'clamp(44px, 5vw, 72px)' }}
          >
            {/* Desktop rail, behind the discs: track, flowing dashes, chevrons, packet. */}
            <div
              aria-hidden
              className="pointer-events-none absolute hidden lg:block"
              style={{ left: '12.5%', right: '12.5%', top: 'calc(var(--disc) / 2)' }}
            >
              <span
                className="absolute inset-x-0 top-0 h-[2px] -translate-y-1/2 rounded-full"
                style={{ background: 'linear-gradient(90deg, rgba(124,79,240,0.20), rgba(44,193,235,0.34))' }}
              />
              <span className="absolute inset-x-0 top-0 h-[2px] -translate-y-1/2 overflow-hidden rounded-full">
                <span
                  className="cs-tj-link-flow absolute inset-y-0 -left-3 right-0"
                  style={{ background: DASHES }}
                />
              </span>
              {['16.666%', '50%', '83.333%'].map((left) => (
                <ChevronRight
                  key={left}
                  size={16}
                  strokeWidth={2.25}
                  className="absolute top-0 -translate-x-1/2 -translate-y-1/2"
                  style={{ left, color: '#7C4FF0' }}
                />
              ))}
              <div className="absolute inset-x-0 top-0 h-0" style={{ containerType: 'inline-size' }}>
                <span
                  className="cs-pqc-packet absolute left-0 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, #FFFFFF 0%, #6EC8FF 45%, #7C4FF0 100%)',
                    boxShadow: '0 0 14px 4px rgba(110,200,255,0.55)',
                  }}
                />
              </div>
            </div>

            {/* Mobile rail, behind the discs. */}
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-[calc(var(--disc)/2)] top-[calc(var(--disc)/2)] w-[2px] -translate-x-1/2 lg:hidden"
              style={{
                left: 'calc(var(--disc) / 2)',
                background:
                  'repeating-linear-gradient(180deg, rgba(124,79,240,0.5) 0 6px, rgba(124,79,240,0) 6px 12px)',
              }}
            />

            <ol className="relative m-0 grid list-none grid-cols-1 gap-8 p-0 lg:grid-cols-4 lg:gap-0">
              {STAGES.map((stage, i) => (
                <li
                  key={stage.title}
                  className="flex items-center gap-5 lg:flex-col lg:gap-0 lg:text-center"
                >
                  <div
                    className="cs-pqc-disc relative z-[1] flex shrink-0 items-center justify-center rounded-full"
                    style={
                      {
                        width: 'var(--disc)',
                        height: 'var(--disc)',
                        '--d': `${i * 2}s`,
                        background:
                          'radial-gradient(closest-side, #FFFFFF 0%, #F6F2FF 72%, #EBE4FB 100%)',
                        border: '1px solid rgba(154,81,255,0.2)',
                        boxShadow:
                          '0 26px 44px -26px rgba(60,30,150,0.4), inset 0 0 0 7px rgba(255,255,255,0.75)',
                      } as React.CSSProperties
                    }
                  >
                    <div className="relative h-[62%] w-[62%]">
                      <Image
                        src={stage.image}
                        alt={stage.alt}
                        fill
                        sizes="96px"
                        className="object-contain"
                        style={{ filter: 'drop-shadow(0 8px 12px rgba(40,20,90,0.2))' }}
                      />
                    </div>
                  </div>
                  <h3
                    className="lg:mt-7"
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--fs-h4)',
                      fontWeight: 600,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.25,
                      color: '#111111',
                    }}
                  >
                    {stage.title}
                  </h3>
                </li>
              ))}
            </ol>

            {/* Return path: Continuous Updates feeds back into Hardened Images. */}
            <div
              aria-hidden
              className="pointer-events-none relative mx-auto hidden lg:block"
              style={{
                width: '75%',
                height: 'clamp(36px, 3.4vw, 50px)',
                marginTop: '22px',
                containerType: 'inline-size',
              }}
            >
              <span
                className="absolute inset-0"
                style={{
                  border: '1.5px dashed rgba(124,79,240,0.4)',
                  borderTop: 'none',
                  borderRadius: '0 0 26px 26px',
                }}
              />
              <ArrowUp
                size={16}
                strokeWidth={2.25}
                className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"
                style={{ color: '#7C4FF0' }}
              />
              <span
                className="cs-pqc-return absolute bottom-0 right-0 h-3 w-3 translate-x-1/2 translate-y-1/2 rounded-full"
                style={{
                  background: 'radial-gradient(circle, #FFFFFF 0%, #6EC8FF 45%, #7C4FF0 100%)',
                  boxShadow: '0 0 14px 4px rgba(110,200,255,0.55)',
                }}
              />
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
