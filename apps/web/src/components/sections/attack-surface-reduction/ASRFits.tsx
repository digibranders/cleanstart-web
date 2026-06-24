import Image from 'next/image';
import { Reveal } from '@/components/ui/Reveal';

interface Integration {
  title: string;
  desc: string;
  icon: string;
  iconAlt: string;
  iconWidth: number;
  iconHeight: number;
}

const INTEGRATIONS: Integration[] = [
  {
    title: 'Platform Engineering',
    desc: 'Smaller foundations. Faster delivery.',
    icon: '/images/attack-surface-reduction/team-platform-engineering.webp',
    iconAlt: 'Platform engineering icon',
    iconWidth: 128,
    iconHeight: 128,
  },
  {
    title: 'DevSecOps Teams',
    desc: 'Reduce exposure before deployment.',
    icon: '/images/attack-surface-reduction/team-devsecops.webp',
    iconAlt: 'DevSecOps icon',
    iconWidth: 128,
    iconHeight: 128,
  },
  {
    title: 'Security Teams',
    desc: 'Lower inherited software risk.',
    icon: '/images/attack-surface-reduction/team-security.webp',
    iconAlt: 'Security team icon',
    iconWidth: 128,
    iconHeight: 128,
  },
  {
    title: 'Compliance Teams',
    desc: 'Simplify reviews and audits.',
    icon: '/images/attack-surface-reduction/team-compliance.webp',
    iconAlt: 'Compliance team icon',
    iconWidth: 128,
    iconHeight: 128,
  },
];

export function ASRFits(): React.ReactElement {
  return (
    <section data-section="ASRFits" className="bg-white py-section-md">
      <div className="mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between"
          style={{ marginBottom: '64px', gap: '32px' }}
        >
          <Reveal header style={{ maxWidth: '560px' }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                color: '#111111',
              }}
            >
              Benefits <span className="cs-text-gradient-impact">Across Teams</span>
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: '24px' }}>
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
                width={item.iconWidth}
                height={item.iconHeight}
                sizes={`${item.iconWidth}px`}
                className="object-contain"
                style={{ height: '112px', width: 'auto' }}
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
