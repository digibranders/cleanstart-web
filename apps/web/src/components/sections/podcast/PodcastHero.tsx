import dynamic from "next/dynamic";
import {
  isHydratedEpisode,
  resolveVideoId,
  type PodcastEpisode,
  type PodcastPage,
} from "@/lib/podcast";
import { Waveform } from "./_components/Waveform";
// YouTubeEmbed wraps an <iframe>; defer it so the iframe code does not ship
// in the initial podcast client bundle and does not block first paint.
const YouTubeEmbed = dynamic(() =>
  import("./_components/YouTubeEmbed").then((m) => ({ default: m.YouTubeEmbed })),
);

// Exact Figma gradient (node 373:2909).
const HERO_GRADIENT =
  "linear-gradient(179.997deg, rgb(21, 16, 33) 25.702%, rgb(16, 18, 62) 31.159%, rgb(19, 30, 143) 51.006%, rgb(71, 30, 192) 68.711%, rgb(71, 31, 195) 79.832%, rgba(70, 30, 191, 0.85) 85.018%, rgba(66, 30, 188, 0.4) 93.72%, rgba(66, 30, 188, 0) 100.66%)";

const VIDEO_MAX_WIDTH_PX = 720;
const VIDEO_HEIGHT_PX = Math.round(VIDEO_MAX_WIDTH_PX * (9 / 16));
const VIDEO_OVERLAP_PX = Math.round(VIDEO_HEIGHT_PX / 2);

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
      className="relative isolate"
      style={{ marginBottom: `-${VIDEO_OVERLAP_PX}px`, zIndex: 1 }}
      aria-labelledby="podcast-hero-title"
    >
      {/* Hero gradient region (Figma gradient) with a white blending overlay near the
          bottom edge. The same overlay continues at the top of LatestEpisodes (fading the
          other way), so where the two sections meet they are both pure white — the embed
          card straddles that white band with a transparent background, exactly like the
          CTA → Footer overlap pattern. */}
      <div className="relative" style={{ background: HERO_GRADIENT }}>
        {/* White blending overlay — transparent at top, solid white at the bottom edge */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: "260px",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.65) 60%, #ffffff 100%)",
          }}
        />
        {/* Text content — heading style + top-spacing aligned with Resource Center hero
            for cross-page consistency. */}
        <div className="relative mx-auto max-w-[var(--container-default)] px-6 pt-[120px] lg:pt-[158px] pb-[260px] flex flex-col items-center text-center">
          {eyebrow ? (
            <span className="text-[#cdd6ff] text-[14px] tracking-[0.18em] uppercase mb-3">
              {eyebrow}
            </span>
          ) : null}
          <h1
            id="podcast-hero-title"
            className="font-display font-semibold text-white"
            style={{
              fontSize: "var(--text-hero-utility)",
              lineHeight: "var(--text-hero-lh)",
              letterSpacing: "var(--text-hero-utility-ls)",
            }}
          >
            {before}
            <span
              className="bg-clip-text"
              style={{
                WebkitTextFillColor: "transparent",
                backgroundImage:
                  "linear-gradient(105.93deg, #9a51ff 1.76%, #2cc1eb 98.78%)",
              }}
            >
              {mark}
            </span>
            {after}
          </h1>
          <p
            className="mt-6 font-sans font-normal text-white"
            style={{
              fontSize: "clamp(1rem, 1.25vw, 1.5rem)",
              lineHeight: 1.3,
              letterSpacing: "-0.04em",
              opacity: 0.8,
              maxWidth: "674px",
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Animated CSS waveform — vertically centered on the gradient region's bottom
            edge, edge-to-edge. Bars pulse on a staggered animation-delay so a wave
            visibly travels across the section. Honors prefers-reduced-motion. */}
        <Waveform />
      </div>

      {/* Video — vertical center sits at the hero's bottom edge (= waveform centerline) */}
      <div
        className="relative z-20 mx-auto px-6"
        style={{
          maxWidth: `${VIDEO_MAX_WIDTH_PX + 48}px`,
          marginTop: `-${VIDEO_OVERLAP_PX}px`,
        }}
      >
        <div className="mx-auto w-full" style={{ maxWidth: `${VIDEO_MAX_WIDTH_PX}px` }}>
          {heroVideoId && heroEpisode ? (
            <YouTubeEmbed
              videoId={heroVideoId}
              title={heroEpisode.title}
              thumbnailUrl={heroEpisode.thumbnailOverride?.url ?? null}
              rounded="16px"
              className="ring-1 ring-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
            />
          ) : (
            <div
              className="flex items-center justify-center text-white/60"
              style={{
                aspectRatio: "16 / 9",
                borderRadius: "16px",
                border: "1px dashed rgba(255,255,255,0.25)",
                background: "rgba(0,0,0,0.25)",
              }}
            >
              <span className="text-sm">
                Set a featured hero episode in the Podcast page global.
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
