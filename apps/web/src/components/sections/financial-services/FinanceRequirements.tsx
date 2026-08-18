import type React from 'react';
import Image from 'next/image';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';

/*
 * "Built Around the Requirements of Regulated Software Delivery" — the site's
 * cyan-ringed white card (the CisoEnterprise shell: 40px outer ring at 30%
 * #2cc1eb, 36px inner card and a purple blur) with the 3D standards icons in
 * the icon slot instead of a glyph sphere, so a compliance group is
 * recognisable at a glance.
 *
 * It sits on a violet-tinted wash rather than white. Foundation above it is the
 * page's bright moment and this is the conformance record that follows, so the
 * pair reads as a deliberate step down in value. They were previously #F6F6F6
 * and #FFFFFF — a 3.5% difference, which reads as an accident rather than a
 * decision. The record stays light because the Footer is itself a dark
 * gradient: a dark section here would put three dark blocks back to back at the
 * end of the page.
 *
 * The proposal's standards line sits below the cards as the summary band it is.
 * It duplicates five of its six tokens from the columns above (only SPDX is
 * unique) — that duplication is the client's to resolve, not ours to edit.
 * Copy is the proposal's, verbatim.
 */

interface Requirement {
  icon: string;
  iconAlt: string;
  title: string;
  items: readonly string[];
}

const REQUIREMENTS: readonly [Requirement, Requirement, Requirement, Requirement] = [
  {
    icon: '/images/attack-surface-reduction/approach-icon-secure.webp',
    iconAlt: '3D icon of a padlock',
    title: 'Security',
    items: ['Hardened software foundations', 'Near-zero known CVEs', 'Reduced attack surface'],
  },
  {
    icon: '/images/compare/icon-signed-artifact.webp',
    iconAlt: '3D icon of a signed and sealed artifact',
    title: 'Integrity',
    items: ['SLSA Level 4 provenance', 'Cryptographic signing', 'Reproducible builds'],
  },
  {
    icon: '/images/compare/icon-sbom.webp',
    iconAlt: '3D icon of a bill of materials document',
    title: 'Transparency',
    items: ['SBOMs', 'AI BOMs', 'Dependency visibility'],
  },
  {
    icon: '/images/compare/icon-fips.webp',
    iconAlt: '3D icon of a compliance shield',
    title: 'Compliance',
    items: ['FIPS 140-3', 'NIST SSDF', 'CIS Benchmarks', 'DISA STIG'],
  },
];

const STANDARDS: readonly string[] = [
  'FIPS 140-3',
  'SLSA Level 4',
  'SBOM',
  'SPDX',
  'NIST SSDF',
  'CIS Benchmarks',
];

function RequirementCard({ icon, iconAlt, title, items }: Requirement): React.ReactElement {
  return (
    <div className="relative h-full w-full" style={{ borderRadius: '40px', padding: '4px' }}>
      {/* Outer cyan glow border. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ borderRadius: '40px', background: '#2cc1eb', opacity: 0.3 }}
      />

      <div
        className="relative flex h-full flex-col overflow-hidden bg-white"
        style={{
          borderRadius: '36px',
          padding: 'clamp(20px, 2vw, 28px)',
          minHeight: 'clamp(300px, 22vw, 356px)',
        }}
      >
        {/* Purple blur decoration. */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            top: '28px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            height: '153px',
            background: '#df9bff',
            filter: 'blur(66.5px)',
            opacity: 0.3,
          }}
        />

        <div className="relative shrink-0" style={{ width: '84px', height: '84px' }}>
          <Image src={icon} alt={iconAlt} fill sizes="84px" className="object-contain" />
        </div>

        <h3
          className="relative"
          style={{
            marginTop: 'clamp(14px, 1.4vw, 20px)',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h3)',
            fontWeight: 600,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: '#111111',
          }}
        >
          {title}
        </h3>

        <ul
          className="relative"
          style={{
            marginTop: 'clamp(12px, 1.2vw, 16px)',
            listStyle: 'none',
            padding: 0,
          }}
        >
          {items.map((item) => (
            <li
              key={item}
              style={{
                borderTop: '1px solid rgba(17,17,17,0.08)',
                paddingTop: '9px',
                paddingBottom: '9px',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-body-sm)',
                fontWeight: 400,
                letterSpacing: '-0.01em',
                lineHeight: 1.45,
                color: '#555555',
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function FinanceRequirements(): React.ReactElement {
  return (
    <section
      data-section="FinanceRequirements"
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
        <Reveal header>
          <h2
            className="mx-auto text-center"
            style={{
              maxWidth: '880px',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h2)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              color: '#111111',
              marginBottom: 'clamp(36px, 4vw, 64px)',
            }}
          >
            Built Around the Requirements of{' '}
            <span className="cs-text-gradient-impact">Regulated Software Delivery</span>
          </h2>
        </Reveal>

        <RevealStagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {REQUIREMENTS.map((req) => (
            <RevealItem key={req.title} className="h-full">
              <RequirementCard {...req} />
            </RevealItem>
          ))}
        </RevealStagger>

        {/* Standards band — the proposal's summary line, as its own record. */}
        <Reveal delay={0.1} y={18}>
          <ul
            className="flex flex-wrap items-center justify-center lg:justify-between"
            style={{
              marginTop: 'clamp(32px, 3.4vw, 52px)',
              padding: 'clamp(14px, 1.4vw, 20px) clamp(8px, 1.6vw, 24px)',
              borderTop: '1px solid rgba(17,17,17,0.12)',
              borderBottom: '1px solid rgba(17,17,17,0.12)',
              listStyle: 'none',
              gap: '8px 0',
            }}
          >
            {STANDARDS.map((s, i) => (
              <li
                key={s}
                // Dividers only where the row does not wrap; below sm the band
                // breaks over several lines and a leading rule would strand at
                // the start of one.
                className={i === 0 ? '' : 'sm:border-l sm:border-[rgba(17,17,17,0.14)]'}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  lineHeight: 1.4,
                  color: '#3d3766',
                  padding: '0 clamp(12px, 1.4vw, 22px)',
                  whiteSpace: 'nowrap',
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
