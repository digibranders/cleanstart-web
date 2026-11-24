"use client";

import Script from "next/script";
import { useCallback, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

interface TurnstileWidgetProps {
  /** Called with the challenge token once the user passes. */
  onToken?: (token: string) => void;
  /** Called if the challenge encounters an error. */
  onError?: () => void;
  /** Called when a previously-issued token expires. */
  onExpired?: () => void;
  className?: string;
}

/**
 * Cloudflare Turnstile CAPTCHA widget.
 *
 * Loads the Turnstile script via next/script (deduplicated across the page)
 * and renders the widget via the explicit API once the script is ready.
 * Cloudflare automatically injects a hidden `cf-turnstile-response` input
 * into the container, so the token is included in any surrounding <form>
 * submission without extra wiring.
 *
 * Requires NEXT_PUBLIC_TURNSTILE_SITE_KEY in the environment.
 */
export function TurnstileWidget({
  onToken,
  onError,
  onExpired,
  className,
}: TurnstileWidgetProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const handleReady = useCallback(() => {
    if (!containerRef.current || !window.turnstile) return;
    // Prevent double-render in React 18 strict mode.
    if (widgetIdRef.current !== null) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      theme: "light",
      size: "normal",
      callback: (token: string) => {
        onToken?.(token);
      },
      "error-callback": () => {
        onError?.();
      },
      "expired-callback": () => {
        onExpired?.();
        // Reset so the user can re-verify.
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
          widgetIdRef.current = null;
        }
      },
    });
  }, [onToken, onError, onExpired]);

  return (
    <>
      {/*
       * Deduplicated by Next.js — only one <script> tag is emitted per page
       * even if multiple TurnstileWidget instances are mounted.
       * `onReady` fires both on initial load and after fast client navigations.
       */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={handleReady}
      />
      <div ref={containerRef} className={className} />
    </>
  );
}
