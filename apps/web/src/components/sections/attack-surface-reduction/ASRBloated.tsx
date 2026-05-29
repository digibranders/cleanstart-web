import type React from 'react';
import { Reveal } from '@/components/ui/Reveal';

// mobileOrder controls the top-to-bottom stacking order of the cards on mobile.

const CARDS = [
  {
    id: 'tl',
    mobileOrder: 0,
    title: 'Inherited Vulnerabilities',
    description: 'Risk exist before application code is added.',
  },
  {
    id: 'tr',
    mobileOrder: 2,
    title: 'Too Many Components',
    description: 'Public images include packages most workloads never use.',
  },
  {
    id: 'bl',
    mobileOrder: 1,
    title: "Oversized SBOM's",
    description: 'More components to track, justify, and audit.',
  },
  {
    id: 'br',
    mobileOrder: 3,
    title: 'Constant Patching',
    description: 'The same base issues reappear release after release.',
  },
] as const;

export function ASRBloated(): React.ReactElement {
  return (
    <section data-section="ASRBloated" className="relative overflow-hidden">

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-16 md:pt-[88px]">
        <Reveal header>
        <h2
          className="text-center text-[#111] text-[28px] lg:[font-size:var(--fs-h2)]"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            letterSpacing: '-0.04em',
            lineHeight: 1.2,
            marginBottom: 'clamp(24px, 2.5vw, 48px)',
          }}
        >
          <span className="block">Public Images Are</span>
          <span
            className="block"
            style={{
              background: 'linear-gradient(97.33deg, #9A51FF 26.48%, #2CC1EB 98.78%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-1.4px',
            }}
          >
            bloated
          </span>
        </h2>
        </Reveal>
      </div>

      {/*
       * Desktop/tablet composition scales as a single group: every child uses
       * intrinsic pixel coordinates against a fixed 1140×425 canvas, the wrapper
       * establishes a container-query context, and the inner box applies
       * `transform: scale(calc(100cqw / 1140px))` from its top-left origin so
       * cards, glows, the connector SVG, and the container PNG scale together.
       * The wrapper's aspect-ratio keeps flow height in sync so nothing below
       * jumps; below md the layout falls through to the mobile stack.
       */}
      <div className="hidden md:block relative pb-[88px] px-6 sm:px-10">
        <div
          className="relative w-full mx-auto"
          style={{
            maxWidth: '1140px',
            aspectRatio: '1140 / 425',
            containerType: 'inline-size',
          }}
        >
        <div
          className="absolute top-0 left-0"
          style={{
            width: '1140px',
            height: '425px',
            transformOrigin: 'top left',
            // length / length = unitless number (modern CSS calc). Must
            // divide by `1140px` (a length), not `1140` (a number) — the
            // latter yields a length, which `scale()` rejects.
            transform: 'scale(calc(100cqw / 1140px))',
          }}
        >
          {/* Radial glow behind the container */}
          <div
            aria-hidden
            className="absolute pointer-events-none select-none"
            style={{
              left: '570px',
              top: '212.5px',
              transform: 'translate(-50%, -50%)',
              width: '540px',
              height: '460px',
              background:
                'radial-gradient(ellipse 55% 55% at 50% 50%, rgba(44,193,235,0.22) 0%, rgba(44,193,235,0.10) 45%, rgba(44,193,235,0) 70%)',
              filter: 'blur(18px)',
              zIndex: 0,
            }}
          />

          {/* Connector SVG scaled below its intrinsic size so the cards sit
              closer to the container without breaking the dot anchor points. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/attack-surface-reduction/public-images-connectors.svg"
            alt=""
            className="absolute pointer-events-none select-none"
            style={{
              left: '300px',
              top: '101.25px',
              width: '540px',
              height: '222.5px',
              zIndex: 1,
            }}
            loading="lazy"
            decoding="async"
          />

          {/*
           * Container PNG with two colour tints overlaid. The wrapper uses a
           * radial mask to fade the edges, `isolation: isolate` so the blend
           * modes only mix with siblings in this group (not the glow or page
           * background behind), and `overflow: hidden` so the tints' blur halos
           * stop at the wrapper box and can't leak past the masked edges. The
           * PNG stays fully opaque; the tints sit on top with
           * `mix-blend-mode: color` so hue and saturation come from the tint
           * while luminance comes from the PNG, preserving detail and contrast.
           */}
          <div
            aria-hidden
            className="absolute pointer-events-none select-none"
            style={{
              left: '570px',
              top: '212.5px',
              transform: 'translate(-50%, -50%)',
              width: '440px',
              isolation: 'isolate',
              overflow: 'hidden',
              WebkitMaskImage:
                'radial-gradient(ellipse 50% 50% at 50% 50%, black 82%, transparent 100%)',
              maskImage:
                'radial-gradient(ellipse 50% 50% at 50% 50%, black 82%, transparent 100%)',
              zIndex: 2,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/attack-surface-reduction/public-images-container.png"
              alt=""
              style={{ width: '100%', height: 'auto', display: 'block' }}
              loading="lazy"
              decoding="async"
            />

            {/* Purple tint — upper-left quadrant */}
            <div
              style={{
                position: 'absolute',
                left: '0%',
                top: '0%',
                width: '85.1%',
                height: '65.4%',
                background: '#DF9BFF',
                mixBlendMode: 'color',
                filter: 'blur(42px)',
              }}
            />

            {/* Blue tint — lower-right quadrant */}
            <div
              style={{
                position: 'absolute',
                left: '40.9%',
                top: '44.2%',
                width: '59.1%',
                height: '55.8%',
                background: '#2CC1EB',
                mixBlendMode: 'color',
                filter: 'blur(42px)',
              }}
            />
          </div>

          {/* Each card is positioned so the connector dot lands at the centre of its inner edge */}
          <div className="absolute" style={{ left: '1.39px', top: '30.64px', zIndex: 3 }}>
            <BloatedCard card={CARDS[0]} />
          </div>
          <div className="absolute" style={{ left: '835.36px', top: '30.64px', zIndex: 3 }}>
            <BloatedCard card={CARDS[1]} />
          </div>
          <div className="absolute" style={{ left: '20.35px', top: '244.12px', zIndex: 3 }}>
            <BloatedCard card={CARDS[2]} />
          </div>
          <div className="absolute" style={{ left: '807.34px', top: '244.12px', zIndex: 3 }}>
            <BloatedCard card={CARDS[3]} />
          </div>
        </div>
        </div>
      </div>

      {/* Mobile layout — stacked cards, ordered via mobileOrder. */}
      <div className="md:hidden mx-auto px-[10px] pb-12 flex flex-col items-center gap-4">
        {[...CARDS]
          .sort((a, b) => a.mobileOrder - b.mobileOrder)
          .map((card) => (
            <BloatedCard key={card.id} card={card} mobile />
          ))}
      </div>
    </section>
  );
}

interface BloatedCardProps {
  card: (typeof CARDS)[number];
  mobile?: boolean;
}

function BloatedCard({ card, mobile = false }: BloatedCardProps): React.ReactElement {
  if (mobile) {
    return (
      <div
        className="relative w-full rounded-[20px]"
        style={{ maxWidth: '340px' }}
      >
        {/* Outer sky-blue halo — matches the #2CC1EB connector line stroke */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-[20px] pointer-events-none"
          style={{ background: 'rgba(44, 193, 235, 0.4)' }}
        />

        {/* White card body — 6px inset creates the visible halo "border" */}
        <div
          className="relative bg-white rounded-[17px]"
          style={{
            margin: '6px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '16px',
            gap: '16px',
            boxShadow:
              '0 2.18px 2.18px rgba(22,34,51,0.04),' +
              '0 2.18px 13.08px rgba(22,34,51,0.04),' +
              '0 13.08px 13.08px rgba(22,34,51,0.04),' +
              '0 17.44px 17.44px rgba(22,34,51,0.04),' +
              '0 34.87px 34.87px rgba(22,34,51,0.12),' +
              '0 65.38px 65.38px rgba(223,155,255,0.08)',
          }}
        >
          {/* Icon box — red-coral fill + overlay tints */}
          <div
            className="relative shrink-0 overflow-hidden"
            style={{ width: '70px', height: '70px', borderRadius: '12px' }}
          >
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ borderRadius: '12px', background: '#fb6d6d' }}
            />
            <div
              aria-hidden
              className="absolute inset-0 mix-blend-overlay"
              style={{
                borderRadius: '12px',
                background:
                  'linear-gradient(-20.97deg, rgba(255,255,255,0) 52.8%, rgba(255,255,255,1) 95.95%)',
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0 mix-blend-color"
              style={{ borderRadius: '12px', background: '#ff7777' }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              aria-hidden
              src="/images/attack-surface-reduction/public-images-card-icon.svg"
              alt=""
              className="absolute pointer-events-none select-none"
              style={{ left: '15px', top: '15px', width: '40px', height: '40px' }}
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="flex flex-col min-w-0" style={{ gap: '8px' }}>
            <p
              className="text-[#111]"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h4)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
              }}
            >
              {card.title}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-body-sm)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.4,
                color: '#111',
                opacity: 0.8,
              }}
            >
              {card.description}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Desktop card — 303×150 compact variant.
  return (
    <div
      className="relative"
      style={{ width: '303px', height: '150px' }}
    >
      {/* Halo — sky-blue #2CC1EB to match connector lines */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: '18px',
          background: 'rgba(44, 193, 235, 0.4)',
        }}
      />

      {/* White card body — 6px halo inset for a tighter outline */}
      <div
        className="absolute bg-white"
        style={{
          inset: '6px',
          borderRadius: '12px',
          boxShadow:
            '0px 120px 120px 0px rgba(22,34,51,0.08), ' +
            '0px 64px 64px 0px rgba(22,34,51,0.12), ' +
            '0px 32px 32px 0px rgba(22,34,51,0.04), ' +
            '0px 24px 24px 0px rgba(22,34,51,0.04), ' +
            '0px 4px 24px 0px rgba(22,34,51,0.04), ' +
            '0px 4px 4px 0px rgba(22,34,51,0.04)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: '14px',
          paddingBottom: '14px',
          paddingLeft: '16px',
          paddingRight: '0px',
          gap: '14px',
        }}
      >
        {/* Icon box — reduced 64 → 56 to balance the smaller type */}
        <div
          className="relative shrink-0 overflow-hidden"
          style={{ width: '56px', height: '56px', borderRadius: '11px' }}
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ borderRadius: '11px', background: '#fb6d6d' }}
          />
          <div
            aria-hidden
            className="absolute inset-0 mix-blend-overlay"
            style={{
              borderRadius: '11px',
              background:
                'linear-gradient(-20.97deg, rgba(255,255,255,0) 52.8%, rgba(255,255,255,1) 95.95%)',
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 mix-blend-color"
            style={{ borderRadius: '11px', background: '#ff7777' }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/attack-surface-reduction/public-images-card-icon.svg"
            alt=""
            className="absolute pointer-events-none select-none"
            style={{ left: '12px', top: '12px', width: '32px', height: '32px' }}
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="flex flex-col min-w-0" style={{ gap: '6px', maxWidth: '180px' }}>
          <p
            className="text-[#111]"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              fontWeight: 600,
              letterSpacing: '-0.027em',
              lineHeight: 1.15,
            }}
          >
            {card.title}
          </p>
          <p
            className="text-[#111]"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              fontWeight: 400,
              letterSpacing: '-0.0175em',
              lineHeight: 1.35,
              opacity: 0.85,
            }}
          >
            {card.description}
          </p>
        </div>
      </div>
    </div>
  );
}
