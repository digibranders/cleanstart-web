import type React from 'react';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';

/*
 * "Financial Software Runs on More Than Code" — Clean Component Grid
 *
 * Professional enterprise architecture grid with exact verbatim proposal copy:
 * clean typography hierarchy, aligned two-line headings, and structured sub-components.
 */

interface ComponentItem {
  line1: string;
  line2: string;
  desc: string;
  items: readonly [string, string, string];
}

const COMPONENTS: readonly [ComponentItem, ComponentItem, ComponentItem, ComponentItem] = [
  {
    line1: 'Container',
    line2: 'Images',
    desc: 'The foundation of modern application delivery',
    items: ['Base images', 'Runtime components', 'Application workloads'],
  },
  {
    line1: 'Open Source',
    line2: 'Libraries',
    desc: 'Reusable components powering innovation',
    items: ['Frameworks', 'Packages', 'Third-party libraries'],
  },
  {
    line1: 'Software',
    line2: 'Dependencies',
    desc: 'The hidden layers behind every application',
    items: ['Direct dependencies', 'Transitive dependencies', 'Package ecosystems'],
  },
  {
    line1: 'AI-Generated',
    line2: 'Code',
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
            <RevealItem key={item.line1 + item.line2} className="h-full">
              <div
                className="group flex h-full flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-16px_rgba(40,30,90,0.12)]"
                style={{
                  background: 'linear-gradient(135deg, #F9F8FD 0%, #F3F5FA 100%)',
                  borderRadius: '20px',
                  padding: 'clamp(28px, 3vw, 36px) clamp(24px, 2.6vw, 30px)',
                  border: '1px solid rgba(154,81,255,0.12)',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--fs-h3)',
                      fontWeight: 600,
                      letterSpacing: '-0.04em',
                      lineHeight: 1.15,
                      color: '#111111',
                    }}
                  >
                    <span className="block">{item.line1}</span>
                    <span className="block">{item.line2}</span>
                  </h3>

                  <p
                    style={{
                      marginTop: '12px',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--fs-body-sm)',
                      fontWeight: 400,
                      letterSpacing: '-0.01em',
                      lineHeight: 1.5,
                      color: '#555555',
                      minHeight: 'clamp(44px, 3.4vw, 48px)',
                    }}
                  >
                    {item.desc}
                  </p>
                </div>

                <ul
                  style={{
                    marginTop: 'clamp(20px, 2vw, 28px)',
                    paddingTop: 'clamp(14px, 1.5vw, 18px)',
                    borderTop: '1px solid rgba(17,17,17,0.08)',
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingLeft: 0,
                    marginBottom: 0,
                  }}
                >
                  {item.items.map((sub) => (
                    <li
                      key={sub}
                      className="flex items-center gap-2.5"
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'var(--fs-body-sm)',
                        fontWeight: 400,
                        color: '#333333',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      <span
                        className="inline-block shrink-0 rounded-full"
                        style={{
                          width: '4px',
                          height: '4px',
                          background: '#9A51FF',
                        }}
                      />
                      <span>{sub}</span>
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
