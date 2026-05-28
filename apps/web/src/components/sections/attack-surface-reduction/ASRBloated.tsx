import type React from 'react';

// ─── Card data ────────────────────────────────────────────────────────────────
// mobileOrder matches Figma 920:610 top-to-bottom stacking:
// 0 Inherited Vulnerabilities → 1 Oversized SBOM's → 2 Too Many Components → 3 Constant Patching

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

// ─── Section ──────────────────────────────────────────────────────────────────

export function ASRBloated(): React.ReactElement {
  return (
    <section data-section="ASRBloated" className="relative overflow-hidden">

      {/* ── Heading ── */}
      {/*
       * Figma 920:610 heading specs:
       *   "Public images are" → Manrope SemiBold 28px / lh 1.2 / #111 / centered
       *   "bloated"           → gradient 97.33deg #9A51FF 26.48% → #2CC1EB 98.78%
       *                         tracking -1.4px
       */}
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-16 md:pt-[88px]">
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
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden md:block relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pb-[88px]">
        <div className="relative" style={{ minHeight: '443px' }}>
          {/* Pink radial glow behind container */}
          <div
            aria-hidden
            className="absolute pointer-events-none select-none"
            style={{
              left: '50%',
              top: '0px',
              transform: 'translateX(-50%)',
              width: '500px',
              height: '440px',
              background:
                'radial-gradient(ellipse 55% 55% at 50% 55%, rgba(255,76,76,0.22) 0%, rgba(255,76,76,0.10) 45%, rgba(255,76,76,0) 70%)',
              filter: 'blur(18px)',
              zIndex: 0,
            }}
          />

          {/* Container PNG */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/attack-surface-reduction/public-images-container.png"
            alt=""
            className="absolute pointer-events-none select-none"
            style={{
              left: '50%',
              top: '0px',
              transform: 'translateX(-50%)',
              width: '420px',
              height: 'auto',
              WebkitMaskImage:
                'radial-gradient(ellipse 50% 50% at 50% 50%, black 82%, transparent 100%)',
              maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, black 82%, transparent 100%)',
              zIndex: 1,
            }}
            loading="lazy"
            decoding="async"
          />

          {/* ── Cards ── */}
          <div className="absolute" style={{ left: 0, top: 0, zIndex: 2 }}>
            <BloatedCard card={CARDS[0]} />
          </div>
          <div className="absolute" style={{ right: 0, top: 0, zIndex: 2 }}>
            <BloatedCard card={CARDS[1]} />
          </div>
          <div className="absolute" style={{ left: 0, bottom: 0, zIndex: 2 }}>
            <BloatedCard card={CARDS[2]} />
          </div>
          <div className="absolute" style={{ right: 0, bottom: 0, zIndex: 2 }}>
            <BloatedCard card={CARDS[3]} />
          </div>

          {/* ── Connector lines ── */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/attack-surface-reduction/public-images-line-tl.svg"
            alt=""
            className="absolute pointer-events-none select-none"
            style={{ left: '285px', top: '88px', width: '125px', height: 'auto', zIndex: 1 }}
            loading="lazy"
            decoding="async"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/attack-surface-reduction/public-images-line-tr.svg"
            alt=""
            className="absolute pointer-events-none select-none"
            style={{
              right: '285px',
              top: '88px',
              width: '125px',
              height: 'auto',
              transform: 'scaleX(-1)',
              zIndex: 1,
            }}
            loading="lazy"
            decoding="async"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/attack-surface-reduction/public-images-line-bl.svg"
            alt=""
            className="absolute pointer-events-none select-none"
            style={{ left: '295px', bottom: '82px', width: '78px', height: 'auto', zIndex: 1 }}
            loading="lazy"
            decoding="async"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/attack-surface-reduction/public-images-line-br.svg"
            alt=""
            className="absolute pointer-events-none select-none"
            style={{
              right: '295px',
              bottom: '82px',
              width: '78px',
              height: 'auto',
              transform: 'scaleX(-1)',
              zIndex: 1,
            }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {/* ── Mobile layout ── */}
      {/*
       * Figma 920:610 mobile layout:
       *   10px side margins on 360px frame → px-[10px]
       *   Cards: 340×114px each, 16px gap between cards
       *   Order: Inherited (0) → Oversized (1) → TooMany (2) → Constant (3)
       */}
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

// ─── BloatedCard ──────────────────────────────────────────────────────────────

interface BloatedCardProps {
  card: (typeof CARDS)[number];
  mobile?: boolean;
}

function BloatedCard({ card, mobile = false }: BloatedCardProps): React.ReactElement {
  if (mobile) {
    /*
     * Mobile card — Figma 920:610 exact specs:
     *
     * Outer wrapper   : 340px wide, border-radius 20px
     *                   background: rgba(255,76,76,0.4) — the #FF4C4C fill at opacity 0.4
     *                   from bloated-card-bg.svg
     *
     * Inner white body: margin 6px on all sides (inset 6px from outer)
     *                   border-radius 17px
     *                   padding 16px all sides, gap 16px between icon and text
     *                   box-shadow: 6-layer shadow from bloated-card-inner.svg filter
     *
     * Icon box        : 70×70px, border-radius 12px
     *                   fill #fb6d6d + mix-blend-overlay gradient + mix-blend-color #ff7777
     *                   Icon image: 40×40px centred (15px from each edge)
     *
     * Title           : Manrope SemiBold 20px / lh 1.0 / tracking -0.05em / #111
     * Description     : Manrope Regular 14px / lh 1.5 / tracking -0.04em / #111 / opacity 0.8
     */
    return (
      <div
        className="relative w-full rounded-[20px]"
        style={{ maxWidth: '340px' }}
      >
        {/* Outer pink halo — rgba(255,76,76,0.4) creates the pinkish border glow */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-[20px] pointer-events-none"
          style={{ background: 'rgba(255, 76, 76, 0.4)' }}
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
          {/* Icon box — 70×70px with red-coral fill + overlay tints */}
          <div
            className="relative shrink-0 overflow-hidden"
            style={{ width: '70px', height: '70px', borderRadius: '12px' }}
          >
            {/* Base fill #fb6d6d */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ borderRadius: '12px', background: '#fb6d6d' }}
            />
            {/* Highlight gradient overlay */}
            <div
              aria-hidden
              className="absolute inset-0 mix-blend-overlay"
              style={{
                borderRadius: '12px',
                background:
                  'linear-gradient(-20.97deg, rgba(255,255,255,0) 52.8%, rgba(255,255,255,1) 95.95%)',
              }}
            />
            {/* Color blend tint */}
            <div
              aria-hidden
              className="absolute inset-0 mix-blend-color"
              style={{ borderRadius: '12px', background: '#ff7777' }}
            />
            {/* Shield icon: 40×40px centred in 70×70px → 15px each side */}
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

          {/* Text block */}
          <div className="flex flex-col min-w-0" style={{ gap: '8px' }}>
            {/*
             * Title: Manrope SemiBold 20px / lh 1.0 / tracking -1px (-0.05em) / #111
             * Figma: font-['Manrope:SemiBold'] font-semibold text-[20px] tracking-[-1px] leading-none
             */}
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
            {/*
             * Description: Manrope Regular 14px / lh 1.5 / tracking -0.56px (-0.04em)
             *              opacity 0.8 / #111
             * Figma: font-['Manrope:Regular'] text-[14px] leading-[1.5] tracking-[-0.56px] opacity-80
             */}
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

  // ── Desktop card (unchanged from original) ───────────────────────────────
  return (
    <div
      className="relative"
      style={{ width: '303px', height: '166px' }}
    >
      {/* Halo */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: '20px',
          background: 'rgba(255, 76, 76, 0.4)',
        }}
      />

      {/* White card body */}
      <div
        className="absolute bg-white"
        style={{
          inset: '8px',
          borderRadius: '16px',
          boxShadow:
            '0px 120px 120px 0px rgba(22,34,51,0.08), ' +
            '0px 64px 64px 0px rgba(22,34,51,0.12), ' +
            '0px 32px 32px 0px rgba(22,34,51,0.04), ' +
            '0px 24px 24px 0px rgba(22,34,51,0.04), ' +
            '0px 4px 24px 0px rgba(22,34,51,0.04), ' +
            '0px 4px 4px 0px rgba(22,34,51,0.04)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingTop: '24px',
          paddingBottom: '24px',
          paddingLeft: '24px',
          paddingRight: '0px',
          gap: '25px',
        }}
      >
        {/* Icon box */}
        <div
          className="relative shrink-0 overflow-hidden"
          style={{ width: '64px', height: '64px', borderRadius: '12px' }}
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
            style={{ left: '13.5px', top: '13.5px', width: '37px', height: '37px' }}
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Text */}
        <div className="flex flex-col min-w-0" style={{ gap: '8px', maxWidth: '174px' }}>
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
            className="text-[#111]"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--fs-body)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.4,
            }}
          >
            {card.description}
          </p>
        </div>
      </div>
    </div>
  );
}
