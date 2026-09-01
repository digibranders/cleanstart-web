import Image from 'next/image';
import type React from 'react';

/*
 * SaaS hero artifact — a CleanStart Images product panel.
 *
 * Built in code rather than rendered. The 3D dashboard render this replaces
 * (hero-app-platform.webp) was rejected, and the fault was its content, not its
 * craft: a rising line chart promises revenue growth on a page that sells
 * container security.
 *
 * So this is still a dashboard — the familiar SaaS hero move of a light product
 * surface floating on a dark gradient — but every panel in it is about the
 * software supply chain. Stats on the left of a catalogue, images with their
 * hardening state on the right. No charts.
 *
 * Figures are the ones images.cleanstart.com publishes on its own landing page
 * (947 images, 34%+ average CVE reduction, 4M+ packages from verified source),
 * and "Security Hardened" / "FIPS Available" are the badges its image detail
 * pages carry. Per-image CVE counts are deliberately absent: the catalogue does
 * not publish them per image, so any number here would be invented.
 *
 * The four images are a SaaS service stack (edge, cache, data, runtime), not a
 * list of popular tags — that is what makes the artifact belong to this page
 * rather than to the finance one.
 */

interface ImageRow {
  readonly name: string;
  readonly role: string;
  readonly logoUrl: string;
  readonly fips: boolean;
  /** devicon wordmarks with heavy internal whitespace sit small in the plate. */
  readonly logoScale?: number;
}

function deviconLogo(folder: string, variant: string): string {
  return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${folder}/${folder}-${variant}.svg`;
}

const ROWS: readonly ImageRow[] = [
  {
    name: 'nginx',
    role: 'Edge',
    logoUrl: deviconLogo('nginx', 'original'),
    fips: true,
    logoScale: 1.2,
  },
  { name: 'node', role: 'Runtime', logoUrl: deviconLogo('nodejs', 'original'), fips: true },
  { name: 'postgres', role: 'Data', logoUrl: deviconLogo('postgresql', 'original'), fips: true },
  { name: 'redis', role: 'Cache', logoUrl: deviconLogo('redis', 'original'), fips: false },
];

const STATS: readonly { value: string; label: string }[] = [
  { value: '947', label: 'Hardened images' },
  { value: '34%+', label: 'Avg CVE reduction' },
  { value: '4M+', label: 'Verified packages' },
];

const PANEL_TEXT = '#101322';
const PANEL_MUTED = 'rgba(16,19,34,0.52)';
const HAIRLINE = 'rgba(16,19,34,0.08)';

function RailGlyph({ active, bars }: { active: boolean; bars: number }): React.ReactElement {
  return (
    <div
      className="flex flex-col items-center justify-center gap-[3px]"
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '8px',
        background: active ? '#005be3' : 'rgba(16,19,34,0.05)',
      }}
    >
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          style={{
            display: 'block',
            height: '2px',
            width: i === 1 ? '9px' : '13px',
            borderRadius: '2px',
            background: active ? 'rgba(255,255,255,0.92)' : 'rgba(16,19,34,0.28)',
          }}
        />
      ))}
    </div>
  );
}

/*
 * Blue for hardened, violet for FIPS — the CleanStart pair. The first pass used
 * a conventional status green, which is the one colour on the panel that could
 * belong to any dashboard on the internet.
 */
function StatusChip({ label, tone }: { label: string; tone: 'ok' | 'fips' }): React.ReactElement {
  return (
    <span
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '10px',
        fontWeight: 500,
        lineHeight: 1,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        padding: '4px 7px',
        borderRadius: '999px',
        color: tone === 'ok' ? '#0a54c9' : '#6d28d9',
        background: tone === 'ok' ? 'rgba(0,91,227,0.08)' : 'rgba(154,81,255,0.12)',
        border: tone === 'ok' ? '1px solid rgba(0,91,227,0.18)' : '1px solid rgba(154,81,255,0.22)',
      }}
    >
      {label}
    </span>
  );
}

export function SaasHeroDashboard(): React.ReactElement {
  return (
    <div className="relative" style={{ perspective: '1700px' }}>
      {/* Brand bloom behind the panel. A white surface dropped straight onto the
          hero mesh reads as a cut-out; this seats it in CleanStart's blue and
          violet so it belongs to the gradient it sits on. */}
      <div
        style={{
          position: 'absolute',
          inset: '-16% -12%',
          borderRadius: '50%',
          background:
            'radial-gradient(58% 54% at 52% 46%, rgba(35,156,255,0.34) 0%, rgba(91,107,255,0.20) 42%, rgba(154,81,255,0.10) 66%, rgba(154,81,255,0) 78%)',
          filter: 'blur(12px)',
        }}
      />

      {/* One rotation for the whole scene, with the floating card pushed forward
          on Z inside it, so panel and card share a single vanishing point. The
          left edge is the near edge: the artifact sits right of the copy, so it
          turns back toward the headline rather than away off the page.

          No `will-change` and no `backdrop-filter` here — both have caused
          stacking-context and GPU-promotion artifacts elsewhere on this site. */}
      <div
        className="cs-hero-panel relative"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'rotateY(-13deg) rotateX(3deg)',
        }}
      >
        <div
          style={{
            width: '520px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.22)',
            boxShadow: '0 44px 96px -30px rgba(4,6,24,0.74), 0 10px 26px -12px rgba(4,6,24,0.42)',
            overflow: 'hidden',
          }}
        >
          {/* Window chrome. Keeps the artifact reading as a product surface rather
          than as a content card dropped on the gradient. */}
          <div
            className="flex items-center gap-2"
            style={{ padding: '11px 14px', borderBottom: `1px solid ${HAIRLINE}` }}
          >
            <span
              style={{ width: 8, height: 8, borderRadius: 999, background: 'rgba(16,19,34,0.14)' }}
            />
            <span
              style={{ width: 8, height: 8, borderRadius: 999, background: 'rgba(16,19,34,0.14)' }}
            />
            <span
              style={{ width: 8, height: 8, borderRadius: 999, background: 'rgba(16,19,34,0.14)' }}
            />
            <span
              className="ml-2 flex-1"
              style={{
                height: '20px',
                borderRadius: '6px',
                background: 'rgba(16,19,34,0.04)',
                border: `1px solid ${HAIRLINE}`,
              }}
            />
          </div>

          <div className="flex">
            {/* Left rail */}
            <div
              className="flex flex-col items-center gap-2"
              style={{ width: '52px', padding: '14px 0', borderRight: `1px solid ${HAIRLINE}` }}
            >
              <RailGlyph active bars={3} />
              <RailGlyph active={false} bars={2} />
              <RailGlyph active={false} bars={3} />
              <RailGlyph active={false} bars={2} />
            </div>

            <div className="flex-1" style={{ padding: '14px 16px 16px' }}>
              <div className="flex gap-2">
                {STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex-1"
                    style={{
                      background: 'rgba(16,19,34,0.035)',
                      border: `1px solid ${HAIRLINE}`,
                      borderRadius: '10px',
                      padding: '10px 11px',
                    }}
                  >
                    {/* Brand keyline above each figure. Carries CleanStart's blue
                    into the panel body, which is otherwise all neutrals. */}
                    <span
                      style={{
                        display: 'block',
                        width: '16px',
                        height: '2px',
                        borderRadius: '2px',
                        marginBottom: '8px',
                        background: 'linear-gradient(90deg, #005be3 0%, #239cff 100%)',
                      }}
                    />
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '19px',
                        fontWeight: 600,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                        color: PANEL_TEXT,
                      }}
                    >
                      {stat.value}
                    </div>
                    <div
                      style={{
                        marginTop: '3px',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '10px',
                        lineHeight: 1.2,
                        color: PANEL_MUTED,
                      }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="flex items-center"
                style={{
                  marginTop: '16px',
                  paddingBottom: '7px',
                  borderBottom: `1px solid ${HAIRLINE}`,
                  fontFamily: 'var(--font-sans)',
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: 'rgba(16,19,34,0.38)',
                }}
              >
                <span>Image</span>
                <span style={{ marginLeft: 'auto' }}>Status</span>
              </div>

              {ROWS.map((row, i) => (
                <div
                  key={row.name}
                  className="cs-hero-panel-row flex items-center gap-2.5"
                  style={{
                    animationDelay: `${260 + i * 70}ms`,
                    padding: '9px 0',
                    borderBottom: i === ROWS.length - 1 ? 'none' : `1px solid ${HAIRLINE}`,
                  }}
                >
                  <span
                    className="flex shrink-0 items-center justify-center overflow-hidden"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '7px',
                      background: 'rgba(16,19,34,0.04)',
                      border: `1px solid ${HAIRLINE}`,
                    }}
                  >
                    <Image
                      src={row.logoUrl}
                      alt=""
                      width={48}
                      height={48}
                      unoptimized
                      className="block object-contain"
                      style={{
                        width: '64%',
                        height: '64%',
                        transform: row.logoScale ? `scale(${row.logoScale})` : undefined,
                      }}
                    />
                  </span>

                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12.5px',
                      color: PANEL_TEXT,
                    }}
                  >
                    {row.name}
                  </span>

                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '9px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'rgba(16,19,34,0.34)',
                    }}
                  >
                    {row.role}
                  </span>

                  <span className="ml-auto flex items-center gap-1.5">
                    {row.fips && <StatusChip label="FIPS" tone="fips" />}
                    <StatusChip label="Hardened" tone="ok" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Provenance card, pushed forward on Z and overlapping the panel's lower
          left corner. It does the work a flat panel cannot: it breaks the
          rectangle, it puts a dark brand-coloured element against the white so
          the composition has two tones, and it carries the three artifacts the
          page keeps promising. Sibling of the panel, not a child — the panel
          clips its own overflow. */}
      <div
        className="cs-hero-panel-float absolute flex items-center gap-2"
        style={{
          left: '-30px',
          bottom: '-24px',
          transform: 'rotateY(-13deg) rotateX(3deg) translateZ(52px)',
          padding: '10px 14px',
          borderRadius: '12px',
          background: 'linear-gradient(140deg, #1a1440 0%, #241a5c 100%)',
          border: '1px solid rgba(154,81,255,0.42)',
          boxShadow: '0 24px 50px -18px rgba(4,6,24,0.8)',
        }}
      >
        {['SBOM', 'Signature', 'Provenance'].map((label, i) => (
          <span key={label} className="flex items-center gap-2">
            {i > 0 && (
              <span
                style={{
                  width: '3px',
                  height: '3px',
                  borderRadius: '999px',
                  background: 'rgba(154,81,255,0.6)',
                }}
              />
            )}
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '10.5px',
                fontWeight: 500,
                letterSpacing: '0.02em',
                lineHeight: 1,
                color: 'rgba(228,220,255,0.94)',
              }}
            >
              {label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
