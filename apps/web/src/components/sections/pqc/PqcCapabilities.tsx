import type React from 'react';
import Image from 'next/image';
import { Container, Section } from '@/components/layout';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';
import { BODY_STYLE, H2_STYLE } from './type';

/*
 * "PQC Capabilities": four capabilities as a bento with exactly four cells.
 * Post-Quantum Algorithms is the claim the page is about, so it takes the tall
 * dark cell and sets its sentence large; the algorithm names carry the brand
 * gradient. The other three are lighter cells of different surfaces (white
 * hairline, soft violet, cyan ring) so the grid has rhythm rather than four
 * matching boxes. Below lg the cells stack in the same order.
 *
 * The footnote is the brief's and stays under the grid, small, because it
 * qualifies all four cells.
 *
 * Copy is the brief's, verbatim.
 */

const CARD_RADIUS = '24px';

const CARD_BASE: React.CSSProperties = {
  borderRadius: CARD_RADIUS,
  transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 300ms ease',
};

function CardTitle({ children, color }: { children: React.ReactNode; color: string }): React.ReactElement {
  return (
    <h3
      style={{
        margin: 0,
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--fs-h4)',
        fontWeight: 600,
        letterSpacing: '-0.03em',
        lineHeight: 1.25,
        color,
      }}
    >
      {children}
    </h3>
  );
}

export function PqcCapabilities(): React.ReactElement {
  return (
    <Section data-section="PqcCapabilities" className="overflow-hidden bg-white">
      <Container className="relative">
        <Reveal header className="text-center">
          <h2 style={{ ...H2_STYLE, color: '#111111' }}>
            PQC <span className="cs-text-gradient-impact">Capabilities</span>
          </h2>
        </Reveal>

        <RevealStagger
          className="mx-auto grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_1fr_1fr] lg:grid-rows-2 lg:gap-4"
          style={{ marginTop: 'clamp(28px, 3vw, 44px)', maxWidth: '1120px' }}
        >
          {/* Post-Quantum Algorithms: the tall dark cell. */}
          <RevealItem className="lg:row-span-2">
            <article
              className="group relative flex h-full min-h-[300px] flex-col justify-between overflow-hidden hover:-translate-y-1"
              style={{
                ...CARD_BASE,
                background: 'linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)',
                padding: 'clamp(24px, 2.4vw, 32px)',
                boxShadow: '0 28px 56px -40px rgba(40,20,120,0.65)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                aria-hidden
                src="/images/ciso/outcomes-vector-corner.svg"
                alt=""
                className="pointer-events-none absolute -bottom-28 -right-28 w-[440px] select-none opacity-30"
                loading="lazy"
                decoding="async"
              />
              <div className="relative">
                <CardTitle color="#FFFFFF">Post-Quantum Algorithms</CardTitle>
                <p
                  style={{
                    margin: 'clamp(10px, 1.2vw, 16px) 0 0',
                    maxWidth: '14em',
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--fs-h3)',
                    fontWeight: 500,
                    letterSpacing: '-0.035em',
                    lineHeight: 1.12,
                    color: 'rgba(255,255,255,0.88)',
                  }}
                >
                  <span className="cs-text-gradient-impact">ML-KEM</span>,{' '}
                  <span className="cs-text-gradient-impact">ML-DSA</span> and{' '}
                  <span className="cs-text-gradient-impact">SLH-DSA</span> support.
                </p>
              </div>
              <div className="relative mt-4 flex justify-end">
                <div className="cs-pqc-float relative -mb-3 h-[clamp(150px,15vw,210px)] w-[clamp(150px,15vw,210px)]">
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-1/2 aspect-square w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      background:
                        'radial-gradient(closest-side, rgba(154,81,255,0.45) 0%, rgba(154,81,255,0) 100%)',
                    }}
                  />
                  <Image
                    src="/images/attack-surface-reduction/approach-icon-secure.webp"
                    alt="3D icon of a padlock with a gear"
                    fill
                    sizes="210px"
                    className="object-contain"
                    style={{ filter: 'drop-shadow(0 18px 24px rgba(10,5,40,0.5))' }}
                  />
                </div>
              </div>
            </article>
          </RevealItem>

          {/* Cryptographic Libraries: wide, white, hairline. */}
          <RevealItem className="lg:col-span-2">
            <article
              className="group flex h-full items-center justify-between gap-6 hover:-translate-y-1"
              style={{
                ...CARD_BASE,
                background: '#FFFFFF',
                border: '1px solid rgba(154,81,255,0.18)',
                padding: 'clamp(20px, 2vw, 28px)',
                boxShadow: '0 4px 24px -4px rgba(40,30,90,0.04), 0 20px 48px -12px rgba(40,30,90,0.08)',
              }}
            >
              <div className="min-w-0">
                <CardTitle color="#111111">Cryptographic Libraries</CardTitle>
                <p style={{ ...BODY_STYLE, marginTop: '6px', maxWidth: '26ch', color: 'rgba(17,17,17,0.68)' }}>
                  Validated open source libraries and versions
                </p>
              </div>
              <div className="relative h-[clamp(88px,8vw,116px)] w-[clamp(88px,8vw,116px)] shrink-0 transition-transform duration-300 group-hover:-translate-y-1">
                <Image
                  src="/images/telecom/icon-open-source.webp"
                  alt="3D icon of a code bracket on a platform"
                  fill
                  sizes="116px"
                  className="object-contain"
                  style={{ filter: 'drop-shadow(0 10px 16px rgba(40,20,90,0.18))' }}
                />
              </div>
            </article>
          </RevealItem>

          {/* Runtime & Protocol Support: soft violet. */}
          <RevealItem>
            <article
              className="group flex h-full flex-col hover:-translate-y-1"
              style={{
                ...CARD_BASE,
                background: 'linear-gradient(135deg, #F3F0FF 0%, #EEF4FF 100%)',
                border: '1px solid rgba(154,81,255,0.14)',
                padding: 'clamp(20px, 2vw, 26px)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="relative h-[48px] w-[48px] shrink-0 transition-transform duration-300 group-hover:-translate-y-1">
                  <Image
                    src="/images/telecom/icon-cloud-native.webp"
                    alt="3D icon of a cloud joined to a network"
                    fill
                    sizes="48px"
                    className="object-contain object-left"
                    style={{ filter: 'drop-shadow(0 10px 14px rgba(40,20,90,0.18))' }}
                  />
                </div>
                <CardTitle color="#111111">Runtime &amp; Protocol Support</CardTitle>
              </div>
              <p style={{ ...BODY_STYLE, marginTop: '6px', color: 'rgba(17,17,17,0.68)' }}>
                Supported runtimes and TLS with hybrid key exchange.
              </p>
            </article>
          </RevealItem>

          {/* Technical Evidence: cyan ring. */}
          <RevealItem>
            <article
              className="group flex h-full flex-col hover:-translate-y-1"
              style={{
                ...CARD_BASE,
                background: '#FFFFFF',
                border: '1.5px solid rgba(44,193,235,0.42)',
                padding: 'clamp(20px, 2vw, 26px)',
                boxShadow: '0 24px 48px -30px rgba(44,193,235,0.5)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="relative h-[48px] w-[48px] shrink-0 transition-transform duration-300 group-hover:-translate-y-1">
                  <Image
                    src="/images/compare/icon-sbom.webp"
                    alt="3D icon of a document with component cubes"
                    fill
                    sizes="48px"
                    className="object-contain object-left"
                    style={{ filter: 'drop-shadow(0 10px 14px rgba(40,20,90,0.18))' }}
                  />
                </div>
                <CardTitle color="#111111">Technical Evidence</CardTitle>
              </div>
              <p style={{ ...BODY_STYLE, marginTop: '6px', color: 'rgba(17,17,17,0.68)' }}>
                SBOMs, CBOMs, build provenance and test results
              </p>
            </article>
          </RevealItem>
        </RevealStagger>

        <Reveal delay={0.1} y={12}>
          <p
            style={{
              ...BODY_STYLE,
              margin: 'clamp(16px, 1.8vw, 24px) auto 0',
              textAlign: 'center',
              fontSize: 'var(--fs-body-sm)',
              fontStyle: 'italic',
              color: 'rgba(17,17,17,0.6)',
            }}
          >
            Technical support varies by image, library and configuration.
          </p>
        </Reveal>
      </Container>
    </Section>
  );
}
