import Link from 'next/link';

/*
 * Figma node 732-412 — "Build on Trusted Foundations" footer CTA
 *
 * Positioned inside <Footer cta={...}> — parent handles the -170px overlap
 * Card background: linear-gradient(180deg, #131e8f → #471ec0 at 111.05%)
 * Heading: ~55px Manrope Bold, white, letter-spacing -0.05em
 * Description: ~21px Sora, white 80% opacity, letter-spacing -0.04em
 * Column gap: 68px, card padding: 80px 100px
 * Reuses cta-cube-noise.png decoration from ciso (same visual family)
 */

export function DeveloperCTA(): React.ReactElement {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #131e8f 0%, #471ec0 111.05%)',
      }}
    >
      {/* Cyan glow — top-left */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: '-139px',
          top: '-168px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'rgba(44,193,235,0.12)',
          filter: 'blur(80px)',
        }}
      />

      {/* Purple glow — right */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          right: '0',
          bottom: '-80px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'rgba(154,81,255,0.2)',
          filter: 'blur(80px)',
        }}
      />

      {/* Cube decoration (reuses ciso asset — same visual family) */}
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

      {/* Content row */}
      <div
        className="relative flex flex-col lg:flex-row lg:items-center"
        style={{ padding: 'clamp(40px, 6vw, 80px) clamp(32px, 5vw, 80px)', gap: 'clamp(32px, 5vw, 72px)' }}
      >
        {/* Left: headline — auto-wraps 2 or 3 lines via balance */}
        <p
          className="relative text-white"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(26px, 3.1vw, 44px)',
            fontWeight: 600,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            maxWidth: 'min(460px, 100%)',
            textWrap: 'balance',
            zIndex: 1,
          }}
        >
          Build on Trusted Foundations
        </p>

        {/* Right: description + CTAs */}
        <div className="relative flex flex-col" style={{ maxWidth: 'min(460px, 100%)', gap: 'clamp(20px, 2vw, 32px)', zIndex: 1 }}>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(0.875rem, 1.09vw, 1.3125rem)',
              fontWeight: 400,
              letterSpacing: '-0.04em',
              lineHeight: 1.4,
              color: 'rgba(255,255,255,0.8)',
              maxWidth: '500px',
            }}
          >
            Start building on pre-hardened, verifiable container foundations that eliminate
            inherited risk before your first deployment.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Link
              href="/cleanstart-images"
              className="cs-btn-glass self-start"
              style={
                {
                  '--cs-btn-px': '18px',
                  '--cs-btn-fs': '18px',
                } as React.CSSProperties
              }
            >
              <span>Explore Free Secure Image</span>
              <svg
                className="cs-cta-arrow"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden
              >
                <path
                  d="M3 9h11m0 0l-4-4m4 4l-4 4"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            <Link
              href="/contact-us"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1rem',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.75)',
                textDecoration: 'none',
                alignSelf: 'center',
                letterSpacing: '-0.01em',
                borderBottom: '1px solid rgba(255,255,255,0.3)',
                paddingBottom: '2px',
                lineHeight: 1.4,
              }}
            >
              Talk to an expert
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
