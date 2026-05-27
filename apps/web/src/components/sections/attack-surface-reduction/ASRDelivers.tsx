import type React from 'react';
import Image from 'next/image';

// ─── Data ─────────────────────────────────────────────────────────────────────

const BENEFITS = [
  { title: 'Reduced Security Exposure', desc: 'Fewer inherited vulnerabilities.' },
  { title: 'Smaller CVE Backlogs', desc: 'Less remediation overhead.' },
  { title: 'Faster Compliance Reviews', desc: 'Cleaner, simpler SBOMs.' },
  { title: 'Lower Operational Overhead', desc: 'Less patching and maintenance.' },
] as const;

// ─── Section ──────────────────────────────────────────────────────────────────
/*
 * Desktop (Figma 783:452):
 *   Full-bleed photo (right-weighted) + left-to-right purple overlay.
 *   4-column benefits row with vertical gradient separators.
 *
 * Mobile (Figma 366:6670 — 360×611px):
 *   Photo: exact Figma offsets (left -33.16%, w 173.52%, h 124.69%), no brightness filter.
 *   Overlay starts at 115px from top (Figma 366:6672) — provides all darkening.
 *   Heading: Manrope Bold 28px / lh 1.2 / centred / w-200px / top: 32px.
 *   "your business" → gradient 94.09deg #9A51FF 26.48% → #2CC1EB 98.78%,
 *                      tracking -1.4px.
 *   Benefits: left: 32px, top: 164px, flex-col gap-24px,
 *             items separated by 147×1px gradient dividers.
 */

export function ASRDelivers(): React.ReactElement {
  return (
    <section
      data-section="ASRDelivers"
      className="relative overflow-hidden md:min-h-0"
      style={{ minHeight: 'clamp(680px, 50vw, 711px)' }}
    >
      {/* ── Mobile background photo ── */}
      {/*
       * Figma 366:6671: full-bleed 360×611 image (pre-cropped asset).
       * The gradient overlay (below) provides all the darkening.
       */}
      <div aria-hidden className="absolute inset-0 overflow-hidden md:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/attack-surface-reduction/s4-person-mobile.png"
          alt=""
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* ── Desktop background photo ── */}
      <div aria-hidden className="absolute inset-0 hidden md:block">
        <Image
          src="/images/attack-surface-reduction/s4-person.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-right"
          style={{ filter: 'brightness(0.55)' }}
          loading="lazy"
        />
      </div>

      {/* ── Desktop overlay: left → right purple ── */}
      <div
        aria-hidden
        className="absolute inset-0 hidden md:block pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(19,30,143,0.92) 0%, rgba(71,30,192,0.70) 45%, rgba(71,30,192,0.30) 75%, rgba(0,0,0,0.10) 100%)',
        }}
      />

      {/* ── Mobile overlay: full-section purple gradient ── */}
      {/*
       * Figma stops (Selection colors / Linear, top→bottom):
       *   0%   #471EC0 @ 100%
       *   17%  #461EBF @ 87%
       *   57%  #421EBC @ 50%
       *   100% #421EBC @ 0%
       */}
      <div
        aria-hidden
        className="absolute inset-0 md:hidden pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(71,30,192,1) 0%, rgba(70,30,191,0.87) 17%, rgba(66,30,188,0.5) 57%, rgba(66,30,188,0) 100%)',
        }}
      />

      {/* ── Desktop content ── */}
      <div className="relative hidden md:flex flex-col mx-auto max-w-[var(--container-default)] px-6 sm:px-10 py-section-lg h-full">
        {/* Heading */}
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h2)',
            fontWeight: 600,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: 'white',
            maxWidth: '32.5rem',
            marginBottom: 'clamp(3rem, 8vw, 8.75rem)',
          }}
        >
          What this delivers for{' '}
          <span className="cs-text-gradient-impact">your business</span>
        </h2>

        {/* 4 columns + 3 vertical separators */}
        <div className="flex items-stretch justify-between gap-6 lg:gap-8">
          {BENEFITS.map((b, i) => (
            <div key={b.title} className="flex items-stretch gap-6 lg:gap-8 flex-1">
              <BenefitColumn title={b.title} desc={b.desc} />
              {i < BENEFITS.length - 1 && <DesktopSeparator />}
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile content ── */}
      <div className="absolute inset-0 md:hidden">

        {/* Heading — 200px wide, centred, 32px from top */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '32px',
            transform: 'translateX(-50%)',
            width: '200px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h3)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.2,
              color: 'white',
              margin: 0,
            }}
          >
            What this
          </p>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h3)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.2,
              color: 'white',
              margin: 0,
            }}
          >
            {'delivers for '}
            <span
              style={{
                background: 'linear-gradient(94.09deg, #9A51FF 26.48%, #2CC1EB 98.78%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent',
                letterSpacing: '-1.4px',
              }}
            >
              your business
            </span>
          </p>
        </div>

        {/* Benefits list — left: 32px, top: 164px, gap-24px */}
        <div
          style={{
            position: 'absolute',
            left: '32px',
            top: '164px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {BENEFITS.flatMap((b, i) => [
            <MobileBenefit key={b.title} title={b.title} desc={b.desc} />,
            ...(i < BENEFITS.length - 1 ? [<MobileDivider key={`d-${i}`} />] : []),
          ])}
        </div>
      </div>
    </section>
  );
}

// ─── Desktop: BenefitColumn ───────────────────────────────────────────────────

function BenefitColumn({
  title,
  desc,
}: {
  title: string;
  desc: string;
}): React.ReactElement {
  return (
    <div
      className="flex flex-col flex-1 min-w-0"
      style={{ gap: '0.75rem', maxWidth: '16.4375rem' /* Figma 263px / 16 */ }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-h3)',
          fontWeight: 600,
          letterSpacing: '-0.04em',
          lineHeight: 1.1,
          color: 'white',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--fs-body)',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          lineHeight: 1.4,
          color: '#DDDDDD',
        }}
      >
        {desc}
      </p>
    </div>
  );
}

// ─── Desktop: DesktopSeparator ────────────────────────────────────────────────

function DesktopSeparator(): React.ReactElement {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      aria-hidden
      src="/images/attack-surface-reduction/business-delivers-separator.svg"
      alt=""
      className="self-center shrink-0 pointer-events-none select-none"
      style={{
        width: '1px',
        height: 'clamp(5rem, 9vw, 7.6875rem)', // Figma 123 px max
      }}
      loading="lazy"
      decoding="async"
    />
  );
}

// ─── Mobile: MobileBenefit ────────────────────────────────────────────────────
/*
 * Figma 366:6676/80/84/88 specs:
 *   Container : 194px wide · flex-col · gap 6px
 *   Title     : Manrope SemiBold 20px / lh 1.0 / tracking -1px / white / max-w 173px
 *   Desc      : Manrope Regular 14px / lh 1.5 / tracking -0.56px / white / opacity 0.8 / max-w 185px
 */
function MobileBenefit({
  title,
  desc,
}: {
  title: string;
  desc: string;
}): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '194px' }}>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-h4)',
          fontWeight: 600,
          letterSpacing: '-0.04em',
          lineHeight: 1.1,
          color: 'white',
          maxWidth: '173px',
          margin: 0,
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--fs-body-sm)',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          lineHeight: 1.4,
          color: 'white',
          opacity: 0.8,
          maxWidth: '185px',
          margin: 0,
        }}
      >
        {desc}
      </p>
    </div>
  );
}

// ─── Mobile: MobileDivider ────────────────────────────────────────────────────
/*
 * Figma Rectangle 19 — 1×147px SVG gradient line rotated -90° to produce
 * a 147×1px horizontal divider: transparent → white → transparent.
 * Reproduced in CSS to avoid the rotated-SVG container trick.
 */
function MobileDivider(): React.ReactElement {
  return (
    <div
      aria-hidden
      style={{
        width: '147px',
        height: '1px',
        flexShrink: 0,
        background:
          'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 49.32%, rgba(153,153,153,0) 99.18%)',
      }}
    />
  );
}
