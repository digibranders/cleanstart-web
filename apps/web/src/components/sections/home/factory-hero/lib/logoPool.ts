/**
 * Curated logo pool for the factory hero. Sourced from
 * apps/web/public/images/hero-tech-logos/. Re-use only — do not add new logos
 * for v1 (see spec § 3.4.1).
 */

export const LOGO_POOL = [
  'nginx',
  'postgres',
  'redis',
  'python',
  'node',
  'mongodb',
  'kafka',
  'mysql',
  'prometheus',
  'grafana',
] as const;

export type LogoSlug = (typeof LOGO_POOL)[number];

export interface CveSummary {
  cveCount: number;
  version: string;
  depCount: number;
}

const CVE_SUMMARIES: Record<LogoSlug, CveSummary> = {
  nginx: { cveCount: 4, version: 'v1.18.0', depCount: 87 },
  postgres: { cveCount: 3, version: 'v14.2', depCount: 247 },
  redis: { cveCount: 2, version: 'v6.0.16', depCount: 54 },
  python: { cveCount: 7, version: 'v3.10.4', depCount: 312 },
  node: { cveCount: 9, version: 'v18.12.0', depCount: 421 },
  mongodb: { cveCount: 5, version: 'v5.0.9', depCount: 198 },
  kafka: { cveCount: 4, version: 'v3.2.0', depCount: 156 },
  mysql: { cveCount: 6, version: 'v8.0.28', depCount: 234 },
  prometheus: { cveCount: 2, version: 'v2.36.0', depCount: 91 },
  grafana: { cveCount: 5, version: 'v9.0.2', depCount: 178 },
};

const FALLBACK: CveSummary = { cveCount: 3, version: 'v1.0.0', depCount: 100 };

/**
 * Returns the logo slug for cube number `n` (0-indexed) in round-robin order.
 * Deterministic — same n always returns same slug. Wraps at LOGO_POOL.length.
 */
export function getLogoForCube(n: number): LogoSlug {
  const idx = ((n % LOGO_POOL.length) + LOGO_POOL.length) % LOGO_POOL.length;
  // idx is in [0, LOGO_POOL.length) by construction; fallback to first entry
  // for type narrowing (LOGO_POOL is a non-empty const tuple).
  return LOGO_POOL[idx] ?? LOGO_POOL[0];
}

export function getCveSummaryFor(slug: LogoSlug | string): CveSummary {
  return CVE_SUMMARIES[slug as LogoSlug] ?? FALLBACK;
}

export function getLogoAssetUrl(slug: LogoSlug): string {
  return `/images/hero-tech-logos/${slug}.svg`;
}
