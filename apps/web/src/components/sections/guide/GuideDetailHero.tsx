import { formatGuideDate, guidePickImageUrl } from "@/lib/guides";
import type { GuideAuthor, GuideImage } from "@/lib/guides";
import { DetailHero, DetailHeroMetaSeparator } from "@/components/sections/_shared/DetailHero";
import { CalendarIcon, ClockIcon } from "@/components/sections/_shared/DetailHeroIcons";

interface GuideDetailHeroProps {
  title: string;
  slug: string;
  authors?: GuideAuthor[] | null | undefined;
  publishedAt?: string | undefined;
  updatedAt?: string | undefined;
  readingMinutes?: number | undefined;
  heroImage?: GuideImage | null | undefined;
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

export function GuideDetailHero({
  title,
  slug,
  authors,
  publishedAt,
  updatedAt,
  readingMinutes,
}: GuideDetailHeroProps): React.ReactElement {
  const primaryAuthor = authors?.[0];
  const showUpdated = shouldShowUpdated(publishedAt, updatedAt);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cleanstart.com";
  const shareUrl = `${siteUrl}/guide/${slug}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  return (
    <DetailHero
      title={title}
      breadcrumb={[
        { label: "Resources", href: "/guide" },
        { label: "Guides", href: "/guide" },
        { label: title },
      ]}
      meta={
        <>
          <div className="basis-full lg:hidden flex flex-col items-stretch w-full gap-[10px]">
            {primaryAuthor && (
              <div className="flex items-center justify-center gap-[7px]">
                {primaryAuthor.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={guidePickImageUrl(primaryAuthor.photo, ["thumb", "card", "hero"])}
                    alt={primaryAuthor.name}
                    className="rounded-full object-cover shrink-0"
                    style={{ width: "28px", height: "28px", display: "block" }}
                  />
                ) : (
                  <div
                    className="rounded-full bg-gradient-to-br from-[#9A51FF] to-[#2CC1EB] shrink-0"
                    style={{ width: "28px", height: "28px" }}
                    aria-hidden
                  />
                )}
                <span className="text-white whitespace-nowrap text-sm font-medium leading-[1.3]">
                  By {primaryAuthor.name}
                </span>
              </div>
            )}

            {(readingMinutes != null || publishedAt) && (
              <div className="flex items-center justify-between w-full">
                {readingMinutes != null ? (
                  <div className="flex items-center gap-[6px] text-white">
                    <ClockIcon />
                    <span className="whitespace-nowrap text-sm font-normal leading-none tracking-[-0.02em]">
                      {readingMinutes} min read
                    </span>
                  </div>
                ) : <span aria-hidden />}

                {publishedAt ? (
                  <div className="flex items-center gap-[6px] text-white">
                    <CalendarIcon />
                    <span className="whitespace-nowrap leading-none tracking-[-0.02em]">
                      <span
                        className="text-xs font-normal"
                        style={{ color: "rgba(255,255,255,0.65)" }}
                      >
                        {showUpdated && updatedAt ? "Updated" : "Published"}
                      </span>{" "}
                      <time
                        dateTime={showUpdated && updatedAt ? updatedAt : publishedAt}
                        className="text-white text-sm font-normal"
                      >
                        {formatGuideDate(showUpdated && updatedAt ? updatedAt : publishedAt)}
                      </time>
                    </span>
                  </div>
                ) : <span aria-hidden />}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 mt-1">
              <span
                className="font-sans text-white whitespace-nowrap"
                style={{ fontSize: "var(--fs-body-sm)", fontWeight: 500, opacity: 0.85 }}
              >
                Share
              </span>
              <ShareIconLink
                href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
                label="Share on WhatsApp"
                src="/images/news-detail/icon-share-whatsapp.svg"
              />
              <ShareIconLink
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                label="Share on Facebook"
                src="/images/news-detail/icon-share-facebook.svg"
              />
              <ShareIconLink
                href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
                label="Share on X"
                src="/images/news-detail/icon-share-x.svg"
              />
              <ShareIconLink
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                label="Share on LinkedIn"
                src="/images/news-detail/icon-share-linkedin.svg"
              />
              <ShareIconLink
                href="https://www.instagram.com/"
                label="Open Instagram"
                src="/images/news-detail/icon-share-instagram.svg"
              />
            </div>
          </div>

          {readingMinutes != null && (
            <div className="hidden lg:flex items-center gap-[8px] shrink-0 text-white">
              <ClockIcon />
              <span className="whitespace-nowrap font-normal leading-none tracking-[-0.05em]" style={{ fontSize: "var(--fs-body)" }}>
                {readingMinutes} min read
              </span>
            </div>
          )}

          {readingMinutes != null && (primaryAuthor ?? publishedAt) && <DetailHeroMetaSeparator />}

          {primaryAuthor && (
            <div className="hidden lg:flex items-center gap-[7px] shrink-0">
              {primaryAuthor.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={guidePickImageUrl(primaryAuthor.photo, ["thumb", "card", "hero"])}
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
              <span className="text-white whitespace-nowrap font-normal leading-[1.3]" style={{ fontSize: "var(--fs-body)" }}>
                By {primaryAuthor.name}
              </span>
            </div>
          )}

          {primaryAuthor && publishedAt && <DetailHeroMetaSeparator />}

          {publishedAt && (
            <div className="hidden lg:flex items-center gap-[8px] shrink-0 text-white">
              <CalendarIcon />
              <span className="whitespace-nowrap leading-none tracking-[-0.05em]">
                <span
                  className="font-normal"
                  style={{ fontSize: "var(--fs-caption)", color: "rgba(255,255,255,0.65)" }}
                >
                  {showUpdated && updatedAt ? "Updated" : "Published"}
                </span>{" "}
                <time
                  dateTime={showUpdated && updatedAt ? updatedAt : publishedAt}
                  className="text-white font-normal" style={{ fontSize: "var(--fs-body)" }}
                >
                  {formatGuideDate(showUpdated && updatedAt ? updatedAt : publishedAt)}
                </time>
              </span>
            </div>
          )}
        </>
      }
    />
  );
}

interface ShareIconLinkProps {
  href: string;
  label: string;
  src: string;
}

function ShareIconLink({
  href,
  label,
  src,
}: ShareIconLinkProps): React.ReactElement {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex items-center justify-center shrink-0 transition-opacity hover:opacity-80"
      style={{ width: "28px", height: "28px" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        width={24}
        height={24}
        className="pointer-events-none select-none"
        loading="lazy"
        decoding="async"
      />
    </a>
  );
}
