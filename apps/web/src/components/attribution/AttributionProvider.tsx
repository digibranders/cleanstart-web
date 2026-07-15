"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";

import { useConsent } from "@/components/consent/ConsentProvider";
import { advanceState, buildSnapshot, composeSubmission } from "@/lib/attribution/capture";
import type {
  AttributionSnapshot,
  AttributionState,
  AttributionSubmission,
} from "@/lib/attribution/types";

/** Single JSON cookie holding first/last touch + click IDs. Written only with
 * targeting consent; ~90-day window so a return visit still credits the
 * original campaign. */
const COOKIE = "cs_attr";
const MAX_AGE = 60 * 60 * 24 * 90;

interface AttributionContextValue {
  /**
   * Build the attribution fragment to merge into a lead-submit POST body.
   * Safe to call from any form's submit handler; returns `{}` before the
   * first-load snapshot is ready (SSR / pre-hydration).
   */
  getAttribution: () => AttributionSubmission;
}

const AttributionContext = createContext<AttributionContextValue | null>(null);

const readCookie = (): AttributionState | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${COOKIE}=`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.slice(COOKIE.length + 1))) as AttributionState;
  } catch {
    return null;
  }
};

const writeCookie = (state: AttributionState): void => {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const value = encodeURIComponent(JSON.stringify(state));
  document.cookie = `${COOKIE}=${value}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
};

const clearCookie = (): void => {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
};

export function AttributionProvider({ children }: { children: React.ReactNode }) {
  const { targetingGranted } = useConsent();
  const snapshotRef = useRef<AttributionSnapshot | null>(null);
  const stateRef = useRef<AttributionState | null>(null);

  useEffect(() => {
    // Capture the landing snapshot once — the entry URL carries the campaign
    // params; later client navigations drop them.
    if (snapshotRef.current == null) {
      snapshotRef.current = buildSnapshot({
        href: window.location.href,
        search: window.location.search,
        origin: window.location.origin,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        at: new Date().toISOString(),
      });
    }
    const snapshot = snapshotRef.current;

    if (targetingGranted) {
      const next = advanceState(readCookie(), snapshot);
      stateRef.current = next;
      try {
        writeCookie(next);
      } catch {
        // Storage disabled (private mode) — in-memory attribution still works.
      }
    } else {
      // No targeting consent: don't persist cross-session. Honour a revocation
      // by clearing any earlier store; in-session capture still functions.
      stateRef.current = null;
      clearCookie();
    }
  }, [targetingGranted]);

  const getAttribution = useCallback<AttributionContextValue["getAttribution"]>(() => {
    const snapshot = snapshotRef.current;
    if (snapshot == null) return {};
    return composeSubmission(stateRef.current, snapshot);
  }, []);

  return (
    <AttributionContext.Provider value={{ getAttribution }}>
      {children}
    </AttributionContext.Provider>
  );
}

export function useAttribution(): AttributionContextValue {
  const ctx = useContext(AttributionContext);
  // Forms can render outside the provider in isolated tests/stories — degrade
  // to a no-op rather than throwing so a submit never crashes on attribution.
  if (!ctx) return { getAttribution: () => ({}) };
  return ctx;
}
