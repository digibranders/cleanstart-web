"use client";

import { useCallback, useState } from "react";
import {
  type PressType,
  formatNewsDate,
  pressTypeLabel,
} from "@/lib/news";

interface NewsDetailMetaProps {
  pressType?: PressType | null | undefined;
  publicationDate?: string | null | undefined;
  shareUrl: string;
  shareTitle: string;
}

export function NewsDetailMeta({
  pressType,
  publicationDate,
  shareUrl,
  shareTitle,
}: NewsDetailMetaProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable; degrade silently.
    }
  }, [shareUrl]);

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(shareTitle);

  return (
    <div
      className="relative mx-auto max-w-[1080px] px-6 flex flex-wrap items-center justify-between"
      style={{ gap: "16px", paddingTop: "32px", paddingBottom: "32px" }}
    >
      {/* Left — press-type pill */}
      <span
        className="inline-flex items-center text-sm font-medium leading-none whitespace-nowrap"
        style={{
          padding: "8px 14px",
          borderRadius: "999px",
          background: "rgba(74, 59, 241, 0.10)",
          color: "#4a3bf1",
          letterSpacing: "-0.01em",
        }}
      >
        {pressTypeLabel(pressType)}
      </span>

      {/* Middle — share icons */}
      <div className="flex items-center" style={{ gap: "12px" }}>
        <span
          className="text-sm font-medium leading-none"
          style={{ color: "rgba(17,17,17,0.65)" }}
        >
          Share
        </span>
        <ShareIconLink
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          label="Share on LinkedIn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14ZM8.3 18.34v-8.04H5.67v8.04H8.3ZM6.98 9.23a1.53 1.53 0 1 0 0-3.06 1.53 1.53 0 0 0 0 3.06Zm11.36 9.11v-4.4c0-2.36-1.26-3.46-2.95-3.46-1.36 0-1.97.75-2.31 1.27v-1.09h-2.63c.04.74 0 8.04 0 8.04h2.63v-4.49c0-.24.02-.47.09-.64.19-.47.62-.96 1.34-.96.95 0 1.32.72 1.32 1.77v4.32h2.51Z" />
          </svg>
        </ShareIconLink>
        <ShareIconLink
          href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
          label="Share on X"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231L18.244 2.25Zm-1.16 17.52h1.833L7.084 4.126H5.117L17.084 19.77Z" />
          </svg>
        </ShareIconLink>
        <ShareIconLink
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          label="Share on Facebook"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M22 12.07C22 6.51 17.52 2 12 2S2 6.51 2 12.07c0 5.02 3.66 9.19 8.44 9.93v-7.02H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.33v7.02C18.34 21.26 22 17.09 22 12.07Z" />
          </svg>
        </ShareIconLink>
        <ShareIconLink
          href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
          label="Share via email"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </ShareIconLink>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Link copied" : "Copy link"}
          className="inline-flex items-center justify-center transition-colors"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "999px",
            background: copied ? "#4a3bf1" : "rgba(74, 59, 241, 0.10)",
            color: copied ? "#fff" : "#4a3bf1",
            border: "none",
            cursor: "pointer",
          }}
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="m5 12 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 1 0-7.07-7.07l-1 1" />
              <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1" />
            </svg>
          )}
        </button>
      </div>

      {/* Right — date */}
      {publicationDate && (
        <div className="flex items-center" style={{ gap: "8px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/blogs/icon-calendar-grey.svg"
            alt=""
            aria-hidden
            width={18}
            height={18}
            className="pointer-events-none select-none"
            loading="lazy"
            decoding="async"
          />
          <span
            className="text-sm font-medium leading-none whitespace-nowrap"
            style={{ color: "#111" }}
          >
            {formatNewsDate(publicationDate)}
          </span>
        </div>
      )}
    </div>
  );
}

interface ShareIconLinkProps {
  href: string;
  label: string;
  children: React.ReactNode;
}

function ShareIconLink({ href, label, children }: ShareIconLinkProps): React.ReactElement {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex items-center justify-center transition-colors hover:bg-[rgba(74,59,241,0.18)]"
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "999px",
        background: "rgba(74, 59, 241, 0.10)",
        color: "#4a3bf1",
      }}
    >
      {children}
    </a>
  );
}
