export function CommunityHero() {
  return (
    // Figma frame 732:3193 is 1920×960px.
    // 56vw (not 50vw) gives the section enough height at 1280–1700px viewports so that the
    // proportional photo offset (48.33%) always clears the H1 bottom — without affecting
    // the 960px max (still hit at ≈1714px+, matching Figma exactly at 1920px).
    <section className="relative overflow-hidden lg:[min-height:clamp(560px,56vw,960px)]">

      {/* ── Hero photo (desktop) ─────────────────────────────────────────────────
          Figma: top=464px, height=496px in a 960px-tall frame.
          Proportional: top = 464/960 = 48.33 %, fills to bottom.
          Gradient overlay on top edge softens the cut-in for both viewports.
      ─────────────────────────────────────────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 hidden lg:block overflow-hidden"
        style={{ top: 'calc(464 / 960 * 100%)', bottom: 0 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/community/hero-photo.png"
          alt=""
          width={1960}
          height={496}
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover object-top"
        />
        {/* Brand-purple gradient tint covering the whole photo (Figma color cast) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(19,30,143,0.80) 0%, rgba(71,30,192,0.75) 55%, rgba(176,82,220,0.65) 100%)',
            mixBlendMode: 'multiply',
          }}
        />
        {/* Dark-to-transparent gradient over the top of the photo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[80px]"
          style={{
            background:
              'linear-gradient(180deg, rgba(15,18,62,0.75) 0%, rgba(15,18,62,0.35) 50%, rgba(15,18,62,0) 100%)',
          }}
        />
      </div>

      {/* ── Text content ──────────────────────────────────────────────────────────
          Figma: left=322px, top=172px, two 622px columns with 32px gap.
          At 1440px (75 % scale): top ≈ 129px, columns ≈ 466px each — handled by
          the clamp on pt and the lg:w-[48%] split.
      ─────────────────────────────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-[var(--container-default)] px-6">
        <div className="pt-[clamp(112px,10vw,172px)] pb-[clamp(40px,5vw,80px)]">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
            {/* H1 — Figma: 72px Manrope SemiBold, tracking -3.6px */}
            <h1
              className="font-display font-semibold text-white lg:w-[48%]"
              style={{
                fontSize: 'var(--fs-display)',
                lineHeight: 1.05,
                letterSpacing: '-0.04em',
              }}
            >
              Let&apos;s work together towards secure development
            </h1>

            {/* Subtitle + CTA — Figma: 30px Sora Regular, lh 1.4, tracking -1.2px, opacity 80% */}
            <div className="flex flex-col gap-8 lg:w-[48%] lg:pt-2">
              <p
                className="font-sans font-normal text-white/80"
                style={{
                  fontSize: 'var(--fs-lead)',
                  lineHeight: '1.4',
                  letterSpacing: '-0.04em',
                }}
              >
                Connect with developers and security leaders sharing real-world strategies to reduce
                risk, secure images, and ship faster with confidence.
              </p>
              <a
                href="https://github.com/cleanstart"
                target="_blank"
                rel="noopener noreferrer"
                className="cs-btn-glass self-start"
                style={{
                  ['--cs-btn-px' as string]: '22px',
                  ['--cs-btn-fs' as string]: '18px',
                  color: '#111111',
                  letterSpacing: '-0.05em',
                  fontWeight: 500,
                }}
              >
                Join Community
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero photo (mobile) ──────────────────────────────────────────────────
          Mobile lays the photo below the text rather than absolute-positioned.
          Gradient overlay top so the photo blends back into the dark hero bg.
      ─────────────────────────────────────────────────────────────────────────── */}
      <div className="relative z-0 lg:hidden">
        <div className="relative h-[clamp(220px,55vw,360px)] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/community/hero-photo.png"
            alt=""
            aria-hidden
            loading="eager"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(19,30,143,0.80) 0%, rgba(71,30,192,0.75) 55%, rgba(176,82,220,0.65) 100%)',
              mixBlendMode: 'multiply',
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[80px]"
            style={{
              background:
                'linear-gradient(180deg, rgba(15,18,62,0.75) 0%, rgba(15,18,62,0.35) 50%, rgba(15,18,62,0) 100%)',
            }}
          />
        </div>
      </div>

      {/* Bottom fade-out into the white Trusted-By section */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[200px]"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.18) 60%, rgba(255,255,255,0.40) 80%, rgba(255,255,255,0.70) 95%, #ffffff 100%)',
        }}
      />
    </section>
  );
}
