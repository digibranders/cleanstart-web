'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { H2_STYLE } from './type';

/*
 * "Industries We Secure": a selector and a stage on the dark band.
 *
 * The four industries are a list of large names on the left. The stage on the
 * right is one lit pedestal ringed by two orbits (the hero's motif, laid flat),
 * and each industry's 3D icon stands on it. Choosing a name lifts that icon
 * onto the pedestal and sends a ring pulse outward; the previous icon sinks
 * away. Moving the mouse over the stage tilts the icon a few degrees.
 *
 * With no input the stage walks through the four in turn. The active name's
 * underline fills as the timer, and the walk stops for good the moment the
 * visitor picks one, and pauses while the pointer or focus is inside, or the
 * section is off screen. Reduced motion removes the walk, the orbits, the float
 * and the tilt; the icon change stays as a plain fade.
 *
 * Names for industries that have a page on this site (Financial Services,
 * Telecommunications) carry an arrow link beside them; the other two have no
 * page yet and are selectable only. Below lg the stage sits above the list.
 *
 * As the last band before the Footer's overlapping CTA card, bottom padding is
 * --spacing-section-cta (the footer contract).
 *
 * Labels are the brief's, verbatim. All motion is transform and opacity.
 */

interface Industry {
  label: string;
  image: string;
  alt: string;
  href?: string;
  /** Optional enlargement for icons whose artwork leaves more empty margin than its siblings. */
  scale?: number;
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
    image: '/images/pqc/industry-government-v2.webp',
    alt: '3D icon of a government building with columns, a pediment and two flags',
    scale: 1.3,
  },
  {
    label: 'Telecommunications',
    image: '/images/telecom/icon-distributed.webp',
    alt: '3D icon of a cell tower',
    href: '/industries/telecom',
  },
  {
    label: 'Critical Infrastructure',
    image: '/images/pqc/industry-infrastructure-v3.webp',
    alt: '3D icon of a power grid with a pylon, a wind turbine and a substation',
    scale: 1.25,
  },
];

export function PqcIndustries(): React.ReactElement {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const paused = hovered || focused || !visible;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? false), {
      threshold: 0.35,
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const choose = (index: number): void => {
    setActive(index);
    setAuto(false);
  };

  const advance = (): void => setActive((current) => (current + 1) % INDUSTRIES.length);

  const tilt = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType !== 'mouse') return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--px', String(((event.clientX - box.left) / box.width - 0.5) * 2));
    event.currentTarget.style.setProperty('--py', String(((event.clientY - box.top) / box.height - 0.5) * 2));
  };

  const level = (event: React.PointerEvent<HTMLDivElement>): void => {
    event.currentTarget.style.setProperty('--px', '0');
    event.currentTarget.style.setProperty('--py', '0');
  };

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
          <div
            ref={rootRef}
            data-paused={paused}
            className="mx-auto grid max-w-[1200px] grid-cols-1 items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-[clamp(32px,4vw,64px)]"
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
            }}
          >
            <div
              className="cs-pqc-ind-stage relative order-first aspect-[6/5] w-full lg:order-last lg:max-w-[540px] lg:justify-self-end"
              onPointerMove={tilt}
              onPointerLeave={level}
            >
              <div aria-hidden className="cs-pqc-ind-glow" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                aria-hidden
                src="/images/cleanstart-images/hero-vector-grid.svg"
                alt=""
                className="cs-pqc-ind-grid pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                loading="lazy"
                decoding="async"
              />

              <div aria-hidden className="cs-pqc-ind-world">
                <div className="cs-pqc-ind-plane">
                  <span className="cs-pqc-ind-ring-a" />
                  <span className="cs-pqc-ind-ring-b" />
                  <span className="cs-pqc-ind-disc" />
                  <span key={active} className="cs-pqc-ind-pulse" />
                  <span className="cs-pqc-ind-orbit cs-pqc-ind-orbit-a">
                    <span className="cs-pqc-ind-dot" />
                  </span>
                  <span className="cs-pqc-ind-orbit cs-pqc-ind-orbit-b">
                    <span className="cs-pqc-ind-dot cs-pqc-ind-dot-violet" />
                  </span>
                </div>
              </div>
              <span aria-hidden className="cs-pqc-ind-shadow" />

              <div className="cs-pqc-ind-slot">
                {INDUSTRIES.map((industry, i) => (
                  <div
                    key={industry.label}
                    className="cs-pqc-ind-icon"
                    data-active={active === i}
                    aria-hidden={active === i ? undefined : true}
                  >
                    <div className="cs-pqc-ind-tilt">
                      <div className="cs-pqc-float absolute inset-0" style={{ animationDelay: `${-i * 1.3}s` }}>
                        <Image
                          src={industry.image}
                          alt={industry.alt}
                          fill
                          sizes="(min-width: 1024px) 440px, 70vw"
                          className="object-contain"
                          style={{
                            filter: 'drop-shadow(0 22px 28px rgba(8,4,40,0.55))',
                            transform: industry.scale ? `scale(${industry.scale})` : undefined,
                            transformOrigin: '50% 62%',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ul className="m-0 flex list-none flex-col justify-center p-0">
              {INDUSTRIES.map((industry, i) => {
                const on = active === i;
                return (
                  <li key={industry.label} className="cs-pqc-ind-row" data-active={on}>
                    <div className="flex items-center gap-4 py-[clamp(16px,1.8vw,26px)]">
                      <h3 className="m-0 min-w-0 flex-1">
                        <button
                          type="button"
                          aria-pressed={on}
                          className="cs-pqc-ind-name w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33BAEC]"
                          onClick={() => choose(i)}
                          onFocus={() => setActive(i)}
                          onPointerEnter={(event) => {
                            if (event.pointerType === 'mouse') choose(i);
                          }}
                        >
                          {industry.label}
                        </button>
                      </h3>
                      {industry.href ? (
                        <Link
                          href={industry.href}
                          aria-label={`${industry.label} page`}
                          className="cs-pqc-ind-go flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33BAEC]"
                        >
                          <ArrowUpRight size={18} strokeWidth={1.75} aria-hidden />
                        </Link>
                      ) : null}
                    </div>
                    {on ? (
                      <span
                        aria-hidden
                        className="cs-pqc-ind-fill"
                        data-auto={auto}
                        onAnimationEnd={(event) => {
                          if (event.animationName === 'cs-pqc-ind-fill') advance();
                        }}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
