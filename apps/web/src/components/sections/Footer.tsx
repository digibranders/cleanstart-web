import React from "react";
import Link from "next/link";

import { CookiePreferencesButton } from "@/components/consent";

/**
 * Footer layout (top → bottom): brand logo + social icons, then a band with
 * three nav columns (Contact / Solutions / Connect) on the left and a single
 * right-aligned "Trusted & Certified" credential cluster (the award + Docker +
 * SOC 2 + ISO badges) on the right, and a bottom row with copyright and legal
 * links.
 */

interface FooterLink {
  label: string;
  href: string;
}

const COL_CONTACT: FooterLink[] = [
  { label: "About Us", href: "/about-us" },
  { label: "How It Works", href: "/cleanstart-images" },
  { label: "Events", href: "/events" },
];
const COL_SOLUTIONS: FooterLink[] = [
  { label: "Verifiable SBOMs", href: "/software-bill-materials" },
  { label: "FIPS Compliance", href: "/fips" },
  { label: "Vulnerability", href: "/vulnerability-remediation" },
];
const COL_CONNECT: FooterLink[] = [
  { label: "Contact Us", href: "/contact-us" },
  { label: "Careers", href: "/careers" },
  { label: "Newsroom", href: "/news" },
  { label: "Legal", href: "/legal" },
];
// `hoverColor` is each platform's brand color, applied to the glyph on hover.
// X and GitHub are brand-black; on the dark footer they stay white (a darkening
// would vanish), so their hover color is the same white — the scale lift is the
// only affordance for those two.
const SOCIAL_ICONS = [
  { name: "X (Twitter)", href: "https://x.com/CleanStartX", hoverColor: "#ffffff", path: "M17.53 2.477h3.05L13.94 10.06l7.84 10.36h-6.13l-4.8-6.27-5.5 6.27H2.3l7.13-8.13L1.92 2.477h6.28l4.34 5.74 4.99-5.74Zm-1.07 16.04h1.69L7.62 4.06H5.81l10.65 14.46Z" },
  { name: "LinkedIn", href: "https://www.linkedin.com/company/cleanstart-official", hoverColor: "#0a66c2", path: "M19 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM8.34 17.34H5.67V9.34h2.67v8zM7 8.17C6.07 8.17 5.33 7.43 5.33 6.5S6.07 4.83 7 4.83s1.67.74 1.67 1.67S7.93 8.17 7 8.17zm11.34 9.17h-2.67v-4.34c0-1.04-.36-1.74-1.27-1.74-.7 0-1.11.47-1.29.92-.07.16-.08.39-.08.62v4.54h-2.67s.04-7.36 0-8.13h2.67v1.15c.35-.55.99-1.34 2.4-1.34 1.75 0 3.06 1.14 3.06 3.6v4.72z" },
  { name: "YouTube", href: "https://www.youtube.com/@CleanStartOfficial", hoverColor: "#ff0000", path: "M23.5 6.5a3.02 3.02 0 0 0-2.12-2.13C19.5 4 12 4 12 4s-7.5 0-9.38.37A3.02 3.02 0 0 0 .5 6.5C.13 8.38.13 12 .13 12s0 3.62.37 5.5a3.02 3.02 0 0 0 2.12 2.13C4.5 20 12 20 12 20s7.5 0 9.38-.37a3.02 3.02 0 0 0 2.12-2.13c.37-1.88.37-5.5.37-5.5s0-3.62-.37-5.5ZM9.75 15.5v-7l6 3.5-6 3.5Z" },
  { name: "GitHub", href: "https://github.com/cleanstart-dev", hoverColor: "#ffffff", path: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.466-1.335-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" },
  { name: "Docker", href: "https://hub.docker.com/u/cleanstart", hoverColor: "#2496ed", path: "M13.983 11.078h2.119a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 0 0 .186-.186V3.574a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 0 0 .186-.186V6.29a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 0 0 .184-.186V6.29a.185.185 0 0 0-.185-.185H8.1a.185.185 0 0 0-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 0 0 .185-.186V6.29a.185.185 0 0 0-.184-.185H5.136a.186.186 0 0 0-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.082.185.184.185m-2.964 0h2.119a.185.185 0 0 0 .185-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.186.186 0 0 0-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.082.185.184.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 0 0-.75.748 11.376 11.376 0 0 0 .692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 0 0 3.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288z" },
];

// Credential badges render inside the glassy shield; the shield normalizes
// their footprint, so only the intrinsic dimensions are tracked here.
interface Badge {
  name: string;
  src: string;
  w: number;
  h: number;
}

// Right-anchored credential cluster, grouped under its own labels: the award,
// the Docker-verified badge, and the two certifications (SOC 2 + ISO).
const CREDENTIALS: { title: string; badges: Badge[] }[] = [
  {
    title: "Awarded with",
    badges: [
      { name: "Cyber Security Excellence Awards Winner", src: "/images/awards/award-1.webp", w: 486, h: 616 },
    ],
  },
  {
    title: "Docker verified",
    badges: [
      { name: "Docker Verified Publisher", src: "/images/awards/award-2.webp", w: 268, h: 267 },
    ],
  },
  {
    title: "Certifications",
    badges: [
      { name: "AICPA SOC 2", src: "/images/awards/award-4.webp", w: 1024, h: 1023 },
      { name: "ISO/IEC 27001", src: "/images/awards/award-3.webp", w: 200, h: 200 },
    ],
  },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Acceptable Use Policy", href: "/legal/acceptable-use-policy" },
];

// CTA-card overlap is owned here, not by callers. The card is vertically
// centered on the footer's top edge (half above, half below) via
// `top: 0; translateY(-50%)`. Callers pass content only via the `cta` prop and
// must not re-add per-page top padding or negative section margins.
//
// Layout contract: every page using `<Footer cta=...>` must extend its last
// section at least one card-half below its natural content so the card overlaps
// real section background (gradient, pattern, decorative SVGs), not empty body
// white. Convention: the last background element uses
// `padding-bottom: var(--spacing-section-cta)`, matching the footer's
// `padding-top`, for symmetric spacing at every breakpoint.
//
// The card container is transparent (the per-page CTA renders its own fill) and
// clips overflow to its rounded bounds.
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
          className="pointer-events-none absolute left-1/2 top-0 z-20 w-full max-w-[1152px] -translate-x-1/2 translate-y-[calc(-100%-30px)] sm:-translate-y-1/2 px-6 sm:px-10"
        >
          {/* Sizing wrapper — NO overflow:hidden so `ctaOverlay` children can
              break out of the card. Card width is capped narrower than the
              global container so it reads as a focused conversion block, not a
              section-width banner. */}
          <div
            className="pointer-events-auto relative w-full h-[350px] sm:h-[300px] lg:h-[260px]"
          >
            {/* Clipped card surface — fills the slot and clips inner content
                to the rounded box. */}
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
        {/* Large soft glow that brightens the upper-left of the footer. */}
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
        {/* Vertical glow accent on the right side. */}
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
        <div className="relative">
          <div className={`relative mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10 pb-[80px] ${hasCta ? "pt-[var(--footer-cta-pt)]" : "pt-[80px]"}`}>
            {/* Main row — three balanced zones: a brand anchor (logo with the
            social icons stacked beneath), the nav columns, and the
            right-anchored credential cluster (Awarded with / Docker verified /
            Certifications). Stacks vertically below lg; becomes a single
            edge-to-edge row at lg+. */}
            <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-x-8 xl:gap-x-12">
              {/* Brand anchor — logo over social icons. */}
              <div className="flex shrink-0 flex-col gap-7">
                <Link
                  href="/"
                  aria-label="CleanStart home"
                  className="relative block h-[32px] w-[153px] rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300/70"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/cleanstart-logo.png"
                    alt="CleanStart"
                    width={153}
                    height={32}
                    loading="eager"
                    decoding="async"
                    className="h-full w-full object-contain object-left"
                  />
                </Link>

                <ul className="flex items-center gap-[19px]" aria-label="Social media">
                  {SOCIAL_ICONS.map((s) => (
                    <li key={s.name}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.name}
                        className="cs-social-link flex h-10 w-10 items-center justify-center rounded-full text-white transition-[transform,color] duration-200 hover:scale-105 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300/70"
                        style={{
                          backgroundColor: "rgba(217, 217, 217, 0.15)",
                          backdropFilter: "blur(5px)",
                          boxShadow:
                            "inset 2.67px 2.67px 13.33px 4px rgba(168, 108, 252, 0.4)",
                          "--social-hover": s.hoverColor,
                        } as React.CSSProperties}
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

              {/* Nav columns — accordion stack on mobile, a row from sm+. */}
              <nav
                className="flex flex-col sm:flex-row sm:gap-10 lg:gap-12"
                aria-label="Footer navigation"
              >
                <FooterColumn title="Contact" links={COL_CONTACT} />
                <FooterColumn title="Solutions" links={COL_SOLUTIONS} />
                <FooterColumn title="Connect" links={COL_CONNECT} />
              </nav>

              {/* Right-anchored credential cluster — each heading centered over
              its badge(s). */}
              <div className="flex flex-wrap items-start justify-center lg:justify-end gap-x-6 gap-y-8 [--shield-scale:0.72] xl:[--shield-scale:0.85]">
                {CREDENTIALS.map((group) => (
                  <CredentialGroup key={group.title} group={group} />
                ))}
              </div>
            </div>

            {/* Bottom row — copyright (left) + legal links (right), divided
            from the nav band above. */}
            <div className="mt-[32px] flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-[24px]">
              <span
                className="text-2xs font-normal leading-[1.1] text-white/95"
                style={{ letterSpacing: "0.24px" }}
              >
                ©2026 CleanStart. All rights reserved.
              </span>

              <ul className="flex items-center gap-2 leading-none">
                {LEGAL_LINKS.map((link, i) => (
                  <React.Fragment key={link.href}>
                    <li className="flex leading-none">
                      <Link
                        href={link.href}
                        className="text-xs italic leading-[1.75] text-white transition-colors duration-200 hover:text-cyan-200 cursor-pointer"
                        style={{ letterSpacing: "0.24px" }}
                      >
                        {link.label}
                      </Link>
                    </li>
                    {i < LEGAL_LINKS.length - 1 && (
                      <li
                        aria-hidden
                        className="h-[3px] w-[3px] rounded-full bg-white/95"
                      />
                    )}
                  </React.Fragment>
                ))}
                <li
                  aria-hidden
                  className="h-[3px] w-[3px] rounded-full bg-white/95"
                />
                <li className="flex leading-none">
                  <CookiePreferencesButton
                    className="text-xs italic leading-[1.75] text-white transition-colors duration-200 hover:text-cyan-200 cursor-pointer"
                    style={{ letterSpacing: "0.24px" }}
                  />
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  // Mobile (<sm): collapsible native <details>/<summary> accordion.
  // Desktop (sm+): always-expanded column with heading + flat link list.
  return (
    <div className="sm:contents">
      {/* Mobile accordion */}
      <details className="sm:hidden border-b border-white/10 group">
        <summary
          className="flex items-center justify-between cursor-pointer list-none py-3"
        >
          <p className="font-display text-lg font-semibold leading-[1.3] tracking-[-0.04em] text-white">
            {title}
          </p>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className="text-white/70 transition-transform duration-200 group-open:rotate-180"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>
        <ul className="flex flex-col gap-3 pb-4">
          {links.map((link) => (
            <li key={link.href} className="flex leading-none">
              <a
                href={link.href}
                className="group/link inline-flex items-center gap-2 text-sm font-normal leading-[1.4] tracking-[-0.04em] text-white/85 transition-colors duration-200 hover:text-white cursor-pointer"
              >
                <span>{link.label}</span>
                <svg
                  width="10"
                  height="14"
                  viewBox="0 0 10 14"
                  fill="none"
                  aria-hidden
                  className="opacity-90 transition-transform duration-200 group-hover/link:translate-x-1"
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
      </details>

      {/* Desktop column (always expanded) */}
      <div className="hidden sm:block">
        <p className="font-display text-lg font-semibold leading-[1.3] tracking-[-0.04em] text-white">
          {title}
        </p>
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
    </div>
  );
}

// One labelled credential group: a heading centered over its badge(s) at every
// breakpoint; the parent wrapper packs the groups to the footer's right edge
// (`sm:justify-end`).
function CredentialGroup({ group }: { group: (typeof CREDENTIALS)[number] }) {
  return (
    <div className="flex flex-col gap-4 items-center">
      <p className="font-display text-lg font-semibold leading-[1.3] tracking-[-0.04em] text-white text-center">
        {group.title}
      </p>
      <div className="flex flex-wrap items-start justify-center gap-3">
        {group.badges.map((badge) => (
          <ShieldBadge key={badge.src} badge={badge} />
        ))}
      </div>
    </div>
  );
}

const BADGE_SHIELD_PATH =
  "M0 17.7C0 7.925 7.925 0 17.7 0H97.35C107.125 0 115.05 7.925 115.05 17.7V112.865C115.05 120.911 109.622 127.946 101.837 129.986L62.012 140.424C59.07 141.195 55.98 141.195 53.038 140.424L13.213 129.986C5.428 127.946 0 120.911 0 112.865V17.7Z";

// Glassy pentagonal shield housing a single credential badge image.
function ShieldBadge({ badge }: { badge: Badge }) {
  const shield: React.CSSProperties = {
    clipPath: `path('${BADGE_SHIELD_PATH}')`,
    WebkitClipPath: `path('${BADGE_SHIELD_PATH}')`,
  };
  return (
    // Outer box reserves the post-scale footprint so flex layout stays honest.
    // The inner box keeps the native 115×140 canvas the clip-path is authored
    // against, then transforms down uniformly — scaling shield + image together.
    // `--shield-scale` is set on the credentials wrapper (smaller on mobile, 1 at sm+).
    <div
      className="relative"
      title={badge.name}
      style={{
        width: "calc(115px * var(--shield-scale, 1))",
        height: "calc(140px * var(--shield-scale, 1))",
      }}
    >
      <div
        className="absolute left-0 top-0 h-[140px] w-[115px]"
        style={{
          transform: "scale(var(--shield-scale, 1))",
          transformOrigin: "top left",
        }}
      >
        {/* Glassy shield background */}
        <div
          aria-hidden
          className="absolute inset-0 backdrop-blur-md"
          style={{ ...shield, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
        />
        {/* Subtle inner highlight along the top edge for the glass feel */}
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
        {/* Badge image — centered in the upper rectangular area, above the point */}
        <div className="absolute inset-x-0 top-0 flex h-[117px] items-center justify-center px-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={badge.src}
            alt={badge.name}
            width={badge.w}
            height={badge.h}
            loading="lazy"
            decoding="async"
            className="max-h-[104px] w-auto max-w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}
