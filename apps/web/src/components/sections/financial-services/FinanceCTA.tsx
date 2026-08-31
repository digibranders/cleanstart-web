/*
 * Financial services CTA — the white card rendered in the Footer's locked CTA
 * slot, on the site's shared CTA treatment: decorative purple grid, corner glow
 * ellipses, a violet cube, dark text and a solid blue button.
 *
 * Layout matches FipsCTA and VulnCTA: headline left, supporting line and button
 * stacked on the right, both columns vertically centred in the slot.
 *
 * NOTE — DESCRIPTION is the one string on this page not taken from the client
 * proposal, which supplies a headline and a button for this card and nothing
 * else. Without it the content block came to 89px in a 260px card, so
 * everything hugged the top and left 164px of dead space with the decorative
 * cube stranded in it. It is written to set up the conversation the button
 * promises rather than to restate the headline. Flag it for client sign-off.
 */

'use client';

import Link from 'next/link';
import { Reveal } from '@/components/ui/Reveal';

const HEADLINE = 'Build Trusted Financial Software with CleanStart';
const DESCRIPTION =
  'Talk through your compliance requirements and see how verified components fit your existing stack.';
const BUTTON_LABEL = 'Talk to a Security Expert';
const BUTTON_HREF = '/contact-us';

export function FinanceCTA(): React.ReactElement {
  return (
    <div
      data-section="FinanceCTA"
      className="relative h-full w-full overflow-hidden"
      style={{ background: '#ffffff' }}
    >
      {/* Decorative radial-faded purple grid. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/cleansight/cta-union.svg"
        alt=""
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          left: '547px',
          top: '-220px',
          width: '1101px',
          height: '1101px',
          opacity: 0.5,
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Ellipse glow — top-left. */}
      <div
        aria-hidden
        className="pointer-events-none absolute select-none lg:hidden"
        style={{
          left: '-158px',
          top: '-134px',
          width: '223.44px',
          height: '223.44px',
          borderRadius: '50%',
          background: '#DF9BFF',
          opacity: 0.8,
          filter: 'blur(53px)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          left: '-139px',
          top: '-168px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: '#DF9BFF',
          opacity: 0.8,
          filter: 'blur(121.5px)',
          zIndex: 2,
        }}
      />

      {/* Ellipse glow — bottom-right. */}
      <div
        aria-hidden
        className="pointer-events-none absolute select-none lg:hidden"
        style={{
          right: '-145px',
          bottom: '-141px',
          width: '223.44px',
          height: '223.44px',
          borderRadius: '50%',
          background: '#DF9BFF',
          opacity: 0.8,
          filter: 'blur(53px)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          left: '1159px',
          top: '244px',
          width: '511px',
          height: '511px',
          borderRadius: '50%',
          background: '#DF9BFF',
          opacity: 0.8,
          filter: 'blur(121.5px)',
          zIndex: 1,
        }}
      />

      {/* Decorative violet cube — bottom-RIGHT corner. It used to sit
          bottom-left, where it ran under the headline's last line. The right
          side of the card is clear below the button, so the cube reads as
          decoration there instead of as something behind the text. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/vulnerability-remediation/cta-cube.webp"
        alt=""
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          right: '-60px',
          bottom: '-50px',
          width: '170px',
          height: '170px',
          objectFit: 'contain',
          opacity: 0.5,
          zIndex: 3,
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Smaller cube for the stacked layout. `lg:hidden` rather than
          `md:hidden`: the large cube above is `lg:block`, so gating this one at
          md left 768-1023px with no cube at all. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/vulnerability-remediation/cta-cube.webp"
        alt=""
        className="pointer-events-none absolute select-none lg:hidden"
        style={{
          right: '-24px',
          bottom: '-24px',
          width: '120px',
          height: '120px',
          objectFit: 'contain',
          opacity: 0.85,
          zIndex: 1,
        }}
        loading="lazy"
        decoding="async"
      />

      {/*
       * One content block across all widths, on the same grid LibrariesCTA and
       * the other product CTAs use: stacked and centred below lg, two columns
       * above it.
       *
       * `lg:items-start` is the point of the grid. The previous flex row centred
       * each column on its own axis, and the right column is taller (three lines
       * plus a button), so the headline settled below the supporting line's
       * first line and the two read as misaligned. Top-aligning the columns and
       * centring the grid as a whole (`lg:content-center`) puts their first
       * lines on one baseline.
       *
       * This also replaces a duplicated mobile block that repeated the headline,
       * description and button in the DOM at every width.
       */}
      <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-5 px-8 text-center md:px-12 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:content-center lg:items-start lg:justify-center lg:gap-x-[clamp(32px,4vw,56px)] lg:p-[clamp(32px,4vw,56px)_clamp(40px,5vw,72px)] lg:text-left">
        <Reveal
          header
          className="relative z-10 w-full min-w-0"
          style={{ maxWidth: 'min(460px, 100%)' }}
        >
          <p
            className="font-display"
            style={{
              fontSize: 'var(--cta-card-title)',
              fontWeight: 600,
              letterSpacing: 'var(--cta-card-title-ls)',
              lineHeight: 'var(--cta-card-title-lh)',
              color: '#111111',
              textWrap: 'balance',
              margin: 0,
            }}
          >
            {HEADLINE}
          </p>
        </Reveal>

        <Reveal
          header
          delay={0.15}
          y={20}
          className="relative z-10 flex w-full min-w-0 flex-col items-center gap-[18px] lg:items-start"
        >
          <p
            className="text-center font-sans lg:text-left"
            style={{
              color: 'rgba(17, 17, 17, 0.8)',
              maxWidth: '660px',
              fontSize: 'var(--cta-card-desc)',
              fontWeight: 400,
              letterSpacing: 'var(--cta-card-desc-ls)',
              lineHeight: 'var(--cta-card-desc-lh)',
              margin: 0,
            }}
          >
            {DESCRIPTION}
          </p>

          <Link
            href={BUTTON_HREF}
            className="cs-btn-blue"
            style={
              {
                '--cs-btn-h': '44px',
                '--cs-btn-px': '20px',
                '--cs-btn-fs': '16px',
              } as React.CSSProperties
            }
          >
            <span>{BUTTON_LABEL}</span>
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
