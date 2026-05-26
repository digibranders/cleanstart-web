import Image from 'next/image';
import Link from 'next/link';
import type React from 'react';

/*
 * Figma node 732-413 — Developer page hero.
 * Marquee (Figma 857-4663 / single card 857-4691): 239×171 gradient tiles with
 * a white logo plate, stack name and short description.
 *
 * Data model: hardcoded list of 15 popular stacks. This is intentional — the
 * marquee is a marketing surface, not a catalog viewer, so freshness doesn't
 * matter here (the live catalog lives at /cleanstart-images and
 * images.cleanstart.com). When the upstream /api/community-images endpoint
 * grows to support `?limit=N`, swap STACKS for the dynamic fetcher in
 * lib/api/community-images.ts — the card component below doesn't change.
 *
 * Logo URLs follow the CleanStart catalog convention:
 *   https://storage.googleapis.com/cdpimages/<slug>/<slug>.svg
 * (allowlisted in next.config.ts → images.remotePatterns and the CSP img-src).
 */

interface StackCardData {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  /**
   * Multiplier applied to the logo via CSS transform: scale(). Defaults to 1.
   * Use > 1 for wide-format wordmark SVGs (e.g. nginx) that have built-in
   * top/bottom whitespace and look small inside the plate — the plate's
   * overflow:hidden will crop the excess.
   */
  logoScale?: number;
}

/**
 * Brand-colored stack logos from devicons (jsDelivr CDN). Devicons gives us
 * consistent, brand-accurate SVGs across the marquee — the upstream cdpimages
 * GCS bucket only has real logos for ~half the catalog (the rest fall back to
 * a generic white "stacked layers" placeholder, which is invisible on the
 * white logo plate). Devicons fixes that for every stack we render here.
 *
 * URL shape: https://cdn.jsdelivr.net/gh/devicons/devicon/icons/<folder>/<folder>-<variant>.svg
 * Allowlisted in next.config.ts → images.remotePatterns and the CSP img-src.
 */
function deviconLogo(folder: string, variant: string): string {
  return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${folder}/${folder}-${variant}.svg`;
}

const STACKS: StackCardData[] = [
  {
    id: 'python',
    name: 'python',
    logoUrl: deviconLogo('python', 'original'),
    description: 'Minimal, hardened Python runtime — FIPS-ready and free of CVE-laden tooling.',
  },
  {
    id: 'node',
    name: 'node',
    logoUrl: deviconLogo('nodejs', 'original'),
    description: 'Hardened Node.js base for production apps — no dev shells, no extra packages.',
  },
  {
    id: 'redis',
    name: 'redis',
    logoUrl: deviconLogo('redis', 'original'),
    description: 'Lean Redis image with the noise removed. Faster pulls, cleaner SBOM.',
  },
  {
    id: 'mongodb',
    name: 'mongodb',
    logoUrl: deviconLogo('mongodb', 'original'),
    description: 'MongoDB stripped to the data layer. No bundled clients, no inherited CVEs.',
  },
  {
    id: 'postgresql',
    name: 'postgresql',
    logoUrl: deviconLogo('postgresql', 'original'),
    description: 'PostgreSQL hardened for enterprise. Reproducible builds, signed at every layer.',
  },
  {
    id: 'nginx',
    name: 'nginx',
    logoUrl: deviconLogo('nginx', 'original'),
    description: 'NGINX without the kitchen sink — just the proxy you actually run.',
    // nginx-original.svg has heavy top/bottom whitespace; scale up so the
    // hexagon+wordmark fills the plate, plate's overflow:hidden crops the rest.
    logoScale: 1.55,
  },
  {
    id: 'kafka',
    name: 'kafka',
    logoUrl: deviconLogo('apachekafka', 'original'),
    description: 'Kafka hardened for production brokers. Minimal surface, signed releases.',
  },
  {
    id: 'elasticsearch',
    name: 'elasticsearch',
    logoUrl: deviconLogo('elasticsearch', 'original'),
    description: 'Elasticsearch with the bloat removed. Faster startup, smaller attack surface.',
  },
  {
    id: 'rust',
    name: 'rust',
    logoUrl: deviconLogo('rust', 'original'),
    description: 'Rust toolchain image — fast, hardened, ready to drop into your CI.',
  },
  {
    id: 'ruby',
    name: 'ruby',
    logoUrl: deviconLogo('ruby', 'original'),
    description: 'Ruby runtime stripped to the essentials. No system gems you didn’t ask for.',
  },
  {
    id: 'go',
    name: 'go',
    logoUrl: deviconLogo('go', 'original'),
    description: 'Go build image at a fraction of the size. Signed, attested, FIPS-available.',
  },
  {
    id: 'php',
    name: 'php',
    logoUrl: deviconLogo('php', 'original'),
    description: 'PHP runtime hardened for enterprise. Verified provenance on every release.',
  },
  {
    id: 'jenkins',
    name: 'jenkins',
    logoUrl: deviconLogo('jenkins', 'original'),
    description: 'Jenkins controller image hardened for CI fleets. Signed plugins, lean base.',
  },
  {
    id: 'vault',
    name: 'vault',
    logoUrl: deviconLogo('vault', 'original'),
    description: 'HashiCorp Vault hardened for zero-trust deployments. Minimal blast radius.',
  },
  {
    id: 'prometheus',
    name: 'prometheus',
    logoUrl: deviconLogo('prometheus', 'original'),
    description: 'Prometheus server image, stripped to what your scrape targets actually need.',
  },
];

/**
 * Single marquee card — Figma 857:4691 baseline geometry (239×171).
 * Card root is a `container-type: inline-size` container so every interior size
 * (plate, logo, title, description, padding) is expressed in `cqi` units and
 * scales proportionally with the card width.
 */
function StackCard({ name, logoUrl, description, logoScale }: StackCardData): React.ReactElement {
  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{
        width: '239px',
        height: '171px',
        borderRadius: '14px',
        backgroundColor: 'rgba(255,255,255,0.22)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        containerType: 'inline-size',
      }}
    >
      {/* Layer 1 — base gradient (Figma Rectangle 1000001822).
          Bleeds 4 px past each card edge (Figma 248×180 vs card 239×171). */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          inset: '-4px -5px -5px -5px',
          borderRadius: '17.93px',
          background:
            'linear-gradient(180deg, #151021 0%, #131E8F 71.2%, #551ECE 100%)',
          boxShadow:
            '-97.86px 48.56px 44.07px rgba(0,0,0,0.03), -55.28px 27.64px 36.6px rgba(0,0,0,0.12), -24.65px 11.95px 27.64px rgba(0,0,0,0.20), -5.98px 2.99px 14.94px rgba(0,0,0,0.23)',
        }}
      />

      {/* Layer 2 — purple wash (Figma Ellipse 46683).
          Huge blurred ellipse anchored top-left; only its bottom-right edge bleeds
          into the visible card area, giving the soft purple tint at top/left. */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          width: '214.9px',
          height: '623.03px',
          left: '-17.38px',
          top: '-261.8px',
          background: '#5D04D7',
          opacity: 0.34,
          filter: 'blur(53.78px)',
          borderRadius: '50%',
        }}
      />

      {/* Layer 3 — dominant cyan glow (Figma Ellipse 46684).
          The big bright cyan/blue ellipse that covers the right and bottom of the
          card. This is the signature element of the Figma card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          width: '345.11px',
          height: '1000.53px',
          left: '-13.96px',
          top: '-37.68px',
          background: '#04C7F2',
          opacity: 0.7,
          filter: 'blur(53.78px)',
          borderRadius: '50%',
        }}
      />

      {/* Layer 4 — concentrated right-side bright spot (Figma Group 2085665009).
          Three overlapping ellipses (blue + cyan + purple) blurred together; the
          group-level blur is approximated by blurring each, which is visually
          close for soft glows like these. */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{ inset: 0, filter: 'blur(53.78px)' }}
      >
        <div
          style={{
            position: 'absolute',
            width: '97.98px',
            height: '284.06px',
            left: '193.44px',
            top: '-128.3px',
            background: '#066BF1',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '111.63px',
            height: '323.63px',
            left: '230.98px',
            top: '-44.91px',
            background: '#04C7F2',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '123.33px',
            height: '357.55px',
            left: '182.04px',
            top: '-74.93px',
            background: '#5D04D7',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* Layer 5 — color-dodge flare (Figma 光斑 flare).
          Cyan/blue radial with color-dodge blend, gives the punchy highlight on
          the right side. */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          width: '152.78px',
          height: '254.58px',
          left: '123.35px',
          top: '-135.29px',
          mixBlendMode: 'color-dodge',
          opacity: 0.6,
          background:
            'radial-gradient(50% 50% at 50% 50%, #D3FFF8 0%, #15ADFA 10.42%, #0166CC 48.96%, rgba(2,17,47,0) 100%)',
        }}
      />

      {/* Layer 6 — 1 px linear-gradient stroke (Figma Stroke: Linear, Inside).
          Drawn last so it sits on top of all the gradient/glow layers. Uses the
          standard mask-xor trick to keep the stroke rounded with the card's
          14 px border-radius. Colors picked up from the Figma "Selection colors"
          panel: light purple → translucent white → soft cyan. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: '14px',
          padding: '1px',
          background:
            'linear-gradient(135deg, rgba(218,182,243,0.95) 0%, rgba(255,255,255,0.35) 40%, rgba(154,205,237,0.6) 100%)',
          WebkitMask:
            'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          maskComposite: 'exclude',
        }}
      />

      {/* Content column */}
      <div
        className="relative flex h-full flex-col"
        style={{ padding: '5.86cqi', gap: '2.5cqi' }}
      >
        {/* White logo plate — img fills the plate via object-fit:contain so the
            browser picks the binding axis per logo aspect (square logos use full
            height; wordmark logos use full width). */}
        <div
          className="relative overflow-hidden bg-white"
          style={{
            width: '100%',
            height: '26.36cqi',
            borderRadius: '5cqi',
            padding: '3cqi 6cqi',
          }}
        >
          <Image
            src={logoUrl}
            alt={`${name} logo`}
            width={120}
            height={60}
            className="block h-full w-full object-contain"
            sizes="200px"
            unoptimized
            style={logoScale ? { transform: `scale(${logoScale})` } : undefined}
          />
        </div>

        {/* Stack label */}
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '7.5cqi',
            fontWeight: 600,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            color: '#ffffff',
            whiteSpace: 'nowrap',
            margin: 0,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
          }}
        >
          {name}
        </p>

        {/* Description — clamped to 2 lines. Line-height 1.5 + small bottom
            padding leaves room for descenders (y, g, p, j) which overflow:hidden
            would otherwise clip at the box edge. */}
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '4.8cqi',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.45,
            color: 'rgba(255,255,255,0.95)',
            margin: 0,
            paddingBottom: '0.4cqi',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

export function DeveloperHero(): React.ReactElement {
  return (
    <section
      data-section="DeveloperHero"
      className="relative overflow-hidden bg-cs-hero"
      style={{ minHeight: '820px' }}
    >
      {/* Background grid — for-developers-only Figma asset (node 857:4391):
          dark 70×70 cell grid masked over two big purple blur ellipses with
          gradient accent ticks. Fills the entire hero via object-cover with
          object-top so the grid spans full width/height while keeping the
          top-right purple flare anchored at the top of the section. The SVG
          itself preserves the 70×70 cell aspect at all viewport widths. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/for-developers/hero-grid.svg"
        alt=""
        aria-hidden
        className="pointer-events-none select-none absolute inset-0 z-0 h-full w-full object-cover object-top"
        loading="eager"
        decoding="async"
      />

      {/* Bottom fade — blends hero into white WhyItMatters section */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 bottom-0 z-[1]"
        style={{
          height: '160px',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 55%, rgba(255,255,255,0.92) 88%, #ffffff 100%)',
        }}
      />

      {/* ── Content column ── */}
      <div
        className="relative mx-auto z-[2] flex w-full max-w-[840px] flex-col items-center px-6 sm:px-10 text-center"
        style={{ paddingTop: '203px' }}
      >
        <h1
          className="text-white"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 4.45vw, 64px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            marginBottom: '32px',
          }}
        >
          Trusted Container Foundations
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(18px, 1.7vw, 24px)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.4,
            color: 'rgba(255,255,255,0.8)',
            maxWidth: '640px',
            marginBottom: '32px',
          }}
        >
          Minimal, hardened, verifiable container images that fit directly into existing developer
          workflows.
        </p>

        <Link
          href="https://images.cleanstart.com"
          target="_blank"
          rel="noopener noreferrer"
          className="cs-btn-glass"
          style={
            {
              '--cs-btn-fs': '20px',
              '--cs-btn-h': '44px',
              '--cs-btn-px': '18px',
            } as React.CSSProperties
          }
        >
          Explore CleanStart Images
        </Link>
      </div>

      {/* ── Stack-card marquee strip ── */}
      <div
        className="relative mx-auto z-[2] flex flex-col items-center overflow-hidden"
        style={{
          maxWidth: 'var(--container-default)',
          paddingTop: '64px',
          paddingBottom: '88px',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '19px',
            fontWeight: 400,
            letterSpacing: '-0.57px',
            lineHeight: 1.1,
            color: '#ffffff',
            marginBottom: '28px',
          }}
        >
          Images for Popular Developer Stacks
        </p>

        <div
          className="relative w-full overflow-hidden"
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
          }}
        >
          {/*
           * Seamless loop: two identical sets, each with trailing 27 px gap so the
           * -50% translate lands on Set B's first card → perfect loop.
           */}
          <div
            className="cs-marquee"
            style={{ animationDuration: '70s', animationPlayState: 'running' }}
          >
            <div className="flex shrink-0 items-center" style={{ gap: '27px', paddingRight: '27px' }}>
              {STACKS.map((s) => (
                <StackCard key={`a-${s.id}`} {...s} />
              ))}
            </div>
            <div className="flex shrink-0 items-center" style={{ gap: '27px', paddingRight: '27px' }}>
              {STACKS.map((s) => (
                <StackCard key={`b-${s.id}`} {...s} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
