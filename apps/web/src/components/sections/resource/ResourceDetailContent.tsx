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

  return (
    <section
      className="relative"
      style={{
        background: "#f6f6f6",
        borderRadius: "32px 32px 0 0",
        marginTop: "-32px",
        zIndex: 1,
        paddingTop: "48px",
        paddingBottom: "250px",
      }}
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
        {/* White content card */}
        <div
          className="relative mx-auto overflow-hidden"
          style={{
            background: "white",
            borderRadius: "24px",
            paddingBottom: "80px",
          }}
        >
          {/* Cover image — CMS heroImage if set, otherwise the type-mapped booklet poster with title overlay. */}
          {coverUrl ? (
            <div className="flex justify-center" style={{ paddingTop: "48px", paddingLeft: "24px", paddingRight: "24px" }}>
              <Image
                src={coverUrl}
                alt={resource.heroImage?.alt ?? resource.title}
                width={839}
                height={455}
                style={{ borderRadius: "16px", objectFit: "cover" }}
                priority
              />
            </div>
          ) : (
            <div className="flex justify-center" style={{ paddingTop: "48px", paddingLeft: "24px", paddingRight: "24px" }}>
              <div
                className="relative overflow-hidden"
                style={{ width: "839px", maxWidth: "100%", aspectRatio: "839 / 455", borderRadius: "16px" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fallbackPoster}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                  loading="eager"
                  decoding="async"
                />
                <span
                  className="absolute font-display font-medium text-white overflow-hidden"
                  style={{
                    top: "26%",
                    left: "23%",
                    right: "30%",
                    fontSize: "clamp(1.25rem, 2.4vw, 2.25rem)",
                    lineHeight: "1.2",
                    letterSpacing: "-0.04em",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {resource.title}
                </span>
              </div>
            </div>
          )}

          {/* Body text */}
          <div
            className="mx-auto"
            style={{
              maxWidth: "840px",
              paddingTop: "48px",
              paddingLeft: "24px",
              paddingRight: "24px",
            }}
          >
            {resource.summary && (
              <p
                className="text-xl font-normal leading-[1.4] tracking-[-0.04em]"
                style={{
                  color: "#111",
                  opacity: 0.8,
                  marginBottom: "24px",
                }}
              >
                {resource.summary}
              </p>
            )}
            <div
              className="resource-body text-xl leading-[1.4] tracking-[-0.04em]"
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
