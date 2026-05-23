import type React from 'react';

/*
 * Figma node 732-412 — "Eliminate Risk Earlier" section
 *
 * Background: dark navy/purple gradient (same mesh as hero)
 * Heading: ~62px Manrope Bold, white, tracking -0.05em, centered
 *   "Risk Earlier" → purple→cyan gradient
 * 4 numbered feature blocks arranged in 2×2 grid flanking a central CSS orb
 *   Desktop: [items 01,02] | [orb] | [items 03,04]
 *   Mobile:  stacked
 * Orb: layered CSS radial gradients with glow rings (200px sphere)
 * Feature blocks: number tag + title + description
 */

interface FeatureDef {
  num: string;
  title: string;
  desc: string;
}

const LEFT_FEATURES: FeatureDef[] = [
  {
    num: '01',
    title: 'Base Image Risk',
    desc: 'Start from a clean, pre-hardened foundation — inherit security posture, not CVEs.',
  },
  {
    num: '02',
    title: 'Dependency Risk',
    desc: 'Know exactly what ships in every layer with signed SBOMs and attestations.',
  },
];

const RIGHT_FEATURES: FeatureDef[] = [
  {
    num: '03',
    title: 'Configuration Risk',
    desc: 'Default-secure settings and minimal package sets — no hardening scripts needed.',
  },
  {
    num: '04',
    title: 'Compliance Risk',
    desc: 'Attestations and provenance records generated automatically at build time.',
  },
];

function FeatureBlock({ num, title, desc }: FeatureDef): React.ReactElement {
  return (
    <div
      className="flex flex-col"
      style={{
        padding: '28px 32px',
        borderRadius: '20px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)',
        gap: '12px',
      }}
    >
      {/* Number tag */}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.5rem',
          fontWeight: 700,
          letterSpacing: '-0.05em',
          lineHeight: 1,
          background:
            'linear-gradient(102.22deg, rgb(154,81,255) 1.758%, rgb(44,193,235) 98.781%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {num}
      </span>

      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.125rem, 1.35vw, 1.625rem)',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          lineHeight: 1.1,
          color: '#ffffff',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-body-md)',
          fontWeight: 400,
          letterSpacing: '-0.01em',
          lineHeight: 1.55,
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        {desc}
      </p>
    </div>
  );
}

function CentralOrb(): React.ReactElement {
  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: '280px', height: '280px' }}
    >
      {/* Outer glow ring */}
      <div
        aria-hidden
        className="absolute"
        style={{
          inset: '-40px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(71,30,192,0.25) 0%, transparent 70%)',
        }}
      />

      {/* Mid glow ring */}
      <div
        aria-hidden
        className="absolute"
        style={{
          inset: '-16px',
          borderRadius: '50%',
          border: '1px solid rgba(44,193,235,0.2)',
        }}
      />

      {/* Inner border ring */}
      <div
        aria-hidden
        className="absolute"
        style={{
          inset: '-4px',
          borderRadius: '50%',
          border: '1px solid rgba(154,81,255,0.35)',
        }}
      />

      {/* Main sphere */}
      <div
        style={{
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 35% 30%, #7b2fff 0%, #2a1c8f 35%, #0b0e2e 70%, #070914 100%)',
          boxShadow:
            '0 0 60px rgba(71,30,192,0.4), 0 0 120px rgba(71,30,192,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Specular highlight */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '18%',
            left: '22%',
            width: '38%',
            height: '28%',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse, rgba(255,255,255,0.22) 0%, transparent 70%)',
            transform: 'rotate(-20deg)',
          }}
        />

        {/* Cyan rim light */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-5%',
            width: '55%',
            height: '55%',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse, rgba(44,193,235,0.18) 0%, transparent 70%)',
          }}
        />

        {/* Lock icon — centered */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 1 }}
        >
          <svg
            width="72"
            height="72"
            viewBox="0 0 72 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="14"
              y="34"
              width="44"
              height="30"
              rx="6"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="2.5"
            />
            <path
              d="M22 34V24C22 17.373 27.373 12 34 12H38C44.627 12 50 17.373 50 24V34"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="36" cy="49" r="4" fill="rgba(44,193,235,0.9)" />
            <path
              d="M36 53V58"
              stroke="rgba(44,193,235,0.9)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function DeveloperEliminateRisk(): React.ReactElement {
  return (
    <section
      data-section="DeveloperEliminateRisk"
      className="relative overflow-hidden bg-cs-hero"
      style={{ paddingTop: '80px', paddingBottom: '100px' }}
    >
      {/* Bottom fade — blends into next section */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 bottom-0 z-[1]"
        style={{
          height: '120px',
          background:
            'linear-gradient(180deg, transparent 0%, rgba(14,16,51,0.8) 80%, #0e1033 100%)',
        }}
      />

      <div
        className="relative mx-auto z-[2]"
        style={{
          maxWidth: 'var(--container-default)',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        {/* Heading */}
        <h2
          className="text-center mx-auto"
          style={{
            maxWidth: '680px',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 3.23vw, 3.875rem)',
            fontWeight: 700,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            color: '#ffffff',
            marginBottom: '16px',
          }}
        >
          Eliminate{' '}
          <span
            style={{
              background:
                'linear-gradient(102.22deg, rgb(154,81,255) 1.758%, rgb(44,193,235) 98.781%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Risk Earlier
          </span>
        </h2>

        <p
          className="text-center mx-auto"
          style={{
            maxWidth: '540px',
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(0.9375rem, 1.04vw, 1.25rem)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.5,
            color: 'rgba(255,255,255,0.65)',
            marginBottom: '72px',
          }}
        >
          Shift container security left — address risk at the foundation layer before it
          ever reaches your pipeline.
        </p>

        {/* ════ DESKTOP: 3-column [left features | orb | right features] ════ */}
        <div
          className="hidden lg:grid items-center"
          style={{
            gridTemplateColumns: '1fr 320px 1fr',
            gap: '48px',
          }}
        >
          {/* Left features */}
          <div className="flex flex-col" style={{ gap: '24px' }}>
            {LEFT_FEATURES.map((f) => (
              <FeatureBlock key={f.num} {...f} />
            ))}
          </div>

          {/* Central orb */}
          <div className="flex items-center justify-center">
            <CentralOrb />
          </div>

          {/* Right features */}
          <div className="flex flex-col" style={{ gap: '24px' }}>
            {RIGHT_FEATURES.map((f) => (
              <FeatureBlock key={f.num} {...f} />
            ))}
          </div>
        </div>

        {/* ════ MOBILE: stacked 2-column grid ════ */}
        <div className="lg:hidden flex flex-col items-center" style={{ gap: '32px' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 w-full" style={{ gap: '16px' }}>
            {[...LEFT_FEATURES, ...RIGHT_FEATURES].map((f) => (
              <FeatureBlock key={f.num} {...f} />
            ))}
          </div>
          <CentralOrb />
        </div>
      </div>
    </section>
  );
}
