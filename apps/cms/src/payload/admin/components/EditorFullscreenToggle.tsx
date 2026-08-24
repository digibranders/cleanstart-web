'use client';

import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useState } from 'react';

/**
 * "Focus mode" toggle for the body Lexical editor. Lives directly above
 * the body field's bordered wrap rather than as a corner-of-screen
 * floater so the affordance reads as part of the editor itself.
 *
 * Implementation: React Portal mounts a small button into the parent
 * of the top-level `.rich-text-lexical__wrap`. CSS positions the
 * button absolutely at the wrap's top-right (inside the field-type,
 * which we make `position: relative`). When activated, the wrap
 * expands to fill the viewport via the `data-cs-fullscreen='true'`
 * attribute on `<html>` and the rules in `_editor-fullscreen.scss`.
 *
 * ESC or clicking the toggle exits. Outside-click does NOT exit, by
 * design — it would fire while reaching for the clipboard.
 */
export const EditorFullscreenToggle = (): ReactElement | null => {
  const [hostWrap, setHostWrap] = useState<HTMLElement | null>(null);
  const [mountTarget, setMountTarget] = useState<HTMLElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // True if a candidate body editor exists *anywhere* in the DOM that
  // isn't nested in an array row / collapsible / block. Payload v3
  // renders the Lexical wrap as `.rich-text-lexical__wrap` — the
  // bordered shell that owns the editor surface; we promote that to
  // fullscreen rather than the outer `.field-type` so the field label
  // gets cleanly hidden alongside the rest of the chrome.
  const findCandidate = useCallback((): HTMLElement | null => {
    const all = document.querySelectorAll<HTMLElement>('.rich-text-lexical__wrap');
    for (const el of all) {
      if (
        el.closest(
          // `.faq-answer-rich-text` (apps/cms/src/payload/fields/faqs.ts)
          // is the FAQ answer editor specifically. `.cs-array`/`.cs-blocks`/
          // `.cs-collapsible` are generic wrappers shared by every array/
          // blocks/collapsible field CMS-wide — matching on them here also
          // hid the fullscreen toggle for unrelated full-featured editors
          // (page-builder Rich Text/Form blocks, Forms.ts's postSubmit
          // body). `.array-field__row`/`.collapsible__content`/
          // `.blocks-field__row` are Payload's stock class names, kept
          // only because they're otherwise inert no-ops in this app's
          // custom field components.
          '.faq-answer-rich-text, .array-field__row, .collapsible__content, .blocks-field__row',
        )
      ) {
        continue;
      }
      return el;
    }
    return null;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const probe = (): void => {
      const wrap = findCandidate();
      setHostWrap(wrap);
      // Mount the toggle directly INSIDE the wrap. The wrap is the
      // bordered shell that owns the editor surface; placing the
      // button there means absolute-positioning is anchored to the
      // editor card itself, not whatever ancestor happens to scroll.
      setMountTarget(wrap ?? null);
    };

    probe();
    const observer = new MutationObserver(probe);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [findCandidate]);

  const findHostField = useCallback((): HTMLElement | null => {
    // Prefer the wrap that contains the currently-focused editor;
    // fall back to the first top-level body editor on the page.
    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      const hosting = active.closest<HTMLElement>('.rich-text-lexical__wrap');
      if (
        hosting &&
        !hosting.closest(
          // `.faq-answer-rich-text` (apps/cms/src/payload/fields/faqs.ts)
          // is the FAQ answer editor specifically. `.cs-array`/`.cs-blocks`/
          // `.cs-collapsible` are generic wrappers shared by every array/
          // blocks/collapsible field CMS-wide — matching on them here also
          // hid the fullscreen toggle for unrelated full-featured editors
          // (page-builder Rich Text/Form blocks, Forms.ts's postSubmit
          // body). `.array-field__row`/`.collapsible__content`/
          // `.blocks-field__row` are Payload's stock class names, kept
          // only because they're otherwise inert no-ops in this app's
          // custom field components.
          '.faq-answer-rich-text, .array-field__row, .collapsible__content, .blocks-field__row',
        )
      ) {
        return hosting;
      }
    }
    return findCandidate();
  }, [findCandidate]);

  const enter = useCallback(() => {
    const host = findHostField();
    if (!host) return;
    for (const el of document.querySelectorAll('.cs-fullscreen-host')) {
      el.classList.remove('cs-fullscreen-host');
    }
    host.classList.add('cs-fullscreen-host');
    document.documentElement.setAttribute('data-cs-fullscreen', 'true');
    setIsFullscreen(true);
  }, [findHostField]);

  const exit = useCallback(() => {
    for (const el of document.querySelectorAll('.cs-fullscreen-host')) {
      el.classList.remove('cs-fullscreen-host');
    }
    document.documentElement.removeAttribute('data-cs-fullscreen');
    setIsFullscreen(false);
  }, []);

  const toggle = useCallback(() => {
    if (isFullscreen) exit();
    else enter();
  }, [isFullscreen, enter, exit]);

  // Keyboard: Esc exits.
  useEffect(() => {
    if (!isFullscreen) return undefined;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        exit();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isFullscreen, exit]);

  // Cleanup on unmount: never leave the doc in fullscreen if this
  // component remounts (route change, etc.).
  useEffect(() => {
    return () => {
      document.documentElement.removeAttribute('data-cs-fullscreen');
      for (const el of document.querySelectorAll('.cs-fullscreen-host')) {
        el.classList.remove('cs-fullscreen-host');
      }
    };
  }, []);

  if (!hostWrap || !mountTarget) {
    // Still need to render the exit cluster when fullscreen is active —
    // even if the mount target disappeared mid-flight, ESC still works.
    return isFullscreen ? <ExitCluster onExit={exit} /> : null;
  }

  const inlineToggle = (
    <button
      type="button"
      onClick={toggle}
      className="cs-fullscreen-toggle cs-fullscreen-toggle--inline"
      data-active={isFullscreen ? 'true' : 'false'}
      aria-pressed={isFullscreen}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Open the body editor fullscreen'}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          fill="currentColor"
          d="M3 3h4a1 1 0 1 1 0 2H5v2a1 1 0 1 1-2 0V3Zm0 8a1 1 0 0 1 2 0v2h2a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1v-3Zm10-8a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0V5h-2a1 1 0 1 1 0-2h3Zm0 8a1 1 0 1 1 2 0v3a1 1 0 0 1-1 1h-3a1 1 0 1 1 0-2h2v-2Z"
        />
      </svg>
      <span className="cs-fullscreen-toggle__label">
        {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      </span>
    </button>
  );

  return (
    <>
      {createPortal(inlineToggle, mountTarget)}
      {isFullscreen && <ExitCluster onExit={exit} />}
    </>
  );
};

const ExitCluster = ({ onExit }: { onExit: () => void }): ReactElement => (
  <section className="cs-fullscreen-cluster" aria-label="Fullscreen controls">
    <span style={{ fontSize: 12, color: 'var(--theme-text-soft)' }}>Fullscreen</span>
    <kbd>Esc</kbd>
    <button
      type="button"
      onClick={onExit}
      className="cs-fullscreen-toggle"
      aria-label="Exit fullscreen"
      title="Exit fullscreen"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          fill="currentColor"
          d="M4 4l8 8M12 4l-8 8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  </section>
);
