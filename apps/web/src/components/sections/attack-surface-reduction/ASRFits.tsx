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
    title: 'Drop-in Images',
    desc: 'Works with existing workflows.',
    icon: '/images/attack-surface-reduction/dropin-images-icon.webp',
    iconAlt: 'Monitor icon',
    iconWidth: 96,
    iconHeight: 96,
  },
  {
    title: 'Pipeline Compatible',
    desc: 'Integrates into CI/CD environments.',
    icon: '/images/attack-surface-reduction/pipeline.webp',
    iconAlt: 'CI/CD pipeline icon',
    // Cropped landscape artwork (~2.1:1) — intrinsic ratio for the reserved box.
    iconWidth: 201,
    iconHeight: 96,
  },
  {
    title: 'Deploy Anywhere',
    desc: 'Cloud, on-prem, or regulated environments.',
    icon: '/images/attack-surface-reduction/deploy-icon.webp',
    iconAlt: 'Deploy icon',
    iconWidth: 96,
    iconHeight: 96,
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
              Fits into what you've <span className="cs-text-gradient-impact">already built</span>
            </h2>
          </Reveal>
        </div>

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
