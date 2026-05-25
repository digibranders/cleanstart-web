import type React from 'react';

const CARDS: { icon: string; title: string; desc: string; mobileOrder: number }[] = [
  {
    icon: '/images/attack-surface-reduction/approach-minimal.png',
    title: 'Minimal Foundations',
    desc: 'Only required components are included in every image.',
    mobileOrder: 0,
  },
  {
    icon: '/images/attack-surface-reduction/approach-bloat.png',
    title: 'Unnecessary Components',
    desc: 'Shells, package managers, and unused tools are excluded.',
    mobileOrder: 2,
  },
  {
    icon: '/images/attack-surface-reduction/approach-deterministic.png',
    title: 'Deterministic Builds',
    desc: 'Images are built consistently from trusted sources.',
    mobileOrder: 1,
  },
  {
    icon: '/images/attack-surface-reduction/approach-secure.png',
    title: 'Secure Defaults Applied',
    desc: 'Hardened configurations are enforced at the image layer.',
    mobileOrder: 3,
  },
];

export function ASRApproach(): React.ReactElement {
  return (
    <section data-section="ASRApproach" className="relative bg-white overflow-hidden">
      {/* Heading */}
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-16 md:pt-[88px]">
        <h2
          className="text-[#111]"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 4vw, 56px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            maxWidth: '562px',
            marginBottom: '48px',
          }}
        >
          The CleanStart <span className="cs-text-gradient-impact">Approach</span>
        </h2>
      </div>

      {/* Desktop: 2×2 grid with cross-dividers */}
      <div className="hidden md:block relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pb-16 md:pb-[88px]">
        {/* Horizontal hairline */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: '24px',
            right: '24px',
            top: '50%',
            height: '1px',
            background:
              'linear-gradient(90deg, rgba(217,217,217,0) 0%, #d9d9d9 47.18%, rgba(217,217,217,0) 100%)',
          }}
        />
        {/* Vertical hairline */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: '0',
            bottom: '0',
            width: '1px',
            background:
              'linear-gradient(180deg, rgba(217,217,217,0) 0%, #d9d9d9 47.18%, rgba(217,217,217,0) 100%)',
          }}
        />

        <div className="grid grid-cols-2">
          {CARDS.map((card, idx) => (
            <ApproachCell key={card.title} card={card} padLeft={idx % 2 === 1} />
          ))}
        </div>
      </div>

      {/* Mobile: stacked, icon centered above centered text */}
      <div className="md:hidden relative mx-auto px-5 pb-12">
        {[...CARDS]
          .sort((a, b) => a.mobileOrder - b.mobileOrder)
          .map((card, idx, arr) => (
            <div
              key={card.title}
              className="flex flex-col items-center text-center py-10"
              style={
                idx < arr.length - 1
                  ? { borderBottom: '1px solid rgba(217,217,217,0.7)' }
                  : undefined
              }
            >
              {/* Purple radial glow behind icon */}
              <div className="relative mb-5">
                <div
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    background:
                      'radial-gradient(closest-side, rgba(154, 81, 255, 0.22) 0%, rgba(154, 81, 255, 0) 100%)',
                    filter: 'blur(8px)',
                  }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.icon}
                  alt=""
                  aria-hidden
                  className="relative pointer-events-none select-none"
                  style={{ width: '110px', height: '110px', objectFit: 'contain' }}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <p
                className="text-[#111]"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(20px, 5.5vw, 28px)',
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.1,
                  marginBottom: '12px',
                }}
              >
                {card.title}
              </p>
              <p
                className="text-[#333]"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'clamp(15px, 4vw, 18px)',
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.5,
                  maxWidth: '280px',
                }}
              >
                {card.desc}
              </p>
            </div>
          ))}
      </div>
    </section>
  );
}

interface ApproachCellProps {
  card: { icon: string; title: string; desc: string };
  padLeft: boolean;
}

function ApproachCell({ card, padLeft }: ApproachCellProps): React.ReactElement {
  return (
    <div
      className="relative flex items-center gap-8 py-10"
      style={{
        paddingLeft: padLeft ? '48px' : '0',
        paddingRight: padLeft ? '0' : '48px',
      }}
    >
      {/* Soft radial glow behind icon */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          left: padLeft ? '48px' : '0',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '165px',
          height: '165px',
          borderRadius: '50%',
          background:
            'radial-gradient(closest-side, rgba(154, 81, 255, 0.22) 0%, rgba(154, 81, 255, 0) 100%)',
          filter: 'blur(8px)',
        }}
      />

      {/* 3D icon */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={card.icon}
        alt=""
        aria-hidden
        className="relative pointer-events-none select-none shrink-0"
        style={{ width: '165px', height: '165px', objectFit: 'contain' }}
        loading="lazy"
        decoding="async"
      />

      {/* Copy */}
      <div className="flex flex-col gap-[23px]">
        <p
          className="text-[#111]"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(22px, 2.4vw, 32px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            maxWidth: '225px',
          }}
        >
          {card.title}
        </p>
        <p
          className="text-[#333]"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(15px, 1.4vw, 20px)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.4,
            maxWidth: '290px',
          }}
        >
          {card.desc}
        </p>
      </div>
    </div>
  );
}
