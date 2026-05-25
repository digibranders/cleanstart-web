import Link from 'next/link';

/**
 * Inner content for the For Developers CTA card, rendered inside the Footer's
 * fixed 1276 × 240 (lg) / radius-40 slot. Figma node 857:5874.
 *
 * Distinguishing detail vs every other page CTA: this one uses a **light**
 * background per Figma — white card with two soft purple-pink ellipse blooms
 * (one top-left, one bottom-right) and the shared cleansight grid union, all
 * the same source assets as VulnCTA. Text is dark (#111), button is the solid
 * blue cs-btn-blue (matches Figma's #3960F9 button). Single CTA: "Read the
 * Guide" — no secondary "Talk to an expert" link.
 *
 * Layout mirrors VulnCTA's two-column structure (heading left, body+button
 * right) so the visual rhythm matches the rest of the site's CTAs.
 */
export function DeveloperCTA(): React.ReactElement {
  return (
    <div
      data-section="DeveloperCTA"
      className="absolute inset-0 overflow-hidden"
      style={{ background: '#ffffff' }}
    >
      {/* ── Grid union (radial-gradient grid pattern) — shared cleansight
          asset. The SVG already has `opacity="0.08"` baked into its <path>,
          so no wrapper opacity is needed; adding one here just compounds and
          renders the grid invisible. Position matches Figma node 857:5875
          exactly so the visible grid quadrant lands on the right half of
          the card. */}
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
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Purple bloom — top-left (Figma Ellipse 46683) ── */}
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

      {/* ── Purple bloom — bottom-right (Figma Ellipse 46682) ── */}
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

      {/* ── Content row ── */}
      <div
        className="hidden md:flex md:flex-col md:gap-y-4 lg:flex-row lg:gap-y-0 absolute inset-0 items-start"
        style={{
          paddingLeft: 'clamp(28px, 4vw, 64px)',
          paddingRight: 'clamp(28px, 4vw, 64px)',
          paddingTop: 'clamp(20px, 3vw, 32px)',
          paddingBottom: 'clamp(20px, 3vw, 32px)',
          columnGap: 'clamp(32px, 5vw, 100px)',
        }}
      >
        {/* Left column — heading. */}
        <p
          className="relative min-w-0 w-full font-display font-bold"
          style={{
            fontSize: 'var(--cta-card-title)',
            fontWeight: 700,
            letterSpacing: '-0.05em',
            lineHeight: 1.05,
            color: '#111',
            maxWidth: 'min(420px, 100%)',
            textWrap: 'balance',
            margin: 0,
            zIndex: 1,
          }}
        >
          Build on Trusted Foundations
        </p>

        {/* Right column — description + button. */}
        <div
          className="flex flex-col min-w-0 w-full"
          style={{ maxWidth: '500px', gap: 'clamp(16px, 1.5vw, 24px)', zIndex: 1 }}
        >
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--cta-card-desc)',
              fontWeight: 400,
              letterSpacing: '-0.04em',
              lineHeight: 1.4,
              color: 'rgba(17,17,17,0.80)',
              margin: 0,
            }}
          >
            Reduce inherited risk with minimal, hardened container images designed for modern
            development workflows.
          </p>

          <Link
            href="/cleanstart-images"
            className="cs-btn-blue self-start"
            style={
              {
                '--cs-btn-h': '44px',
                '--cs-btn-px': '16px',
                '--cs-btn-fs': '16px',
              } as React.CSSProperties
            }
          >
            <span>Read the Guide</span>
            <svg
              className="cs-cta-arrow"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden
              style={{ marginLeft: '8px' }}
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
        </div>
      </div>

      {/* ── Mobile layout ── */}
      <div className="flex md:hidden absolute inset-0 flex-col items-start justify-center" style={{ padding: '32px 28px' }}>
        <p
          className="font-display font-bold"
          style={{
            fontSize: '26px',
            fontWeight: 700,
            letterSpacing: '-0.05em',
            lineHeight: 1.05,
            color: '#111',
            margin: 0,
            marginBottom: '12px',
          }}
        >
          Build on Trusted Foundations
        </p>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '15px',
            fontWeight: 400,
            letterSpacing: '-0.03em',
            lineHeight: 1.4,
            color: 'rgba(17,17,17,0.80)',
            marginBottom: '20px',
          }}
        >
          Reduce inherited risk with minimal, hardened container images designed for modern
          development workflows.
        </p>
        <Link
          href="/cleanstart-images"
          className="cs-btn-blue"
          style={
            {
              '--cs-btn-h': '44px',
              '--cs-btn-px': '16px',
              '--cs-btn-fs': '15px',
            } as React.CSSProperties
          }
        >
          <span>Read the Guide</span>
          <svg
            className="cs-cta-arrow"
            width="16"
            height="16"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden
            style={{ marginLeft: '8px' }}
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
      </div>
    </div>
  );
}
