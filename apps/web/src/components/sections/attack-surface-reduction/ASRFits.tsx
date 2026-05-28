import Image from 'next/image';

const INTEGRATIONS: { title: string; desc: string; icon: string; iconAlt: string }[] = [
  {
    title: 'Drop-in Images',
    desc: 'Works with existing workflows.',
    icon: '/images/attack-surface-reduction/image 583136.png',
    iconAlt: 'Monitor icon',
  },
  {
    title: 'Pipeline Compatible',
    desc: 'Integrates into CI/CD environments.',
    icon: '/images/attack-surface-reduction/image 583137.png',
    iconAlt: 'Pipeline icon',
  },
  {
    title: 'Deploy Anywhere',
    desc: 'Cloud, on-prem, or regulated environments.',
    icon: '/images/attack-surface-reduction/Point.png',
    iconAlt: 'Deploy icon',
  },
];

export function ASRFits(): React.ReactElement {
  return (
    <section data-section="ASRFits" className="bg-white py-section-md">
      <div className="mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Heading row: heading left, subtitle right */}
        <div
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between"
          style={{ marginBottom: '64px', gap: '32px' }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h2)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              color: '#111111',
              maxWidth: '560px',
            }}
          >
            Fits into what you've <span className="cs-text-gradient-impact">already built</span>
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--fs-lead)',
              fontWeight: 400,
              letterSpacing: 'var(--text-t-subhead-ls)',
              lineHeight: 'var(--text-t-subhead-lh)',
              color: '#555555',
              maxWidth: '480px',
            }}
          >
            Stay informed with the latest research, threat intelligence reports, and expert analysis
            from our security team.
          </p>
        </div>

        {/* 3 integration cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: '24px' }}>
          {INTEGRATIONS.map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-center sm:items-start text-center sm:text-left"
              style={{
                background: 'linear-gradient(135deg, #F3F0FF 0%, #EEF4FF 100%)',
                borderRadius: '20px',
                padding: 'clamp(28px, 4vw, 40px) clamp(20px, 3vw, 32px)',
                gap: '16px',
                border: '1px solid rgba(154,81,255,0.12)',
              }}
            >
              <Image
                src={item.icon}
                alt={item.iconAlt}
                width={96}
                height={96}
                sizes="96px"
                className="object-contain"
              />
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--fs-h3)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.1,
                  color: '#111111',
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--fs-body)',
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.4,
                  color: '#555555',
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
