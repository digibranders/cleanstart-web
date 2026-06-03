import { CONSENT_MAX_AGE_MS, CONSENT_VERSION } from "./constants";
import type {
  ConsentCategories,
  ConsentDecision,
  ConsentRecord,
  OptionalCategory,
} from "./types";

export const OPTIONAL_CATEGORIES: readonly OptionalCategory[] = [
  "performance",
  "functional",
  "targeting",
];

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
  const c = r.categories;
  if (
    typeof r.v !== "number" ||
    typeof r.id !== "string" ||
    typeof r.ts !== "string" ||
    typeof r.gpc !== "boolean" ||
    (r.decision !== "accept_all" &&
      r.decision !== "reject_all" &&
      r.decision !== "custom") ||
    typeof c !== "object" ||
    c === null ||
    c.strictlyNecessary !== true ||
    typeof c.performance !== "boolean" ||
    typeof c.functional !== "boolean" ||
    typeof c.targeting !== "boolean"
  ) {
    return null;
  }
  return {
    v: r.v,
    id: r.id,
    decision: r.decision,
    categories: {
      strictlyNecessary: true,
      performance: c.performance,
      functional: c.functional,
      targeting: c.targeting,
    },
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
  /** For `custom`, the chosen state of each optional category. Ignored for accept/reject. */
  selection?: Partial<Record<OptionalCategory, boolean>> | undefined;
}

export const recordFromDecision = (
  decision: ConsentDecision,
  { id, gpc, now, selection }: DecisionInput,
): ConsentRecord => {
  const resolve = (key: OptionalCategory): boolean => {
    if (decision === "accept_all") return true;
    if (decision === "reject_all") return false;
    return selection?.[key] ?? false;
  };
  const categories: ConsentCategories = {
    strictlyNecessary: true,
    performance: resolve("performance"),
    functional: resolve("functional"),
    targeting: resolve("targeting"),
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
