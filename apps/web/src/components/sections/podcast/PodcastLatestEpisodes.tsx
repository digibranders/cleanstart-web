import type { PodcastEpisode } from "@/lib/podcast";
import { PodcastEpisodeCard } from "./_components/PodcastEpisodeCard";

type Props = {
  title: string;
  episodes: PodcastEpisode[];
};

export function PodcastLatestEpisodes({
  title,
  episodes,
}: Props): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "#f6f6f6" }}
      aria-labelledby="podcast-latest-title"
    >
      {/* White blending overlay at the top — pure white at the very top edge fading down
          to transparent so the section's #f6f6f6 resumes. Paired with the hero's matching
          bottom overlay, the two sections meet on a continuous white band that the embed
          card (with its transparent bg) straddles seamlessly. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: "260px",
          background:
            "linear-gradient(180deg, #ffffff 0%, rgba(246,246,246,0.65) 55%, rgba(246,246,246,0) 100%)",
        }}
      />
      {/* Subtle grid pattern */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.05) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 40%, #000 40%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 40%, #000 40%, transparent 80%)",
        }}
      />
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-[260px] pb-[160px]">
        <h2
          id="podcast-latest-title"
          className="text-left text-[#111111] font-bold"
          style={{
            fontSize: "clamp(2rem, 3.6vw, 3.25rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h2>
        {episodes.length === 0 ? (
          <p className="mt-10 text-[#475569]">New episodes coming soon.</p>
        ) : (
          <div className="mt-[44px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-[32px] gap-y-[32px]">
            {episodes.map((ep) => (
              <PodcastEpisodeCard key={ep.id} episode={ep} size="card" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
