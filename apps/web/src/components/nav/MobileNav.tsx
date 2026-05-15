"use client";

import { useState } from "react";
import Link from "next/link";

import { MenuIcon } from "lucide-react";
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

export function MobileNav() {
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
        <SheetTitle className="sr-only">CleanStart navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Browse CleanStart products, solutions, resources, and company links.
        </SheetDescription>

        <div className="flex-1 overflow-y-auto px-2 pt-16 pb-6">
          <Accordion className="flex w-full flex-col gap-1" >
            {NAV_TREE.map((item) => {
              if (item.kind === "flat") {
                return (
                  <span
                    key={item.label}
                    className="block rounded-[10px] px-3 py-3 text-base font-medium text-white/90 cursor-default"
                  >
                    {item.label}
                  </span>
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
                  <AccordionContent className="pl-3">
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
                            {leaf.built ? (
                              <Link
                                href={leaf.href}
                                onClick={close}
                                className="block rounded-[8px] px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
                              >
                                {leaf.label}
                              </Link>
                            ) : (
                              <span className="block rounded-[8px] px-3 py-2 text-sm text-white/80 cursor-default">
                                {leaf.label}
                              </span>
                            )}
                          </li>
                        )
                      )}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        <div className="border-t border-white/8 p-4">
          <button
            type="button"
            onClick={close}
            className="cs-btn-glass w-full"
            style={{
              ["--cs-btn-h" as string]: "44px",
              ["--cs-btn-px" as string]: "22px",
              ["--cs-btn-fs" as string]: "15px",
            }}
          >
            Book a Demo
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
