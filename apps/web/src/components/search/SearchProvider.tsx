'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { SearchCommandPalette } from './SearchCommandPalette';

interface SearchContextValue {
  open: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

/**
 * Hook to open the global command palette from anywhere (e.g. the hero
 * search bar, a nav search button). Throws if used outside the provider so
 * a missing mount is caught at dev time rather than silently no-op.
 */
export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (ctx == null) {
    throw new Error('useSearch must be used within <SearchProvider>');
  }
  return ctx;
}

const isEditableTarget = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
};

/**
 * Provides the global command palette + its keyboard shortcuts:
 * - ⌘K / Ctrl+K toggles the palette from anywhere.
 * - "/" opens it, unless the user is typing in a field.
 * Mounted once in the root layout so every page shares one palette.
 */
export function SearchProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [open, setOpen] = useState(false);

  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (e.key === '/' && !open && !isEditableTarget(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const value = useMemo<SearchContextValue>(
    () => ({ open, openSearch, closeSearch }),
    [open, openSearch, closeSearch],
  );

  return (
    <SearchContext.Provider value={value}>
      {children}
      <SearchCommandPalette open={open} onOpenChange={setOpen} />
    </SearchContext.Provider>
  );
}
