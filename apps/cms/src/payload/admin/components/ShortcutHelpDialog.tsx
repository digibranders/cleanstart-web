'use client';

import type { ReactElement } from 'react';
import { useCallback, useEffect, useId, useState } from 'react';

import { Dialog, DialogBody, DialogHeader } from './ui/Dialog';

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
 * focused) and on `Cmd+/` from anywhere. Refactored onto the shared
 * Dialog primitive so it inherits proper focus trap, ESC handling, and
 * backdrop dismiss behaviour automatically.
 */
export const ShortcutHelpDialog = (): ReactElement => {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key === '/') {
        event.preventDefault();
        setOpen((v) => !v);
        return;
      }
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
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <Dialog open={open} onClose={close} labelledBy={titleId} size="md">
      <DialogHeader id={titleId} title="Keyboard shortcuts" onClose={close} />
      <DialogBody>
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
      </DialogBody>
    </Dialog>
  );
};
