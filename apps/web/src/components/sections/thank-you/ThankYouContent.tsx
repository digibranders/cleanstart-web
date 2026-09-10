import Link from "next/link";

import { Container } from "@/components/layout";
import { HeroReveal } from "@/components/ui/Reveal";
import type { ThankYouContent as Content } from "@/lib/thank-you/content";

/**
 * The post-conversion page body.
 *
 * This is the most valuable unused space on the site: someone who has just
 * converted is at peak intent, and the inline banner it replaces vanished after
 * five seconds. So it leads with confirmation, says plainly what happens next,
 * then offers the two next steps most likely to matter.
 *
 * Built on the same dark band the originating form pages open with, so arriving
 * here reads as the next step in one flow rather than a drop onto a bare page.
 * The card overlaps the band's lower edge, which is the site's existing idiom
 * for lifting a panel out of a gradient (see the Book a Demo form).
 */
export function ThankYouContent({ content }: { content: Content }): React.ReactElement {
  return (
    <div className="bg-white">
      <section className="relative w-full overflow-hidden">
        {/* Bleeds past the 1440 viewport on each side, matching DemoHero. */}
        <div
          aria-hidden
          className="absolute inset-0 left-1/2 -translate-x-1/2"
          style={{
            width: "min(1920px, calc(100% + 480px))",
            // Fades to transparent at the foot rather than ending on solid
            // violet, which is what stops the band cutting a hard line across
            // the page where it meets white. Same tail as DemoHero.
            background:
              "linear-gradient(180deg, rgba(21, 16, 33, 1) 0%, rgba(16, 18, 62, 1) 28%, rgba(19, 30, 143, 1) 52%, rgba(71, 30, 192, 1) 74%, rgba(71, 31, 195, 1) 84%, rgba(70, 30, 191, 0.85) 90%, rgba(66, 30, 188, 0.4) 96%, rgba(66, 30, 188, 0) 100%)",
          }}
        />

        {/* The asset carries its own edge fade; a CSS-tiled grid would run at
            uniform opacity to the section edge and read as graph paper. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-images/hero-vector-grid.svg"
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="pointer-events-none select-none absolute inset-x-0 top-0 w-full"
          style={{ height: "100%", objectFit: "cover", opacity: 0.5 }}
        />

        <div
          className="relative mx-auto text-center"
          style={{
            maxWidth: "var(--container-prose)",
            paddingLeft: "24px",
            paddingRight: "24px",
            // Floor is 104px, not the usual 64px: the header overlays this band
            // and the eyebrow pill is the first thing under it, so a smaller
            // floor tucks the pill beneath the logo on narrow viewports.
            paddingTop: "calc(clamp(104px, 8vw, 128px) + var(--cs-header-extra))",
            paddingBottom: "clamp(96px, 11vw, 168px)",
          }}
        >
          <HeroReveal y={40} duration={0.9} lcp>
            <span
              className="inline-flex items-center gap-2 rounded-full"
              style={{
                padding: "6px 14px",
                background: "rgba(255, 255, 255, 0.10)",
                boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.18)",
                color: "#8CF5C4",
                fontFamily: "var(--font-display), 'Manrope', sans-serif",
                fontSize: "var(--fs-caption)",
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {content.eyebrow}
            </span>

            {/* tabIndex so the tracker can move focus here after a soft
                navigation, which otherwise announces nothing. */}
            <h1
              id="thank-you-heading"
              tabIndex={-1}
              className="mt-5 text-white outline-none"
              style={{
                fontFamily: "var(--font-display), sans-serif",
                fontSize: "var(--text-hero-utility)",
                fontWeight: 600,
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
              }}
            >
              {content.headline}
            </h1>

            <p
              className="mx-auto mt-5"
              style={{
                maxWidth: "34em",
                color: "rgba(255, 255, 255, 0.76)",
                fontSize: "var(--fs-lead)",
                lineHeight: 1.55,
              }}
            >
              {content.body}
            </p>
          </HeroReveal>
        </div>
      </section>

      {/* Lifted out of the band's lower edge. */}
      <Container variant="prose">
        <div
          className="relative z-10 rounded-[20px] bg-white"
          style={{
            marginTop: "clamp(-120px, -9vw, -72px)",
            padding: "clamp(24px, 3.2vw, 40px)",
            boxShadow:
              "0 24px 60px -24px rgba(9, 6, 63, 0.35), 0 2px 6px rgba(9, 6, 63, 0.06), inset 0 0 0 1px rgba(9, 6, 63, 0.06)",
          }}
        >
          <p
            className="font-display text-[#5B6087]"
            style={{
              fontSize: "var(--fs-caption)",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            What happens next
          </p>
          <p
            className="mt-2.5 text-[#3A3F63]"
            style={{ fontSize: "var(--fs-body)", lineHeight: 1.65 }}
          >
            {content.whatHappensNext}
          </p>

          <div
            className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-6"
            style={{ borderColor: "rgba(9, 6, 63, 0.08)" }}
          >
            <Link
              href={content.primary.href}
              className="cs-btn-blue"
              style={
                {
                  ["--cs-btn-h" as string]: "48px",
                  ["--cs-btn-px" as string]: "24px",
                  ["--cs-btn-fs" as string]: "var(--fs-button)",
                } as React.CSSProperties
              }
            >
              <span>{content.primary.label}</span>
            </Link>
            {/* Not `.cs-link-cta`: that class is white with a #33BAEC hover,
                built for the dark bands. On this white card it renders white on
                white, and its hover colour measures 2.2:1 here. #3960F9 is the
                accessible blue already used for focus rings. */}
            <Link
              href={content.secondary.href}
              className="cs-thank-you-secondary"
              style={{ fontSize: "var(--fs-button)" }}
            >
              {content.secondary.label}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M5 12h13M12 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </Container>

      <div style={{ height: "clamp(64px, 8vw, 112px)" }} />
    </div>
  );
}
