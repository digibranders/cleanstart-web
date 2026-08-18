import type React from 'react';
import { Reveal } from '@/components/ui/Reveal';
import { COMPONENT_ART, COMPONENT_ACCENT } from './FinanceComponentArt';

/*
 * FinanceStack — "Financial Software Runs on More Than Code".
 *
 * Four components, each shown as the thing it is: a sealed container, a set of
 * interlocking modules, a dependency tree that branches into more than it
 * started with, a code surface still emitting new pieces. See
 * FinanceComponentArt for the drawings.
 *
 * The objects lead and the type follows, so the reader knows what they are
 * looking at before they read a word. Each column is opened by a rule in its
 * object's own colour — that is the only chrome; there is no card, no capsule,
 * and no icon tile anywhere in this section.
 */

interface Component {
  title: string;
  role: string;
  parts: readonly [string, string, string];
}

const COMPONENTS: readonly [Component, Component, Component, Component] = [
  {
    title: 'Container Images',
    role: 'The foundation of modern application delivery',
    parts: ['Base images', 'Runtime components', 'Application workloads'],
  },
  {
    title: 'Open Source Libraries',
    role: 'Reusable components powering innovation',
    parts: ['Frameworks', 'Packages', 'Third-party libraries'],
  },
  {
    title: 'Software Dependencies',
    role: 'The hidden layers behind every application',
    parts: ['Direct dependencies', 'Transitive dependencies', 'Package ecosystems'],
  },
  {
    title: 'AI-Generated Code',
    role: 'A new source of software creation',
    parts: ['Generated code', 'AI-assisted development', 'New dependency paths'],
  },
];

export function FinanceStack(): React.ReactElement {
  return (
    <section data-section="FinanceStack" className="relative" style={{ background: '#F6F6F6' }}>
      <div
        className="relative mx-auto"
        style={{
          maxWidth: 'var(--container-default)',
          paddingLeft: 'clamp(16px, 4vw, 48px)',
          paddingRight: 'clamp(16px, 4vw, 48px)',
          paddingTop: 'clamp(44px, 4.2vw, 68px)',
          paddingBottom: 'clamp(32px, 3vw, 48px)',
        }}
      >
        <div className="grid grid-cols-1 gap-x-16 gap-y-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
          <Reveal header>
            <h2
              style={{
                maxWidth: '21ch',
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                color: '#111111',
                margin: 0,
              }}
            >
              Financial Software Runs on More Than Code
            </h2>
          </Reveal>

          <Reveal delay={0.08} y={20}>
            <p
              style={{
                maxWidth: '48ch',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-lead-sm)',
                fontWeight: 400,
                letterSpacing: '-0.01em',
                lineHeight: 1.55,
                color: '#4a4a4a',
                margin: 0,
              }}
            >
              Modern financial applications are built from interconnected software components.
            </p>
          </Reveal>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ marginTop: 'clamp(22px, 2.4vw, 34px)', gap: 'clamp(24px, 2.4vw, 36px)' }}
        >
          {COMPONENTS.map((c, i) => {
            const Art = COMPONENT_ART[i];
            return (
              <Reveal key={c.title} delay={i * 0.08} y={20}>
                <div className="group flex h-full flex-col">
                  <div
                    aria-hidden
                    className="mx-auto transition-transform duration-500 group-hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
                    style={{ width: 'min(100%, 262px)', aspectRatio: '220 / 200' }}
                  >
                    {Art ? <Art /> : null}
                  </div>

                  <div
                    style={{
                      marginTop: 'clamp(4px, 0.8vw, 10px)',
                      paddingTop: 'clamp(14px, 1.4vw, 20px)',
                      borderTop: `2px solid ${COMPONENT_ACCENT[i]}`,
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'var(--fs-h5)',
                        fontWeight: 600,
                        letterSpacing: '-0.025em',
                        lineHeight: 1.25,
                        color: '#111111',
                        margin: 0,
                      }}
                    >
                      {c.title}
                    </h3>
                    <p
                      style={{
                        margin: '7px 0 0',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'var(--fs-body-sm)',
                        fontWeight: 400,
                        letterSpacing: '-0.005em',
                        lineHeight: 1.5,
                        color: '#4a4a4a',
                      }}
                    >
                      {c.role}
                    </p>
                    <p
                      style={{
                        margin: '10px 0 0',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'var(--fs-caption)',
                        fontWeight: 500,
                        letterSpacing: '-0.005em',
                        lineHeight: 1.6,
                        color: '#5c5c5c',
                      }}
                    >
                      {c.parts.join(' · ')}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
