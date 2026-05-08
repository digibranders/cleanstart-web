'use client';

import type { ReactElement } from 'react';
import { useEffect } from 'react';

const PROCESSED_FLAG = 'data-cs-info-processed';
const INFO_BTN_CLASS = 'cs-field-info';

/**
 * Global field-description → info-tooltip transform.
 *
 * Why: Payload renders `admin.description` as italic muted text below
 * every field. On a SEO-rich blog edit view that's 14 descriptions —
 * easily 250-300 px of vertical chrome competing with the actual form.
 * Editors who already know what a field does have to scroll past
 * descriptions they no longer read.
 *
 * What: hide the inline description text, append a small "i" button
 * to the field label, and wire the description into the button's
 * native `title` attribute. Hover (or long-press on touch) reveals
 * the description on demand.
 *
 * Implementation:
 *   - Hide `.field-description` globally via SCSS (visually) but keep
 *     it in the DOM so screen readers still see it (still associated
 *     with the field via Payload's aria-describedby wiring).
 *   - On mount + via MutationObserver, find unprocessed descriptions,
 *     mark them processed, and inject `<button class="cs-field-info"
 *     title={text} aria-label="Field info">i</button>` into the label.
 *
 * Why a global mutation observer instead of `admin.components.Description`
 * per field: hundreds of fields across 16 collections + 2 globals + the
 * SEO sidebar. A global hook is one file; per-field config would be
 * mechanical churn across the whole schema.
 *
 * Mounted via `admin.components.actions` in payload.config.ts.
 */
export const FieldDescriptionTooltip = (): ReactElement | null => {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const processOne = (desc: HTMLElement): void => {
      if (desc.getAttribute(PROCESSED_FLAG) === 'true') return;
      desc.setAttribute(PROCESSED_FLAG, 'true');

      const text = (desc.textContent ?? '').trim();
      if (!text) return;

      // Climb to the field root, then find the label inside it.
      // Payload's structure (verified live):
      //   .field-type
      //     .field-type__wrap
      //       label.field-label
      //       <input/textarea/...>
      //       .field-description
      const fieldType = desc.closest('.field-type');
      if (!fieldType) return;

      const label = fieldType.querySelector('label.field-label, .field-label');
      if (!label) return;

      // Don't re-inject if a button already exists inside this label
      // (defends against double-runs from React StrictMode + observer).
      if (label.querySelector(`.${INFO_BTN_CLASS}`)) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = INFO_BTN_CLASS;
      button.tabIndex = -1; // not in tab order — discoverable via hover
      button.setAttribute('aria-label', `Field info: ${text}`);
      button.title = text;
      button.textContent = 'i';
      label.appendChild(button);
    };

    const scanAll = (root: ParentNode): void => {
      root.querySelectorAll<HTMLElement>('.field-description').forEach(processOne);
    };

    // Initial pass — covers the first render.
    scanAll(document);

    // Watch for fields added later: collapsibles expanding, drawers
    // opening, tabs switching, etc.
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          const el = node as HTMLElement;
          if (el.classList?.contains('field-description')) {
            processOne(el);
          } else {
            // Subtree might contain descriptions.
            scanAll(el);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
};

export default FieldDescriptionTooltip;
