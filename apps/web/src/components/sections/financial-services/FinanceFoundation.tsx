import type React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LogoMark } from '@/components/icons/Logo';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';

/*
 * "Build on a Verified Software Foundation" — the page's resolution, built on
 * the site's light-band vocabulary: the shared hex-grid unions and corner
 * glows from /images/for-developers/why/, white artifact cards, and the
 * CisoEnterprise blue-sphere icon treatment for the four operating steps.
 * Copy is the proposal's, verbatim.
 */

interface Pillar {
  icon: string;
  iconAlt: string;
  title: string;
  body: string;
  href: string;
}

const PILLARS: readonly [Pillar, Pillar] = [
  {
    icon: '/images/cleanstart-images/uvp-icon-smaller-images.webp',
    iconAlt: '3D icon of stacked container blocks',
    title: 'Verified Container Images',
    body: 'Hardened, minimal, and secure container images for your applications.',
    href: '/cleanstart-images',
  },
  {
    icon: '/images/compare/icon-provenance.webp',
    iconAlt: '3D icon of linked component blocks',
    title: 'Verified Libraries & Dependencies',
    body: 'Secure, trusted, and proven libraries and dependencies for modern applications.',
    href: '/clean-libraries',
  },
];

interface Step {
  icon: string;
  title: string;
  body: string;
}

const STEPS: readonly [Step, Step, Step, Step] = [
  {
    icon: '/images/ciso/enterprise-icon-cloud.svg',
    title: 'Discover',
    body: 'Gain visibility across your environment.',
  },
  {
    icon: '/images/ciso/enterprise-icon-devsecops.svg',
    title: 'Verify',
    body: 'Verify integrity and establish trust.',
  },
  {
    icon: '/images/ciso/enterprise-icon-compliance.svg',
    title: 'Govern',
    body: 'Enforce policies and maintain compliance.',
  },
  {
    icon: '/images/ciso/enterprise-icon-security-ops.svg',
    title: 'Remediate',
    body: 'Replace risky components with verified alternatives.',
  },
];

/** The site's blue gradient sphere — CisoEnterprise's icon treatment. */
function IconSphere({ icon }: { icon: string }): React.ReactElement {
  return (
    <div
      aria-hidden
      className="relative flex shrink-0 items-center justify-center overflow-hidden"
      style={{
        width: 'clamp(64px, 5vw, 80px)',
        height: 'clamp(64px, 5vw, 80px)',
        borderRadius: '50%',
        background: 'linear-gradient(180deg, #239cff 0%, #005be3 100%)',
        boxShadow:
          '0px 6.171px 14.537px 0px rgba(28,60,142,0.33), inset 0px -0.233px 0.291px 0px rgba(0,44,179,0.5), inset 0px 0.116px 0.582px 0px rgba(255,255,255,0.81)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon}
        alt=""
        aria-hidden
        style={{ width: '56%', height: '56%', objectFit: 'contain' }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

export function FinanceFoundation(): React.ReactElement {
  return (
    <section
      data-section="FinanceFoundation"
      className="relative overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, rgba(246,246,246,0) 0%, #F6F6F6 96px, #F6F6F6 100%)',
      }}
    >
      {/* Shared hex-grid unions + corner glows — the light band's decoration. */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
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
        className="pointer-events-none absolute hidden select-none lg:block"
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
        className="pointer-events-none absolute hidden select-none lg:block"
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
        className="pointer-events-none absolute hidden select-none lg:block"
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
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: 'clamp(48px, 5.4vw, 78px)',
          paddingBottom: 'clamp(40px, 4.6vw, 66px)',
        }}
      >
        <div className="mx-auto flex max-w-[760px] flex-col items-center gap-5 text-center">
          <Reveal header>
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
              Build on a{' '}
              <span className="cs-text-gradient-impact">Verified Software Foundation</span>
            </h2>
          </Reveal>

          <Reveal header delay={0.15} y={20}>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-lead-sm)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.5,
                color: 'rgba(17,17,17,0.8)',
                margin: 0,
              }}
            >
              Trusted software artifacts for regulated financial applications.
            </p>
          </Reveal>
        </div>

        {/* The two artifacts. */}
        <RevealStagger
          className="grid grid-cols-1 lg:grid-cols-2"
          style={{ marginTop: 'clamp(28px, 3vw, 44px)', gap: 'clamp(20px, 2vw, 28px)' }}
        >
          {PILLARS.map((pillar) => (
            <RevealItem key={pillar.title} className="h-full">
              <Link
                href={pillar.href}
                className="group flex h-full flex-col items-center gap-6 text-center transition-transform duration-300 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7C4FF0] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:flex-row sm:text-left"
                style={{
                  background: '#ffffff',
                  borderRadius: '24px',
                  border: '1px solid rgba(154,81,255,0.14)',
                  padding: 'clamp(22px, 2.2vw, 30px)',
                  boxShadow: '0 1px 2px rgba(17,17,17,0.04), 0 18px 44px -24px rgba(40,30,90,0.22)',
                }}
              >
                <div
                  className="relative shrink-0"
                  aria-hidden
                  style={{ width: 'clamp(96px, 8vw, 116px)', height: 'clamp(96px, 8vw, 116px)' }}
                >
                  <span
                    className="absolute"
                    style={{
                      left: '4%',
                      top: '6%',
                      width: '92%',
                      height: '92%',
                      borderRadius: '50%',
                      background: '#DF9BFF',
                      opacity: 0.32,
                      filter: 'blur(24px)',
                    }}
                  />
                  <Image
                    src={pillar.icon}
                    alt={pillar.iconAlt}
                    fill
                    sizes="132px"
                    className="relative object-contain"
                  />
                </div>

                <div className="flex min-w-0 flex-col" style={{ gap: '12px' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--fs-h3)',
                      fontWeight: 600,
                      letterSpacing: '-0.04em',
                      lineHeight: 1.15,
                      color: '#111111',
                      margin: 0,
                    }}
                  >
                    {pillar.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--fs-body)',
                      fontWeight: 400,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.5,
                      color: '#555555',
                      margin: 0,
                    }}
                  >
                    {pillar.body}
                  </p>
                </div>
              </Link>
            </RevealItem>
          ))}
        </RevealStagger>

        {/* Powered by CleanStart — the proposal's own divider. */}
        <Reveal delay={0.1} y={18}>
          <div
            className="flex items-center"
            style={{ marginTop: 'clamp(24px, 2.6vw, 40px)', gap: 'clamp(16px, 2vw, 32px)' }}
          >
            <span
              aria-hidden
              className="hidden flex-1 sm:block"
              style={{
                height: '1px',
                background:
                  'linear-gradient(to right, rgba(217,217,217,0) 0%, #d9d9d9 60%, #d9d9d9 100%)',
              }}
            />
            <span className="mx-auto flex items-center gap-3 sm:mx-0">
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  lineHeight: 1.4,
                  color: '#6b6b6b',
                  whiteSpace: 'nowrap',
                }}
              >
                Powered by
              </span>
              <LogoMark className="h-[26px] w-[23px] shrink-0" />
              <span
                className="font-display"
                style={{
                  fontSize: 'var(--fs-h5)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.2,
                  color: '#111111',
                  whiteSpace: 'nowrap',
                }}
              >
                CleanStart
              </span>
            </span>
            <span
              aria-hidden
              className="hidden flex-1 sm:block"
              style={{
                height: '1px',
                background:
                  'linear-gradient(to left, rgba(217,217,217,0) 0%, #d9d9d9 60%, #d9d9d9 100%)',
              }}
            />
          </div>
        </Reveal>

        {/* The operating loop. */}
        <RevealStagger
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ marginTop: 'clamp(22px, 2.4vw, 34px)', gap: 'clamp(24px, 2.4vw, 36px)' }}
        >
          {STEPS.map((step) => (
            <RevealItem key={step.title}>
              <div
                className="flex h-full flex-col items-center text-center"
              >
                <IconSphere icon={step.icon} />
                <h3
                  style={{
                    marginTop: 'clamp(14px, 1.4vw, 20px)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--fs-h4)',
                    fontWeight: 600,
                    letterSpacing: '-0.035em',
                    lineHeight: 1.2,
                    color: '#111111',
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    marginTop: '8px',
                    maxWidth: '26ch',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--fs-body-sm)',
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.5,
                    color: '#555555',
                  }}
                >
                  {step.body}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
