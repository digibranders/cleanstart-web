"use client";

import type React from "react";
import { useState } from "react";
import type { BlogFaqItem } from "@/lib/blog";

interface BlogDetailFAQProps {
  faqs: BlogFaqItem[];
}

export function BlogDetailFAQ({ faqs }: BlogDetailFAQProps): React.ReactElement | null {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!faqs.length) return null;

  return (
    <section className="relative w-full bg-white" data-section="BlogDetailFAQ">
      <div className="relative mx-auto max-w-[1120px] px-6 pb-20">
        <div className="relative flex gap-12">
          {/* Spacer matching TOC sidebar width so FAQ aligns with article body */}
          <div className="hidden xl:block shrink-0" style={{ width: "260px" }} aria-hidden />

          <div className="min-w-0 flex-1 mx-auto xl:mx-0" style={{ maxWidth: "680px" }}>
            <h2
              style={{
                fontFamily: "var(--font-figtree), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 700,
                fontSize: "clamp(22px, 2vw, 32px)",
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                color: "#111111",
                marginBottom: "24px",
              }}
            >
              Frequently Asked Questions
            </h2>

            <div
              className="rounded-[24px]"
              style={{
                border: "1px solid rgba(17,17,17,0.08)",
                overflow: "hidden",
              }}
            >
              {faqs.map((item, i) => {
                const id = item.id ?? String(i);
                const isOpen = openId === id;
                const answerId = `blog-faq-answer-${id}`;
                return (
                  <div
                    key={id}
                    style={{
                      borderBottom: i < faqs.length - 1 ? "1px solid rgba(17,17,17,0.08)" : "none",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : id)}
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      className="group flex w-full items-start justify-between gap-6 text-left cursor-pointer"
                      style={{ padding: "20px 24px" }}
                    >
                      <span
                        className="flex-1 transition-colors duration-200 group-hover:text-[#3960f9]"
                        style={{
                          fontFamily: "var(--font-figtree), ui-sans-serif, system-ui, sans-serif",
                          fontWeight: 600,
                          fontSize: "clamp(15px, 1.1vw, 17px)",
                          lineHeight: 1.4,
                          letterSpacing: "-0.02em",
                          color: "#111111",
                        }}
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

                    <section
                      id={answerId}
                      aria-hidden={!isOpen}
                      style={{
                        maxHeight: isOpen ? "800px" : "0px",
                        opacity: isOpen ? 1 : 0,
                        overflow: "hidden",
                        transition:
                          "max-height 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease-out",
                      }}
                    >
                      <div style={{ padding: "0 24px 20px" }}>
                        {item.answer.split("\n").map((para, j) =>
                          para.trim() ? (
                            <p
                              key={j}
                              style={{
                                fontFamily: "var(--font-figtree), ui-sans-serif, system-ui, sans-serif",
                                fontWeight: 400,
                                fontSize: "clamp(14px, 1vw, 15px)",
                                lineHeight: 1.65,
                                letterSpacing: "-0.01em",
                                color: "rgba(17,17,17,0.65)",
                                marginBottom: j < item.answer.split("\n").filter(Boolean).length - 1 ? "12px" : "0",
                              }}
                            >
                              {para}
                            </p>
                          ) : null
                        )}
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
