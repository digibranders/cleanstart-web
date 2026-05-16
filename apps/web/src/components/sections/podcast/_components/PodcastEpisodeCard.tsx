import { formatEpisodeNumber, type PodcastEpisode, resolveVideoId } from "@/lib/podcast";
import { YouTubeEmbed } from "./YouTubeEmbed";

type Size = "card" | "featured";

type Props = {
  episode: PodcastEpisode;
  size?: Size;
};

export function PodcastEpisodeCard({
  episode,
  size = "card",
}: Props): React.ReactElement | null {
  const videoId = resolveVideoId(episode);
  if (!videoId) return null;

  const rounded = size === "featured" ? "20px" : "16px";
  const thumb = episode.thumbnailOverride?.url ?? null;

  return (
    <article className="group flex flex-col w-full">
      <div className="relative">
        <YouTubeEmbed
          videoId={videoId}
          title={episode.title}
          thumbnailUrl={thumb}
          rounded={rounded}
          className={
            size === "featured"
              ? "shadow-[0_24px_60px_rgba(8,10,40,0.45)]"
              : "shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
          }
        />
        <span
          className="absolute left-3 bottom-3 inline-flex items-center text-white font-medium"
          style={{
            padding: "4px 10px",
            borderRadius: "9999px",
            fontSize: "12px",
            lineHeight: 1.2,
            background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
            boxShadow: "0 6px 14px rgba(0, 91, 227, 0.35)",
          }}
        >
          {formatEpisodeNumber(episode.episodeNumber)}
        </span>
      </div>
      <h3
        id={`episode-${episode.slug}`}
        className={
          size === "featured"
            ? "mt-4 text-white font-semibold text-[20px] leading-snug"
            : "mt-3 text-[#0b0c1a] font-semibold text-[18px] leading-snug"
        }
      >
        {episode.title}
      </h3>
    </article>
  );
}
