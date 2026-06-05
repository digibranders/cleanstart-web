import type React from 'react';
import { Reveal } from '@/components/ui/Reveal';

interface PillarDef {
  title: string;
  desc: string;
  /**
   * Optional title max-width (in `ch`) to force a deliberate two-line wrap on the
   * desktop grid, keeping every card's description baseline aligned. Scales with
   * the font, so the break holds across the fluid `--fs-h3` range.
   */
  titleMaxCh?: number;
}

const PILLARS: PillarDef[] = [
  {
    title: 'Drop-In Compatible',
    desc: 'Replace existing base images with minimal changes.',
    titleMaxCh: 12,
  },
  {
    title: 'Minimal Runtime Images',
    desc: 'Reduce unnecessary packages and dependencies.',
  },
  {
    title: 'Continuously Updated',
    desc: 'Rapidly address newly disclosed vulnerabilities.',
  },
  {
    title: 'Verifiable Components',
    desc: 'Build from trusted sources with reproducible pipelines.',
  },
];

const SECTION_BG =
  'linear-gradient(to bottom, #151021 0%, #131e8f 62.497%, #471ec0 100%)';
const CODE_PANEL_SHADOW =
  '0px 120px 120px 0px rgba(223,155,255,0.08),' +
  '0px 64px 64px 0px rgba(22,34,51,0.12),' +
  '0px 32px 32px 0px rgba(22,34,51,0.04),' +
  '0px 24px 24px 0px rgba(22,34,51,0.04),' +
  '0px 4px 24px 0px rgba(22,34,51,0.04),' +
  '0px 4px 4px 0px rgba(22,34,51,0.04)';
const PILLAR_DIVIDER_V =
  'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.3) 80%, transparent 100%)';
const PILLAR_DIVIDER_H =
  'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.3) 80%, transparent 100%)';

/** Syntax-highlighted Dockerfile content for each card */
interface DockerfileProps {
  fromImage: string;
}

function DockerfileBlock({ fromImage }: DockerfileProps): React.ReactElement {
  // All rows share one line-height; blank rows render an invisible character at
  // the same height so the card height stays consistent (a shorter div under-measured).
  const base: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--fs-body)',
    fontWeight: 600,
    letterSpacing: '-0.05em',
    lineHeight: 1.4,
    color: '#ffffff',
    whiteSpace: 'pre',
    margin: 0,
    padding: 0,
    display: 'block',
  };
  const kw: React.CSSProperties = { color: '#ff9ed0' };
  const str: React.CSSProperties = { color: '#1ed88d' };
  const blank: React.CSSProperties = { ...base, visibility: 'hidden' };

  return (
    <div>
      <p style={base}><span style={kw}>FROM</span>{` ${fromImage}`}</p>
      <p style={blank}>{'x'}</p>
      <p style={base}><span style={kw}>WORKDIR</span>{' /app'}</p>
      <p style={blank}>{'x'}</p>
      <p style={base}><span style={kw}>COPY</span>{' . /app'}</p>
      <p style={blank}>{'x'}</p>
      <p style={base}><span style={kw}>RUN</span>{' pip install -r requirements.txt'}</p>
      <p style={blank}>{'x'}</p>
      <p style={base}>
        <span style={kw}>CMD</span>{' ['}
        <span style={str}>{'"python"'}</span>{', '}
        <span style={str}>{'"app.py"'}</span>{']'}
      </p>
    </div>
  );
}

/** Single comparison card */
interface CompCardProps {
  title: string;
  fromImage: string;
  /** The right (CleanStart) card gets the teal accent and chevron watermark. */
  isCleanStart: boolean;
}

function CompCard({ title, fromImage, isCleanStart }: CompCardProps): React.ReactElement {
  return (
    <div
      className="relative flex h-full w-full flex-col"
      style={{
        flex: '1 1 0',
        minWidth: 0,
        borderRadius: 'clamp(24px, 2.78vw, 40px)',
        background: 'rgba(44, 193, 235, 0.4)',
        padding: 'clamp(6px, 0.7vw, 10px)',
        boxShadow: CODE_PANEL_SHADOW,
        zIndex: 10,
      }}
    >
      <div
        className="relative flex flex-1 flex-col overflow-hidden"
        style={{ borderRadius: 32 }}
      >
        <div
          className="relative flex w-full items-center justify-center overflow-hidden"
          style={{
            height: 'clamp(76px, 7vw, 100px)',
            background: isCleanStart
              ? 'linear-gradient(135deg, #1B0E33 0%, #2B1456 40%, #471EC0 100%)'
              : 'linear-gradient(135deg, #151021 0%, #1A1733 60%, #221A3D 100%)',
          }}
        >
          {isCleanStart ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              aria-hidden
              src="/images/security/header-chevron.svg"
              alt=""
              className="pointer-events-none absolute select-none mix-blend-soft-light"
              style={{
                right: '-120px',
                top: '-2px',
                width: '258px',
                height: '236px',
                opacity: 0.7,
              }}
              loading="lazy"
              decoding="async"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              aria-hidden
              src="/images/security/header-cube.svg"
              alt=""
              className="pointer-events-none absolute select-none mix-blend-soft-light"
              style={{
                right: '-37px',
                top: '-13px',
                width: '162px',
                height: '186.4px',
                opacity: 0.7,
              }}
              loading="lazy"
              decoding="async"
            />
          )}

          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{
              height: '60px',
              background:
                'radial-gradient(60% 140% at 50% 100%, rgba(44,193,235,0.65) 0%, rgba(44,193,235,0.25) 35%, rgba(44,193,235,0) 70%)',
              filter: 'blur(6px)',
            }}
          />

          <h3
            className="relative z-10 text-center text-white"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h3)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              padding: '0 clamp(20px, 2.5vw, 40px)',
            }}
          >
            {title}
          </h3>
        </div>

        <div
          className="relative flex flex-1 flex-col"
          style={{
            background: '#0c131c',
            paddingTop: 'clamp(20px, 2.34vw, 34px)',
            paddingBottom: 'clamp(20px, 2.5vw, 36px)',
            paddingLeft: 'clamp(24px, 3.65vw, 52px)',
            paddingRight: 'clamp(24px, 3.65vw, 52px)',
          }}
        >
          <DockerfileBlock fromImage={fromImage} />
        </div>
      </div>
    </div>
  );
}

export function DeveloperSecureFoundations(): React.ReactElement {
  return (
    <section
      data-section="DeveloperSecureFoundations"
      className="relative overflow-hidden"
      style={{ background: SECTION_BG }}
    >
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: 'calc(-423 / 1920 * 100vw)',
          top: 'calc(-303 / 1920 * 100vw)',
          width: 'calc(979 / 1920 * 100vw)',
          height: 'calc(979 / 1920 * 100vw)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/for-developers/secure/deco-vector.svg"
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
          left: 'calc(1444 / 1920 * 100vw)',
          top: 'calc(-372 / 1920 * 100vw)',
          width: 'calc(979 / 1920 * 100vw)',
          height: 'calc(979 / 1920 * 100vw)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/for-developers/secure/deco-vector.svg"
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
          paddingTop: 'clamp(48px, 4.17vw, 80px)',
          paddingBottom: 'clamp(60px, 5.2vw, 100px)',
        }}
      >
        <Reveal header>
          <h2
            className="text-white text-center mx-auto"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h2)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              maxWidth: '740px',
              marginBottom: '24px',
            }}
          >
            Secure Foundations Without Workflow Changes
          </h2>
        </Reveal>

        <Reveal header delay={0.15} y={20}>
          <p
            className="text-center mx-auto"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--fs-lead)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.4,
              color: 'rgba(255,255,255,0.8)',
              maxWidth: '600px',
              marginBottom: 'clamp(40px, 3.65vw, 70px)',
            }}
          >
            Replace public base images with hardened alternatives without disrupting existing
            workflows
          </p>
        </Reveal>

        <div
          className="relative"
          style={{
            marginBottom: 'clamp(40px, 3.65vw, 70px)',
          }}
        >
          <div className="flex flex-col items-stretch lg:hidden mx-auto" style={{ maxWidth: '240px' }}>
            {PILLARS.map((pillar, i) => (
              <div key={`m-${pillar.title}`} className="flex flex-col">
                {i > 0 && (
                  <div
                    aria-hidden
                    className="pointer-events-none mx-auto"
                    style={{
                      width: '147px',
                      height: '1px',
                      background: PILLAR_DIVIDER_H,
                      marginTop: '24px',
                      marginBottom: '24px',
                    }}
                  />
                )}
                <p
                  className="text-center"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--fs-h4)',
                    fontWeight: 600,
                    letterSpacing: '-0.04em',
                    lineHeight: 1.1,
                    color: '#ffffff',
                    marginBottom: '12px',
                  }}
                >
                  {pillar.title}
                </p>
                <p
                  className="text-center"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--fs-body-sm)',
                    fontWeight: 400,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.4,
                    color: '#dddddd',
                  }}
                >
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>

          <div
            className="hidden lg:grid lg:grid-cols-4"
            style={{ columnGap: 0, rowGap: 'clamp(24px, 2.5vw, 40px)' }}
          >
            {PILLARS.map((pillar, i) => (
              <div key={pillar.title} className="relative">
                {i > 0 && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute"
                    style={{
                      left: 0,
                      top: '8%',
                      bottom: '8%',
                      width: '1px',
                      background: PILLAR_DIVIDER_V,
                    }}
                  />
                )}
                <div
                  style={{
                    paddingLeft: i > 0 ? 'clamp(20px, 2.5vw, 38px)' : '0',
                    paddingRight: 'clamp(12px, 1.5vw, 24px)',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--fs-h3)',
                      fontWeight: 600,
                      letterSpacing: '-0.04em',
                      lineHeight: 1.1,
                      color: '#ffffff',
                      marginBottom: '12px',
                      maxWidth: pillar.titleMaxCh ? `${pillar.titleMaxCh}ch` : undefined,
                    }}
                  >
                    {pillar.title}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--fs-body)',
                      fontWeight: 400,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.4,
                      color: '#dddddd',
                    }}
                  >
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative" style={{ marginBottom: 'clamp(32px, 3.13vw, 60px)' }}>
          <div
            aria-hidden
            className="pointer-events-none absolute hidden lg:block"
            style={{
              left: 'calc(-10px * 0.75)',
              top: '0',
              width: 'calc(50% - 10px)',
              height: '100%',
              borderRadius: '40px',
              background: 'rgba(167,167,167,0.18)',
            }}
          />

          <div
            aria-hidden
            className="pointer-events-none absolute hidden lg:block"
            style={{
              right: 'calc(-10px * 0.75)',
              top: '0',
              width: 'calc(50% - 10px)',
              height: '100%',
              borderRadius: '40px',
              background: 'rgba(44,193,235,0.18)',
            }}
          />

          <div
            className="relative flex flex-col lg:flex-row items-stretch gap-6 lg:gap-[clamp(16px,2.08vw,40px)]"
          >
            <CompCard
              title="Traditional Security Operations"
              fromImage="python:3.11-slim"
              isCleanStart={false}
            />

            {/* Cropped + 90deg-rotated sprite so the horizontal chevron reads as a downward arrow between stacked cards. */}
            <div
              aria-hidden
              className="pointer-events-none absolute lg:hidden"
              style={{
                right: '20px',
                top: '50%',
                width: '64px',
                height: '64px',
                transform: 'translateY(-50%)',
                zIndex: 20,
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden',
                  transform: 'rotate(90deg)',
                  transformOrigin: 'center center',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/for-developers/secure/badge-seal.png"
                  alt=""
                  style={{
                    position: 'absolute',
                    left: '-42.32%',
                    top: '-102.44%',
                    width: '313.68%',
                    height: '307.32%',
                    maxWidth: 'none',
                  }}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>

            <CompCard
              title="CleanStart image (Drop-in)"
              fromImage="cleanstart/python:3.11"
              isCleanStart={true}
            />
          </div>

          {/* Center chevron sprite — same cropped badge-seal asset, shown only on desktop. */}
          <div
            aria-hidden
            className="pointer-events-none absolute hidden lg:block"
            style={{
              left: '50%',
              top: 'clamp(50px, 7.81vw, 90px)',
              transform: 'translate(-50%, 0)',
              zIndex: 10,
              width: 'clamp(72px, 6.94vw, 100px)',
              height: 'clamp(73px, 7.08vw, 102px)',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/for-developers/secure/badge-seal.png"
              alt=""
              style={{
                position: 'absolute',
                left: '-42.32%',
                top: '-102.44%',
                width: '313.68%',
                height: '307.32%',
                maxWidth: 'none',
              }}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        <div
          className="relative overflow-hidden text-center"
          style={{
            borderRadius: 32,
            background:
              'linear-gradient(135deg, #1B0E33 0%, #2B1456 40%, #471EC0 100%)',
            paddingTop: 'clamp(24px, 2.6vw, 50px)',
            paddingBottom: 'clamp(24px, 2.6vw, 50px)',
            paddingLeft: '24px',
            paddingRight: '24px',
            boxShadow: CODE_PANEL_SHADOW,
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{
              height: '70px',
              background:
                'radial-gradient(60% 140% at 50% 100%, rgba(44,193,235,0.55) 0%, rgba(44,193,235,0.22) 35%, rgba(44,193,235,0) 70%)',
              filter: 'blur(6px)',
            }}
          />

          <div
            className="relative z-10 flex flex-col items-center"
            style={{ gap: '12px' }}
          >
            <p
              className="text-white"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h3)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
              }}
            >
              One change. Same workflow. Strong foundation
            </p>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-body)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.4,
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              Hardened, minimal, and verifiable by default
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
