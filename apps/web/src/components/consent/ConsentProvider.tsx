"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  CONSENT_VERSION,
} from "@/lib/consent/constants";
import {
  decodeRecord,
  encodeRecord,
  needsPrompt,
  recordFromDecision,
} from "@/lib/consent/state";
import type { ConsentDecision, ConsentRecord } from "@/lib/consent/types";

interface ConsentContextValue {
  record: ConsentRecord | null;
  /** True when the banner should be shown (no valid current decision). */
  promptOpen: boolean;
  analyticsGranted: boolean;
  /** GPC signal detected at load. */
  gpc: boolean;
  decide: (decision: ConsentDecision, opts?: { analytics?: boolean }) => void;
  /** Re-open the banner (footer "Cookie preferences"). */
  openPrompt: () => void;
  closePrompt: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

const readCookie = (): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  return match
    ? decodeURIComponent(match.slice(CONSENT_COOKIE.length + 1))
    : null;
};

const writeCookie = (value: string): void => {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(value)}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
};

const detectGpc = (): boolean => {
  if (typeof navigator === "undefined") return false;
  return (
    (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl === true
  );
};

const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const updateConsentMode = (analytics: boolean): void => {
  const w = window as Window & { gtag?: (...args: unknown[]) => void };
  w.gtag?.("consent", "update", {
    analytics_storage: analytics ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
};

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [record, setRecord] = useState<ConsentRecord | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [gpc, setGpc] = useState(false);

  useEffect(() => {
    const existing = decodeRecord(readCookie());
    const gpcSignal = detectGpc();
    setGpc(gpcSignal);
    setRecord(existing);
    if (needsPrompt(existing, new Date())) {
      setPromptOpen(true);
    } else if (existing) {
      updateConsentMode(existing.categories.analytics);
    }
  }, []);

  const persist = useCallback((next: ConsentRecord) => {
    setRecord(next);
    setPromptOpen(false);
    try {
      const encoded = encodeRecord(next);
      writeCookie(encoded);
      window.localStorage?.setItem(CONSENT_COOKIE, encoded);
    } catch {
      // Storage disabled (private mode) — session-only state still works.
    }
    updateConsentMode(next.categories.analytics);
    void fetch("/api/consent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        anonymousId: next.id,
        decision: next.decision,
        categories: next.categories,
        consentVersion: CONSENT_VERSION,
        gpc: next.gpc,
      }),
      keepalive: true,
    }).catch(() => {
      // Audit forward is best-effort; never blocks the UI.
    });
  }, []);

  const decide = useCallback<ConsentContextValue["decide"]>(
    (decision, opts) => {
      const id = record?.id ?? newId();
      persist(
        recordFromDecision(decision, {
          id,
          gpc,
          now: new Date(),
          analytics: opts?.analytics,
        }),
      );
    },
    [record?.id, gpc, persist],
  );

  const value = useMemo<ConsentContextValue>(
    () => ({
      record,
      promptOpen,
      analyticsGranted: record?.categories.analytics ?? false,
      gpc,
      decide,
      openPrompt: () => setPromptOpen(true),
      closePrompt: () => setPromptOpen(false),
    }),
    [record, promptOpen, gpc, decide],
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within a ConsentProvider");
  return ctx;
}
