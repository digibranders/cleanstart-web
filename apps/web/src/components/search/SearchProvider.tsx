'use client';

import { useEffect, useState } from 'react';

import { SearchCommandPalette } from './SearchCommandPalette';

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
      <SearchCommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
