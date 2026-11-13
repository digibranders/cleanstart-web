"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface TurnstileWidgetProps {
  siteKey: string;
  onToken: (token: string | null) => void;
  /** Increase to reset the widget after a failed submit (a token can be used once). */
  resetKey: number;
}

export function TurnstileWidget({ siteKey, onToken, resetKey }: TurnstileWidgetProps): React.JSX.Element | null {
  const box = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  const mount = useCallback((): void => {
    const api = window.turnstile;
    if (!api || !box.current || widgetId.current !== null || !siteKey) return;
    widgetId.current = api.render(box.current, {
      sitekey: siteKey,
      callback: onToken,
      "expired-callback": () => onToken(null),
      "error-callback": () => onToken(null),
    });
  }, [siteKey, onToken]);

  // The script may already be on the page after a client side navigation.
  useEffect(() => {
    mount();
  }, [mount]);

  useEffect(() => {
    if (resetKey > 0 && widgetId.current !== null) window.turnstile?.reset(widgetId.current);
  }, [resetKey]);

  useEffect(
    () => () => {
      if (widgetId.current !== null) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
    },
    [],
  );

  if (!siteKey) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={mount} />
      <div ref={box} />
    </>
  );
}
