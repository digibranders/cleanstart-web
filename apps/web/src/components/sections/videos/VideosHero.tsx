import Link from "next/link";
import { HeroReveal } from "@/components/ui/Reveal";
import { CLEANSTART_YOUTUBE_SUBSCRIBE_URL } from "@/lib/youtube-feed";
import { videoPath, type Video } from "@/lib/videos-utils";
import { VideoMeta } from "./VideoMeta";
import { VideoPlayer } from "./VideoPlayer";

// Fades to transparent at the foot so the band does not cut a hard line where it
// meets the white filter bar. Same tail as the demo and thank-you heroes.
const HERO_GRADIENT =
  "linear-gradient(180deg, rgba(21, 16, 33, 1) 0%, rgba(16, 18, 62, 1) 28%, rgba(19, 30, 143, 1) 52%, rgba(71, 30, 192, 1) 74%, rgba(71, 31, 195, 1) 84%, rgba(70, 30, 191, 0.85) 90%, rgba(66, 30, 188, 0.4) 96%, rgba(66, 30, 188, 0) 100%)";

export const VIDEOS_TITLE = "CleanStart Videos";
export const VIDEOS_DESCRIPTION =
  "Explainers, product demos and talks from CleanStart on container security, SBOMs, VEX, provenance and the software supply chain.";

interface VideosHeroProps {
  /** Newest video; plays right here so a visitor can start watching with one click. */
  featured: Video | null;
}

export function VideosHero({ featured }: VideosHeroProps): React.ReactElement {
  return (
    <section
      className="relative isolate overflow-hidden"
      aria-labelledby="videos-hero-title"
    >
      <div aria-hidden className="absolute inset-0" style={{ background: HERO_GRADIENT }} />
      {/* The asset carries its own edge fade; see ThankYouContent for why it is not CSS-tiled. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/cleanstart-images/hero-vector-grid.svg"
        alt=""
        aria-hidden
        decoding="async"
        className="pointer-events-none absolute inset-x-0 top-0 w-full select-none"
        style={{ aspectRatio: "730 / 708", height: "auto", minHeight: "100%", opacity: 0.3 }}
      />

      <div className="relative mx-auto grid w-full max-w-[var(--container-default)] items-center gap-12 px-6 pb-[clamp(72px,9vw,128px)] pt-[calc(var(--cs-header-h)+clamp(24px,3.5vw,64px)+var(--cs-header-extra))] sm:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="flex flex-col items-start gap-6">
          <HeroReveal y={50} duration={1.0} lcp>
            <h1
              id="videos-hero-title"
              className="font-display font-semibold text-white"
              style={{
                fontSize: "var(--fs-h1)",
                lineHeight: "var(--text-hero-lh)",
                letterSpacing: "var(--text-hero-utility-ls)",
              }}
            >
              {VIDEOS_TITLE}
            </h1>
          </HeroReveal>
          <HeroReveal y={30} delay={0.2} duration={0.8}>
            <p
              className="max-w-[520px] font-sans font-normal text-white"
              style={{
                fontSize: "var(--fs-lead)",
                lineHeight: 1.4,
                letterSpacing: "-0.03em",
                opacity: 0.85,
                textWrap: "balance",
              }}
            >
              Explainers, product demos and talks on container security and the software supply
              chain.
            </p>
          </HeroReveal>
          <HeroReveal y={20} delay={0.35} duration={0.7}>
            <a
              href={CLEANSTART_YOUTUBE_SUBSCRIBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="cs-btn-glass"
            >
              Subscribe on YouTube
            </a>
          </HeroReveal>
        </div>

        {featured ? (
          <div className="flex flex-col gap-5">
            <VideoPlayer
              video={featured}
              sizes="(min-width: 1024px) 700px, 100vw"
              priority
              radius="20px"
              className="shadow-[0_40px_90px_rgba(5,4,30,0.55)] ring-1 ring-white/15"
            />
            <div className="flex flex-col gap-2">
              <VideoMeta video={featured} tone="dark" />
              <h2
                className="font-display font-semibold text-white"
                style={{ fontSize: "var(--fs-h4)", lineHeight: 1.25, letterSpacing: "-0.015em" }}
              >
                <Link
                  href={videoPath(featured.slug)}
                  className="transition-colors duration-200 hover:text-[#DAB6F3] motion-reduce:transition-none"
                >
                  {featured.title}
                </Link>
              </h2>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
