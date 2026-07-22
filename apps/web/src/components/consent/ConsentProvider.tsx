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
import type {
  ConsentCategories,
  ConsentDecision,
  ConsentRecord,
  OptionalCategory,
} from "@/lib/consent/types";

interface ConsentContextValue {
  record: ConsentRecord | null;
  /** True when the banner should be shown (no valid current decision). */
  promptOpen: boolean;
  /** Resolved categories from the persisted decision (null until decided). */
  categories: ConsentCategories | null;
  /** Convenience flag for gating behavioural analytics (performance category). */
  performanceGranted: boolean;
  /** Convenience flag for gating advertising / profiling tools (targeting category). */
  targetingGranted: boolean;
  /** GPC signal detected at load. */
  gpc: boolean;
  decide: (
    decision: ConsentDecision,
    opts?: { selection?: Partial<Record<OptionalCategory, boolean>> },
  ) => void;
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

const granted = (on: boolean): "granted" | "denied" => (on ? "granted" : "denied");

// `analytics_storage` stays "granted" regardless of the banner decision — GA4
// is intentionally un-gated (see lib/consent/consent-mode-snippet.ts). Only the
// advertising + functionality signals follow the visitor's categories.
const updateConsentMode = (c: ConsentCategories): void => {
  const w = window as Window & { gtag?: (...args: unknown[]) => void };
  w.gtag?.("consent", "update", {
    analytics_storage: "granted",
    ad_storage: granted(c.targeting),
    ad_user_data: granted(c.targeting),
    ad_personalization: granted(c.targeting),
    functionality_storage: granted(c.functional),
    personalization_storage: granted(c.functional),
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
      updateConsentMode(existing.categories);
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
    updateConsentMode(next.categories);
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
          selection: opts?.selection,
        }),
      );
    },
    [record?.id, gpc, persist],
  );

  const value = useMemo<ConsentContextValue>(
    () => ({
      record,
      promptOpen,
      categories: record?.categories ?? null,
      performanceGranted: record?.categories.performance ?? false,
      targetingGranted: record?.categories.targeting ?? false,
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
