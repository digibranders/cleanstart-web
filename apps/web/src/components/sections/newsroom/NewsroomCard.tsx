import Link from "next/link";
import { mediaUrl } from "@/lib/blog";
import { type News, formatNewsDate, pressTypeLabel } from "@/lib/news";

interface NewsroomCardProps {
  item: News;
}

export function NewsroomCard({ item }: NewsroomCardProps): React.ReactElement {
  const date = formatNewsDate(item.publicationDate);
  const logoUrl = mediaUrl(item.publisherLogo?.url);
  const pillLabel = pressTypeLabel(item.pressType);

  return (
    <article
      className="relative bg-white overflow-hidden flex flex-col"
      style={{
        borderRadius: "24px",
        minHeight: "404px",
        boxShadow:
          "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01), 0px 52px 21px 0px rgba(0,0,0,0)",
      }}
    >
      {/* Publisher logo banner */}
      <div
        className="relative flex items-center justify-center"
        style={{
          margin: "16px",
          height: "140px",
          borderRadius: "16px",
          background:
            "linear-gradient(180deg, #F5F1FF 0%, #FFFFFF 100%)",
          overflow: "hidden",
        }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={item.publisher ?? item.title}
            className="object-contain pointer-events-none select-none"
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

      {/* Content */}
      <div className="flex flex-col flex-1 px-6 pb-6" style={{ gap: "12px" }}>
        {/* Meta row: pill + date */}
        <div className="flex items-center gap-4">
          <span
            className="inline-flex items-center text-xs font-medium leading-none whitespace-nowrap"
            style={{
              padding: "6px 10px",
              borderRadius: "999px",
              background: "rgba(74, 59, 241, 0.10)",
              color: "#4a3bf1",
              letterSpacing: "-0.01em",
            }}
          >
            {pillLabel}
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

        {/* Title */}
        <h3
          className="font-display font-medium leading-[1.3] tracking-[-0.04em] overflow-hidden"
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

        {/* Abstract */}
        {item.abstract && (
          <p
            className="text-sm font-normal leading-[1.45] overflow-hidden"
            style={{
              color: "rgba(17,17,17,0.54)",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {item.abstract}
          </p>
        )}

        {/* Read more */}
        <Link
          href={`/news/${item.slug}`}
          className="mt-auto pt-2 inline-flex items-center group"
          style={{ gap: "8px" }}
          aria-label={`Read more about ${item.title}`}
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
            className="pointer-events-none select-none group-hover:translate-x-1 transition-transform duration-200"
            loading="lazy"
            decoding="async"
          />
        </Link>
      </div>
    </article>
  );
}
