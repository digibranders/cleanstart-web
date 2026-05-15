import Image from "next/image";
import Link from "next/link";
import { type Event, formatEventDate } from "@/lib/events";
import { mediaUrl } from "@/lib/blog";

const HERO_GRADIENT =
  "linear-gradient(180deg, #151021 0%, #10123e 45%, #131e8f 61%, #471ec0 75%, #471fc3 84%, rgba(70,30,191,0.85) 88%, rgba(66,30,188,0.40) 95%, rgba(66,30,188,0) 99%)";

interface UpcomingEventHeroProps {
  event: Event | null;
}

export function UpcomingEventHero({
  event,
}: UpcomingEventHeroProps): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "746px", background: HERO_GRADIENT }}
      aria-labelledby="events-hero-title"
    >
      {/* Decorative glow — left side */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-119px",
          top: "279px",
          width: "332px",
          height: "313px",
          mixBlendMode: "hard-light",
          opacity: 0.3,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blogs/hero-glow-left.png"
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Decorative orb — right side */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          right: "-119px",
          top: "279px",
          width: "346px",
          height: "346px",
          mixBlendMode: "color-dodge",
          opacity: 0.25,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blogs/hero-orb-top.png"
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Subtle grid pattern overlay — 71×71 cells */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "71px 71px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 60%, rgba(0,0,0,0.85), rgba(0,0,0,0))",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 60%, rgba(0,0,0,0.85), rgba(0,0,0,0))",
        }}
      />

      <div
        className="relative mx-auto max-w-[1276px] px-6"
        style={{ paddingTop: "160px", paddingBottom: "80px" }}
      >
        {/* Page title */}
        <h1
          id="events-hero-title"
          className="font-display font-semibold text-white text-center"
          style={{
            fontSize: "clamp(3rem,5.6vw,5rem)",
            lineHeight: "1.0",
            letterSpacing: "-0.05em",
            marginBottom: "60px",
          }}
        >
          Upcoming{" "}
          <span
            style={{
              background:
                "linear-gradient(180deg, #7faaff 0%, #33baec 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Events
          </span>
        </h1>

        {/* Featured hero card */}
        {event ? <FeaturedEventCard event={event} /> : <EmptyHeroCard />}
      </div>
    </section>
  );
}

function FeaturedEventCard({ event }: { event: Event }): React.ReactElement {
  const longDate = formatEventDate(
    event.startsAt,
    event.timezone,
    event.customDateLabel,
    "long",
  );
  const heroImg = mediaUrl(event.heroImage?.url);

  return (
    <div
      className="relative w-full mx-auto overflow-hidden"
      style={{
        maxWidth: "1276px",
        height: "368px",
        borderRadius: "24px",
        background:
          "linear-gradient(135deg, #5949d9 0%, #3d2dae 60%, #2a1b6b 100%)",
        boxShadow:
          "0 30px 60px rgba(20,12,60,0.45), 0 0 0 1px rgba(255,255,255,0.06) inset",
      }}
    >
      <div className="relative flex h-full items-stretch" style={{ padding: "32px" }}>
        {/* Left: image */}
        <div
          className="relative shrink-0 overflow-hidden"
          style={{
            width: "585px",
            height: "304px",
            borderRadius: "16px",
            background: "#251a55",
          }}
        >
          {heroImg ? (
            <Image
              src={heroImg}
              alt={event.heroImage?.alt ?? event.title}
              fill
              className="object-cover"
              sizes="585px"
              priority
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background:
                  "linear-gradient(135deg, #1a1a4e 0%, #2d1b9e 50%, #471ec0 100%)",
              }}
            />
          )}

          {/* Date pill — top-left of image */}
          {longDate && (
            <div
              className="absolute flex items-center"
              style={{
                top: "16px",
                left: "16px",
                height: "36px",
                padding: "0 16px",
                gap: "8px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.92)",
                boxShadow: "0 4px 12px rgba(20,12,60,0.25)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/blogs/icon-calendar.svg"
                alt=""
                aria-hidden
                width={16}
                height={16}
                className="pointer-events-none select-none"
                loading="lazy"
                decoding="async"
              />
              <span
                className="text-sm font-medium leading-none whitespace-nowrap"
                style={{ color: "#4a3bf1" }}
              >
                {longDate}
              </span>
            </div>
          )}
        </div>

        {/* Right: content */}
        <div
          className="flex flex-col justify-between"
          style={{
            marginLeft: "44px",
            paddingTop: "12px",
            paddingBottom: "12px",
            flex: 1,
            minWidth: 0,
          }}
        >
          <div className="flex flex-col" style={{ gap: "20px" }}>
            <h2
              className="font-display font-semibold text-white overflow-hidden"
              style={{
                fontSize: "clamp(1.5rem,2.22vw,2rem)",
                lineHeight: "1.2",
                letterSpacing: "-0.04em",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {event.title}
            </h2>

            {longDate && (
              <MetaRow
                icon="/images/blogs/icon-calendar.svg"
                label={longDate}
              />
            )}
            <MetaRow icon="/images/events/icon-location.svg" label={event.venue} />
          </div>

          <Link
            href={`/events/${event.slug}`}
            className="cs-btn-blue gap-2"
            style={{
              width: "168px",
              height: "43px",
              fontSize: "1rem",
              marginTop: "24px",
            }}
            aria-label={`Read more about ${event.title}`}
          >
            Read more
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/blogs/icon-arrow-right.svg"
              alt=""
              aria-hidden
              width={20}
              height={18}
              className="pointer-events-none select-none"
              loading="lazy"
              decoding="async"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyHeroCard(): React.ReactElement {
  return (
    <div
      className="relative w-full mx-auto flex items-center justify-center text-center"
      style={{
        maxWidth: "1276px",
        height: "368px",
        borderRadius: "24px",
        background:
          "linear-gradient(135deg, #5949d9 0%, #3d2dae 60%, #2a1b6b 100%)",
        boxShadow: "0 30px 60px rgba(20,12,60,0.45)",
        padding: "32px",
      }}
    >
      <div className="flex flex-col items-center" style={{ gap: "12px" }}>
        <p
          className="font-display font-semibold text-white"
          style={{
            fontSize: "clamp(1.5rem,2.5vw,2.25rem)",
            letterSpacing: "-0.04em",
            lineHeight: "1.2",
          }}
        >
          Stay tuned — new events coming soon
        </p>
        <p
          className="text-white/70"
          style={{
            fontSize: "clamp(0.95rem,1.2vw,1.0625rem)",
            lineHeight: 1.5,
          }}
        >
          We&apos;re lining up our next in-person event. Check back shortly.
        </p>
      </div>
    </div>
  );
}

function MetaRow({
  icon,
  label,
}: {
  icon: string;
  label: string;
}): React.ReactElement {
  return (
    <div className="flex items-center" style={{ gap: "12px" }}>
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.12)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={icon}
          alt=""
          aria-hidden
          width={16}
          height={16}
          className="pointer-events-none select-none"
          style={{ filter: "brightness(0) invert(1)" }}
          loading="lazy"
          decoding="async"
        />
      </div>
      <span
        className="text-white/90"
        style={{
          fontSize: "clamp(0.95rem,1.05vw,1.0625rem)",
          lineHeight: 1.4,
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </span>
    </div>
  );
}
