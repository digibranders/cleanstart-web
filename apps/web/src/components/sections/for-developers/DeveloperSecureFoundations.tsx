import type React from 'react';
import { Reveal } from '@/components/ui/Reveal';

interface PillarDef {
  title: string;
  desc: string;
}

const PILLARS: PillarDef[] = [
  {
    title: 'Drop-In Compatible',
    desc: 'Integrate with existing developer workflows and CI/CD pipelines.',
  },
  {
    title: 'Minimal Artifacts',
    desc: 'Reduce unnecessary dependencies and runtime complexity.',
  },
  {
    title: 'Continuously Rebuilt',
    desc: 'Rapidly address newly disclosed vulnerabilities and upstream changes.',
  },
  {
    title: 'Verifiable Components',
    desc: 'Built from trusted sources with reproducible build pipelines.',
  },
];

const SECTION_BG =
  'linear-gradient(to bottom, #151021 0%, #131e8f 62.497%, #471ec0 100%)';
const PILLAR_DIVIDER_V =
  'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.3) 80%, transparent 100%)';
const PILLAR_DIVIDER_H =
  'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.3) 80%, transparent 100%)';

export function DeveloperSecureFoundations(): React.ReactElement {
  return (
    <section
      data-section="DeveloperSecureFoundations"
      className="relative overflow-hidden"
      style={{ background: SECTION_BG }}
    >
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: 'calc(-423 / 1920 * 100vw)',
          top: 'calc(-303 / 1920 * 100vw)',
          width: 'calc(979 / 1920 * 100vw)',
          height: 'calc(979 / 1920 * 100vw)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/for-developers/secure/deco-vector.svg"
          alt=""
          style={{ display: 'block', width: '100%', height: '100%' }}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: 'calc(1444 / 1920 * 100vw)',
          top: 'calc(-372 / 1920 * 100vw)',
          width: 'calc(979 / 1920 * 100vw)',
          height: 'calc(979 / 1920 * 100vw)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/for-developers/secure/deco-vector.svg"
          alt=""
          style={{ display: 'block', width: '100%', height: '100%' }}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div
        className="relative mx-auto"
        style={{
          maxWidth: 'var(--container-default)',
          paddingLeft: 'clamp(16px, 4vw, 48px)',
          paddingRight: 'clamp(16px, 4vw, 48px)',
          paddingTop: 'clamp(48px, 4.17vw, 80px)',
          /* Now the last section before <Footer cta>; reserve the card-overlap
             space per the Footer layout contract. */
          paddingBottom: 'var(--spacing-section-cta)',
        }}
      >
        <div
          className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-12"
          style={{ marginBottom: 'clamp(40px, 3.65vw, 70px)' }}
        >
          <Reveal header className="lg:max-w-[600px] lg:shrink-0">
            <h2
              className="text-white text-left"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
              }}
            >
              Secure Foundations Without Workflow Changes
            </h2>
          </Reveal>

          <Reveal header delay={0.15} y={20} className="lg:min-w-0 lg:max-w-[560px]">
            <p
              className="text-left lg:text-right"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-lead)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.4,
                color: 'rgba(255,255,255,0.8)',
                textWrap: 'balance',
              }}
            >
              Replace public software artifacts with verified, minimal, and continuously rebuilt
              alternatives without disrupting developer workflows.
            </p>
          </Reveal>
        </div>

        <div className="relative">
          <div className="flex flex-col items-stretch lg:hidden mx-auto" style={{ maxWidth: '240px' }}>
            {PILLARS.map((pillar, i) => (
              <div key={`m-${pillar.title}`} className="flex flex-col">
                {i > 0 && (
                  <div
                    aria-hidden
                    className="pointer-events-none mx-auto"
                    style={{
                      width: '147px',
                      height: '1px',
                      background: PILLAR_DIVIDER_H,
                      marginTop: '24px',
                      marginBottom: '24px',
                    }}
                  />
                )}
                <p
                  className="text-center"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--fs-h4)',
                    fontWeight: 600,
                    letterSpacing: '-0.04em',
                    lineHeight: 1.1,
                    color: '#ffffff',
                    marginBottom: '12px',
                  }}
                >
                  {pillar.title}
                </p>
                <p
                  className="text-center"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--fs-body-sm)',
                    fontWeight: 400,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.4,
                    color: '#dddddd',
                  }}
                >
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>

          <div
            className="hidden lg:grid lg:grid-cols-4"
            style={{ columnGap: 0, rowGap: 'clamp(24px, 2.5vw, 40px)' }}
          >
            {PILLARS.map((pillar, i) => (
              <div key={pillar.title} className="relative">
                {i > 0 && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute"
                    style={{
                      left: 0,
                      top: '8%',
                      bottom: '8%',
                      width: '1px',
                      background: PILLAR_DIVIDER_V,
                    }}
                  />
                )}
                <div
                  style={{
                    paddingLeft: i > 0 ? 'clamp(20px, 2.5vw, 38px)' : '0',
                    paddingRight: 'clamp(12px, 1.5vw, 24px)',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--fs-h4)',
                      fontWeight: 600,
                      letterSpacing: '-0.04em',
                      lineHeight: 1.1,
                      color: '#ffffff',
                      marginBottom: '12px',
                    }}
                  >
                    {pillar.title}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--fs-body)',
                      fontWeight: 400,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.4,
                      color: '#dddddd',
                    }}
                  >
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
