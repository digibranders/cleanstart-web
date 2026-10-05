"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useEffect, useState } from "react";

import { withDemoSource } from "@/lib/blog-cta/demo-link";
import { trackBlogCta } from "@/lib/blog-cta/track";
import type { BlogCtaLayout, BlogCtaSet, BlogCtaStage } from "@/lib/blog-cta/types";
import { useHydratedReducedMotion } from "@/lib/use-hydrated-reduced-motion";

import { DARK_BAND } from "./BlogCtaCards";
import { useArticleProgress } from "./useArticleProgress";

const DISMISS_KEY = "cs-blog-cta-bar-dismissed";
/** The bar waits until the reader has committed to the article. */
const SHOW_FROM = 0.2;

function readDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  try {
    window.sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // Storage blocked (private mode): the bar still hides for this page view.
  }
}

interface BarContent {
  stage: BlogCtaStage;
  visual: React.ReactNode;
  title: React.ReactNode;
  subtitle: string;
  action: string;
  href: string;
  external: boolean;
  resourceSlug?: string | undefined;
}

function contentFor(stage: BlogCtaStage, ctas: BlogCtaSet, layout: BlogCtaLayout): BarContent {
  if (stage === "learn" && ctas.learn) {
    const r = ctas.learn;
    return {
      stage,
      visual: (
        <span className="relative block h-10 w-[70px] shrink-0 overflow-hidden rounded-[8px] bg-white/10">
          <Image src={r.coverUrl} alt="" fill sizes="70px" className="object-cover" />
        </span>
      ),
      title: r.title,
      subtitle: r.gated ? `${r.typeLabel}, free download` : r.typeLabel,
      action: "Get it",
      href: r.href,
      external: false,
      resourceSlug: r.slug,
    };
  }
  if (stage === "explore") {
    const e = ctas.explore;
    const visual = (
      <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={e.kind === "image" ? e.logoUrl : (e.featured[0]?.logoUrl ?? "/images/security/cs-logomark.svg")}
          alt=""
          width={24}
          height={24}
          loading="lazy"
          decoding="async"
          style={{ width: 24, height: 24, objectFit: "contain" }}
        />
      </span>
    );
    return e.kind === "image"
      ? {
          stage,
          visual,
          title: <span style={{ fontFamily: "var(--font-mono)" }}>{e.name}</span>,
          subtitle: "Hardened image in the CleanStart catalog",
          action: "View",
          href: e.href,
          external: true,
        }
      : {
          stage,
          visual,
          title: e.imageCount ? `${e.imageCount} hardened images` : "Hardened image catalog",
          subtitle: "Drop-in replacements for your base images",
          action: "Browse",
          href: e.href,
          external: true,
        };
  }
  return {
    stage: "prove",
    visual: (
      <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/security/cs-logomark.svg" alt="" width={20} height={23} loading="lazy" decoding="async" />
      </span>
    ),
    title: ctas.prove.label,
    subtitle: "Prove it on your own workloads",
    action: "Book",
    href: withDemoSource(ctas.prove.href, { slug: ctas.slug, layout, placement: "bar" }),
    external: false,
  };
}

/**
 * The narrow-screen form of the blog CTAs: one line, docked to the bottom,
 * showing whichever ask fits the reader's depth. Appears after 20% of the
 * article, leaves at the end, and stays gone for the session once dismissed.
 */
export function BlogCtaBottomBar({
  ctas,
  layout,
  className,
}: {
  ctas: BlogCtaSet;
  layout: BlogCtaLayout;
  /** Breakpoint utility that hides the bar where the rail takes over, e.g. `xl:hidden`. */
  className: string;
}): React.ReactElement {
  const reduce = useHydratedReducedMotion();
  const { progress, stage } = useArticleProgress();
  const [inRange, setInRange] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => setDismissed(readDismissed()), []);
  useMotionValueEvent(progress, "change", (p) => setInRange(p >= SHOW_FROM && p < 1));

  const content = contentFor(stage, ctas, layout);
  const onAction = (): void =>
    trackBlogCta({ layout, placement: "bar", stage: content.stage, slug: ctas.slug, resourceSlug: content.resourceSlug });
  const onDismiss = (): void => {
    writeDismissed();
    setDismissed(true);
  };

  const linkClass = "cs-btn-glass shrink-0";
  const linkStyle = { ["--cs-btn-h" as string]: "40px", ["--cs-btn-px" as string]: "16px" };

  return (
    <AnimatePresence>
      {inRange && !dismissed ? (
        <motion.aside
          aria-label="Suggested next step"
          className={`fixed inset-x-3 z-40 mx-auto max-w-[560px] ${className}`}
          style={{ bottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 48 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
        >
          <div
            className="flex items-center gap-3 rounded-[18px] py-2.5 pr-2.5 pl-3 text-white"
            style={{ background: DARK_BAND, boxShadow: "0 18px 40px -16px rgba(19, 30, 143, 0.7)" }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={content.stage}
                className="flex min-w-0 flex-1 items-center gap-3"
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
              >
                {content.visual}
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "var(--fs-body-sm)" }}
                  >
                    {content.title}
                  </span>
                  <span className="block truncate" style={{ fontSize: "var(--fs-badge)", color: "rgba(255,255,255,0.72)" }}>
                    {content.subtitle}
                  </span>
                </span>
                {content.external ? (
                  <a
                    href={content.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onAction}
                    className={linkClass}
                    style={linkStyle}
                  >
                    {content.action}
                  </a>
                ) : (
                  <Link href={content.href} onClick={onAction} className={linkClass} style={linkStyle}>
                    {content.action}
                  </Link>
                )}
              </motion.div>
            </AnimatePresence>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="grid size-9 shrink-0 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X aria-hidden size={16} strokeWidth={2} />
            </button>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
