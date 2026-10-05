"use client";

import { ArrowUpRight, Check, Copy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { type RefObject, useEffect, useRef, useState } from "react";

import { withDemoSource } from "@/lib/blog-cta/demo-link";
import { trackBlogCta } from "@/lib/blog-cta/track";
import { copyText } from "@/lib/clipboard";
import type {
  BlogCtaLayout,
  BlogCtaPlacement,
  CatalogLogo,
  ExploreCta,
  ProveCta,
  ResourceCta,
} from "@/lib/blog-cta/types";
import { useHydratedReducedMotion } from "@/lib/use-hydrated-reduced-motion";

import type { ProgressSubscribe } from "./useArticleProgress";

export const DARK_BAND = "linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)";
const CARD_BORDER = "1px solid rgba(17, 17, 17, 0.08)";
const CARD_SHADOW = "0 22px 48px -32px rgba(49, 27, 146, 0.55)";
const INK_MUTED = "rgba(17, 17, 17, 0.64)";
const VIOLET = "#4A3BF1";

export interface CtaCardContext {
  slug: string;
  layout: BlogCtaLayout;
  placement: BlogCtaPlacement;
  /** Reading progress 0 to 1. Drives the slow drift on the cards' 3D marks. */
  subscribe?: ProgressSubscribe | undefined;
}

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/**
 * Writes a scroll-driven style straight to an element on every progress
 * update, with no React re-render. Skipped under reduced motion.
 */
function useScrollStyle(
  ref: RefObject<HTMLElement | null>,
  subscribe: ProgressSubscribe | undefined,
  apply: (el: HTMLElement, progress: number) => void,
): void {
  const reduce = useHydratedReducedMotion();
  useEffect(() => {
    if (!subscribe || reduce) return;
    return subscribe((p) => {
      if (ref.current) apply(ref.current, p);
    });
  }, [ref, subscribe, apply, reduce]);
}

/** The logo tilts from -14 to 10 degrees as the reader moves through the first third. */
function applyLogoTilt(el: HTMLElement, progress: number): void {
  const t = clamp01(progress / 0.35);
  el.style.transform = `rotateX(${(8 - 12 * t).toFixed(2)}deg) rotateY(${(-14 + 24 * t).toFixed(2)}deg)`;
}

/** The cube turns and lifts over the last half of the article. */
function applyCubeDrift(el: HTMLElement, progress: number): void {
  const t = clamp01((progress - 0.5) / 0.5);
  el.style.transform = `translateY(${(10 - 16 * t).toFixed(2)}px) rotate(${(-18 + 32 * t).toFixed(2)}deg)`;
}

/**
 * A catalog image's logo on a rounded tile. Light-ink logos sit on white,
 * white-only logos on the dark band, and an image with no logo file gets the
 * CleanStart mark so the tile is never blank.
 */
export function CatalogLogoTile({
  logo,
  name,
  size,
}: {
  logo: CatalogLogo;
  name: string;
  size: number;
}): React.ReactElement {
  const onDark = logo.src === null || logo.tone === "dark";
  const glyph = Math.round(size * 0.58);
  return (
    <span
      className="grid shrink-0 place-items-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: onDark ? DARK_BAND : "#ffffff",
        border: onDark ? "1px solid rgba(255, 255, 255, 0.22)" : "1px solid rgba(74, 59, 241, 0.14)",
        boxShadow: "0 10px 24px -14px rgba(49, 27, 146, 0.6), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo.src ?? "/images/security/cs-logomark.svg"}
        alt={logo.src ? `${name} logo` : ""}
        width={glyph}
        height={glyph}
        loading="lazy"
        decoding="async"
        style={{ width: glyph, height: glyph, objectFit: "contain" }}
      />
    </span>
  );
}

const captionStyle: React.CSSProperties = {
  fontSize: "var(--fs-caption)",
  lineHeight: 1.4,
  fontWeight: 500,
  letterSpacing: "0.01em",
};

const titleStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--fs-h6)",
  lineHeight: 1.3,
  fontWeight: 600,
  letterSpacing: "-0.01em",
  textWrap: "balance",
};

const bodyStyle: React.CSSProperties = {
  fontSize: "var(--fs-body-sm)",
  lineHeight: 1.55,
};

/* ─── Explore: the catalog image this article is about ──────────────────── */

/** A terminal line with the public pull command and a copy button. */
function PullCommand({ command, onCopied }: { command: string; onCopied: () => void }): React.ReactElement {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const t = window.setTimeout(() => setState("idle"), 1800);
    return () => window.clearTimeout(t);
  }, [state]);

  const onCopy = async (): Promise<void> => {
    const ok = await copyText(command);
    setState(ok ? "copied" : "failed");
    if (ok) onCopied();
  };

  return (
    <div
      className="mt-4 flex items-start gap-2 rounded-[10px] py-1.5 pr-1.5 pl-3"
      style={{ background: "#14112A", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}
    >
      {/* Wraps instead of scrolling: the rail is too narrow for the full command on one line. */}
      <code
        className="min-w-0 flex-1 py-[5px]"
        style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", lineHeight: 1.5, color: "#E9E7FF", overflowWrap: "anywhere" }}
      >
        <span aria-hidden style={{ color: "#8F88C9" }}>
          ${" "}
        </span>
        {command}
      </code>
      <button
        type="button"
        onClick={onCopy}
        aria-label={state === "copied" ? "Copied" : "Copy pull command"}
        className="grid size-7 shrink-0 place-items-center rounded-[7px] transition-colors"
        style={{
          background: state === "copied" ? "rgba(44,193,235,0.18)" : "rgba(255,255,255,0.08)",
          color: state === "copied" ? "#2CC1EB" : "#E9E7FF",
        }}
      >
        {state === "copied" ? <Check aria-hidden size={14} strokeWidth={2.25} /> : <Copy aria-hidden size={14} strokeWidth={2} />}
      </button>
      <span className="sr-only" aria-live="polite">
        {state === "copied" ? "Pull command copied" : state === "failed" ? "Copy failed, select the command to copy it" : ""}
      </span>
    </div>
  );
}

export function ExploreCard({
  cta,
  context,
}: {
  cta: ExploreCta;
  context: CtaCardContext;
}): React.ReactElement {
  const tiltRef = useRef<HTMLDivElement>(null);
  useScrollStyle(tiltRef, context.subscribe, applyLogoTilt);

  const onClick = (): void => trackBlogCta({ ...context, stage: "explore" });
  const onCopied = (): void => trackBlogCta({ ...context, stage: "explore", action: "copy" });

  return (
    <article
      className="relative overflow-hidden rounded-[20px] bg-white p-5"
      style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/cleanstart-images/hero-vector-grid.svg"
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute select-none"
        style={{ right: -120, top: -150, width: 420, height: 420, opacity: 0.55 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          right: -60,
          top: -70,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(169,116,255,0.28) 0%, rgba(169,116,255,0) 70%)",
        }}
      />

      {cta.kind === "image" ? (
        <div className="relative">
          <div className="flex items-center gap-3.5" style={{ perspective: 600 }}>
            <div ref={tiltRef} style={{ transformStyle: "preserve-3d" }}>
              <CatalogLogoTile logo={cta.logo} name={cta.name} size={56} />
            </div>
            <div className="min-w-0">
              <p style={{ ...captionStyle, color: VIOLET }}>Hardened image</p>
              <p
                className="truncate"
                style={{ fontFamily: "var(--font-mono)", fontSize: "1.0625rem", fontWeight: 500, color: "#111" }}
              >
                {cta.name}
              </p>
            </div>
          </div>
          {cta.description ? (
            <p className="mt-3.5 line-clamp-3" style={{ ...bodyStyle, color: INK_MUTED }}>
              {cta.description}
            </p>
          ) : null}
          {cta.hasFips ? (
            <span
              className="mt-3 inline-flex items-center rounded-full px-2.5 py-1"
              style={{ ...captionStyle, fontSize: "var(--fs-badge)", color: "#3B2FC4", background: "rgba(74,59,241,0.08)" }}
            >
              FIPS variant available
            </span>
          ) : null}
          {cta.pullCommand ? <PullCommand command={cta.pullCommand} onCopied={onCopied} /> : null}
          <a
            href={cta.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClick}
            className="cs-btn-blue mt-4 w-full gap-1.5"
            style={{ ["--cs-btn-fs" as string]: "var(--fs-button-sm)" }}
          >
            View in catalog
            <ArrowUpRight aria-hidden size={16} strokeWidth={2} />
          </a>
        </div>
      ) : (
        <div className="relative">
          <div className="flex items-center" style={{ perspective: 600 }}>
            <div ref={tiltRef} className="flex items-center" style={{ transformStyle: "preserve-3d" }}>
              {cta.featured.map((img, i) => (
                <div key={img.name} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: cta.featured.length - i }}>
                  <CatalogLogoTile logo={img.logo} name={img.name} size={42} />
                </div>
              ))}
            </div>
          </div>
          <p className="mt-4" style={{ ...titleStyle, color: "#111" }}>
            {cta.imageCount ? `${cta.imageCount} hardened images` : "Hardened image catalog"}
          </p>
          <p className="mt-1.5" style={{ ...bodyStyle, color: INK_MUTED }}>
            Drop-in replacements for the base images you already run, continuously updated and patched.
          </p>
          {cta.pullCommand ? <PullCommand command={cta.pullCommand} onCopied={onCopied} /> : null}
          <a
            href={cta.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClick}
            className="cs-btn-blue mt-4 w-full gap-1.5"
            style={{ ["--cs-btn-fs" as string]: "var(--fs-button-sm)" }}
          >
            Browse the catalog
            <ArrowUpRight aria-hidden size={16} strokeWidth={2} />
          </a>
        </div>
      )}
    </article>
  );
}

/* ─── Learn: the related resource, with a cover that tilts under the pointer ─ */

const COVER_SIZES = "(min-width: 1280px) 272px, 360px";

/**
 * Title printed on the dark book of a generic type poster, matching the
 * resource center card (same anchor box, same length-based scale).
 */
function PosterTitle({ title }: { title: string }): React.ReactElement {
  const len = title.length;
  const fontSize =
    len <= 28
      ? "clamp(0.75rem, 5cqw, 1rem)"
      : len <= 44
        ? "clamp(0.7rem, 4.4cqw, 0.9rem)"
        : len <= 64
          ? "clamp(0.65rem, 3.8cqw, 0.8rem)"
          : "clamp(0.6rem, 3.4cqw, 0.72rem)";
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute overflow-hidden text-white"
      style={{
        top: "40%",
        left: "22%",
        right: "28%",
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize,
        lineHeight: 1.18,
        letterSpacing: "-0.03em",
        display: "-webkit-box",
        WebkitLineClamp: len <= 44 ? 3 : 4,
        WebkitBoxOrient: "vertical",
        textShadow: "0 1px 2px rgba(0,0,0,0.25)",
        overflowWrap: "anywhere",
      }}
    >
      {title}
    </span>
  );
}

function TiltCover({
  src,
  alt,
  posterTitle,
}: {
  src: string;
  alt: string;
  /** Set when `src` is the generic poster, so the title is drawn onto it. */
  posterTitle?: string | undefined;
}): React.ReactElement {
  const reduce = useHydratedReducedMotion();
  const coverRef = useRef<HTMLDivElement>(null);

  // Tilt and glare follow the pointer through direct style writes; the CSS
  // transition smooths them.
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    const cover = coverRef.current;
    if (!cover || reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    cover.style.transform = `rotateX(${((0.5 - py) * 14).toFixed(2)}deg) rotateY(${((px - 0.5) * 18).toFixed(2)}deg)`;
    cover.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
    cover.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
  };
  const onPointerLeave = (): void => {
    const cover = coverRef.current;
    if (!cover) return;
    cover.style.transform = "";
    cover.style.removeProperty("--gx");
    cover.style.removeProperty("--gy");
  };

  return (
    <div style={{ perspective: 800 }} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <div
        ref={coverRef}
        className="group/cover relative overflow-hidden rounded-[14px] transition-transform duration-200 ease-out motion-reduce:transition-none"
        style={{
          aspectRatio: "16 / 9",
          background: "#dfe9f5",
          containerType: "inline-size",
          boxShadow: "0 16px 30px -22px rgba(19, 30, 143, 0.7)",
        }}
      >
        <Image src={src} alt={alt} fill sizes={COVER_SIZES} className="object-cover" />
        {posterTitle ? <PosterTitle title={posterTitle} /> : null}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/cover:opacity-100"
          style={{
            background:
              "radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), rgba(255,255,255,0.38), rgba(255,255,255,0) 55%)",
          }}
        />
      </div>
    </div>
  );
}

export function LearnCard({
  cta,
  context,
}: {
  cta: ResourceCta;
  context: CtaCardContext;
}): React.ReactElement {
  return (
    <article
      className="relative overflow-hidden rounded-[20px] bg-white p-3 pb-5"
      style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
    >
      <TiltCover src={cta.coverUrl} alt={cta.coverAlt} posterTitle={cta.coverIsPoster ? cta.title : undefined} />
      <div className="px-2 pt-4">
        <p style={{ ...captionStyle, color: VIOLET }}>
          {cta.typeLabel}
          {cta.gated ? " · Free download" : ""}
        </p>
        <h3 className="mt-1 line-clamp-3" style={{ ...titleStyle, color: "#111" }}>
          {cta.title}
        </h3>
        {cta.summary ? (
          <p className="mt-1.5 line-clamp-2" style={{ ...bodyStyle, color: INK_MUTED }}>
            {cta.summary}
          </p>
        ) : null}
        <Link
          href={cta.href}
          onClick={() => trackBlogCta({ ...context, stage: "learn", resourceSlug: cta.slug })}
          className="cs-btn-blue mt-4 w-full"
          style={{ ["--cs-btn-fs" as string]: "var(--fs-button-sm)" }}
        >
          {cta.ctaLabel}
        </Link>
      </div>
    </article>
  );
}

/* ─── Prove: the POC, on the site's dark band with a pointer-following light ─ */

export function ProveCard({
  cta,
  context,
}: {
  cta: ProveCta;
  context: CtaCardContext;
}): React.ReactElement {
  const reduce = useHydratedReducedMotion();
  const cubeRef = useRef<HTMLDivElement>(null);
  useScrollStyle(cubeRef, context.subscribe, applyCubeDrift);

  // The light follows the pointer through two custom properties on the card.
  const onPointerMove = (e: React.PointerEvent<HTMLElement>): void => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--lx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    e.currentTarget.style.setProperty("--ly", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  };

  return (
    <article
      onPointerMove={onPointerMove}
      className="relative isolate overflow-hidden rounded-[20px] p-5 text-white"
      style={{ background: DARK_BAND, boxShadow: "0 26px 56px -30px rgba(71, 30, 192, 0.85)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(260px circle at var(--lx, 70%) var(--ly, 10%), rgba(169,116,255,0.42), rgba(169,116,255,0) 70%)",
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/blog-detail/cta/cta-union.svg"
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute -z-10 select-none"
        style={{ left: -160, bottom: -260, width: 520, height: 520, opacity: 0.35 }}
      />
      <div
        ref={cubeRef}
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{ right: -22, top: -18, width: 112, height: 112 }}
      >
        <Image src="/images/blog-detail/cta/cta-cube.webp" alt="" fill sizes="112px" className="object-contain opacity-90" />
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/security/cs-logomark.svg"
        alt=""
        aria-hidden
        width={26}
        height={30}
        loading="lazy"
        decoding="async"
        className="relative"
      />
      <h3 className="relative mt-5 pr-10" style={{ ...titleStyle, fontSize: "var(--fs-h5)", color: "#fff" }}>
        Prove it on your own workloads
      </h3>
      <p className="relative mt-2" style={{ ...bodyStyle, color: "rgba(255,255,255,0.78)" }}>
        Book a free proof of concept with the CleanStart team.
      </p>
      <Link
        href={withDemoSource(cta.href, context)}
        onClick={() => trackBlogCta({ ...context, stage: "prove" })}
        className="cs-btn-glass relative mt-5 w-full"
      >
        {cta.label}
      </Link>
    </article>
  );
}
