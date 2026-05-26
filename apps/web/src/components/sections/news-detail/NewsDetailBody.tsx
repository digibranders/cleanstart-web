import Image from "next/image";
import { mediaUrl } from "@/lib/blog";
import { RenderLexical } from "@/lib/renderLexical";
import type { NewsDetail } from "@/lib/news";
import { formatNewsDate } from "@/lib/news";

interface NewsDetailBodyProps {
  item: NewsDetail;
}

export function NewsDetailBody({ item }: NewsDetailBodyProps): React.ReactElement {
  const logoUrl = mediaUrl(item.publisherLogo?.url);
  const heroUrl = mediaUrl(item.heroImage?.url);

  const datelinePieces: string[] = [];
  if (item.location) datelinePieces.push(item.location);
  if (item.publicationDate) datelinePieces.push(formatNewsDate(item.publicationDate));
  const dateline = datelinePieces.join(" — ");

  return (
    <section
      className="relative w-full bg-white"
      data-section="NewsDetailBody"
    >
      <div className="relative mx-auto max-w-[820px] px-6 pt-[40px] sm:pt-[64px] pb-[80px]">
        {/* Hero image — Figma 817:5939 (Newsroom Detail Mobile, image 583153).
            Sits between the dark hero meta row and the article body, with the
            full-width responsive aspect retained from the source. */}
        {heroUrl && item.heroImage?.width && item.heroImage?.height && (
          <div
            className="relative w-full overflow-hidden mb-8"
            style={{
              aspectRatio: `${item.heroImage.width} / ${item.heroImage.height}`,
              borderRadius: "20px",
              background: "rgba(0,0,0,0.05)",
            }}
          >
            <Image
              src={heroUrl}
              alt={item.heroImage.alt ?? item.title}
              fill
              sizes="(max-width: 820px) 100vw, 820px"
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Publisher logo card */}
        {logoUrl && (
          <div
            className="relative flex items-center justify-center overflow-hidden mb-10"
            style={{
              minHeight: "200px",
              borderRadius: "20px",
              background: "linear-gradient(180deg, #F5F0FF 0%, #FFFFFF 100%)",
              boxShadow:
                "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt={item.publisher ?? item.title}
              className="object-contain pointer-events-none select-none"
              style={{ maxHeight: "120px", maxWidth: "60%" }}
              loading="eager"
              decoding="async"
            />
          </div>
        )}

        {/* Dateline */}
        {dateline && (
          <p
            className="font-sans text-[15px] font-medium leading-[1.6] mb-6"
            style={{ color: "rgba(17,17,17,0.6)", letterSpacing: "0.02em" }}
          >
            {dateline} —{" "}
            <span style={{ color: "rgba(17,17,17,0.85)", fontWeight: 400 }}>
              {item.abstract}
            </span>
          </p>
        )}

        {/* Body */}
        <div className="article-body">
          <RenderLexical content={item.body} />
        </div>
      </div>
    </section>
  );
}
