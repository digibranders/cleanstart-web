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
        `fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)] transition-[background-color,backdrop-filter,box-shadow] duration-200 ${scrolled ? "cs-nav-shadow" : "bg-transparent"}`
      }
    >
      <div className="mx-auto flex h-[72px] max-w-[var(--container-default)] items-center justify-between gap-6 ps-[max(1.5rem,env(safe-area-inset-left))] pe-[max(1.5rem,env(safe-area-inset-right))]">
        <Link
          href="/"
          aria-label="CleanStart home"
          className="flex shrink-0 items-center text-white outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#33BAEC] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          <Logo className="h-7 w-auto" />
        </Link>

        <DesktopNav />

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="cs-btn-glass hidden lg:inline-flex"
            style={{
              ["--cs-btn-px" as string]: "22px",
              ["--cs-btn-fs" as string]: "14px",
            }}
          >
            Book a Demo
          </button>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
