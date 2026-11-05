"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { Finding, Run } from "./content";
import { Bezel, type Tone, TONES } from "./parts";

const runText = (run: Run): string => (typeof run === "string" ? run : run.strong);

const FADE = "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none";

/**
 * The five findings as one story. On large screens the icon stage stays in view
 * and swaps to the finding that is crossing the middle of the viewport, so the
 * reader always knows where they are; the other findings dim. On small screens
 * there is no stage: each finding carries its own icon and reads at full strength.
 */
export function FindingsStory({ items, tone }: { items: readonly Finding[]; tone: Tone }): React.ReactElement {
  const t = TONES[tone];
  const [active, setActive] = useState(0);
  const articles = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-42% 0px -48% 0px" },
    );
    for (const el of articles.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
      <div className="hidden lg:col-span-5 lg:block" aria-hidden>
        <div className="sticky top-[17vh]">
          <Bezel tone={tone} className="mx-auto max-w-[480px]" innerClassName="aspect-[1/1.02]">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(60% 55% at 50% 45%, rgba(154, 81, 255, 0.22) 0%, rgba(44, 193, 235, 0.07) 55%, rgba(255,255,255,0) 100%)",
              }}
            />
            {items.map((finding, index) => (
              <div
                key={finding.id}
                className={`absolute inset-0 flex flex-col items-center justify-center gap-4 ${FADE}`}
                style={{
                  opacity: active === index ? 1 : 0,
                  transform: active === index ? "scale(1)" : "scale(0.94)",
                }}
              >
                <Image
                  src={finding.icon}
                  alt=""
                  width={360}
                  height={360}
                  sizes="300px"
                  className="h-[min(300px,60%)] w-[min(300px,60%)] object-contain"
                />
                <p
                  style={{
                    ...t.stat,
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--fs-display)",
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                  }}
                >
                  {finding.number}
                </p>
              </div>
            ))}
          </Bezel>
          <div className="mx-auto mt-6 flex max-w-[480px] items-center justify-center gap-2">
            {items.map((finding, index) => (
              <span
                key={finding.id}
                className={`h-1.5 rounded-full ${FADE}`}
                style={{
                  width: active === index ? 40 : 14,
                  background: active === index ? "linear-gradient(90deg, #9A51FF, #4FD1F5)" : t.tick,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-16 lg:col-span-7 lg:gap-0">
        {items.map((finding, index) => (
          <article
            key={finding.id}
            id={finding.id}
            ref={(el) => {
              articles.current[index] = el;
            }}
            data-index={index}
            data-active={active === index}
            className={`scroll-mt-32 lg:flex lg:min-h-[34vh] lg:flex-col lg:justify-center lg:py-8 lg:data-[active=false]:opacity-50 ${FADE}`}
          >
            <Image
              src={finding.icon}
              alt=""
              aria-hidden
              width={360}
              height={360}
              sizes="112px"
              className="mb-6 h-28 w-28 object-contain lg:hidden"
            />
            <h3
              style={{
                color: t.heading,
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-h3)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.15,
                textWrap: "balance",
              }}
            >
              <span className="lg:hidden" style={t.stat}>
                {finding.number}{" "}
              </span>
              {finding.title}
            </h3>
            <div className="mt-5 flex max-w-[62ch] flex-col gap-4">
              {finding.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.map(runText).join("").slice(0, 48)}
                  className="[&_strong]:font-semibold"
                  style={{
                    color: t.body,
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-body)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.6,
                  }}
                >
                  {paragraph.map((run) =>
                    typeof run === "string" ? (
                      run
                    ) : (
                      <strong key={run.strong} style={{ color: t.strong }}>
                        {run.strong}
                      </strong>
                    ),
                  )}
                </p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
