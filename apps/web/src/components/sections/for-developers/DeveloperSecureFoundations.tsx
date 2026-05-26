import type React from 'react';

/*
 * Figma node 798:2243 — "Secure Foundations Without Workflow Changes" section (1920 px artboard)
 *
 * Background: dark gradient #151021 → #131e8f (62.497%) → #471ec0
 * Decorative: two Vector grid-pattern SVG blobs at top corners
 * H2: 62px Manrope Bold, white, tracking -3.1px, centered
 * Subtitle: 30px Sora Regular, white 80% opacity, centered
 * 4 Feature pillars with 1px vertical gradient dividers at y≈412
 * Two comparison cards (622×529px glow each) at y≈627:
 *   Left: "Traditional Security Operations" — grey glow, neutral card
 *   Right: "CleanStart image (Drop-in)" — teal/cyan glow, vivid gradient header
 *   Both cards: 130px header zone + dark code panel (bg #0c131c)
 *   Dockerfile code: #ff9ed0 keywords, #1ed88d string values
 * Center (between cards): 3D arrow assembly + badge-seal.png
 * Bottom banner: dark gradient rounded rect "One change. Same workflow. Strong foundation"
 * All interior dimensions scaled ×0.75 for the 1440px primary viewport.
 */

interface PillarDef {
  title: string;
  desc: string;
}

const PILLARS: PillarDef[] = [
  {
    title: 'Drop-In Compatible',
    desc: 'Replace existing base images with minimal changes.',
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
  /*
   * Figma: font-semibold 22px / leading-[1.4] / tracking-[-1.1px] at 1920px artboard.
   * Scaled to 1440px primary: 22 × 0.75 = 16.5px.
   * All 9 rows (5 code + 4 blank) use identical line-height so the card height
   * matches Figma exactly. Blank rows render an invisible character at the same
   * height — NOT a shorter height div (which under-measured by ~3px/row).
   */
  const base: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    /* Figma: 22px at 1920px → 16.5px at 1440px.  clamp floor: 14px (mobile). */
    fontSize: 'clamp(0.875rem, 1.15vw, 1.0625rem)',
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
  /* Blank row: same dimensions as a code row, just invisible. */
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
  /** Whether this is the right (CleanStart) card — gets teal accent + hex vector */
  isCleanStart: boolean;
}

function CompCard({ title, fromImage, isCleanStart }: CompCardProps): React.ReactElement {
  /*
   * Mirrors the home page SecurityNotPatching card chrome:
   *   - Outer cyan rect (#2CC1EB), radius 40, 10px padding → reads as a 10px cyan border.
   *   - Inner content radius 32, overflow hidden.
   *   - Header: dark gradient with watermark vector (cube → Traditional, chevron →
   *     CleanStart) at soft-light blend, plus a cyan light-flare across the bottom edge.
   *   - Body: terminal panel (#0c131c) carrying the Dockerfile content — replaces the
   *     home card's white body so the "drop-in code comparison" reading is preserved.
   */
  return (
    <div
      className="relative flex h-full w-full flex-col"
      style={{
        flex: '1 1 0',
        minWidth: 0,
        borderRadius: 'clamp(24px, 2.78vw, 40px)',
        /* Figma fill_BL89KJ: cyan #2CC1EB with 0.4 layer opacity — softer than solid. */
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
        {/* Header — dark gradient + watermark + cyan flare */}
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
              fontSize: 'clamp(1rem, 1.67vw, 2rem)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              padding: '0 clamp(20px, 2.5vw, 40px)',
            }}
          >
            {title}
          </h3>
        </div>

        {/* Body — terminal code panel */}
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
      {/* ── Left Vector grid blob (Figma: left=-423, top=-303, 979px) ── */}
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

      {/* ── Right Vector grid blob (Figma: left=1444, top=-372, 979px) ── */}
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

      {/* ── Content ── */}
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
        {/* H2 — Figma: 62px Manrope Bold, tracking -3.1px */}
        <h2
          className="text-white text-center mx-auto"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 4vw, 56px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            maxWidth: '740px',
            marginBottom: '24px',
          }}
        >
          Secure Foundations Without Workflow Changes
        </h2>

        {/* Subtitle — Vuln spec body-lg */}
        <p
          className="text-center mx-auto"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(18px, 1.7vw, 24px)',
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

        {/* ── 4 Feature pillars ── */}
        {/* Mobile (Figma 857:6108): single column, 204px wide, ~24px gap, centered
            text, thin horizontal divider between pillars.
            Desktop (Figma 798:2243): 4 columns with vertical dividers between. */}
        <div
          className="relative"
          style={{
            marginBottom: 'clamp(40px, 3.65vw, 70px)',
          }}
        >
          {/* Mobile-only flex column with horizontal dividers */}
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
                    fontSize: '20px',
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
                    fontSize: '14px',
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

          {/* Desktop-only 4-col grid with vertical dividers */}
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
                      fontSize: 'clamp(20px, 2vw, 28px)',
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
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'clamp(15px, 1.4vw, 20px)',
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

        {/* ── Two comparison cards + center elements ── */}
        <div className="relative" style={{ marginBottom: 'clamp(32px, 3.13vw, 60px)' }}>
          {/* Left card glow (Figma: 622×529, grey at 40% opacity) */}
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

          {/* Right card glow (Figma: 622×529, teal at 40% opacity) */}
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

          {/* Cards flex row (desktop) / column (mobile). The badge-seal arrow is
              rendered inline between the cards on mobile so it sits in flow, and
              absolutely positioned at the centre on desktop (see block below). */}
          <div
            className="relative flex flex-col lg:flex-row items-stretch gap-6 lg:gap-[clamp(16px,2.08vw,40px)]"
          >
            <CompCard
              title="Traditional Security Operations"
              fromImage="python:3.11-slim"
              isCleanStart={false}
            />

            {/* Mobile-only arrow — absolutely positioned to overlap the joint
                between the two stacked cards on the right edge. Sized to match
                desktop (~64px), with overflow:hidden + cropped sprite + 90°
                rotation so the horizontal `>>` reads as a downward chevron. */}
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

          {/* ── Center: blue 3D double-chevron arrow (badge-seal.png) ── */}
          {/* Figma: 133×136px container at left=894, top=870 (from section top) */}
          {/* Crop: image is 313.68% wide × 307.32% tall, offset left=-42.32%, top=-102.44% */}
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

        {/* ── Bottom banner — same dark→purple body + cyan flare, no cyan border ── */}
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
          {/* Cyan light-flare across the bottom edge — same recipe as the card headers */}
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
                fontSize: 'clamp(22px, 2.4vw, 32px)',
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
                fontSize: 'clamp(15px, 1.4vw, 20px)',
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
