"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";

import type { BlogCtaSet, BlogCtaStage } from "@/lib/blog-cta/types";
import { useHydratedReducedMotion } from "@/lib/use-hydrated-reduced-motion";

import { type CtaCardContext, ExploreCard, LearnCard, ProveCard } from "./BlogCtaCards";
import { useArticleProgress } from "./useArticleProgress";

const STEP_LABEL: Record<BlogCtaStage, string> = {
  explore: "Explore",
  learn: "Learn",
  prove: "Prove",
};

function remainingLabel(progress: number, readingMinutes: number | undefined): string {
  if (progress >= 1) return "Finished";
  if (!readingMinutes) return `${Math.round(progress * 100)}% read`;
  return `${Math.max(1, Math.ceil(readingMinutes * (1 - progress)))} min left`;
}

/**
 * Intent Ladder: one sticky card beside the article that climbs from the
 * lightest ask (the catalog image the article is about) to the gated resource
 * to the POC as the reader gets deeper. The step control shows where the
 * reader is and lets them jump; a jump holds until the next threshold.
 *
 * All the cards are mounted and stacked in one grid cell, and CSS crossfades
 * between them. That keeps the rail at one height as the card changes, keeps
 * the Learn cover loaded before it is needed, and needs no animation library.
 */
export function BlogCtaLadder({
  ctas,
  readingMinutes,
}: {
  ctas: BlogCtaSet;
  readingMinutes?: number | undefined;
}): React.ReactElement {
  const reduce = useHydratedReducedMotion();
  const { stage: autoStage, subscribe } = useArticleProgress();
  const [pinned, setPinned] = useState<BlogCtaStage | null>(null);
  const [lastAuto, setLastAuto] = useState<BlogCtaStage>(autoStage);
  if (autoStage !== lastAuto) {
    setLastAuto(autoStage);
    setPinned(null);
  }

  const steps: BlogCtaStage[] = ctas.learn ? ["explore", "learn", "prove"] : ["explore", "prove"];
  const auto = steps.includes(autoStage) ? autoStage : "explore";
  const active = pinned ?? auto;

  // The bar and its label follow scroll through direct writes, not React state.
  const fillRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  useEffect(
    () =>
      subscribe((p) => {
        if (fillRef.current) fillRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
        if (labelRef.current) labelRef.current.textContent = remainingLabel(p, readingMinutes);
      }),
    [subscribe, readingMinutes],
  );

  const context: CtaCardContext = { slug: ctas.slug, layout: "ladder", placement: "rail", subscribe };

  const cards: ReadonlyArray<{ stage: BlogCtaStage; node: React.ReactElement }> = [
    { stage: "explore", node: <ExploreCard cta={ctas.explore} context={context} /> },
    ...(ctas.learn ? [{ stage: "learn" as const, node: <LearnCard cta={ctas.learn} context={context} /> }] : []),
    { stage: "prove", node: <ProveCard cta={ctas.prove} context={context} /> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-baseline justify-between" style={{ fontSize: "var(--fs-caption)" }}>
          <span style={{ color: "rgba(17,17,17,0.66)", fontWeight: 500 }}>Reading</span>
          <span ref={labelRef} className="tabular-nums" style={{ color: "rgba(17,17,17,0.72)", fontWeight: 500 }}>
            {remainingLabel(0, readingMinutes)}
          </span>
        </div>
        <div className="mt-2 h-[3px] overflow-hidden rounded-full" style={{ background: "rgba(17,17,17,0.08)" }}>
          <div
            ref={fillRef}
            className="h-full origin-left rounded-full"
            style={{ transform: "scaleX(0)", background: "linear-gradient(90deg, #4A3BF1 0%, #A974FF 100%)" }}
          />
        </div>
      </div>

      <fieldset
        className="relative m-0 grid min-w-0 gap-1 rounded-full p-1"
        style={{
          gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
          background: "rgba(74, 59, 241, 0.06)",
          border: "1px solid rgba(74, 59, 241, 0.08)",
        }}
      >
        <legend className="sr-only">Choose a next step</legend>
        <span
          aria-hidden
          className="absolute top-1 bottom-1 left-1 rounded-full bg-white"
          style={{
            width: `calc((100% - ${(steps.length - 1) * 4 + 8}px) / ${steps.length})`,
            transform: `translateX(calc(${steps.indexOf(active)} * (100% + 4px)))`,
            transition: reduce ? "none" : "transform 380ms cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 4px 12px -6px rgba(49,27,146,0.45), 0 0 0 1px rgba(74,59,241,0.10)",
          }}
        />
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
              <span className="relative">{STEP_LABEL[s]}</span>
            </button>
          );
        })}
      </fieldset>

      <div className="grid">
        {cards.map(({ stage, node }) => {
          const isActive = stage === active;
          return (
            <div
              key={stage}
              inert={!isActive}
              className={`col-start-1 row-start-1 transition-[opacity,transform,filter,visibility] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                isActive
                  ? "visible translate-y-0 scale-100 opacity-100 blur-0"
                  : "invisible translate-y-4 scale-[0.97] opacity-0 blur-[8px]"
              }`}
            >
              {node}
            </div>
          );
        })}
      </div>
    </div>
  );
}
