import Link from "next/link";
import type { News } from "@/lib/news";
import { NewsroomCard } from "@/components/sections/newsroom/NewsroomCard";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";

interface NewsDetailRelatedProps {
  items: News[];
}

export function NewsDetailRelated({
  items,
}: NewsDetailRelatedProps): React.ReactElement | null {
  if (!items.length) return null;

  return (
    <section
      className="relative w-full overflow-hidden"
      data-section="NewsDetailRelated"
      style={{ minHeight: "580px" }}
    >
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <Reveal header className="flex items-center justify-between pt-[80px]">
          <h2 className="font-display text-display-md font-bold leading-[1.05] tracking-[-0.05em]">
            <span className="text-white">Related </span>
            <span
              style={{
                backgroundImage:
                  "linear-gradient(-44deg, #2CC1EB 0%, #9A51FF 65%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              News
            </span>
          </h2>

          <Link
            href="/news"
            className="flex items-center gap-2 group"
            aria-label="See all news"
          >
            <span className="font-display text-[clamp(1.25rem,2.2vw,2rem)] font-bold leading-none tracking-[-0.05em] text-white group-hover:text-[#2CC1EB] transition-colors duration-200">
              See All
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/blog-detail/icon-see-all-arrow.svg"
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

        {/* Below sm, a scroll-snap row lets cards peek at the right edge to hint
            scrollability; sm+ switches to a grid. */}
        <div className="flex sm:hidden overflow-x-auto snap-x snap-mandatory gap-4 mt-[40px] pb-[40px] -mx-6 pl-10 pr-6 [scroll-padding-left:2.5rem] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <div key={item.id} className="snap-start shrink-0 w-[80%] min-w-[260px] max-w-[320px]">
              <NewsroomCard item={item} />
            </div>
          ))}
        </div>
        <RevealStagger
          className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 mt-[60px] pb-[40px]"
          style={{ gap: "24px" }}
        >
          {items.map((item) => (
            <RevealItem key={item.id}>
              <NewsroomCard item={item} />
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
