"use client";

import { useEffect, useState } from "react";

import { DEFAULT_PHONE_COUNTRY, findCountry, type PhoneCountry } from "./countries";

const CACHE_KEY = "cs:geo-country";

const readCache = (): string | null => {
  try {
    return window.sessionStorage.getItem(CACHE_KEY);
  } catch {
    // Private mode or blocked storage. Detection still works, it just repeats
    // the request on the next form the visitor opens.
    return null;
  }
};

const writeCache = (code: string): void => {
  try {
    window.sessionStorage.setItem(CACHE_KEY, code);
  } catch {
    // Non-fatal, see readCache.
  }
};

/**
 * The region subtag of the browser's locale ("en-IN" gives "IN"). Free, needs
 * no request, and covers local development and any request the edge cannot
 * place. Wrong for anyone running a locale that does not match where they are,
 * which is exactly why the dropdown stays editable.
 */
const countryFromLocale = (): string | null => {
  const locales = typeof navigator === "undefined" ? [] : navigator.languages ?? [];
  for (const locale of locales) {
    const region = new Intl.Locale(locale).maximize().region;
    if (region && findCountry(region)) return region;
  }
  return null;
};

/**
 * Resolves the country to preselect in a phone field.
 *
 * Order: this session's cached answer, then the Vercel edge's IP country, then
 * the browser locale, then the default. Always returns something renderable so
 * the field never waits on the network, and `detected` says whether the value
 * is a real guess or just the fallback.
 */
export function useDetectedCountry(): {
  country: PhoneCountry;
  detected: boolean;
} {
  const [country, setCountry] = useState<PhoneCountry>(DEFAULT_PHONE_COUNTRY);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const cached = findCountry(readCache());
    if (cached) {
      setCountry(cached);
      setDetected(true);
      return;
    }

    const controller = new AbortController();

    const resolve = async (): Promise<void> => {
      let code: string | null = null;
      try {
        const res = await fetch("/api/geo", { signal: controller.signal });
        if (res.ok) {
          const json = (await res.json()) as { country?: string | null };
          code = json.country ?? null;
        }
      } catch {
        // Offline, aborted, or the route is unavailable. Fall through to locale.
      }

      const resolved = findCountry(code) ?? findCountry(countryFromLocale());
      if (controller.signal.aborted || !resolved) return;

      writeCache(resolved.code);
      setCountry(resolved);
      setDetected(true);
    };

    void resolve();
    return () => controller.abort();
  }, []);

  return { country, detected };
}
