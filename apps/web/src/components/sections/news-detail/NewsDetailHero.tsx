import Link from "next/link";

interface NewsDetailHeroProps {
  title: string;
}

export function NewsDetailHero({
  title,
}: NewsDetailHeroProps): React.ReactElement {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        minHeight: "360px",
        background:
          "linear-gradient(180deg, #151021 0%, #10123E 38%, #131E8F 67%, #471EC0 86%, #471FC3 100%)",
      }}
    >
      {/* Decorative orb top-right */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blogs/hero-orb-top.png"
        alt=""
        className="pointer-events-none select-none absolute top-20 right-0 hidden xl:block"
        style={{ width: "265px", height: "265px", mixBlendMode: "lighten", opacity: 0.4 }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[1276px] px-6">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-0 pt-[58px]"
        >
          <Link
            href="/"
            className="flex items-center justify-center w-8 h-8 rounded-full"
            aria-label="Home"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5Z"
                stroke="rgba(152,172,195,0.8)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M9 21V12h6v9"
                stroke="rgba(152,172,195,0.8)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <BreadcrumbChevron />

          <Link
            href="/news"
            className="flex items-center h-8 px-2 rounded-full text-xs leading-[1.4]"
            style={{ color: "#98ACC3" }}
          >
            Resources
          </Link>

          <BreadcrumbChevron />

          <Link
            href="/news"
            className="flex items-center h-8 px-2 rounded-full text-xs leading-[1.4]"
            style={{ color: "#98ACC3" }}
          >
            Newsroom
          </Link>

          <BreadcrumbChevron />

          <span
            className="flex items-center h-8 px-2 max-w-[280px] truncate text-xs leading-[1.4]"
            style={{ color: "#BFCCDA" }}
          >
            {title}
          </span>
        </nav>

        {/* Title */}
        <div className="flex justify-center mt-10 pb-[80px]">
          <h1
            className="font-display text-[clamp(1.75rem,3.2vw,3rem)] font-semibold leading-[1.15] tracking-[-0.03em] text-white text-center"
            style={{ maxWidth: "860px" }}
          >
            {title}
          </h1>
        </div>
      </div>
    </section>
  );
}

function BreadcrumbChevron(): React.ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path d="M9 18l6-6-6-6" stroke="rgba(152,172,195,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
