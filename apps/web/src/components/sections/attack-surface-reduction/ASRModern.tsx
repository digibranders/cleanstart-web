import type React from 'react';

const TARGETS: {
  title: string;
  desc: string;
  icon: string;
}[] = [
  {
    title: 'Kubernetes Platforms',
    desc: 'Secure container foundations.',
    icon: '/images/attack-surface-reduction/prod-icon-k8s.png',
  },
  {
    title: 'Regulated Environments',
    desc: 'Built for compliance-heavy workloads.',
    icon: '/images/attack-surface-reduction/prod-icon-docs.png',
  },
  {
    title: 'Security-Focused Teams',
    desc: 'Reduce software supply chain risk.',
    icon: '/images/attack-surface-reduction/prod-icon-security.png',
  },
];

export function ASRModern(): React.ReactElement {
  return (
    <section
      data-section="ASRModern"
      className="relative overflow-hidden pt-section-md pb-[var(--spacing-section-cta)]"
      style={{
        background: 'linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)',
      }}
    >
      {/* Right mesh decoration */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        src="/images/attack-surface-reduction/prod-mesh-1.svg"
        alt=""
        style={{ right: 0, top: 0, width: '340px', height: 'auto', opacity: 0.45 }}
        loading="lazy"
        decoding="async"
      />
      {/* Left mesh decoration */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        src="/images/attack-surface-reduction/prod-mesh-2.svg"
        alt=""
        style={{ left: 0, bottom: 0, width: '340px', height: 'auto', opacity: 0.45 }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Heading */}
        <h2
          className="text-center sm:text-left"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-display-md)',
            fontWeight: 600,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: 'white',
            maxWidth: '700px',
            marginBottom: 'clamp(32px, 5vw, 64px)',
          }}
        >
          Built for Modern Production <span className="cs-text-gradient-impact">Environments</span>
        </h2>

        {/* 3 target cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: '40px' }}>
          {TARGETS.map((t) => (
            <div
              key={t.title}
              className="flex flex-col items-center sm:items-start text-center sm:text-left"
              style={{ gap: '20px' }}
            >
              {/* Icon badge */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.icon}
                alt=""
                aria-hidden
                className="pointer-events-none select-none"
                style={{ width: '72px', height: '72px', objectFit: 'contain' }}
                loading="lazy"
                decoding="async"
              />
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-card-title-lg)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.1,
                  color: 'white',
                }}
              >
                {t.title}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-body-md)',
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.4,
                  color: 'rgba(255,255,255,0.75)',
                }}
              >
                {t.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
