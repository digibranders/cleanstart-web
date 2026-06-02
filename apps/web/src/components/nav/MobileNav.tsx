"use client";

import { useState } from "react";
import Link from "next/link";

import { MenuIcon } from "lucide-react";
import { Logo } from "@/components/icons/Logo";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { NAV_TREE } from "@/lib/nav-config";
import { NavIcon } from "@/components/nav/icons/NavIcon";

const MOBILE_CTA: Record<string, { headline: string; ctaLabel: string; ctaHref: string } | undefined> = {
  Products: { headline: "Try CleanStart", ctaLabel: "Browse Images", ctaHref: "/cleanstart-images" },
  Solutions: { headline: "Map your compliance", ctaLabel: "Talk to SE", ctaHref: "/book-a-demo?intent=se" },
  Resources: { headline: "Get the Bulletin", ctaLabel: "Subscribe", ctaHref: "/subscribe" },
  Company: { headline: "We're hiring", ctaLabel: "See Careers", ctaHref: "/careers" },
};

export function MobileNav({ openRolesCount = 0 }: { openRolesCount?: number }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open menu"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white outline-none transition-colors hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-[#33BAEC] lg:hidden"
      >
        <MenuIcon className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[88vw] max-w-[360px] sm:max-w-[360px] !border-l-white/8 flex flex-col gap-0 p-0"
      >
        <div className="flex justify-center pt-2" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-white/15" />
        </div>
        <SheetTitle className="sr-only">CleanStart navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Browse CleanStart products, solutions, resources, and company links.
        </SheetDescription>

        <div className="flex items-center border-b border-white/8 px-4 py-4">
          <Link
            href="/"
            onClick={close}
            aria-label="CleanStart home"
            className="flex items-center text-white outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#33BAEC]"
          >
            <Logo className="h-7 w-auto" />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <Accordion className="flex w-full flex-col gap-1" >
            {NAV_TREE.map((item) => {
              if (item.kind === "flat") {
                const flatClass =
                  "block cursor-pointer rounded-[10px] px-3 py-3 text-base font-medium text-white/90 transition-colors hover:bg-white/[0.06] hover:text-white";
                if (item.built === false) return null;
                return (
                  <Link key={item.label} href={item.href} className={flatClass}>
                    {item.label}
                  </Link>
                );
              }
              const leaves =
                item.kind === "mega"
                  ? item.groups.flatMap((g) =>
                      g.title
                        ? [{ __header: g.title } as const, ...g.items]
                        : g.items
                    )
                  : item.items;
              return (
                <AccordionItem
                  key={item.label}
                  value={item.label}
                  className="!border-b-0"
                >
                  <AccordionTrigger className="px-3 py-3 text-base font-medium text-white/90 hover:text-white hover:no-underline">
                    {item.label}
                  </AccordionTrigger>
                  <AccordionContent className="pl-3 [&_a]:!no-underline">
                    <ul className="flex flex-col gap-0.5 pb-1">
                      {leaves.map((leaf, i) =>
                        "__header" in leaf ? (
                          <li
                            key={`h-${i}`}
                            className="px-3 pt-3 pb-1 text-2xs font-semibold uppercase tracking-[0.08em] text-white/40"
                          >
                            {leaf.__header}
                          </li>
                        ) : (
                          <li key={leaf.label}>
                            {leaf.built === false ? null : (
                              <Link
                                href={leaf.href}
                                onClick={close}
                                className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm text-white/80 no-underline transition-colors hover:bg-white/[0.06] hover:text-white"
                              >
                                {leaf.icon && <NavIcon id={leaf.icon} size={14} className="opacity-70" />}
                                {leaf.label}
                              </Link>
                            )}
                          </li>
                        )
                      )}
                    </ul>
                    {MOBILE_CTA[item.label] && (
                      <Link
                        href={MOBILE_CTA[item.label]!.ctaHref}
                        onClick={close}
                        className="mx-3 mb-3 mt-2 flex items-center justify-between rounded-[10px] border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 no-underline"
                      >
                        <span className="text-xs font-semibold text-white">
                          {item.label === "Company" && openRolesCount > 0
                            ? `${openRolesCount} open roles`
                            : MOBILE_CTA[item.label]!.headline}
                        </span>
                        <span
                          className="cs-btn-glass inline-flex items-center justify-center"
                          style={{
                            ["--cs-btn-h" as string]: "30px",
                            ["--cs-btn-px" as string]: "12px",
                            ["--cs-btn-fs" as string]: "11px",
                          }}
                        >
                          {MOBILE_CTA[item.label]!.ctaLabel}
                        </span>
                      </Link>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        <div className="border-t border-white/8 p-4">
          <Link
            href="/book-a-demo"
            onClick={close}
            className="cs-btn-glass w-full justify-center"
            style={{
              ["--cs-btn-h" as string]: "40px",
              ["--cs-btn-px" as string]: "18px",
              ["--cs-btn-fs" as string]: "13px",
            }}
          >
            Book a Demo
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
