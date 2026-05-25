import Link from 'next/link';

/**
 * Inner content for the SBOM CTA card, rendered inside the Footer's
 * fixed 1276 × 330 / radius-40 slot.
 *
 * Figma node 161:21812 — card 1276 × 375px (bottom 45px clipped by slot).
 * Background: #131E8F → #471EC0 diagonal gradient.
 * Bird sits at left-[308px] top-[221.5px], partially clipped at bottom.
 */

const CARD_BG = 'linear-gradient(180deg, #131E8F 0%, #471EC0 100%)';

export function SbomCTA(): React.ReactElement {
  return (
    <div
      data-section="SbomCTA"
      className="absolute inset-0 overflow-hidden"
      style={{ background: CARD_BG }}
    >
      {/* ── SVG grid union (radial gradient pattern) ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/cleansight/cta-union.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{
          left: '547px',
          top: '-220px',
          width: '1101px',
          height: '1101px',
          opacity: 0.08,
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Ellipse — top-left ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: '-139px',
          top: '-168px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: '#DF9BFF',
          opacity: 0.8,
          filter: 'blur(121.5px)',
        }}
      />

      {/* ── Ellipse — bottom-right ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: '1159px',
          top: '244px',
          width: '511px',
          height: '511px',
          borderRadius: '50%',
          background: '#DF9BFF',
          opacity: 0.8,
          filter: 'blur(121.5px)',
        }}
      />

      {/* ── Desktop layout (md+) — vertical stack until lg, then 2-col ── */}
      <div
        className="hidden md:flex md:flex-col md:gap-y-4 lg:flex-row lg:gap-y-0 absolute inset-0 lg:items-center"
        style={{
          paddingLeft: 'clamp(32px, 5vw, 80px)',
          paddingRight: 'clamp(32px, 5vw, 80px)',
          paddingTop: 'clamp(40px, 5vw, 80px)',
          paddingBottom: 'clamp(40px, 5vw, 80px)',
          columnGap: 'clamp(32px, 5vw, 72px)',
        }}
      >
        {/* Left column — heading, auto-wraps 2 or 3 lines via balance */}
        <div className="relative min-w-0 w-full" style={{ maxWidth: 'min(460px, 100%)' }}>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(26px, 3.1vw, 44px)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              color: '#fff',
              margin: 0,
              textWrap: 'balance',
            }}
          >
            Verify Every Component You Ship
          </p>
        </div>

        {/* Right column — body + button */}
        <div
          className="flex flex-col min-w-0 w-full"
          style={{ maxWidth: 'min(460px, 100%)', gap: 'clamp(20px, 2vw, 32px)' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(16px, 1.5vw, 20px)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.4,
              color: 'rgba(255,255,255,0.80)',
              margin: 0,
            }}
          >
            Continuously updated, cryptographically verifiable software inventories built for modern
            software supply chains.
          </p>
          <Link
            href="/contact-us"
            className="cs-btn-glass self-start"
            style={
              {
                '--cs-btn-h': 'var(--btn-h-xl)',
                '--cs-btn-px': '32px',
                '--cs-btn-fs': '16px',
              } as React.CSSProperties
            }
          >
            Download the SBOM Datasheet
            <svg
              className="cs-cta-arrow"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              aria-hidden
            >
              <path
                d="M4 11h14M12 5l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* Cube decoration — overflows bottom-right corner at 80% opacity (matches CISO CTA) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/cta-cube-noise.png"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{
          right: '-60px',
          bottom: '-100px',
          width: '300px',
          height: '300px',
          objectFit: 'contain',
          opacity: 0.75,
          zIndex: 0,
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Mobile (Figma 817:1558) ──
           Diagonal gradient card, rounded-24, Union + Ellipse decorations, centered text.
           NB: sits inside the footer CTA slot (absolute inset-0). */}
      <div
        className="md:hidden absolute inset-0 overflow-hidden"
        style={{
          borderRadius: 'inherit',
          /* Figma: linear-gradient(212.81deg, #131e8f 36.343%, #471ec0 90.615%)
             Overrides parent's 180deg vertical gradient with correct diagonal angle. */
          background: 'linear-gradient(212.81deg, #131e8f 36.343%, #471ec0 90.615%)',
        }}
      >
        {/* Ellipse top-left glow — Figma: left=-159 top=-154 size=223.442px
            SVG viewBox=435.953px with overflow:visible handles the visual expansion. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/sbom/mobile-cta-ellipse.svg"
          alt=""
          aria-hidden
          className="absolute pointer-events-none select-none"
          style={{ left: '-159px', top: '-154px', width: '223px', height: '223px' }}
          loading="lazy"
        />

        {/* Union grid decoration — Figma: left=56 top=52 size=378px.
            No extra CSS opacity — SVG path already has opacity="0.1" baked in. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/sbom/mobile-cta-union.svg"
          alt=""
          aria-hidden
          className="absolute pointer-events-none select-none"
          style={{ left: '56px', top: '52px', width: '378px', height: '378px' }}
          loading="lazy"
        />

        {/* Content — centered */}
        <div className="relative h-full flex flex-col items-center text-center">
          {/* Heading — Figma: top=32px, w=276px, capitalize, bold 28px leading-1.2 */}
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1.2,
              color: '#fff',
              width: '276px',
              marginTop: '32px',
              textTransform: 'capitalize',
            }}
          >
            Verify Every Component You Ship
          </p>

          {/* Body — Figma: top=116px, w=265px, tracking=-0.64px, opacity=0.8.
              Heading ends ~99px (2 lines×28px×1.2) → gap = 116-99 = 17px. */}
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              fontWeight: 400,
              letterSpacing: '-0.64px',
              lineHeight: 1.5,
              color: 'rgba(255,255,255,0.80)',
              width: '265px',
              marginTop: '17px',
            }}
          >
            Continuously updated, cryptographically verifiable software inventories built for modern
            software supply chains.
          </p>

          {/* Button — Figma: top=236px, px=24px, no arrow icon.
              Body ~4 lines×24px=96px → body ends ~212px → gap = 236-212 = 24px. */}
          <Link
            href="/contact-us"
            className="cs-btn-glass"
            style={
              {
                '--cs-btn-px': '24px',
                '--cs-btn-fs': '16px',
                marginTop: '24px',
              } as React.CSSProperties
            }
          >
            Download the SBOM Datasheet
          </Link>
        </div>
      </div>
    </div>
  );
}
