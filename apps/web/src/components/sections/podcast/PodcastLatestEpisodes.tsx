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
      <div className="relative mx-auto max-w-[1276px] px-6 pt-[80px] pb-[250px]">
        <h2
          id="podcast-latest-title"
          className="text-center text-[#0b0c1a] font-semibold tracking-[-0.02em]"
          style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}
        >
          {title}
        </h2>
        {episodes.length === 0 ? (
          <p className="mt-10 text-center text-[#475569]">
            New episodes coming soon.
          </p>
        ) : (
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-[24px] gap-y-[32px]">
            {episodes.map((ep) => (
              <PodcastEpisodeCard key={ep.id} episode={ep} size="card" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
