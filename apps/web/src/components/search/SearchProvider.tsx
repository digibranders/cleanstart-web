'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// The palette (base-ui Dialog + Meilisearch client) is invisible until the user
// opens it (⌘K / "/"), so its JS has no reason to sit in the initial hydration
// bundle of every page. Load it on first open. `ssr: false` is safe because a
// closed dialog renders nothing server-side anyway.
const SearchCommandPalette = dynamic(
  () => import('./SearchCommandPalette').then((m) => m.SearchCommandPalette),
  { ssr: false },
);

const isEditableTarget = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
};

/**
 * Mounts the site-wide ⌘K command palette and its keyboard shortcuts:
 * - ⌘K / Ctrl+K toggles the palette from anywhere.
 * - "/" opens it, unless the user is typing in a field.
 * Mounted once in the root layout. (The Knowledge Hub hero has its own inline,
 * KB-scoped search — this palette searches all content.)
 */
export function SearchProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [open, setOpen] = useState(false);
  // Stays true after the first open so the palette keeps its DOM (and its close
  // transition) once loaded; before that it's never mounted, keeping its chunk
  // out of the initial bundle.
  const [everOpened, setEverOpened] = useState(false);

  useEffect(() => {
    if (open) setEverOpened(true);
  }, [open]);

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

  return (
    <>
      {children}
      {everOpened && <SearchCommandPalette open={open} onOpenChange={setOpen} />}
    </>
  );
}
