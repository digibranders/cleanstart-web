import {
  isHydratedEpisode,
  resolveVideoId,
  type PodcastEpisode,
  type PodcastPage,
} from "@/lib/podcast";
import { YouTubeEmbed } from "./_components/YouTubeEmbed";

const HERO_GRADIENT =
  "linear-gradient(180deg, #151021 0%, #221a4a 35%, #2a2dad 70%, #3d2ad1 100%)";

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

type Props = {
  page: PodcastPage | null;
  featuredHero: PodcastEpisode | null;
};

export function PodcastHero({ page, featuredHero }: Props): React.ReactElement {
  const title = page?.heroTitle ?? "Leadership Exchange";
  const highlight = page?.heroTitleHighlight ?? "Exchange";
  const subtitle =
    page?.heroSubtitle ??
    "Where industry leaders decode container security and define the future of the software supply chain.";
  const eyebrow = page?.heroEyebrow ?? null;

  const heroEpisode =
    featuredHero ??
    (page && isHydratedEpisode(page.featuredHeroEpisode)
      ? page.featuredHeroEpisode
      : null);
  const heroVideoId = heroEpisode ? resolveVideoId(heroEpisode) : null;

  const [before, mark, after] = splitHighlight(title, highlight);

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: HERO_GRADIENT }}
      aria-labelledby="podcast-hero-title"
    >
      {/* Waveform decoration — left side */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          left: "-40px",
          top: "180px",
          width: "780px",
          height: "120px",
          opacity: 0.55,
          mixBlendMode: "screen",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 780 120"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <title>waveform</title>
          {Array.from({ length: 60 }).map((_, i) => {
            const x = i * 13;
            const h = 8 + Math.abs(Math.sin(i * 0.7)) * 90;
            return (
              <rect
                key={`wl-${i}`}
                x={x}
                y={(120 - h) / 2}
                width="3"
                height={h}
                rx="1.5"
                fill="#9ec5ff"
                opacity={0.4 + (Math.sin(i * 0.5) + 1) * 0.25}
              />
            );
          })}
        </svg>
      </div>
      {/* Waveform decoration — right side */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          right: "-40px",
          top: "180px",
          width: "780px",
          height: "120px",
          opacity: 0.55,
          mixBlendMode: "screen",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 780 120"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <title>waveform</title>
          {Array.from({ length: 60 }).map((_, i) => {
            const x = i * 13;
            const h = 8 + Math.abs(Math.sin((i + 7) * 0.6)) * 90;
            return (
              <rect
                key={`wr-${i}`}
                x={x}
                y={(120 - h) / 2}
                width="3"
                height={h}
                rx="1.5"
                fill="#9ec5ff"
                opacity={0.4 + (Math.cos(i * 0.4) + 1) * 0.25}
              />
            );
          })}
        </svg>
      </div>

      <div className="relative mx-auto max-w-[1276px] px-6 pt-[88px] pb-[88px] flex flex-col items-center text-center">
        {eyebrow ? (
          <span className="text-[#cdd6ff] text-[14px] tracking-[0.18em] uppercase mb-3">
            {eyebrow}
          </span>
        ) : null}
        <h1
          id="podcast-hero-title"
          className="text-white font-semibold leading-[1.1] tracking-[-0.02em]"
          style={{ fontSize: "clamp(2.25rem, 4.6vw, 3.75rem)" }}
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
        </h1>
        <p
          className="mt-5 max-w-[640px] text-[#cdd6ff]"
          style={{
            fontSize: "clamp(0.95rem, 1.1vw, 1.0625rem)",
            lineHeight: 1.55,
          }}
        >
          {subtitle}
        </p>

        {heroVideoId && heroEpisode ? (
          <div
            className="mt-10 w-full"
            style={{ maxWidth: "720px" }}
          >
            <YouTubeEmbed
              videoId={heroVideoId}
              title={heroEpisode.title}
              thumbnailUrl={heroEpisode.thumbnailOverride?.url ?? null}
              rounded="16px"
              className="ring-1 ring-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
            />
          </div>
        ) : (
          <div
            className="mt-10 w-full flex items-center justify-center text-white/60"
            style={{
              maxWidth: "720px",
              aspectRatio: "16 / 9",
              borderRadius: "16px",
              border: "1px dashed rgba(255,255,255,0.25)",
            }}
          >
            <span className="text-sm">
              Set a featured hero episode in the Podcast page global.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
