'use client';

import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

type ToastEntry = {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
};

const TOAST_TTL_MS = 2500;

/**
 * Lightweight toast surface. Listens for `cs-cms:toast` CustomEvents
 * dispatched from anywhere in the admin (paste-clean, Cmd+S no-op,
 * etc.) and renders them as a stack at the bottom-right above the
 * SavedStateIndicator chip. Auto-dismisses after 2.5s.
 *
 * Avoids interfering with Payload's own toast container — it lives
 * separately so we don't fight with `react-toastify` styling
 * inheritance.
 */
export const ToastBus = (): ReactElement | null => {
  const [items, setItems] = useState<ToastEntry[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onToast = (event: Event): void => {
      const detail = (event as CustomEvent<{ message?: string; type?: ToastEntry['type'] }>).detail;
      const message = typeof detail?.message === 'string' ? detail.message : '';
      if (!message) return;
      const id = Date.now() + Math.random();
      const entry: ToastEntry = {
        id,
        message,
        type: detail?.type ?? 'info',
      };
      setItems((cur) => [...cur, entry].slice(-3));
      window.setTimeout(() => {
        setItems((cur) => cur.filter((t) => t.id !== id));
      }, TOAST_TTL_MS);
    };
    window.addEventListener('cs-cms:toast', onToast);
    return () => window.removeEventListener('cs-cms:toast', onToast);
  }, []);

  if (items.length === 0) return null;

  return (
    <output className="cs-toast-bus" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`cs-toast-bus__item cs-toast-bus__item--${t.type}`}>
          {t.message}
        </div>
      ))}
    </output>
  );
};

export default ToastBus;
