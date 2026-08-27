import type React from 'react';
import Image from 'next/image';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';

/*
 * "Modern Applications Bring New Risks" — the risk register.
 *
 * The second of the proposal's four quartets, and the one that most needed a
 * form of its own. Rendered as another four-across grid it would have been
 * indistinguishable from the demands strip above it and the delivery pillars
 * below. Rendered as a list, it reads the way a security tool actually presents
 * findings — numbered rows, a severity edge, one line of detail each — which is
 * both a different rhythm on the page and the right register for the content.
 *
 * The list is the only vertical form on the page. Every other section runs
 * horizontally, so this is where the eye slows down.
 *
 * Nothing here grades the four risks. The proposal lists them flat, so the row
 * accent is the brand gradient rather than a severity scale, and there are no
 * badges: a "Critical" label on a row the client never graded would be a claim
 * rather than a design decision.
 *
 * Copy is the proposal's, verbatim.
 */

interface Risk {
  icon: string;
  iconAlt: string;
  title: string;
  body: string;
}

const RISKS: readonly [Risk, Risk, Risk, Risk] = [
  {
    icon: '/images/financial-services/icon-stack-ai-generated-code-v2.png',
    iconAlt: '3D icon of AI-generated code brackets with sparkles',
    title: 'AI-Generated Code',
    body: 'New risks from AI development.',
  },
  {
    icon: '/images/financial-services/icon-stack-open-source-libraries-v2.png',
    iconAlt: '3D icon of an open source library gear',
    title: 'Open Source Dependencies',
    body: 'Inherited risks from third-party code.',
  },
  {
    icon: '/images/financial-services/icon-stack-container-images-v2.png',
    iconAlt: '3D icon of stacked container images',
    title: 'Public Container Images',
    body: 'Hidden risks in external images.',
  },
  {
    icon: '/images/financial-services/icon-stack-software-dependencies-v2.png',
    iconAlt: '3D icon of linked software dependencies',
    title: 'Component Visibility',
    body: 'Unknown software creates blind spots.',
  },
];

export function SaasRisks(): React.ReactElement {
  return (
    <section
      data-section="SaasRisks"
      className="relative overflow-hidden py-section-md"
      style={{ background: '#EFEDF7' }}
    >
      {/* Corner unions — the light-band decoration this design language uses. */}
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

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          className="mx-auto max-w-[820px] text-center"
          style={{ marginBottom: 'clamp(32px, 3.6vw, 52px)' }}
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
              Modern Applications <span className="cs-text-gradient-impact">Bring New Risks</span>
            </h2>
          </Reveal>
        </div>

        <RevealStagger
          className="mx-auto overflow-hidden"
          style={{
            // Narrower than the page container on purpose: a findings row is
            // left-weighted (marker, index, icon, then a short line), so the
            // full 1345px leaves a third of every row empty.
            maxWidth: '940px',
            background: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid rgba(154,81,255,0.16)',
            boxShadow: '0 4px 24px -4px rgba(40,30,90,0.04), 0 20px 48px -12px rgba(40,30,90,0.07)',
          }}
        >
          {RISKS.map((risk, i) => (
            <RevealItem key={risk.title}>
              <div
                className="relative flex items-center"
                style={{
                  gap: 'clamp(16px, 2vw, 28px)',
                  padding: 'clamp(20px, 2.2vw, 28px) clamp(20px, 2.6vw, 36px)',
                  borderTop: i > 0 ? '1px solid rgba(154,81,255,0.12)' : 'none',
                }}
              >
                {/* Row accent, in the brand gradient. It was a red-to-amber
                    severity edge; the proposal grades none of these four, so
                    colour-coding them high and low was the design asserting a
                    ranking the client never wrote. */}
                <span
                  aria-hidden
                  className="absolute left-0"
                  style={{
                    top: i > 0 ? '-1px' : '0',
                    bottom: 0,
                    width: '3px',
                    background:
                      'linear-gradient(180deg, rgba(154,81,255,0.85) 0%, rgba(44,193,235,0.55) 100%)',
                  }}
                />

                <span
                  aria-hidden
                  className="hidden shrink-0 font-mono sm:block"
                  style={{
                    width: '30px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                    color: 'rgba(17,17,17,0.34)',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>

                <span
                  className="relative flex shrink-0 items-center justify-center"
                  style={{ width: 'clamp(56px, 5vw, 72px)', height: 'clamp(56px, 5vw, 72px)' }}
                >
                  <span
                    aria-hidden
                    className="absolute rounded-full"
                    style={{
                      width: '78%',
                      height: '78%',
                      background:
                        'radial-gradient(closest-side, rgba(154,81,255,0.18) 0%, rgba(154,81,255,0) 74%)',
                    }}
                  />
                  <Image
                    src={risk.icon}
                    alt={risk.iconAlt}
                    width={140}
                    height={140}
                    sizes="72px"
                    className="relative object-contain"
                    style={{ width: 'auto', height: '100%' }}
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--fs-h5)',
                      fontWeight: 600,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.25,
                      color: '#111111',
                    }}
                  >
                    {risk.title}
                  </h3>
                  <p
                    style={{
                      margin: '6px 0 0',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--fs-body-sm)',
                      fontWeight: 400,
                      letterSpacing: '-0.01em',
                      lineHeight: 1.55,
                      color: 'rgba(17,17,17,0.68)',
                    }}
                  >
                    {risk.body}
                  </p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
