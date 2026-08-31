import type React from 'react';
import Image from 'next/image';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';

/*
 * "Modern Applications Bring New Risks" — the risk register.
 *
 * This took three tries, and the failures are the reason for the shape.
 *
 *   v1  list in a white slab      54-60% of every row empty; the accent redrew
 *                                 per row into four disconnected stripes; the
 *                                 slab duplicated the delivery matrix below.
 *                                 Also carried 01-04, which the proposal does
 *                                 not — four Heading3 paragraphs, no numbering.
 *   v2  two-column table          empty width down to 15-22%, but the split was
 *                                 arbitrary (detail began at 613px for no
 *                                 reason a reader could see) and the far right
 *                                 was still void.
 *   v3  heading left, list right  filled the width, but the heading dominated
 *                                 and the narrow list read as stranded.
 *
 * All three stretched four small items across a wide row. The content is
 * genuinely small — four labels and four half-sentences — so the answer is not
 * a cleverer layout, it is fewer and bigger units. A 2x2 gives four equal
 * cells, each comfortably filled, with no arbitrary track to align against and
 * no rag worth measuring.
 *
 * It also stays distinct from the page's three other quartets, which are all
 * 1x4 (demands strip, delivery matrix, outcomes figures). A different aspect
 * gives the risk section more weight than the strip above it, which is right.
 *
 * Hairline cross-rules rather than a card: the delivery matrix two sections
 * below is already a white slab, and the page does not need two.
 *
 * Nothing here grades the four risks — the proposal lists them flat, so there
 * is no severity scale and no badges. A "Critical" label on a row the client
 * never graded would be a claim rather than a design decision.
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
      {/* Corner union — the light-band decoration this design language uses. */}
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
          style={{ marginBottom: 'clamp(32px, 3.6vw, 56px)' }}
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
          className="mx-auto grid grid-cols-1 sm:grid-cols-2"
          style={{ maxWidth: '1000px' }}
        >
          {RISKS.map((risk, i) => (
            <RevealItem key={risk.title}>
              {/* Cross-rules. Stacked, every cell after the first takes a top
                  rule; as a 2x2, only the second row does, plus a left rule on
                  the right-hand column. The two cases are resolved here rather
                  than by stacking `sm:border-t` and `sm:border-t-0` on the same
                  element — Tailwind emits the reset last, so it silently won
                  and the row rule never drew. */}
              <div
                className={[
                  // Centre, not top. The icon is 87px against a 56px text block, so
                  // top-aligning left it hanging 31px below the copy in every cell.
                  'flex h-full items-center gap-4 border-[rgba(17,17,17,0.10)] sm:gap-5',
                  i > 0 ? 'border-t' : '',
                  i > 0 && i < 2 ? 'sm:border-t-0' : '',
                  i % 2 === 1 ? 'sm:border-l' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  padding: 'clamp(22px, 2.4vw, 34px) clamp(0px, 2vw, 32px)',
                }}
              >
                <span
                  className="relative flex shrink-0 items-center justify-center"
                  // Measured 66px against the delivery matrix's 76px — this
                  // section is meant to outweigh that one, not sit under it.
                  style={{
                    width: 'clamp(72px, 6.1vw, 88px)',
                    height: 'clamp(72px, 6.1vw, 88px)',
                  }}
                >
                  <span
                    aria-hidden
                    className="absolute rounded-full"
                    style={{
                      width: '86%',
                      height: '86%',
                      background:
                        'radial-gradient(closest-side, rgba(154,81,255,0.20) 0%, rgba(154,81,255,0) 74%)',
                    }}
                  />
                  <Image
                    src={risk.icon}
                    alt={risk.iconAlt}
                    width={140}
                    height={140}
                    sizes="88px"
                    className="relative object-contain"
                    style={{ width: 'auto', height: '100%' }}
                  />
                </span>

                <div className="min-w-0">
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--fs-h5)',
                      fontWeight: 600,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.3,
                      color: '#111111',
                    }}
                  >
                    {risk.title}
                  </h3>
                  <p
                    style={{
                      margin: '6px 0 0',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--fs-body)',
                      fontWeight: 400,
                      letterSpacing: '-0.01em',
                      lineHeight: 1.55,
                      color: 'rgba(17,17,17,0.66)',
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
