import Image from "next/image";
import Link from "next/link";
import type { PodcastCtaCard } from "@/lib/podcast";
import type { ChannelVideo } from "@/lib/youtube-feed";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";
import { YouTubeEmbed } from "./_components/YouTubeEmbed";

type Props = {
  videoHeading: string;
  videos: ChannelVideo[];
  cards: PodcastCtaCard[];
};

const CARD_ICONS = [
  "/images/podcast/cta-card-icon-explore.webp",
  "/images/podcast/cta-card-icon-news.webp",
  "/images/podcast/cta-card-icon-updates.webp",
  "/images/podcast/cta-card-icon-subscribe.webp",
] as const;

const RING_BG =
  "linear-gradient(90deg, rgba(44, 193, 235, 0.30) 0%, rgba(44, 193, 235, 0.30) 100%)";

const BUTTON_BG = "#3960F9";
const BUTTON_SHADOW =
  "0 1px 2px -1px rgba(9,6,63,0.4), 0 0 0 1px #3960F9, inset 0 1px 0 rgba(255,255,255,0.16)";

function ArrowRight(): React.ReactElement {
  return (
    <svg
      width="20"
      height="18"
      viewBox="0 0 25 22"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>arrow</title>
      <path
        d="M14 5l6 6-6 6M4 11h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChannelVideoCard({
  video,
}: {
  video: ChannelVideo;
}): React.ReactElement {
  return (
    <article className="flex flex-col w-full">
      <div
        className="relative overflow-hidden bg-white"
        style={{
          borderRadius: "16px",
          boxShadow:
            "0 4px 8px -4px rgba(22,34,51,0.08), 0 16px 24px rgba(22,34,51,0.08)",
        }}
      >
        <YouTubeEmbed
          videoId={video.videoId}
          title={video.title}
          thumbnailUrl={video.thumbnailUrl}
          rounded="16px"
        />
      </div>
      <h3
        className="font-display font-medium text-[#111111]"
        style={{
          fontSize: "var(--fs-h4)",
          lineHeight: 1.3,
          letterSpacing: "-0.01em",
          marginTop: "16px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {video.title}
      </h3>
    </article>
  );
}

function CompactResourceCard({
  card,
  iconSrc,
}: {
  card: PodcastCtaCard;
  iconSrc: string;
}): React.ReactElement {
  return (
    <div className="relative flex w-full h-full">
      <div
        className="relative flex w-full"
        style={{
          borderRadius: "clamp(20px, 2vw, 28px)",
          background: RING_BG,
          padding: "clamp(5px, 0.5vw, 6px)",
        }}
      >
        <div
          className="relative flex w-full flex-col overflow-hidden bg-white"
          style={{
            borderRadius: "clamp(16px, 1.6vw, 22px)",
            boxShadow:
              "0 3px 4px rgba(22,34,51,0.04), 0 12px 24px rgba(22,34,51,0.06)",
            padding: "clamp(18px, 1.8vw, 24px)",
            gap: "clamp(10px, 1vw, 14px)",
            minHeight: "clamp(220px, 18vw, 260px)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: "4%",
              top: "6%",
              width: "92%",
              height: "30%",
              background: "#df9bff",
              opacity: 0.35,
              filter: "blur(48px)",
              borderRadius: "50%",
            }}
          />

          <div className="relative" style={{ width: "56px", height: "56px" }}>
            <Image
              src={iconSrc}
              alt=""
              width={120}
              height={120}
              aria-hidden
              className="select-none pointer-events-none object-contain"
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          <div className="relative flex flex-col" style={{ gap: "6px" }}>
            <h3
              className="text-[#111111]"
              style={{
                fontFamily: "var(--font-display), sans-serif",
                fontWeight: 700,
                fontSize: "var(--fs-h4)",
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
              }}
            >
              {card.title}
            </h3>
            <p
              className="text-[#555555]"
              style={{
                fontFamily: "var(--font-display), sans-serif",
                fontWeight: 400,
                fontSize: "var(--fs-body-sm)",
                lineHeight: 1.4,
                letterSpacing: "-0.02em",
              }}
            >
              {card.body}
            </p>
          </div>

          {/* Pin the CTA to the card bottom so buttons align across the row regardless of body length. */}
          <div className="relative mt-auto pt-2">
            <Link
              href={card.ctaHref}
              className="inline-flex items-center text-white transition-transform duration-200 hover:-translate-y-px active:translate-y-0"
              style={{
                height: "clamp(36px, 2.6vw, 40px)",
                paddingLeft: "12px",
                paddingRight: "12px",
                gap: "6px",
                background: BUTTON_BG,
                borderRadius: "8px",
                boxShadow: BUTTON_SHADOW,
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                fontSize: "var(--fs-body-sm)",
                letterSpacing: "-0.01em",
                width: "fit-content",
              }}
            >
              <span>{card.ctaLabel}</span>
              <ArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PodcastChannelVideos({
  videoHeading,
  videos,
  cards,
}: Props): React.ReactElement | null {
  const visibleCards = cards.slice(0, 4);
  if (visibleCards.length === 0 && videos.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden bg-white"
      aria-label="From the CleanStart channel"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          right: "-633px",
          top: "-525px",
          width: "1101px",
          height: "1101px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 50% 50%, rgba(100,13,251,0.12) 0%, rgba(100,13,251,0) 70%)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute hidden md:block"
        style={{
          left: "-81px",
          bottom: "-160px",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background: "#2CC1EB",
          filter: "blur(180px)",
          opacity: 0.25,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute hidden md:block"
        style={{
          right: "-60px",
          top: "-80px",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          background: "#DF9BFF",
          filter: "blur(200px)",
          opacity: 0.7,
        }}
      />

      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>grid</title>
        <defs>
          <pattern
            id="cta-grid"
            x="0"
            y="0"
            width="44"
            height="44"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 44 0 L 0 0 0 44"
              fill="none"
              stroke="rgba(15, 23, 42, 0.08)"
              strokeWidth="1"
            />
          </pattern>
          <radialGradient id="cta-grid-mask" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="cta-grid-fade">
            <rect width="100%" height="100%" fill="url(#cta-grid-mask)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#cta-grid)" mask="url(#cta-grid-fade)" />
      </svg>

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 py-[clamp(60px,7vw,100px)]">
        {videos.length > 0 && (
          <>
            <Reveal header>
              <h2
                className="text-left text-[#111111] font-bold"
                style={{
                  fontSize: "var(--fs-h2)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.04em",
                }}
              >
                {videoHeading}
              </h2>
            </Reveal>
            <RevealStagger className="mt-[44px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-[32px] gap-y-[40px]">
              {videos.map((video) => (
                <RevealItem key={video.videoId}>
                  <ChannelVideoCard video={video} />
                </RevealItem>
              ))}
            </RevealStagger>
          </>
        )}

        <RevealStagger
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-stretch"
          style={{
            gap: "clamp(16px, 1.8vw, 24px)",
            marginTop: videos.length > 0 ? "clamp(48px, 5vw, 72px)" : "0",
          }}
        >
          {visibleCards.map((card, i) => (
            <RevealItem key={card.title}>
              <CompactResourceCard
                card={card}
                iconSrc={CARD_ICONS[i] ?? CARD_ICONS[0]}
              />
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
