import Image from 'next/image';
import type React from 'react';

/*
 * SaaS hero artifact — the customer's own runtime stack, hardened.
 *
 * Replaces hero-app-platform.webp (a 3D dashboard render the client rejected)
 * and a hexagon lattice that preceded it. Both failed the same way: an
 * illustration OF security is inherently generic, so it reads as stock art
 * whatever the craft level.
 *
 * The category has already settled this. Chainguard's homepage hero is a row of
 * real image cards (Python, Node.js) carrying FIPS VALIDATED / STIG HARDENED
 * badges and live CVE-reduction counts; Docker Hardened Images does the same
 * thing with OS / Architecture / Compliance rows. Neither market leader uses an
 * illustration. Product truth is the convention here, because it is the one
 * thing a competitor cannot copy and a reader cannot dismiss.
 *
 * SaaS-specific through WHICH images: nginx at the edge, redis for cache,
 * postgres for data, node for the runtime is the canonical SaaS service stack.
 * The finance page could not run this artifact.
 *
 * Everything asserted here is sourced from images.cleanstart.com: all four
 * images exist in the 947-image catalogue (verified against a control — a real
 * detail page returns ~210KB, a non-existent one ~81KB), and "Security
 * Hardened", "FIPS Available", SBOM, Signature and Provenance are the badges
 * and per-image tabs that catalogue actually publishes. No per-image CVE counts
 * appear below, deliberately: the catalogue does not publish them per image, so
 * any number here would be invented.
 *
 * Deliberately NOT the /for-developers treatment. That hero is a scrolling
 * marquee arguing breadth ("we cover your whole stack"); this one is a still,
 * detailed column arguing assurance ("and every one carries its paperwork").
 */

interface StackImage {
  readonly name: string;
  readonly role: string;
  readonly logoUrl: string;
  /** nginx's devicon has heavy internal whitespace and sits small in the plate. */
  readonly logoScale?: number;
}

function deviconLogo(folder: string, variant: string): string {
  return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${folder}/${folder}-${variant}.svg`;
}

/*
 * Edge / cache / data / runtime, top to bottom: a SaaS service stack, not a
 * list of popular images. Four rather than three because three cards stood only
 * 185px tall against a 627px hero and left the right half of the composition
 * empty.
 */
const BEHIND: readonly [StackImage, StackImage, StackImage] = [
  {
    name: 'nginx',
    role: 'Edge',
    logoUrl: deviconLogo('nginx', 'original'),
    // The devicon wordmark carries heavy internal whitespace. 1.5 (the value
    // /for-developers uses on a wide plate) overflows this square one and crops
    // the mark; 1.2 fills it without clipping.
    logoScale: 1.2,
  },
  {
    name: 'redis',
    role: 'Cache',
    logoUrl: deviconLogo('redis', 'original'),
  },
  {
    name: 'postgres',
    role: 'Data',
    logoUrl: deviconLogo('postgresql', 'original'),
  },
];

const FRONT: StackImage = {
  name: 'node',
  role: 'Runtime',
  logoUrl: deviconLogo('nodejs', 'original'),
};

const CARD_SURFACE =
  'linear-gradient(158deg, rgba(255,255,255,0.115) 0%, rgba(255,255,255,0.038) 100%)';

function LogoPlate({ image, size }: { image: StackImage; size: number }): React.ReactElement {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden bg-white"
      style={{ width: size, height: size, borderRadius: size * 0.29 }}
    >
      <Image
        src={image.logoUrl}
        alt=""
        width={64}
        height={64}
        unoptimized
        className="block object-contain"
        style={{
          width: '62%',
          height: '62%',
          transform: image.logoScale ? `scale(${image.logoScale})` : undefined,
        }}
      />
    </div>
  );
}

function Chip({ label, tone }: { label: string; tone: 'seal' | 'quiet' }): React.ReactElement {
  return (
    <span
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.01em',
        lineHeight: 1,
        padding: '5px 9px',
        borderRadius: '999px',
        whiteSpace: 'nowrap',
        color: tone === 'seal' ? '#d9c8ff' : 'rgba(255,255,255,0.62)',
        background: tone === 'seal' ? 'rgba(154,81,255,0.17)' : 'rgba(255,255,255,0.06)',
        border:
          tone === 'seal'
            ? '1px solid rgba(154,81,255,0.34)'
            : '1px solid rgba(255,255,255,0.10)',
      }}
    >
      {label}
    </span>
  );
}

export function SaasHeroStack(): React.ReactElement {
  return (
    <div className="flex flex-col gap-3" style={{ width: '440px' }}>
      {BEHIND.map((image, i) => (
        <div
          key={image.name}
          className="cs-stack-card"
          style={{
            // A column with an x-stagger, not an overlapping fan. The fan's
            // negative margins made total height depend on card content, so the
            // artifact silently shrank; this way the stack's height is the sum
            // of its cards. The offset recedes toward the front card so the
            // column still reads as depth rather than as a plain list, and it
            // leans LEFT, back into the copy.
            transform: `translateX(${(BEHIND.length - i) * -9}px)`,
            opacity: 0.5 + i * 0.13,
            animationDelay: `${120 + i * 80}ms`,
            background: CARD_SURFACE,
            border: '1px solid rgba(255,255,255,0.13)',
            borderRadius: '16px',
            padding: '13px 16px',
            boxShadow: '0 16px 40px -24px rgba(0,0,0,0.55)',
          }}
        >
          <div className="flex items-center gap-3">
            <LogoPlate image={image} size={38} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '16px',
                color: 'rgba(255,255,255,0.88)',
              }}
            >
              {image.name}
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.42)',
              }}
            >
              {image.role}
            </span>
          </div>
        </div>
      ))}

      <div
        className="cs-stack-card"
        style={{
          animationDelay: '360ms',
          background: CARD_SURFACE,
          border: '1px solid rgba(255,255,255,0.17)',
          borderRadius: '20px',
          padding: '18px 20px 20px',
          boxShadow: '0 28px 70px -28px rgba(0,0,0,0.7)',
        }}
      >
        <div className="flex items-center gap-3">
          <LogoPlate image={FRONT} size={46} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '21px',
              color: '#ffffff',
            }}
          >
            {FRONT.name}
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.48)',
            }}
          >
            {FRONT.role}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Chip label="Security Hardened" tone="seal" />
          <Chip label="FIPS Available" tone="seal" />
        </div>

        <div
          className="mt-4 mb-3"
          style={{ height: '1px', background: 'rgba(255,255,255,0.10)' }}
        />

        <div className="flex flex-wrap gap-2">
          <Chip label="SBOM" tone="quiet" />
          <Chip label="Signature" tone="quiet" />
          <Chip label="Provenance" tone="quiet" />
        </div>
      </div>
    </div>
  );
}
