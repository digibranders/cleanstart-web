import type { PodcastEpisode } from "@/lib/podcast";
import { PodcastEpisodeCard } from "./_components/PodcastEpisodeCard";

const FEATURED_GRADIENT =
  "linear-gradient(180deg, #1a134d 0%, #2a1f8a 45%, #3924b8 80%, #4422c9 100%)";

function splitHighlight(title: string, highlight: string): [string, string, string] {
  if (!highlight) return [title, "", ""];
  const idx = title.indexOf(highlight);
  if (idx === -1) return [title, "", ""];
  return [
    title.slice(0, idx),
    title.slice(idx, idx + highlight.length),
    title.slice(idx + highlight.length),
  ];
}

function Cube({ side }: { side: "left" | "right" }): React.ReactElement {
  return (
    <div
      aria-hidden
      className="pointer-events-none select-none absolute hidden lg:block"
      style={{
        [side]: "-40px",
        top: "50%",
        transform: "translateY(-50%)",
        width: "260px",
        height: "260px",
        opacity: 0.35,
      }}
    >
      <svg viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg">
        <title>Isometric cube decoration</title>
        <g stroke="#7e8bff" strokeWidth="1.2" opacity="0.8">
          <path d="M130 30 L230 90 L230 210 L130 270 L30 210 L30 90 Z" />
          <path d="M130 30 L130 150 L30 210" />
          <path d="M130 150 L230 210" />
          <path d="M70 65 L170 125 L170 245 L70 185 Z" />
          <path d="M70 65 L70 185" />
          <path d="M170 125 L190 113" />
        </g>
      </svg>
    </div>
  );
}

type Props = {
  title: string;
  highlight: string;
  episodes: PodcastEpisode[];
};

export function PodcastFeaturedContent({
  title,
  highlight,
  episodes,
}: Props): React.ReactElement | null {
  if (episodes.length === 0) return null;
  const [before, mark, after] = splitHighlight(title, highlight);

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: FEATURED_GRADIENT }}
      aria-labelledby="podcast-featured-title"
    >
      <Cube side="left" />
      <Cube side="right" />
      <div className="relative mx-auto max-w-[1276px] px-6 pt-[80px] pb-[80px]">
        <h2
          id="podcast-featured-title"
          className="text-center text-white font-semibold tracking-[-0.02em]"
          style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}
        >
          {before}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(180deg, #6cb6ff 0%, #239cff 55%, #005be3 100%)",
            }}
          >
            {mark}
          </span>
          {after}
        </h2>
        <div
          className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-[32px]"
          style={{ maxWidth: "1040px", marginInline: "auto" }}
        >
          {episodes.map((ep) => (
            <PodcastEpisodeCard key={ep.id} episode={ep} size="featured" />
          ))}
        </div>
      </div>
    </section>
  );
}
