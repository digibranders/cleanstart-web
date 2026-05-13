"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
  heroImage,
  abstract,
}: BlogDetailContentProps): React.ReactElement {
  return (
    <section
      className="relative w-full bg-white overflow-hidden"
      data-section="BlogDetailContent"
    >
      {/* Decorative Union vector — upper-left, same pattern as other dark→white transitions */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          left: "-552px",
          top: "-413px",
          width: "1181px",
          height: "1181px",
          background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(100,13,251,0.06) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />
      {/* Decorative Union vector — lower-right */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          right: "-339px",
          bottom: "160px",
          width: "1181px",
          height: "1181px",
          background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(100,13,251,0.05) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />
      {/* Decorative ellipse blobs at bottom */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{ left: "-69px", bottom: "130px", width: "258px", height: "258px", borderRadius: "50%", background: "radial-gradient(circle, rgba(74,59,241,0.18) 0%, transparent 70%)", filter: "blur(40px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{ right: "-126px", bottom: "67px", width: "315px", height: "315px", borderRadius: "50%", background: "radial-gradient(circle, rgba(44,193,235,0.15) 0%, transparent 70%)", filter: "blur(50px)" }}
      />

      {/* 3-column layout:
          Left  (x=322): ToC sidebar   w=295
          Center (x=649): Article body  w=622
          Right  (x=1303): Share panel  w=295
          Total content width: 295+32+622+32+295 = 1276px centred in 1920px */}
      <div className="relative mx-auto max-w-[1276px] px-6">
        <div className="relative flex gap-8 pt-[80px] pb-[120px]">

          {/* ── LEFT: Table of Contents (sticky) ── */}
          <aside
            className="hidden xl:block shrink-0"
            style={{ width: "295px" }}
          >
            <div
              className="sticky top-[96px]"
            >
              <TableOfContents toc={tableOfContents} />
            </div>
          </aside>

          {/* ── CENTER: Article body ── */}
          <div className="min-w-0 flex-1 xl:max-w-[622px]">
            {heroImage && (
              <div className="mb-8 rounded-2xl overflow-hidden">
                <Image
                  src={heroImage.url}
                  alt={heroImage.alt ?? ""}
                  width={heroImage.width ?? 622}
                  height={heroImage.height ?? 350}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
            )}
            {abstract && !body && (
              <p
                className="article-paragraph mb-6"
                style={{ fontFamily: "Figtree, sans-serif", fontSize: "clamp(16px, 1.4vw, 20px)", color: "rgba(17,17,17,0.8)", lineHeight: 1.6 }}
              >
                {abstract}
              </p>
            )}
            <RenderLexical content={body} />
          </div>

          {/* ── RIGHT: Share panel (sticky) ── */}
          <aside
            className="hidden xl:block shrink-0"
            style={{ width: "295px" }}
          >
            <div className="sticky top-[96px]">
              <SharePanel />
            </div>
          </aside>
        </div>

        {/* Mobile share bar */}
        <div className="xl:hidden pb-8">
          <SharePanel />
        </div>
      </div>
    </section>
  );
}

/* ─── Table of Contents ────────────────────────────────────────────────────── */

function TableOfContents({ toc }: { toc?: TocEntry[] | null | undefined }): React.ReactElement | null {
  const [activeAnchor, setActiveAnchor] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!toc?.length) return;

    const anchors = toc.map((e) => e.anchor).filter(Boolean) as string[];
    const elements = anchors
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (!elements.length) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries.find((e) => e.isIntersecting);
        if (first) {
          setActiveAnchor((first.target as HTMLElement).id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );

    for (const el of elements) observerRef.current?.observe(el);
    return () => observerRef.current?.disconnect();
  }, [toc]);

  if (!toc?.length) return null;

  return (
    <div
      className="overflow-hidden rounded-[12px]"
      style={{ border: "1px solid #d1d1d1", background: "#fff" }}
    >
      <p
        className="px-[23px] pt-[23px] pb-[16px]"
        style={{ fontFamily: "Figtree, sans-serif", fontWeight: 700, fontSize: "24px", letterSpacing: "-0.05em", color: "#111", lineHeight: 1 }}
      >
        Contents
      </p>
      <ul>
        {toc.map((entry, i) => {
          if (!entry.text) return null;
          const isActive = activeAnchor === entry.anchor;
          return (
            <li key={entry.id ?? i}>
              <a
                href={entry.anchor ? `#${entry.anchor}` : undefined}
                className="block transition-colors duration-150"
                style={{
                  paddingLeft: "24px",
                  paddingRight: "12px",
                  paddingTop: "12px",
                  paddingBottom: "12px",
                  fontSize: "16px",
                  lineHeight: 1,
                  fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif",
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "#5f3cff" : "#111",
                  background: isActive ? "#dfd8ff" : "transparent",
                  textDecoration: "none",
                  display: "block",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  if (entry.anchor) {
                    const el = document.getElementById(entry.anchor);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
              >
                {entry.text}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ─── Share Panel ─────────────────────────────────────────────────────────── */

const SHARE_ICONS: Array<{
  name: string;
  src: string;
  isSvg?: boolean;
  getUrl: (url: string) => string;
}> = [
  { name: "WhatsApp", src: "/images/blog-detail/share-icon-whatsapp.png", getUrl: (url) => `https://wa.me/?text=${encodeURIComponent(url)}` },
  { name: "Facebook", src: "/images/blog-detail/share-icon-facebook.svg", isSvg: true, getUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  { name: "Twitter / X", src: "/images/blog-detail/share-icon-twitter.png", getUrl: (url) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}` },
  { name: "LinkedIn", src: "/images/blog-detail/share-icon-linkedin.png", getUrl: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  { name: "Instagram", src: "/images/blog-detail/share-icon-instagram.png", getUrl: (_url) => 'https://www.instagram.com/' },
];

function SharePanel(): React.ReactElement {
  const [pageUrl, setPageUrl] = useState("");
  useEffect(() => { setPageUrl(window.location.href); }, []);

  return (
    <div
      className="flex items-center gap-4 rounded-[16px] px-[10px] py-[12px]"
      style={{
        background: "#fff",
        border: "1px solid #dee5ec",
        boxShadow: "0 0.545px 0.545px rgba(61,137,212,0.2), 0 1.09px 1.09px rgba(61,137,212,0.31)",
      }}
    >
      <span
        style={{ fontFamily: "Figtree, sans-serif", fontWeight: 600, fontSize: "16px", color: "#0c1620", flexShrink: 0 }}
      >
        Share
      </span>
      <div className="flex items-center gap-2">
        {SHARE_ICONS.map(({ name, src, isSvg, getUrl }) => (
          <a
            key={name}
            href={pageUrl ? getUrl(pageUrl) : "#"}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${name}`}
            className="flex items-center justify-center shrink-0 rounded-full transition-opacity hover:opacity-75"
            style={{ width: "24px", height: "24px" }}
          >
            {isSvg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="" aria-hidden width={24} height={24} className="w-full h-full" />
            ) : (
              <Image src={src} alt="" width={24} height={24} className="w-full h-full object-contain" aria-hidden />
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
