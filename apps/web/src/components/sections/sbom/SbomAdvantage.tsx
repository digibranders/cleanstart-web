import Image from 'next/image';
import { Reveal } from '@/components/ui/Reveal';

/**
 * Figma frame 516:5494 — 1920 × 889 "Built for Modern Software Supply Chains"
 *
 * Desktop: Light-gray (#f7f7f7) backdrop, infinity-loop circuit image + 2×2 card grid.
 * Mobile (Figma 817:1281 at y=3466): "Built for Modern Software Supply Chains" heading,
 * infinity circuit image, then 4 orbital/connection items with card backgrounds.
 */

const CARDS = [
  {
    id: 'cicd',
    title: 'CI/CD Pipelines',
    body: 'Integrate into existing workflows.',
    cornerRadius: '8px 8px 62px 8px',
    mobileBg: 'a', // mobile-builtfor-card-a.svg (plain border card, 122px)
  },
  {
    id: 'container',
    title: 'Container Environments',
    body: 'Track software inventories across images.',
    cornerRadius: '8px 8px 8px 62px',
    mobileBg: 'c', // mobile-builtfor-card-c.svg (flipped curve, 145px)
  },
  {
    id: 'compliance',
    title: 'Compliance Programs',
    body: 'Support modern regulatory requirements.',
    cornerRadius: '8px 62px 8px 8px',
    mobileBg: 'b', // mobile-builtfor-card-b.svg (curve, 145px)
  },
  {
    id: 'security',
    title: 'Enterprise Security Teams',
    body: 'Improve software supply chain visibility.',
    cornerRadius: '62px 8px 8px 8px',
    mobileBg: 'a', // mobile-builtfor-card-a.svg (plain border card, 122px)
  },
] as const;

export function SbomAdvantage(): React.ReactElement {
  return (
    <section
      data-section="SbomAdvantage"
      className="relative overflow-hidden bg-[#f7f7f7] w-full"
      style={{ minHeight: 'calc(250px + 42vw)' }}
    >
      {/* Decorative cyan halo bottom-right */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          right: '-220px',
          bottom: '-140px',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background:
            'radial-gradient(closest-side, rgba(44,193,235,0.18) 0%, rgba(44,193,235,0) 70%)',
        }}
      />

      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: 'clamp(56px, 6vw, 100px)',
          paddingBottom: 'max(var(--spacing-section-cta), 175px)',
        }}
      >
        {/* Heading */}
        <div className="text-center mb-10 md:mb-14">
          <Reveal header>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 1.2,
                color: '#111',
              }}
            >
              <span className="block">Built for Modern Software</span>
              <span className="cs-text-gradient-impact block">Supply Chains</span>
            </h2>
          </Reveal>
        </div>

        {/* ── DESKTOP image + 2×2 cards ── */}
        <div className="hidden lg:grid grid-cols-[512fr_708fr] gap-8 items-stretch">
          {/* Left: infinity circuit image */}
          <div
            className="relative overflow-hidden w-full"
            style={{
              borderRadius: '20px',
              border: '1.5px solid #076eff',
              aspectRatio: '512/384',
              minHeight: '260px',
            }}
          >
            <Image
              src="/images/sbom/infinity-circuit.png"
              alt="CleanStart SBOM continuous delivery loop"
              fill
              sizes="(min-width: 1024px) 512px, 100vw"
              className="object-cover"
              loading="lazy"
            />
          </div>

          {/* Right: 2×2 grid with central infinity ball icon */}
          <div className="relative grid grid-cols-2 gap-6">
            {CARDS.map((card) => (
              <article
                key={card.id}
                className="bg-white w-full"
                style={{
                  borderRadius: card.cornerRadius,
                  border: '1.5px solid rgba(0,0,0,0.06)',
                  padding: 'clamp(20px, 1.67vw, 32px)',
                  minHeight: 'clamp(150px, 11.5vw, 180px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <p
                  className="text-[#111]"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--fs-h3)',
                    fontWeight: 600,
                    letterSpacing: '-0.04em',
                    lineHeight: 1.1,
                  }}
                >
                  {card.title}
                </p>
                <p
                  className="text-[#333]"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--fs-body)',
                    fontWeight: 400,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.4,
                  }}
                >
                  {card.body}
                </p>
              </article>
            ))}

            {/* Central infinity ball */}
            <div
              aria-hidden
              className="hidden sm:flex absolute items-center justify-center"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(180deg, #239cff 0%, #005be3 100%)',
                boxShadow:
                  '0 4.63px 10.9px rgba(28,60,142,0.33), inset 0 -0.17px 0.22px rgba(0,44,179,0.5), inset 0 0.09px 0.44px rgba(255,255,255,0.81)',
                zIndex: 2,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/sbom/icon-infinity.svg"
                alt=""
                style={{ width: '34px', height: '40px', display: 'block' }}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>

        {/* ── TABLET stacked (sm to lg) ── */}
        <div className="hidden sm:grid lg:hidden grid-cols-[1fr_1fr] gap-6 items-start">
          {/* Infinity circuit image */}
          <div
            className="relative overflow-hidden w-full col-span-2"
            style={{
              borderRadius: '20px',
              border: '1.5px solid #076eff',
              aspectRatio: '512/384',
            }}
          >
            <Image
              src="/images/sbom/infinity-circuit.png"
              alt="CleanStart SBOM continuous delivery loop"
              fill
              sizes="100vw"
              className="object-cover"
              loading="lazy"
            />
          </div>
          {CARDS.map((card) => (
            <article
              key={card.id}
              className="bg-white"
              style={{
                borderRadius: '16px',
                border: '1.5px solid rgba(0,0,0,0.06)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <p
                className="text-[#111]"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--fs-h5)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.1,
                }}
              >
                {card.title}
              </p>
              <p
                className="text-[#333]"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--fs-body-sm)',
                  fontWeight: 400,
                  lineHeight: 1.4,
                }}
              >
                {card.body}
              </p>
            </article>
          ))}
        </div>

        {/* ── MOBILE (< sm) — Figma 817:1433, 360px canvas ── */}
        <div className="sm:hidden flex flex-col items-center" style={{ gap: '0' }}>
          {/* Infinity circuit image — 328×183 with white base + cyan overlay + #076eff border
              Figma: backgroundImage two layers (white base + rgba(44,193,235,0.4) overlay) */}
          <div
            className="relative overflow-hidden"
            style={{
              width: '328px',
              height: '183px',
              borderRadius: '24px',
              border: '0.961px solid #076eff',
              backgroundImage:
                'linear-gradient(90deg, rgba(44,193,235,0.4) 0%, rgba(44,193,235,0.4) 100%), linear-gradient(90deg, #fff 0%, #fff 100%)',
              marginBottom: '16px',
              flexShrink: 0,
            }}
          >
            {/* Ellipse decoration — Figma: left:-78.16px top:-72.39px w:263px, rotate:34.99deg */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/sbom/mobile-builtfor-ellipse.svg"
              alt=""
              aria-hidden
              className="absolute pointer-events-none"
              style={{
                left: '-78px',
                top: '-72px',
                width: '263px',
                height: '256px',
                transform: 'rotate(35deg)',
              }}
              loading="lazy"
            />
            {/* Circuit image */}
            <Image
              src="/images/sbom/infinity-circuit.png"
              alt="CleanStart SBOM built for modern supply chains"
              fill
              sizes="328px"
              className="object-cover"
              loading="lazy"
            />
          </div>

          {/* 4 built-for item cards with central ball overlapping adjacent cards.
              Figma ball top:4021px overlaps Compliance (ends 4041) and Container (starts 4057)
              by 20px each. With gap:16px → ball needs marginTop/Bottom:-36px (16+20=36). */}
          <div className="flex flex-col items-center" style={{ width: '328px', gap: '16px' }}>
            {/* CI/CD Pipelines — plain border card, 122px. Figma titleW:169 bodyW:149 */}
            <MobileBuiltForCard
              title="CI/CD Pipelines"
              body="Integrate into existing workflows."
              bgSvg="/images/sbom/mobile-builtfor-card-a.svg"
              height={122}
              titleW={169}
              bodyW={149}
            />

            {/* Compliance Programs — Figma card-b+scaleY(-1) = wavy bottom facing ball.
                card-c already has the curve at bottom → same result without transform. */}
            <MobileBuiltForCard
              title="Compliance Programs"
              body="Support modern regulatory requirements."
              bgSvg="/images/sbom/mobile-builtfor-card-c.svg"
              height={145}
              titleW={243}
              bodyW={169}
            />

            {/* Central ball — Figma size:56px, overlaps cards by 20px each side.
                marginTop/Bottom:-36px with gap:16px → net overlap = 20px per side. */}
            <div
              aria-hidden
              className="flex items-center justify-center self-center shrink-0"
              style={{
                position: 'relative',
                zIndex: 2,
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(180deg, #239cff 0%, #005be3 100%)',
                boxShadow:
                  '0px 3.6px 8.48px 0px rgba(28,60,142,0.33), inset 0px -0.136px 0.17px 0px rgba(0,44,179,0.5), inset 0px 0.068px 0.339px 0px rgba(255,255,255,0.81)',
                marginTop: '-36px',
                marginBottom: '-36px',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/sbom/mobile-builtfor-ball-icon.svg"
                alt=""
                aria-hidden
                style={{ width: '26.62px', height: '30.91px' }}
                loading="lazy"
              />
            </div>

            {/* Container Environments — Figma card-c+scaleY(-1) = wavy top facing ball.
                card-b already has the curve at top → same result without transform. */}
            <MobileBuiltForCard
              title="Container Environments"
              body="Track software inventories across images."
              bgSvg="/images/sbom/mobile-builtfor-card-b.svg"
              height={145}
              titleW={249}
              bodyW={205}
            />

            {/* Enterprise Security Teams — plain border card, 122px. Figma titleW:255 bodyW:205 */}
            <MobileBuiltForCard
              title="Enterprise Security Teams"
              body="Improve software supply chain visibility."
              bgSvg="/images/sbom/mobile-builtfor-card-a.svg"
              height={122}
              titleW={255}
              bodyW={205}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Mobile built-for item card (Figma 817:1433) ───────────────────── */
/**
 * Per-card text widths from Figma:
 *   CI/CD Pipelines:        titleW=169  bodyW=149
 *   Compliance Programs:    titleW=243  bodyW=169
 *   Container Environments: titleW=249  bodyW=205
 *   Enterprise Security:    titleW=255  bodyW=205
 */
function MobileBuiltForCard({
  title,
  body,
  bgSvg,
  height,
  titleW,
  bodyW,
}: {
  title: string;
  body: string;
  bgSvg: string;
  height: number;
  /** Figma exact title width in px */
  titleW: number;
  /** Figma exact body width in px */
  bodyW: number;
}): React.ReactElement {
  return (
    <div
      className="relative flex flex-col items-center justify-center text-center"
      style={{ width: '328px', height: `${height}px` }}
    >
      {/* Background SVG frame */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgSvg}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
        loading="lazy"
      />
      {/* Content */}
      <div className="relative flex flex-col items-center gap-[12px] text-center">
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h4)',
            fontWeight: 600,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: '#000',
            width: `${titleW}px`,
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--fs-body-sm)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.5,
            color: '#111',
            opacity: 0.8,
            width: `${bodyW}px`,
          }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}
