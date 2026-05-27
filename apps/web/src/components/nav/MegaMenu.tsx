"use client";

import Link from "next/link";
import type { NavGroup } from "@/lib/nav-config";

const CTA_W = 240;
const COL_W = 280;

export function MegaMenu({
  groups,
  activeLabel,
  width,
}: {
  groups: NavGroup[];
  activeLabel: string;
  width?: number;
}) {
  const showDescriptions = groups.some((g) =>
    g.items.some((i) => Boolean(i.description))
  );
  const columns = Math.max(1, groups.length);
  const computedWidth = width ?? columns * COL_W + CTA_W;

  return (
    <div
      className="cs-mega-surface overflow-hidden"
      style={{ width: computedWidth }}
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: `1fr ${CTA_W}px` }}
      >
        <GroupsArea
          groups={groups}
          columns={columns}
          activeLabel={activeLabel}
          showDescriptions={showDescriptions}
        />
        <CtaCard />
      </div>
    </div>
  );
}

function GroupsArea({
  groups,
  columns,
  activeLabel,
  showDescriptions,
}: {
  groups: NavGroup[];
  columns: number;
  activeLabel: string;
  showDescriptions: boolean;
}) {
  return (
    <div
      className="grid gap-x-6 gap-y-4 px-4 py-5"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {groups.map((group, gi) => {
        const heading = group.title ?? (gi === 0 ? activeLabel : undefined);
        return (
          <div key={gi} className="flex flex-col">
            {heading && (
              <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2cc1eb]">
                {heading}
              </div>
            )}
            <ul className="flex flex-col">
              {group.items.map((item) => {
                const inner = (
                  <>
                    <div className="text-sm font-semibold leading-tight text-white/95">
                      {item.label}
                    </div>
                    {showDescriptions && item.description && (
                      <div className="mt-1 text-xs leading-snug text-white/55">
                        {item.description}
                      </div>
                    )}
                  </>
                );
                const cls =
                  "block rounded-[12px] px-3 py-2.5 transition-colors hover:bg-white/[0.06]";
                return (
                  <li key={item.label}>
                    {item.built ? (
                      <Link href={item.href} className={cls}>
                        {inner}
                      </Link>
                    ) : (
                      <span className={`${cls} cursor-pointer`}>{inner}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function CtaCard() {
  return (
    <div className="flex items-start p-4">
      <div
        className="flex w-full flex-col gap-3 rounded-[16px] border border-white/[0.08] p-4"
        style={{
          background:
            "linear-gradient(160deg, rgba(71,31,195,0.18) 0%, rgba(21,16,33,0.4) 60%, rgba(44,193,235,0.18) 100%)",
        }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(71,31,195,0.35) 0%, rgba(44,193,235,0.35) 100%)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M10 2L12.09 7.26L18 8.27L13.82 12.14L14.94 18L10 15.27L5.06 18L6.18 12.14L2 8.27L7.91 7.26L10 2Z"
              fill="#2cc1eb"
            />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">
            Ready to Get Started?
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-white/60">
            See how CleanStart hardens your container supply chain end-to-end.
          </p>
        </div>
        <Link
          href="/book-a-demo"
          className="cs-btn-glass inline-flex items-center justify-center"
          style={{
            ["--cs-btn-h" as string]: "34px",
            ["--cs-btn-px" as string]: "14px",
            ["--cs-btn-fs" as string]: "12px",
          }}
        >
          Book a Demo
        </Link>
      </div>
    </div>
  );
}
