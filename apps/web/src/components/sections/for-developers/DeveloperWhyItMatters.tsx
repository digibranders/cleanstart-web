import type React from 'react';
import { Reveal } from '@/components/ui/Reveal';

interface CardDef {
  /** Standalone transparent 3D icon (Figma export). */
  icon: string;
  title: string;
  desc: string;
}

const CARDS: [CardDef, CardDef, CardDef, CardDef] = [
  {
    icon: '/images/for-developers/why/bloated.webp',
    title: 'Bloated Software Artifacts',
    desc: 'Large software artifacts increase dependency complexity and runtime overhead.',
  },
  {
    icon: '/images/for-developers/why/vulnerabilities.webp',
    title: 'Inherited Vulnerabilities',
    desc: 'Public software components often inherit vulnerable upstream dependencies.',
  },
  {
    icon: '/images/for-developers/why/remediation.webp',
    title: 'Slow Remediation Cycles',
    desc: 'Manual patching and rebuild workflows slow software delivery.',
  },
  {
    icon: '/images/for-developers/why/development.webp',
    title: 'Workflow Disruption',
    desc: 'Security tooling should not disrupt developer productivity or CI/CD workflows.',
  },
];

/** Mobile reflows Remediation above Inherited Vulnerabilities. */
const MOBILE_ORDER = [0, 2, 1, 3] as const;

const DIVIDER_H =
  'linear-gradient(to right, transparent 0%, #d9d9d9 20%, #d9d9d9 80%, transparent 100%)';
const DIVIDER_V =
  'linear-gradient(to bottom, transparent 0%, #d9d9d9 20%, #d9d9d9 80%, transparent 100%)';

function DesktopWhyCard({ icon, title, desc }: CardDef): React.ReactElement {
  return (
    <div className="flex items-center" style={{ gap: 'clamp(16px, 1.67vw, 24px)' }}>
      <div
        className="relative shrink-0"
        style={{
          width: 'clamp(120px, 11.5vw, 156px)',
          height: 'clamp(108px, 10vw, 140px)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none select-none absolute"
          style={{ inset: '6%' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/for-developers/why/deco-glow-card.svg"
            alt=""
            style={{ display: 'block', width: '100%', height: '100%' }}
          />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={icon}
          alt=""
          aria-hidden
          className="pointer-events-none select-none absolute inset-0 h-full w-full object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="flex flex-col min-w-0" style={{ flex: '1 1 0', gap: '17px' }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h3)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: '#111111',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--fs-body)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.4,
            color: '#333333',
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

function MobileWhyCard({ icon, title, desc }: CardDef): React.ReactElement {
  return (
    <div
      className="relative bg-white flex flex-col items-center"
      style={{
        borderRadius: '24px',
        padding: '20px 24px 28px',
        boxShadow:
          '0 1px 2px rgba(17, 17, 17, 0.04), 0 12px 32px -8px rgba(17, 17, 17, 0.06)',
      }}
    >
      <div className="relative shrink-0" style={{ width: '96px', height: '88px' }}>
        <div
          aria-hidden
          className="pointer-events-none select-none absolute"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80px',
            height: '80px',
            background: '#DF9BFF',
            opacity: 0.35,
            filter: 'blur(20.78px)',
            borderRadius: '50%',
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={icon}
          alt=""
          aria-hidden
          className="pointer-events-none select-none absolute inset-0 h-full w-full object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="flex flex-col items-center text-center" style={{ marginTop: '12px', gap: '12px' }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h4)',
            fontWeight: 600,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            color: '#000000',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--fs-body-sm)',
            fontWeight: 400,
            letterSpacing: '-0.04em',
            lineHeight: 1.4,
            color: 'rgba(17, 17, 17, 0.8)',
            maxWidth: '260px',
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

export function DeveloperWhyItMatters(): React.ReactElement {
  return (
    <section
      data-section="DeveloperWhyItMatters"
      className="relative overflow-hidden"
      style={{ backgroundColor: '#F6F6F6' }}
    >
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: 'calc(-500 / 1920 * 100vw)',
          top: 'calc(-539 / 1920 * 100vw)',
          width: 'calc(1181 / 1920 * 100vw)',
          height: 'calc(1181 / 1920 * 100vw)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/for-developers/why/deco-union-left.svg"
          alt=""
          style={{ display: 'block', width: '100%', height: '100%' }}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: 'calc(1216 / 1920 * 100vw)',
          top: 'calc(-535 / 1920 * 100vw)',
          width: 'calc(1101 / 1920 * 100vw)',
          height: 'calc(1101 / 1920 * 100vw)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/for-developers/why/deco-union-right.svg"
          alt=""
          style={{ display: 'block', width: '100%', height: '100%' }}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: 'calc(-311 / 1920 * 100vw)',
          top: 'calc(-319 / 1920 * 100vw)',
          width: 'calc(744 / 1920 * 100vw)',
          height: 'calc(744 / 1920 * 100vw)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/for-developers/why/deco-glow-top-left.svg"
          alt=""
          style={{ display: 'block', width: '100%', height: '100%' }}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: 'calc(1477 / 1920 * 100vw)',
          top: 'calc(-319 / 1920 * 100vw)',
          width: 'calc(744 / 1920 * 100vw)',
          height: 'calc(744 / 1920 * 100vw)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/for-developers/why/deco-glow-top-right.svg"
          alt=""
          style={{ display: 'block', width: '100%', height: '100%' }}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div
        className="relative mx-auto"
        style={{
          maxWidth: 'var(--container-default)',
          paddingLeft: 'clamp(16px, 4vw, 48px)',
          paddingRight: 'clamp(16px, 4vw, 48px)',
          paddingTop: 'clamp(56px, 6.25vw, 120px)',
          paddingBottom: 'clamp(48px, 5.2vw, 100px)',
        }}
      >
        <Reveal header>
          <h2
            className="text-center mx-auto"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h2)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.15,
              color: '#111111',
              marginBottom: 'clamp(32px, 4.17vw, 80px)',
            }}
          >
            Why It Matters
          </h2>
        </Reveal>

        <div className="flex flex-col gap-4 lg:hidden">
          {MOBILE_ORDER.map((idx) => (
            <MobileWhyCard key={`m-${idx}`} {...CARDS[idx as 0 | 1 | 2 | 3]} />
          ))}
        </div>

        <div className="relative hidden lg:block">
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: '50%',
              top: '4%',
              bottom: '4%',
              width: '1px',
              background: DIVIDER_V,
            }}
          />

          <div
            className="grid grid-cols-2"
            style={{ rowGap: 0, columnGap: 0 }}
          >
            <div style={{ paddingRight: '32px', paddingBottom: '48px' }}>
              <DesktopWhyCard {...CARDS[0]} />
            </div>
            <div style={{ paddingLeft: '32px', paddingBottom: '48px' }}>
              <DesktopWhyCard {...CARDS[1]} />
            </div>

            <div
              aria-hidden
              className="pointer-events-none"
              style={{
                gridColumn: '1 / -1',
                height: '1px',
                background: DIVIDER_H,
              }}
            />

            <div style={{ paddingRight: '32px', paddingTop: '48px' }}>
              <DesktopWhyCard {...CARDS[2]} />
            </div>
            <div style={{ paddingLeft: '32px', paddingTop: '48px' }}>
              <DesktopWhyCard {...CARDS[3]} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
