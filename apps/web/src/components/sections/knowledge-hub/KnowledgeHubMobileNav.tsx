'use client';

import { Sheet, SheetClose, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { type KhGroup, findActiveLocation } from '@/lib/knowledge-hub-shared';
import { ChevronDown, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { KnowledgeHubSidebar } from './KnowledgeHubSidebar';

/**
 * Mobile-only Knowledge Hub navigation (<lg). The full category tree is a left
 * rail on desktop; on a phone that would push the article ~700px down, so here
 * it collapses into a slim sticky "you are here" bar that opens a bottom sheet
 * containing the same `KnowledgeHubSidebar` (auto-expanded to the active item).
 */
export function KnowledgeHubMobileNav({ groups }: { groups: KhGroup[] }): React.ReactElement {
  const pathname = usePathname();
  const activeSlug = pathname.split('/').filter(Boolean).pop() ?? '';
  const [open, setOpen] = useState(false);

  // Close the sheet whenever the route changes (i.e. a category link was tapped).
  // biome-ignore lint/correctness/useExhaustiveDependencies: close on every navigation, keyed by pathname.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const { group, sub } = findActiveLocation(groups, activeSlug);
  const label = group
    ? sub
      ? `${group.name} › ${sub.name}`
      : group.name
    : 'Browse the Knowledge Hub';

  return (
    <div className="mb-6 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="sticky top-[calc(var(--cs-header-h)+0.5rem)] z-30 flex w-full items-center justify-between gap-3 rounded-xl border border-[#EDEEF4] bg-white px-4 py-3 text-left shadow-[0_4px_16px_-8px_rgba(15,16,35,0.18)]"
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
          <SheetTitle className="sr-only">Knowledge Hub categories</SheetTitle>
          <div className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-[#E5E7EF]" aria-hidden />
          <SheetClose
            aria-label="Close"
            className="absolute top-3 right-3 z-10 rounded-full p-2 text-[#5A5F75] transition-colors hover:bg-[#F4F2FB]"
          >
            <X className="size-5" aria-hidden />
          </SheetClose>
          <div className="overflow-y-auto overscroll-contain px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <KnowledgeHubSidebar groups={groups} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
