'use client';

import type { ReactElement } from 'react';
import { useEffect } from 'react';

import {
  getSlugStatus,
  subscribeSlugStatus,
  type SlugStatus,
} from '../lib/slug-status-store';

const PUBLISH_BUTTON_ID = 'action-save';
const SAVE_DRAFT_BUTTON_ID = 'action-save-draft';
const BUTTON_IDS = [PUBLISH_BUTTON_ID, SAVE_DRAFT_BUTTON_ID] as const;

const REASON_BY_KIND: Record<SlugStatus['kind'], string | null> = {
  idle: null,
  available: null,
  empty: 'Slug is required. Set a slug in the SEO sidebar before saving.',
  checking: 'Checking slug availability…',
  collision: 'Slug is already in use — pick a different one before saving.',
  invalid: 'Slug is invalid. Use only lowercase letters, digits, and hyphens.',
};

const isBlocking = (status: SlugStatus): boolean =>
  REASON_BY_KIND[status.kind] !== null;

const applyState = (status: SlugStatus): void => {
  const reason = REASON_BY_KIND[status.kind];
  for (const id of BUTTON_IDS) {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLButtonElement)) continue;
    if (reason) {
      // Mark the button as gated by *us* so we never strip a disabled
      // state that Payload set itself (form-pristine, saving-in-flight).
      el.dataset.cleanstartSlugGate = 'on';
      el.disabled = true;
      el.setAttribute('aria-disabled', 'true');
      el.setAttribute('title', reason);
    } else if (el.dataset.cleanstartSlugGate === 'on') {
      delete el.dataset.cleanstartSlugGate;
      el.disabled = false;
      el.removeAttribute('aria-disabled');
      el.removeAttribute('title');
    }
  }
};

const clearState = (): void => {
  for (const id of BUTTON_IDS) {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLButtonElement)) continue;
    if (el.dataset.cleanstartSlugGate === 'on') {
      delete el.dataset.cleanstartSlugGate;
      el.disabled = false;
      el.removeAttribute('aria-disabled');
      el.removeAttribute('title');
    }
  }
};

/**
 * Hard-gates the document Save Draft + Publish buttons on slug status.
 *
 * Slug is server-side `required` + `unique`. If an editor hits Save with
 * an empty or colliding slug, the server rejects with a generic toast —
 * a confusing dead end. This guard surfaces the constraint at the
 * button: disabled state + native tooltip + capture-phase click block.
 *
 * Mounted via `admin.components.beforeDocumentControls` on every
 * collection that runs through `wirePublishGate`. Reads the slug status
 * from the shared store written by `SlugField`.
 *
 * DOM mutation (rather than rendering disabled props) is necessary
 * because Payload owns the Save / Publish buttons — they don't expose a
 * disabled API to admin components. The button bar can also mount after
 * this guard, so a `MutationObserver` re-applies state on subtree
 * changes.
 */
export const SlugRequirementGuard = (): ReactElement | null => {
  useEffect(() => {
    let current = getSlugStatus();
    applyState(current);

    const unsubscribe = subscribeSlugStatus((next) => {
      current = next;
      applyState(current);
    });

    // Re-apply on DOM changes so late-mounted buttons inherit the gate
    // and Payload re-renders (e.g. after autosave settle) don't drop it.
    const observer = new MutationObserver(() => {
      applyState(current);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Capture-phase belt-and-braces: intercept clicks that somehow bypass
    // the `disabled` attribute (programmatic `.click()`, keyboard
    // shortcuts that don't honour disabled state).
    const onClick = (e: MouseEvent): void => {
      if (!isBlocking(current)) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      const btn = target.closest(`#${PUBLISH_BUTTON_ID}, #${SAVE_DRAFT_BUTTON_ID}`);
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      try {
        window.dispatchEvent(
          new CustomEvent('cs-cms:toast', {
            detail: {
              message: REASON_BY_KIND[current.kind] ?? 'Slug is required.',
              type: 'error',
            },
          }),
        );
      } catch {
        // toast is best-effort
      }
    };
    document.addEventListener('click', onClick, true);

    return () => {
      unsubscribe();
      observer.disconnect();
      document.removeEventListener('click', onClick, true);
      clearState();
    };
  }, []);

  return null;
};

export default SlugRequirementGuard;
