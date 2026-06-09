import type { Event } from "@/lib/events";
import { HeroReveal, Reveal } from "@/components/ui/Reveal";
import { FeaturedEventCard } from "./EventFeatureCard";
import { UpcomingEventCarousel } from "./UpcomingEventCarousel";

const HERO_GRADIENT =
  "linear-gradient(180deg, #151021 0%, #10123E 45%, #131E8F 66%, #471EC0 75%, #471FC3 100%)";

interface UpcomingEventHeroProps {
  /** All upcoming events, soonest first. One → single card; many → carousel. */
  events: Event[];
}

export function UpcomingEventHero({
  events,
}: UpcomingEventHeroProps): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: HERO_GRADIENT }}
      aria-labelledby="events-hero-title"
    >
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: "-142px",
          top: "104px",
          width: "346px",
          height: "346px",
          mixBlendMode: "color-dodge",
          opacity: 0.5,
          transform: "rotate(-46.54deg)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blogs/cta-cube-left.webp"
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-contain"
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          right: "-142px",
          bottom: "-120px",
          width: "346px",
          height: "346px",
          mixBlendMode: "color-dodge",
          opacity: 0.5,
          transform: "rotate(-46.54deg)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blogs/cta-cube-right.webp"
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-contain"
        />
      </div>

<div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10"
        style={{ paddingTop: "calc(clamp(96px, 11vw, 160px) + var(--cs-header-extra))", paddingBottom: "clamp(48px, 6vw, 80px)" }}
      >
        <HeroReveal y={50} duration={1.0}>
          <h1
            id="events-hero-title"
            className="font-display font-semibold text-white text-center"
            style={{
              fontSize: "var(--fs-h1)",
              lineHeight: "var(--text-hero-lh)",
              letterSpacing: "var(--text-hero-utility-ls)",
              marginBottom: "60px",
            }}
          >
            Upcoming Events
          </h1>
        </HeroReveal>

        <Reveal y={30} delay={0.2}>
          {renderHeroBody(events)}
        </Reveal>
      </div>
    </section>
  );
}

function renderHeroBody(events: Event[]): React.ReactElement {
  const [first] = events;
  if (!first) return <EmptyHeroCard />;
  if (events.length === 1) {
    return <FeaturedEventCard event={first} />;
  }
  return (
    <UpcomingEventCarousel
      slides={events.map((event, i) => (
        <FeaturedEventCard key={event.id} event={event} priority={i === 0} />
      ))}
      items={events.map((event) => ({ id: event.id, title: event.title }))}
    />
  );
}

function EmptyHeroCard(): React.ReactElement {
  return (
    <div
      className="relative w-full mx-auto overflow-visible"
      style={{
        maxWidth: "820px",
        minHeight: "clamp(180px, 18vw, 220px)",
        borderRadius: "16px",
        background: "rgba(165, 103, 255, 0.4)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        boxShadow:
          "0 30px 60px rgba(20,12,60,0.45), 0 0 0 1px rgba(255,255,255,0.12) inset",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: "16px",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='2' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          backgroundSize: "120px 120px",
          opacity: 0.55,
        }}
      />

      <div
        className="relative flex h-full flex-col items-center justify-center text-center"
        style={{ padding: "32px", gap: "12px" }}
      >
        <p
          className="font-display font-semibold text-white"
          style={{
            fontSize: "var(--fs-h3)",
            letterSpacing: "-0.04em",
            lineHeight: "1.2",
          }}
        >
          Stay tuned. New events coming soon.
        </p>
        <p
          className="text-white/70"
          style={{
            fontSize: "var(--fs-body)",
            lineHeight: 1.5,
          }}
        >
          We&apos;re lining up our next in-person event. Check back shortly.
        </p>
      </div>
    </div>
  );
}
