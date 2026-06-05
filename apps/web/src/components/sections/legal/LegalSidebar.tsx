"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { legalIcon } from "./legalIcons";

export interface LegalNavItem {
  label: string;
  href: string;
  icon: string;
}

export function LegalSidebar({ items }: { items: LegalNavItem[] }): React.ReactElement {
  const pathname = usePathname();
  return (
    <nav aria-label="Legal documents" className="lg:sticky lg:top-24">
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = legalIcon(item.icon);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 transition-colors",
                  isActive
                    ? "bg-[#EEF1FF] text-[#1E2A78] font-semibold"
                    : "text-[#475569] hover:text-[#1E2A78] hover:bg-[#F4F6FB]",
                )}
                style={{ fontSize: "var(--fs-body-sm)" }}
              >
                <Icon
                  aria-hidden
                  strokeWidth={isActive ? 2.25 : 1.75}
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-[#471EC0]" : "text-[#94A3B8]",
                  )}
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
