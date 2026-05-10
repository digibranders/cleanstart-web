'use client';

import type { ReactElement, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export type ToastInput = {
  readonly id?: string;
  readonly title?: ReactNode;
  readonly message: ReactNode;
  readonly tone?: ToastTone;
  /** ms; default 4000. 0 = stay until dismissed. */
  readonly duration?: number;
  readonly action?: { readonly label: string; readonly onClick: () => void };
};

type ToastEntry = ToastInput & { readonly id: string };

type ToastContextValue = {
  readonly push: (input: ToastInput) => string;
  readonly dismiss: (id: string) => void;
  readonly clear: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const genId = (): string => `t-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Toast region. Renders a polite live-region with stacked toasts.
 * Wrap the admin shell once; consumers call `useToast().push(...)`.
 */
export const ToastProvider = (props: { readonly children: ReactNode }): ReactElement => {
  const [toasts, setToasts] = useState<ReadonlyArray<ToastEntry>>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string): void => {
    setToasts((arr) => arr.filter((t) => t.id !== id));
    const handle = timers.current.get(id);
    if (handle != null) {
      window.clearTimeout(handle);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (input: ToastInput): string => {
      const id = input.id ?? genId();
      const entry: ToastEntry = { ...input, id };
      setToasts((arr) => [...arr.filter((t) => t.id !== id), entry]);
      const duration = input.duration ?? 4000;
      if (duration > 0) {
        const handle = window.setTimeout(() => dismiss(id), duration);
        timers.current.set(id, handle);
      }
      return id;
    },
    [dismiss],
  );

  const clear = useCallback((): void => {
    for (const handle of timers.current.values()) window.clearTimeout(handle);
    timers.current.clear();
    setToasts([]);
  }, []);

  useEffect(() => {
    const onCustom = (e: Event): void => {
      const detail = (e as CustomEvent<ToastInput>).detail;
      if (detail) push(detail);
    };
    document.addEventListener('cs:toast', onCustom);
    return () => document.removeEventListener('cs:toast', onCustom);
  }, [push]);

  const value = useMemo<ToastContextValue>(
    () => ({ push, dismiss, clear }),
    [push, dismiss, clear],
  );

  return (
    <ToastContext.Provider value={value}>
      {props.children}
      <div className="cs-toast-region" role="region" aria-label="Notifications">
        <ol className="cs-toast-region__list">
          {toasts.map((t) => (
            <li
              key={t.id}
              className={`cs-toast cs-toast--${t.tone ?? 'info'}`}
              role={t.tone === 'error' ? 'alert' : 'status'}
              aria-live={t.tone === 'error' ? 'assertive' : 'polite'}
            >
              <div className="cs-toast__body">
                {t.title ? <div className="cs-toast__title">{t.title}</div> : null}
                <div className="cs-toast__message">{t.message}</div>
              </div>
              {t.action ? (
                <button
                  type="button"
                  className="cs-toast__action"
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                >
                  {t.action.label}
                </button>
              ) : null}
              <button
                type="button"
                className="cs-toast__close"
                aria-label="Dismiss notification"
                onClick={() => dismiss(t.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ol>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
};

/**
 * Imperative push without React context — fires a `cs:toast` CustomEvent
 * the provider listens for. Useful from non-React code (event listeners
 * registered outside the tree).
 */
export const dispatchToast = (input: ToastInput): void => {
  document.dispatchEvent(new CustomEvent<ToastInput>('cs:toast', { detail: input }));
};
