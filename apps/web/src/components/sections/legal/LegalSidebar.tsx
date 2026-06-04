"use client";

import {
  BadgeCheck,
  Bug,
  FileCheck2,
  FileLock2,
  FileText,
  type LucideIcon,
  Scale,
  ScrollText,
  Stamp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export interface LegalSidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Human-readable "last updated" date, surfaced in the legal hero. */
  updatedAt: string;
}

export const LEGAL_SIDEBAR_ITEMS: LegalSidebarItem[] = [
  { label: "Additional Third-Party Terms", href: "/legal", icon: FileText, updatedAt: "June 4, 2026" },
  {
    label: "Customer Data Processing Addendum",
    href: "/legal/customer-data-processing-addendum",
    icon: FileLock2,
    updatedAt: "June 4, 2026",
  },
  {
    label: "Limited Use Agreement",
    href: "/legal/limited-use-agreement",
    icon: ScrollText,
    updatedAt: "June 4, 2026",
  },
  {
    label: "Policies and Commitments",
    href: "/legal/policies-and-commitments",
    icon: BadgeCheck,
    updatedAt: "June 4, 2026",
  },
  {
    label: "Pre-General Availability Terms",
    href: "/legal/pre-general-availability-terms",
    icon: FileCheck2,
    updatedAt: "June 4, 2026",
  },
  {
    label: "Trademark Usage Policy",
    href: "/legal/trademark-usage-policy",
    icon: Stamp,
    updatedAt: "June 4, 2026",
  },
  {
    label: "Vulnerability Disclosure Policies",
    href: "/legal/vulnerability-disclosure-policies",
    icon: Bug,
    updatedAt: "June 4, 2026",
  },
  {
    label: "Acceptable Use Policy",
    href: "/legal/acceptable-use-policy",
    icon: Scale,
    updatedAt: "June 4, 2026",
  },
];

export function LegalSidebar(): React.ReactElement {
  const pathname = usePathname();
  return (
    <nav aria-label="Legal documents" className="lg:sticky lg:top-24">
      <ul className="flex flex-col gap-1">
        {LEGAL_SIDEBAR_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
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
