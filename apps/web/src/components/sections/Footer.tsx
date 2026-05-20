import React from "react";

/**
 * Footer — Figma Frame 2147238429 (108:8061), 1920×850
 *
 * Layout (top → bottom):
 *  1. Top row: tagline (left) + 5 social icons (right)
 *  2. Four nav columns: Contact, Solutions, Connect, Members of
 *  3. Awarded-with section: 4 badges
 *  4. Bottom row: Logo + © + Privacy/Legal/Security links
 *
 * Background: linear gradient #151021 → #131E8F → #471EC0 with decorative
 * purple ellipses + faint glowing line accents (Figma "Line 104..108").
 */

interface FooterLink {
  label: string;
  href: string;
}

const COL_CONTACT: FooterLink[] = [
  { label: "About Us", href: "#about" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Events", href: "#events" },
];
const COL_SOLUTIONS: FooterLink[] = [
  { label: "Enhance SCA", href: "#sca" },
  { label: "FIPS Compliance", href: "#fips" },
  { label: "Vulnerability", href: "#vulnerability" },
];
const COL_CONNECT: FooterLink[] = [
  { label: "Contact Us", href: "#contact" },
  { label: "Careers", href: "#careers" },
  { label: "Newsroom", href: "#newsroom" },
  { label: "Legal", href: "#legal" },
];
const COL_MEMBERS: FooterLink[] = [
  { label: "OpenSSF", href: "https://openssf.org" },
  { label: "Linux Foundation", href: "https://linuxfoundation.org" },
  { label: "Cloud Native", href: "https://cncf.io" },
];

const SOCIAL_ICONS = [
  { name: "X (Twitter)", href: "https://x.com/cleanstart", path: "M17.53 2.477h3.05L13.94 10.06l7.84 10.36h-6.13l-4.8-6.27-5.5 6.27H2.3l7.13-8.13L1.92 2.477h6.28l4.34 5.74 4.99-5.74Zm-1.07 16.04h1.69L7.62 4.06H5.81l10.65 14.46Z" },
  { name: "LinkedIn", href: "https://linkedin.com/company/cleanstart", path: "M19 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM8.34 17.34H5.67V9.34h2.67v8zM7 8.17C6.07 8.17 5.33 7.43 5.33 6.5S6.07 4.83 7 4.83s1.67.74 1.67 1.67S7.93 8.17 7 8.17zm11.34 9.17h-2.67v-4.34c0-1.04-.36-1.74-1.27-1.74-.7 0-1.11.47-1.29.92-.07.16-.08.39-.08.62v4.54h-2.67s.04-7.36 0-8.13h2.67v1.15c.35-.55.99-1.34 2.4-1.34 1.75 0 3.06 1.14 3.06 3.6v4.72z" },
  { name: "GitHub", href: "https://github.com/cleanstart", path: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.466-1.335-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" },
  { name: "YouTube", href: "https://youtube.com/@cleanstart", path: "M23.5 6.5a3.02 3.02 0 0 0-2.12-2.13C19.5 4 12 4 12 4s-7.5 0-9.38.37A3.02 3.02 0 0 0 .5 6.5C.13 8.38.13 12 .13 12s0 3.62.37 5.5a3.02 3.02 0 0 0 2.12 2.13C4.5 20 12 20 12 20s7.5 0 9.38-.37a3.02 3.02 0 0 0 2.12-2.13c.37-1.88.37-5.5.37-5.5s0-3.62-.37-5.5ZM9.75 15.5v-7l6 3.5-6 3.5Z" },
  { name: "Discord", href: "https://discord.gg/cleanstart", path: "M20.32 4.37A19.79 19.79 0 0 0 16.43 3.04a.07.07 0 0 0-.08.04 13.2 13.2 0 0 0-.6 1.23 18.27 18.27 0 0 0-5.5 0 12.65 12.65 0 0 0-.62-1.23.08.08 0 0 0-.08-.04 19.74 19.74 0 0 0-3.89 1.33.07.07 0 0 0-.03.03A20.39 20.39 0 0 0 1.94 17.4a.08.08 0 0 0 .03.06 19.93 19.93 0 0 0 6 3.04.08.08 0 0 0 .09-.03c.46-.62.87-1.28 1.22-1.97a.08.08 0 0 0-.04-.1 13.13 13.13 0 0 1-1.87-.89.08.08 0 0 1-.01-.13c.13-.1.25-.2.37-.3a.08.08 0 0 1 .07-.01 14.21 14.21 0 0 0 12.07 0 .08.08 0 0 1 .08.01c.12.1.25.2.37.3a.08.08 0 0 1-.01.13c-.6.35-1.22.65-1.87.89a.08.08 0 0 0-.04.1c.36.69.78 1.35 1.22 1.97a.08.08 0 0 0 .09.03 19.86 19.86 0 0 0 6-3.04.08.08 0 0 0 .04-.06A20.27 20.27 0 0 0 20.35 4.4a.06.06 0 0 0-.03-.03ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42Zm7.97 0c-1.19 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Z" },
];

const AWARDS: { name: string; src: string; w: number; h: number }[] = [
  { name: "Cyber Security Excellence Awards", src: "/images/awards/award-1.png", w: 64, h: 81 },
  { name: "Trusted Vendor", src: "/images/awards/award-2.png", w: 80, h: 87 },
  { name: "ISO/IEC 27001", src: "/images/awards/award-3.png", w: 81, h: 76 },
  { name: "AICPA SOC 2", src: "/images/awards/award-4.png", w: 82, h: 92 },
];

const LEGAL_LINKS = [
  { label: "Privacy Program", href: "#privacy" },
  { label: "Legal", href: "#legal" },
  { label: "Security", href: "#security" },
];

// CTA-card overlap is owned here, not by callers. Card overhangs the Footer by
// 170px (Figma 446:1765). Callers pass content only via the `cta` prop. Do not
// re-add `topPadding` or negative section margins per-page.
//
// IMPORTANT — Layout contract:
//   - The Footer has NO reserved gap above it. The CTA card sits absolutely at
//     `top: -170px` and visually OVERLAPS the previous section by 170px.
//   - Every page that uses `<Footer cta=...>` MUST make sure its last section
//     extends at least 170px below its natural content so the CTA card overlaps
//     real section bg (gradient, pattern, decorative SVGs — whatever the
//     section actually paints), NOT empty body white.
//   - Convention: every last bg-providing element of a CTA page uses
//     `padding-bottom: 250px` — that's 170px for the CTA overlap + 80px of
//     breathing room between the page's last content and the CTA card top.
//     Standardised across all pages so the gap is visually consistent.
//
// Locked card container contract (per-page CTAs must fit these bounds):
//   width: 1276px (max-width: calc(100% - 48px))
//   height: 330px (overflow: hidden — content that exceeds is clipped)
//   border-radius: 40px
//   z-index: 20
//   The container itself is transparent; per-page CTA renders its own fill.
export function Footer({
  cta,
  ctaOverlay,
}: { cta?: React.ReactNode; ctaOverlay?: React.ReactNode } = {}) {
  const hasCta = Boolean(cta);
  return (
    <footer
      className="relative w-full text-white"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131E8F 70.794%, #471EC0 113.28%)",
      }}
    >
      {hasCta && (
        <div
          className="pointer-events-none absolute left-1/2 z-20 flex w-full -translate-x-1/2 justify-center px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20"
          style={{ top: "-170px" }}
        >
          {/* Sizing wrapper — NO overflow:hidden so `ctaOverlay` children can
              break out of the card (e.g. the home page kubr bird peeking
              above the card top).
              max-w reduced 1276→1200 so the card has clear side gutters at
              xl/2xl instead of kissing the viewport edges. */}
          <div
            className="pointer-events-auto relative w-[1200px] max-w-full h-[420px] sm:h-[360px] lg:h-[300px]"
          >
            {/* Clipped card surface — fills the slot and clips inner content
                to the rounded 1276×330 box. */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ borderRadius: "40px" }}
            >
              {cta}
            </div>
            {/* Optional overlay — rendered ABOVE the clipped card so children
                positioned outside its bounds (negative tops/lefts/rights)
                remain visible. Use sparingly. */}
            {ctaOverlay}
          </div>
        </div>
      )}
      <div className="relative w-full overflow-hidden">
        {/* Big purple ellipse — Figma 46640 (974×863) at (308, -358), color #7A59FF, opacity 3%, blur 250px.
            Very subtle huge soft glow that brightens the upper-left of the footer. */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: "calc(308 / 1920 * 100%)",
            top: "-358px",
            width: "min(974px, 51vw)",
            height: "863px",
            borderRadius: "50%",
            backgroundColor: "rgba(122,89,255,0.03)",
            filter: "blur(125px)",
          }}
        />
        {/* Small purple ellipse — Figma 46639 (129×313) at (1481, -93), color #7A59FF, opacity 25%, blur 250px.
            Vertical accent on the right side. */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: "calc(1481 / 1920 * 100%)",
            top: "-93px",
            width: "129px",
            height: "313px",
            borderRadius: "50%",
            backgroundColor: "rgba(122,89,255,0.25)",
            filter: "blur(125px)",
          }}
        />
      <div className="relative px-6">
       <div className={`relative mx-auto w-full max-w-[1276px] pb-[80px] ${hasCta ? "pt-[320px] sm:pt-[260px] lg:pt-[225px]" : "pt-[80px]"}`}>
        {/* Top row — tagline (left) + social icons (right). Figma: tagline at y=179, icons at y=183 — both top-aligned. */}
        <div className="flex flex-wrap items-start justify-between gap-8">
          <p
            className="text-lg font-normal leading-[1.4] tracking-[-0.04em] text-white"
            style={{ maxWidth: "396px" }}
          >
            Hardened container images with zero known vulnerabilities. Secure by
            design, built for speed.
          </p>

          <ul className="flex items-center gap-[19px]" aria-label="Social media">
            {SOCIAL_ICONS.map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform duration-200 hover:scale-105 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300/70"
                  style={{
                    backgroundColor: "rgba(217, 217, 217, 0.15)",
                    backdropFilter: "blur(5px)",
                    boxShadow:
                      "inset 2.67px 2.67px 13.33px 4px rgba(168, 108, 252, 0.4)",
                  }}
                >
                  <span className="sr-only">{s.name}</span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d={s.path} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* 4 navigation columns — Figma: horizontal, hug-content, 272px gap (1276 wide) */}
        <nav
          className="mt-[62px] grid grid-cols-2 gap-y-12 sm:flex sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-y-12"
          aria-label="Footer navigation"
        >
          <FooterColumn title="Contact" links={COL_CONTACT} />
          <FooterColumn title="Solutions" links={COL_SOLUTIONS} />
          <FooterColumn title="Connect" links={COL_CONNECT} />
          <FooterColumn title="Members of" links={COL_MEMBERS} />
        </nav>

        {/* Awarded with row — Figma 16px gap between heading and badges */}
        <div className="mt-[56px] flex flex-col items-center gap-[16px]">
          <h3 className="font-display text-base font-semibold leading-[1.3] tracking-[-0.04em] text-white">
            Awarded with
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-[25px]">
            {AWARDS.map((award) => (
              <AwardBadge key={award.name} award={award} />
            ))}
          </div>
        </div>

        {/* Bottom row — Logo + © + legal links (no divider line per Figma) */}
        <div className="mt-[32px] flex flex-wrap items-end justify-between gap-6">
          {/* Left: Logo on top, copyright below — Figma stacks vertically */}
          <div className="flex flex-col items-start gap-[9px]">
            <div className="relative h-[32px] w-[153px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-cleanstart-footer.png"
                alt="CleanStart"
                width={153}
                height={32}
                loading="eager"
                decoding="async"
                className="h-full w-full object-contain object-left"
              />
            </div>
            <span
              className="text-2xs font-normal leading-[1.1] text-white/95"
              style={{ letterSpacing: "0.24px" }}
            >
              ©2026 CleanStart. All rights reserved.
            </span>
          </div>

          {/* Right: Legal links */}
          <ul className="flex items-center gap-2 leading-none">
            {LEGAL_LINKS.map((link, i) => (
              <React.Fragment key={link.href}>
                <li className="flex leading-none">
                  <a
                    href={link.href}
                    className="text-xs italic leading-[1.75] text-white transition-colors duration-200 hover:text-cyan-200 cursor-pointer"
                    style={{ letterSpacing: "0.24px" }}
                  >
                    {link.label}
                  </a>
                </li>
                {i < LEGAL_LINKS.length - 1 && (
                  <li
                    aria-hidden
                    className="h-[3px] w-[3px] rounded-full bg-white/95"
                  />
                )}
              </React.Fragment>
            ))}
          </ul>
        </div>
       </div>
      </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="font-display text-base font-semibold leading-[1.3] tracking-[-0.04em] text-white">
        {title}
      </h3>
      <ul className="mt-6 flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href} className="flex leading-none">
            <a
              href={link.href}
              className="group inline-flex items-center gap-2 text-sm font-normal leading-[1.4] tracking-[-0.04em] text-white/85 transition-colors duration-200 hover:text-white cursor-pointer"
            >
              <span>{link.label}</span>
              <svg
                width="10"
                height="14"
                viewBox="0 0 10 14"
                fill="none"
                aria-hidden
                className="opacity-90 transition-transform duration-200 group-hover:translate-x-1"
              >
                <path
                  d="M7.62875 7.38101L2.40375 12.3179L1.25 11.1674L4.40375 8.29228L5.49625 7.36956L4.40375 6.44683L1.25 3.59465L2.40375 2.41992L7.62875 7.38101Z"
                  fill="currentColor"
                />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Figma 108:8426 path — rounded-corner shield (98×120, cornerRadius 15)
const BADGE_SHIELD_PATH =
  "M0 15C0 6.71573 6.71573 0 15 0H82.5C90.7843 0 97.5 6.71573 97.5 15V95.6479C97.5 102.467 92.8997 108.429 86.3029 110.158L52.5529 119.003C50.0597 119.657 47.4403 119.657 44.9471 119.003L11.1971 110.158C4.60029 108.429 0 102.467 0 95.6479V15Z";

function AwardBadge({ award }: { award: (typeof AWARDS)[number] }) {
  const shield: React.CSSProperties = {
    clipPath: `path('${BADGE_SHIELD_PATH}')`,
    WebkitClipPath: `path('${BADGE_SHIELD_PATH}')`,
  };
  return (
    <div className="relative h-[120px] w-[98px]" title={award.name}>
      {/* Glassy shield bg — same rounded-corner pentagon path as Figma */}
      <div
        aria-hidden
        className="absolute inset-0 backdrop-blur-md"
        style={{
          ...shield,
          backgroundColor: "rgba(255, 255, 255, 0.08)",
        }}
      />
      {/* Subtle inner highlight along the top edge for the GLASS feel */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          ...shield,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 35%)",
          mixBlendMode: "screen",
        }}
      />
      {/* Image content — centered in the upper rectangular area, above the V */}
      <div className="absolute inset-x-0 top-0 flex h-[100px] items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={award.src}
          alt={award.name}
          width={award.w}
          height={award.h}
          loading="eager"
          decoding="async"
          className="object-contain"
        />
      </div>
    </div>
  );
}
