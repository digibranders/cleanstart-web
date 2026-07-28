"use client";

import { useState } from "react";

import { copyRichHtml } from "@/lib/clipboard";
import type { EmailSignatureSummary } from "@/lib/email-signatures";

type CopyState = "idle" | "copying" | "copied" | "error";

const LABELS: Record<CopyState, string> = {
  idle: "Copy signature",
  copying: "Copying…",
  copied: "Copied",
  error: "Copy failed — open instead",
};

/**
 * One person in the directory: open the bare signature in a new tab, or copy it
 * straight to the clipboard.
 *
 * The copy path fetches the bare route and lifts its `<body>` out, rather than
 * embedding all 20 signatures in the page — the directory then costs one CMS
 * list call instead of twenty render calls, and the markup is fetched only for
 * the person actually being copied.
 */
export function SignatureCard({
  person,
}: {
  person: EmailSignatureSummary;
}): React.ReactElement {
  const [state, setState] = useState<CopyState>("idle");
  const href = `/email-signatures/${person.slug}`;

  const handleCopy = async (): Promise<void> => {
    setState("copying");
    try {
      const response = await fetch(href, { headers: { accept: "text/html" } });
      if (!response.ok) throw new Error(`Signature fetch failed: ${response.status}`);

      const document = new DOMParser().parseFromString(
        await response.text(),
        "text/html",
      );
      const body = document.body;
      if (!body || body.innerHTML.trim().length === 0) {
        throw new Error("Signature markup was empty");
      }

      const copied = await copyRichHtml(
        body.innerHTML,
        body.innerText ?? `${person.name}\n${person.jobTitle}\n${person.email}`,
      );
      setState(copied ? "copied" : "error");
    } catch {
      setState("error");
    }

    if (typeof window !== "undefined") {
      window.setTimeout(() => setState("idle"), 2500);
    }
  };

  return (
    <div className="group flex flex-col justify-between gap-5 rounded-[12px] border border-white/[0.07] bg-white/[0.035] p-6 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[var(--color-cs-cyan)]/60 hover:shadow-[0_10px_30px_-10px_rgba(44,193,235,0.3)]">
      <div>
        <h3 className="text-[length:var(--fs-h5)] font-semibold text-white">
          {person.name}
        </h3>
        <p className="mt-1 text-[length:var(--fs-caption)] text-white/60">
          {person.jobTitle}
        </p>
        <p className="mt-2 break-all text-[length:var(--fs-caption)] text-white/40">
          {person.email}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* `cs-btn-glass` — the same treatment as the navbar's Book a Demo CTA.
            Solid #3960F9 read as too heavy repeated 20 times down a dark grid;
            the glass fill sits back without losing its primary-action weight. */}
        <button
          type="button"
          onClick={handleCopy}
          disabled={state === "copying"}
          aria-live="polite"
          className="cs-btn-glass disabled:opacity-60"
          style={{ "--cs-btn-px": "16px" } as React.CSSProperties}
        >
          {LABELS[state]}
        </button>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center rounded-[8px] border border-white/15 px-4 text-[14px] font-medium text-white/80 transition-colors hover:border-[var(--color-cs-cyan)] hover:text-white"
        >
          Open
        </a>
      </div>
    </div>
  );
}
