import type React from 'react';
import Link from 'next/link';
import { LogoMark } from '@/components/icons/Logo';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';

/*
 * "Build on a Verified Software Foundation" — Product Showcase & Operating Loop
 *
 * Displays the two core CleanStart products as structured enterprise showcase
 * cards, followed by the "Powered by CleanStart" divider and the four-step
 * operating loop (Discover, Verify, Govern, Remediate).
 * Copy is the proposal's, verbatim.
 */

interface Step {
  icon: string;
  title: string;
  line1: string;
  line2: string;
}

const STEPS: readonly [Step, Step, Step, Step] = [
  {
    icon: '/images/ciso/enterprise-icon-cloud.svg',
    title: 'Discover',
    line1: 'Gain visibility across',
    line2: 'your environment.',
  },
  {
    icon: '/images/ciso/enterprise-icon-devsecops.svg',
    title: 'Verify',
    line1: 'Verify integrity and',
    line2: 'establish trust.',
  },
  {
    icon: '/images/ciso/enterprise-icon-compliance.svg',
    title: 'Govern',
    line1: 'Enforce policies and',
    line2: 'maintain compliance.',
  },
  {
    icon: '/images/ciso/enterprise-icon-security-ops.svg',
    title: 'Remediate',
    line1: 'Replace risky components',
    line2: 'with verified alternatives.',
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
          'linear-gradient(180deg, rgba(255,255,255,0) 0%, #FDFDFF 96px, #FDFDFF 100%)',
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

        {/* The two Product Artifact Showcase Cards */}
        <RevealStagger
          className="grid grid-cols-1 lg:grid-cols-2"
          style={{ marginTop: 'clamp(28px, 3vw, 40px)', gap: 'clamp(20px, 2vw, 28px)' }}
        >
          {/* Product 1: Verified Container Images */}
          <RevealItem className="h-full">
            <Link
              href="/cleanstart-images"
              className="group flex h-full flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_-20px_rgba(40,30,90,0.18)]"
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid rgba(154,81,255,0.14)',
                padding: 'clamp(20px, 2.2vw, 28px)',
                boxShadow:
                  '0 1px 2px rgba(17,17,17,0.04), 0 16px 40px -24px rgba(40,30,90,0.14)',
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
                    margin: 0,
                  }}
                >
                  Verified Container Images
                </h3>
                <p
                  style={{
                    marginTop: '6px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--fs-body-sm)',
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.45,
                    color: '#555555',
                    margin: 0,
                  }}
                >
                  Hardened, minimal, and secure container images for your applications.
                </p>

                {/* Minimalist Container Runtime Foundation Graphic */}
                <div
                  className="mt-3.5 flex flex-col gap-1.5 rounded-xl p-2.5 sm:p-3"
                  style={{
                    background: 'linear-gradient(135deg, #F9F8FD 0%, #F3F5FA 100%)',
                    border: '1px solid rgba(154,81,255,0.1)',
                  }}
                >
                  <div
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{
                      background: '#ffffff',
                      border: '1px solid rgba(17,17,17,0.06)',
                      boxShadow: '0 1px 3px rgba(17,17,17,0.04)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'var(--fs-body-sm)',
                        fontWeight: 500,
                        color: '#111111',
                      }}
                    >
                      Application Workloads
                    </span>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#9A51FF',
                      }}
                    />
                  </div>

                  <div
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{
                      background: '#ffffff',
                      border: '1px solid rgba(17,17,17,0.06)',
                      boxShadow: '0 1px 3px rgba(17,17,17,0.04)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'var(--fs-body-sm)',
                        fontWeight: 500,
                        color: '#111111',
                      }}
                    >
                      Runtime Components
                    </span>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#2CC1EB',
                      }}
                    />
                  </div>

                  <div
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{
                      background: 'linear-gradient(135deg, rgba(154,81,255,0.08) 0%, rgba(44,193,235,0.08) 100%)',
                      border: '1px solid rgba(154,81,255,0.18)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'var(--fs-body-sm)',
                        fontWeight: 600,
                        color: '#3D3766',
                      }}
                    >
                      Minimal Base Images
                    </span>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#10B981',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div
                className="mt-4 flex items-center justify-between pt-3 text-sm font-semibold text-[#7C4FF0] transition-colors group-hover:text-[#5B21B6]"
                style={{ borderTop: '1px solid rgba(17,17,17,0.08)' }}
              >
                <span>Learn more about CleanStart Images</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
          </RevealItem>

          {/* Product 2: Verified Libraries & Dependencies */}
          <RevealItem className="h-full">
            <Link
              href="/clean-libraries"
              className="group flex h-full flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_-20px_rgba(40,30,90,0.18)]"
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid rgba(154,81,255,0.14)',
                padding: 'clamp(20px, 2.2vw, 28px)',
                boxShadow:
                  '0 1px 2px rgba(17,17,17,0.04), 0 16px 40px -24px rgba(40,30,90,0.14)',
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
                    margin: 0,
                  }}
                >
                  Verified Libraries & Dependencies
                </h3>
                <p
                  style={{
                    marginTop: '6px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--fs-body-sm)',
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.45,
                    color: '#555555',
                    margin: 0,
                  }}
                >
                  Secure, trusted libraries and dependencies for your applications.
                </p>

                {/* Minimalist Verified Component Chain Graphic */}
                <div
                  className="mt-3.5 flex flex-col gap-1.5 rounded-xl p-2.5 sm:p-3"
                  style={{
                    background: 'linear-gradient(135deg, #F9F8FD 0%, #F3F5FA 100%)',
                    border: '1px solid rgba(154,81,255,0.1)',
                  }}
                >
                  <div
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{
                      background: '#ffffff',
                      border: '1px solid rgba(17,17,17,0.06)',
                      boxShadow: '0 1px 3px rgba(17,17,17,0.04)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'var(--fs-body-sm)',
                        fontWeight: 500,
                        color: '#111111',
                      }}
                    >
                      Frameworks
                    </span>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#9A51FF',
                      }}
                    />
                  </div>

                  <div
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{
                      background: '#ffffff',
                      border: '1px solid rgba(17,17,17,0.06)',
                      boxShadow: '0 1px 3px rgba(17,17,17,0.04)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'var(--fs-body-sm)',
                        fontWeight: 500,
                        color: '#111111',
                      }}
                    >
                      Packages
                    </span>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#2CC1EB',
                      }}
                    />
                  </div>

                  <div
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{
                      background: 'linear-gradient(135deg, rgba(154,81,255,0.08) 0%, rgba(44,193,235,0.08) 100%)',
                      border: '1px solid rgba(154,81,255,0.18)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'var(--fs-body-sm)',
                        fontWeight: 600,
                        color: '#3D3766',
                      }}
                    >
                      Third-Party Libraries
                    </span>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#10B981',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div
                className="mt-4 flex items-center justify-between pt-3 text-sm font-semibold text-[#7C4FF0] transition-colors group-hover:text-[#5B21B6]"
                style={{ borderTop: '1px solid rgba(17,17,17,0.08)' }}
              >
                <span>Learn more about Clean Libraries</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
          </RevealItem>
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
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--fs-body-sm)',
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.5,
                    color: '#555555',
                  }}
                >
                  <span className="block">{step.line1}</span>
                  <span className="block">{step.line2}</span>
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
