"use client";

import type React from "react";
import { useState } from "react";
import type { BlogFaqItem } from "@/lib/blog";
import { Reveal } from "@/components/ui/Reveal";

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
          {/* Spacer matches the TOC sidebar width so the FAQ aligns with the article body. */}
          <div className="hidden xl:block shrink-0" style={{ width: "260px" }} aria-hidden />

          <div className="min-w-0 flex-1 mx-auto xl:mx-0" style={{ maxWidth: "680px" }}>
            <Reveal header>
              <h2
                className="font-display font-bold leading-[1.1] tracking-[-0.04em]"
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
                const id = item.id ?? String(i);
                const isOpen = openId === id;
                const answerId = `blog-faq-answer-${id}`;
                const questionId = `blog-faq-question-${id}`;
                return (
                  <div
                    key={id}
                    style={{
                      borderBottom: i < faqs.length - 1 ? "1px solid rgba(17,17,17,0.08)" : "none",
                    }}
                  >
                    <button
                      type="button"
                      id={questionId}
                      onClick={() => setOpenId(isOpen ? null : id)}
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

                    <section
                      id={answerId}
                      aria-labelledby={questionId}
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
                              className="font-normal leading-[1.65] tracking-[-0.01em]"
                              style={{
                                fontSize: "var(--fs-body-sm)",
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
