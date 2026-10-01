"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";

import { trackBlogCta } from "@/lib/blog-cta/track";
import type { BlogCtaSet, BlogCtaStage } from "@/lib/blog-cta/types";
import { EASE_OUT } from "@/lib/motion";
import { useHydratedReducedMotion } from "@/lib/use-hydrated-reduced-motion";

import {
  type CtaCardContext,
  DARK_BAND,
  ExploreCard,
  LearnCard,
  ProveCard,
  preloadResourceCover,
} from "./BlogCtaCards";
import { useArticleProgress } from "./useArticleProgress";

const RING_R = 17;
const RING_C = 2 * Math.PI * RING_R;
/** How long a nudge stays out before tucking back into the tab. */
const NUDGE_MS = 8000;
const SPRING = { type: "spring", stiffness: 340, damping: 32 } as const;

function Nudge({
  stage,
  ctas,
  onOpen,
  onClose,
}: {
  stage: BlogCtaStage;
  ctas: BlogCtaSet;
  onOpen: () => void;
  onClose: () => void;
}): React.ReactElement | null {
  const learn = stage === "learn" ? ctas.learn : null;
  if (stage === "learn" && !learn) return null;

  const onClick = (): void =>
    trackBlogCta({
      layout: "dock",
      placement: "dock",
      stage,
      slug: ctas.slug,
      resourceSlug: learn?.slug,
    });

  const buttonStyle = { ["--cs-btn-h" as string]: "38px", ["--cs-btn-fs" as string]: "var(--fs-button-sm)" };

  return (
    <div
      className="relative w-[216px] overflow-hidden rounded-[18px] bg-white p-3"
      style={{ border: "1px solid rgba(17,17,17,0.08)", boxShadow: "0 24px 50px -24px rgba(49,27,146,0.55)" }}
    >
      {learn ? (
        <span className="relative block aspect-[16/9] w-full overflow-hidden rounded-[10px] bg-[#dfe9f5]">
          <Image src={learn.coverUrl} alt="" fill sizes="192px" className="object-cover" />
        </span>
      ) : (
        <span className="relative grid aspect-[16/9] w-full place-items-center overflow-hidden rounded-[10px]" style={{ background: DARK_BAND }}>
          <Image src="/images/blog-detail/cta/cta-cube.webp" alt="" width={72} height={72} sizes="72px" className="opacity-90" />
        </span>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss suggestion"
        className="absolute top-4 right-4 grid size-7 place-items-center rounded-full bg-white/85 text-[rgba(17,17,17,0.6)] backdrop-blur transition-colors hover:bg-white hover:text-[#111]"
      >
        <X aria-hidden size={14} strokeWidth={2} />
      </button>
      <span className="mt-3 block px-1" style={{ fontSize: "var(--fs-badge)", fontWeight: 600, color: "#4A3BF1" }}>
        {learn ? `${learn.typeLabel} for this topic` : "Free proof of concept"}
      </span>
      <span
        className="mt-0.5 line-clamp-2 block px-1"
        style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "var(--fs-body-sm)", lineHeight: 1.3 }}
      >
        {learn ? learn.title : "Ready to try it on your own images?"}
      </span>
      <Link
        href={learn ? learn.href : ctas.prove.href}
        onClick={onClick}
        className="cs-btn-blue mt-3 w-full"
        style={buttonStyle}
      >
        {learn ? learn.ctaLabel : ctas.prove.label}
      </Link>
      <button
        type="button"
        onClick={onOpen}
        className="mt-1 h-9 w-full rounded-[8px] transition-colors hover:bg-[rgba(74,59,241,0.08)]"
        style={{ fontSize: "var(--fs-caption)", fontWeight: 500, color: "#4A3BF1" }}
      >
        See all next steps
      </button>
    </div>
  );
}

/**
 * Edge Dock: a tab docked to the right wall of the browser, ringed by reading
 * progress. It opens a side panel holding all three asks, and at 35% and 75%
 * of the article it slides a short suggestion out for a few seconds. Nothing
 * covers the article unless the reader asks for it.
 */
export function BlogCtaDock({ ctas }: { ctas: BlogCtaSet }): React.ReactElement {
  const reduce = useHydratedReducedMotion();
  const { progress, stage } = useArticleProgress();
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState<BlogCtaStage | null>(null);
  const [nudged, setNudged] = useState<ReadonlySet<BlogCtaStage>>(new Set());
  const [nudgeHovered, setNudgeHovered] = useState(false);
  const tabRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();

  if (ctas.learn) preloadResourceCover(ctas.learn.coverUrl);

  const ring = useSpring(progress, { stiffness: 120, damping: 26 });
  const dashOffset = useTransform(reduce ? progress : ring, (p) => RING_C * (1 - p));

  // One nudge per threshold per page view, never while the panel is open.
  const nudgeable = stage === "prove" || (stage === "learn" && ctas.learn !== null);
  if (nudgeable && !nudged.has(stage) && !open) {
    setNudged(new Set([...nudged, stage]));
    setNudge(stage);
  }

  useEffect(() => {
    if (!nudge || nudgeHovered) return;
    const t = window.setTimeout(() => setNudge(null), NUDGE_MS);
    return () => window.clearTimeout(t);
  }, [nudge, nudgeHovered]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent): void => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || tabRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const openPanel = (): void => {
    setNudge(null);
    setOpen(true);
  };
  const closePanel = (): void => {
    setOpen(false);
    tabRef.current?.focus({ preventScroll: true });
  };

  const context: CtaCardContext = { slug: ctas.slug, layout: "dock", placement: "dock", progress };

  return (
    <div className="hidden md:block">
      {/* Tab on the right wall. It bleeds 12px past the edge so the hover nudge never opens a gap. */}
      <motion.button
        ref={tabRef}
        type="button"
        data-cta-dock-tab
        onClick={() => (open ? closePanel() : openPanel())}
        aria-expanded={open}
        aria-controls={`${titleId}-panel`}
        className="fixed -right-3 z-40 flex flex-col items-center gap-3 rounded-l-[16px] py-3 pr-5 pl-2.5 text-white"
        style={{
          top: "50%",
          background: DARK_BAND,
          boxShadow: "-10px 14px 34px -14px rgba(19,30,143,0.65), inset 1px 1px 0 rgba(255,255,255,0.12)",
        }}
        initial={false}
        animate={{ y: "-50%", x: open ? -380 : 0 }}
        {...(reduce || open ? {} : { whileHover: { x: -4 } })}
        transition={reduce ? { duration: 0 } : SPRING}
      >
        <span className="relative grid size-9 place-items-center">
          <svg aria-hidden viewBox="0 0 40 40" className="absolute inset-0 -rotate-90" width={36} height={36}>
            <circle cx="20" cy="20" r={RING_R} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="2.5" />
            <motion.circle
              cx="20"
              cy="20"
              r={RING_R}
              fill="none"
              stroke="#2CC1EB"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              style={{ strokeDashoffset: dashOffset }}
            />
          </svg>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/security/cs-logomark.svg" alt="" width={16} height={18} className="relative" />
        </span>
        <span
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "var(--fs-caption)",
            letterSpacing: "0.02em",
          }}
        >
          {open ? "Close" : "Free POC"}
        </span>
      </motion.button>

      {/* Nudge that slides out of the tab at reading thresholds */}
      <AnimatePresence>
        {nudge && !open ? (
          <motion.aside
            key={nudge}
            aria-label="Suggestion"
            className="fixed right-[62px] z-40"
            style={{ top: "50%" }}
            initial={reduce ? { opacity: 0, y: "-50%" } : { opacity: 0, x: 40, y: "-50%", scale: 0.96 }}
            animate={{ opacity: 1, x: 0, y: "-50%", scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: 40, scale: 0.96 }}
            transition={reduce ? { duration: 0.15 } : SPRING}
            onPointerEnter={() => setNudgeHovered(true)}
            onPointerLeave={() => setNudgeHovered(false)}
          >
            <Nudge stage={nudge} ctas={ctas} onOpen={openPanel} onClose={() => setNudge(null)} />
          </motion.aside>
        ) : null}
      </AnimatePresence>

      {/* Side panel with all three asks */}
      <AnimatePresence>
        {open ? (
          <motion.aside
            ref={panelRef}
            id={`${titleId}-panel`}
            aria-labelledby={titleId}
            className="fixed right-0 z-40 flex w-[380px] flex-col overflow-hidden rounded-l-[24px] bg-[#F7F6FC]"
            style={{
              top: "calc(var(--cs-header-h) + 12px)",
              bottom: 12,
              boxShadow: "-30px 0 60px -30px rgba(19,30,143,0.55), inset 1px 0 0 rgba(74,59,241,0.10)",
            }}
            initial={reduce ? { opacity: 0 } : { x: 400 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { x: 400 }}
            transition={reduce ? { duration: 0.15 } : SPRING}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <h2
                id={titleId}
                style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "var(--fs-h5)", letterSpacing: "-0.01em" }}
              >
                Go further with CleanStart
              </h2>
              <button
                type="button"
                onClick={closePanel}
                aria-label="Close"
                className="grid size-9 place-items-center rounded-full text-[rgba(17,17,17,0.6)] transition-colors hover:bg-[rgba(17,17,17,0.06)] hover:text-[#111]"
              >
                <X aria-hidden size={18} strokeWidth={2} />
              </button>
            </div>
            <motion.div
              className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6"
              style={{ overscrollBehavior: "contain" }}
              initial="hidden"
              animate="shown"
              variants={{ shown: { transition: { staggerChildren: reduce ? 0 : 0.07, delayChildren: reduce ? 0 : 0.12 } } }}
            >
              {[
                <ProveCard key="prove" cta={ctas.prove} context={context} />,
                ...(ctas.learn ? [<LearnCard key="learn" cta={ctas.learn} context={context} />] : []),
                <ExploreCard key="explore" cta={ctas.explore} context={context} />,
              ].map((card) => (
                <motion.div
                  key={card.key}
                  variants={{
                    hidden: reduce ? { opacity: 0 } : { opacity: 0, x: 24 },
                    shown: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE_OUT } },
                  }}
                >
                  {card}
                </motion.div>
              ))}
            </motion.div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
