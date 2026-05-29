import Image from "next/image";
import { RenderLexical } from "@/lib/renderLexical";
import type { ResourceDetail } from "@/lib/resources";
import { mediaUrl, resourceCoverPoster } from "@/lib/resources";

interface ResourceDetailContentProps {
  resource: ResourceDetail;
}

export function ResourceDetailContent({
  resource,
}: ResourceDetailContentProps): React.ReactElement {
  const coverUrl = mediaUrl(resource.heroImage?.url);
  const fallbackPoster = resourceCoverPoster(resource.type);

  // Steps the overlay title down for longer copy so it clears the logo and the
  // booklet edge. Sizes in `cqw` so the title scales with the cover, not the
  // viewport — long titles can never overrun the booklet at any screen width.
  const titleLen = resource.title.length;
  const coverTitleFontSize =
    titleLen <= 28
      ? "clamp(0.95rem, 4cqw, 2.25rem)"
      : titleLen <= 44
        ? "clamp(0.85rem, 3.2cqw, 1.875rem)"
        : titleLen <= 64
          ? "clamp(0.8rem, 2.6cqw, 1.5rem)"
          : "clamp(0.75rem, 2.1cqw, 1.25rem)";
  const coverTitleLineClamp = titleLen <= 44 ? 3 : 4;

  return (
    <section
      className="relative pt-8 pb-section-cta lg:pt-12"
      style={{ zIndex: 1 }}
      aria-label="Resource content"
    >
      <div
        className="relative mx-auto"
        style={{
          maxWidth: "1276px",
          paddingLeft: "24px",
          paddingRight: "24px",
        }}
      >
        <div
          className="relative mx-auto overflow-hidden pb-12 lg:pb-20"
          style={{
            background: "white",
            borderRadius: "24px",
          }}
        >
          {/* CMS heroImage when set, otherwise the type-mapped booklet poster with title overlay. */}
          {coverUrl ? (
            <div className="flex justify-center pt-3 lg:pt-12 px-3 lg:px-6">
              <Image
                src={coverUrl}
                alt={resource.heroImage?.alt ?? resource.title}
                width={839}
                height={455}
                sizes="(min-width: 1024px) 839px, 100vw"
                className="w-full h-auto"
                style={{ borderRadius: "24px", objectFit: "cover", maxWidth: "839px" }}
                priority
              />
            </div>
          ) : (
            <div className="flex justify-center pt-3 lg:pt-12 px-3 lg:px-6">
              <div
                className="relative overflow-hidden"
                style={{
                  width: "839px",
                  maxWidth: "100%",
                  aspectRatio: "839 / 455",
                  borderRadius: "24px",
                  containerType: "inline-size",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fallbackPoster}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none block"
                  style={{ borderRadius: "24px" }}
                  loading="eager"
                  decoding="async"
                />
                <span
                  className="absolute font-display font-semibold text-white overflow-hidden"
                  style={{
                    top: "44%",
                    left: "22%",
                    right: "30%",
                    fontSize: coverTitleFontSize,
                    lineHeight: "1.18",
                    letterSpacing: "-0.04em",
                    display: "-webkit-box",
                    WebkitLineClamp: coverTitleLineClamp,
                    WebkitBoxOrient: "vertical",
                    textShadow: "0 1px 2px rgba(0,0,0,0.25)",
                    overflowWrap: "anywhere",
                  }}
                >
                  {resource.title}
                </span>
              </div>
            </div>
          )}

          <div
            className="mx-auto pt-6 lg:pt-12 px-6"
            style={{ maxWidth: "840px" }}
          >
            {resource.summary && (
              <p
                className="text-base lg:text-xl font-normal leading-[1.4] tracking-[-0.04em] mb-4 lg:mb-6"
                style={{
                  color: "#111",
                  opacity: 0.8,
                }}
              >
                {resource.summary}
              </p>
            )}
            <div
              className="resource-body text-base lg:text-xl leading-[1.5] lg:leading-[1.4] tracking-[-0.04em]"
              style={{ color: "#111" }}
            >
              <RenderLexical content={resource.body} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
