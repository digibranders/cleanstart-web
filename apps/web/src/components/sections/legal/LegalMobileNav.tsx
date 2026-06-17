'use client';

import { Sheet, SheetClose, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { ChevronDown, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { type LegalNavItem, LegalSidebar } from './LegalSidebar';

/**
 * Mobile-only Legal document navigation (<lg). The document list is a sticky
 * left rail on desktop; on a phone it stacks above the document, so here it
 * collapses into a slim sticky "you are here" bar (the current document title)
 * that opens a bottom sheet containing the same `LegalSidebar`. Mirrors the
 * Knowledge Hub mobile nav.
 */
export function LegalMobileNav({ items }: { items: LegalNavItem[] }): React.ReactElement {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the sheet whenever the route changes (a document link was tapped).
  // biome-ignore lint/correctness/useExhaustiveDependencies: close on every navigation, keyed by pathname.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const label = items.find((i) => i.href === pathname)?.label ?? 'Legal documents';

  return (
    // Fragment (not a wrapping div) so the bar is a direct child of the tall
    // content container — position:sticky pins within the parent's box, so a
    // short wrapper would let it scroll away. The negative top margin straddles
    // it onto the hero's bottom edge on phones; it stays sticky on scroll.
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="-mt-7 mb-6 sm:mt-0 lg:hidden sticky top-[calc(var(--cs-header-h)+0.5rem)] z-30 flex w-full items-center justify-between gap-3 rounded-xl border border-[#E5E9F2] bg-white px-4 py-3 text-left shadow-[0_4px_16px_-8px_rgba(15,16,35,0.18)]"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <Menu className="size-[18px] shrink-0" style={{ color: '#471EC0' }} aria-hidden />
          <span
            className="truncate font-display font-medium"
            style={{ fontSize: 'var(--fs-body-sm)', letterSpacing: '-0.01em', color: '#0F1023' }}
          >
            {label}
          </span>
        </span>
        <ChevronDown className="size-4 shrink-0" style={{ color: '#9A9DB0' }} aria-hidden />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="max-h-[85vh] rounded-t-2xl border-t-0 bg-white p-0 text-[#0F1023]"
        >
          <SheetTitle className="sr-only">Legal documents</SheetTitle>
          <div className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-[#E5E7EF]" aria-hidden />
          <SheetClose
            aria-label="Close"
            className="absolute top-3 right-3 z-10 rounded-full p-2 text-[#5A5F75] transition-colors hover:bg-[#F4F2FB]"
          >
            <X className="size-5" aria-hidden />
          </SheetClose>
          <div className="overflow-y-auto overscroll-contain px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <h2
              className="mb-3 border-b border-[#EDEEF4] pb-4 font-display font-semibold"
              style={{ fontSize: 'var(--fs-h5)', letterSpacing: '-0.02em', color: '#471EC0' }}
            >
              Legal
            </h2>
            <LegalSidebar items={items} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
