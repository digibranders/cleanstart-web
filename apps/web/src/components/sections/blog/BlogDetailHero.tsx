import { formatBlogDate, pickImageUrl } from "@/lib/blog";
import type { BlogCategory, BlogAuthor, BlogImage } from "@/lib/blog";
import { DetailHero, DetailHeroMetaSeparator } from "@/components/sections/_shared/DetailHero";

interface BlogDetailHeroProps {
  title: string;
  categories?: BlogCategory | null | undefined;
  authors?: BlogAuthor[] | undefined;
  publishedAt?: string | undefined;
  readingMinutes?: number | undefined;
  heroImage?: BlogImage | undefined;
}

export function BlogDetailHero({
  title,
  categories: _categories,
  authors,
  publishedAt,
  readingMinutes,
}: BlogDetailHeroProps): React.ReactElement {
  const primaryAuthor = authors?.[0];

  return (
    <DetailHero
      title={title}
      breadcrumb={[
        { label: "Resources", href: "/blogs" },
        { label: "Blogs", href: "/blogs" },
        { label: title },
      ]}
      meta={
        <>
          {readingMinutes != null && (
            <div className="flex items-center gap-[4px] shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/blogs/icon-clock.svg"
                alt=""
                aria-hidden
                width={32}
                height={32}
                className="shrink-0"
              />
              <span className="text-white whitespace-nowrap text-[clamp(0.875rem,1.4vw,1.25rem)] font-medium leading-[1.3]">
                {readingMinutes} min read
              </span>
            </div>
          )}

          {readingMinutes != null && (primaryAuthor ?? publishedAt) && <DetailHeroMetaSeparator />}

          {primaryAuthor && (
            <div className="flex items-center gap-[7px] shrink-0">
              {primaryAuthor.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pickImageUrl(primaryAuthor.photo, ["thumb", "card", "hero"])}
                  alt={primaryAuthor.name}
                  className="rounded-full object-cover shrink-0"
                  style={{ width: "32px", height: "32px", display: "block" }}
                />
              ) : (
                <div
                  className="rounded-full bg-gradient-to-br from-[#9A51FF] to-[#2CC1EB] shrink-0"
                  style={{ width: "32px", height: "32px" }}
                  aria-hidden
                />
              )}
              <span className="text-white whitespace-nowrap text-[clamp(0.875rem,1.4vw,1.25rem)] font-medium leading-[1.3]">
                By {primaryAuthor.name}
              </span>
            </div>
          )}

          {primaryAuthor && publishedAt && <DetailHeroMetaSeparator />}

          {publishedAt && (
            <div className="flex items-center gap-[8px] shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/blogs/icon-calendar.svg"
                alt=""
                aria-hidden
                width={40}
                height={40}
                className="shrink-0"
                style={{ width: "40px", height: "40px" }}
              />
              <span className="text-white whitespace-nowrap text-[clamp(0.875rem,1.4vw,1.25rem)] font-medium leading-none tracking-[-0.05em]">
                {formatBlogDate(publishedAt)}
              </span>
            </div>
          )}
        </>
      }
    />
  );
}
