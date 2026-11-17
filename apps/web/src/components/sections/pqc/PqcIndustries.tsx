import type React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { H2_STYLE } from './type';

/*
 * "Industries We Secure": one hub, four industries, all in view at once.
 *
 * The page's one foundation is a lit disc carrying the CleanStart mark, laid
 * flat with two orbits (the hero's motif turned onto the floor). The four
 * industries stand on the outer orbit around it, and two
 * signal dots travel the orbits past them. Nothing needs a hover, a click or a
 * timer to be seen: a visitor reads all four industries in one look.
 *
 * Industries that have a page on this site (Financial Services,
 * Telecommunications) carry an arrow and the whole node is the link; the other
 * two have no page yet and are plain. Below lg the scene drops away and the
 * same four nodes sit in a two-column grid of glass cards.
 *
 * As the last band before the Footer's overlapping CTA card, bottom padding is
 * --spacing-section-cta (the footer contract).
 *
 * Labels are the brief's, verbatim. All motion is transform and opacity, and
 * reduced motion stills the orbits.
 */

interface Industry {
  label: string;
  image: string;
  alt: string;
  /** Icon centre from the stage centre, in stage-width percent (lg and up). */
  cx: number;
  cy: number;
  href?: string;
  /** Optional enlargement for icons whose artwork leaves more empty margin than its siblings. */
  scale?: number;
}

const INDUSTRIES: readonly [Industry, Industry, Industry, Industry] = [
  {
    label: 'Financial Services',
    image: '/images/compare/icon-regulatory.webp',
    alt: '3D icon of a bank with a shield',
    cx: -27,
    cy: -9,
    href: '/industries/financial-services',
    scale: 1.05,
  },
  {
    label: 'Government & Public Sector',
    image: '/images/pqc/industry-government-v2.webp',
    alt: '3D icon of a government building with columns, a pediment and two flags',
    cx: 27,
    cy: -9,
    scale: 1.3,
  },
  {
    label: 'Telecommunications',
    image: '/images/telecom/icon-distributed.webp',
    alt: '3D icon of a cell tower',
    cx: -27,
    cy: 15,
    href: '/industries/telecom',
    scale: 1.0,
  },
  {
    label: 'Critical Infrastructure',
    image: '/images/pqc/industry-infrastructure-v3.webp',
    alt: '3D icon of a power grid with a pylon, a wind turbine and a substation',
    cx: 27,
    cy: 15,
    scale: 1.3,
  },
];

export function PqcIndustries(): React.ReactElement {
  return (
    <section
      data-section="PqcIndustries"
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{ left: 'calc(-220 / 1920 * 100vw)', top: '-150px', width: '803px', height: '803px', opacity: 0.3 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/ciso/outcomes-vector-center.svg"
          alt=""
          style={{ display: 'block', width: '100%', height: '100%' }}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 pt-section-md sm:px-10"
        style={{ paddingBottom: 'var(--spacing-section-cta)' }}
      >
        <Reveal header>
          <h2
            className="text-center text-white"
            style={{ ...H2_STYLE, margin: '0 auto clamp(32px, 3.6vw, 56px)' }}
          >
            Industries We <span className="cs-text-gradient-impact">Secure</span>
          </h2>
        </Reveal>

        <Reveal delay={0.12} y={24}>
          <div className="cs-pqc-ind-stage mx-auto max-w-[1200px]">
            <div aria-hidden className="cs-pqc-ind-scene">
              <div className="cs-pqc-ind-glow" />
              <div className="cs-pqc-ind-world">
                <div className="cs-pqc-ind-plane">
                  <span className="cs-pqc-ind-ring-a" />
                  <span className="cs-pqc-ind-ring-b" />
                  <span className="cs-pqc-ind-disc" />
                  <span className="cs-pqc-ind-orbit cs-pqc-ind-orbit-a">
                    <span className="cs-pqc-ind-dot" />
                  </span>
                  <span className="cs-pqc-ind-orbit cs-pqc-ind-orbit-b">
                    <span className="cs-pqc-ind-dot cs-pqc-ind-dot-violet" />
                  </span>
                </div>
              </div>
              <div className="cs-pqc-ind-hub">
                <Image src="/images/footer/cleanstart-mark.svg" alt="" fill sizes="96px" className="object-contain" />
              </div>
            </div>

            <ul className="cs-pqc-ind-list">
              {INDUSTRIES.map((industry) => (
                <li
                  key={industry.label}
                  className="cs-pqc-ind-node"
                  style={{ '--cx': industry.cx, '--cy': industry.cy } as React.CSSProperties}
                >
                  <div className="cs-pqc-ind-art">
                    <Image
                      src={industry.image}
                      alt={industry.alt}
                      fill
                      sizes="(min-width: 1024px) 200px, 150px"
                      className="object-contain"
                      style={
                        {
                          filter: 'drop-shadow(0 18px 22px rgba(8,4,40,0.5))',
                          '--s': industry.scale ?? 1,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                  <h3 className="cs-pqc-ind-label">
                    {industry.href ? (
                      <Link href={industry.href} className="cs-pqc-ind-link">
                        <span>{industry.label}</span>
                        <span aria-hidden className="cs-pqc-ind-go">
                          <ArrowUpRight size={16} strokeWidth={1.75} />
                        </span>
                      </Link>
                    ) : (
                      industry.label
                    )}
                  </h3>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
