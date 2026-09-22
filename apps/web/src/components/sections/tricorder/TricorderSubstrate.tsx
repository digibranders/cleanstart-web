import Image from 'next/image';
import Link from 'next/link';
import { Clock3, Code2, Radar } from 'lucide-react';

import { Container, Section } from '@/components/layout';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';

/**
 * "One Intelligence Layer. Three Decision Points." The copy doc's own
 * diagram: the Tricorder intelligence cube on top, its current branching down
 * into Clean Libraries, Clean Images and CleanSight, each card carrying the
 * doc's one-liner and the decision it powers. The cards run in the order the
 * sub-head names, which is the order a component meets them in life: build,
 * then release, then the running fleet. `PRODUCTS` order drives the cards, the
 * landing dots and the branch gradient together, so it stays the one place to
 * change it.
 *
 * The hub is the hero's cube rendered on its own, so the page opens and closes
 * on the same object. Below lg the branch becomes a single drop and the cards
 * stack.
 *
 * Last section on the page: the bottom padding reserves the footer CTA's
 * overlap zone (see Footer.tsx layout contract).
 */

type DecisionIcon = 'release' | 'build' | 'fleet';

interface Product {
  key: string;
  title: string;
  desc: string;
  decision: string;
  icon: DecisionIcon;
  href: string;
  art: string;
  artAlt: string;
  tint: string;
}

const PRODUCTS: readonly [Product, Product, Product] = [
  {
    key: 'libraries',
    title: 'Clean Libraries',
    desc: 'Trust dependencies before they enter your build.',
    decision: 'Build-time',
    icon: 'build',
    href: '/clean-libraries',
    art: '/images/cleanstart-factory/clean-libraries-2.webp',
    artAlt: 'Clean Libraries badge: verified library volumes with a package seal',
    tint: '#2dd4bf',
  },
  {
    key: 'images',
    title: 'Clean Images',
    desc: 'Verify images before release.',
    decision: 'Release-time',
    icon: 'release',
    href: '/cleanstart-images',
    art: '/images/cleanstart-factory/clean-images-2.webp',
    artAlt: 'Clean Images badge: a stack of hardened image layers with a verified shield',
    tint: '#5b9bff',
  },
  {
    key: 'cleansight',
    title: 'CleanSight',
    desc: 'Map risk across your container estate.',
    decision: 'Fleet-level',
    icon: 'fleet',
    href: '/cleansight',
    art: '/images/cleanstart-factory/cleansight-2.webp',
    artAlt: 'CleanSight badge: a dependency map under a magnifying lens',
    tint: '#a974ff',
  },
];

function DecisionGlyph({ icon }: { icon: DecisionIcon }): React.ReactElement {
  const props = { size: 20, strokeWidth: 1.9, 'aria-hidden': true } as const;
  switch (icon) {
    case 'release':
      return <Clock3 {...props} />;
    case 'build':
      return <Code2 {...props} />;
    case 'fleet':
      return <Radar {...props} />;
  }
}

/** The Tricorder cube with its label, as the doc draws it. */
function Hub(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div
        className="relative"
        style={{ width: 'clamp(180px, 16vw, 230px)', aspectRatio: '520 / 643' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-[30%] rounded-full"
          style={{
            background:
              'radial-gradient(closest-side, rgba(90,110,255,0.42) 0%, rgba(90,110,255,0) 70%)',
            filter: 'blur(20px)',
          }}
        />
        <div className="cs-tri-float absolute inset-0">
          <Image
            src="/images/tricorder/hub-intelligence-cube.webp"
            alt="The Tricorder intelligence layer: a glowing glass cube holding a circuit-trace brain"
            fill
            sizes="230px"
            className="select-none object-contain"
            draggable={false}
          />
        </div>
      </div>
      <p
        className="relative mt-4 font-display text-white"
        style={{
          fontSize: 'var(--fs-h4)',
          fontWeight: 700,
          letterSpacing: '0.18em',
          lineHeight: 1.1,
          textTransform: 'uppercase',
        }}
      >
        Tricorder
      </p>
      <p
        className="relative mt-1.5 font-sans"
        style={{ fontSize: 'var(--fs-body)', color: '#8fb6ff', letterSpacing: '-0.01em' }}
      >
        Software Intelligence
      </p>
    </div>
  );
}

/**
 * The branch from the hub into the three card columns. The grid below has no
 * column gap (cards are inset with padding instead), so the column centres sit
 * at exactly 1/6, 3/6 and 5/6 and the landing dots can be placed by percent.
 */
function Branch(): React.ReactElement {
  const d = 'M 600 0 V 34 M 600 34 H 200 V 84 M 600 34 H 1000 V 84 M 600 34 V 84';
  return (
    <div aria-hidden className="relative hidden h-[84px] w-full lg:block">
      <svg
        viewBox="0 0 1200 84"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        <defs>
          <linearGradient
            id="tri-branch"
            x1="0"
            x2="1200"
            y1="0"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            {PRODUCTS.map((p, i) => (
              <stop key={p.key} offset={i / (PRODUCTS.length - 1)} stopColor={p.tint} />
            ))}
          </linearGradient>
        </defs>
        <path
          d={d}
          stroke="url(#tri-branch)"
          strokeOpacity="0.35"
          strokeWidth="6"
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="cs-lep-beam"
          d={d}
          stroke="url(#tri-branch)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="2 8"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className="absolute left-1/2 top-[34px] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: '#c9d8ff', boxShadow: '0 0 12px #8fb6ff' }}
      />
      {PRODUCTS.map((p, i) => (
        <span
          key={p.key}
          className="absolute bottom-0 h-3 w-3 -translate-x-1/2 translate-y-1/2 rounded-full"
          style={{
            left: `${(100 / 6) * (2 * i + 1)}%`,
            background: p.tint,
            boxShadow: `0 0 0 4px color-mix(in srgb, ${p.tint} 25%, transparent), 0 0 14px ${p.tint}`,
          }}
        />
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }): React.ReactElement {
  return (
    <Link
      href={product.href}
      className="group relative flex h-full flex-col overflow-hidden outline-none transition-transform duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#33BAEC]"
      style={{
        borderRadius: '24px',
        background: [
          `radial-gradient(120% 80% at 0% 0%, color-mix(in srgb, ${product.tint} 22%, transparent) 0%, transparent 60%)`,
          'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)',
        ].join(', '),
        border: `1px solid color-mix(in srgb, ${product.tint} 38%, rgba(255,255,255,0.08))`,
        boxShadow: '0 30px 60px -36px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.10)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* The decision point is the card's title. The section heading promises
          three of them, so each card names its own before naming what ships it. */}
      <div className="flex items-center gap-3 px-[clamp(22px,2.2vw,30px)] pt-[clamp(20px,2vw,26px)]">
        <span aria-hidden style={{ color: `color-mix(in srgb, ${product.tint} 70%, #ffffff)` }}>
          <DecisionGlyph icon={product.icon} />
        </span>
        <h3
          className="font-display text-white"
          style={{
            fontSize: 'var(--fs-h4)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          {product.decision}
        </h3>
        <span
          aria-hidden
          className="ml-auto shrink-0 text-white/50 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
        >
          ↗
        </span>
      </div>

      <div className="flex items-start gap-4 px-[clamp(22px,2.2vw,30px)] pb-[clamp(22px,2.2vw,30px)] pt-4">
        <div
          className="relative shrink-0 transition-transform duration-500 group-hover:scale-105"
          style={{ width: 'clamp(76px, 6.4vw, 92px)', aspectRatio: '1 / 1' }}
        >
          <Image
            src={product.art}
            alt={product.artAlt}
            fill
            sizes="92px"
            className="select-none object-contain"
            style={{ filter: 'drop-shadow(0 12px 18px rgba(0,0,0,0.45))' }}
            draggable={false}
          />
        </div>
        <div className="min-w-0 pt-1">
          <p
            className="font-display"
            style={{
              fontSize: 'var(--fs-body)',
              fontWeight: 600,
              letterSpacing: '-0.005em',
              lineHeight: 1.3,
              color: `color-mix(in srgb, ${product.tint} 70%, #ffffff)`,
            }}
          >
            {product.title}
          </p>
          <p
            className="mt-1.5 font-sans text-white/72"
            style={{ fontSize: 'var(--fs-body)', lineHeight: 1.5, letterSpacing: '-0.01em' }}
          >
            {product.desc}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function TricorderSubstrate(): React.ReactElement {
  return (
    <Section
      id="one-intelligence-layer"
      padding="none"
      className="overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #151021 0%, #131e8f 67%, #471ec0 107%)',
        scrollMarginTop: 'var(--cs-header-h)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/cleansight/stats-union.svg"
        alt=""
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          right: '-20px',
          top: '-206px',
          width: '469px',
          height: '488px',
          mixBlendMode: 'overlay',
          transform: 'rotate(-150deg) scaleY(-1)',
          opacity: 0.9,
        }}
        loading="lazy"
        decoding="async"
      />
      <Container
        className="relative py-section-lg"
        style={{ paddingBottom: 'max(var(--spacing-section-cta), 175px)' }}
      >
        <Reveal header>
          <div className="mx-auto max-w-[820px] text-center">
            <h2
              className="font-display text-white"
              style={{
                fontSize: 'var(--fs-h2)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                textWrap: 'balance',
              }}
            >
              One Intelligence Layer.{' '}
              <span className="cs-text-gradient-impact">Three Decision Points.</span>
            </h2>
            <p
              className="mx-auto mt-5 max-w-[700px] font-sans text-white/80"
              style={{
                fontSize: 'var(--fs-lead-sm)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.5,
                textWrap: 'balance',
              }}
            >
              Tricorder brings consistent software analysis wherever components enter and run: at
              build, at release, and across your fleet.
            </p>
          </div>
        </Reveal>

        <Reveal y={30} className="mt-12 lg:mt-14">
          <Hub />
        </Reveal>

        <Branch />
        <div
          aria-hidden
          className="cs-lep-beam-v mx-auto my-5 h-10 w-[3px] rounded-full lg:hidden"
          style={{ background: 'linear-gradient(180deg, #8fb6ff, rgba(169,116,255,0.6))' }}
        />

        <RevealStagger className="mx-auto grid max-w-[560px] grid-cols-1 gap-4 lg:mt-6 lg:max-w-none lg:grid-cols-3 lg:gap-0">
          {PRODUCTS.map((p) => (
            <RevealItem key={p.key} className="h-full lg:px-3.5">
              <ProductCard product={p} />
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}
