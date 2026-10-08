import { breadcrumbTrail } from "@cleanstart/schema/builders";
import type { PressType } from "@/lib/news";
import { formatNewsDate, pressTypeLabel } from "@/lib/news-utils";
import { DetailHero, DetailHeroMetaSeparator } from "@/components/sections/_shared/DetailHero";
import { CalendarIcon } from "@/components/sections/_shared/DetailHeroIcons";

interface NewsDetailHeroProps {
  title: string;
  pressType?: PressType | null | undefined;
  publicationDate?: string | null | undefined;
  shareUrl: string;
  shareTitle: string;
}

export function NewsDetailHero({
  title,
  pressType,
  publicationDate,
  shareUrl,
  shareTitle,
}: NewsDetailHeroProps): React.ReactElement {
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(shareTitle);

  return (
    <DetailHero
      title={title}
      breadcrumb={breadcrumbTrail("news", { title }).slice(1)}
      meta={
        <>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/news-detail/icon-press-release.svg"
              alt=""
              aria-hidden
              width={40}
              height={40}
              className="pointer-events-none select-none"
              loading="lazy"
              decoding="async"
            />
            <span
              className="text-body-lg font-medium leading-[1.3] text-white whitespace-nowrap"
              style={{ letterSpacing: "-0.01em" }}
            >
              {pressTypeLabel(pressType)}
            </span>
          </div>

          <DetailHeroMetaSeparator />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <ShareIcon
                href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
                label="Share on WhatsApp"
                src="/images/news-detail/icon-share-whatsapp.svg"
              />
              <ShareIcon
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                label="Share on Facebook"
                src="/images/news-detail/icon-share-facebook.svg"
              />
              <ShareIcon
                href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
                label="Share on X"
                src="/images/news-detail/icon-share-x.svg"
              />
              <ShareIcon
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                label="Share on LinkedIn"
                src="/images/news-detail/icon-share-linkedin.svg"
              />
            </div>
          </div>

          <DetailHeroMetaSeparator />

          {publicationDate && (
            <div className="flex items-center gap-[8px] text-white">
              <CalendarIcon />
              <time
                dateTime={publicationDate}
                className="font-medium leading-none whitespace-nowrap tracking-[-0.05em]"
                style={{ fontSize: "var(--fs-body)" }}
              >
                {formatNewsDate(publicationDate)}
              </time>
            </div>
          )}
        </>
      }
    />
  );
}

interface ShareIconProps {
  href: string;
  label: string;
  src: string;
}

function ShareIcon({ href, label, src }: ShareIconProps): React.ReactElement {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex items-center justify-center shrink-0 transition-opacity hover:opacity-80"
      style={{ width: "32px", height: "32px" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        width={32}
        height={32}
        className="pointer-events-none select-none"
        loading="lazy"
        decoding="async"
      />
    </a>
  );
}
