import dynamic from "next/dynamic";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { formatEpisodeNumber, type PodcastEpisode, resolveVideoId } from "@/lib/podcast";
const YouTubeEmbed = dynamic(() =>
  import("./YouTubeEmbed").then((m) => ({ default: m.YouTubeEmbed })),
);

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

  const thumb = episode.thumbnailOverride?.url ?? null;

  if (size === "featured") {
    // Featured card — Figma node 373:3286/3304: 1.5px solid #076eff border, 20px radius.
    return (
      <article className="group flex flex-col w-full">
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: "20px",
            border: "1.5px solid #076eff",
            boxShadow: "0 24px 60px rgba(8,10,40,0.45)",
          }}
        >
          <YouTubeEmbed
            videoId={videoId}
            title={episode.title}
            thumbnailUrl={thumb}
            rounded="18.5px"
            className=""
          />
        </div>
        <h3
          id={`episode-${episode.slug}`}
          className="mt-4 text-white font-semibold text-[20px] leading-snug"
        >
          {episode.title}
        </h3>
      </article>
    );
  }

  // Listing card — exact Figma spec (node 373:3163):
  // 404x306 white container, 8px radius, soft layered shadow,
  // 380x200 thumbnail, episode chip with #4a3bf1 text + 3px blue underline-shadow,
  // 24px Figtree Medium title.
  return (
    <article
      className="relative flex flex-col w-full bg-white"
      style={{
        borderRadius: "8px",
        boxShadow:
          "0 3px 7px rgba(0,0,0,0.02), 0 13px 13px rgba(0,0,0,0.01), 0 29px 17px rgba(0,0,0,0.01)",
        padding: "12px",
      }}
    >
      {/* Thumbnail wrapper — relative so we can anchor the badge to its own bottom edge
          (overflow stays visible so the badge can extend slightly below the thumbnail
          like in the Figma reference). The embed handles its own corner rounding. */}
      <div className="relative">
        <YouTubeEmbed
          videoId={videoId}
          title={episode.title}
          thumbnailUrl={thumb}
          rounded="16px"
          className="shadow-[0_4px_8px_-4px_rgba(22,34,51,0.08),0_16px_24px_rgba(22,34,51,0.08)]"
        />
        <div
          className="absolute z-10"
          style={{ left: "20px", bottom: "-12px" }}
        >
          <CategoryBadge label={formatEpisodeNumber(episode.episodeNumber)} />
        </div>
      </div>
      <h3
        id={`episode-${episode.slug}`}
        className="text-[#111111]"
        style={{
          fontFamily: "Figtree, sans-serif",
          fontWeight: 500,
          fontSize: "24px",
          lineHeight: 1.3,
          letterSpacing: "-0.01em",
          marginTop: "32px",
          paddingLeft: "20px",
          paddingRight: "20px",
          paddingBottom: "12px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {episode.title}
      </h3>
    </article>
  );
}
