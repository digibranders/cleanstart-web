'use client';

import { Search } from 'lucide-react';

import { useSearch } from './SearchProvider';

interface SearchTriggerBarProps {
  placeholder?: string;
  ariaLabel?: string;
}

/**
 * A search-bar-shaped button that opens the global command palette. Used in
 * hero sections in place of a real input: instant ⌘K search is a far better
 * UX for a large content set than a form that filters a grid. Mirrors the
 * translucent glass look (and sleek 40px height) of the old hero SearchBar.
 */
export function SearchTriggerBar({
  placeholder = 'Search articles, guides, news…',
  ariaLabel = 'Open search',
}: SearchTriggerBarProps): React.ReactElement {
  const { openSearch } = useSearch();

  return (
    <button
      type="button"
      onClick={openSearch}
      aria-label={ariaLabel}
      aria-keyshortcuts="Meta+K Control+K"
      className="group flex h-10 w-full max-w-[674px] items-center gap-3 rounded-[12px] border border-[rgba(237,203,255,0.6)] bg-white/20 px-[14px] text-left transition-colors hover:bg-white/25 sm:h-11"
    >
      <Search className="size-5 shrink-0 text-white/70" aria-hidden />
      <span className="flex-1 truncate text-base text-white/60">{placeholder}</span>
      <kbd className="hidden shrink-0 items-center gap-0.5 rounded-md border border-white/25 bg-white/10 px-1.5 py-0.5 font-sans text-[11px] font-medium text-white/65 sm:inline-flex">
        ⌘K
      </kbd>
    </button>
  );
}
