import { Container } from "@/components/layout";
import { HeroReveal } from "@/components/ui/Reveal";

export function CommunityHero() {
  return (
    // 56vw (not 50vw) keeps the section tall enough at 1280–1700px viewports so the
    // proportional photo offset (48.33%) always clears the H1 bottom, without raising
    // the 960px max.
    <section className="relative overflow-hidden lg:[min-height:clamp(560px,56vw,960px)]">

      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 hidden lg:block overflow-hidden"
        style={{ top: 'calc(464 / 960 * 100%)', bottom: 0 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/community/hero-photo.webp"
          alt=""
          width={1960}
          height={496}
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover object-top"
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

      <Container className="relative z-10">
        <div className="mx-auto w-full max-w-[1200px] pt-[calc(clamp(112px,10vw,172px)+var(--cs-header-extra))] pb-[clamp(40px,5vw,80px)]">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
            <HeroReveal y={50} duration={1.0} className="lg:w-[48%]">
              <h1
                className="font-display font-semibold text-white"
                style={{
                  fontSize: 'var(--fs-display)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.04em',
                }}
              >
                Let&apos;s work together towards{" "}
                <span className="cs-text-gradient-impact">secure development</span>
              </h1>
            </HeroReveal>

            <div className="flex flex-col gap-8 lg:w-[48%] lg:pt-2">
              <HeroReveal y={30} delay={0.15} duration={0.8}>
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
              </HeroReveal>
              <HeroReveal y={30} delay={0.3} duration={0.8}>
                <a
                  href="https://www.linkedin.com/groups/18324021/"
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
              </HeroReveal>
            </div>
          </div>
        </div>
      </Container>

      <div className="hidden">
        <div className="relative h-[clamp(220px,55vw,360px)] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/community/hero-photo.webp"
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

      {/* Fades the dark hero into the white Trusted-By section below. */}
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
