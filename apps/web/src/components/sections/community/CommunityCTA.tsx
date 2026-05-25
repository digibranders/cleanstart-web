/**
 * Community page CTA — rendered inside the Footer's locked 1200px × 300px
 * radius-40 slot. Matches the Figma "Ready to secure the future?" card
 * (node 732:4357): bg-gradient-to-b from-#131e8f to-#471ec0, left-aligned
 * two-column layout, 3D element on the right.
 */
export function CommunityCTA() {
  return (
    <div
      className="absolute inset-0 flex flex-col items-start gap-8 overflow-hidden p-8 md:flex-row md:items-start md:gap-0 md:p-12 lg:p-[clamp(32px,4vw,48px)_clamp(32px,5vw,80px)]"
      style={{
        background: 'linear-gradient(180deg, #131E8F 0%, #471EC0 111.05%)',
      }}
    >
      {/* Decorative blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: '-8%',
          top: '-40%',
          width: '640px',
          height: '640px',
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(127,82,255,0.45) 0%, transparent 70%)',
        }}
      />

      {/* Headline */}
      <p
        className="relative z-10 font-display font-bold text-white md:shrink-0"
        style={{
          fontSize: 'var(--cta-card-title)',
          fontWeight: 600,
          lineHeight: 1.1,
          letterSpacing: '-0.04em',
          maxWidth: 'min(460px, 100%)',
          textWrap: 'balance',
        }}
      >
        Ready to secure the future?
      </p>

      {/* Body + CTA */}
      <div className="relative z-10 flex flex-col items-start gap-6 md:pl-[clamp(32px,5vw,72px)]" style={{ maxWidth: 'min(460px, 100%)' }}>
        <p
          className="font-sans font-normal text-white/80"
          style={{
            fontSize: 'clamp(1rem, 1.4vw, 1.3125rem)',
            lineHeight: '1.4',
            letterSpacing: '-0.04em',
            maxWidth: '493px',
          }}
        >
          Join the community building the world&apos;s most trusted software ecosystem.
        </p>
        <a
          href="#join"
          className="cs-btn-glass flex items-center gap-2"
          style={{
            ['--cs-btn-px' as string]: '18px',
            ['--cs-btn-fs' as string]: '18px',
            color: '#111111',
            letterSpacing: '-0.01em',
            fontWeight: 500,
          }}
        >
          Join the Community
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M4 10h12m0 0-5-5m5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>

      {/* 3D decorative element — right side, hidden below md */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          right: 'clamp(20px, 4vw, 60px)',
          top: '50%',
          transform: 'translateY(-50%) rotate(-12.05deg)',
          width: 'clamp(160px, 16vw, 254px)',
          aspectRatio: '254 / 258',
          opacity: 0.8,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/community/cta-3d-element.png"
          alt=""
          width={254}
          height={258}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  );
}
