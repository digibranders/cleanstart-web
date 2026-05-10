'use client';

import type { ReactElement } from 'react';
import { useEffect } from 'react';

const PROCESSED_FLAG = 'data-cs-info-processed';
const INFO_BTN_CLASS = 'cs-field-info';
const TOOLTIP_ID = 'cs-field-info-tooltip';
const TOOLTIP_GAP_PX = 8;
const VIEWPORT_INSET_PX = 8;

/**
 * Global field-description → info-tooltip transform.
 *
 * Why: Payload renders `admin.description` as italic muted text below
 * every field. On a SEO-rich blog edit view that's 14 descriptions —
 * easily 250-300 px of vertical chrome competing with the actual form.
 * Editors who already know what a field does have to scroll past
 * descriptions they no longer read.
 *
 * What: hide the inline description text, inject a small "i" button
 * into the field label (positioned right after the label text, before
 * any badge), and reveal a portal-mounted tooltip on hover.
 *
 * Implementation:
 *   - SR-only-hide `.field-description` via SCSS but keep it in the
 *     DOM so Payload's `aria-describedby` wiring still hits the input.
 *     Net a11y win.
 *   - On mount + via MutationObserver, find unprocessed descriptions,
 *     mark them processed, and inject `<button class="cs-field-info">`
 *     into the label. Insert at index 1 so layout reads `Label (i) ...
 *     Badge`, not `Label Badge (i)`.
 *   - One shared tooltip element lives at the end of `<body>`. On
 *     pointerenter/focus, position it relative to the hovered button
 *     (anchored to the button's right edge, flipped above/below to fit
 *     the viewport, clamped left so the right rail of the SEO sidebar
 *     can't clip it). On leave/blur, hide.
 *
 * Why a portal-mounted tooltip:
 *   Pseudo-element + `position: absolute` is clipped by
 *   `.document-fields__sidebar { overflow: auto }`. A body-level
 *   portal escapes every `overflow:` ancestor.
 *
 * Why a global mutation observer over per-field
 * `admin.components.Description`: hundreds of fields across 16
 * collections + 2 globals + the SEO sidebar group. Global = one file.
 * Per-field = mechanical schema churn.
 *
 * Mounted via `admin.components.actions` in payload.config.ts.
 */
export const FieldDescriptionTooltip = (): ReactElement | null => {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    // ─── Singleton tooltip element (portal target) ─────────────────
    let tooltip = document.getElementById(TOOLTIP_ID) as HTMLDivElement | null;
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = TOOLTIP_ID;
      tooltip.setAttribute('role', 'tooltip');
      tooltip.setAttribute('aria-hidden', 'true');
      document.body.appendChild(tooltip);
    }

    const showTooltip = (button: HTMLButtonElement, text: string): void => {
      if (!tooltip) return;
      tooltip.textContent = text;
      tooltip.setAttribute('data-cs-tooltip-open', 'true');
      tooltip.setAttribute('aria-hidden', 'false');

      // Make tooltip measurable (display from CSS), then read its size.
      // Reset positioning first so the previous run's offsets don't bias
      // the measurement.
      tooltip.style.left = '0px';
      tooltip.style.top = '0px';

      const btnRect = button.getBoundingClientRect();
      const tipRect = tooltip.getBoundingClientRect();

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Anchor the tooltip's RIGHT edge near the button's right edge so
      // it grows leftward — that's the safe direction inside the SEO
      // sidebar where the button sits flush against the right rail.
      let left = Math.round(btnRect.right + 4 - tipRect.width);

      // But don't let it spill off the LEFT of the viewport; clamp.
      const minLeft = VIEWPORT_INSET_PX;
      const maxLeft = vw - tipRect.width - VIEWPORT_INSET_PX;
      if (left < minLeft) left = minLeft;
      if (left > maxLeft) left = Math.max(minLeft, maxLeft);

      // Vertical: prefer above the button; flip below if no room.
      let top = Math.round(btnRect.top - tipRect.height - TOOLTIP_GAP_PX);
      if (top < VIEWPORT_INSET_PX) {
        top = Math.round(btnRect.bottom + TOOLTIP_GAP_PX);
      }
      // Final vertical clamp (last-ditch safety).
      if (top + tipRect.height > vh - VIEWPORT_INSET_PX) {
        top = vh - tipRect.height - VIEWPORT_INSET_PX;
      }

      tooltip.style.left = `${left + window.scrollX}px`;
      tooltip.style.top = `${top + window.scrollY}px`;
    };

    const hideTooltip = (): void => {
      if (!tooltip) return;
      tooltip.removeAttribute('data-cs-tooltip-open');
      tooltip.setAttribute('aria-hidden', 'true');
    };

    const processOne = (desc: HTMLElement): void => {
      if (desc.getAttribute(PROCESSED_FLAG) === 'true') return;
      desc.setAttribute(PROCESSED_FLAG, 'true');

      const text = (desc.textContent ?? '').trim();
      if (!text) return;

      const fieldType = desc.closest('.field-type');
      if (!fieldType) return;

      const label = fieldType.querySelector('label.field-label, .field-label');
      if (!label) return;

      if (label.querySelector(`.${INFO_BTN_CLASS}`)) return;

      const button = document.createElement('button') as HTMLButtonElement;
      button.type = 'button';
      button.className = INFO_BTN_CLASS;
      button.tabIndex = -1;
      button.setAttribute('aria-label', `Field info: ${text}`);
      // No `title` attribute: that would surface the OS-level tooltip
      // alongside our themed portal tooltip and editors get TWO bubbles
      // on hover. The portal tooltip is our single source of truth.
      // `aria-label` carries the description for screen readers, and
      // Payload's existing aria-describedby on the input still resolves
      // to the (visually-hidden) `.field-description` element.
      button.textContent = 'i';

      const onEnter = (): void => showTooltip(button, text);
      const onLeave = (): void => hideTooltip();

      button.addEventListener('pointerenter', onEnter);
      button.addEventListener('pointerleave', onLeave);
      button.addEventListener('focus', onEnter);
      button.addEventListener('blur', onLeave);

      // Insert at index 1 so the layout reads `Label (i) ... Badge`.
      const firstChild = label.firstChild;
      if (firstChild?.nextSibling) {
        label.insertBefore(button, firstChild.nextSibling);
      } else {
        label.appendChild(button);
      }
    };

    const scanAll = (root: ParentNode): void => {
      root.querySelectorAll<HTMLElement>('.field-description').forEach(processOne);
    };

    scanAll(document);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          const el = node as HTMLElement;
          if (el.classList?.contains('field-description')) {
            processOne(el);
          } else {
            scanAll(el);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Hide the tooltip on scroll/resize so it doesn't lag behind the
    // button it's anchored to.
    window.addEventListener('scroll', hideTooltip, true);
    window.addEventListener('resize', hideTooltip);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', hideTooltip, true);
      window.removeEventListener('resize', hideTooltip);
    };
  }, []);

  return null;
};

export default FieldDescriptionTooltip;
