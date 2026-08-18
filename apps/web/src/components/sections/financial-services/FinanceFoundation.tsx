import type React from 'react';
import Link from 'next/link';
import { Reveal } from '@/components/ui/Reveal';
import { ArtVerifiedContainer, ArtVerifiedLibraries } from './FinanceVerifiedArt';

/*
 * FinanceFoundation — "Build on a Verified Software Foundation".
 *
 * The page's resolution, and now built to be its peak rather than its
 * footnote. The dark band above leaves the reader with six untrusted objects;
 * this answers with two of those exact objects verified — the breached
 * container closed and struck, the loose unreviewed nodes connected and
 * checked — at full artifact scale, with verification visibly happening.
 *
 * The amplification is entirely in the system's own vocabulary: the drawn
 * isometric objects it already owns, the seal motif the hero already uses, the
 * travelling-carrier motion the risk chain already uses. Nothing new was
 * introduced — the section simply stops opting out of the moves its neighbours
 * already make. Every string is the proposal's copy, verbatim.
 *
 * The operating loop is drawn as an actual loop, on a rail with a travelling
 * indicator, because "kept verified, continuously" is a cycle and a static row
 * of four words said none of that.
 */

interface Pillar {
  title: string;
  body: string;
  href: string;
  Art: () => React.ReactElement;
  accent: string;
}

const PILLARS: readonly [Pillar, Pillar] = [
  {
    title: 'Verified Container Images',
    body: 'Hardened, minimal, and secure container images for your applications.',
    href: '/cleanstart-images',
    Art: ArtVerifiedContainer,
    accent: '#7C4FF0',
  },
  {
    title: 'Verified Libraries & Dependencies',
    body: 'Secure, trusted, and proven libraries and dependencies for modern applications.',
    href: '/clean-libraries',
    Art: ArtVerifiedLibraries,
    accent: '#5C6BE8',
  },
];

interface LoopStep {
  title: string;
  body: string;
}

const LOOP: readonly [LoopStep, LoopStep, LoopStep, LoopStep] = [
  { title: 'Discover', body: 'Gain visibility across your environment.' },
  { title: 'Verify', body: 'Verify integrity and establish trust.' },
  { title: 'Govern', body: 'Enforce policies and maintain compliance.' },
  { title: 'Remediate', body: 'Replace risky components with verified alternatives.' },
];

const CAPS_LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--fs-caption)',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  lineHeight: 1.4,
};

export function FinanceFoundation(): React.ReactElement {
  return (
    <section
      data-section="FinanceFoundation"
      className="relative overflow-hidden"
      // Light, but luminous — the relief the page earns by coming out of the
      // dark band directly above it.
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #FAF8FF 34%, #F5FAFF 68%, #ffffff 100%)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          left: '50%',
          top: '4%',
          width: '1180px',
          height: '760px',
          transform: 'translateX(-50%)',
          borderRadius: '50%',
          background:
            'radial-gradient(50% 50% at 50% 50%, rgba(124, 79, 240, 0.14) 0%, rgba(44, 193, 235, 0.09) 46%, rgba(255,255,255,0) 72%)',
        }}
      />

      <div
        className="relative mx-auto"
        style={{
          maxWidth: 'var(--container-default)',
          paddingLeft: 'clamp(16px, 4vw, 48px)',
          paddingRight: 'clamp(16px, 4vw, 48px)',
          paddingTop: 'clamp(40px, 3.6vw, 54px)',
          paddingBottom: 'clamp(28px, 2.5vw, 34px)',
        }}
      >
        <div className="grid grid-cols-1 gap-x-16 gap-y-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
          <Reveal header>
            <h2
              style={{
                maxWidth: '22ch',
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                color: '#111111',
                margin: 0,
              }}
            >
              Build on a Verified Software Foundation
            </h2>
          </Reveal>

          <Reveal delay={0.08} y={20}>
            <p
              style={{
                maxWidth: '48ch',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-lead-sm)',
                fontWeight: 400,
                letterSpacing: '-0.01em',
                lineHeight: 1.55,
                color: '#4a4a4a',
                margin: 0,
              }}
            >
              Trusted software artifacts for regulated financial applications.
            </p>
          </Reveal>
        </div>

        {/* The two artifacts, at full scale. */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2"
          style={{ marginTop: 'clamp(20px, 2.2vw, 32px)', gap: 'clamp(24px, 3vw, 56px)' }}
        >
          {PILLARS.map(({ title, body, href, Art, accent }, i) => (
            <Reveal key={title} delay={i * 0.1} y={24}>
              <div className="group flex h-full flex-col items-center text-center">
                <div
                  aria-hidden
                  className="transition-transform duration-500 group-hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
                  style={{ width: 'min(100%, 292px)', aspectRatio: '260 / 230' }}
                >
                  <Art />
                </div>

                <div
                  style={{
                    width: '100%',
                    maxWidth: '44ch',
                    marginTop: 'clamp(2px, 0.6vw, 8px)',
                    paddingTop: 'clamp(14px, 1.4vw, 20px)',
                    borderTop: `2px solid ${accent}`,
                  }}
                >
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--fs-h3)',
                      fontWeight: 600,
                      letterSpacing: '-0.035em',
                      lineHeight: 1.15,
                      color: '#111111',
                      margin: 0,
                    }}
                  >
                    <Link href={href} className="cs-fin-pillar-link">
                      {title}
                    </Link>
                  </h3>
                  <p
                    style={{
                      margin: '10px 0 0',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--fs-body)',
                      fontWeight: 400,
                      letterSpacing: '-0.01em',
                      lineHeight: 1.55,
                      color: '#4a4a4a',
                    }}
                  >
                    {body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* The operating loop, drawn as a loop. */}
        <Reveal delay={0.1} y={20}>
          <div style={{ marginTop: 'clamp(22px, 2.2vw, 30px)' }}>
            <p style={{ ...CAPS_LABEL, color: '#6b6b6b', textAlign: 'center' }}>
              Powered by CleanStart
            </p>

            <div className="relative" style={{ marginTop: 'clamp(18px, 1.8vw, 26px)' }}>
              {/* The rail. A cycle, not a row — it runs the full width and a
                  carrier travels it continuously, the same device the risk
                  chain uses, turned to the opposite purpose. */}
              <div
                aria-hidden
                className="pointer-events-none absolute hidden lg:block"
                style={{
                  left: '12.5%',
                  right: '12.5%',
                  top: '5px',
                  height: '1px',
                  background:
                    'linear-gradient(90deg, rgba(124,79,240,0.45) 0%, rgba(92,107,232,0.5) 34%, rgba(47,127,212,0.5) 68%, rgba(23,179,222,0.55) 100%)',
                }}
              >
                <span className="cs-fin-carry" style={{ background: '#17B3DE' }} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {LOOP.map(({ title, body }, i) => (
                  <div
                    key={title}
                    className={`relative flex flex-col lg:items-center lg:text-center ${
                      i === 0
                        ? ''
                        : 'border-t border-[rgba(17,17,17,0.1)] pt-4 lg:border-t-0 lg:pt-0'
                    }`}
                  >
                    <span
                      aria-hidden
                      className="hidden lg:block"
                      style={{
                        width: '11px',
                        height: '11px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        border: '2px solid rgba(23,179,222,0.85)',
                      }}
                    />
                    <h3
                      style={{
                        marginTop: 'clamp(0px, 1.2vw, 16px)',
                        fontFamily: 'var(--font-display)',
                        fontSize: 'var(--fs-h4)',
                        fontWeight: 600,
                        letterSpacing: '-0.025em',
                        lineHeight: 1.2,
                        color: '#111111',
                      }}
                    >
                      {title}
                    </h3>
                    <p
                      style={{
                        margin: '6px 0 clamp(14px, 1.4vw, 18px)',
                        maxWidth: '26ch',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'var(--fs-body-sm)',
                        fontWeight: 400,
                        letterSpacing: '-0.005em',
                        lineHeight: 1.5,
                        color: '#6b6b6b',
                      }}
                    >
                      {body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
