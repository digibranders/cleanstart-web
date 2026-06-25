/**
 * CSS reproduction of the `/guide-cover/[slug]` brand cover, rendered inline in
 * the card instead of fetching a satori-generated PNG through the image
 * optimizer. ~50 of 51 guides have no real hero image, so this paints the
 * listing/related covers instantly with zero image requests.
 *
 * Geometry mirrors the 1200×630 `next/og` route 1:1, expressed in container
 * units (`cqw` = 1% of the cover's inline size, i.e. original-px ÷ 12) so it
 * scales to the small card exactly like the downscaled PNG did. The parent must
 * be `position: relative`; the cover fills it. Decorative — the card already
 * carries the title in its heading, so the whole cover is aria-hidden.
 *
 * The 1200×630 `/guide-cover/[slug]` route still exists as a standalone OG-sized
 * image endpoint (not currently wired into guide OG metadata); this component is
 * its on-page equivalent for the cards.
 */

function Mark({ style }: { style?: React.CSSProperties }): React.ReactElement {
  // Inlined logo-cleanstart-mark.svg (white), so the cover ships no extra request.
  return (
    <svg
      viewBox="0 0 27.7958 31.9969"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      aria-hidden
    >
      <path
        d="M24.2359 10.3234V22.0554L15.709 27.1983V15.2722L12.3945 17.1973L12.4877 17.2505V31.1486L13.898 31.9969L27.7958 23.8114V8.32319L27.7368 8.28876L24.2359 10.3234Z"
        fill="#ffffff"
      />
      <path
        d="M15.7088 15.219L5.10062 8.92732L14.0283 3.991L24.2326 9.87577V10.3203L27.7335 8.28563L13.8295 0L0 8.32006V23.6079L3.22439 25.5518V11.7695L12.3943 17.1942L15.7088 15.2691V15.219Z"
        fill="#ffffff"
      />
    </svg>
  );
}

interface GeneratedGuideCoverProps {
  /** Topic phrase from `deriveCoverKeyword(title)`. */
  keyword: string;
}

export function GeneratedGuideCover({
  keyword,
}: GeneratedGuideCoverProps): React.ReactElement {
  return (
    // Outer element establishes the container so children's `cqw` resolve
    // against the cover's own width (cq units reference an ancestor, not self).
    <div
      aria-hidden
      className="select-none"
      style={{ position: "absolute", inset: 0, containerType: "inline-size" }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "6cqw",
          color: "#ffffff",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #0b0f2e 0%, #1a1a4e 36%, #2d1b9e 72%, #471ec0 100%)",
        }}
      >
        {/* dot-grid texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.07,
            backgroundImage:
              "radial-gradient(circle, #ffffff 0.8px, transparent 0.9px)",
            backgroundSize: "2.83cqw 2.83cqw",
          }}
        />
        {/* soft glow */}
        <div
          style={{
            position: "absolute",
            top: "-15cqw",
            left: "-11.67cqw",
            width: "56.67cqw",
            height: "56.67cqw",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124,91,255,0.45) 0%, rgba(124,91,255,0) 70%)",
          }}
        />
        {/* crystal-mark watermark */}
        <Mark
          style={{
            position: "absolute",
            right: "-5.83cqw",
            bottom: "-10.83cqw",
            width: "45cqw",
            height: "45cqw",
            opacity: 0.12,
          }}
        />

        {/* eyebrow — the real navbar CleanStart logo + a GUIDE label */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "2.5cqw", position: "relative" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cleanstart-logo.png"
            alt=""
            aria-hidden
            className="select-none"
            style={{ height: "4.5cqw", width: "auto" }}
            loading="lazy"
            decoding="async"
          />
          <span
            style={{
              fontSize: "2cqw",
              fontWeight: 700,
              letterSpacing: "0.5cqw",
              textTransform: "uppercase",
              color: "#c9c3ff",
              whiteSpace: "nowrap",
            }}
          >
            Guide
          </span>
        </div>

        {/* keyword */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: "6cqw",
              height: "0.5cqw",
              borderRadius: "0.25cqw",
              background: "#7c5bff",
              marginBottom: "2.5cqw",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "6cqw",
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: "-0.14cqw",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              overflowWrap: "anywhere",
            }}
          >
            {keyword}
          </span>
        </div>

        {/* footer */}
        <span
          style={{
            position: "relative",
            fontSize: "2.17cqw",
            fontWeight: 600,
            color: "#a99cff",
          }}
        >
          cleanstart.com
        </span>
      </div>
    </div>
  );
}
