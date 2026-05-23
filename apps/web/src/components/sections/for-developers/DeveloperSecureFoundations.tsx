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
const CARD_BG =
  'linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)';
const CODE_PANEL_SHADOW =
  '0px 120px 120px 0px rgba(223,155,255,0.08),' +
  '0px 64px 64px 0px rgba(22,34,51,0.12),' +
  '0px 32px 32px 0px rgba(22,34,51,0.04),' +
  '0px 24px 24px 0px rgba(22,34,51,0.04),' +
  '0px 4px 24px 0px rgba(22,34,51,0.04),' +
  '0px 4px 4px 0px rgba(22,34,51,0.04)';
const PILLAR_DIVIDER =
  'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.3) 80%, transparent 100%)';

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
  return (
    <div
      className="relative overflow-hidden"
      style={{
        flex: '1 1 0',
        /* Figma 602px → 451px @1440; let it fill available flex space */
        minWidth: 0,
        borderRadius: '40px',
      }}
    >
      {/* ── Card base gradient ── */}
      <div className="absolute inset-0" style={{ background: CARD_BG }} />

      {/* ── Background texture (mix-blend-saturation) — subtle noise/grid pattern ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/for-developers/secure/card-texture.png"
        alt=""
        className="absolute pointer-events-none select-none"
        style={{
          left: '-8%',
          top: '-20%',
          width: '116%',
          height: 'auto',
          mixBlendMode: 'saturation',
          opacity: 0.6,
          transform: 'rotate(-0.73deg)',
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Header gradient overlay ── */}
      {isCleanStart ? (
        /* Right card: vivid cyan/purple radial glow in header */
        <div
          aria-hidden
          className="absolute pointer-events-none select-none"
          style={{
            /* Matches Figma gradient image position: left=-113px, top=-229px at Figma scale → ×0.75 */
            left: 'calc(-113px * 0.75)',
            top: 'calc(-229px * 0.75)',
            width: 'calc(1028px * 0.75)',
            height: 'calc(1028px * 0.75)',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse at 55% 60%, rgba(44,193,235,0.55) 0%, rgba(71,30,192,0.4) 30%, rgba(19,30,143,0.2) 55%, transparent 75%)',
          }}
        />
      ) : (
        /* Left card: gradient overlay (card-gradient-left.png, 1024×1024, 4KB) */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          aria-hidden
          src="/images/for-developers/secure/card-gradient-left.png"
          alt=""
          className="absolute pointer-events-none select-none"
          style={{
            left: 'calc(-113px * 0.75)',
            top: 'calc(-229px * 0.75)',
            width: 'calc(1028px * 0.75)',
            height: 'calc(1028px * 0.75)',
            maxWidth: 'none',
            objectFit: 'cover',
          }}
          loading="lazy"
          decoding="async"
        />
      )}

      {/* ── Teal flare at header/body junction (right card only) ── */}
      {isCleanStart && (
        <div
          aria-hidden
          className="absolute pointer-events-none select-none"
          style={{
            left: '-15%',
            top: '55px',
            width: '130%',
            height: '100px',
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(44,193,235,0.45) 0%, rgba(21,173,250,0.2) 40%, transparent 70%)',
          }}
        />
      )}

      {/* ── Hex vector overlay (right card only, top-right, soft-light blend) ── */}
      {isCleanStart && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          aria-hidden
          src="/images/for-developers/secure/card-hex.svg"
          alt=""
          className="absolute pointer-events-none select-none"
          style={{
            right: 'calc(-4px * 0.75)',
            top: 'calc(-13px * 0.75)',
            width: 'calc(244px * 0.75)',
            height: 'calc(241px * 0.75)',
            mixBlendMode: 'soft-light',
          }}
          loading="lazy"
          decoding="async"
        />
      )}

      {/* ── Card title (header zone, ~100px tall) ── */}
      <div
        className="relative flex items-center justify-center z-10"
        style={{ height: 'clamp(80px, 6.77vw, 130px)' }}
      >
        <h3
          className="text-white text-center"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1rem, 1.67vw, 2rem)',
            fontWeight: 700,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            padding: '0 clamp(20px, 2.5vw, 40px)',
          }}
        >
          {title}
        </h3>
      </div>

      {/* ── Dark code panel ── */}
      {/*
       * Figma padding at 1920px: 45px top, 48px bottom, 70px left/right.
       * Scaled to 1440px (×0.75): ~34px V, ~52px H.
       * clamp vw values: 45/1920*100=2.34vw (V), 70/1920*100=3.65vw (H).
       */}
      <div
        className="relative z-10"
        style={{
          background: '#0c131c',
          borderRadius: '32px',
          boxShadow: CODE_PANEL_SHADOW,
          paddingTop: 'clamp(20px, 2.34vw, 34px)',
          paddingBottom: 'clamp(20px, 2.5vw, 36px)',
          paddingLeft: 'clamp(24px, 3.65vw, 52px)',
          paddingRight: 'clamp(24px, 3.65vw, 52px)',
        }}
      >
        <DockerfileBlock fromImage={fromImage} />
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
          paddingLeft: '48px',
          paddingRight: '48px',
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
        {/* Figma: each pillar 263px, 3 dividers at ~300px intervals within 1276px */}
        <div
          className="relative"
          style={{ marginBottom: 'clamp(40px, 3.65vw, 70px)' }}
        >
          <div
            className="grid grid-cols-2 lg:grid-cols-4"
            style={{ columnGap: 0, rowGap: 'clamp(24px, 2.5vw, 40px)' }}
          >
            {PILLARS.map((pillar, i) => (
              <div key={pillar.title} className="relative">
                {/* Vertical divider before pillars 2–4 (on lg) */}
                {i > 0 && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute hidden lg:block"
                    style={{
                      left: 0,
                      top: '8%',
                      bottom: '8%',
                      width: '1px',
                      background: PILLAR_DIVIDER,
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

          {/* Cards flex row */}
          <div
            className="relative flex flex-col lg:flex-row"
            style={{ gap: 'clamp(16px, 2.08vw, 40px)' }}
          >
            <CompCard
              title="Traditional Security Operations"
              fromImage="python:3.11-slim"
              isCleanStart={false}
            />
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

        {/* ── Bottom banner ── */}
        {/* Figma: dark gradient rounded-[32px], 1276×146px, text centered */}
        <div
          className="relative overflow-hidden text-center"
          style={{
            background: CARD_BG,
            borderRadius: '32px',
            paddingTop: 'clamp(24px, 2.6vw, 50px)',
            paddingBottom: 'clamp(24px, 2.6vw, 50px)',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          {/* Banner bg texture */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/for-developers/secure/card-texture.png"
            alt=""
            className="absolute pointer-events-none select-none"
            style={{
              left: '-10%',
              top: '-100%',
              width: '120%',
              height: 'auto',
              mixBlendMode: 'saturation',
              opacity: 0.5,
              transform: 'rotate(-0.73deg)',
            }}
            loading="lazy"
            decoding="async"
          />

          <div className="relative z-10 flex flex-col items-center" style={{ gap: '12px' }}>
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
