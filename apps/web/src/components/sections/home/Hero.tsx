import { BrandMarquee } from "@/components/sections/home/BrandMarquee";
import { HeroCarousel } from "@/components/sections/home/HeroCarousel";
import { HeroProductSlide } from "@/components/sections/home/HeroProductSlide";

// CleanStart V4 home hero. The hero renders through HeroCarousel (currently a
// single product slide — the page's <h1>; with one slide it shows no dots and
// does not auto-advance). The brand marquee is a shared trust band pinned
// below the carousel — it does not rotate with the slides.
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
          ]}
        />

        <div className="pb-2 pt-16 lg:pt-24">
          <BrandMarquee />
        </div>
      </div>
    </section>
  );
}
