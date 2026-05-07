'use client';

import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';

type Shortcut = {
  keys: string[];
  description: string;
};

const isMac = (): boolean =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform);

const SHORTCUTS: Array<{ group: string; items: Shortcut[] }> = [
  {
    group: 'Global',
    items: [
      { keys: ['mod', 'K'], description: 'Open command palette' },
      { keys: ['mod', 'S'], description: 'Save / publish current document' },
      { keys: ['?'], description: 'Show this dialog' },
      { keys: ['Esc'], description: 'Close dialog or exit focus mode' },
    ],
  },
  {
    group: 'Editor',
    items: [
      { keys: ['mod', '/'], description: 'Toggle focus mode on body editor' },
      { keys: ['Tab'], description: 'Indent / move row up' },
      { keys: ['Shift', 'Tab'], description: 'Outdent / move row down' },
    ],
  },
];

const renderKey = (key: string): string => {
  const mac = isMac();
  if (key === 'mod') return mac ? '⌘' : 'Ctrl';
  if (key === 'Shift') return mac ? '⇧' : 'Shift';
  if (key === 'Tab') return mac ? '⇥' : 'Tab';
  return key;
};

/**
 * Discoverable keyboard-shortcut sheet. Opens on `?` (when no input is
 * focused) and on `Cmd+/` from anywhere. Closes on Esc or backdrop
 * click. Lists every CMS shortcut in one glanceable card.
 */
export const ShortcutHelpDialog = (): ReactElement | null => {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onKey = (event: KeyboardEvent): void => {
      // Cmd/Ctrl+/ — global trigger from anywhere.
      if ((event.metaKey || event.ctrlKey) && event.key === '/') {
        event.preventDefault();
        setOpen((v) => !v);
        return;
      }
      // ? — only when no input is focused, otherwise interferes with typing.
      if (event.key === '?' && !event.metaKey && !event.ctrlKey) {
        const target = event.target as HTMLElement | null;
        const isEditable =
          target?.tagName === 'INPUT' ||
          target?.tagName === 'TEXTAREA' ||
          target?.getAttribute('contenteditable') === 'true';
        if (!isEditable) {
          event.preventDefault();
          setOpen(true);
        }
      }
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) {
    // Render nothing visible — this component still has to be mounted
    // so its keydown listener stays alive.
    return null;
  }

  return (
    <dialog className="cs-shortcut-help" open aria-labelledby="cs-shortcut-help-title">
      <button
        type="button"
        className="cs-shortcut-help__backdrop"
        onClick={close}
        aria-label="Close shortcut help"
      />
      <div className="cs-shortcut-help__panel">
        <header className="cs-shortcut-help__header">
          <h2 id="cs-shortcut-help-title">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="cs-shortcut-help__close"
          >
            ×
          </button>
        </header>
        <div className="cs-shortcut-help__body">
          {SHORTCUTS.map((group) => (
            <section key={group.group}>
              <h3>{group.group}</h3>
              <ul>
                {group.items.map((sc) => (
                  <li key={sc.description}>
                    <span>{sc.description}</span>
                    <span className="cs-shortcut-help__keys">
                      {sc.keys.map((k) => (
                        <kbd key={`${sc.description}:${k}`}>{renderKey(k)}</kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <footer className="cs-shortcut-help__footer">
          <kbd>Esc</kbd>
          <span>to close</span>
        </footer>
      </div>
    </dialog>
  );
};
