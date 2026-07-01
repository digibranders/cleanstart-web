"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { RenderLexical, slugifyText } from "@/lib/renderLexical";
import type { LexicalRoot, TocEntry } from "@/lib/guides";

interface GuideDetailContentProps {
  body?: LexicalRoot | null | undefined;
  tableOfContents?: TocEntry[] | null | undefined;
}

export function GuideDetailContent({
  body,
  tableOfContents,
}: GuideDetailContentProps): React.ReactElement {
  return (
    <section className="relative w-full bg-white overflow-x-clip" data-section="GuideDetailContent">
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
        ~680px body column = ~72 chars at 18px — optimal reading line length.
      */}
      <div className="relative mx-auto max-w-[1120px] px-6">
        <div className="relative flex gap-12 pt-6 sm:pt-10 lg:pt-16 pb-28">

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
          <article className="min-w-0 flex-1 mx-auto lg:mx-0" style={{ maxWidth: "680px" }}>
            {/* Mobile-only collapsible TOC dropdown listing the guide's sections. */}
            <div className="lg:hidden mb-8">
              <MobileTableOfContents toc={tableOfContents} />
            </div>

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

// Fixed-header height varies by viewport (72px mobile, 108px desktop where the
// utility strip shows). Read --cs-header-h (single source of truth) so TOC jumps
// land just below the header instead of under it.
function getHeaderOffset(): number {
  if (typeof window === "undefined") return 88;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--cs-header-h")
    .trim();
  const h = Number.parseInt(raw, 10);
  return (Number.isFinite(h) ? h : 72) + 16;
}

type RenderedTocEntry = TocEntry & { level: number; text: string };

function TableOfContents({ toc }: { toc?: TocEntry[] | null | undefined }): React.ReactElement | null {
  const [activeId, setActiveId] = useState<string>("");

  const entries: (RenderedTocEntry & { slug: string })[] = useMemo(
    () =>
      (toc ?? [])
        .filter(
          (e): e is RenderedTocEntry =>
            !!e?.text && typeof e.level === "number" && e.level >= 2 && e.level <= 4,
        )
        .map((e) => ({ ...e, slug: slugifyText(e.text) })),
    [toc],
  );

  useEffect(() => {
    if (!entries.length) return;

    // The sidebar this drives is `hidden lg:block` — display:none below 1024px.
    // Only wire the scroll spy when the desktop breakpoint is active so the
    // per-frame layout reads never run on mobile (where they'd cost INP for an
    // invisible element). Re-evaluates when the breakpoint changes.
    const mq = window.matchMedia("(min-width: 1024px)");

    let targets: { slug: string; el: HTMLElement }[] = [];
    let rafId = 0;
    let attached = false;

    // Resolve each TOC slug to its heading element once, on attach, instead of
    // re-querying the DOM on every scroll tick.
    const resolveTargets = (): void => {
      const headings = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".article-body .article-h2, .article-body .article-h3, .article-body .article-h4",
        ),
      );
      targets = entries
        .map((entry) => {
          const el =
            document.getElementById(entry.slug) ??
            headings.find((h) => slugifyText(h.textContent ?? "") === entry.slug) ??
            null;
          return el ? { slug: entry.slug, el } : null;
        })
        .filter((t): t is { slug: string; el: HTMLElement } => t !== null);
    };

    const computeActive = (): void => {
      rafId = 0;
      const offset = getHeaderOffset();
      let current = entries[0]?.slug ?? "";
      for (const { slug, el } of targets) {
        if (el.getBoundingClientRect().top <= offset) current = slug;
      }
      setActiveId(current);
    };

    // Coalesce bursts of scroll events into a single layout-read pass per frame.
    const onScroll = (): void => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(computeActive);
    };

    const attach = (): void => {
      if (attached) return;
      attached = true;
      resolveTargets();
      computeActive();
      window.addEventListener("scroll", onScroll, { passive: true });
    };

    const detach = (): void => {
      if (!attached) return;
      attached = false;
      window.removeEventListener("scroll", onScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const sync = (): void => {
      if (mq.matches) attach();
      else detach();
    };

    // Defer initial wiring so headings are laid out before the first read.
    const t = window.setTimeout(sync, 120);
    mq.addEventListener("change", sync);

    return () => {
      window.clearTimeout(t);
      mq.removeEventListener("change", sync);
      detach();
    };
  }, [entries]);

  if (!entries.length) return null;

  const scrollToEntry = (slug: string): void => {
    const byId = document.getElementById(slug);
    const fallback = byId
      ? null
      : Array.from(
          document.querySelectorAll<HTMLElement>(
            ".article-body .article-h2, .article-body .article-h3, .article-body .article-h4",
          ),
        ).find((h) => slugifyText(h.textContent ?? "") === slug) ?? null;
    const target = byId ?? fallback;
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
    window.scrollTo({ top, behavior: "smooth" });
  };

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
          const isActive = entry.slug === activeId;
          const indentPx = (entry.level - 2) * 12;
          const fontSize = entry.level === 2 ? "0.875rem" : "0.8125rem";
          return (
            <li
              key={entry.id ?? `${entry.slug}-${i}`}
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
                onClick={() => scrollToEntry(entry.slug)}
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

/* ─── Mobile Table of Contents (collapsible) ────────────────────────────── */

function MobileTableOfContents({
  toc,
}: {
  toc?: TocEntry[] | null | undefined;
}): React.ReactElement | null {
  const [open, setOpen] = useState(false);

  const entries: { text: string; slug: string; level: number }[] = useMemo(
    () =>
      (toc ?? [])
        .filter(
          (e): e is RenderedTocEntry =>
            !!e?.text && typeof e.level === "number" && e.level >= 2 && e.level <= 4,
        )
        .map((e) => ({
          text: e.text,
          slug: slugifyText(e.text),
          level: e.level,
        })),
    [toc],
  );

  if (!entries.length) return null;

  const handleClick = (slug: string): void => {
    const byId = document.getElementById(slug);
    const fallback = byId
      ? null
      : Array.from(
          document.querySelectorAll<HTMLElement>(
            ".article-body .article-h2, .article-body .article-h3, .article-body .article-h4",
          ),
        ).find((h) => slugifyText(h.textContent ?? "") === slug) ?? null;
    const target = byId ?? fallback;
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
    window.scrollTo({ top, behavior: "smooth" });
    setOpen(false);
  };

  return (
    <details
      open={open}
      onToggle={(event) => setOpen((event.target as HTMLDetailsElement).open)}
      className="w-full"
      style={{
        border: "1px solid rgba(17,17,17,0.10)",
        borderRadius: "12px",
        background: "white",
        overflow: "hidden",
      }}
    >
      <summary
        className="flex items-center justify-between font-sans cursor-pointer list-none"
        style={{
          padding: "12px 16px",
          fontSize: "var(--fs-body-sm)",
          fontWeight: 600,
          color: "#111",
          letterSpacing: "-0.01em",
        }}
      >
        <span>Contents</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="#111"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <ul
        style={{
          listStyle: "none",
          padding: "0 16px 12px",
          margin: 0,
          borderTop: "1px solid rgba(17,17,17,0.08)",
        }}
      >
        {entries.map((entry) => (
          <li
            key={entry.slug}
            style={{
              paddingLeft: `${(entry.level - 2) * 12}px`,
            }}
          >
            <button
              type="button"
              onClick={() => handleClick(entry.slug)}
              className="font-sans w-full text-left"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px 0",
                fontSize: entry.level === 2 ? "14px" : "13px",
                lineHeight: 1.5,
                color: "rgba(17,17,17,0.75)",
              }}
            >
              {entry.text}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
