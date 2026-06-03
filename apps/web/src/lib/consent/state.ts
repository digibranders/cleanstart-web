import { CONSENT_MAX_AGE_MS, CONSENT_VERSION } from "./constants";
import type {
  ConsentCategories,
  ConsentDecision,
  ConsentRecord,
} from "./types";

export const encodeRecord = (record: ConsentRecord): string =>
  JSON.stringify(record);

export const decodeRecord = (
  raw: string | null | undefined,
): ConsentRecord | null => {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const r = parsed as Partial<ConsentRecord>;
  if (
    typeof r.v !== "number" ||
    typeof r.id !== "string" ||
    typeof r.ts !== "string" ||
    typeof r.gpc !== "boolean" ||
    (r.decision !== "accept_all" &&
      r.decision !== "reject_all" &&
      r.decision !== "custom") ||
    typeof r.categories !== "object" ||
    r.categories === null ||
    r.categories.essential !== true ||
    typeof r.categories.analytics !== "boolean"
  ) {
    return null;
  }
  return {
    v: r.v,
    id: r.id,
    decision: r.decision,
    categories: { essential: true, analytics: r.categories.analytics },
    ts: r.ts,
    gpc: r.gpc,
  };
};

export const needsPrompt = (
  record: ConsentRecord | null,
  now: Date,
): boolean => {
  if (!record) return true;
  if (record.v < CONSENT_VERSION) return true;
  const age = now.getTime() - new Date(record.ts).getTime();
  if (Number.isNaN(age) || age > CONSENT_MAX_AGE_MS) return true;
  return false;
};

interface DecisionInput {
  id: string;
  gpc: boolean;
  now: Date;
  analytics?: boolean;
}

export const recordFromDecision = (
  decision: ConsentDecision,
  { id, gpc, now, analytics = false }: DecisionInput,
): ConsentRecord => {
  const resolvedAnalytics =
    decision === "accept_all"
      ? true
      : decision === "reject_all"
        ? false
        : analytics;
  const categories: ConsentCategories = {
    essential: true,
    analytics: resolvedAnalytics,
  };
  return {
    v: CONSENT_VERSION,
    id,
    decision,
    categories,
    ts: now.toISOString(),
    gpc,
  };
};
