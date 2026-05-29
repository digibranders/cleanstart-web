"use client";

import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  useReducedMotion,
} from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { EASE_SOFT } from "@/lib/motion";
import { SIDEBAR_GROUPS, SIDEBAR_PANEL } from "./articles";

export function KnowledgeHubSidebar(): React.ReactElement {
  const pathname = usePathname();
  const activeSlug = pathname.split("/").filter(Boolean).pop() ?? "";
  const reduceMotion = useReducedMotion();

  const activeGroup = SIDEBAR_GROUPS.find((group) =>
    group.items.some((item) => item.slug === activeSlug),
  );

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      SIDEBAR_GROUPS.map((group) => [
        group.label,
        group.label === activeGroup?.label,
      ]),
    ),
  );

  const toggle = (label: string): void =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  const activeGroupLabel = activeGroup?.label;
  useEffect(() => {
    if (!activeGroupLabel) return;
    setOpenGroups((prev) =>
      prev[activeGroupLabel] ? prev : { ...prev, [activeGroupLabel]: true },
    );
  }, [activeGroupLabel]);

  return (
    <LazyMotion features={domAnimation}>
      <nav aria-label="Knowledge Hub categories" className="flex flex-col">
        <h2
          className="border-b border-[#EDEEF4] pb-4 font-display font-semibold"
          style={{
            fontSize: "var(--fs-h5)",
            letterSpacing: "-0.02em",
            color: "#471EC0",
          }}
        >
          {SIDEBAR_PANEL}
        </h2>

        <div className="mt-3 flex flex-col gap-0.5">
          {SIDEBAR_GROUPS.map((group) => {
            const open = openGroups[group.label] ?? false;
            const isActiveGroup = group.label === activeGroup?.label;
            return (
              <div key={group.label}>
                <button
                  type="button"
                  onClick={() => toggle(group.label)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 text-left font-display font-medium transition-colors duration-150 hover:bg-[#F6F5FB]"
                  style={{
                    fontSize: "var(--fs-body)",
                    letterSpacing: "-0.01em",
                    color: "#0F1023",
                  }}
                >
                  <span className="flex items-center gap-2.5">
                    <GroupIcon
                      label={group.label}
                      color={isActiveGroup ? "#471EC0" : "#9094A8"}
                    />
                    <span>{group.label}</span>
                  </span>
                  <Chevron open={open} />
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <m.div
                      key="panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.26,
                        ease: EASE_SOFT,
                      }}
                      className="overflow-hidden"
                    >
                      <ul className="flex flex-col gap-0.5 pt-0.5 pb-2">
                        {group.items.map((item) => {
                          const active = item.slug === activeSlug;
                          return (
                            <li key={item.slug}>
                              <Link
                                href={`/knowledge-hub/${item.slug}`}
                                aria-current={active ? "page" : undefined}
                                className={`relative block rounded-[10px] py-2 pl-5 pr-3 transition-colors duration-150 ${
                                  active ? "bg-[#F4F2FB]" : "hover:bg-[#F8F7FC]"
                                }`}
                                style={{
                                  fontSize: "var(--fs-body-sm)",
                                  lineHeight: 1.4,
                                  color: active ? "#0F1023" : "#5A5F75",
                                  fontWeight: active ? 600 : 400,
                                  boxShadow: active
                                    ? "inset 0 0 0 1px rgba(71,30,192,0.10)"
                                    : undefined,
                                }}
                              >
                                {active && (
                                  <span
                                    aria-hidden
                                    className="absolute left-1.5 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full"
                                    style={{ background: "#471EC0" }}
                                  />
                                )}
                                {item.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </nav>
    </LazyMotion>
  );
}

function GroupIcon({
  label,
  color,
}: {
  label: string;
  color: string;
}): React.ReactElement {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 transition-colors duration-150"
      aria-hidden
    >
      {ICON_PATHS[label] ?? ICON_PATHS.default}
    </svg>
  );
}

const ICON_PATHS: Record<string, React.ReactElement> = {
  // Emerging Standards — sparkle
  "Emerging Standards": (
    <>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </>
  ),
  // Security features — shield with check
  "Security features": (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  // Compliance and Certification — award rosette
  "Compliance and Certification": (
    <>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" />
    </>
  ),
  // DevOps Kyverno — git branch
  "DevOps Kyverno": (
    <>
      <line x1="6" x2="6" y1="3" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </>
  ),
  default: <circle cx="12" cy="12" r="8" />,
};

function Chevron({ open }: { open: boolean }): React.ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        color: "#9A9DB0",
      }}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
