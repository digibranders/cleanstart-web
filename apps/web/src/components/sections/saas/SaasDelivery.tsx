import type React from 'react';
import Image from 'next/image';
import { Reveal } from '@/components/ui/Reveal';

/*
 * "Built for Modern Software Delivery" — the four delivery pillars in one
 * unified matrix card, closed by the standards ribbon the proposal supplies.
 *
 * Each pillar carries a single sentence rather than the checklist its
 * financial-services sibling uses. The proposal gives one line per pillar and
 * nothing more, and padding four one-liners out into twelve invented bullets
 * would be writing claims the client did not make. It also spares the page
 * twelve checkmark badges, which is the pattern this design language has
 * already been pulled up on once.
 *
 * Copy is the proposal's, verbatim.
 */

interface ColumnData {
  icon: string;
  iconAlt: string;
  title: string;
  body: string;
}

const COLUMNS: readonly [ColumnData, ColumnData, ColumnData, ColumnData] = [
  {
    icon: '/images/attack-surface-reduction/deploy-icon.webp',
    iconAlt: '3D icon of a global delivery network',
    title: 'Faster Development',
    body: 'Enable teams to build and release applications without security friction.',
  },
  {
    icon: '/images/attack-surface-reduction/approach-icon-secure.webp',
    iconAlt: '3D icon of a security padlock',
    title: 'Secure Foundations',
    body: 'Start with hardened software components designed to reduce risk.',
  },
  {
    icon: '/images/compare/icon-sbom.webp',
    iconAlt: '3D icon of a software bill of materials document',
    title: 'Software Transparency',
    body: 'Understand components, provenance, and dependencies.',
  },
  {
    icon: '/images/compare/icon-regulatory.webp',
    iconAlt: '3D icon of a governance and policy seal',
    title: 'Scalable Governance',
    body: 'Apply consistent security standards across teams and environments.',
  },
];

const STANDARDS: readonly string[] = [
  'SLSA Level 3',
  'SBOM',
  'SPDX',
  'Cryptographic Signing',
  'Reproducible Builds',
];

export function SaasDelivery(): React.ReactElement {
  return (
    <section
      data-section="SaasDelivery"
      className="relative overflow-hidden py-section-md"
      style={{ background: '#EFEDF7' }}
    >
      {/* Corner unions — the light-band decoration, mirrored top-left/top-right. */}
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/enterprise-union.svg"
        alt=""
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          left: '-218px',
          top: '-139px',
          width: '488px',
          height: '496px',
          transform: 'rotate(141.39deg) scaleY(-1)',
        }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Header with Headline & Subtext */}
        <div
          className="mx-auto flex max-w-[840px] flex-col items-center gap-4 text-center"
          style={{ marginBottom: 'clamp(36px, 4vw, 56px)' }}
        >
          <Reveal header>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                color: '#111111',
                margin: 0,
              }}
            >
              Built for <span className="cs-text-gradient-impact">Modern Software Delivery</span>
            </h2>
          </Reveal>

          <Reveal header delay={0.12} y={16}>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-lead-sm)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.5,
                color: 'rgba(17, 17, 17, 0.75)',
                maxWidth: '680px',
                margin: 0,
              }}
            >
              Enable secure development practices without slowing engineering velocity.
            </p>
          </Reveal>
        </div>

        {/* Unified Enterprise Framework Matrix Container */}
        <Reveal delay={0.15} y={20}>
          <div
            className="relative overflow-hidden"
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid rgba(154, 81, 255, 0.18)',
              boxShadow:
                '0 4px 24px -4px rgba(40, 30, 90, 0.04), 0 20px 48px -12px rgba(40, 30, 90, 0.07)',
            }}
          >
            {/* Top Grid: 4 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {COLUMNS.map((col, index) => {
                const isLastInRowLg = index === COLUMNS.length - 1;
                const isOddMd = index % 2 === 1;

                return (
                  <div
                    key={col.title}
                    className={`flex flex-col items-center text-center md:items-start md:text-left justify-between ${
                      !isLastInRowLg ? 'lg:border-r lg:border-[rgba(154,81,255,0.12)]' : ''
                    } ${!isOddMd ? 'md:border-r md:border-[rgba(154,81,255,0.12)]' : ''} ${
                      index < 2 ? 'md:border-b lg:border-b-0 md:border-[rgba(154,81,255,0.12)]' : ''
                    } ${
                      index < COLUMNS.length - 1
                        ? 'border-b md:border-b-0 border-[rgba(154,81,255,0.12)]'
                        : ''
                    }`}
                    style={{
                      padding: 'clamp(28px, 2.6vw, 36px) clamp(22px, 2vw, 30px)',
                    }}
                  >
                    <div className="flex flex-col items-center md:items-start w-full">
                      {/* 3D Icon Stage */}
                      <div
                        className="relative flex items-center justify-center md:justify-start"
                        style={{ width: '80px', height: '80px' }}
                      >
                        <span
                          aria-hidden
                          className="absolute rounded-full pointer-events-none"
                          style={{
                            width: '74px',
                            height: '74px',
                            background:
                              'radial-gradient(closest-side, rgba(154, 81, 255, 0.22) 0%, rgba(154, 81, 255, 0) 74%)',
                            filter: 'blur(6px)',
                          }}
                        />
                        <Image
                          src={col.icon}
                          alt={col.iconAlt}
                          width={84}
                          height={84}
                          sizes="84px"
                          className="relative object-contain"
                          style={{
                            width: 'auto',
                            height: '76px',
                            filter: 'drop-shadow(0 8px 14px rgba(40, 20, 90, 0.12))',
                          }}
                        />
                      </div>

                      {/* Column Title */}
                      <h3
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'var(--fs-h3)',
                          fontWeight: 600,
                          letterSpacing: '-0.035em',
                          lineHeight: 1.2,
                          color: '#111111',
                          margin: '20px 0 0',
                          // "Software Transparency" wraps to two lines at every
                          // desktop width while the other three hold one, which
                          // drops its body a whole line below its neighbours.
                          // Reserving two lines for all four keeps the bodies on
                          // a common baseline instead.
                          minHeight: 'calc(2 * 1.2em)',
                        }}
                      >
                        {col.title}
                      </h3>

                      <p
                        style={{
                          margin: '14px 0 0',
                          fontFamily: 'var(--font-sans)',
                          fontSize: 'var(--fs-body-sm)',
                          fontWeight: 400,
                          letterSpacing: '-0.01em',
                          lineHeight: 1.55,
                          color: '#3B3654',
                        }}
                      >
                        {col.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Spanning Row: Verified Standards Ribbon */}
            <div
              className="relative flex flex-wrap items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, #FAF8FE 0%, #F5F1FD 100%)',
                borderTop: '1px solid rgba(154, 81, 255, 0.14)',
                padding: 'clamp(18px, 1.8vw, 24px) clamp(16px, 2vw, 32px)',
              }}
            >
              <div className="flex flex-wrap items-center justify-center gap-y-2.5 text-center">
                {STANDARDS.map((std, i) => (
                  <span key={std} className="inline-flex items-center">
                    {i > 0 && (
                      <span
                        aria-hidden
                        className="hidden select-none sm:inline-block"
                        style={{
                          margin: '0 clamp(10px, 1.6vw, 22px)',
                          color: 'rgba(154, 81, 255, 0.32)',
                          fontWeight: 300,
                          fontSize: '15px',
                        }}
                      >
                        |
                      </span>
                    )}
                    <span
                      className="px-2.5 py-1 sm:p-0"
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
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
