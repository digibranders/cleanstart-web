import type React from 'react';

/**
 * ASRApproach — pixel-perfect for Figma 991:107 (desktop) and 920:611 (mobile).
 *
 * Desktop specs (1440px):
 *  - Background: white, section overflow-hidden
 *  - Union TR decoration: 1101×1101px SVG at left=1241px top=-416px (mostly off-screen right)
 *  - Union BL decoration: 1181×1181px SVG at left=-634px top=496px (mostly off-screen left)
 *  - Heading: Figtree Bold 62px (--text-display-md) / lh 1.2 / tracking -0.05em / #111 / centered
 *    "Approach" word: gradient 97.43deg #9A51FF 1.76% → #2CC1EB 98.78%
 *    Heading block width: 444px, centered via margin auto
 *  - Grid: 2×2 grid-cols-2 gap-8 (32px between columns)
 *    Each cell: flex row, items-center
 *    Left cells gap: 32px · Right cells gap: 16px
 *    Icon area: 296×220px overflow-hidden, icon centered within
 *    Glow circle: approach-glow.svg at left=32px top=12px w=165px, inner inset=-26.06%
 *    Title: --text-card-title-lg (22→32px) / Figtree Bold / tracking -0.05em / lh 1.0 / #111
 *    Description: --text-body-lg (16→22px) / Figtree Regular / tracking -0.05em / lh 1.4 / #333
 *    Title→Desc gap: 23px
 *  - Dividers: vertical at left=50%, horizontal at top=50% of grid, gradient #d9d9d9 fade
 *
 * Mobile specs (360px / node 920:611):
 *  - Stacked cards, 328×206px each, rounded-24px, white with drop-shadow
 *  - Icon area: 108×87px with ~80px icon centered
 *  - Glow: approach-glow.svg at left=-1.45px top=0.24px w=79.75px, inset=-26.06%
 *  - Title: Figtree SemiBold 20px / tracking -1px / lh 1.0 / #000
 *  - Description: Figtree Regular 14px / tracking -0.56px / lh 1.1 / #111 op 0.8
 */

// ─── Per-card icon sizes (from Figma node image dimensions) ──────────────────
// Minimal:       193×158px · Bloat: 209×209px
// Deterministic: 199×199px · Secure: 178×178px
const CARDS: {
  icon: string;
  title: string;
  desc: string;
  mobileOrder: number;
  iconW: number;
  iconH: number;
}[] = [
  {
    icon: '/images/attack-surface-reduction/approach-icon-minimal.png',
    title: 'Minimal Foundations',
    desc: 'Only required runtime components',
    mobileOrder: 0,
    iconW: 193,
    iconH: 158,
  },
  {
    icon: '/images/attack-surface-reduction/approach-icon-bloat.png',
    title: 'Bloat Removed',
    desc: 'No shells or unused tooling.',
    mobileOrder: 1,
    iconW: 209,
    iconH: 209,
  },
  {
    icon: '/images/attack-surface-reduction/approach-icon-deterministic.png',
    title: 'Deterministic Builds',
    desc: 'Reproducible and verifiable.',
    mobileOrder: 2,
    iconW: 199,
    iconH: 199,
  },
  {
    icon: '/images/attack-surface-reduction/approach-icon-secure.png',
    title: 'Secure Defaults',
    desc: 'Hardened by default.',
    mobileOrder: 3,
    iconW: 178,
    iconH: 178,
  },
];

// ─── Section ──────────────────────────────────────────────────────────────────

export function ASRApproach(): React.ReactElement {
  return (
    <section data-section="ASRApproach" className="relative bg-white overflow-hidden">

      {/*
       * Union TR — 1101×1101px decorative hex-grid, mostly off-screen right.
       * Figma page-frame coords: left=1241px, top=1284px (section starts ~1700px in page).
       * Relative to section: left=1241px, top=-416px.
       * overflow-hidden clips everything outside the section bounds.
       */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        src="/images/attack-surface-reduction/approach-union-tr.svg"
        alt=""
        style={{
          left: '1241px',
          top: '-416px',
          width: '1101px',
          height: '1101px',
        }}
        loading="lazy"
        decoding="async"
      />

      {/*
       * Union BL — 1181×1181px decorative hex-grid, mostly off-screen left.
       * Figma page-frame coords: left=-634px, top=2196px (section starts ~1700px).
       * Relative to section: left=-634px, top=496px.
       */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        src="/images/attack-surface-reduction/approach-union-bl.svg"
        alt=""
        style={{
          left: '-634px',
          top: '496px',
          width: '1181px',
          height: '1181px',
        }}
        loading="lazy"
        decoding="async"
      />

      {/*
       * Container: px-6 mobile · sm:px-10 tablet · lg:px-[82px] desktop
       * At 1440px: content width = 1440 - 164 = 1276px → each grid column = (1276-32)/2 = 622px ✓
       */}
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 lg:px-[82px]">

        {/*
         * Heading block:
         *   Desktop: Figtree Bold · --text-display-md (62px at 1440) · tracking -0.05em
         *   Figma heading width 444px, always centered (text-center for both mobile and desktop).
         *   "Approach" gradient: 97.43deg #9A51FF 1.76% → #2CC1EB 98.78%
         *   Top padding: ~88px desktop, 64px mobile (matches Figma heading at ~72px below section top).
         *   Bottom margin: ~75px desktop before grid (Figma: 1995-1896 = ~99px gap, approx 75px after heading text).
         */}
        <h2
          className="text-center text-[28px] lg:[font-size:var(--text-display-md)]"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.2,
            color: '#111',
            maxWidth: '444px',
            margin: '0 auto',
            paddingTop: 'clamp(64px, 6.1vw, 88px)',
            marginBottom: 'clamp(40px, 5.2vw, 75px)',
          }}
        >
          The CleanStart{' '}
          <span
            style={{
              background: 'linear-gradient(97.43deg, #9A51FF 1.76%, #2CC1EB 98.78%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Approach
          </span>
        </h2>

        {/* ── Desktop: 2×2 grid with cross-dividers ── */}
        {/*
         * grid-cols-2 gap-8 → column width = (1276-32)/2 = 622px each ✓
         * Dividers are absolute within this relative wrapper.
         * Horizontal: top=50% of grid (between row 1 and row 2)
         * Vertical: left=50% of grid (between columns; at 622+16=638px = 50% of 1276px) ✓
         */}
        <div className="hidden md:block relative pb-[88px]">
          {/* Horizontal hairline — full width, fades in from edges */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: 0,
              right: 0,
              top: '50%',
              height: '1px',
              background:
                'linear-gradient(90deg, rgba(217,217,217,0) 0%, #d9d9d9 47.18%, rgba(217,217,217,0) 100%)',
            }}
          />
          {/* Vertical hairline — full height, fades top and bottom */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: '50%',
              top: 0,
              bottom: 0,
              width: '1px',
              background:
                'linear-gradient(180deg, rgba(217,217,217,0) 0%, #d9d9d9 47.18%, rgba(217,217,217,0) 100%)',
            }}
          />
          <div className="grid grid-cols-2 gap-8">
            {CARDS.map((card, idx) => (
              <ApproachCell
                key={card.title}
                card={card}
                isRight={idx % 2 === 1}
              />
            ))}
          </div>
        </div>

        {/* ── Mobile: stacked cards ── */}
        {/*
         * Figma 920:611: px-[16px] side margins, 328px card width, gap-4 between cards.
         * Order: Minimal(0) → Bloat(1) → Deterministic(2) → Secure(3).
         */}
        <div className="md:hidden mx-auto px-[16px] pb-12 flex flex-col items-center gap-4">
          {[...CARDS]
            .sort((a, b) => a.mobileOrder - b.mobileOrder)
            .map((card) => (
              <ApproachCardMobile key={card.title} card={card} />
            ))}
        </div>
      </div>
    </section>
  );
}

// ─── ApproachCell (desktop) ───────────────────────────────────────────────────
/*
 * Figma desktop cell specs:
 *   Flex row, items-center.
 *   Left cells: gap=32px · Right cells: gap=16px
 *
 *   Glow (absolute, behind icon):
 *     approach-glow.svg, container 165×165px at left=32px top=12px
 *     Inner image expanded via inset:-26.06% → renders ~208px
 *
 *   Icon container: 296×220px overflow-hidden, relative, shrink-0
 *     Icon centered with absolute + translate(-50%,-50%)
 *     Sizes vary per card: 193×158 / 209×209 / 199×199 / 178×178
 *
 *   Title: --text-card-title-lg (22→32px) / Bold / tracking -0.05em / lh 1.0 / #111
 *   Description: --text-body-lg (16→22px) / Regular / Figtree / tracking -0.05em / lh 1.4 / #333
 *   Title→Desc gap: 23px
 */
interface ApproachCellProps {
  card: { icon: string; title: string; desc: string; iconW: number; iconH: number };
  isRight: boolean;
}

function ApproachCell({ card, isRight }: ApproachCellProps): React.ReactElement {
  return (
    <div
      className="relative flex items-center py-10"
      style={{ gap: isRight ? '16px' : '32px' }}
    >
      {/*
       * Glow circle — absolute so it doesn't affect flex layout.
       * Container is 165×165px; glow SVG expands to ~208px via the inset: -26.06% trick.
       * left=32px places it under the icon's left portion; top=12px offsets from row top.
       */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{ left: '32px', top: '12px', width: '165px', height: '165px' }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-26.06%',
            right: '-26.06%',
            bottom: '-26.06%',
            left: '-26.06%',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/attack-surface-reduction/approach-glow.svg"
            alt=""
            className="block max-w-none pointer-events-none select-none"
            style={{ width: '100%', height: '100%' }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {/* Icon container — 296×220px overflow-hidden, icon centered */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ width: '296px', height: '220px' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.icon}
          alt=""
          aria-hidden
          className="absolute pointer-events-none select-none"
          style={{
            width: `${card.iconW}px`,
            height: `${card.iconH}px`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            objectFit: 'contain',
          }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Title + description */}
      <div className="flex flex-col" style={{ gap: '23px' }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-card-title-lg)',
            fontWeight: 700,
            letterSpacing: '-0.05em',
            lineHeight: 1.0,
            color: '#111',
            margin: 0,
          }}
        >
          {card.title}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-body-lg)',
            fontWeight: 400,
            letterSpacing: '-0.05em',
            lineHeight: 1.4,
            color: '#333',
            margin: 0,
          }}
        >
          {card.desc}
        </p>
      </div>
    </div>
  );
}

// ─── ApproachCardMobile ───────────────────────────────────────────────────────
/*
 * Figma 920:611 card specs:
 *   Size:       328×206px · border-radius 24px · white bg · drop-shadow
 *   Image area: 108.267×87px container, centred horizontally; icon ~80px centred
 *   Glow:       approach-glow.svg, container 79.75px at left:-1.45 top:0.24, inset:-26.06%
 *   Gap img→text: 5px
 *   Title:      Figtree SemiBold 20px / lh 1.0 / tracking -1px / #000
 *   Gap:        12px
 *   Desc:       Figtree Regular 14px / lh 1.1 / tracking -0.56px / op 0.8 / maxW 199px
 *   Bottom pad: 26px
 */
interface ApproachCardMobileProps {
  card: { icon: string; title: string; desc: string };
}

function ApproachCardMobile({ card }: ApproachCardMobileProps): React.ReactElement {
  return (
    <div
      className="relative w-full overflow-visible rounded-[24px] bg-white"
      style={{
        maxWidth: '328px',
        minHeight: '206px',
        boxShadow:
          '0 2px 4px rgba(0,0,0,0.04),' +
          '0 4px 12px rgba(0,0,0,0.06),' +
          '0 16px 40px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '20px',
        paddingBottom: '26px',
      }}
    >
      {/* ── Image area: 108.267×87px ── */}
      <div className="relative shrink-0" style={{ width: '108px', height: '87px' }}>
        {/* Purple glow circle */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{ width: '79.75px', height: '79.75px', left: '-1.45px', top: '0.24px' }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-26.06%',
              right: '-26.06%',
              bottom: '-26.06%',
              left: '-26.06%',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              aria-hidden
              src="/images/attack-surface-reduction/approach-glow.svg"
              alt=""
              className="block max-w-none pointer-events-none select-none"
              style={{ width: '100%', height: '100%' }}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        {/* 3D illustration — ~80px, centred in 108×87 container */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src={card.icon}
          alt=""
          className="absolute pointer-events-none select-none"
          style={{
            width: '80px',
            height: '80px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            objectFit: 'contain',
          }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* ── Text block — 5px gap below image area ── */}
      <div
        className="flex flex-col items-center text-center"
        style={{ gap: '12px', marginTop: '5px' }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-card-title-md)',
            fontWeight: 600,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: '#000',
            margin: 0,
          }}
        >
          {card.title}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-body-sm)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.4,
            color: '#111',
            opacity: 0.8,
            maxWidth: '199px',
            margin: 0,
          }}
        >
          {card.desc}
        </p>
      </div>
    </div>
  );
}
