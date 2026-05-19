import {
  isHydratedEpisode,
  resolveVideoId,
  type PodcastEpisode,
  type PodcastPage,
} from "@/lib/podcast";
import { YouTubeEmbed } from "./_components/YouTubeEmbed";

const HERO_GRADIENT =
  "linear-gradient(179.997deg, #151021 25.7%, #10123e 31.16%, #131e8f 51%, #471ec0 68.71%, #471fc3 79.83%, rgba(70, 30, 191, 0.85) 85%, rgba(66, 30, 188, 0.4) 93.72%, rgba(66, 30, 188, 0) 100.66%)";

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
    <section className="relative" aria-labelledby="podcast-hero-title">
      {/* Hero gradient region — overflow visible so waveform can extend past bottom edge */}
      <div className="relative" style={{ background: HERO_GRADIENT }}>
        {/* White fade overlay at the bottom of the gradient */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: "55%",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.9) 100%)",
          }}
        />

        {/* Text content */}
        <div className="relative mx-auto max-w-[1276px] px-6 pt-[72px] pb-[260px] flex flex-col items-center text-center">
          {eyebrow ? (
            <span className="text-[#cdd6ff] text-[14px] tracking-[0.18em] uppercase mb-3">
              {eyebrow}
            </span>
          ) : null}
          <h1
            id="podcast-hero-title"
            className="text-white font-semibold leading-[1.05] tracking-[-0.02em]"
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
        </div>

        {/* Soundwave — edge-to-edge, vertically centered on the gradient region's bottom edge.
            Use the PNG as a CSS mask and fill with a gradient so the bars are visible on both
            the dark hero (top half) and the white area below (bottom half). */}
        <div
          aria-hidden
          className="absolute inset-x-0 pointer-events-none select-none"
          style={{
            bottom: 0,
            transform: "translateY(50%)",
            height: "180px",
            WebkitMaskImage: "url(/images/podcast/hero-waveform.png)",
            maskImage: "url(/images/podcast/hero-waveform.png)",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            background:
              "linear-gradient(180deg, #a8c0ff 0%, #6d8dff 35%, #5a3df0 55%, #4316b8 75%, #1f0d6e 100%)",
            opacity: 1,
          }}
        />
        {/* Hidden preloader so Next can hint and the asset is cached. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/podcast/hero-waveform.png"
          alt=""
          aria-hidden
          className="hidden"
          loading="lazy"
          decoding="async"
        />
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
