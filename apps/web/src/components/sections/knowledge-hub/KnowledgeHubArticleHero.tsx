import { SearchTriggerBar } from '@/components/search/SearchTriggerBar';
import { HeroReveal } from '@/components/ui/Reveal';

const HERO_GRADIENT =
  'linear-gradient(180deg, #151021 0%, #10123e 38%, #131e8f 67%, #471ec0 80%, #471fc3 100%)';

export function KnowledgeHubArticleHero(): React.ReactElement {
  return (
    <section
      className="relative w-full overflow-hidden min-h-[250px] sm:min-h-[330px] lg:min-h-[418px]"
      style={{ background: HERO_GRADIENT }}
      aria-labelledby="knowledge-hub-hero-title"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blogs/hero-orb-top.webp"
        alt=""
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          width: '332px',
          height: '313px',
          left: '-95px',
          top: '208px',
          mixBlendMode: 'hard-light',
          opacity: 0.4,
        }}
        loading="lazy"
        decoding="async"
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blogs/hero-orb-top.webp"
        alt=""
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          width: '294px',
          height: '298px',
          left: 'calc(1647 / 1920 * 100%)',
          top: '-1px',
          mixBlendMode: 'color-dodge',
          transform: 'rotate(-46.54deg)',
          opacity: 0.4,
        }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div className="flex flex-col items-center mx-auto max-w-[864px] pt-[calc(92px+var(--cs-header-extra))] pb-10 sm:pt-[calc(104px+var(--cs-header-extra))] sm:pb-14 lg:pt-[calc(120px+var(--cs-header-extra))] lg:pb-20">
          <HeroReveal y={50} duration={1.0}>
            <h1
              id="knowledge-hub-hero-title"
              className="font-display font-semibold text-white text-center"
              style={{
                fontSize: 'var(--fs-display)',
                lineHeight: 1.0,
                letterSpacing: '-0.05em',
              }}
            >
              Knowledge <span style={{ color: '#FFFFFF' }}>Hub</span>
            </h1>
          </HeroReveal>

          <HeroReveal
            y={30}
            delay={0.2}
            duration={0.8}
            className="mt-7 lg:mt-10 w-full flex justify-center"
          >
            <SearchTriggerBar
              placeholder="Search the Knowledge Hub…"
              ariaLabel="Search the Knowledge Hub"
            />
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
