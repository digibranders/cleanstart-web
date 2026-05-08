/**
 * SEO Health Score — composite signal that grades a doc's SEO setup
 * 0–100 from a fixed set of cheap, locally-computable checks. Lives
 * in the right-rail sidebar so editors get a glance answer to "is
 * this ready to publish?" without leaving the form.
 *
 * Each check has a weight; score = (weight·pass sum) / total weight,
 * rounded. Three bands map score to a coloured chip:
 *
 *   - 80–100 → healthy   (green)
 *   - 50–79  → needs-work (amber)
 *   - 0–49   → missing    (red)
 *
 * The function is pure so the React shell can call it on every render
 * and tests can pin behaviour without any DOM machinery.
 */

export const TITLE_MIN = 10;
export const TITLE_MAX = 70;
export const DESCRIPTION_MIN = 50;
export const DESCRIPTION_MAX = 170;
export const SLUG_MAX = 60;

export interface HealthCheckInputs {
  /** Final SEO title (after `seo.title || doc.title || doc.name` fallback). */
  readonly title: string | null;
  /** Final SEO description (after `seo.description || abstract`). */
  readonly description: string | null;
  /** `seo.indexable` — `index` | `noindex` | `noindex,nofollow`. */
  readonly indexable: string | null;
  readonly hasOgImage: boolean;
  readonly hasHero: boolean;
  /** Slug or computed path — empty when neither is set. */
  readonly slugOrPath: string | null;
}

export type HealthBand = 'healthy' | 'needs-work' | 'missing';

export interface HealthCheck {
  readonly id: string;
  readonly label: string;
  readonly weight: number;
  readonly pass: boolean;
}

export interface HealthScoreResult {
  readonly score: number;
  readonly band: HealthBand;
  readonly checks: readonly HealthCheck[];
  readonly failingCount: number;
}

const inLengthBand = (value: string | null, min: number, max: number): boolean => {
  if (typeof value !== 'string') return false;
  const length = value.length;
  return length >= min && length <= max;
};

const isIndexable = (raw: string | null): boolean =>
  raw == null || raw === '' || raw === 'index';

export const scoreSeoHealth = (inputs: HealthCheckInputs): HealthScoreResult => {
  const checks: HealthCheck[] = [
    {
      id: 'title-set',
      label: 'Title is set',
      weight: 2,
      pass: typeof inputs.title === 'string' && inputs.title.trim().length > 0,
    },
    {
      id: 'title-length',
      label: `Title length ${TITLE_MIN}–${TITLE_MAX}`,
      weight: 2,
      pass: inLengthBand(inputs.title, TITLE_MIN, TITLE_MAX),
    },
    {
      id: 'description-set',
      label: 'Description is set',
      weight: 2,
      pass: typeof inputs.description === 'string' && inputs.description.trim().length > 0,
    },
    {
      id: 'description-length',
      label: `Description length ${DESCRIPTION_MIN}–${DESCRIPTION_MAX}`,
      weight: 1,
      pass: inLengthBand(inputs.description, DESCRIPTION_MIN, DESCRIPTION_MAX),
    },
    {
      id: 'indexable',
      label: 'Indexable (not noindex)',
      weight: 2,
      pass: isIndexable(inputs.indexable),
    },
    {
      id: 'social-image',
      label: 'OG / hero image set',
      weight: 2,
      pass: inputs.hasOgImage || inputs.hasHero,
    },
    {
      id: 'slug-length',
      label: `Slug ≤ ${SLUG_MAX} chars`,
      weight: 1,
      pass:
        typeof inputs.slugOrPath === 'string' &&
        inputs.slugOrPath.length > 0 &&
        inputs.slugOrPath.length <= SLUG_MAX,
    },
    {
      id: 'url-set',
      label: 'URL is set',
      weight: 1,
      pass: typeof inputs.slugOrPath === 'string' && inputs.slugOrPath.length > 0,
    },
  ];

  const totalWeight = checks.reduce((acc, c) => acc + c.weight, 0);
  const earned = checks.reduce((acc, c) => acc + (c.pass ? c.weight : 0), 0);
  const score = totalWeight === 0 ? 0 : Math.round((earned / totalWeight) * 100);

  const band: HealthBand =
    score >= 80 ? 'healthy' : score >= 50 ? 'needs-work' : 'missing';
  const failingCount = checks.filter((c) => !c.pass).length;

  return { score, band, checks, failingCount };
};
