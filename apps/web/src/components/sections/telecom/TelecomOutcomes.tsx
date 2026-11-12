import type React from 'react';
import { Fragment } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Activity, BadgeCheck, Layers, TrendingDown } from 'lucide-react';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';
import { H2_STYLE } from './type';

/*
 * "Outcomes That Drive Telecom Resilience": the page's close, on the site's
 * outcomes treatment (FinanceOutcomes, CisoValidationOutcomes): figures set
 * straight on the dark band, held apart by the lit glow bars, no container.
 * A small line icon heads each figure, in the brief's mock.
 *
 * As the last band before the Footer's overlapping CTA card, bottom padding is
 * --spacing-section-cta (the footer contract).
 *
 * Copy is the brief's, verbatim.
 */

interface Outcome {
  Icon: LucideIcon;
  line1: string;
  line2: string;
  body: string;
}

const OUTCOMES: readonly [Outcome, Outcome, Outcome, Outcome] = [
  {
    Icon: TrendingDown,
    line1: 'Reduced',
    line2: 'Software Risk',
    body: 'Minimize vulnerabilities across network workloads.',
  },
  {
    Icon: Layers,
    line1: 'Standardized',
    line2: 'Foundations',
    body: 'Deploy verified components across network environments.',
  },
  {
    Icon: Activity,
    line1: 'Operational',
    line2: 'Resilience',
    body: 'Improve software reliability across distributed infrastructure.',
  },
  {
    Icon: BadgeCheck,
    line1: 'Compliance',
    line2: 'Readiness',
    body: 'Demonstrate software assurance with verifiable evidence.',
  },
];

function GlowBar(): React.ReactElement {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      aria-hidden
      src="/images/ciso/outcomes-glow-bar1.webp"
      alt=""
      className="pointer-events-none hidden shrink-0 select-none lg:block"
      style={{ width: '2px', height: 'clamp(150px, 12vw, 172px)', objectFit: 'fill' }}
      loading="lazy"
      decoding="async"
    />
  );
}

function OutcomeFigure({ Icon, line1, line2, body }: Outcome): React.ReactElement {
  return (
    <div className="flex min-w-0 flex-col">
      <span
        aria-hidden
        className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl"
        style={{
          background: 'rgba(154,81,255,0.16)',
          border: '1px solid rgba(185,164,255,0.28)',
          color: '#C9B8FF',
        }}
      >
        <Icon size={22} strokeWidth={1.75} />
      </span>
      <h3
        className="font-display text-white"
        style={{
          fontSize: 'clamp(18px, 1.6vw, 22px)',
          fontWeight: 700,
          letterSpacing: '-0.035em',
          lineHeight: 1.25,
        }}
      >
        <span className="block">{line1}</span>{' '}
        <span className="block">{line2}</span>
      </h3>
      <p
        style={{
          marginTop: 'clamp(10px, 1.1vw, 14px)',
          maxWidth: '28ch',
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

export function TelecomOutcomes(): React.ReactElement {
  return (
    <section
      data-section="TelecomOutcomes"
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{ left: 'calc(-220 / 1920 * 100vw)', top: '-150px', width: '803px', height: '803px', opacity: 0.3 }}
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
        style={{ right: 'calc(-340 / 1920 * 100vw)', bottom: '-320px', width: '979px', height: '979px', opacity: 0.2 }}
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

      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 pt-section-md sm:px-10"
        style={{ paddingBottom: 'var(--spacing-section-cta)' }}
      >
        <Reveal header>
          <h2
            className="text-center text-white"
            style={{ ...H2_STYLE, maxWidth: '20ch', margin: '0 auto clamp(44px, 5vw, 84px)' }}
          >
            Outcomes That Drive{' '}
            <span className="cs-text-gradient-impact">Telecom Resilience</span>
          </h2>
        </Reveal>

        {/* One list at every width: separate desktop and mobile branches put
            each heading in the DOM twice. */}
        <RevealStagger className="grid grid-cols-1 gap-x-[clamp(24px,4vw,56px)] gap-y-[clamp(32px,4.5vw,48px)] sm:grid-cols-2 lg:flex lg:items-center lg:justify-between lg:gap-[clamp(16px,2vw,32px)]">
          {OUTCOMES.map((o, i) => (
            <Fragment key={o.line1 + o.line2}>
              <RevealItem className="min-w-0 flex-1">
                <OutcomeFigure {...o} />
              </RevealItem>
              {i < OUTCOMES.length - 1 ? <GlowBar /> : null}
            </Fragment>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
