"use client";

import { useEffect, useRef, useState } from "react";
import { copyText } from "@/lib/clipboard";

interface CopyLinkButtonProps {
  url: string;
  tone?: "light" | "dark";
}

export function CopyLinkButton({ url, tone = "dark" }: CopyLinkButtonProps): React.ReactElement {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onClick = async (): Promise<void> => {
    const ok = await copyText(url);
    setState(ok ? "copied" : "failed");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2200);
  };

  const dark = tone === "dark";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border px-[18px] font-sans text-[14px] font-medium transition-colors duration-200 active:translate-y-px motion-reduce:transition-none ${
        dark
          ? "border-white/30 text-white hover:bg-white/10"
          : "border-[rgba(18,16,28,0.18)] bg-white text-[#12101C] hover:border-[#5B2EE0] hover:text-[#5B2EE0]"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
        <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
      </svg>
      <span aria-live="polite">
        {state === "copied" ? "Link copied" : state === "failed" ? "Copy failed" : "Copy link"}
      </span>
    </button>
  );
}
