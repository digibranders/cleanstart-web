"use client";

import type { ReactNode } from "react";
import { useScrolled } from "@/components/nav/useScrolled";

export function HeaderScrollShell({ children }: { children: ReactNode }) {
  const scrolled = useScrolled(24);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)] transition-[background-color,backdrop-filter,box-shadow] duration-200 ${
        scrolled ? "cs-nav-shadow backdrop-blur-xl" : "backdrop-blur-md bg-[rgba(11,8,22,0.35)]"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-[var(--container-default)] items-center justify-between gap-6 ps-[max(1.5rem,env(safe-area-inset-left))] pe-[max(1.5rem,env(safe-area-inset-right))] sm:ps-[max(2.5rem,env(safe-area-inset-left))] sm:pe-[max(2.5rem,env(safe-area-inset-right))]">
        {children}
      </div>
    </header>
  );
}
