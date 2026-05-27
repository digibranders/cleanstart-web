import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { type Blog, type BlogCategory, formatBlogDate, mediaUrl } from "@/lib/blog";
import { SearchBar } from "@/components/sections/_shared/SearchBar";

const HERO_GRADIENT =
  "linear-gradient(180deg, #151021 0%, #10123e 45%, #131e8f 61%, #471ec0 75%, #471fc3 84%, rgba(70,30,191,0.85) 88%, rgba(66,30,188,0.40) 95%, rgba(66,30,188,0) 99%)";

interface BlogsHeroProps {
  featuredPost: Blog | null;
  categories: BlogCategory[];
  activeCategory: string;
  searchQuery: string;
}

export function BlogsHero({
  featuredPost,
  categories,
  activeCategory,
  searchQuery,
}: BlogsHeroProps): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "clamp(820px, 75vw, 1059px)", background: HERO_GRADIENT }}
      aria-labelledby="blogs-hero-title"
    >
      {/* Decorative glow — left side, mix-blend-hard-light (hidden on mobile) */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden sm:block"
        style={{
          left: "-119px",
          top: "279px",
          width: "332px",
          height: "313px",
          mixBlendMode: "hard-light",
          opacity: 0.3,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blogs/hero-glow-left.png"
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Decorative glow — right side, mirrored from left (hidden on mobile) */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden sm:block"
        style={{
          right: "-119px",
          top: "279px",
          width: "332px",
          height: "313px",
          mixBlendMode: "hard-light",
          opacity: 0.3,
          transform: "scaleX(-1)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blogs/hero-glow-left.png"
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pb-[clamp(96px,12vw,160px)]">
        {/* Title + search + categories — centered block */}
        <div
          className="flex flex-col items-center gap-10 mx-auto"
          style={{ paddingTop: "clamp(72px, 9vw, 122px)", maxWidth: "864px" }}
        >
          {/* Title + subtitle + search */}
          <div
            className="flex flex-col items-center gap-10 w-full mx-auto"
            style={{ maxWidth: "702px" }}
          >
            <div className="flex flex-col items-center gap-8 w-full">
              <h1
                id="blogs-hero-title"
                className="font-display font-semibold text-white text-center w-full"
                style={{
                  fontSize: "var(--fs-h1)",
                  lineHeight: "var(--text-hero-lh)",
                  letterSpacing: "var(--text-hero-utility-ls)",
                }}
              >
                Blogs
              </h1>
              <p
                className="font-sans font-normal text-white text-center"
                style={{
                  fontSize: "var(--fs-lead)",
                  lineHeight: "1.4",
                  letterSpacing: "-0.04em",
                  opacity: 0.8,
                }}
              >
                A Curated Collection of Writings, Research, and Solutions
              </p>
            </div>

            {/* Search bar */}
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
                placeholder="Search articles of your interest..."
                ariaLabel="Search blogs"
              />
            </Suspense>
          </div>

          {/* Category filter pills.
              MOBILE (<lg): single horizontally-scrollable row per Figma 817:3566.
              LG+: wrap-to-multiple-rows centered within the hero. */}
          <nav
            className="-mx-6 sm:mx-0 lg:flex-wrap lg:justify-center flex items-center gap-[10px] overflow-x-auto lg:overflow-visible px-6 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-screen sm:w-auto"
            aria-label="Blog categories"
          >
            <CategoryPill
              label="All"
              href="/blogs"
              active={activeCategory === ""}
            />
            {categories.map((cat) => (
              <CategoryPill
                key={cat.id}
                label={cat.name}
                href={`/blogs?category=${cat.slug}`}
                active={activeCategory === cat.slug}
              />
            ))}
          </nav>
        </div>

        {/* Featured Blog — 2-column: text left, image right */}
        {featuredPost ? (
          <div
            className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(420px,580px)] mt-[clamp(56px,7vw,102px)]"
            style={{ gap: "32px" }}
          >
            {/* Left: text — on mobile, ordered AFTER the image per Figma 817:3470 layout. */}
            <div className="flex flex-col gap-6 items-start order-2 lg:order-1">
              <div className="flex flex-col gap-6 w-full">
                <p
                  className="text-body-lg font-medium leading-[1.5] tracking-[-0.04em]"
                  style={{ color: "#d8d8d8" }}
                >
                  FEATURED ARTICLES
                </p>
                <div className="flex flex-col gap-4 w-full">
                  <h2
                    className="font-display font-bold leading-tight tracking-[-0.05em] text-white overflow-hidden"
                    style={{
                      /* Featured article title is a CARD title, not a section H2 — use --fs-h3 (22→28). */
                      fontSize: "var(--fs-h3)",
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
                      style={{ fontSize: "var(--fs-lead)", color: "#d1e5ff" }}
                    >
                      {featuredPost.abstract}
                    </p>
                  )}
                </div>
              </div>

              {/* Read more link */}
              <Link
                href={`/blog/${featuredPost.slug}`}
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

            {/* Right: featured image — outer purple border + inset image. On
                mobile, ordered BEFORE the text per Figma 817:3470. */}
            <div
              className="relative w-full order-1 lg:order-2"
              style={{
                aspectRatio: "711 / 349",
                borderRadius: "20px",
                background: "rgba(165,103,255,0.4)",
              }}
            >
              {/* Image inset 10px from all sides — creates the border illusion */}
              <div
                className="absolute overflow-hidden"
                style={{
                  top: "9.5px",
                  left: "10px",
                  right: "10px",
                  bottom: "9.5px",
                  borderRadius: "12px",
                }}
              >
                {featuredPost.heroImage?.url ? (
                  <Image
                    src={mediaUrl(featuredPost.heroImage.url)!}
                    alt={featuredPost.heroImage.alt ?? featuredPost.title}
                    fill
                    className="object-cover"
                    sizes="711px"
                    priority
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{
                      background:
                        "linear-gradient(135deg, #1a1a4e 0%, #2d1b9e 50%, #471ec0 100%)",
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CategoryPill({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}): React.ReactElement {
  return (
    <Link
      href={href}
      className="cs-category-pill flex items-center justify-center font-sans font-normal text-white shrink-0"
      style={{
        height: "32px",
        padding: "6px 16px",
        borderRadius: "30px",
        background: active
          ? "rgba(196,70,239,0.6)"
          : "rgba(196,70,239,0.2)",
        // eslint-disable-next-line no-restricted-syntax -- v3 exception: anchored Figma spec inside a constrained component (button/pill/badge/card internal). See RESPONSIVE-AUDIT.md §14.3.
        fontSize: "var(--fs-body-sm)",
        lineHeight: "1.0",
        letterSpacing: "-0.02em",
        whiteSpace: "nowrap",
      }}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

export { formatBlogDate };
