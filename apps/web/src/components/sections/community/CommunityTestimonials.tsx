'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  avatarSrc: string;
  avatarW: number;
  avatarH: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Kevin R.',
    role: 'CISO, TechCorp',
    quote:
      '"CleanStart has fundamentally changed our approach to developer security. We\'ve reduced vulnerabilities by 90% by following community-driven standards."',
    avatarSrc: '/images/community/testimonial-avatar-1.png',
    avatarW: 47,
    avatarH: 47,
  },
  {
    name: 'Sarah M.',
    role: 'VP Engineering, DataFlow',
    quote:
      '"The community\'s insight on SBOMs saved us weeks of compliance work. CleanStart made our whole pipeline audit-ready overnight."',
    avatarSrc: '/images/community/testimonial-avatar-1.png',
    avatarW: 47,
    avatarH: 47,
  },
  {
    name: 'James T.',
    role: 'Platform Lead, ScaleOps',
    quote:
      '"Adopting zero-CVE images through CleanStart gave our team real confidence. Security is no longer an afterthought — it\'s baked into every build."',
    avatarSrc: '/images/community/testimonial-avatar-1.png',
    avatarW: 47,
    avatarH: 47,
  },
];

const CARD_GAP = 32; // px — matches Figma gap between cards

// ─── Component ────────────────────────────────────────────────────────────────

export function CommunityTestimonials(): React.ReactElement {
  const [current, setCurrent] = useState(0);
  const [slideWidth, setSlideWidth] = useState(696);
  const firstCardRef = useRef<HTMLDivElement>(null);
  const total = TESTIMONIALS.length;

  // Measure first card width on mount and on resize
  useEffect(() => {
    const update = (): void => {
      if (firstCardRef.current) {
        setSlideWidth(firstCardRef.current.getBoundingClientRect().width);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const prev = useCallback((): void => setCurrent((i) => Math.max(0, i - 1)), []);
  const next = useCallback(
    (): void => setCurrent((i) => Math.min(total - 1, i + 1)),
    [total],
  );

  const translateX = -(current * (slideWidth + CARD_GAP));

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: '#f6f6f6' }}
    >
      {/* ── Decorative: Vector grid — top-left ──────────────────────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/community/testimonial-vector.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{ left: '-270px', top: '-325px', width: '701px', height: '680px' }}
        loading="lazy"
        decoding="async"
      />
      {/* ── Decorative: Vector grid — top-right ─────────────────────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/community/testimonial-vector.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          left: 'calc(1441 / 1920 * 100%)',
          top: '-380px',
          width: '701px',
          height: '680px',
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Decorative: Union shapes ─────────────────────────────────────── */}
      {/* Right union */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          right: 'calc(-192 / 1920 * 100%)',
          top: '323px',
          width: '488px',
          height: '497px',
          transform: 'scaleY(-1) rotate(141.39deg)',
          opacity: 0.5,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/community/testimonial-union.svg"
          alt=""
          className="h-full w-full select-none object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>
      {/* Left union */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          left: 'calc(-192 / 1920 * 100%)',
          top: '323px',
          width: '488px',
          height: '497px',
          transform: 'scaleY(-1) rotate(141.39deg)',
          opacity: 0.5,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/community/testimonial-union.svg"
          alt=""
          className="h-full w-full select-none object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* ── Decorative: Purple ellipses ───────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          left: 'calc(-37 / 1920 * 100%)',
          top: '468px',
          width: '258px',
          height: '258px',
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(196,70,239,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          right: 'calc(-37 / 1920 * 100%)',
          top: '442px',
          width: '258px',
          height: '258px',
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(196,70,239,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {/*
          pb-section-cta = Footer CTA contract:
          170px CTA overlap + 80px breathing room above CTA top edge
          (see Footer.tsx layout contract comment)
      */}
      <div className="relative z-10 mx-auto max-w-[var(--container-default)] px-6 pb-section-cta pt-[clamp(40px,6vw,100px)]">

        {/* ── Header row: large quote mark + nav arrows ─────────────────── */}
        <div className="mb-10 flex items-center justify-between">
          {/* Large double-quote from Figma (72×72 asset) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/community/testimonial-quote-lg.svg"
            alt=""
            aria-hidden
            className="shrink-0 select-none"
            style={{ width: '72px', height: '72px' }}
            loading="eager"
            decoding="async"
          />

          {/* Prev / Next buttons */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              aria-label="Previous testimonial"
              onClick={prev}
              disabled={current === 0}
              className="shrink-0 transition-opacity disabled:opacity-30"
            >
              {/* imgFrame rotated 180° to become left-arrow */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/community/testimonial-btn-prev.svg"
                alt=""
                aria-hidden
                className="block select-none"
                style={{
                  width: '48px',
                  height: '48px',
                  transform: 'rotate(180deg) scaleY(-1)',
                }}
                loading="eager"
                decoding="async"
              />
            </button>
            <button
              type="button"
              aria-label="Next testimonial"
              onClick={next}
              disabled={current === total - 1}
              className="shrink-0 transition-opacity disabled:opacity-30"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/community/testimonial-btn-next.svg"
                alt=""
                aria-hidden
                className="block select-none"
                style={{ width: '48px', height: '48px' }}
                loading="eager"
                decoding="async"
              />
            </button>
          </div>
        </div>

        {/* ── Slider ────────────────────────────────────────────────────── */}
        {/*
            overflow-hidden clips the peeking next card.
            The track translates left by (current × (cardWidth + gap)).
            Right-edge blur overlay provides the soft Figma fade-out effect.
        */}
        <div className="relative overflow-hidden">
          {/* Slide track */}
          <div
            className="flex gap-8 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ transform: `translateX(${translateX}px)` }}
          >
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                ref={i === 0 ? firstCardRef : undefined}
                className="flex-none w-full md:w-[696px]"
                aria-hidden={i !== current}
              >
                {/* Card — white rounded-[32px] matching Figma SVG viewBox r=32 */}
                <div
                  className="min-h-[327px] rounded-[32px] bg-white p-[clamp(24px,3.33vw,48px)]"
                  style={{ boxShadow: '0 2px 32px rgba(17,17,17,0.06)' }}
                >
                  {/* Avatar row */}
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar circle */}
                      <div className="shrink-0 overflow-hidden rounded-full" style={{ width: 47, height: 47 }}>
                        <Image
                          src={t.avatarSrc}
                          alt={t.name}
                          width={t.avatarW}
                          height={t.avatarH}
                          sizes="47px"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p
                          className="font-sans font-semibold text-[#250800]"
                          style={{ fontSize: 'var(--fs-body)', lineHeight: '1.5' }}
                        >
                          {t.name}
                        </p>
                        <p
                          className="font-sans font-normal text-[#250800]"
                          style={{ fontSize: 'var(--fs-body-sm)', lineHeight: '1.5' }}
                        >
                          {t.role}
                        </p>
                      </div>
                    </div>
                    {/* Small quote mark — Figma imgImage583126Vectorized (35×47) */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/community/testimonial-quote-sm.svg"
                      alt=""
                      aria-hidden
                      className="shrink-0 select-none"
                      style={{ width: '35px', height: '47px', opacity: 0.25 }}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  {/* Quote text — Figma: Manrope SemiBold 26px / lh 1.5 */}
                  <p
                    className="font-display font-semibold text-[#250800]"
                    style={{
                      fontSize: 'var(--fs-lead)',
                      lineHeight: '1.5',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {t.quote}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right-edge blur fade — matches Figma's bg-[#f6f6f6] blur-[17px] overlay */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-[130px]"
            style={{
              background:
                'linear-gradient(to right, rgba(246,246,246,0) 0%, rgba(246,246,246,0.6) 40%, rgba(246,246,246,0.95) 80%, #f6f6f6 100%)',
            }}
          />
        </div>

      </div>
    </section>
  );
}
