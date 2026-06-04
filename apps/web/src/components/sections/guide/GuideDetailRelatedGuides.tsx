import Link from "next/link";
import Image from "next/image";
import { formatGuideDate, guideMediaUrl } from "@/lib/guides";
import type { Guide } from "@/lib/guides";
import { effectivePublishedAt } from "@/lib/published-date";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";

interface GuideDetailRelatedGuidesProps {
  guides: Guide[];
}

export function GuideDetailRelatedGuides({
  guides,
}: GuideDetailRelatedGuidesProps): React.ReactElement | null {
  if (!guides.length) return null;

  return (
    <section
      className="relative w-full overflow-hidden"
      data-section="GuideDetailRelatedGuides"
      style={{ minHeight: "580px" }}
    >
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <Reveal header className="flex items-center justify-between pt-[60px]">
          <h2 className="font-display text-display-md font-bold leading-[1.05] tracking-[-0.05em]">
            <span className="text-white">Related </span>
            <span
              style={{
                backgroundImage: "linear-gradient(-44deg, #2CC1EB 0%, #9A51FF 65%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Guides
            </span>
          </h2>

          <Link
            href="/guide"
            className="flex items-center gap-2 group"
            aria-label="See all guides"
          >
            <span
              className="font-display font-bold leading-none tracking-[-0.05em] text-white group-hover:text-[#2CC1EB] transition-colors duration-200"
              style={{ fontSize: "var(--fs-h3)" }}
            >
              See All
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/guide-detail/icon-see-all-arrow.svg"
              alt=""
              aria-hidden
              width={40}
              height={40}
              className="w-10 h-10 group-hover:translate-x-1 transition-transform duration-200"
              loading="lazy"
              decoding="async"
            />
          </Link>
        </Reveal>

        {/* Below md the row scrolls horizontally with snap points; the negative
            -mx-6 + px lets the first card align with the heading above. */}
        <div
          className="flex md:hidden overflow-x-auto snap-x snap-mandatory gap-4 mt-[40px] -mx-6 pl-10 pr-6 pb-2 [scroll-padding-left:2.5rem] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {guides.map((guide) => (
            <div key={guide.id} className="snap-start shrink-0 w-[80%] min-w-[260px] max-w-[320px]">
              <RelatedGuideCard guide={guide} />
            </div>
          ))}
        </div>
        <RevealStagger className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-8 mt-[60px]">
          {guides.map((guide) => (
            <RevealItem key={guide.id}>
              <RelatedGuideCard guide={guide} />
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}

function RelatedGuideCard({ guide }: { guide: Guide }): React.ReactElement {
  return (
    <article
      className="relative overflow-hidden flex flex-col h-full"
      style={{
        background: "#fff",
        borderRadius: "32px",
        boxShadow: "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01), 0px 52px 21px 0px rgba(0,0,0,0), 0px 81px 23px 0px rgba(0,0,0,0)",
      }}
    >
      <div className="relative shrink-0 mx-3 mt-3 rounded-[20px] md:rounded-[24px] overflow-hidden h-[150px] md:h-[200px]">
        {guide.heroImage ? (
          <Image
            src={guideMediaUrl(guide.heroImage.url)!}
            alt={guide.heroImage.alt ?? guide.title}
            fill
            sizes="(min-width: 1280px) 380px, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: "linear-gradient(135deg, #131e8f 0%, #471ec0 100%)" }}
          />
        )}
      </div>

      <div className="flex flex-col gap-2.5 md:gap-[12px] p-5 md:p-[32px] flex-1">
        <div className="flex items-center gap-3 md:gap-4">
          {(() => {
            const displayDate = effectivePublishedAt(guide);
            if (!displayDate) return null;
            return (
              <div className="flex items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/guides/icon-calendar-grey.svg" alt="" aria-hidden width={18} height={18} className="shrink-0 w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
                <span className="font-medium leading-normal whitespace-nowrap" style={{ fontSize: "var(--fs-body-sm)", color: "#666" }}>
                  {formatGuideDate(displayDate)}
                </span>
              </div>
            );
          })()}
          {guide.readingMinutes != null && (
            <div className="flex items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/guides/icon-clock-grey.svg" alt="" aria-hidden width={18} height={18} className="shrink-0 w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
              <span className="font-medium leading-normal whitespace-nowrap" style={{ fontSize: "var(--fs-caption)", color: "#666" }}>
                {guide.readingMinutes} min read
              </span>
            </div>
          )}
        </div>

        <h3
          className="line-clamp-2 md:line-clamp-3 flex-1 font-display text-card-title-md font-medium leading-[1.3]"
          style={{ color: "#111" }}
        >
          {guide.title}
        </h3>

        {guide.abstract && (
          <p
            className="line-clamp-3 text-body-md font-normal leading-[1.3]"
            style={{ color: "rgba(17,17,17,0.54)" }}
          >
            {guide.abstract}
          </p>
        )}

        <Link
          href={`/guide/${guide.slug}`}
          aria-label={`Read ${guide.title}`}
          className="group inline-flex items-center gap-2 mt-auto pt-2 self-start"
        >
          <span
            className="text-body-lg font-medium leading-[1.5] group-hover:text-[#3928e0] transition-colors duration-200"
            style={{ color: "#4a3bf1" }}
          >
            Read more
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/guides/icon-arrow-read-more.svg"
            alt=""
            aria-hidden
            width={24}
            height={24}
            className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-200"
            loading="lazy"
            decoding="async"
          />
        </Link>
      </div>
    </article>
  );
}
