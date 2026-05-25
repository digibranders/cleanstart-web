import type React from 'react';

// ─── Card data ────────────────────────────────────────────────────────────────

const CARDS = [
  {
    id: 'tl',
    mobileOrder: 0,
    title: 'Inherited Vulnerabilities',
    description: 'Risk exist before application code is added.',
    haloColor: '#fb6d6d',
  },
  {
    id: 'tr',
    mobileOrder: 2,
    title: 'Too Many Components',
    description: 'Public images include packages most workloads never use.',
    haloColor: '#fb6d6d',
  },
  {
    id: 'bl',
    mobileOrder: 1,
    title: "Oversized SBOM's",
    description: 'More components to track, justify, and audit.',
    haloColor: '#fb6d6d',
  },
  {
    id: 'br',
    mobileOrder: 3,
    title: 'Constant Patching',
    description: 'The same base issues reappear release after release.',
    haloColor: '#fb6d6d',
  },
] as const;

// ─── Section ──────────────────────────────────────────────────────────────────

export function ASRBloated(): React.ReactElement {
  return (
    <section data-section="ASRBloated" className="relative bg-white overflow-hidden">
      {/* ── Heading ── */}
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-16 md:pt-[88px]">
        <h2
          className="text-center text-[#111]"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 4vw, 56px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            marginBottom: 'clamp(24px, 2.5vw, 48px)',
          }}
        >
          <span className="block">Public Images Are</span>
          <span className="block cs-text-gradient-impact">bloated</span>
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
          {/* TL connector */}
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
          {/* TR connector */}
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
          {/* BL connector */}
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
          {/* BR connector */}
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
      <div className="md:hidden mx-auto px-5 pb-12 flex flex-col items-center gap-4">
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
  return (
    <div
      className="relative"
      style={{
        width: mobile ? '100%' : '303px',
        maxWidth: mobile ? '380px' : '303px',
        height: mobile ? undefined : '166px',
        minHeight: mobile ? '120px' : undefined,
      }}
    >
      {/* Halo */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: '20px',
          background: `linear-gradient(90deg, ${card.haloColor} 0%, ${card.haloColor} 100%)`,
          opacity: 0.4,
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
          paddingTop: mobile ? '16px' : '24px',
          paddingBottom: mobile ? '16px' : '24px',
          paddingLeft: mobile ? '16px' : '24px',
          paddingRight: mobile ? '12px' : '0px',
          gap: mobile ? '14px' : '25px',
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
              fontSize: 'clamp(20px, 2vw, 28px)',
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
              fontSize: 'clamp(15px, 1.4vw, 20px)',
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
