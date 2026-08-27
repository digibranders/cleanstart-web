import type React from 'react';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';

/*
 * "Modern Applications Demand More" — the page's opening claim strip.
 *
 * This proposal is five groups of four: demands, risks, delivery pillars and
 * outcomes all arrive as four items with one line each, and the product section
 * adds a four-step loop on top. Rendering them all as card grids would give the
 * page four near-identical rows and nothing to distinguish one argument from
 * the next, so each quartet gets a different form. This one is the lightest:
 * four columns held apart by hairlines, no card chrome, no 3D artifacts.
 *
 * It sits directly under the hero and carries the thinnest content on the page
 * (four verb phrases), so it is built to be read in one pass and moved past.
 * Weighting it like a feature section would promise more than four one-liners
 * can pay off.
 *
 * The line icons are deliberate contrast too. Every other section on this page
 * uses the site's 3D artifacts; drawn marks at 22px keep this strip subordinate
 * to them instead of competing.
 *
 * Copy is the proposal's, verbatim.
 */

interface Demand {
  title: string;
  body: string;
  icon: React.ReactElement;
}

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const DEMANDS: readonly [Demand, Demand, Demand, Demand] = [
  {
    title: 'Release Faster',
    body: 'Accelerate delivery without compromising security.',
    icon: (
      <>
        <path d="M3 17 L9.5 10.5 L13 14 L21 6" {...STROKE} />
        <path d="M15.5 6 H21 V11.5" {...STROKE} />
      </>
    ),
  },
  {
    title: 'Reduce Risk',
    body: 'Limit exposure with secure software components.',
    icon: (
      <>
        <path d="M12 3 L20 6.2 V12 c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6.2Z" {...STROKE} />
        <path d="M8.8 12.2 L11.2 14.6 L15.6 10" {...STROKE} />
      </>
    ),
  },
  {
    title: 'Improve Visibility',
    body: 'Know what enters your software supply chain.',
    icon: (
      <>
        <path
          d="M2.5 12 C5 7.5 8.4 5.4 12 5.4 s7 2.1 9.5 6.6 c-2.5 4.5-5.9 6.6-9.5 6.6 S5 16.5 2.5 12Z"
          {...STROKE}
        />
        <circle cx="12" cy="12" r="2.9" {...STROKE} />
      </>
    ),
  },
  {
    title: 'Build Securely',
    body: 'Integrate security into development workflows.',
    icon: (
      <>
        <path d="M8.4 8.6 L4.5 12.5 L8.4 16.4" {...STROKE} />
        <path d="M15.6 8.6 L19.5 12.5 L15.6 16.4" {...STROKE} />
        <path d="M13.6 4.8 L10.4 20.2" {...STROKE} />
      </>
    ),
  },
];

export function SaasDemands(): React.ReactElement {
  return (
    <section data-section="SaasDemands" className="relative bg-white py-section-md">
      <div className="mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          className="mx-auto max-w-[760px] text-center"
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
              Modern Applications <span className="cs-text-gradient-impact">Demand More</span>
            </h2>
          </Reveal>
        </div>

        <RevealStagger className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4 lg:gap-x-0">
          {DEMANDS.map((demand, i) => (
            <RevealItem key={demand.title} className="min-w-0">
              <div
                className={
                  i > 0
                    ? 'flex flex-col lg:border-l lg:border-[rgba(17,17,17,0.08)] lg:pl-8'
                    : 'flex flex-col'
                }
                style={{ paddingRight: 'clamp(0px, 2vw, 28px)' }}
              >
                <span
                  aria-hidden
                  className="flex items-center justify-center"
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background:
                      'linear-gradient(135deg, rgba(154,81,255,0.12) 0%, rgba(44,193,235,0.12) 100%)',
                    color: '#7C4FF0',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                    {demand.icon}
                  </svg>
                </span>

                <h3
                  style={{
                    margin: '18px 0 0',
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--fs-h5)',
                    fontWeight: 600,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.25,
                    color: '#111111',
                  }}
                >
                  {demand.title}
                </h3>

                <p
                  style={{
                    margin: '10px 0 0',
                    maxWidth: '30ch',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--fs-body-sm)',
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.55,
                    color: 'rgba(17,17,17,0.68)',
                  }}
                >
                  {demand.body}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
