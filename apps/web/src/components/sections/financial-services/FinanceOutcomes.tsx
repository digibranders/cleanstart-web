import type React from 'react';
import { Fragment } from 'react';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';

/*
 * "Outcomes That Drive Impact" — the page's close, on the site's own outcomes
 * treatment (CisoValidationOutcomes): figures set straight on the dark band,
 * separated by the lit glow bars that section ships, with no container and no
 * rules.
 *
 * The gradient, the mesh planes and the aura belong to FinanceProofBand, which
 * paints them once across this section and the conformance record above it, so
 * the two read as a single closing passage instead of two stacked bands.
 *
 * The titles are sized to the longest one so all four read on a single line at
 * every desktop width. "Strengthen Governance" is ~10.8x the font size wide,
 * and the narrowest desktop column is 1024's, so the type floor is set from
 * there and scales up to 26px at 1440; `lg:whitespace-nowrap` then guarantees
 * the single line rather than leaving it to chance. The row holds four-across
 * across the whole desktop range and only reflows at tablet.
 * Copy is the proposal's, verbatim.
 */

interface Outcome {
  title: string;
  body: string;
}

const OUTCOMES: readonly [Outcome, Outcome, Outcome, Outcome] = [
  { title: 'Reduce Risk', body: 'Start with verified software components.' },
  { title: 'Improve Compliance', body: 'Generate evidence of software integrity.' },
  { title: 'Accelerate Delivery', body: 'Give developers secure foundations.' },
  { title: 'Strengthen Governance', body: 'Know what software runs everywhere.' },
];

/*
 * The lit column separator this band ships on the CISO page.
 *
 * Sized a little taller than the figures and centred against them, so the bar
 * reads as a measured separator with an even overhang top and bottom rather
 * than a line trailing off below the text. All four figures resolve to the
 * same height (one-line title, two-line body), so centring the row keeps the
 * titles on a common baseline.
 */
function GlowBar(): React.ReactElement {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      aria-hidden
      src="/images/ciso/outcomes-glow-bar1.webp"
      alt=""
      className="pointer-events-none hidden shrink-0 select-none lg:block"
      style={{ width: '2px', height: 'clamp(96px, 8vw, 116px)', objectFit: 'fill' }}
      loading="lazy"
      decoding="async"
    />
  );
}

function OutcomeFigure({ title, body }: Outcome): React.ReactElement {
  return (
    <div className="flex min-w-0 flex-col">
      <h3
        className="font-display text-white lg:whitespace-nowrap"
        style={{
          fontSize: 'clamp(18px, 1.8vw, 26px)',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          lineHeight: 1.15,
          // The global base rule balances h1–h4, which splits these titles at
          // exactly the widths this layout is sized to avoid.
          textWrap: 'normal',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          marginTop: 'clamp(10px, 1.1vw, 16px)',
          maxWidth: '23ch',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--fs-body-sm)',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          lineHeight: 1.5,
          color: 'rgba(255,255,255,0.74)',
        }}
      >
        {body}
      </p>
    </div>
  );
}

export function FinanceOutcomes(): React.ReactElement {
  return (
    <section
      data-section="FinanceOutcomes"
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)',
      }}
    >
      {/* Grid mesh planes — the CISO outcomes decoration, read as a measured
          surface rather than another glow. No aura: screen-blended over this
          band it lifted the copy toward violet and cost it contrast. */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          left: 'calc(-220 / 1920 * 100vw)',
          top: '-150px',
          width: '803px',
          height: '803px',
          opacity: 0.3,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/ciso/outcomes-vector-center.svg"
          alt=""
          style={{ display: 'block', width: '100%', height: '100%' }}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          right: 'calc(-340 / 1920 * 100vw)',
          bottom: '-320px',
          width: '979px',
          height: '979px',
          opacity: 0.2,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/ciso/outcomes-vector-corner.svg"
          alt=""
          style={{ display: 'block', width: '100%', height: '100%' }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Footer contract: as the last background section on this CTA page, the
          bottom padding uses --spacing-section-cta so the overlapping footer CTA
          card has matching breathing room. */}
      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 pt-section-md sm:px-10"
        style={{ paddingBottom: 'var(--spacing-section-cta)' }}
      >
        <Reveal header>
          <h2
            className="mx-auto text-center font-display text-white"
            style={{
              maxWidth: '18ch',
              fontSize: 'var(--fs-h2)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              marginBottom: 'clamp(44px, 5vw, 84px)',
            }}
          >
            Outcomes That{' '}
            <span
              style={{
                background: 'linear-gradient(-44deg, #2CC1EB 0%, #9A51FF 65%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Drive Impact
            </span>
          </h2>
        </Reveal>

        {/* Desktop (lg+) — one row of four, held apart by light. Same layout
            at every desktop width; the type scales, the arrangement does not. */}
        <RevealStagger
          className="hidden lg:flex lg:items-center lg:justify-between"
          style={{ gap: 'clamp(10px, 1.2vw, 22px)' }}
        >
          {OUTCOMES.map((outcome, i) => (
            <Fragment key={outcome.title}>
              <RevealItem className="min-w-0 flex-1">
                <OutcomeFigure {...outcome} />
              </RevealItem>
              {i < OUTCOMES.length - 1 ? <GlowBar /> : null}
            </Fragment>
          ))}
        </RevealStagger>

        {/* Tablet and below — two-up, then stacked. */}
        <RevealStagger
          className="grid grid-cols-1 sm:grid-cols-2 lg:hidden"
          style={{ columnGap: 'clamp(24px, 4vw, 56px)', rowGap: 'clamp(32px, 4.5vw, 48px)' }}
        >
          {OUTCOMES.map((outcome) => (
            <RevealItem key={outcome.title}>
              <OutcomeFigure {...outcome} />
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
