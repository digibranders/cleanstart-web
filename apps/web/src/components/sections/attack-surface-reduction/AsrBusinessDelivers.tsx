export function AsrBusinessDelivers(): React.ReactElement {
  const metrics: Array<{ title: string; description: string }> = [
    {
      title: 'Reduce Security Risks',
      description: 'Reduced exposure during image pull',
    },
    {
      title: 'Smaller CVE Backlog',
      description: 'Less recurring remediation across builds and releases',
    },
    {
      title: 'Focused SBOMs',
      description: 'Only meaningful components to track and defend',
    },
    {
      title: 'Lower Operational Load',
      description: 'Less scanning, patching, and rework for teams',
    },
  ];

  return (
    <section
      data-section="AsrBusinessDelivers"
      className="relative overflow-hidden"
      aria-label="What this delivers for your business"
    >
      <h2 className="sr-only">What this delivers for your business</h2>

      {/* Background photo */}
      <div className="relative" style={{ minHeight: 'clamp(400px, 32vw, 580px)' }}>
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/attack-surface-reduction/business-photo.jpg"
          alt=""
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
          loading="lazy"
          decoding="async"
        />

        {/* Dark overlay — exact Figma stops (fill_RJ8WCA) with alpha so photo bleeds through */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(21,16,33,0.82) 0%, rgba(19,30,143,0.78) 71%, rgba(71,30,192,0.72) 100%)',
          }}
        />

        {/* Content */}
        <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 py-section-md flex flex-col justify-between h-full">
          {/* Heading */}
          <div>
            <p
              className="text-white"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-t-display-2)',
                fontWeight: 600,
                letterSpacing: 'var(--text-t-display-2-ls)',
                lineHeight: 'var(--text-t-display-2-lh)',
                maxWidth: '519px',
              }}
            >
              What this delivers for{' '}
              <span
                style={{
                  background: 'linear-gradient(-44deg, #2CC1EB 0%, #9A51FF 65%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                your business
              </span>
            </p>
          </div>

          {/* Metric columns */}
          <div
            className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-y-8"
            style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}
          >
            {metrics.map((metric, idx) => (
              <div
                key={metric.title}
                className="relative pt-7 pr-4 md:pr-0"
                style={
                  idx > 0
                    ? {
                        paddingLeft: 'clamp(12px, 2.6vw, 32px)',
                        borderLeft: '1px solid rgba(255,255,255,0.18)',
                      }
                    : undefined
                }
              >
                <p
                  className="text-white"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-t-heading-lg)',
                    fontWeight: 600,
                    letterSpacing: 'var(--text-t-heading-lg-ls)',
                    lineHeight: 'var(--text-t-heading-lg-lh)',
                    marginBottom: '10px',
                  }}
                >
                  {metric.title}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-t-heading-md)',
                    fontWeight: 400,
                    letterSpacing: 'var(--text-t-heading-md-ls)',
                    lineHeight: 'var(--text-t-heading-md-lh)',
                    color: '#dddddd',
                  }}
                >
                  {metric.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
