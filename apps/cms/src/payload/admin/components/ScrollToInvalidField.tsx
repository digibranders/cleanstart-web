'use client';

import type { ReactElement } from 'react';
import { useEffect } from 'react';

const SAVE_BUTTON_IDS = ['action-save', 'action-save-draft'] as const;

// Selector for any field that's currently rendering a validation error.
// Payload v3 renders errors via `.field-error` on the field wrapper plus
// `aria-invalid="true"` on the input itself; we accept both as anchors.
const INVALID_SELECTOR = '.field-error, [aria-invalid="true"]';

// Highlight class applied to the invalid field's wrapper. SCSS in
// `_ui-primitives.scss` animates a brief border-ring pulse so the
// editor's eye lands on the problem within ~1s of the toast.
const HIGHLIGHT_CLASS = 'cs-invalid-pulse';
const HIGHLIGHT_DURATION_MS = 1600;

// Polling window. 5s comfortably covers a slow save round-trip without
// keeping the interval alive long enough to confuse a fresh user click.
const POLL_INTERVAL_MS = 50;
const DEADLINE_MS = 5000;

const findFieldWrapper = (el: Element): HTMLElement | null => {
  // Walk up to the field's own container (Payload renders `.field-type`
  // on the wrapper). Fall back to the element itself if not found —
  // better to scroll *something* than nothing.
  const wrapper = el.closest<HTMLElement>('.field-type, .cs-quick-create__field');
  return wrapper ?? (el instanceof HTMLElement ? el : null);
};

const findFocusable = (wrapper: HTMLElement): HTMLElement | null => {
  // Prefer the first invalid input itself; otherwise pick anything
  // focusable inside the wrapper. Skip buttons (publish/save) — they
  // sit outside the field wrapper but `closest` may walk into them on
  // unusual layouts.
  const aria = wrapper.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (aria) return aria;
  return wrapper.querySelector<HTMLElement>(
    'input:not([type="hidden"]), textarea, select, [tabindex]:not([tabindex="-1"])',
  );
};

const pulse = (wrapper: HTMLElement): void => {
  wrapper.classList.remove(HIGHLIGHT_CLASS);
  // Force reflow so re-adding the class restarts the animation if a
  // second submit lands on the same field.
  void wrapper.offsetWidth;
  wrapper.classList.add(HIGHLIGHT_CLASS);
  window.setTimeout(() => wrapper.classList.remove(HIGHLIGHT_CLASS), HIGHLIGHT_DURATION_MS);
};

const focusFirstInvalid = (): boolean => {
  const first = document.querySelector(INVALID_SELECTOR);
  if (!first) return false;
  const wrapper = findFieldWrapper(first);
  if (!wrapper) return false;

  // Expand any ancestor <details> so the field is actually visible
  // before we scroll to it. The quick-create modal uses <details> for
  // progressive disclosure; full-edit collapsibles use the same idiom.
  let parent: HTMLElement | null = wrapper.parentElement;
  while (parent) {
    if (parent instanceof HTMLDetailsElement && !parent.open) parent.open = true;
    parent = parent.parentElement;
  }

  wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
  pulse(wrapper);

  // Defer focus so the smooth scroll has a frame to start — focusing
  // before scroll triggers Chrome's default jump-to-element behaviour
  // and fights the smooth-scroll animation.
  const focusable = findFocusable(wrapper);
  if (focusable) {
    window.setTimeout(() => focusable.focus({ preventScroll: true }), 80);
  }

  return true;
};

/**
 * After a save / publish attempt, scrolls the first invalid field into
 * view and focuses it with a brief border pulse. Without this the only
 * error feedback is a toast at the bottom of the screen that names the
 * field but doesn't point to it — editors hit Publish, see "Social →
 * Website invalid", and have to hunt the page (sometimes scrolling
 * past a long body) to find the broken input.
 *
 * Strategy:
 *  - On click of `#action-save` or `#action-save-draft`, wait for
 *    Payload to render the response. If validation failed, the form
 *    sprouts `.field-error` / `[aria-invalid="true"]` markers.
 *  - Poll once per animation frame for up to ~1.5s after the click —
 *    enough to cover the slowest realistic admin save round-trip. As
 *    soon as we see a marker, scroll-focus the first one and stop.
 *  - If nothing appears in the window, the save succeeded — exit
 *    silently.
 *
 * Mounted via `admin.components.beforeDocumentControls` on every gated
 * collection (see `wire-publish-gate.ts`).
 */
export const ScrollToInvalidField = (): ReactElement | null => {
  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const btn = target.closest('button, input[type="submit"]');
      if (!btn) return;
      const id = btn.id;
      if (!SAVE_BUTTON_IDS.includes(id as (typeof SAVE_BUTTON_IDS)[number])) return;
      if (btn instanceof HTMLButtonElement && btn.disabled) return;

      // Begin polling for validation errors. Payload's response time is
      // dominated by the network round-trip; we keep checking until
      // either an error appears or the deadline elapses. setInterval
      // rather than requestAnimationFrame so the loop continues if the
      // browser throttles rAF during the save round-trip (e.g. when the
      // tab loses focus briefly while the modal-confirm flow runs).
      const start = Date.now();
      const interval = window.setInterval(() => {
        if (focusFirstInvalid() || Date.now() - start > DEADLINE_MS) {
          window.clearInterval(interval);
        }
      }, POLL_INTERVAL_MS);
    };

    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  return null;
};

export default ScrollToInvalidField;
