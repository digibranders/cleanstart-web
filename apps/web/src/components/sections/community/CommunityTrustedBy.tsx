import Image from 'next/image';
import { Reveal } from "@/components/ui/Reveal";

const LOGOS = [
  { src: '/images/community/logo-loteria.webp', alt: 'Livlong Insurance', w: 217, h: 55 },
  { src: '/images/community/logo-hitachi.webp', alt: 'Hitachi', w: 138, h: 55 },
  { src: '/images/community/logo-purestorage.webp', alt: 'Aurascape', w: 157, h: 55 },
  { src: '/images/community/logo-vi.webp', alt: 'Vi', w: 61, h: 55 },
  { src: '/images/community/logo-encora.webp', alt: 'Encora', w: 140, h: 40 },
];

export function CommunityTrustedBy() {
  return (
    <section className="relative overflow-hidden bg-white">
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
        <Reveal header>
          <h2
            className="font-display font-bold text-center mb-[clamp(32px,4vw,56px)]"
            style={{
              fontSize: 'var(--fs-h2)',
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
        </Reveal>

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
              animationDuration: '42s',
            }}
          >
            {/*
              The keyframe animates 0 → -50%, moving exactly two copies' width.
              Rendering the list four times keeps the viewport covered through the
              wrap point: a doubled-only list shows empty background once the
              viewport is wider than one copy. Per-item margin-right (not flex
              gap) keeps spacing identical across the seam.
            */}
            {[...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS].map((logo, i) => (
              <div
                key={i}
                className="flex h-10 w-[160px] shrink-0 items-center justify-center mr-12"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.w}
                  height={logo.h}
                  sizes="160px"
                  className="h-8 max-w-[140px] w-auto object-contain"
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
