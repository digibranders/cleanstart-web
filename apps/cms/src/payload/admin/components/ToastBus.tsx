'use client';

import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';

type ToastType = 'info' | 'success' | 'warning' | 'error';

type ToastEntry = {
  id: number;
  message: string;
  type: ToastType;
  /** Optional one-shot action label, e.g. "Undo". */
  actionLabel?: string;
  /** Globally-unique action id; we look it up at click time. */
  actionId?: string;
};

const TOAST_TTL_MS_DEFAULT = 2500;
const TOAST_TTL_MS_WITH_ACTION = 5500;
const MAX_VISIBLE = 3;

// Action registry — callbacks live here keyed by id so the
// payload-event detail stays JSON-serialisable while still letting
// the dispatched site invoke an arbitrary fn on action-click.
const actionRegistry = new Map<string, () => void>();

/**
 * Public helper for dispatching a toast with an optional inline
 * action button (e.g. "Undo" on a destructive operation). Usage:
 *
 *   import { showToast } from '.../ToastBus';
 *   showToast({ message: 'Deleted draft', type: 'info', action: { label: 'Undo', onClick: restore } });
 */
export const showToast = (args: {
  message: string;
  type?: ToastType;
  action?: { label: string; onClick: () => void };
}): void => {
  if (typeof window === 'undefined') return;
  const detail: { message: string; type?: ToastType; actionLabel?: string; actionId?: string } = {
    message: args.message,
  };
  if (args.type !== undefined) detail.type = args.type;
  if (args.action) {
    const id = `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    actionRegistry.set(id, args.action.onClick);
    detail.actionLabel = args.action.label;
    detail.actionId = id;
  }
  window.dispatchEvent(new CustomEvent('cs-cms:toast', { detail }));
};

/**
 * Lightweight toast surface. Listens for `cs-cms:toast` CustomEvents
 * dispatched from anywhere in the admin (paste-clean, Cmd+S no-op,
 * deletion-with-undo, etc.) and renders them as a stack at the
 * bottom-right. Max 3 visible (FIFO eviction); auto-dismisses after
 * 2.5s normally or 5.5s when an action is attached so the user has
 * time to click it.
 *
 * Lives separately from Payload's own toast container so we don't
 * fight with `react-toastify` style inheritance.
 */
export const ToastBus = (): ReactElement | null => {
  const [items, setItems] = useState<ToastEntry[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((cur) => {
      const next = cur.filter((t) => t.id !== id);
      // Drop the registered action if any (memory hygiene).
      const dropped = cur.find((t) => t.id === id);
      if (dropped?.actionId) actionRegistry.delete(dropped.actionId);
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onToast = (event: Event): void => {
      const detail = (event as CustomEvent<{
        message?: string;
        type?: ToastType;
        actionLabel?: string;
        actionId?: string;
      }>).detail;
      const message = typeof detail?.message === 'string' ? detail.message : '';
      if (!message) return;
      const id = Date.now() + Math.random();
      const entry: ToastEntry = {
        id,
        message,
        type: detail?.type ?? 'info',
      };
      if (detail?.actionLabel) entry.actionLabel = detail.actionLabel;
      if (detail?.actionId) entry.actionId = detail.actionId;
      setItems((cur) => [...cur, entry].slice(-MAX_VISIBLE));
      const ttl = entry.actionId ? TOAST_TTL_MS_WITH_ACTION : TOAST_TTL_MS_DEFAULT;
      window.setTimeout(() => dismiss(id), ttl);
    };
    window.addEventListener('cs-cms:toast', onToast);
    return () => window.removeEventListener('cs-cms:toast', onToast);
  }, [dismiss]);

  if (items.length === 0) return null;

  const handleAction = (entry: ToastEntry): void => {
    if (!entry.actionId) return;
    const fn = actionRegistry.get(entry.actionId);
    if (fn) {
      try {
        fn();
      } catch {
        // ignore — best-effort.
      }
    }
    dismiss(entry.id);
  };

  return (
    <output className="cs-toast-bus" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`cs-toast-bus__item cs-toast-bus__item--${t.type}`}>
          <span className="cs-toast-bus__message">{t.message}</span>
          {t.actionLabel && (
            <button
              type="button"
              className="cs-toast-bus__action"
              onClick={() => handleAction(t)}
            >
              {t.actionLabel}
            </button>
          )}
          <button
            type="button"
            className="cs-toast-bus__close"
            aria-label="Dismiss"
            onClick={() => dismiss(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </output>
  );
};

export default ToastBus;
