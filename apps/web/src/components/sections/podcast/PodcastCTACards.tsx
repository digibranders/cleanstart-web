import Link from "next/link";
import type { PodcastCtaCard } from "@/lib/podcast";

type Props = {
  cards: PodcastCtaCard[];
};

/**
 * Inner content for the Podcast CTA, rendered inside the Footer's fixed
 * 1276×330 / radius-40 slot. The 3-card grid pattern was retired so podcast
 * matches every other page's overlap card. The first card's copy/CTA is
 * promoted to the primary; up to two more become inline secondary links.
 */
export function PodcastCTACards({ cards }: Props): React.ReactElement {
  const [primary, ...secondary] = cards;

  return (
    <div
      className="absolute inset-0"
      style={{ background: "linear-gradient(180deg, #131E8F 0%, #471EC0 100%)" }}
      aria-label="Podcast — explore more"
    >
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          right: "-200px",
          top: "-100px",
          width: "640px",
          height: "640px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(173,138,255,0.45), transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="flex items-center"
          style={{ gap: "68px", width: "1047px" }}
        >
          <h2
            className="font-display font-bold text-white shrink-0"
            style={{
              fontSize: "clamp(1.75rem,3.82vw,3.4375rem)",
              lineHeight: 1.0,
              letterSpacing: "-0.05em",
              width: "401px",
            }}
          >
            {primary?.title ?? "Tune Into the CleanStart Podcast"}
          </h2>

          <div
            className="flex flex-col items-start shrink-0"
            style={{ width: "493px", gap: "20px" }}
          >
            <p
              className="text-[1.3125rem] font-normal leading-[1.4] tracking-[-0.04em] text-white/80"
            >
              {primary?.body ??
                "Conversations with builders, defenders, and platform teams on shipping secure software faster."}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {primary && (
                <Link
                  href={primary.ctaHref}
                  className="cs-btn-glass"
                  style={{
                    ["--cs-btn-h" as string]: "43px",
                    ["--cs-btn-px" as string]: "18px",
                    ["--cs-btn-fs" as string]: "18px",
                  }}
                >
                  {primary.ctaLabel}
                </Link>
              )}
              {secondary.slice(0, 2).map((card) => (
                <Link
                  key={card.title}
                  href={card.ctaHref}
                  className="text-sm font-medium text-white/85 underline-offset-4 hover:underline"
                >
                  {card.ctaLabel}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
