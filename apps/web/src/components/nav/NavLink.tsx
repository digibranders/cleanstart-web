"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={
        `cs-nav-link relative inline-flex items-center text-base font-medium leading-none text-white/85 outline-none transition-colors hover:text-white focus-visible:rounded-sm focus-visible:text-white focus-visible:ring-2 focus-visible:ring-[#33BAEC] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${isActive ? "cs-nav-link-active text-white " : ""}${className}`
      }
    >
      {children}
    </Link>
  );
}
