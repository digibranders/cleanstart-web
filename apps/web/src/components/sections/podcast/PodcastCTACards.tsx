import Image from "next/image";
import Link from "next/link";
import type { PodcastCtaCard } from "@/lib/podcast";

type Props = {
  cards: PodcastCtaCard[];
};

const CARD_ICON_SRC = "/images/podcast/cta-card-icon-54efec.png";

const BUTTON_GRADIENT = "linear-gradient(180deg, #3960F9 0%, #2B97D1 100%)";
const BUTTON_SHADOW =
  "0 0 0 1px rgba(57,96,249,1), 0 1px 2px -1px rgba(9,6,63,0.4), inset 0 1px 0 rgba(255,255,255,0.16)";

const CARD_GRADIENT_BLOB =
  "linear-gradient(90deg, rgba(6,182,212,1) 0%, rgba(99,102,241,1) 75%)";

const DIVIDER_FADE =
  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 51%, rgba(255,255,255,0) 100%)";

const VERTICAL_GUIDE =
  "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 51%, rgba(255,255,255,0) 100%)";

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

function ResourceCard({ card }: { card: PodcastCtaCard }): React.ReactElement {
  return (
    <div
      className="relative shrink-0"
      style={{ width: "404px", height: "435px" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "6px",
          top: "169px",
          width: "359.79px",
          height: "180px",
          borderRadius: "135px",
          background: CARD_GRADIENT_BLOB,
          opacity: 0.25,
          filter: "blur(64px)",
        }}
      />

      <div
        aria-hidden
        className="absolute"
        style={{
          left: "8px",
          top: "7px",
          width: "388px",
          height: "420px",
          background: "#FFFFFF",
          borderRadius: "32px",
          boxShadow:
            "0 4px 4px rgba(22,34,51,0.04), 0 4px 24px rgba(22,34,51,0.04), 0 24px 24px rgba(22,34,51,0.04), 0 32px 32px rgba(22,34,51,0.04), 0 64px 64px rgba(22,34,51,0.12)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "16px",
          top: "50px",
          width: "360px",
          height: "153px",
          background: "#DF9BFF",
          opacity: 0.5,
          filter: "blur(133px)",
          borderRadius: "50%",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "-91.5px",
          top: "74.5px",
          width: "574px",
          height: "1px",
          background: DIVIDER_FADE,
          opacity: 0.3,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "-91.5px",
          top: "190.5px",
          width: "574px",
          height: "1px",
          background: DIVIDER_FADE,
          opacity: 0.3,
        }}
      />

      {[68, 166, 224, 322].map((x) => (
        <div
          key={x}
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: `${x}px`,
            top: "7px",
            width: "1px",
            height: "264px",
            background: VERTICAL_GUIDE,
            opacity: 0.8,
          }}
        />
      ))}

      <div
        className="absolute"
        style={{ left: "32px", top: "31px", width: "160px", height: "160px" }}
      >
        <Image
          src={CARD_ICON_SRC}
          alt=""
          width={200}
          height={200}
          aria-hidden
          className="select-none pointer-events-none"
          style={{
            marginLeft: "-20px",
            marginTop: "-20px",
            width: "200px",
            height: "200px",
          }}
        />
      </div>

      <div
        className="absolute flex flex-col"
        style={{ left: "48px", top: "215px", width: "324px", gap: "24px" }}
      >
        <div className="flex flex-col" style={{ gap: "16px" }}>
          <h3
            className="font-display font-bold text-[#111111]"
            style={{
              fontSize: "clamp(1.5rem,2.22vw,2rem)",
              lineHeight: 1,
              letterSpacing: "-0.05em",
            }}
          >
            {card.title}
          </h3>
          <p
            className="font-display font-normal text-[#555555]"
            style={{
              fontSize: "clamp(1rem,1.39vw,1.25rem)",
              lineHeight: 1.4,
              letterSpacing: "-0.05em",
            }}
          >
            {card.body}
          </p>
        </div>
        <Link
          href={card.ctaHref}
          className="inline-flex items-center text-white"
          style={{
            height: "44px",
            paddingLeft: "14px",
            paddingRight: "14px",
            gap: "8px",
            background: BUTTON_GRADIENT,
            borderRadius: "8px",
            boxShadow: BUTTON_SHADOW,
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            fontSize: "18px",
            letterSpacing: "-0.01em",
            width: "fit-content",
          }}
        >
          <span>{card.ctaLabel}</span>
          <ArrowRight />
        </Link>
      </div>
    </div>
  );
}

export function PodcastCTACards({ cards }: Props): React.ReactElement | null {
  const visible = cards.slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden bg-white"
      style={{ minHeight: "635px" }}
      aria-label="Explore more from CleanStart"
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
            "radial-gradient(circle at 50% 50%, rgba(100,13,251,1) 0%, rgba(100,13,251,0) 100%)",
          opacity: 0.1,
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute hidden xl:block"
        style={{
          left: "-81px",
          top: "496px",
          width: "315px",
          height: "315px",
          borderRadius: "50%",
          background: "#2CC1EB",
          filter: "blur(203px)",
          opacity: 0.2,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute hidden xl:block"
        style={{
          right: "-15px",
          top: "-64px",
          width: "258px",
          height: "258px",
          borderRadius: "50%",
          background: "#DF9BFF",
          filter: "blur(243px)",
          opacity: 0.8,
        }}
      />

      <div className="relative mx-auto max-w-[1276px] px-6 py-[100px]">
        <div
          className="flex flex-wrap items-start justify-center"
          style={{ gap: "33px" }}
        >
          {visible.map((card) => (
            <ResourceCard key={card.title} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
