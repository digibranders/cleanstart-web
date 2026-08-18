import type React from 'react';
import { Reveal } from '@/components/ui/Reveal';

/*
 * FinanceRequirements — "Built Around the Requirements of Regulated Software
 * Delivery", built as the evidence artifact it describes.
 *
 * The reader here is a compliance or risk reviewer, and for them "premium" is
 * not more illustration — it is precision, density and document authority. So
 * this section is a conformance record: one bounded sheet on the wash, ruled
 * columns, tracked caps, hairline controls, and a struck attestation stamp.
 * It is the only bounded surface on the page, and it earns that because the
 * content genuinely is a record rather than a pitch.
 *
 * Copy is the proposal's, verbatim. One structural fix was needed: the
 * standards line duplicated five of its six tokens from the columns below it
 * (FIPS 140-3, NIST SSDF and CIS Benchmarks from Compliance, SLSA Level 4 from
 * Integrity, SBOM from Transparency — only SPDX was unique). Promoting it from
 * footer to header band keeps every word while turning an echo into a summary
 * the columns then detail. The duplication itself is the client's to resolve.
 */

interface Requirement {
  title: string;
  items: readonly string[];
  accent: string;
}

// Same violet→cyan ramp the artifacts use, so a requirement group is visibly
// tied to the artifact vocabulary rather than coloured arbitrarily.
const REQUIREMENTS: readonly [Requirement, Requirement, Requirement, Requirement] = [
  {
    title: 'Security',
    items: ['Hardened software foundations', 'Near-zero known CVEs', 'Reduced attack surface'],
    accent: '#7C4FF0',
  },
  {
    title: 'Integrity',
    items: ['SLSA Level 4 provenance', 'Cryptographic signing', 'Reproducible builds'],
    accent: '#5C6BE8',
  },
  {
    title: 'Transparency',
    items: ['SBOMs', 'AI BOMs', 'Dependency visibility'],
    accent: '#2F7FD4',
  },
  {
    title: 'Compliance',
    items: ['FIPS 140-3', 'NIST SSDF', 'CIS Benchmarks', 'DISA STIG'],
    accent: '#17B3DE',
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

const CAPS: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  lineHeight: 1.4,
};

/* A struck attestation stamp — monoline and subdued, the way a stamp on a
   filed document reads, rather than the lit cyan seal the artifacts carry. */
function AttestationStamp(): React.ReactElement {
  return (
    <svg
      aria-hidden
      viewBox="0 0 96 96"
      width="100%"
      height="100%"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      className="pointer-events-none select-none"
    >
      <circle cx="48" cy="48" r="45" stroke="#7C4FF0" strokeOpacity="0.28" strokeWidth="1.2" />
      <circle
        cx="48"
        cy="48"
        r="38"
        stroke="#2F7FD4"
        strokeOpacity="0.3"
        strokeWidth="1"
        strokeDasharray="2 6"
      />
      <path
        d="M48 24 L66 33 L66 52 Q66 68 48 76 Q30 68 30 52 L30 33 Z"
        stroke="#5C6BE8"
        strokeOpacity="0.45"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M39 49 l6 6.2 l12 -14"
        stroke="#17B3DE"
        strokeOpacity="0.75"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FinanceRequirements(): React.ReactElement {
  return (
    <section
      data-section="FinanceRequirements"
      className="relative"
      style={{ background: '#F6F6F6' }}
    >
      <div
        className="relative mx-auto"
        style={{
          maxWidth: 'var(--container-default)',
          paddingLeft: 'clamp(16px, 4vw, 48px)',
          paddingRight: 'clamp(16px, 4vw, 48px)',
          paddingTop: 'clamp(40px, 3.6vw, 56px)',
          paddingBottom: 'clamp(32px, 3vw, 44px)',
        }}
      >
        <Reveal header>
          <h2
            style={{
              maxWidth: '34ch',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h2)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              color: '#111111',
              margin: 0,
            }}
          >
            Built Around the Requirements of Regulated Software Delivery
          </h2>
        </Reveal>

        {/* The record. */}
        <Reveal y={22}>
          <div
            className="relative overflow-hidden"
            style={{
              marginTop: 'clamp(22px, 2.4vw, 36px)',
              background: '#ffffff',
              border: '1px solid rgba(17, 17, 17, 0.11)',
              borderRadius: '6px',
              boxShadow: '0 24px 60px -40px rgba(40, 30, 90, 0.42)',
            }}
          >
            {/* Header band — the frameworks this record answers to. Promoted
                from the footer so the tokens read as a summary the columns then
                detail, instead of an echo of them. */}
            <div
              className="relative"
              style={{
                background: 'linear-gradient(180deg, #FBFAFF 0%, #F7F9FE 100%)',
                borderBottom: '1px solid rgba(17, 17, 17, 0.1)',
                padding: 'clamp(14px, 1.4vw, 20px) clamp(18px, 2vw, 32px)',
              }}
            >
              <ul
                className="flex flex-wrap items-center justify-center lg:justify-between"
                style={{ margin: 0, padding: 0, listStyle: 'none', gap: '6px 0' }}
              >
                {STANDARDS.map((s, i) => (
                  <li
                    key={s}
                    // Dividers only where the row does not wrap; below sm the
                    // band breaks over three lines and a leading rule would be
                    // stranded at the start of one.
                    className={i === 0 ? '' : 'sm:border-l sm:border-[rgba(17,17,17,0.12)]'}
                    style={{
                      ...CAPS,
                      fontSize: 'var(--fs-caption)',
                      color: '#3d3d63',
                      padding: '0 clamp(12px, 1.4vw, 22px)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s}
                  </li>
                ))}
              </ul>
              {/* Foil rule — the one material flourish, in the page's own ramp. */}
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0"
                style={{
                  height: '2px',
                  background:
                    'linear-gradient(90deg, #7C4FF0 0%, #5C6BE8 34%, #2F7FD4 68%, #17B3DE 100%)',
                }}
              />
            </div>

            {/* Controls. */}
            <div
              className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
              style={{
                padding: 'clamp(20px, 2.2vw, 34px) clamp(18px, 2vw, 32px) clamp(20px, 4.6vw, 68px)',
              }}
            >
              {/* The stamp sits in the record's corner, the way a filed
                  document carries one. Desktop only — below lg the columns
                  stack and there is no corner left for it to occupy. */}
              <div
                aria-hidden
                className="pointer-events-none absolute hidden lg:block"
                style={{
                  right: 'clamp(18px, 2vw, 32px)',
                  bottom: '8px',
                  width: '84px',
                  height: '84px',
                  opacity: 0.55,
                }}
              >
                <AttestationStamp />
              </div>

              {REQUIREMENTS.map(({ title, items, accent }, i) => (
                <div
                  key={title}
                  className={`h-full ${
                    i === 0
                      ? 'lg:pr-8'
                      : 'lg:border-l lg:border-[rgba(17,17,17,0.1)] lg:pl-8 lg:pr-8'
                  } ${i > 0 ? 'mt-7 sm:mt-0' : ''}`}
                >
                  <div
                    style={{
                      borderTop: `2px solid ${accent}`,
                      paddingTop: 'clamp(12px, 1.2vw, 16px)',
                    }}
                  >
                    <h3
                      style={{
                        ...CAPS,
                        fontSize: 'var(--fs-caption)',
                        color: accent,
                        margin: 0,
                      }}
                    >
                      {title}
                    </h3>
                  </div>

                  <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none' }}>
                    {items.map((item) => (
                      <li
                        key={item}
                        style={{
                          borderTop: '1px solid rgba(17, 17, 17, 0.08)',
                          paddingTop: '10px',
                          paddingBottom: '10px',
                          fontFamily: 'var(--font-sans)',
                          fontSize: 'var(--fs-body-sm)',
                          fontWeight: 500,
                          letterSpacing: '-0.005em',
                          lineHeight: 1.45,
                          color: '#2b2b2b',
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
