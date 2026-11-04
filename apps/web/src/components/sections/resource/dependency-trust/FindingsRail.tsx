"use client";

import { useEffect, useState } from "react";

interface RailItem {
  id: string;
  number: string;
  title: string;
}

interface FindingsRailProps {
  heading: string;
  items: readonly RailItem[];
  /** The gated download button, rendered by the server and slotted in here. */
  cta: React.ReactNode;
}

/**
 * Section heading, an index of the five findings and the download button, held
 * in view beside the long-form text. The index follows the reader: whichever
 * finding sits in the upper-middle band of the viewport is marked current.
 */
export function FindingsRail({ heading, items, cta }: FindingsRailProps): React.ReactElement {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, [items]);

  return (
    <div className="lg:sticky lg:top-28 lg:self-start">
      <h2
        className="text-[#111]"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-h2)",
          fontWeight: 600,
          letterSpacing: "-0.03em",
          lineHeight: "var(--fs-h2-lh)",
          textWrap: "balance",
        }}
      >
        {heading}
      </h2>

      <nav aria-label={heading} className="mt-8 hidden lg:block">
        <ol className="flex flex-col gap-4">
          {items.map((item) => {
            const isActive = item.id === active;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={isActive ? "true" : undefined}
                  className="group flex items-start gap-3 rounded-[8px] outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3960F9]"
                >
                  <span
                    className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full tabular-nums transition-colors duration-300 ${
                      isActive ? "bg-[#6A3DF0] text-white" : "bg-[#EAE4FF] text-[#471EC0]"
                    }`}
                    style={{ fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: 600 }}
                  >
                    {item.number}
                  </span>
                  <span
                    className={`transition-colors duration-300 ${
                      isActive
                        ? "text-[#111]"
                        : "text-[rgba(17,17,17,0.5)] group-hover:text-[rgba(17,17,17,0.8)]"
                    }`}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-body-sm)",
                      fontWeight: isActive ? 600 : 400,
                      lineHeight: 1.4,
                    }}
                  >
                    {item.title}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="mt-8 hidden lg:block">{cta}</div>
    </div>
  );
}
