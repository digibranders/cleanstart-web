/**
 * Webflow → Payload field normalization for the Jobs collection.
 * Webflow stored Department / Timing / Experience as free-text;
 * Payload uses enums. The migration maps each known Webflow value to
 * its Payload enum, returns null for unrecognized values, and surfaces
 * a "needs editor pass" report from `summarizeJobNormalization` so we
 * never silently drop a row.
 *
 * The mappers are case-insensitive + whitespace-normalized so the
 * import survives editorial typo drift ("Full-time", "full time",
 * "Full Time" all collapse to "full-time").
 */

const norm = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null;
  return raw.trim().toLowerCase().replace(/[\s_]+/g, '-');
};

// ─── Department ─────────────────────────────────────────────────

export type DepartmentEnum =
  | 'engineering'
  | 'sales'
  | 'marketing'
  | 'customer-success'
  | 'operations'
  | 'finance'
  | 'legal'
  | 'people';

const DEPARTMENT_MAP: Record<string, DepartmentEnum> = {
  engineering: 'engineering',
  eng: 'engineering',
  'software-engineering': 'engineering',
  rd: 'engineering',
  'r-d': 'engineering',
  sales: 'sales',
  'business-development': 'sales',
  bd: 'sales',
  marketing: 'marketing',
  growth: 'marketing',
  'product-marketing': 'marketing',
  'customer-success': 'customer-success',
  cs: 'customer-success',
  support: 'customer-success',
  'customer-support': 'customer-success',
  operations: 'operations',
  ops: 'operations',
  finance: 'finance',
  'finance-and-accounting': 'finance',
  accounting: 'finance',
  legal: 'legal',
  people: 'people',
  hr: 'people',
  'human-resources': 'people',
  'human-resource': 'people',
  talent: 'people',
  // CleanStart Webflow department values that don't match an enum name 1:1.
  admin: 'operations',
  'admin-&-it-operations-executive': 'operations',
  'qa-and-delivery': 'engineering',
  egineering: 'engineering', // source-data typo for "Engineering"
  'customer-acquisition-team-(cat)': 'sales',
};

export const normalizeDepartment = (raw: unknown): DepartmentEnum | null => {
  const key = norm(raw);
  if (!key) return null;
  return DEPARTMENT_MAP[key] ?? null;
};

// ─── Employment type (Webflow "Timing") ─────────────────────────

export type EmploymentTypeEnum =
  | 'full-time'
  | 'part-time'
  | 'contract'
  | 'internship';

const EMPLOYMENT_TYPE_MAP: Record<string, EmploymentTypeEnum> = {
  'full-time': 'full-time',
  fulltime: 'full-time',
  permanent: 'full-time',
  'part-time': 'part-time',
  parttime: 'part-time',
  contract: 'contract',
  contractor: 'contract',
  consulting: 'contract',
  freelance: 'contract',
  internship: 'internship',
  intern: 'internship',
  trainee: 'internship',
};

export const normalizeEmploymentType = (
  raw: unknown,
): EmploymentTypeEnum | null => {
  const key = norm(raw);
  if (!key) return null;
  return EMPLOYMENT_TYPE_MAP[key] ?? null;
};

// ─── Experience level ───────────────────────────────────────────

export type ExperienceLevelEnum =
  | 'entry'
  | 'mid'
  | 'senior'
  | 'staff'
  | 'principal';

const EXPERIENCE_LEVEL_MAP: Record<string, ExperienceLevelEnum> = {
  entry: 'entry',
  junior: 'entry',
  associate: 'entry',
  graduate: 'entry',
  mid: 'mid',
  midlevel: 'mid',
  'mid-level': 'mid',
  intermediate: 'mid',
  senior: 'senior',
  sr: 'senior',
  'senior-engineer': 'senior',
  staff: 'staff',
  'staff-engineer': 'staff',
  lead: 'staff',
  principal: 'principal',
  'principal-engineer': 'principal',
  distinguished: 'principal',
};

// Recognise common year-range strings — Webflow editors used many
// shapes for the same idea (`5+ years`, `1-2 Years`, `3–5 years`,
// `1 Year`, with em-dash / en-dash / hyphen, mixed case, optional
// trailing whitespace). We pick the LOWER bound and bucket by years.
const YEARS_PATTERN =
  /(\d+)\s*[-–—]?\s*(?:(\d+))?\s*\+?\s*(?:years?|yrs?|y)\b/i;

const fromYearString = (raw: string): ExperienceLevelEnum | null => {
  const match = raw.match(YEARS_PATTERN);
  if (!match || !match[1]) return null;
  const years = Number.parseInt(match[1], 10);
  if (!Number.isFinite(years)) return null;
  if (years <= 2) return 'entry';
  if (years <= 5) return 'mid';
  if (years <= 9) return 'senior';
  if (years <= 14) return 'staff';
  return 'principal';
};

export const normalizeExperienceLevel = (
  raw: unknown,
): ExperienceLevelEnum | null => {
  const key = norm(raw);
  if (!key) return null;
  const direct = EXPERIENCE_LEVEL_MAP[key];
  if (direct) return direct;
  if (typeof raw === 'string') {
    const yearGuess = fromYearString(raw);
    if (yearGuess) return yearGuess;
  }
  return null;
};

/**
 * Normalises the raw Webflow `experience` free-text into a clean display
 * string for the careers site, preserving the original year range that
 * `normalizeExperienceLevel` buckets away. Standardises dashes to a hyphen,
 * collapses whitespace, and Title-cases the word "Year(s)":
 *   "3-10 years" → "3-10 Years"   "1–3 Years" → "1-3 Years"
 *   "0-1 year"   → "0-1 Year"     "5+ years"  → "5+ Years"
 * Returns undefined for blank / non-string input.
 */
export const normalizeExperienceRange = (raw: unknown): string | undefined => {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return undefined;
  return trimmed
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/years/gi, 'Years')
    .replace(/\byear\b/gi, 'Year');
};

// ─── Bulk + report ──────────────────────────────────────────────

export interface JobLegacyRow {
  readonly index: number;
  readonly slug?: string | null;
  readonly department?: unknown;
  readonly timing?: unknown;
  readonly experience?: unknown;
}

export interface NormalizedJobLegacy {
  readonly index: number;
  readonly department: DepartmentEnum | null;
  readonly employmentType: EmploymentTypeEnum | null;
  readonly experienceLevel: ExperienceLevelEnum | null;
  readonly unmapped: readonly string[];
}

/**
 * Run all three normalizers across a batch and return per-row
 * results plus an "unmapped" string list per row so the migration
 * UI / log can surface "row 14: 'Director of Sales' didn't map to a
 * department". Pure — caller decides how to react.
 */
export const normalizeJobLegacyRows = (
  rows: readonly JobLegacyRow[],
): NormalizedJobLegacy[] =>
  rows.map((row) => {
    const department = normalizeDepartment(row.department);
    const employmentType = normalizeEmploymentType(row.timing);
    const experienceLevel = normalizeExperienceLevel(row.experience);
    const unmapped: string[] = [];
    if (row.department != null && department == null) {
      unmapped.push(`department="${String(row.department)}"`);
    }
    if (row.timing != null && employmentType == null) {
      unmapped.push(`timing="${String(row.timing)}"`);
    }
    if (row.experience != null && experienceLevel == null) {
      unmapped.push(`experience="${String(row.experience)}"`);
    }
    return { index: row.index, department, employmentType, experienceLevel, unmapped };
  });
