import safeRegex from 'safe-regex';

/**
 * Compile an editor-supplied regex pattern with two safety guarantees:
 *
 *   1. Syntactic correctness — invalid regex syntax returns null.
 *   2. Catastrophic-backtracking heuristic — nested quantifiers
 *      ((a+)+, (a*)+, etc.) are rejected via the `safe-regex` package.
 *      The check is heuristic-based (star-height analysis) and catches
 *      the common patterns that hang the event loop on the validate-fields
 *      hot path.
 *
 * Rejecting unsafe patterns at *Form save* time (in a beforeChange hook)
 * means the public submit endpoint never executes them. The endpoint
 * still uses this helper rather than raw `new RegExp()` for
 * defense-in-depth — older rows from before the hook may carry unsafe
 * patterns we'd rather skip than execute.
 */
export type RegexCheck =
  | { ok: true; regex: RegExp }
  | { ok: false; reason: 'invalid-syntax' | 'catastrophic-backtracking' };

const MAX_PATTERN_LENGTH = 256;

export const checkPattern = (pattern: string | null | undefined): RegexCheck => {
  if (!pattern || typeof pattern !== 'string') {
    return { ok: false, reason: 'invalid-syntax' };
  }
  if (pattern.length > MAX_PATTERN_LENGTH) {
    return { ok: false, reason: 'catastrophic-backtracking' };
  }
  // Try to compile first so genuine syntax errors are reported as such
  // rather than passed to safe-regex (which returns false for unparseable
  // input and would mask the real reason).
  let compiled: RegExp;
  try {
    compiled = new RegExp(pattern);
  } catch {
    return { ok: false, reason: 'invalid-syntax' };
  }
  if (!safeRegex(pattern)) {
    return { ok: false, reason: 'catastrophic-backtracking' };
  }
  return { ok: true, regex: compiled };
};

/** Convenience for callers that want a RegExp-or-null shape. */
export const compileSafe = (pattern: string | null | undefined): RegExp | null => {
  const check = checkPattern(pattern);
  return check.ok ? check.regex : null;
};
