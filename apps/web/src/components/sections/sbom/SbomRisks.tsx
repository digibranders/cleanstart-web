import Image from 'next/image';

/**
 * Figma frame 161:21113 — 1920 × 1088 "When SBOMs Fall Short, Risk Grows"
 *
 * Desktop: White background section with a 2×2 grid of risk cards.
 * Mobile (Figma 910:360 / 817:1281): Stacked white cards (328×206px, r=24).
 *   Each card:
 *     • white bg SVG (mobile-risk-card-bg-v2.svg)
 *     • icon area 108.267×87px at left:calc(50%+6.13px) top:20px, -translateX(50%)
 *     • purple glow 79.75×79.75px container (SVG expands to 121.32px via inset:-20.78px)
 *     • risk PNG icon (per-card size, card 1 offset-positioned, cards 2–4 centered)
 *     • text block at top:112px, centered, gap:12px
 */

type Risk = {
  readonly id: string;
  readonly icon: string;
  readonly mobileIcon: string;
  readonly iconAlt: string;
  readonly title: string;
  readonly body: string;
  /** Mobile icon display width (px). Card 1 uses overflow container. */
  readonly mobileIconW: number;
  /** Mobile icon display height (px). */
  readonly mobileIconH: number;
  /** Body text width for mobile (px) — per Figma node widths. */
  readonly mobileBodyW: number;
};

const RISKS: readonly Risk[] = [
  {
    id: 'incomplete',
    icon: '/images/sbom/risk-icon-incomplete.png',
    mobileIcon: '/images/sbom/mobile-risk-icon-1.png',
    iconAlt: 'Incomplete Visibility icon',
    title: 'Incomplete Visibility',
    body: 'Missing packages and dependencies hide risk.',
    // Figma: outer 129.164×96px at left:-14.45px top:-5px; inner 86.53%×104.52% at left:8.15% top:-2.03%
    // Effective position in icon-area: left≈-4px top≈-7px, size≈112×100px
    mobileIconW: 112,
    mobileIconH: 100,
    mobileBodyW: 199,
  },
  {
    id: 'traceability',
    icon: '/images/sbom/risk-icon-traceability.png',
    mobileIcon: '/images/sbom/mobile-risk-icon-2.png',
    iconAlt: 'Broken Traceability icon',
    title: 'Broken Traceability',
    body: 'Disconnected inventories weaken provenance tracking.',
    mobileIconW: 80,
    mobileIconH: 73,
    mobileBodyW: 181,
  },
  {
    id: 'stale',
    icon: '/images/sbom/risk-icon-stale.png',
    mobileIcon: '/images/sbom/mobile-risk-icon-3.png',
    iconAlt: 'Stale Data icon',
    title: 'Stale Data',
    body: 'Static SBOMs quickly become outdated.',
    mobileIconW: 81,
    mobileIconH: 73,
    mobileBodyW: 199,
  },
  {
    id: 'compliance',
    icon: '/images/sbom/risk-icon-compliance.png',
    mobileIcon: '/images/sbom/mobile-risk-icon-4.png',
    iconAlt: 'Compliance Exposure icon',
    title: 'Compliance Exposure',
    body: 'Incomplete inventories increase audit complexity.',
    mobileIconW: 91,
    mobileIconH: 82,
    mobileBodyW: 199,
  },
];

const vw = (n: number): string => `${(n / 1920) * 100}vw`;

export function SbomRisks(): React.ReactElement {
  return (
    <section
      data-section="SbomRisks"
      className="relative overflow-hidden bg-white"
      style={{ paddingTop: 'clamp(56px, 8vw, 120px)', paddingBottom: 'clamp(56px, 8vw, 120px)' }}
    >
      {/* Decorative radial halos — Figma 1920 coords (top-right + bottom-left) */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: vw(1347),
          top: vw(-565),
          width: vw(1101),
          height: vw(1101),
          opacity: 0.1,
          background: 'radial-gradient(50% 50% at 50% 50%, #640DFB 0%, rgba(100, 13, 251, 0) 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: vw(-621),
          top: vw(509),
          width: vw(1181),
          height: vw(1181),
          opacity: 0.1,
          background: 'radial-gradient(50% 50% at 50% 50%, #640DFB 0%, rgba(100, 13, 251, 0) 100%)',
        }}
      />

      <div className="relative mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Section heading */}
        <div className="text-center mb-8 md:mb-16">
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 4vw, 56px)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1.2,
              color: '#111',
            }}
          >
            {'Static SBOMs Create Blind '}
            <span className="cs-text-gradient-impact">Spots</span>
          </h2>
        </div>

        {/* ── DESKTOP 2×2 grid (md+) ── */}
        <div className="hidden md:grid md:grid-cols-2" style={{ gap: '0' }}>
          {RISKS.map((risk, i) => {
            const isRight = i % 2 === 1;
            const isBottom = i >= 2;
            return (
              <div
                key={risk.id}
                className="relative flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start"
                style={{
                  padding: 'clamp(20px, 2.5vw, 40px) clamp(16px, 2.5vw, 48px)',
                }}
              >
                {/* Right divider — only in 2-col layout (md+) */}
                {!isRight && (
                  <div
                    aria-hidden
                    className="hidden md:block absolute right-0 top-6 bottom-6 w-px"
                    style={{ backgroundColor: 'rgba(217,217,217,0.8)' }}
                  />
                )}
                {/* Bottom divider */}
                {!isBottom && (
                  <div
                    aria-hidden
                    className="absolute bottom-0 left-4 right-4"
                    style={{ height: '1px', backgroundColor: 'rgba(217,217,217,0.8)' }}
                  />
                )}

                {/* Purple glow */}
                <div
                  aria-hidden
                  className="pointer-events-none select-none absolute"
                  style={{
                    left: isRight ? 'auto' : '32px',
                    top: '12px',
                    width: '165px',
                    height: '165px',
                    borderRadius: '50%',
                    background:
                      'radial-gradient(closest-side, rgba(154,81,255,0.22) 0%, rgba(154,81,255,0) 70%)',
                  }}
                />

                {/* 3D icon */}
                <div className="relative shrink-0 w-24 h-24 sm:w-36 sm:h-36 lg:w-[220px] lg:h-[220px]">
                  <Image
                    src={risk.icon}
                    alt={risk.iconAlt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 96px, (max-width: 1280px) 144px, 220px"
                    loading="lazy"
                  />
                </div>

                {/* Text */}
                <div
                  className="flex flex-col text-center sm:text-left"
                  style={{ gap: '12px', paddingTop: '4px' }}
                >
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(22px, 2.4vw, 32px)',
                      fontWeight: 700,
                      letterSpacing: '-0.04em',
                      lineHeight: 1.1,
                      color: '#111',
                    }}
                  >
                    {risk.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'clamp(15px, 1.4vw, 20px)',
                      fontWeight: 400,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.4,
                      color: '#333',
                    }}
                  >
                    {risk.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── MOBILE stacked cards (< md) ── Figma 910:360, 360px canvas ── */}
        <div className="md:hidden flex flex-col items-center" style={{ gap: '16px' }}>
          {RISKS.map((risk) => (
            <MobileRiskCard key={risk.id} risk={risk} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Mobile risk card (Figma 910:360 pixel-perfect) ─────────────────── */
/**
 * Card: 328×206px, white bg, r=24.
 * Icon area: 108.267×87px, left:calc(50%+6.13px), top:20px, -translateX(50%).
 * Glow container: 79.75×79.75px at left:-1.45px top:0.24px inside icon-area;
 *   SVG expands via inset:-20.78px → visual glow = 121.32px (opacity blurred purple).
 * Card 1 icon: absolutely positioned left:-4px top:-7px, 112×100px.
 * Cards 2–4 icons: centered in icon-area, per-card sizes.
 * Text block: absolute left:50% top:112px -translateX(50%), gap:12px.
 */
function MobileRiskCard({ risk }: { risk: Risk }): React.ReactElement {
  const isCard1 = risk.id === 'incomplete';

  return (
    <div className="relative" style={{ width: '328px', height: '206px' }}>
      {/* White card background + border SVG */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/sbom/mobile-risk-card-bg-v2.svg"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        loading="lazy"
      />

      {/* Icon area — 108.267×87px, slightly right of center per Figma */}
      <div
        className="absolute overflow-visible"
        style={{
          left: 'calc(50% + 6.13px)',
          top: '20px',
          transform: 'translateX(-50%)',
          width: '108.267px',
          height: '87px',
        }}
      >
        {/* Purple glow — 79.75px container, SVG expands 26.06% outward = 121.32px */}
        <div
          aria-hidden
          className="absolute pointer-events-none select-none"
          style={{
            left: '-1.45px',
            top: '0.24px',
            width: '79.75px',
            height: '79.75px',
            overflow: 'visible',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/sbom/mobile-risk-glow-v2.svg"
            alt=""
            aria-hidden
            style={{
              position: 'absolute',
              left: '-20.78px',
              top: '-20.78px',
              width: '121.32px',
              height: '121.32px',
            }}
            loading="lazy"
          />
        </div>

        {/* Risk icon — card 1 uses offset container, cards 2–4 are centered */}
        {isCard1 ? (
          <Image
            src={risk.mobileIcon}
            alt={risk.iconAlt}
            width={risk.mobileIconW}
            height={risk.mobileIconH}
            className="absolute object-contain"
            style={{
              left: '-4px',
              top: '-7px',
              width: `${risk.mobileIconW}px`,
              height: `${risk.mobileIconH}px`,
            }}
            loading="lazy"
          />
        ) : (
          <Image
            src={risk.mobileIcon}
            alt={risk.iconAlt}
            width={risk.mobileIconW}
            height={risk.mobileIconH}
            className="absolute object-contain"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: `${risk.mobileIconW}px`,
              height: `${risk.mobileIconH}px`,
            }}
            loading="lazy"
          />
        )}
      </div>

      {/* Text block — top:112px, centered */}
      <div
        className="absolute flex flex-col items-center text-center"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          top: '112px',
          gap: '12px',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '20px',
            fontWeight: 600,
            letterSpacing: '-1px',
            lineHeight: 1,
            color: '#000',
            whiteSpace: 'nowrap',
          }}
        >
          {risk.title}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            fontWeight: 400,
            letterSpacing: '-0.56px',
            lineHeight: 1.1,
            color: '#111',
            opacity: 0.8,
            width: `${risk.mobileBodyW}px`,
          }}
        >
          {risk.body}
        </p>
      </div>
    </div>
  );
}
