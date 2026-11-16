'use client';

import type React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { H2_STYLE } from './type';

/*
 * "Industries We Secure": four industries as an accordion of glass panels on
 * the dark band. One panel is open at a time and it takes the width the others
 * give up; hovering or focusing another passes the open state to it. The open
 * panel lifts its 3D icon to full size and picks up a cyan edge, which is the
 * only thing that moves, so the row reads as a single object with one focus.
 *
 * Panels for industries that have a page on this site link to it (Financial
 * Services, Telecommunications); the other two have no page yet and are
 * plain. Below xl (1280px; the narrow panels clip their labels any earlier) every panel is a flat row with its icon, two across from sm, with no accordion.
 *
 * As the last band before the Footer's overlapping CTA card, bottom padding is
 * --spacing-section-cta (the footer contract).
 *
 * Labels are the brief's, verbatim.
 */

interface Industry {
  label: string;
  image: string;
  alt: string;
  href?: string;
}

const INDUSTRIES: readonly [Industry, Industry, Industry, Industry] = [
  {
    label: 'Financial Services',
    image: '/images/compare/icon-regulatory.webp',
    alt: '3D icon of a bank with a shield',
    href: '/industries/financial-services',
  },
  {
    label: 'Government & Public Sector',
    image: '/images/pqc/industry-government.webp',
    alt: '3D icon of a domed government building on a platform',
  },
  {
    label: 'Telecommunications',
    image: '/images/telecom/icon-distributed.webp',
    alt: '3D icon of a cell tower',
    href: '/industries/telecom',
  },
  {
    label: 'Critical Infrastructure',
    image: '/images/pqc/industry-infrastructure-v2.webp',
    alt: '3D icon of an industrial plant with chimneys and a power pylon',
  },
];

const OPEN_GROW = 2;

export function PqcIndustries(): React.ReactElement {
  const [active, setActive] = useState(0);

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
            style={{ ...H2_STYLE, margin: '0 auto clamp(40px, 4.6vw, 72px)' }}
          >
            Industries We <span className="cs-text-gradient-impact">Secure</span>
          </h2>
        </Reveal>

        <Reveal delay={0.12} y={24}>
          <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 xl:flex xl:h-[clamp(380px,32vw,460px)] xl:flex-row xl:gap-4">
            {INDUSTRIES.map((industry, i) => {
              const open = active === i;
              return (
                <li
                  key={industry.label}
                  className="cs-pqc-panel relative min-h-[112px] overflow-hidden xl:min-h-0 xl:min-w-0 xl:basis-0 xl:[flex-grow:var(--g)]"
                  data-open={open}
                  style={{ '--g': open ? OPEN_GROW : 1 } as React.CSSProperties}
                  onPointerEnter={() => setActive(i)}
                >
                  <div className="relative flex h-full items-center gap-5 p-4 xl:block xl:p-0">
                    <div className="cs-pqc-panel-icon relative aspect-square w-[88px] shrink-0 xl:absolute xl:left-1/2 xl:top-[6%] xl:w-[min(80%,300px)] xl:-translate-x-1/2">
                      <span
                        aria-hidden
                        className="cs-pqc-panel-glow absolute left-1/2 top-1/2 hidden aspect-square w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full xl:block"
                        style={{
                          background:
                            'radial-gradient(closest-side, rgba(154,81,255,0.5) 0%, rgba(44,193,235,0.12) 60%, rgba(154,81,255,0) 100%)',
                        }}
                      />
                      <Image
                        src={industry.image}
                        alt={industry.alt}
                        fill
                        sizes="(min-width: 1280px) 300px, 88px"
                        className="object-contain"
                        style={{ filter: 'drop-shadow(0 18px 24px rgba(10,5,40,0.5))' }}
                      />
                    </div>

                    <div className="flex min-w-0 flex-1 items-end justify-between gap-3 xl:absolute xl:inset-x-0 xl:bottom-0 xl:p-6">
                      <h3
                        className="text-[1.25rem] text-white xl:text-[1.125rem] min-[1360px]:text-[1.25rem]"
                        style={{
                          margin: 0,
                          fontFamily: 'var(--font-display)',
                          fontWeight: 600,
                          letterSpacing: '-0.03em',
                          lineHeight: 1.25,
                          textWrap: 'balance',
                        }}
                      >
                        {industry.label}
                      </h3>
                      {industry.href ? (
                        <span
                          aria-hidden
                          className="cs-pqc-panel-arrow flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                          style={{ border: '1px solid rgba(255,255,255,0.32)' }}
                        >
                          <ArrowUpRight size={18} strokeWidth={1.75} />
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {industry.href ? (
                    <Link
                      href={industry.href}
                      aria-label={industry.label}
                      className="absolute inset-0 z-[2] rounded-[24px] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#33BAEC]"
                      onFocus={() => setActive(i)}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
