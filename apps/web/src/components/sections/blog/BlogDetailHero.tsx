import { formatBlogDate, pickImageUrl } from "@/lib/blog";
import type { BlogCategory, BlogAuthor, BlogImage } from "@/lib/blog";
import { DetailHero, DetailHeroMetaSeparator } from "@/components/sections/_shared/DetailHero";
import { CalendarIcon, ClockIcon } from "@/components/sections/_shared/DetailHeroIcons";

interface BlogDetailHeroProps {
  title: string;
  categories?: BlogCategory | null | undefined;
  authors?: BlogAuthor[] | undefined;
  publishedAt?: string | undefined;
  updatedAt?: string | undefined;
  readingMinutes?: number | undefined;
  heroImage?: BlogImage | undefined;
}

// Show "Updated" only when the document was meaningfully revised after publish.
// Threshold avoids labeling every typo-fix save as an editorial update.
const UPDATED_THRESHOLD_MS = 24 * 60 * 60 * 1000;

function shouldShowUpdated(publishedAt?: string, updatedAt?: string): boolean {
  if (!publishedAt || !updatedAt) return false;
  const p = new Date(publishedAt).getTime();
  const u = new Date(updatedAt).getTime();
  if (Number.isNaN(p) || Number.isNaN(u)) return false;
  return u - p > UPDATED_THRESHOLD_MS;
}

export function BlogDetailHero({
  title,
  categories: _categories,
  authors,
  publishedAt,
  updatedAt,
  readingMinutes,
}: BlogDetailHeroProps): React.ReactElement {
  const primaryAuthor = authors?.[0];
  const showUpdated = shouldShowUpdated(publishedAt, updatedAt);

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
            <div className="flex items-center gap-[8px] shrink-0 text-white">
              <ClockIcon />
              <span className="whitespace-nowrap text-[clamp(0.875rem,1.4vw,1.25rem)] font-normal leading-none tracking-[-0.05em]">
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
              <span className="text-white whitespace-nowrap text-[clamp(0.875rem,1.4vw,1.25rem)] font-normal leading-[1.3]">
                By {primaryAuthor.name}
              </span>
            </div>
          )}

          {primaryAuthor && publishedAt && <DetailHeroMetaSeparator />}

          {publishedAt && (
            <div className="flex items-center gap-[8px] shrink-0 text-white">
              <CalendarIcon />
              <span className="whitespace-nowrap leading-none tracking-[-0.05em]">
                <span
                  className="text-[clamp(0.75rem,1.1vw,1rem)] font-normal"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  {showUpdated && updatedAt ? "Updated" : "Published"}
                </span>{" "}
                <time
                  dateTime={showUpdated && updatedAt ? updatedAt : publishedAt}
                  className="text-white text-[clamp(0.875rem,1.4vw,1.25rem)] font-normal"
                >
                  {formatBlogDate(showUpdated && updatedAt ? updatedAt : publishedAt)}
                </time>
              </span>
            </div>
          )}
        </>
      }
    />
  );
}
