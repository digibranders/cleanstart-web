import type React from 'react';
import Link from 'next/link';

/*
 * FinanceCTA — content for the Footer's floating CTA card. The card geometry
 * (size, overlap, rounding, clipping) is owned by Footer.tsx; this component
 * only paints inside the slot, following the same two-column desktop / stacked
 * mobile split the other solutions pages use.
 */
export function FinanceCTA(): React.ReactElement {
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: '#ffffff' }}>
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          left: '-139px',
          top: '-168px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'rgba(223, 155, 255, 0.35)',
          filter: 'blur(90px)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none sm:block"
        style={{
          right: '-120px',
          bottom: '-150px',
          width: '360px',
          height: '360px',
          borderRadius: '50%',
          background: 'rgba(139, 205, 255, 0.30)',
          filter: 'blur(110px)',
        }}
      />

      {/* Mobile — stacked and centred; no decorative artwork at this size. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center sm:hidden">
        <p
          style={{
            width: '270px',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--cta-card-title)',
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: '-0.04em',
            color: '#111',
            margin: 0,
          }}
        >
          Build Trusted Financial Software with CleanStart
        </p>
        <p
          style={{
            width: '270px',
            marginTop: '16px',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--cta-card-desc)',
            fontWeight: 400,
            lineHeight: 1.4,
            letterSpacing: '-0.02em',
            color: 'rgba(17, 17, 17, 0.8)',
          }}
        >
          Secure every layer. Prove every component. Deliver with confidence.
        </p>
        <Link
          href="/contact-us"
          className="cs-btn-blue"
          style={
            {
              marginTop: '22px',
              '--cs-btn-px': '24px',
              '--cs-btn-fs': '16px',
              '--cs-btn-h': '44px',
              whiteSpace: 'nowrap',
            } as React.CSSProperties
          }
        >
          Talk to a Security Expert
        </Link>
      </div>

      {/* Desktop — headline left, supporting copy + action right. */}
      <div
        className="absolute inset-0 hidden flex-row items-start overflow-hidden sm:flex"
        style={{
          padding: 'clamp(28px, 4vw, 48px) clamp(32px, 6.35vw, 122px)',
          gap: 'clamp(24px, 2.2vw, 32px)',
        }}
      >
        <p
          className="relative flex-shrink-0"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--cta-card-title)',
            fontWeight: 600,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            maxWidth: 'min(380px, 100%)',
            textWrap: 'balance',
            color: '#111',
            margin: 0,
          }}
        >
          Build Trusted Financial Software with CleanStart
        </p>

        <div
          className="relative flex flex-col"
          style={{ maxWidth: 'min(540px, 100%)', gap: 'clamp(16px, 1.25vw, 24px)' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--cta-card-desc)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.4,
              color: 'rgba(17, 17, 17, 0.8)',
              textWrap: 'balance',
              margin: 0,
            }}
          >
            Secure every layer. Prove every component. Deliver with confidence.
          </p>

          <Link
            href="/contact-us"
            className="cs-btn-blue self-start"
            style={
              {
                '--cs-btn-px': '18px',
                '--cs-btn-fs': '18px',
              } as React.CSSProperties
            }
          >
            <span>Talk to a Security Expert</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
