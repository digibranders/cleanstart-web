"use client";

import { motion } from "motion/react";
import type React from "react";
import { useMemo, useState } from "react";

import type { BlogCtaSet, BlogCtaStage } from "@/lib/blog-cta/types";
import { useHydratedReducedMotion } from "@/lib/use-hydrated-reduced-motion";

import { type CtaCardContext, ExploreCard, LearnCard, ProveCard, preloadResourceCover } from "./BlogCtaCards";
import { useArticleProgress } from "./useArticleProgress";

/** How much of each card behind the front one shows, collapsed and fanned. */
const PEEK_COLLAPSED = 46;
const PEEK_FANNED = 108;
/** Used until a card has been measured. */
const FALLBACK_HEIGHT = 360;
const SPRING = { type: "spring", stiffness: 380, damping: 34, mass: 0.8 } as const;

function PeekLabel({ stage, ctas }: { stage: BlogCtaStage; ctas: BlogCtaSet }): React.ReactElement {
  const dark = stage === "prove";
  const base: React.CSSProperties = { fontSize: "var(--fs-caption)", lineHeight: 1.3 };
  let content: React.ReactNode;
  if (stage === "prove") {
    content = (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/security/cs-logomark.svg" alt="" width={14} height={16} />
        <span style={{ fontWeight: 600 }}>{ctas.prove.label}</span>
      </>
    );
  } else if (stage === "learn" && ctas.learn) {
    content = (
      <>
        <span style={{ fontWeight: 600, color: "#4A3BF1" }}>{ctas.learn.typeLabel}</span>
        <span className="min-w-0 truncate" style={{ color: "rgba(17,17,17,0.7)" }}>
          {ctas.learn.title}
        </span>
      </>
    );
  } else {
    const e = ctas.explore;
    content =
      e.kind === "image" ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={e.logoUrl} alt="" width={16} height={16} style={{ width: 16, height: 16, objectFit: "contain" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{e.name}</span>
          <span style={{ color: "rgba(17,17,17,0.6)" }}>Hardened image</span>
        </>
      ) : (
        <>
          <span style={{ fontWeight: 600, color: "#4A3BF1" }}>Catalog</span>
          <span style={{ color: "rgba(17,17,17,0.7)" }}>
            {e.imageCount ? `${e.imageCount} hardened images` : "Hardened images"}
          </span>
        </>
      );
  }
  return (
    <span
      className="flex h-[46px] items-center gap-2 rounded-t-[20px] px-5"
      style={{ ...base, color: dark ? "#fff" : "#111" }}
    >
      {content}
    </span>
  );
}

const LABEL_TEXT: Record<BlogCtaStage, string> = {
  explore: "the hardened image",
  learn: "the related resource",
  prove: "the free POC",
};

/**
 * Stack: all three asks held as a wallet-style deck beside the article, the
 * POC on top. The cards behind show a labelled edge; hovering or tabbing into
 * the deck fans them out, and clicking an edge brings that card to the front.
 */
export function BlogCtaStack({ ctas }: { ctas: BlogCtaSet }): React.ReactElement {
  const reduce = useHydratedReducedMotion();
  const { progress } = useArticleProgress();
  const initial: BlogCtaStage[] = ctas.learn ? ["prove", "learn", "explore"] : ["prove", "explore"];
  const [order, setOrder] = useState<BlogCtaStage[]>(initial);
  const [fanned, setFanned] = useState(false);
  const [heights, setHeights] = useState<Partial<Record<BlogCtaStage, number>>>({});

  if (ctas.learn) preloadResourceCover(ctas.learn.coverUrl);

  const measureRefs = useMemo(() => {
    const make =
      (stage: BlogCtaStage) =>
      (el: HTMLDivElement | null): (() => void) | undefined => {
        if (!el) return undefined;
        const observer = new ResizeObserver(() => {
          const h = el.offsetHeight;
          setHeights((prev) => (prev[stage] === h ? prev : { ...prev, [stage]: h }));
        });
        observer.observe(el);
        return () => observer.disconnect();
      };
    return { explore: make("explore"), learn: make("learn"), prove: make("prove") };
  }, []);

  const context: CtaCardContext = { slug: ctas.slug, layout: "stack", placement: "rail", progress };
  const cardFor = (stage: BlogCtaStage): React.ReactElement => {
    if (stage === "learn" && ctas.learn) return <LearnCard cta={ctas.learn} context={context} />;
    if (stage === "prove") return <ProveCard cta={ctas.prove} context={context} />;
    return <ExploreCard cta={ctas.explore} context={context} />;
  };

  const n = order.length;
  const peek = fanned ? PEEK_FANNED : PEEK_COLLAPSED;
  const front = order[0] ?? "prove";
  const deckHeight = peek * (n - 1) + (heights[front] ?? FALLBACK_HEIGHT);

  const bringToFront = (stage: BlogCtaStage): void => {
    setOrder((prev) => [stage, ...prev.filter((s) => s !== stage)]);
  };

  const onBlurCapture = (e: React.FocusEvent<HTMLDivElement>): void => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFanned(false);
  };

  return (
    <motion.div
      data-cta-deck
      className="relative"
      initial={false}
      animate={{ height: deckHeight }}
      transition={reduce ? { duration: 0 } : SPRING}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setFanned(true);
      }}
      onPointerLeave={() => setFanned(false)}
      onFocusCapture={() => setFanned(true)}
      onBlurCapture={onBlurCapture}
    >
      {order.map((stage, i) => {
        const isFront = i === 0;
        const depth = i;
        const y = peek * (n - 1 - depth);
        const scale = 1 - depth * (fanned ? 0.025 : 0.05);
        // A card behind the front one is cut off where the deck ends, so a
        // taller card never pokes out below the front card.
        const visibleHeight = isFront ? undefined : Math.max(peek, (deckHeight - y) / scale - 6);
        return (
          <motion.div
            key={stage}
            className="absolute inset-x-0 top-0"
            style={{ zIndex: n - depth, transformOrigin: "50% 0%" }}
            initial={false}
            animate={{
              y,
              scale,
              filter: isFront ? "brightness(1)" : `brightness(${fanned ? 0.99 : 0.96})`,
            }}
            transition={reduce ? { duration: 0 } : SPRING}
          >
            <div className="overflow-hidden rounded-[20px]" style={{ maxHeight: visibleHeight }}>
              <div ref={measureRefs[stage]} inert={!isFront}>
                {cardFor(stage)}
              </div>
            </div>
            {isFront ? null : (
              <button
                type="button"
                onClick={() => bringToFront(stage)}
                aria-label={`Show ${LABEL_TEXT[stage]}`}
                className="absolute inset-x-0 top-0 cursor-pointer rounded-t-[20px] text-left"
                style={{ height: peek }}
              >
                <motion.span
                  aria-hidden
                  className="block h-[54px] overflow-hidden rounded-t-[20px]"
                  initial={false}
                  animate={{ opacity: fanned ? 0 : 1 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    background: stage === "prove" ? "#1A1446" : "#ffffff",
                    borderBottom: stage === "prove" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(17,17,17,0.06)",
                  }}
                >
                  <PeekLabel stage={stage} ctas={ctas} />
                </motion.span>
              </button>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
