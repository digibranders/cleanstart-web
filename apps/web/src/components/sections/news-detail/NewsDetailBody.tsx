import Image from "next/image";
import { isLexicalBodyEmpty, mediaUrl } from "@/lib/blog";
import { RenderLexical } from "@/lib/renderLexical";
import type { NewsDetail } from "@/lib/news";
import { formatNewsDate } from "@/lib/news";

interface NewsDetailBodyProps {
  item: NewsDetail;
}

export function NewsDetailBody({ item }: NewsDetailBodyProps): React.ReactElement {
  const logoUrl = mediaUrl(item.publisherLogo?.url);
  const heroUrl = mediaUrl(item.heroImage?.url);
  // Fall back to the abstract only when the body has no visible content, so an
  // empty-body news item still renders something below the dateline.
  const bodyEmpty = isLexicalBodyEmpty(item.body);

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

        {dateline && (
          <p
            className="font-sans font-medium leading-[1.6] mb-6"
            style={{ fontSize: "var(--fs-body-sm)", color: "rgba(17,17,17,0.6)", letterSpacing: "0.02em" }}
          >
            {dateline}
          </p>
        )}

        {bodyEmpty ? (
          item.abstract && (
            <div className="article-body">
              <p className="article-paragraph">{item.abstract}</p>
            </div>
          )
        ) : (
          <div className="article-body">
            <RenderLexical content={item.body} />
          </div>
        )}
      </div>
    </section>
  );
}
