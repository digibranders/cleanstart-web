import type React from 'react';
import Image from 'next/image';
import { Container, Section } from '@/components/layout';
import { Reveal } from '@/components/ui/Reveal';
import { H2_STYLE } from './type';

/*
 * "Built for Modern Telecommunications": the four assurance pillars in one
 * matrix card, closed by a ribbon of the standards the pillars name (the
 * SaasDelivery / FinanceRequirements family). One sentence per pillar because
 * that is all the brief gives; every ribbon entry appears in that copy.
 *
 * Copy is the brief's, verbatim.
 */

interface Pillar {
  icon: string;
  iconAlt: string;
  title: string;
  body: string;
}

const PILLARS: readonly [Pillar, Pillar, Pillar, Pillar] = [
  {
    icon: '/images/attack-surface-reduction/approach-icon-secure.webp',
    iconAlt: '3D icon of a security padlock',
    title: 'Security',
    body: 'Hardened foundations, near-zero known CVEs and reduced attack surface.',
  },
  {
    icon: '/images/compare/icon-signed-artifact.webp',
    iconAlt: '3D icon of a signed and sealed artifact',
    title: 'Integrity',
    body: 'SLSA Level 3 provenance, cryptographic signing and reproducible builds across environments.',
  },
  {
    icon: '/images/compare/icon-sbom.webp',
    iconAlt: '3D icon of a software bill of materials document',
    title: 'Transparency',
    body: 'SBOMs, AI BOMs and visibility into software components and dependencies.',
  },
  {
    icon: '/images/compare/icon-fips.webp',
    iconAlt: '3D icon of a compliance shield',
    title: 'Compliance',
    body: 'FIPS 140-3, CIS Benchmarks, DISA STIG and support for software assurance requirements.',
  },
];

const STANDARDS: readonly string[] = [
  'FIPS 140-3',
  'SLSA Level 3',
  'SBOM',
  'AI BOM',
  'CIS Benchmarks',
  'DISA STIG',
];

const RULE = 'rgba(154,81,255,0.12)';

export function TelecomPillars(): React.ReactElement {
  return (
    <Section
      data-section="TelecomPillars"
      className="overflow-hidden"
      style={{ background: '#EFEDF7' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/enterprise-union.svg"
        alt=""
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          right: '-185px',
          top: '-193px',
          width: '488px',
          height: '496px',
          transform: 'rotate(141.39deg) scaleY(-1)',
        }}
        loading="lazy"
        decoding="async"
      />

      <Container className="relative">
        <Reveal
          header
          className="mx-auto max-w-[860px] text-center"
          style={{ marginBottom: 'clamp(36px, 4vw, 56px)' }}
        >
          <h2 style={{ ...H2_STYLE, color: '#111111' }}>
            Built for <span className="cs-text-gradient-impact">Modern Telecommunications</span>
          </h2>
        </Reveal>

        <Reveal delay={0.12} y={20}>
          <div
            className="overflow-hidden"
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid rgba(154,81,255,0.18)',
              boxShadow:
                '0 4px 24px -4px rgba(40,30,90,0.04), 0 20px 48px -12px rgba(40,30,90,0.07)',
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map((p, i) => (
                <div
                  key={p.title}
                  className={[
                    'group flex flex-col items-center text-center md:items-start md:text-left',
                    // Bottom rule: stacked on all but the last; 2x2 on the top row only; none in one row.
                    i < 2 ? 'border-b lg:border-b-0' : '',
                    i === 2 ? 'border-b md:border-b-0' : '',
                    i % 2 === 0 ? 'md:border-r' : '',
                    i === 1 ? 'lg:border-r' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{
                    borderColor: RULE,
                    padding: 'clamp(28px, 2.6vw, 36px) clamp(22px, 2vw, 30px)',
                  }}
                >
                  <div className="relative flex h-20 w-20 items-center justify-center md:justify-start">
                    <span
                      aria-hidden
                      className="absolute h-[74px] w-[74px] rounded-full transition-transform duration-500 group-hover:scale-125"
                      style={{
                        background:
                          'radial-gradient(closest-side, rgba(154,81,255,0.22) 0%, rgba(154,81,255,0) 74%)',
                        filter: 'blur(6px)',
                      }}
                    />
                    <Image
                      src={p.icon}
                      alt={p.iconAlt}
                      width={84}
                      height={84}
                      sizes="84px"
                      className="relative object-contain transition-transform duration-300 group-hover:-translate-y-1"
                      style={{
                        width: 'auto',
                        height: '76px',
                        filter: 'drop-shadow(0 8px 14px rgba(40,20,90,0.12))',
                      }}
                    />
                  </div>
                  <h3
                    style={{
                      margin: '20px 0 0',
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--fs-h3)',
                      fontWeight: 600,
                      letterSpacing: '-0.035em',
                      lineHeight: 1.2,
                      color: '#111111',
                    }}
                  >
                    {p.title}
                  </h3>
                  <p
                    style={{
                      margin: '12px 0 0',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--fs-body-sm)',
                      fontWeight: 400,
                      letterSpacing: '-0.01em',
                      lineHeight: 1.55,
                      color: '#3B3654',
                    }}
                  >
                    {p.body}
                  </p>
                </div>
              ))}
            </div>

            <ul
              aria-label="Standards supported"
              className="m-0 flex list-none flex-wrap items-center justify-center gap-x-[clamp(18px,2.6vw,40px)] gap-y-2.5"
              style={{
                background: 'linear-gradient(180deg, #FAF8FE 0%, #F5F1FD 100%)',
                borderTop: '1px solid rgba(154,81,255,0.14)',
                padding: 'clamp(18px, 1.8vw, 24px) clamp(16px, 2vw, 32px)',
              }}
            >
              {STANDARDS.map((std) => (
                <li
                  key={std}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'clamp(12px, 1.05vw, 14px)',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    color: '#2E2856',
                    textTransform: 'uppercase',
                  }}
                >
                  {std}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
