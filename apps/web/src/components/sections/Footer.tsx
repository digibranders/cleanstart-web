import React from "react";
import Link from "next/link";

import { CookiePreferencesButton } from "@/components/consent";
import { FooterSignature } from "@/components/sections/FooterSignature";

/**
 * Footer layout (top to bottom): a brand band (logo left, social icons right),
 * a nav band (Product / Solutions / Company columns left, the credential
 * cluster right, the logo mark as a watermark between them), a utility row
 * (copyright + legal links), and the signature: the wordmark at container
 * width, pinned under the body and revealed as the page ends
 * (FooterSignature).
 */

interface FooterLink {
  label: string;
  href: string;
}

const COL_PRODUCT: FooterLink[] = [
  { label: "Clean Images", href: "/cleanstart-images" },
  { label: "Clean Libraries", href: "/clean-libraries" },
  { label: "CleanSight", href: "/cleansight" },
  { label: "Impact Estimator", href: "/impact-estimator" },
  { label: "Pricing", href: "/pricing" },
  { label: "Book a Demo", href: "/book-a-demo" },
];
const COL_SOLUTIONS: FooterLink[] = [
  { label: "Vulnerability Remediation", href: "/vulnerability-remediation" },
  { label: "Attack Surface Reduction", href: "/attack-surface-reduction" },
  { label: "FIPS Compliance", href: "/fips" },
  { label: "Verifiable SBOMs", href: "/software-bill-materials" },
  { label: "For Developers", href: "/for-developers" },
  { label: "For CISO", href: "/for-ciso" },
];
const COL_COMPANY: FooterLink[] = [
  { label: "About Us", href: "/about-us" },
  { label: "Careers", href: "/careers" },
  { label: "Partners", href: "/partners" },
  { label: "Newsroom", href: "/news" },
  { label: "Events", href: "/events" },
  { label: "Contact Us", href: "/contact-us" },
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

// Credential badges render inside the glassy shield; `caption` is the short
// label shown under each shield, `name` the full accessible name.
interface Badge {
  name: string;
  caption: string;
  src: string;
  w: number;
  h: number;
}

const CREDENTIALS: Badge[] = [
  { name: "Cyber Security Excellence Awards Winner", caption: "Excellence award", src: "/images/awards/award-1.webp", w: 486, h: 616 },
  { name: "Docker Verified Publisher", caption: "Verified publisher", src: "/images/awards/award-2.webp", w: 268, h: 267 },
  { name: "AICPA SOC 2", caption: "SOC 2", src: "/images/awards/award-4.webp", w: 1024, h: 1023 },
  { name: "ISO/IEC 27001", caption: "ISO 27001", src: "/images/awards/award-3.webp", w: 200, h: 200 },
];

const LEGAL_LINKS = [
  { label: "Legal", href: "/legal" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Acceptable Use Policy", href: "/legal/acceptable-use-policy" },
];

// The shield outline in objectBoundingBox units (0..1 on both axes) so one
// clipPath scales to any shield width; the shield keeps the 115.05 x 141.195
// aspect of the original path via `aspect-ratio`, so nothing distorts.
const SHIELD_CLIP_ID = "cs-footer-shield-clip";
const SHIELD_CLIP_PATH =
  "M0 0.1254C0 0.0561 0.0689 0 0.1538 0H0.8462C0.9311 0 1 0.0561 1 0.1254V0.7994C1 0.8563 0.9528 0.9062 0.8852 0.9206L0.539 0.9945C0.5134 1 0.4866 1 0.461 0.9945L0.1148 0.9206C0.0472 0.9062 0 0.8563 0 0.7994V0.1254Z";

const LINK_CLASS =
  "whitespace-nowrap text-sm font-normal leading-[1.4] tracking-[-0.02em] text-white/70 transition-colors duration-200 hover:text-white cursor-pointer";
const HEADING_CLASS =
  "font-display whitespace-nowrap text-[15px] font-semibold leading-[1.3] tracking-[-0.02em] text-white";

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
    <footer className="cs-footer relative w-full text-white">
      {hasCta && (
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 w-full max-w-[1152px] -translate-x-1/2 translate-y-[calc(-100%-30px)] sm:-translate-y-1/2 px-6 sm:px-10">
          {/* Sizing wrapper — NO overflow:hidden so `ctaOverlay` children can
              break out of the card. Card width is capped narrower than the
              global container so it reads as a focused conversion block, not a
              section-width banner. */}
          <div className="pointer-events-auto relative w-full h-[350px] sm:h-[300px] lg:h-[260px]">
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
      <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
        <defs>
          <clipPath id={SHIELD_CLIP_ID} clipPathUnits="objectBoundingBox">
            <path d={SHIELD_CLIP_PATH} />
          </clipPath>
        </defs>
      </svg>
      {/* The body is the opaque curtain (gradient + z-index 1 in globals.css)
          that lifts off the pinned signature band below it. `overflow-clip`,
          not `hidden`: it crops the blurred glows without turning the body
          into a scroll container, which would trap the sticky band. */}
      <div className="cs-footer-body w-full overflow-clip">
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
        <div
          className={`relative mx-auto w-full max-w-[var(--container-default)] px-6 pb-8 sm:px-10 lg:pb-10 ${hasCta ? "pt-[calc(var(--footer-cta-pt)-24px)]" : "pt-12 lg:pt-14"}`}
        >
          {/* Brand band: logo left, social icons right. Wraps to two rows
              on narrow phones where both cannot share a line. */}
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-6">
            <Link
              href="/"
              aria-label="CleanStart home"
              className="relative block h-[40px] w-[191px] rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300/70"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/cleanstart-logo.png"
                alt="CleanStart"
                width={191}
                height={40}
                loading="eager"
                decoding="async"
                className="h-full w-full object-contain object-left"
              />
            </Link>

            <ul className="flex items-center gap-3" aria-label="Social media">
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
                      width="18"
                      height="18"
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

          {/* Nav band: link columns left, credential cluster right. The
              columns are max-content tracks with nowrap labels, so they never
              break a label; the cluster takes the remaining width and sizes
              its shields from that width, so it never wraps to a second row. */}
          <div className="mt-6 grid gap-y-10 border-t border-white/10 pt-8 md:grid-cols-[auto_minmax(0,1fr)] md:gap-x-8 lg:gap-x-12 lg:pt-10 xl:gap-x-16">
            <nav
              className="grid sm:grid-cols-[repeat(3,max-content)] sm:gap-x-8 lg:gap-x-10 xl:gap-x-14"
              aria-label="Footer navigation"
            >
              <FooterColumn title="Product" links={COL_PRODUCT} />
              <FooterColumn title="Solutions" links={COL_SOLUTIONS} />
              <FooterColumn title="Company" links={COL_COMPANY} />
            </nav>

            <div className="cs-footer-credentials flex md:justify-end">
              {/* Watermark: the logo mark, faint, centered in whatever space
                  is left between the nav columns and the credentials. The
                  slot sizes it from its own width and hides it when the gap
                  is too narrow to hold it (globals.css). */}
              <div className="cs-footer-watermark-slot hidden lg:flex" aria-hidden>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/footer/cleanstart-mark.svg"
                  alt=""
                  width={54}
                  height={62}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="cs-footer-watermark pointer-events-none select-none"
                />
              </div>
              <div className="flex flex-col gap-4">
                <p className={`${HEADING_CLASS} md:whitespace-normal lg:whitespace-nowrap`}>
                  Certifications and recognition
                </p>
                <ul className="grid grid-cols-4 items-start gap-[var(--cs-shield-gap)] md:grid-cols-2 lg:grid-cols-4">
                  {CREDENTIALS.map((badge) => (
                    <li
                      key={badge.src}
                      className="flex w-[var(--cs-shield-w)] flex-col items-center gap-2"
                    >
                      <ShieldBadge badge={badge} />
                      <span className="text-center text-xs leading-[1.3] text-white/60">
                        {badge.caption}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Utility row: copyright left, legal links right. */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/10 pt-6">
            <span
              className="text-xs leading-[1.4] text-white/60"
              style={{ letterSpacing: "0.12px" }}
            >
              ©2026 CleanStart. All rights reserved.
            </span>

            <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 leading-none">
              {LEGAL_LINKS.map((link, i) => (
                <React.Fragment key={link.href}>
                  <li className="flex leading-none">
                    {/* prefetch disabled: these legal links render on every
                        page, so default in-viewport prefetch fires an RSC
                        (`?_rsc=`) request site-wide — pure crawl-budget waste
                        for low-traffic policy pages. Click nav is unaffected. */}
                    <Link
                      href={link.href}
                      prefetch={false}
                      className="text-xs leading-[1.75] text-white/70 transition-colors duration-200 hover:text-white cursor-pointer"
                    >
                      {link.label}
                    </Link>
                  </li>
                  {i < LEGAL_LINKS.length - 1 && (
                    <li aria-hidden className="h-[3px] w-[3px] rounded-full bg-white/40" />
                  )}
                </React.Fragment>
              ))}
              <li aria-hidden className="h-[3px] w-[3px] rounded-full bg-white/40" />
              <li className="flex leading-none">
                <CookiePreferencesButton className="text-xs leading-[1.75] text-white/70 transition-colors duration-200 hover:text-white cursor-pointer" />
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Signature: the full vector logo at container width, pinned under
          the body and revealed as the body lifts (see FooterSignature). Purely
          decorative; the brand band above carries the accessible logo. */}
      <FooterSignature />
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
        <summary className="flex items-center justify-between cursor-pointer list-none py-3">
          <p className={HEADING_CLASS}>{title}</p>
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
              {/* `before:` expands the touch target from 19.6px (14px x 1.4,
                  no padding) to 28px, clearing the 24x24 WCAG 2.5.8 AA floor.
                  Done with an absolutely-positioned pseudo-element rather than
                  padding so the footer's visual rhythm is untouched: the list
                  uses gap-3 (12px), so 4px of overhang each side still leaves
                  4px of clearance between adjacent targets. */}
              <a
                href={link.href}
                className={`relative inline-flex items-center before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] ${LINK_CLASS}`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </details>

      {/* Desktop column (always expanded) */}
      <div className="hidden sm:block">
        <p className={HEADING_CLASS}>{title}</p>
        <ul className="mt-5 flex flex-col gap-3">
          {links.map((link) => (
            <li key={link.href} className="flex leading-none">
              <a href={link.href} className={`inline-flex items-center ${LINK_CLASS}`}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Glassy pentagonal shield housing a single credential badge image. Width comes
// from `--cs-shield-w` (set on `.cs-footer-credentials` in globals.css from the
// cluster's own inline size); the aspect ratio and the objectBoundingBox
// clipPath keep the outline exact at every size.
function ShieldBadge({ badge }: { badge: Badge }) {
  return (
    <div
      className="cs-footer-shield relative w-full"
      title={badge.name}
      style={{
        clipPath: `url(#${SHIELD_CLIP_ID})`,
        WebkitClipPath: `url(#${SHIELD_CLIP_ID})`,
      }}
    >
      {/* Glassy shield background */}
      <div
        aria-hidden
        className="absolute inset-0 backdrop-blur-md"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
      />
      {/* Subtle inner highlight along the top edge for the glass feel */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 35%)",
          mixBlendMode: "screen",
        }}
      />
      {/* Badge image, centered in the rectangular area above the point. */}
      <div className="absolute inset-x-0 top-0 flex h-[83%] items-center justify-center px-[5%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={badge.src}
          alt={badge.name}
          width={badge.w}
          height={badge.h}
          loading="lazy"
          decoding="async"
          className="max-h-[88%] w-auto max-w-full object-contain"
        />
      </div>
    </div>
  );
}
