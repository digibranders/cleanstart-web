import type React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Container, Section } from '@/components/layout';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';
import { H2_STYLE, LEAD_STYLE } from './type';

/*
 * "Build with Verified Software Foundations": the page's mid dark band and the
 * answer to the risk register above it, one card per live product.
 *
 * Renders are the shared product set under /images/financial-services/ (each
 * carries its own product mark; see FinanceFoundation for how they were made).
 * They have a real alpha channel, so they sit on glass cards here instead of
 * the white cards the light-band versions use.
 *
 * The whole card is the link, not just its footer: three large targets that go
 * to three product pages, with nothing else inside to click.
 *
 * Copy is the brief's. The brief labels the third card's button "Clean Images",
 * an evident slip for "Clean Libraries"; the link goes to /clean-libraries.
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
    image: '/images/financial-services/card-cleansight-v4.webp',
    imageAlt:
      'The CleanSight dashboard showing discovered assets across containers, images and repositories, with a magnifying glass over a verified component',
    name: 'CleanSight',
    tagline: 'Discover software assets and hidden risks across environments.',
    href: '/cleansight',
  },
  {
    image: '/images/financial-services/card-clean-images-v4.webp',
    imageAlt: 'A shipping container badged with the Clean Images product logo',
    name: 'Clean Images',
    tagline: 'Hardened, minimal, and secure container images for your applications.',
    href: '/cleanstart-images',
  },
  {
    image: '/images/financial-services/card-clean-libraries-v4.webp',
    imageAlt: 'Stacked library modules badged with the Clean Libraries product logo',
    name: 'Clean Libraries',
    tagline: 'Secure, trusted libraries and dependencies for your applications.',
    href: '/clean-libraries',
  },
];

export function TelecomFoundation(): React.ReactElement {
  return (
    <Section
      padding="lg"
      data-section="TelecomFoundation"
      className="overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #151021 0%, #16123C 55%, #131E8F 100%)' }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(133,189,255,0.28) 50%, transparent 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(159,190,239,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(159,190,239,0.07) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage:
              'linear-gradient(180deg, transparent 3%, black 32%, black 86%, transparent 100%)',
          }}
        />
        <div
          className="absolute left-1/2 top-[38%] aspect-square w-[min(1100px,90vw)] -translate-x-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(124,79,240,0.20) 0%, rgba(42,102,188,0.06) 45%, transparent 72%)',
            filter: 'blur(24px)',
          }}
        />
      </div>

      <Container className="relative">
        <div className="mx-auto flex max-w-[860px] flex-col items-center gap-5 text-center">
          <Reveal header>
            <h2 style={{ ...H2_STYLE, color: '#FFFFFF' }}>
              Build with{' '}
              <span className="cs-text-gradient-impact sm:whitespace-nowrap">
                Verified Software Foundations
              </span>
            </h2>
          </Reveal>
          <Reveal header delay={0.12} y={16}>
            <p className="max-w-[680px]" style={{ ...LEAD_STYLE, color: 'rgba(225,231,255,0.78)' }}>
              Secure your telecommunications infrastructure with visibility, hardened images and
              verified software dependencies.
            </p>
          </Reveal>
        </div>

        <RevealStagger
          className="grid grid-cols-1 md:grid-cols-3"
          style={{ marginTop: 'clamp(36px, 4vw, 60px)', gap: 'clamp(16px, 1.8vw, 28px)' }}
        >
          {PRODUCTS.map((p) => (
            <RevealItem key={p.name} className="h-full">
              <Link
                href={p.href}
                className="group relative flex h-full flex-col overflow-hidden transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-[rgba(154,81,255,0.55)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A51FF]"
                style={{
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.10)',
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.10), 0 24px 60px -30px rgba(0,0,0,0.6)',
                }}
              >
                <div className="relative" style={{ aspectRatio: '900 / 620' }}>
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        'radial-gradient(closest-side, rgba(124,79,240,0.35) 0%, rgba(124,79,240,0) 75%)',
                      opacity: 0.7,
                    }}
                  />
                  <div className="absolute inset-[clamp(14px,1.6vw,22px)] transition-transform duration-500 group-hover:scale-[1.03]">
                    <Image
                      src={p.image}
                      alt={p.imageAlt}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-contain"
                    />
                  </div>
                </div>

                <div className="flex flex-1 flex-col px-6 pb-6">
                  <span
                    className="font-display text-white"
                    style={{ fontSize: 'var(--fs-h4)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.2 }}
                  >
                    {p.name}
                  </span>
                  <p
                    style={{
                      margin: '8px 0 0',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--fs-body-sm)',
                      lineHeight: 1.55,
                      letterSpacing: '-0.01em',
                      color: 'rgba(225,231,255,0.72)',
                    }}
                  >
                    {p.tagline}
                  </p>
                  <span
                    className="mt-auto inline-flex items-center gap-2 pt-5"
                    style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-button)', fontWeight: 500, color: '#B9A4FF' }}
                  >
                    Explore {p.name}
                    <ArrowRight
                      aria-hidden
                      size={16}
                      strokeWidth={2}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}
