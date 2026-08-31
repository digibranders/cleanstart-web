"use client";

import type React from "react";
import { useEffect, useState } from "react";
import type { GuideFaqItem } from "@/lib/guides";
import { RenderLexical } from "@/lib/renderLexical";
import { Reveal } from "@/components/ui/Reveal";

interface GuideDetailFAQProps {
  faqs: GuideFaqItem[];
}

export function GuideDetailFAQ({
  faqs,
}: GuideDetailFAQProps): React.ReactElement | null {
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyErrorId, setCopyErrorId] = useState<string | null>(null);
  const [copyErrorUrl, setCopyErrorUrl] = useState<string | null>(null);

  // Anchor ids are keyed off the stable Payload row id, not the question
  // text, so editing a question never breaks a previously shared link.
  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) return;
    const hash = window.location.hash.replace(/^#/, "");
    const hasMatch = faqs.some((item, i) => hash === `faq-${item.id ?? i}`);
    if (!hasMatch) return;
    setOpenId(hash);
    setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }, [faqs]);

  const toggleOpen = (anchorId: string): void => {
    const nextOpen = openId === anchorId ? null : anchorId;
    setOpenId(nextOpen);
    if (nextOpen && typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${nextOpen}`);
    }
  };

  const handleCopyLink = (anchorId: string): void => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}#${anchorId}`;
    navigator.clipboard.writeText(url).then(
      () => {
        setCopyErrorId(null);
        setCopiedId(anchorId);
        setTimeout(() => setCopiedId(null), 2000);
      },
      () => {
        setCopiedId(null);
        setCopyErrorUrl(url);
        setCopyErrorId(anchorId);
        setTimeout(() => setCopyErrorId(null), 6000);
      },
    );
  };

  if (!faqs.length) return null;

  return (
    <section className="relative w-full bg-white" data-section="GuideDetailFAQ">
      <div className="relative mx-auto max-w-[1120px] px-6 pb-20">
        <div className="relative flex gap-12">
          {/* Spacer matches the TOC sidebar width so the FAQ aligns with the article body. */}
          <div className="hidden xl:block shrink-0" style={{ width: "260px" }} aria-hidden />

          <div className="min-w-0 flex-1 mx-auto xl:mx-0" style={{ maxWidth: "680px" }}>
            <Reveal header>
              <h2
                className="font-display font-semibold leading-[1.1] tracking-[-0.04em]"
                style={{ fontSize: "var(--fs-h3)", color: "#111111", marginBottom: "24px" }}
              >
                Frequently Asked Questions
              </h2>
            </Reveal>

            <div
              className="rounded-[24px]"
              style={{
                border: "1px solid rgba(17,17,17,0.08)",
                overflow: "hidden",
              }}
            >
              {faqs.map((item, i) => {
                const rowId = item.id ?? String(i);
                const anchorId = `faq-${rowId}`;
                const isOpen = openId === anchorId;
                const answerId = `guide-faq-answer-${rowId}`;
                const questionId = `guide-faq-question-${rowId}`;
                return (
                  <div
                    key={anchorId}
                    id={anchorId}
                    style={{
                      borderBottom: i < faqs.length - 1 ? "1px solid rgba(17,17,17,0.08)" : "none",
                    }}
                  >
                    {/* APG accordion pattern: heading wraps the trigger so each
                        question is a real H3 under the section <h2>. Transparent
                        wrapper (preflight zeroes margin, no direct text), so the
                        button styling is unchanged. */}
                    <h3 className="m-0">
                      <button
                        type="button"
                        id={questionId}
                        onClick={() => toggleOpen(anchorId)}
                        aria-expanded={isOpen}
                        aria-controls={answerId}
                        className="group flex w-full items-start justify-between gap-6 text-left cursor-pointer"
                        style={{ padding: "20px 24px" }}
                      >
                        <span
                          className="flex-1 font-display font-semibold leading-[1.4] tracking-[-0.02em] transition-colors duration-200 group-hover:text-[#3960f9]"
                          style={{ fontSize: "var(--fs-body)", color: "#111111" }}
                        >
                          {item.question}
                        </span>
                        <span
                          aria-hidden
                          className="relative mt-0.5 flex shrink-0 items-center justify-center"
                          style={{
                            width: "24px",
                            height: "24px",
                            transition: "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
                            transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect x="2" y="7" width="12" height="2" rx="1" fill="#111111" />
                            <rect x="7" y="2" width="2" height="12" rx="1" fill="#111111" />
                          </svg>
                        </span>
                      </button>
                    </h3>

                    <section
                      id={answerId}
                      aria-labelledby={questionId}
                      // `inert` (not just `aria-hidden`) removes the whole
                      // collapsed panel from the tab order and a11y tree in
                      // one step — including any links inside the answer's
                      // rich text, not just the Copy-link button below.
                      inert={!isOpen}
                      style={{
                        maxHeight: isOpen ? "800px" : "0px",
                        opacity: isOpen ? 1 : 0,
                        overflow: "hidden",
                        transition:
                          "max-height 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease-out",
                      }}
                    >
                      <div style={{ padding: "0 24px 20px" }}>
                        <RenderLexical content={item.answer} wrapperClassName="faq-answer-body" />
                        <div className="flex flex-col items-end gap-1.5 pt-3">
                          {copyErrorId === anchorId && copyErrorUrl ? (
                            <output className="max-w-full break-all text-right text-xs text-black/60">
                              Couldn&apos;t copy automatically. Copy this link manually: {copyErrorUrl}
                            </output>
                          ) : null}
                          {/* Visually-hidden live region: the button's static aria-label
                              overrides its own text for the accessible name, so the
                              "Link copied" swap alone gives screen-reader users no
                              confirmation — announce it separately, matching the
                              copy-failure message above. */}
                          {copiedId === anchorId ? (
                            <output className="sr-only">Link copied to clipboard</output>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleCopyLink(anchorId)}
                            className="inline-flex items-center gap-1.5 text-xs text-black/50 hover:text-[#3960f9] transition-colors py-1 px-2 rounded-md hover:bg-black/[0.04] cursor-pointer"
                            aria-label="Copy link to this answer"
                          >
                            {copiedId === anchorId ? (
                              <>
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M13.5 4.5l-7 7L3 8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>Link copied</span>
                              </>
                            ) : (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>Copy link</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </section>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


