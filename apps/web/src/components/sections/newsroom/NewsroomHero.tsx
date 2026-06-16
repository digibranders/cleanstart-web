import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { mediaUrl } from "@/lib/blog";
import type { News } from "@/lib/news";
import { SearchBar } from "@/components/sections/_shared/SearchBar";
import { HeroReveal, Reveal } from "@/components/ui/Reveal";

const HERO_GRADIENT =
  "linear-gradient(180deg, #151021 0%, #10123e 45%, #131e8f 61%, #471ec0 75%, #471fc3 84%, rgba(70,30,191,0.85) 88%, rgba(66,30,188,0.40) 95%, rgba(66,30,188,0) 99%)";

interface NewsroomHeroProps {
  featuredPost: News | null;
  searchQuery: string;
}

export function NewsroomHero({
  featuredPost,
  searchQuery,
}: NewsroomHeroProps): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: HERO_GRADIENT }}
      aria-labelledby="newsroom-hero-title"
    >
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden sm:block"
        style={{
          left: "-119px",
          top: "120px",
          width: "332px",
          height: "313px",
          mixBlendMode: "hard-light",
          opacity: 0.3,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blogs/hero-glow-left.webp"
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pb-[clamp(56px,7vw,96px)]">
        <div
          className="flex flex-col items-center gap-10 mx-auto"
          style={{ paddingTop: "calc(clamp(72px, 9vw, 122px) + var(--cs-header-extra))", maxWidth: "864px" }}
        >
          <div
            className="flex flex-col items-center gap-10 w-full mx-auto"
            style={{ maxWidth: "702px" }}
          >
            <div className="flex flex-col items-center gap-8 w-full">
              <HeroReveal y={50} duration={1.0}>
                <h1
                  id="newsroom-hero-title"
                  className="font-display font-semibold text-white text-center w-full"
                  style={{
                    fontSize: "var(--fs-h1)",
                    lineHeight: "var(--text-hero-lh)",
                    letterSpacing: "var(--text-hero-utility-ls)",
                  }}
                >
                  Newsroom
                </h1>
              </HeroReveal>
              <HeroReveal y={30} delay={0.2} duration={0.8}>
                <p
                  className="font-sans font-normal text-white text-center"
                  style={{
                    fontSize: "var(--fs-lead)",
                    lineHeight: "1.4",
                    letterSpacing: "-0.04em",
                    opacity: 0.8,
                  }}
                >
                  Follow the latest developments in trusted software delivery, from
                  product launches and partnerships to research, industry insights,
                  and company news.
                </p>
              </HeroReveal>
            </div>

            <Suspense
              fallback={
                <div
                  className="flex items-center"
                  style={{ height: "36px", width: "100%", maxWidth: "674px" }}
                />
              }
            >
              <SearchBar
                initialQuery={searchQuery}
                placeholder="Search news of your interest..."
                ariaLabel="Search news"
              />
            </Suspense>
          </div>
        </div>

        {featuredPost ? (
          <Reveal
            className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(420px,580px)] mt-[clamp(56px,7vw,102px)]"
            style={{ gap: "32px" }}
          >
            {/* On mobile the text is ordered after the image. */}
            <div className="flex flex-col gap-6 items-start order-2 lg:order-1">
              <div className="flex flex-col gap-6 w-full">
                <p
                  className="text-body-lg font-medium leading-[1.5] tracking-[-0.04em]"
                  style={{ color: "#d8d8d8" }}
                >
                  FEATURED NEWS
                </p>
                <div className="flex flex-col gap-4 w-full">
                  <h2
                    className="font-display font-semibold leading-tight tracking-[-0.05em] text-white overflow-hidden"
                    style={{
                      /* Featured-tier card title — explicit 32px, sized between
                         the standard card title (--fs-h3 = 28) and section H2
                         (--fs-h2 = 56). */
                      fontSize: "32px",
                      display: "-webkit-box",
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {featuredPost.title}
                  </h2>
                  {featuredPost.abstract && (
                    <p
                      className="font-normal leading-[1.4] tracking-[-0.05em]"
                      /* Featured-tier card description — explicit 20px, pairs
                         with the 32px featured-card title above. */
                      style={{ fontSize: "20px", color: "#d1e5ff" }}
                    >
                      {featuredPost.abstract}
                    </p>
                  )}
                </div>
              </div>

              {/* Read more link */}
              <Link
                href={`/news/${featuredPost.slug}`}
                className="flex items-center gap-2 text-body-lg font-medium leading-[1.5] text-white text-center"
              >
                Read more
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/blogs/icon-arrow-hero-read-more.svg"
                  alt=""
                  aria-hidden
                  width={24}
                  height={24}
                  className="pointer-events-none select-none"
                />
              </Link>
            </div>

            {/* Right: featured media — outer purple border + inset plate.
                The plate mirrors the listing card cover: publisher logo →
                hero image → publisher name, contained on the brand gradient.
                On mobile, ordered BEFORE the text. */}
            <div
              className="relative w-full order-1 lg:order-2"
              style={{
                aspectRatio: "711 / 349",
                borderRadius: "20px",
                background: "rgba(165,103,255,0.4)",
              }}
            >
              {/* Plate inset 10px from all sides — creates the border illusion */}
              <div
                className="absolute overflow-hidden flex items-center justify-center"
                style={{
                  top: "9.5px",
                  left: "10px",
                  right: "10px",
                  bottom: "9.5px",
                  borderRadius: "12px",
                  background:
                    "linear-gradient(180deg, #10123e 0%, #131e8f 38%, #421ebc 100%)",
                }}
              >
                {featuredPost.publisherLogo?.url ? (
                  <div className="relative h-[45%] w-[72%]">
                    <Image
                      src={mediaUrl(featuredPost.publisherLogo.url)!}
                      alt={featuredPost.publisher ?? featuredPost.title}
                      fill
                      className="object-contain pointer-events-none select-none"
                      sizes="(min-width: 1024px) 420px, 90vw"
                      priority
                    />
                  </div>
                ) : featuredPost.heroImage?.url ? (
                  <Image
                    src={mediaUrl(featuredPost.heroImage.url)!}
                    alt={featuredPost.heroImage.alt ?? featuredPost.title}
                    fill
                    className="object-contain"
                    sizes="(min-width: 1024px) 580px, 90vw"
                    priority
                  />
                ) : (
                  <span
                    className="font-display font-bold text-center text-white"
                    style={{
                      fontSize: "var(--fs-h3)",
                      letterSpacing: "-0.03em",
                      padding: "0 24px",
                    }}
                  >
                    {featuredPost.publisher ?? "CleanStart"}
                  </span>
                )}
              </div>
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
