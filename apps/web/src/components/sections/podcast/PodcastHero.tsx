import dynamic from "next/dynamic";
import {
  isHydratedEpisode,
  resolveVideoId,
  type PodcastEpisode,
  type PodcastPage,
} from "@/lib/podcast";
import { HeroReveal } from "@/components/ui/Reveal";
import { Waveform } from "./_components/Waveform";
// YouTubeEmbed wraps an <iframe>; defer it so the iframe code does not ship
// in the initial podcast client bundle and does not block first paint.
const YouTubeEmbed = dynamic(() =>
  import("./_components/YouTubeEmbed").then((m) => ({ default: m.YouTubeEmbed })),
);

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
      className="podcast-hero relative isolate"
      style={{
        marginBottom: "calc(var(--podcast-section-overlap) * -1)",
        zIndex: 1,
      }}
      aria-labelledby="podcast-hero-title"
    >
      {/* Desktop centers the card on the gradient's bottom edge (the waveform centerline).
          Mobile instead seats the waveform centerline on the card's bottom edge, so the card
          shifts up by its full height (not half) and LatestEpisodes flows naturally below. */}
      <style>{`
        .podcast-hero {
          --podcast-card-overlap: ${VIDEO_OVERLAP_PX}px;
          --podcast-section-overlap: ${VIDEO_OVERLAP_PX}px;
        }
        @media (max-width: 639px) {
          .podcast-hero {
            --podcast-card-overlap: calc((100vw - 96px) * 9 / 16);
            --podcast-section-overlap: 0px;
          }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .podcast-hero {
            --podcast-card-overlap: 240px;
            --podcast-section-overlap: 60px;
          }
        }
      `}</style>
      {/* A white blending overlay fades the gradient to pure white at its bottom edge. The
          matching overlay at the top of LatestEpisodes fades the other way, so the two
          sections meet on a continuous white band that the transparent-background embed card
          straddles — the same approach as the CTA-to-Footer overlap pattern. */}
      <div className="relative" style={{ background: HERO_GRADIENT }}>
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: "260px",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.65) 60%, #ffffff 100%)",
          }}
        />
        {/* Heading style and top spacing match the Resource Center hero for cross-page consistency. */}
        <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-[calc(clamp(72px,8vw,128px)+var(--cs-header-extra))] pb-[260px] flex flex-col items-center text-center">
          {eyebrow ? (
            <span className="text-[#cdd6ff] text-[14px] tracking-[0.18em] uppercase mb-3">
              {eyebrow}
            </span>
          ) : null}
          <HeroReveal y={50} duration={1.0}>
            <h1
              id="podcast-hero-title"
              className="font-display font-semibold text-white"
              style={{
                fontSize: "var(--fs-h1)",
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
          </HeroReveal>
          <HeroReveal y={30} delay={0.2} duration={0.8}>
            <p
              className="mt-6 font-sans font-normal text-white"
              style={{
                fontSize: "var(--fs-lead)",
                lineHeight: 1.3,
                letterSpacing: "-0.04em",
                opacity: 0.8,
                maxWidth: "674px",
              }}
            >
              {subtitle}
            </p>
          </HeroReveal>
        </div>

        <Waveform />
      </div>

      {/* The video's vertical center sits on the hero's bottom edge (the waveform centerline). */}
      <div
        className="relative z-20 mx-auto px-6"
        style={{
          maxWidth: `${VIDEO_MAX_WIDTH_PX + 48}px`,
          marginTop: "calc(var(--podcast-card-overlap) * -1)",
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
                background:
                  "linear-gradient(180deg, rgba(20,16,40,0.92) 0%, rgba(40,28,90,0.92) 100%)",
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
