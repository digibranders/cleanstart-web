import type React from 'react';
import { Reveal } from '@/components/ui/Reveal';

/*
 * FinanceOutcomes — "Outcomes That Drive Impact".
 *
 * The page's closing statement, set as one. Four outcomes at display scale on
 * full-bleed rules — the only place on the page where type itself is the
 * design, and the one form the preceding five sections have not used.
 *
 * Two things drove the rebuild:
 *
 * 1. NO INVENTED HIERARCHY. The previous version promoted "Reduce Risk" to
 *    section scale and demoted the rest to a ledger. Nothing in the copy
 *    justifies that ranking — the four are peers, and a design that pretends
 *    otherwise is asserting something the content does not say. They now carry
 *    equal weight, and the composition earns its interest from scale and rhythm
 *    instead of a fake pecking order.
 *
 * 2. THE COPY IS FOUR SHORT SENTENCES. Thin copy is precisely when display
 *    type works: at this scale the brevity reads as conviction rather than as
 *    a gap. Each row's accent also descends the page's violet→cyan ramp in the
 *    order the argument produced it — risk chain, conformance record, verified
 *    artifacts, operating loop — so the close is visibly the sum of the page
 *    above it rather than four fresh claims.
 *
 * Layout contract: this is the page's final section, so its padding-bottom is
 * --spacing-section-cta — the footer's floating CTA card overlaps into it and
 * lands on this dark field, which is what gives the white card its contrast.
 */

interface Outcome {
  title: string;
  body: string;
  accent: string;
}

const OUTCOMES: readonly [Outcome, Outcome, Outcome, Outcome] = [
  {
    title: 'Reduce Risk',
    body: 'Start with verified software components.',
    accent: '#9A6BFF',
  },
  {
    title: 'Improve Compliance',
    body: 'Generate evidence of software integrity.',
    accent: '#7B85F2',
  },
  {
    title: 'Accelerate Delivery',
    body: 'Give developers secure foundations.',
    accent: '#4C9BE8',
  },
  {
    title: 'Strengthen Governance',
    body: 'Know what software runs everywhere.',
    accent: '#2FD0F0',
  },
];

export function FinanceOutcomes(): React.ReactElement {
  return (
    <section
      data-section="FinanceOutcomes"
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #120c28 0%, #1a1140 44%, #171033 74%, #151021 100%)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: '-12%',
          top: '-26%',
          width: '54%',
          paddingBottom: '54%',
          borderRadius: '50%',
          background:
            'radial-gradient(50% 50% at 50% 50%, rgba(124, 60, 240, 0.24) 0%, rgba(124, 60, 240, 0) 70%)',
        }}
      />

      <div
        className="relative mx-auto"
        style={{
          maxWidth: 'var(--container-default)',
          paddingLeft: 'clamp(16px, 4vw, 48px)',
          paddingRight: 'clamp(16px, 4vw, 48px)',
          paddingTop: 'clamp(40px, 3.6vw, 56px)',
          paddingBottom: 'var(--spacing-section-cta)',
        }}
      >
        <Reveal header>
          <h2
            className="text-white"
            style={{
              maxWidth: '20ch',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h2)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Outcomes That Drive Impact
          </h2>
        </Reveal>

        <div style={{ marginTop: 'clamp(26px, 2.8vw, 44px)' }}>
          {OUTCOMES.map(({ title, body, accent }, i) => (
            <Reveal key={title} delay={i * 0.07} y={18}>
              <div
                className="cs-fin-outcome group relative grid grid-cols-1 items-baseline gap-x-12 gap-y-2 md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]"
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.14)',
                  paddingTop: 'clamp(18px, 1.9vw, 28px)',
                  paddingBottom: 'clamp(18px, 1.9vw, 28px)',
                }}
              >
                {/* Accent rule, drawn over the hairline and grown on hover —
                    the row's one moment, and the tie back to the part of the
                    page that produced this outcome. */}
                <span
                  aria-hidden
                  className="cs-fin-outcome-rule"
                  style={{ background: accent }}
                />

                <h3
                  className="text-white"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--fs-h2)',
                    fontWeight: 600,
                    letterSpacing: '-0.04em',
                    lineHeight: 1.05,
                    margin: 0,
                  }}
                >
                  {title}
                </h3>

                <p
                  style={{
                    margin: 0,
                    maxWidth: '34ch',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--fs-lead-sm)',
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.5,
                    color: 'rgba(226, 222, 245, 0.74)',
                  }}
                >
                  {body}
                </p>
              </div>
            </Reveal>
          ))}
          {/* Closing rule, so the last outcome sits inside the set rather than
              trailing off into the CTA card's clearance. */}
          <div aria-hidden style={{ borderTop: '1px solid rgba(255, 255, 255, 0.14)' }} />
        </div>
      </div>
    </section>
  );
}
