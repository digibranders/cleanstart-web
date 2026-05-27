import Link from "next/link";
import { cn } from "@/lib/cn";

export interface LegalSidebarItem {
  label: string;
  href: string;
}

export const LEGAL_SIDEBAR_ITEMS: LegalSidebarItem[] = [
  { label: "Additional Third-Party Terms", href: "/legal" },
  { label: "Customer Data Protection Notice", href: "/legal/customer-data-protection-notice" },
  { label: "Cybersecurity Disclosure", href: "/legal/cybersecurity-disclosure" },
  { label: "Acceptable Use Policy", href: "/legal/acceptable-use-policy" },
  { label: "Vulnerability Reporting Policy", href: "/legal/vulnerability-reporting-policy" },
  { label: "Cyber Security Policy", href: "/legal/cyber-security-policy" },
];

interface LegalSidebarProps {
  activeHref: string;
}

export function LegalSidebar({ activeHref }: LegalSidebarProps): React.ReactElement {
  return (
    <nav aria-label="Legal documents" className="lg:sticky lg:top-24">
      <ul className="flex flex-col gap-1">
        {LEGAL_SIDEBAR_ITEMS.map((item) => {
          const isActive = item.href === activeHref;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-[#EEF1FF] text-[#1E2A78] font-semibold"
                    : "text-[#475569] hover:text-[#1E2A78] hover:bg-[#F4F6FB]",
                )}
                style={{ fontSize: "var(--fs-body-sm)" }}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
