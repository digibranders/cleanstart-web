"use client";

import { useRef, useState } from "react";

export function CodeBlock({
  children,
  multiline = false,
}: {
  children: React.ReactNode;
  multiline?: boolean;
}): React.ReactElement {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = async (): Promise<void> => {
    const text = codeRef.current?.textContent ?? "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative mt-4">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy code"}
        className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium transition-colors"
        style={{
          background: copied ? "rgba(124, 227, 160, 0.16)" : "rgba(255, 255, 255, 0.08)",
          color: copied ? "#7CE3A0" : "#C9CCDE",
          fontSize: "var(--fs-caption)",
          lineHeight: 1,
        }}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
      <pre
        className="overflow-x-auto"
        style={{
          background: "#0F1023",
          borderRadius: "12px",
          padding: "20px 24px",
          paddingRight: "92px",
          color: "#7CE3A0",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          fontSize: "var(--fs-body-sm)",
          lineHeight: 1.6,
          whiteSpace: multiline ? "pre" : "pre-wrap",
        }}
      >
        <code ref={codeRef}>{children}</code>
      </pre>
    </div>
  );
}

function CopyIcon(): React.ReactElement {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon(): React.ReactElement {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
