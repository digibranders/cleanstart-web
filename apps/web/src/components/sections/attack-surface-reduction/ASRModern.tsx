import type React from 'react';

// ─── Data ─────────────────────────────────────────────────────────────────────

const TARGETS = [
  {
    title: 'Kubernetes Platforms',
    desc: 'Secure container foundations.',
    icon: '/images/attack-surface-reduction/modern-icon-k8s.svg',
    iconDesktop: '/images/attack-surface-reduction/prod-icon-k8s.png',
  },
  {
    title: 'Regulated Environments',
    desc: 'Built for compliance-heavy workloads.',
    icon: '/images/attack-surface-reduction/modern-icon-regulated.svg',
    iconDesktop: '/images/attack-surface-reduction/prod-icon-docs.png',
  },
  {
    title: 'Security-Focused Teams',
    desc: 'Reduce software supply chain risk.',
    icon: '/images/attack-surface-reduction/modern-icon-security.svg',
    iconDesktop: '/images/attack-surface-reduction/prod-icon-security.png',
  },
] as const;

// ─── Section ──────────────────────────────────────────────────────────────────
/*
 * Desktop (existing): 3-column grid with PNG icon badges, heading left-aligned.
 *
 * Mobile (Figma 920:613 — 360×992px):
 *   BG  : linear-gradient(180deg, #151021 0%, #131e8f 69.941%, #471ec0 111.91%)
 *   Deco: two Union SVGs with mix-blend-overlay (top-right & bottom-left)
 *   H2  : Figtree Bold 28px / lh 1.2 / centred / w-254px / top: 32px
 *         "Environments" → gradient 95.18deg #9A51FF 42.34% → #2CC1EB 98.78%
 *   Items: centred flex-col, gap-24px, items separated by 245×1px dividers
 *   Ball: 60×60px · round · bg linear-gradient(180deg,#239cff,#005be3)
 *         box-shadow outer + inset highlights · icon 33×33px
 *   Title: Figtree Bold 24px / tracking -1.2px / white
 *   Desc : Figtree Regular 16px / tracking -0.8px / white
 */

export function ASRModern(): React.ReactElement {
  return (
    <section
      data-section="ASRModern"
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #151021 0%, #131E8F 69.941%, #471EC0 111.91%)',
      }}
    >
      {/* ── Desktop decorations ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        src="/images/attack-surface-reduction/prod-mesh-1.svg"
        alt=""
        style={{ right: 0, top: 0, width: '340px', height: 'auto', opacity: 0.45 }}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        src="/images/attack-surface-reduction/prod-mesh-2.svg"
        alt=""
        style={{ left: 0, bottom: 0, width: '340px', height: 'auto', opacity: 0.45 }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Mobile decorations: Union shapes with mix-blend-overlay ── */}
      {/*
       * Figma 366:6435 top-right: left calc(50%+184.87px), top:-25px, rotate-150 scale-y-flip
       * Figma 366:6436 bottom-left: left calc(50%-180.13px), top:626px, rotate-30
       * Both: 187.742×195.511px container → 129.669×150.892px inner Union
       */}
      <div
        aria-hidden
        className="absolute md:hidden pointer-events-none select-none overflow-hidden"
        style={{
          left: 'calc(50% + 184.87px)',
          top: '-25px',
          width: '187.742px',
          height: '195.511px',
          transform: 'translateX(-50%)',
          mixBlendMode: 'overlay',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ transform: 'rotate(-150deg) scaleY(-1)', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/attack-surface-reduction/modern-union-tr.svg"
            alt=""
            className="block max-w-none pointer-events-none select-none"
            style={{ width: '129.669px', height: '150.892px' }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
      <div
        aria-hidden
        className="absolute md:hidden pointer-events-none select-none"
        style={{
          left: 'calc(50% - 180.13px)',
          top: '626px',
          width: '187.742px',
          height: '195.511px',
          transform: 'translateX(-50%)',
          mixBlendMode: 'overlay',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ transform: 'rotate(-30deg)', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/attack-surface-reduction/modern-union-bl.svg"
            alt=""
            className="block max-w-none pointer-events-none select-none"
            style={{ width: '129.669px', height: '150.892px' }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {/* ── Desktop content ── */}
      <div
        className="relative hidden md:block mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-section-md pb-[var(--spacing-section-cta)]"
      >
        <h2
          className="text-center sm:text-left"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-display-md)',
            fontWeight: 600,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: 'white',
            maxWidth: '700px',
            marginBottom: 'clamp(32px, 5vw, 64px)',
          }}
        >
          Built for Modern Production{' '}
          <span className="cs-text-gradient-impact">Environments</span>
        </h2>

        <div className="grid grid-cols-3" style={{ gap: '40px' }}>
          {TARGETS.map((t) => (
            <div
              key={t.title}
              className="flex flex-col items-start text-left"
              style={{ gap: '20px' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.iconDesktop}
                alt=""
                aria-hidden
                className="pointer-events-none select-none"
                style={{ width: '72px', height: '72px', objectFit: 'contain' }}
                loading="lazy"
                decoding="async"
              />
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-card-title-lg)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.1,
                  color: 'white',
                }}
              >
                {t.title}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-body-md)',
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.4,
                  color: 'rgba(255,255,255,0.75)',
                }}
              >
                {t.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile content ── */}
      {/*
       * Figma positions (relative to section bg top):
       *   Heading  : top 32px, centred, w-254px
       *   Items div: top 158px, centred, flex-col gap-24px
       */}
      <div
        className="md:hidden relative"
        style={{ minHeight: '992px' }}
      >
        {/* Heading */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '32px',
            transform: 'translateX(-50%)',
            width: '254px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-display-sm)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.2,
              color: 'white',
              margin: 0,
            }}
          >
            {'Built for Modern Production '}
            <span
              style={{
                background: 'linear-gradient(95.18deg, #9A51FF 42.34%, #2CC1EB 98.78%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Environments
            </span>
          </p>
        </div>

        {/* Items list */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '158px',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          {TARGETS.flatMap((t, i) => [
            <ModernItem key={t.title} title={t.title} desc={t.desc} icon={t.icon} />,
            ...(i < TARGETS.length - 1 ? [<ModernDivider key={`d-${i}`} />] : []),
          ])}
        </div>
      </div>
    </section>
  );
}

// ─── Mobile: ModernItem ───────────────────────────────────────────────────────
/*
 * Figma 366:6566/6590/6614:
 *   flex-col · gap-12px · items-center
 *   Ball: 60×60px · rounded-full
 *         bg linear-gradient(180deg, #239cff 0%, #005be3 100%)
 *         box-shadow: 0 3.857px 9.086px rgba(28,60,142,0.33)
 *         inset: 0 -0.145px 0.182px rgba(0,44,179,0.5), 0 0.073px 0.364px rgba(255,255,255,0.81)
 *         radial highlight (simplified from Figma's mask+blend effects)
 *         Icon: 33×33px centred
 *   Title: Figtree Bold 24px / tracking -1.2px / white / centre / lh 1.5
 *   Desc : Figtree Regular 16px / tracking -0.8px / white / centre / lh 1.5
 */
function ModernItem({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: string;
}): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {/* Blue gradient ball */}
      <div
        className="relative overflow-hidden shrink-0"
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '100px',
          background: 'linear-gradient(180deg, #239cff 0%, #005be3 100%)',
          boxShadow:
            '0px 3.857px 9.086px rgba(28,60,142,0.33),' +
            'inset 0px -0.145px 0.182px rgba(0,44,179,0.5),' +
            'inset 0px 0.073px 0.364px rgba(255,255,255,0.81)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Simplified radial highlight (replaces Figma's mask+blend light effects) */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            inset: 0,
            borderRadius: '100px',
            background:
              'radial-gradient(circle at 38% 28%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 55%)',
          }}
        />
        {/* Icon */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src={icon}
          alt=""
          className="relative pointer-events-none select-none"
          style={{ width: '33px', height: '33px', objectFit: 'contain', zIndex: 2 }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Text */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-card-title-md)',
            fontWeight: 600,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: 'white',
            margin: 0,
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-body-md)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.4,
            color: 'white',
            margin: 0,
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

// ─── Mobile: ModernDivider ────────────────────────────────────────────────────
/*
 * Figma Rectangle 19 (same pattern as ASRDelivers) but 245px wide.
 * transparent → white → transparent horizontal gradient line.
 */
function ModernDivider(): React.ReactElement {
  return (
    <div
      aria-hidden
      style={{
        width: '245px',
        height: '1px',
        flexShrink: 0,
        background:
          'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 49.32%, rgba(153,153,153,0) 99.18%)',
      }}
    />
  );
}
