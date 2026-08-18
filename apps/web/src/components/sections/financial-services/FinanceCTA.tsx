/*
 * Financial services CTA — the white card rendered in the Footer's locked CTA
 * slot, on the site's shared CTA treatment: decorative purple grid, corner glow
 * ellipses, a violet cube, dark text and a solid blue button.
 *
 * The proposal supplies a headline and a button and no supporting line, so the
 * card carries exactly those two.
 */

'use client';

import Link from 'next/link';
import { Reveal } from '@/components/ui/Reveal';

const HEADLINE = 'Build Trusted Financial Software with CleanStart';
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

      {/* Decorative violet cube — bottom-left corner of the card. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/vulnerability-remediation/cta-cube.webp"
        alt=""
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          left: '-40px',
          bottom: '-40px',
          width: '220px',
          height: '220px',
          objectFit: 'contain',
          opacity: 0.5,
          zIndex: 3,
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Desktop / tablet — headline left, button right. */}
      <div
        className="absolute inset-0 hidden items-center md:flex md:flex-col md:items-start md:justify-center md:gap-y-6 lg:flex-row lg:justify-between lg:gap-y-0"
        style={{
          paddingLeft: 'clamp(28px, 4vw, 64px)',
          paddingRight: 'clamp(28px, 4vw, 64px)',
          paddingTop: 'clamp(20px, 3vw, 32px)',
          paddingBottom: 'clamp(20px, 3vw, 32px)',
          columnGap: 'clamp(32px, 5vw, 72px)',
        }}
      >
        <Reveal
          header
          className="relative w-full min-w-0"
          style={{ maxWidth: 'min(620px, 100%)', zIndex: 2 }}
        >
          <p
            className="font-display"
            style={{
              fontSize: 'var(--cta-card-title)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              color: '#111111',
              textWrap: 'balance',
              margin: 0,
            }}
          >
            {HEADLINE}
          </p>
        </Reveal>

        <Reveal header delay={0.15} y={20} className="relative shrink-0" style={{ zIndex: 2 }}>
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

      {/* Mobile (< md) — centered column with cube decoration. */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden text-center md:hidden"
        style={{ padding: '32px 28px' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/vulnerability-remediation/cta-cube.webp"
          alt=""
          className="pointer-events-none absolute select-none"
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

        <p
          className="font-display"
          style={{
            position: 'relative',
            zIndex: 2,
            fontSize: 'var(--cta-card-title)',
            fontWeight: 600,
            letterSpacing: '-0.04em',
            lineHeight: 1.15,
            color: '#111111',
            margin: 0,
            maxWidth: '320px',
            textWrap: 'balance',
          }}
        >
          {HEADLINE}
        </p>

        <Link
          href={BUTTON_HREF}
          className="cs-btn-blue"
          style={
            {
              position: 'relative',
              zIndex: 2,
              marginTop: '24px',
              '--cs-btn-h': '44px',
              '--cs-btn-px': '20px',
              '--cs-btn-fs': '15px',
            } as React.CSSProperties
          }
        >
          <span>{BUTTON_LABEL}</span>
        </Link>
      </div>
    </div>
  );
}
