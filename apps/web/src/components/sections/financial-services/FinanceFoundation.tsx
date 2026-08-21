import type React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LogoMark } from '@/components/icons/Logo';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';

/*
 * "Build with Confidence" — Product Showcase & Operating Loop.
 *
 * Rebuilt on the client's own reference mock: three product cards (CleanSight,
 * Clean Images, Clean Libraries), not two — the section's job is to show every
 * live product this page can point to, and it was missing CleanSight entirely.
 * Each card is visual-first (a commissioned 3D product render, a logo, a
 * name) rather than the earlier text-heavy mini-list.
 *
 * The three renders were generated to match, not to invent: same blue
 * (#2F6FED → #1749B8) the reference uses for its own product visuals, same
 * three compositions (laptop + magnifier for CleanSight, container + shield
 * for Images, layered hexagon + shield for Libraries). The CleanSight render
 * (v2) does carry baked-in UI text ("CleanSight", "Assets", "Containers" —
 * cleanly spelled, unlike most AI text) rather than a code overlay; the two
 * earlier attempts at requesting no text and adding a DOM overlay instead are
 * superseded now that a clean text render exists.
 *
 * Card taglines are each product's own real hero copy (CleanSightHero,
 * CleanStartImagesHero, ClearLibrariesHero), not invented for this page.
 * Only the whole card's bottom strip (the name) is a link — matches the
 * "bottom-only clickable" convention already set for the pillar cards below.
 * No per-card logo glyph: the same CleanStart mark three times in a row
 * doesn't distinguish the products, it just repeats.
 */

interface Product {
  image: string;
  imageAlt: string;
  name: string;
  tagline: string;
  href: string;
}

const PRODUCTS: readonly [Product, Product, Product] = [
  {
    image: '/images/financial-services/card-cleansight-v2.webp',
    imageAlt: 'The CleanSight dashboard showing discovered assets across containers, images, repositories and vulnerabilities on a world map, with a magnifying glass revealing a verified software component',
    name: 'CleanSight',
    tagline: 'Discover software assets, dependencies, and inherited risk across modern environments.',
    href: '/cleansight',
  },
  {
    image: '/images/financial-services/card-clean-images.webp',
    imageAlt: 'A shipping container marked with a verification shield',
    name: 'Clean Images',
    tagline: 'Hardened, minimal, and secure container images for your applications.',
    href: '/cleanstart-images',
  },
  {
    image: '/images/financial-services/card-clean-libraries.webp',
    imageAlt: 'Stacked hexagonal library modules marked with a key-and-shield seal',
    name: 'Clean Libraries',
    tagline: 'Secure, trusted libraries and dependencies for your applications.',
    href: '/clean-libraries',
  },
];

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
              Build with{' '}
              <span className="cs-text-gradient-impact">Confidence</span>
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
              Secure applications start with a verified software foundation.
            </p>
          </Reveal>
        </div>

        {/* The three product showcase cards. */}
        <RevealStagger
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          style={{ marginTop: 'clamp(28px, 3vw, 40px)', gap: 'clamp(20px, 2vw, 28px)' }}
        >
          {PRODUCTS.map((product) => (
            <RevealItem key={product.name} className="h-full">
              <div
                className="flex h-full flex-col overflow-hidden"
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid rgba(154,81,255,0.14)',
                  boxShadow: '0 1px 2px rgba(17,17,17,0.04), 0 16px 40px -24px rgba(40,30,90,0.14)',
                }}
              >
                {/* The commissioned render. Padded rather than edge-to-edge so
                    it reads as a product photo on a card, not a banner. */}
                <div
                  className="relative"
                  style={{
                    aspectRatio: '900 / 660',
                    padding: 'clamp(16px, 1.8vw, 24px)',
                  }}
                >
                  <div className="relative h-full w-full">
                    <Image
                      src={product.image}
                      alt={product.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-contain"
                    />
                  </div>
                </div>

                <p
                  className="px-5"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--fs-body-sm)',
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.5,
                    color: '#555555',
                    margin: 0,
                  }}
                >
                  {product.tagline}
                </p>

                {/* Only this strip is a link — the card body above is not,
                    matching the pillar-card convention below. No per-card
                    logo: the same CleanStart mark repeated three times in a
                    row identifies nothing (the three products aren't
                    distinguished by it) and just reads as clutter. */}
                <Link
                  href={product.href}
                  className="group/link mt-4 flex items-center gap-2.5 px-5 pb-5 pt-3 transition-colors"
                  style={{ borderTop: '1px solid rgba(17,17,17,0.08)' }}
                >
                  <span
                    className="font-display"
                    style={{
                      fontSize: 'var(--fs-h5)',
                      fontWeight: 600,
                      letterSpacing: '-0.03em',
                      color: '#111111',
                    }}
                  >
                    {product.name}
                  </span>
                  <span
                    aria-hidden
                    className="ml-auto text-[#7C4FF0] transition-transform group-hover/link:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </div>
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
