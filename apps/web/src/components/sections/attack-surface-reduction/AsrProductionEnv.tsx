export function AsrProductionEnv(): React.ReactElement {
  const items: Array<{
    icon: string;
    title: string;
    description: string;
  }> = [
    {
      icon: '/images/attack-surface-reduction/prod-icon-k8s.webp',
      title: 'Kubernetes Platforms',
      description: 'Production clusters running containerized workloads.',
    },
    {
      icon: '/images/attack-surface-reduction/prod-icon-docs.webp',
      title: 'Regulated Environments',
      description: 'Workloads with compliance and audit requirements.',
    },
    {
      icon: '/images/attack-surface-reduction/prod-icon-security.webp',
      title: 'Security-Focused Teams',
      description: 'Teams prioritizing prevention over remediation.',
    },
  ];

  return (
    <section
      data-section="AsrProductionEnv"
      className="relative overflow-hidden"
      aria-label="Built for Modern Production Environments"
      style={{
        background:
          'linear-gradient(180deg, rgba(21,16,33,1) 0%, rgba(19,30,143,1) 67%, rgba(71,30,192,1) 100%)',
        minHeight: 'clamp(360px, 32vw, 620px)',
      }}
    >
      <h2 className="sr-only">Built for Modern Production Environments</h2>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/attack-surface-reduction/prod-mesh-1.svg"
        alt=""
        className="absolute pointer-events-none select-none mix-blend-overlay hidden md:block"
        style={{
          left: '-147px',
          top: '397px',
          width: '469px',
          height: '488px',
          transform: 'rotate(-150deg) scaleY(-1)',
        }}
        loading="lazy"
        decoding="async"
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/attack-surface-reduction/prod-mesh-2.svg"
        alt=""
        className="absolute pointer-events-none select-none mix-blend-overlay hidden md:block"
        style={{
          right: '-150px',
          top: '-175px',
          width: '488px',
          height: '497px',
          transform: 'rotate(141.39deg) scaleY(-1)',
        }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-section-md pb-section-cta">
        <p
          className="text-white mb-14 md:mb-[88px]"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h2)',
            fontWeight: 600,
            letterSpacing: 'var(--text-t-display-2-ls)',
            lineHeight: 'var(--text-t-display-2-lh)',
            maxWidth: '686px',
          }}
        >
          Built for Modern Production{' '}
          <span
            style={{
              background: 'linear-gradient(-44deg, #2CC1EB 0%, #9A51FF 65%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Environments
          </span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-0">
          {items.map((item, idx) => (
            <div
              key={item.title}
              className="relative flex flex-col gap-0"
              style={
                idx > 0
                  ? {
                      paddingLeft: 'clamp(16px, 2.6vw, 48px)',
                      borderLeft: '1px dashed rgba(255,255,255,0.22)',
                    }
                  : undefined
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.icon}
                alt=""
                aria-hidden
                className="pointer-events-none select-none mb-6"
                style={{ width: '72px', height: '72px' }}
                loading="lazy"
                decoding="async"
              />

              <p
                className="text-white mb-3"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--fs-h2)',
                  fontWeight: 600,
                  letterSpacing: 'var(--text-t-heading-lg-ls)',
                  lineHeight: 'var(--text-t-heading-lg-lh)',
                  maxWidth: '340px',
                }}
              >
                {item.title}
              </p>

              <p
                className="text-white"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--fs-h4)',
                  fontWeight: 400,
                  letterSpacing: 'var(--text-t-heading-sm-ls)',
                  lineHeight: 'var(--text-t-heading-sm-lh)',
                  maxWidth: '294px',
                  opacity: 0.85,
                }}
              >
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
