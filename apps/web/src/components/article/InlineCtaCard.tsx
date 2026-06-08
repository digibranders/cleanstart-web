import Link from "next/link";
import type React from "react";

export interface InlineCtaCardProps {
  heading: string;
  buttonLabel: string;
  buttonUrl: string;
  variant?: "soft" | "solid";
}

/**
 * Inline call-to-action card rendered from an `inlineCta` Lexical block inside
 * `.article-body`. Built from the site's existing button system — `.cs-btn-blue`
 * on the soft (light) panel, `.cs-btn-glass` on the solid (dark) panel — so it
 * inherits the design-system CTA language rather than the legacy Webflow look.
 * Panel + layout styles live in the `.article-cta` scope in globals.css.
 */
export function InlineCtaCard({
  heading,
  buttonLabel,
  buttonUrl,
  variant = "soft",
}: InlineCtaCardProps): React.ReactElement | null {
  if (!heading && !buttonLabel) return null;

  const href = buttonUrl?.trim() || "#";
  const isExternal = href.startsWith("http");
  const buttonClass = variant === "solid" ? "cs-btn-glass" : "cs-btn-blue";

  const button = isExternal ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${buttonClass} article-cta__button`}
    >
      {buttonLabel}
    </a>
  ) : (
    <Link href={href} className={`${buttonClass} article-cta__button`}>
      {buttonLabel}
    </Link>
  );

  return (
    <div className={`article-cta article-cta--${variant}`}>
      {heading ? <p className="article-cta__heading">{heading}</p> : null}
      {buttonLabel ? button : null}
    </div>
  );
}
