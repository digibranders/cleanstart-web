import Link from "next/link";
import { Container } from "@/components/layout";
import type { TopicCount } from "@/lib/videos-utils";
import { VideoThumb } from "./VideoThumb";

interface VideosTopicsProps {
  topics: readonly TopicCount[];
}

/** Plain links, so every topic view is crawlable and works before JavaScript loads. */
export function VideosTopics({ topics }: VideosTopicsProps): React.ReactElement | null {
  if (topics.length === 0) return null;
  return (
    <section aria-labelledby="videos-topics-title" className="bg-[#F4F2FC] py-[var(--spacing-section-md)]">
      <Container>
        <h2
          id="videos-topics-title"
          className="font-display font-semibold text-[#12101C]"
          style={{ fontSize: "var(--fs-h2)", lineHeight: "var(--fs-h2-lh)", letterSpacing: "var(--fs-h2-ls)" }}
        >
          Browse by topic
        </h2>
        <p className="mt-3 max-w-[560px] font-sans text-[#4A4760]" style={{ fontSize: "var(--fs-body)" }}>
          Each topic collects the explainers, demos and talks that cover it.
        </p>
        <ul className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {topics.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/videos?topic=${t.slug}#library`}
                className="group grid min-h-[72px] grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-[16px] border border-[rgba(18,16,28,0.1)] bg-white p-2.5 pr-[18px] transition-[border-color,box-shadow] duration-200 hover:border-[#5B2EE0] hover:shadow-[0_10px_28px_rgba(40,24,120,0.10)] motion-reduce:transition-none"
              >
                <span className="relative aspect-video overflow-hidden rounded-[8px] bg-[#E9E6F5]">
                  <VideoThumb video={t.sample} sizes="64px" />
                </span>
                <span className="font-sans text-[15px] font-medium text-[#12101C]">
                  {t.label}{" "}
                  <span className="font-normal text-[#6E6A82]">({t.count})</span>
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="text-[#6E6A82] transition-transform duration-200 group-hover:translate-x-[3px] group-hover:text-[#5B2EE0] motion-reduce:transition-none"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
