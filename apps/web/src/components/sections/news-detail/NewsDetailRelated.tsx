import Link from "next/link";
import { mediaUrl } from "@/lib/blog";
import { type News, formatNewsDate, pressTypeLabel } from "@/lib/news";

interface NewsDetailRelatedProps {
  items: News[];
}

export function NewsDetailRelated({
  items,
}: NewsDetailRelatedProps): React.ReactElement | null {
  if (!items.length) return null;

  return (
    <section
      className="relative w-full overflow-hidden"
      data-section="NewsDetailRelated"
      style={{ minHeight: "580px" }}
    >
      <div className="relative mx-auto max-w-[1276px] px-6">
        <div className="flex items-center justify-between pt-[80px]">
          <h2 className="font-display text-display-md font-bold leading-none tracking-[-0.05em]">
            <span className="text-white">Related </span>
            <span
              style={{
                backgroundImage:
                  "linear-gradient(101.688deg, #9A51FF 1.758%, #2CC1EB 98.781%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Posts
            </span>
          </h2>

          <Link
            href="/news"
            className="flex items-center gap-2 group"
            aria-label="See all news"
          >
            <span className="font-display text-[clamp(1.25rem,2.2vw,2rem)] font-bold leading-none tracking-[-0.05em] text-white group-hover:text-[#2CC1EB] transition-colors duration-200">
              See All
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/blog-detail/icon-see-all-arrow.svg"
              alt=""
              aria-hidden
              width={40}
              height={40}
              className="w-10 h-10 group-hover:translate-x-1 transition-transform duration-200"
              loading="lazy"
              decoding="async"
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-[60px] pb-[100px]">
          {items.map((item) => (
            <RelatedNewsCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RelatedNewsCard({ item }: { item: News }): React.ReactElement {
  const date = formatNewsDate(item.publicationDate);
  const logoUrl = mediaUrl(item.publisherLogo?.url);

  return (
    <Link href={`/news/${item.slug}`} className="block group" aria-label={item.title}>
      <article
        className="relative bg-white overflow-hidden flex flex-col h-full"
        style={{
          borderRadius: "24px",
          boxShadow:
            "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01)",
        }}
      >
        <div
          className="relative flex items-center justify-center"
          style={{
            margin: "16px",
            height: "140px",
            borderRadius: "16px",
            background: "linear-gradient(180deg, #F5F1FF 0%, #FFFFFF 100%)",
            overflow: "hidden",
          }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={item.publisher ?? item.title}
              className="object-contain pointer-events-none select-none group-hover:scale-105 transition-transform duration-500"
              style={{ maxHeight: "80px", maxWidth: "78%" }}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span
              className="font-display font-bold text-center"
              style={{
                color: "#4a3bf1",
                fontSize: "1.5rem",
                letterSpacing: "-0.03em",
                padding: "0 24px",
              }}
            >
              {item.publisher ?? "CleanStart"}
            </span>
          )}
        </div>

        <div className="flex flex-col flex-1 px-6 pb-6" style={{ gap: "12px" }}>
          <div className="flex items-center gap-4">
            <span
              className="inline-flex items-center text-xs font-medium leading-none whitespace-nowrap"
              style={{
                padding: "6px 10px",
                borderRadius: "999px",
                background: "rgba(74, 59, 241, 0.10)",
                color: "#4a3bf1",
              }}
            >
              {pressTypeLabel(item.pressType)}
            </span>
            {date && (
              <div className="flex items-center" style={{ gap: "4px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/blogs/icon-calendar-grey.svg"
                  alt=""
                  aria-hidden
                  width={16}
                  height={16}
                  className="pointer-events-none select-none"
                  loading="lazy"
                  decoding="async"
                />
                <span
                  className="text-xs font-medium leading-none whitespace-nowrap"
                  style={{ color: "#666" }}
                >
                  {date}
                </span>
              </div>
            )}
          </div>

          <h3
            className="font-display font-medium leading-[1.3] tracking-[-0.04em] overflow-hidden flex-1"
            style={{
              color: "#111",
              fontSize: "1.125rem",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {item.title}
          </h3>

          {item.abstract && (
            <p
              className="text-sm font-normal leading-[1.45] overflow-hidden"
              style={{
                color: "rgba(17,17,17,0.54)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {item.abstract}
            </p>
          )}

          <span
            className="mt-auto inline-flex items-center group-hover:translate-x-1 transition-transform duration-200"
            style={{ gap: "8px" }}
          >
            <span
              className="text-base font-medium leading-none"
              style={{ color: "#4a3bf1" }}
            >
              Read more
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/blogs/icon-arrow-read-more.svg"
              alt=""
              aria-hidden
              width={20}
              height={20}
              className="pointer-events-none select-none"
              loading="lazy"
              decoding="async"
            />
          </span>
        </div>
      </article>
    </Link>
  );
}
