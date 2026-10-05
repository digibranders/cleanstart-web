"use client";

import { AnimatePresence, LayoutGroup, motion, useSpring, useTransform } from "motion/react";
import type React from "react";
import { useState } from "react";

import type { BlogCtaSet, BlogCtaStage } from "@/lib/blog-cta/types";
import { EASE_OUT } from "@/lib/motion";
import { useHydratedReducedMotion } from "@/lib/use-hydrated-reduced-motion";

import { type CtaCardContext, ExploreCard, LearnCard, ProveCard, preloadResourceCover } from "./BlogCtaCards";
import { useArticleProgress } from "./useArticleProgress";

const STEP_LABEL: Record<BlogCtaStage, string> = {
  explore: "Explore",
  learn: "Learn",
  prove: "Prove",
};

/**
 * Intent Ladder: one sticky card beside the article that climbs from the
 * lightest ask (the catalog image the article is about) to the gated resource
 * to the POC as the reader gets deeper. The step control shows where the
 * reader is and lets them jump; a jump holds until the next threshold.
 */
export function BlogCtaLadder({
  ctas,
  readingMinutes,
}: {
  ctas: BlogCtaSet;
  readingMinutes?: number | undefined;
}): React.ReactElement {
  const reduce = useHydratedReducedMotion();
  const { progress, stage: autoStage } = useArticleProgress();
  const [pinned, setPinned] = useState<BlogCtaStage | null>(null);
  const [lastAuto, setLastAuto] = useState<BlogCtaStage>(autoStage);
  if (autoStage !== lastAuto) {
    setLastAuto(autoStage);
    setPinned(null);
  }

  if (ctas.learn) preloadResourceCover(ctas.learn.coverUrl);

  const steps: BlogCtaStage[] = ctas.learn ? ["explore", "learn", "prove"] : ["explore", "prove"];
  const auto = steps.includes(autoStage) ? autoStage : "explore";
  const active = pinned ?? auto;

  const fill = useSpring(progress, { stiffness: 140, damping: 28, mass: 0.4 });
  const remaining = useTransform(progress, (p) => {
    if (p >= 1) return "Finished";
    if (!readingMinutes) return `${Math.round(p * 100)}% read`;
    return `${Math.max(1, Math.ceil(readingMinutes * (1 - p)))} min left`;
  });

  const context: CtaCardContext = { slug: ctas.slug, layout: "ladder", placement: "rail", progress };

  let card: React.ReactElement;
  if (active === "learn" && ctas.learn) card = <LearnCard cta={ctas.learn} context={context} />;
  else if (active === "prove") card = <ProveCard cta={ctas.prove} context={context} />;
  else card = <ExploreCard cta={ctas.explore} context={context} />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-baseline justify-between" style={{ fontSize: "var(--fs-caption)" }}>
          <span style={{ color: "rgba(17,17,17,0.66)", fontWeight: 500 }}>Reading</span>
          <motion.span className="tabular-nums" style={{ color: "rgba(17,17,17,0.72)", fontWeight: 500 }}>
            {remaining}
          </motion.span>
        </div>
        <div className="mt-2 h-[3px] overflow-hidden rounded-full" style={{ background: "rgba(17,17,17,0.08)" }}>
          <motion.div
            className="h-full origin-left rounded-full"
            style={{ scaleX: reduce ? progress : fill, background: "linear-gradient(90deg, #4A3BF1 0%, #A974FF 100%)" }}
          />
        </div>
      </div>

      <LayoutGroup id="blog-cta-ladder-steps">
        <fieldset
          className="m-0 grid min-w-0 gap-1 rounded-full p-1"
          style={{
            gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
            background: "rgba(74, 59, 241, 0.06)",
            border: "1px solid rgba(74, 59, 241, 0.08)",
          }}
        >
          <legend className="sr-only">Choose a next step</legend>
          {steps.map((s) => {
            const isActive = s === active;
            const isPast = steps.indexOf(s) < steps.indexOf(active);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={isActive}
                onClick={() => setPinned(s)}
                className="relative h-8 rounded-full transition-colors duration-200"
                style={{
                  fontSize: "var(--fs-caption)",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#111" : isPast ? "#4A3BF1" : "rgba(17,17,17,0.66)",
                }}
              >
                {isActive ? (
                  <motion.span
                    layoutId="blog-cta-ladder-thumb"
                    className="absolute inset-0 rounded-full bg-white"
                    style={{ boxShadow: "0 4px 12px -6px rgba(49,27,146,0.45), 0 0 0 1px rgba(74,59,241,0.10)" }}
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <span className="relative">{STEP_LABEL[s]}</span>
              </button>
            );
          })}
        </fieldset>
      </LayoutGroup>

      <div className="relative">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={active}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.97, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.97, filter: "blur(8px)" }}
            transition={{ duration: reduce ? 0.15 : 0.5, ease: EASE_OUT }}
          >
            {card}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
