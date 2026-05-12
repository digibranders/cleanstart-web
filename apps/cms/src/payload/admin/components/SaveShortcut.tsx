'use client';

import { useEffect, type ReactElement } from 'react';

/**
 * Global Cmd/Ctrl+S keyboard shortcut. Wired via `admin.components.actions`
 * so it mounts inside every admin view but renders nothing — its only job
 * is to listen for the keyboard event and click the document Save button.
 *
 * Behavior:
 *  - Only fires when a save button is present on the page (i.e. on a
 *    document edit view); becomes a no-op on list / dashboard views.
 *  - Prefers the publish button when versioning is enabled; falls back
 *    to the save-draft button so unsaved drafts get persisted on Cmd+S
 *    even if the editor hasn't published yet.
 *  - Suppresses the browser's "save page" dialog by calling
 *    `preventDefault()` only when a target button is found.
 */
export const SaveShortcut = (): ReactElement | null => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const isSave = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's';
      if (!isSave) return;

      // Don't interfere with text-editing shortcuts inside contenteditable
      // surfaces that handle their own Cmd+S (Lexical doesn't, but
      // future-proof the check).
      const target = e.target as HTMLElement | null;
      if (target?.isContentEditable && target.dataset.handlesSave === 'true') {
        return;
      }

      // Find the document save button. Payload renders publish on top
      // when versioning is on; save-draft sits next to it. Try publish
      // first, fall back to save-draft, then any save button.
      const button =
        document.getElementById('action-save') ||
        document.querySelector<HTMLButtonElement>(
          '.doc-controls__publish > button, .doc-controls .btn--style-primary > button',
        ) ||
        document.querySelector<HTMLButtonElement>(
          '.doc-controls .save-draft, .doc-controls .btn.save-draft',
        );

      if (!button) return; // not on an edit view — let the browser handle it
      e.preventDefault();

      // Save button disabled = nothing to save (form pristine). Surface
      // a passive toast so the keystroke isn't silently dropped.
      if ((button as HTMLButtonElement).disabled) {
        try {
          window.dispatchEvent(
            new CustomEvent('cs-cms:toast', {
              detail: { message: 'No changes to save.', type: 'info' },
            }),
          );
        } catch {
          // ignore — toast is best-effort.
        }
        return;
      }

      // Surface a transient "Saving…" pulse on the SavedStateIndicator
      // so editors get instant feedback that Cmd+S registered.
      window.dispatchEvent(new CustomEvent('cs-cms:saving'));

      (button as HTMLButtonElement).click();
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return null;
};

export default SaveShortcut;
