import Image from "next/image";
import Link from "next/link";
import { mediaUrl } from "@/lib/blog";
import { type News, formatNewsDate, pressTypeLabel } from "@/lib/news";

interface NewsroomCardProps {
  item: News;
}

export function NewsroomCard({ item }: NewsroomCardProps): React.ReactElement {
  const date = formatNewsDate(item.publicationDate);
  const readTime = item.readingMinutes ? `${item.readingMinutes} min read` : null;
  const pillLabel = pressTypeLabel(item.pressType);
  const heroUrl = mediaUrl(item.heroImage?.url);
  const logoUrl = mediaUrl(item.publisherLogo?.url);

  return (
    <article
      className="relative bg-white overflow-hidden"
      style={{
        width: "404px",
        height: "521px",
        borderRadius: "32px",
        boxShadow:
          "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01), 0px 52px 21px 0px rgba(0,0,0,0), 0px 81px 23px 0px rgba(0,0,0,0)",
      }}
    >
      {/* Card image */}
      <div
        className="absolute overflow-hidden flex items-center justify-center"
        style={{
          top: "12px",
          left: "12px",
          width: "380px",
          height: "200px",
          borderRadius: "20px",
          background:
            "linear-gradient(180deg, #10123e 0%, #131f8f 52%, rgba(66,30,188,0.4) 100%)",
        }}
      >
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={item.heroImage?.alt ?? item.title}
            fill
            className="object-cover"
            sizes="380px"
          />
        ) : logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={item.publisher ?? item.title}
            className="object-contain pointer-events-none select-none"
            style={{ maxHeight: "96px", maxWidth: "78%" }}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span
            className="font-display font-bold text-center text-white"
            style={{
              fontSize: "1.5rem",
              letterSpacing: "-0.03em",
              padding: "0 24px",
            }}
          >
            {item.publisher ?? "CleanStart"}
          </span>
        )}
      </div>

      {/* Category badge — overlaps image bottom */}
      <div
        className="absolute flex items-center justify-center overflow-hidden"
        style={{
          top: "190px",
          left: "32px",
          padding: "6px 12px",
          borderRadius: "8px",
          boxShadow: "0px 3px 0px 0px #4a3bf1",
          zIndex: 1,
        }}
      >
        {/* Badge background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blogs/card-category-badge-bg.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none rounded-[8px]"
        />
        {/* Left cyan glow ellipse */}
        <div
          aria-hidden
          className="absolute pointer-events-none select-none"
          style={{
            width: "54px",
            height: "8px",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            borderRadius: "50%",
            background: "#00cfff",
            filter: "blur(8px)",
            opacity: 0.75,
          }}
        />
        {/* Right purple blur ellipse */}
        <div
          aria-hidden
          className="absolute pointer-events-none select-none"
          style={{
            width: "32px",
            height: "5px",
            right: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            borderRadius: "50%",
            background: "#4a3bf1",
            filter: "blur(5px)",
          }}
        />
        <span
          className="relative text-base font-medium leading-[1.3] whitespace-nowrap"
          style={{ color: "#4a3bf1" }}
        >
          {pillLabel}
        </span>
      </div>

      {/* Card content — fills remaining height, Read more pinned to bottom */}
      <div
        className="absolute flex flex-col justify-between"
        style={{
          top: "247px",
          left: "32px",
          right: "32px",
          bottom: "32px",
        }}
      >
        <div className="flex flex-col" style={{ gap: "12px" }}>
          {/* Meta row: date + read time */}
          <div className="flex items-center" style={{ gap: "16px" }}>
            {date && (
              <div className="flex items-center" style={{ gap: "4px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/blogs/icon-calendar-grey.svg"
                  alt=""
                  aria-hidden
                  width={18}
                  height={18}
                  className="pointer-events-none select-none"
                  loading="lazy"
                  decoding="async"
                />
                <span
                  className="text-sm font-medium leading-normal"
                  style={{ color: "#666" }}
                >
                  {date}
                </span>
              </div>
            )}
            {readTime && (
              <div className="flex items-center" style={{ gap: "4px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/blogs/icon-clock-grey.svg"
                  alt=""
                  aria-hidden
                  width={18}
                  height={18}
                  className="pointer-events-none select-none"
                  loading="lazy"
                  decoding="async"
                />
                <span
                  className="text-sm font-medium leading-normal"
                  style={{ color: "#666" }}
                >
                  {readTime}
                </span>
              </div>
            )}
          </div>

          {/* Title + abstract */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <h3
              className="font-display text-[clamp(1rem,1.67vw,1.5rem)] font-medium leading-[1.3] tracking-[-0.05em] overflow-hidden"
              style={{
                color: "#111",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              {item.title}
            </h3>
            {item.abstract && (
              <p
                className="text-base font-normal leading-[1.3] overflow-hidden"
                style={{
                  color: "rgba(17,17,17,0.54)",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {item.abstract}
              </p>
            )}
          </div>
        </div>

        {/* Read more */}
        <Link
          href={`/news/${item.slug}`}
          className="flex items-center group"
          style={{ gap: "8px" }}
          aria-label={`Read more about ${item.title}`}
        >
          <span
            className="text-xl font-medium leading-[1.5] text-center whitespace-nowrap"
            style={{ color: "#4a3bf1" }}
          >
            Read more
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/blogs/icon-arrow-read-more.svg"
            alt=""
            aria-hidden
            width={24}
            height={24}
            className="pointer-events-none select-none group-hover:translate-x-1 transition-transform duration-200"
            loading="lazy"
            decoding="async"
          />
        </Link>
      </div>
    </article>
  );
}
