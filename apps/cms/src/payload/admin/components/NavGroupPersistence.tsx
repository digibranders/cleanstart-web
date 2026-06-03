'use client';

import type { ReactElement } from 'react';
import { useEffect } from 'react';

const STORAGE_KEY = 'cs.nav-groups.collapsed';

type State = Record<string, boolean>; // id → collapsed?

const loadState = (): State => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as State;
  } catch {
    return {};
  }
};

const saveState = (state: State): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
};

const isOpen = (group: HTMLElement): boolean => {
  const toggle = group.querySelector<HTMLElement>('.nav-group__toggle');
  return Boolean(toggle?.classList.contains('nav-group__toggle--open'));
};

const groupId = (group: HTMLElement): string | null => {
  return group.id || group.getAttribute('data-id');
};

/**
 * Tiny client utility that persists Payload's native nav-group
 * collapsed state to localStorage and rehydrates it on every page
 * load. Renders nothing visible — its only job is to:
 *
 *  1. On mount, read the stored state and click any toggle whose live
 *     state disagrees, so the sidebar lands on the user's last layout.
 *  2. Subscribe to clicks on `.nav-group__toggle`, then snapshot the
 *     entire nav-group set into the store. We use bubble-phase so
 *     Payload's own onClick fires first.
 *
 * Mounted globally via `admin.components.actions`.
 */
export const NavGroupPersistence = (): ReactElement | null => {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let appliedOnce = false;

    const apply = (): void => {
      const stored = loadState();
      const groups = document.querySelectorAll<HTMLElement>('.nav-group');
      if (groups.length === 0) return;
      for (const group of groups) {
        const id = groupId(group);
        if (!id) continue;
        if (id in stored) {
          const wantCollapsed = stored[id];
          const liveOpen = isOpen(group);
          // wantCollapsed=true → we want closed, but it's open → click
          if (wantCollapsed && liveOpen) {
            group.querySelector<HTMLElement>('.nav-group__toggle')?.click();
          } else if (!wantCollapsed && !liveOpen) {
            group.querySelector<HTMLElement>('.nav-group__toggle')?.click();
          }
        }
      }
      appliedOnce = true;
    };

    // Wait for the nav to mount, then apply stored state once.
    // Disconnect the observer immediately after the first successful
    // apply so it does not keep firing on every DOM mutation.
    const observer = new MutationObserver(() => {
      if (!appliedOnce && document.querySelector('.nav-group')) {
        apply();
        if (appliedOnce) observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    apply();
    // If the nav was already in the DOM, apply() ran synchronously and
    // set appliedOnce — disconnect the observer right away.
    if (appliedOnce) observer.disconnect();

    // Persist on every toggle click.
    const onClick = (event: Event): void => {
      const target = event.target as HTMLElement | null;
      const toggle = target?.closest<HTMLElement>('.nav-group__toggle');
      if (!toggle) return;
      // Defer so Payload's own toggle handler runs first and the class
      // reflects the new state by the time we snapshot.
      window.setTimeout(() => {
        const groups = document.querySelectorAll<HTMLElement>('.nav-group');
        const next: State = {};
        for (const g of groups) {
          const id = groupId(g);
          if (!id) continue;
          next[id] = !isOpen(g); // collapsed when not open
        }
        saveState(next);
      }, 50);
    };
    document.addEventListener('click', onClick, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  return null;
};

export default NavGroupPersistence;
