"use client";

import Link from "next/link";
import { Logo } from "@/components/icons/Logo";
import { DesktopNav } from "@/components/nav/DesktopNav";
import { MobileNav } from "@/components/nav/MobileNav";
import { useScrolled } from "@/components/nav/useScrolled";

export function Header() {
  const scrolled = useScrolled(24);

  return (
    <header
      className={
        `fixed inset-x-0 top-0 z-40 transition-[background-color,backdrop-filter,box-shadow] duration-200 ${scrolled ? "cs-nav-shadow" : "bg-transparent"}`
      }
    >
      <div className="mx-auto flex h-[72px] max-w-[1276px] items-center justify-between gap-6 px-6">
        <Link
          href="/"
          aria-label="CleanStart home"
          className="flex items-center text-white outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#33BAEC] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          <Logo className="h-7 w-auto" />
        </Link>

        <DesktopNav />

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="cs-btn-glass hidden xl:inline-flex"
            style={{
              ["--cs-btn-h" as string]: "38px",
              ["--cs-btn-px" as string]: "22px",
              ["--cs-btn-fs" as string]: "14px",
            }}
          >
            Book a Demo
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
