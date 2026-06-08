import type { PodcastEpisode } from "@/lib/podcast";
import { EmptyState } from "@/components/feedback";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";
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
      {/* Top overlay fades from pure white down to transparent so the section's #f6f6f6 resumes.
          Paired with the hero's matching bottom overlay, the two sections meet on a continuous
          white band that the transparent-background embed card straddles seamlessly. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: "260px",
          background:
            "linear-gradient(180deg, #ffffff 0%, rgba(246,246,246,0.65) 55%, rgba(246,246,246,0) 100%)",
        }}
      />
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
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-[80px] sm:pt-[180px] lg:pt-[260px] pb-[80px] sm:pb-[120px] lg:pb-[160px]">
        <Reveal header>
          <h2
            id="podcast-latest-title"
            className="text-left text-[#111111] font-bold"
            style={{
              fontSize: "var(--fs-h2)",
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            {title}
          </h2>
        </Reveal>
        {episodes.length === 0 ? (
          <EmptyState
            variant="empty"
            title="No episodes yet"
            description="New episodes are coming soon. Check back shortly."
          />
        ) : (
          <RevealStagger className="mt-[44px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-[32px] gap-y-[32px]">
            {episodes.map((ep) => (
              <RevealItem key={ep.id}>
                <PodcastEpisodeCard episode={ep} size="card" />
              </RevealItem>
            ))}
          </RevealStagger>
        )}
      </div>
    </section>
  );
}
