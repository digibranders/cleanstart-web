"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { RenderLexical } from "@/lib/renderLexical";
import type { LexicalRoot, TocEntry, BlogImage } from "@/lib/blog";

interface BlogDetailContentProps {
  body?: LexicalRoot | null | undefined;
  tableOfContents?: TocEntry[] | null | undefined;
  heroImage?: BlogImage | undefined;
  abstract?: string | undefined;
}

export function BlogDetailContent({
  body,
  tableOfContents,
  heroImage: _heroImage,
  abstract,
}: BlogDetailContentProps): React.ReactElement {
  return (
    <section className="relative w-full bg-white overflow-clip" data-section="BlogDetailContent">
      {/* Subtle decorative blobs — keep visual continuity from hero */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: "-480px",
          top: "-360px",
          width: "1000px",
          height: "1000px",
          background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(100,13,251,0.05) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          right: "-300px",
          bottom: "200px",
          width: "900px",
          height: "900px",
          background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(100,13,251,0.04) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/*
        Layout: max-w-[1120px] outer
        TOC sidebar 260px | gap 48px | content max-w-[680px]
        Leaves natural right breathing room at wide viewports.
        ~680px body column = ~72 chars at 18px — optimal reading line length.
      */}
      <div className="relative mx-auto max-w-[1120px] px-6">
        <div className="relative flex gap-12 pt-16 pb-28">

          {/* ── LEFT: Table of Contents (sticky below header) ── */}
          <aside className="hidden lg:block shrink-0" style={{ width: "260px" }}>
            <div
              className="sticky"
              style={{ top: "96px", maxHeight: "calc(100vh - 112px)", overflowY: "auto" }}
            >
              <TableOfContents toc={tableOfContents} />
            </div>
          </aside>

          {/* ── CENTER: Article body ── */}
          {/* mx-auto centers the column when the xl TOC sidebar is hidden; xl:mx-0 resets it once the sidebar is visible */}
          <article className="min-w-0 flex-1 mx-auto lg:mx-0" style={{ maxWidth: "680px" }}>
            {abstract && (
              <p
                className="mb-8 text-[clamp(1rem,1.2vw,1.125rem)] leading-[1.7] tracking-[-0.01em]"
                style={{
                  color: "rgba(17,17,17,0.65)",
                  borderLeft: "3px solid #4a3bf1",
                  paddingLeft: "16px",
                }}
              >
                {abstract}
              </p>
            )}

            <div className="article-body">
              <RenderLexical content={body} />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ─── Table of Contents ─────────────────────────────────────────────────── */

const HEADER_OFFSET = 88; // fixed header height (72px) + 16px buffer

type RenderedTocEntry = TocEntry & { level: number; text: string };

function TableOfContents({ toc }: { toc?: TocEntry[] | null | undefined }): React.ReactElement | null {
  // Track by index across all rendered heading levels — Payload's anchor slug and
  // renderLexical's slug aren't guaranteed to agree, so positional matching is load-bearing.
  const [activeIdx, setActiveIdx] = useState<number>(0);

  const entries: RenderedTocEntry[] = (toc ?? []).filter(
    (e): e is RenderedTocEntry =>
      !!e?.text && typeof e.level === "number" && e.level >= 2 && e.level <= 4,
  );

  const levels = Array.from(new Set(entries.map((e) => e.level))).sort();
  const selector = levels.map((l) => `.article-body .article-h${l}`).join(", ");

  useEffect(() => {
    if (!entries.length || !selector) return;

    const getHeadingEls = (): HTMLElement[] =>
      Array.from(document.querySelectorAll<HTMLElement>(selector));

    const onScroll = () => {
      const els = getHeadingEls();
      if (!els.length) return;
      let idx = 0;
      for (let i = 0; i < els.length; i++) {
        const top = els[i]?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
        if (top <= HEADER_OFFSET) idx = i;
      }
      setActiveIdx(idx);
    };

    const t = setTimeout(() => {
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }, 120);

    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length, selector]);

  if (!entries.length) return null;

  return (
    <nav aria-label="Table of contents">
      <p
        className="text-xs font-bold uppercase tracking-[0.06em]"
        style={{
          color: "rgba(17,17,17,0.4)",
          marginBottom: "12px",
          paddingLeft: "4px",
        }}
      >
        Contents
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {entries.map((entry, i) => {
          const isActive = i === activeIdx;
          const indentPx = (entry.level - 2) * 12;
          const fontSize = entry.level === 2 ? "0.875rem" : "0.8125rem";
          return (
            <li
              key={entry.id ?? `${entry.level}-${i}`}
              style={{
                borderLeft: `2px solid ${isActive ? "#4a3bf1" : "rgba(17,17,17,0.1)"}`,
                transition: "border-color 0.2s",
              }}
            >
              <button
                type="button"
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  paddingLeft: `${14 + indentPx}px`,
                  paddingRight: "8px",
                  paddingTop: "7px",
                  paddingBottom: "7px",
                  fontSize,
                  lineHeight: 1.55,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#4a3bf1" : "rgba(17,17,17,0.65)",
                  transition: "color 0.2s",
                }}
                onClick={() => {
                  const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
                  const target = els[i];
                  if (target) {
                    const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
                    window.scrollTo({ top, behavior: "smooth" });
                  }
                }}
              >
                {entry.text}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
