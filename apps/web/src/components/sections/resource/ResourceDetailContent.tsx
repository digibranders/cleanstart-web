import Image from "next/image";
import { RenderLexical } from "@/lib/renderLexical";
import type { ResourceDetail } from "@/lib/resources";
import { mediaUrl } from "@/lib/resources";

interface ResourceDetailContentProps {
  resource: ResourceDetail;
}

export function ResourceDetailContent({
  resource,
}: ResourceDetailContentProps): React.ReactElement {
  const coverUrl = mediaUrl(resource.heroImage?.url);

  return (
    <section
      className="relative"
      style={{
        background: "#f6f6f6",
        borderRadius: "32px 32px 0 0",
        marginTop: "-32px",
        zIndex: 1,
        paddingTop: "48px",
        paddingBottom: "80px",
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
          {/* Cover image — flush at card top */}
          {coverUrl && (
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
                className="font-sans font-normal"
                style={{
                  fontSize: "20px",
                  lineHeight: "1.4",
                  color: "#111",
                  opacity: 0.8,
                  letterSpacing: "-0.04em",
                  marginBottom: "24px",
                }}
              >
                {resource.summary}
              </p>
            )}
            <div
              className="resource-body"
              style={{
                fontFamily: "var(--font-figtree), ui-sans-serif, system-ui, sans-serif",
                fontSize: "20px",
                lineHeight: "1.4",
                color: "#111",
                letterSpacing: "-0.04em",
              }}
            >
              <RenderLexical content={resource.body} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
