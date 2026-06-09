import Link from 'next/link';
import { Reveal } from '@/components/ui/Reveal';

/**
 * Inner content for the SBOM CTA card, rendered inside the Footer's fixed
 * radius-40 slot. The card is taller than the slot, so its bottom is clipped.
 */

const CARD_BG = 'linear-gradient(180deg, #131E8F 0%, #471EC0 100%)';

export function SbomCTA(): React.ReactElement {
  return (
    <div
      data-section="SbomCTA"
      className="absolute inset-0 overflow-hidden"
      style={{ background: CARD_BG }}
    >
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

      <div
        className="hidden md:flex md:flex-col md:gap-y-4 lg:flex-row lg:gap-y-0 absolute inset-0 lg:items-start"
        style={{
          paddingLeft: 'clamp(32px, 5vw, 80px)',
          paddingRight: 'clamp(32px, 5vw, 80px)',
          paddingTop: 'clamp(24px, 3vw, 40px)',
          paddingBottom: 'clamp(24px, 3vw, 40px)',
          columnGap: 'clamp(32px, 5vw, 72px)',
        }}
      >
        <Reveal header className="relative min-w-0 w-full" style={{ maxWidth: 'min(460px, 100%)' }}>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--cta-card-title)',
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
        </Reveal>

        <Reveal
          header
          delay={0.15}
          y={20}
          className="flex flex-col min-w-0 w-full"
          style={{ maxWidth: 'min(460px, 100%)', gap: 'clamp(20px, 2vw, 32px)' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--cta-card-desc)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.4,
              color: 'rgba(255,255,255,0.80)',
              margin: 0,
            }}
          >
            Continuously verifiable SBOMs built for modern software delivery.
          </p>
          <Link
            href="/resource-center"
            className="cs-btn-glass self-start"
            style={
              {
                '--cs-btn-h': 'var(--btn-h-xl)',
                '--cs-btn-px': '20px',
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
              aria-hidden="true"
              role="presentation"
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
        </Reveal>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/cta-cube-noise.webp"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{
          left: '-50px',
          bottom: '-120px',
          width: '240px',
          height: '240px',
          objectFit: 'contain',
          opacity: 0.75,
          zIndex: 0,
        }}
        loading="lazy"
        decoding="async"
      />

      <div
        className="md:hidden absolute inset-0 overflow-hidden"
        style={{
          borderRadius: 'inherit',
          background: 'linear-gradient(212.81deg, #131E8F 36.343%, #471EC0 90.615%)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/sbom/mobile-cta-ellipse.svg"
          alt=""
          aria-hidden
          className="absolute pointer-events-none select-none"
          style={{ left: '-159px', top: '-154px', width: '223px', height: '223px' }}
          loading="lazy"
          decoding="async"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/sbom/mobile-cta-union.svg"
          alt=""
          aria-hidden
          className="absolute pointer-events-none select-none"
          style={{ left: '56px', top: '52px', width: '378px', height: '378px' }}
          loading="lazy"
          decoding="async"
        />

        <div className="relative h-full flex flex-col items-center text-center">
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--cta-card-title)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              color: '#fff',
              width: '276px',
              marginTop: '32px',
              textTransform: 'capitalize',
            }}
          >
            Verify Every Component You Ship
          </p>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--cta-card-desc)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.4,
              color: 'rgba(255,255,255,0.80)',
              width: '265px',
              marginTop: '17px',
            }}
          >
            Continuously verifiable SBOMs built for modern software delivery.
          </p>
          <Link
            href="/resource-center"
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
