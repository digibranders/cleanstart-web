import type React from 'react';
import Image from 'next/image';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';

/*
 * "Financial Software Runs on More Than Code" — the site's soft-violet feature
 * card grid (the ASRFits / "Benefits Across Teams" pattern): 3D icon on top,
 * title, one-line description, and the proposal's three sub-items below a
 * hairline. Copy is the proposal's, verbatim.
 */

interface Component {
  icon: string;
  iconAlt: string;
  title: string;
  desc: string;
  items: readonly [string, string, string];
}

const COMPONENTS: readonly [Component, Component, Component, Component] = [
  {
    icon: '/images/cleanstart-images/uvp-icon-smaller-images.webp',
    iconAlt: '3D icon of stacked container blocks',
    title: 'Container Images',
    desc: 'The foundation of modern application delivery',
    items: ['Base images', 'Runtime components', 'Application workloads'],
  },
  {
    icon: '/images/for-developers/why/icon-development.webp',
    iconAlt: '3D icon of code brackets and a gear',
    title: 'Open Source Libraries',
    desc: 'Reusable components powering innovation',
    items: ['Frameworks', 'Packages', 'Third-party libraries'],
  },
  {
    icon: '/images/compare/icon-provenance.webp',
    iconAlt: '3D icon of linked component blocks',
    title: 'Software Dependencies',
    desc: 'The hidden layers behind every application',
    items: ['Direct dependencies', 'Transitive dependencies', 'Package ecosystems'],
  },
  {
    icon: '/images/compare/icon-ai-bom.webp',
    iconAlt: '3D icon of a document with a processor chip',
    title: 'AI-Generated Code',
    desc: 'A new source of software creation',
    items: ['Generated code', 'AI-assisted development', 'New dependency paths'],
  },
];

export function FinanceStack(): React.ReactElement {
  return (
    <section data-section="FinanceStack" className="relative bg-white py-section-md">
      <div className="mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between"
          style={{ marginBottom: 'clamp(40px, 4.4vw, 64px)', gap: '24px' }}
        >
          <Reveal header style={{ maxWidth: '660px' }}>
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
              Financial Software Runs on{' '}
              <span className="cs-text-gradient-impact">More Than Code</span>
            </h2>
          </Reveal>

          <Reveal header delay={0.15} y={20} style={{ maxWidth: '420px' }}>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-body)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.5,
                color: '#555555',
              }}
            >
              Modern financial applications are built from interconnected software components.
            </p>
          </Reveal>
        </div>

        <RevealStagger
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ gap: '24px' }}
        >
          {COMPONENTS.map((item) => (
            <RevealItem key={item.title} className="h-full">
              <div
                className="flex h-full flex-col items-center text-center sm:items-start sm:text-left"
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
                  width={128}
                  height={128}
                  sizes="128px"
                  className="object-contain"
                  style={{ height: '104px', width: 'auto' }}
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

                <ul
                  className="w-full"
                  style={{
                    marginTop: 'auto',
                    paddingTop: 'clamp(14px, 1.5vw, 20px)',
                    borderTop: '1px solid rgba(17,17,17,0.09)',
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {item.items.map((sub) => (
                    <li
                      key={sub}
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'var(--fs-body-sm)',
                        fontWeight: 500,
                        letterSpacing: '-0.01em',
                        lineHeight: 1.4,
                        color: '#3d3766',
                      }}
                    >
                      {sub}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
