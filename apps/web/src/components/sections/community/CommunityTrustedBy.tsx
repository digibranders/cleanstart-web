import Image from 'next/image';

// Figma node 732:3467 — logos confirmed visible (non-blank exports)
// Order matches Figma row: Livlong · Hitachi · Aurascape · Vi · Encora
const LOGOS = [
  { src: '/images/community/logo-loteria.png', alt: 'Livlong Insurance', w: 217, h: 55 },
  { src: '/images/community/logo-hitachi.png', alt: 'Hitachi', w: 138, h: 55 },
  { src: '/images/community/logo-purestorage.png', alt: 'Aurascape', w: 157, h: 55 },
  { src: '/images/community/logo-vi.png', alt: 'Vi', w: 61, h: 55 },
  { src: '/images/community/logo-encora.png', alt: 'Encora', w: 140, h: 40 },
];

export function CommunityTrustedBy() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Decorative purple ellipse — top-left corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: '-91px',
          top: '-66px',
          width: '258px',
          height: '258px',
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(196,70,239,0.25) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      {/* Decorative purple ellipse — bottom-right corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          right: '-60px',
          bottom: '-30px',
          width: '258px',
          height: '258px',
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(196,70,239,0.25) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative py-[clamp(48px,7vw,100px)]">
        {/* Heading */}
        <h2
          className="font-display font-bold text-center mb-[clamp(32px,4vw,56px)]"
          style={{
            fontSize: 'clamp(2rem, 4vw, 3.875rem)',
            lineHeight: '1.05',
            letterSpacing: '-0.05em',
          }}
        >
          <span style={{ color: '#111111' }}>Trusted by industry</span>{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                'linear-gradient(-5.38deg, rgb(44, 193, 235) 0%, rgb(154, 81, 255) 63.963%)',
            }}
          >
            leaders
          </span>
        </h2>

        {/* ── Infinite logo ticker ─────────────────────────────────────────────────
            .cs-marquee provides: display:flex; width:max-content;
            animation: cs-marquee-rtl linear infinite (defined in globals.css).
            Doubled logo list means -50% translateX = exactly one logo-set width
            → seamless loop with no jump.
            mask-image fades logos into the background on both edges.
        ──────────────────────────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden"
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
          }}
        >
          <div
            className="cs-marquee items-center"
            style={{
              gap: 'clamp(48px, 5.208vw, 100px)',
              animationDuration: '28s',
            }}
          >
            {[...LOGOS, ...LOGOS].map((logo, i) => (
              <div
                key={i}
                className="flex-none flex items-center justify-center"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.w}
                  height={logo.h}
                  sizes="(max-width: 768px) 100px, 180px"
                  className="h-8 w-auto max-w-[180px] object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
