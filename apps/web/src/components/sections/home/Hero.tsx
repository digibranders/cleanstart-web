import { BrandMarquee } from "@/components/sections/home/BrandMarquee";
import { HeroAwardSlide } from "@/components/sections/home/HeroAwardSlide";
import { HeroCarousel } from "@/components/sections/home/HeroCarousel";
import { HeroProductSlide } from "@/components/sections/home/HeroProductSlide";

// CleanStart V4 home hero. The hero is now an auto-advancing crossfade carousel
// (HeroCarousel) rotating between the product slide (slide 1, the page's <h1>)
// and the "Winners of 2026" awards campaign slide. The brand marquee is a shared
// trust band pinned below the carousel — it does not rotate with the slides.
export function Hero(): React.ReactElement {
  return (
    <section className="relative overflow-hidden pt-[calc(clamp(96px,8vw,120px)+var(--cs-header-extra))]">
      <div className="mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <HeroCarousel
          slides={[
            {
              id: "product",
              label: "Verified, zero-CVE container images and libraries",
              content: <HeroProductSlide />,
            },
            {
              id: "award",
              label: "Winners of the 2026 Cybersecurity Stars Awards",
              content: <HeroAwardSlide />,
            },
          ]}
        />

        <div className="pb-2 pt-16 lg:pt-24">
          <BrandMarquee />
        </div>
      </div>
    </section>
  );
}
