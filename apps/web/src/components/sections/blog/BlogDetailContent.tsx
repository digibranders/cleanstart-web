"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { RenderLexical } from "@/lib/renderLexical";
import { mediaUrl } from "@/lib/blog";
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
  heroImage,
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
              style={{ top: "72px", maxHeight: "calc(100vh - 80px)", overflowY: "auto" }}
            >
              <TableOfContents toc={tableOfContents} />
            </div>
          </aside>

          {/* ── CENTER: Article body ── */}
          {/* mx-auto centers the column when the xl TOC sidebar is hidden; xl:mx-0 resets it once the sidebar is visible */}
          <article className="min-w-0 flex-1 mx-auto lg:mx-0" style={{ maxWidth: "680px" }}>
            {heroImage && (
              <div className="mb-10 overflow-hidden" style={{ borderRadius: "16px" }}>
                <Image
                  src={mediaUrl(heroImage.url)!}
                  alt={heroImage.alt ?? ""}
                  width={heroImage.width ?? 680}
                  height={heroImage.height ?? 383}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
            )}

            {abstract && (
              <p
                className="mb-8"
                style={{
                  fontFamily: "Figtree, sans-serif",
                  fontSize: "clamp(16px, 1.2vw, 18px)",
                  color: "rgba(17,17,17,0.65)",
                  lineHeight: 1.7,
                  letterSpacing: "-0.01em",
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

function TableOfContents({ toc }: { toc?: TocEntry[] | null | undefined }): React.ReactElement | null {
  // Track by index — avoids ID mismatch between Payload anchors and renderLexical slugs.
  const [activeIdx, setActiveIdx] = useState<number>(0);

  const h2Entries = toc?.filter((e) => e.level === 2 && e.text) ?? [];

  useEffect(() => {
    if (!h2Entries.length) return;

    const getH2Els = (): HTMLElement[] =>
      Array.from(document.querySelectorAll<HTMLElement>(".article-body .article-h2"));

    const onScroll = () => {
      const els = getH2Els();
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
  }, [h2Entries.length]);

  if (!h2Entries.length) return null;

  return (
    <nav aria-label="Table of contents">
      <p
        style={{
          fontFamily: "Figtree, sans-serif",
          fontWeight: 700,
          fontSize: "13px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "rgba(17,17,17,0.4)",
          marginBottom: "12px",
          paddingLeft: "4px",
        }}
      >
        Contents
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {h2Entries.map((entry, i) => {
          if (!entry.text) return null;
          const isActive = i === activeIdx;
          return (
            <li
              key={entry.id ?? i}
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
                  paddingLeft: "14px",
                  paddingRight: "8px",
                  paddingTop: "7px",
                  paddingBottom: "7px",
                  fontSize: "13.5px",
                  lineHeight: 1.55,
                  fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#4a3bf1" : "rgba(17,17,17,0.65)",
                  transition: "color 0.2s",
                }}
                onClick={() => {
                  const els = Array.from(
                    document.querySelectorAll<HTMLElement>(".article-body .article-h2"),
                  );
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
