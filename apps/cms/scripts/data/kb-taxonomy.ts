/**
 * Knowledge-Hub taxonomy helpers for the Academy seed.
 *
 * The Academy ships sections/subcategories as numeric-prefixed URL tokens
 * (`01-understand`, `ai-runtime`). The CMS taxonomy is de-numbered: names and
 * slugs carry no numbers, and sidebar order lives in `displayOrder`.
 */

/** Acronyms / brand words that must keep specific casing in humanized labels. */
const TOKEN_OVERRIDES: Record<string, string> = {
  ai: 'AI',
  cli: 'CLI',
  api: 'API',
  cicd: 'CI/CD',
  fips: 'FIPS',
  qa: 'QA',
  sbom: 'SBOM',
  sca: 'SCA',
  slsa: 'SLSA',
  vex: 'VEX',
  k8s: 'Kubernetes',
  devops: 'DevOps',
  cleanstart: 'CleanStart',
};

/** Turn a hyphenated URL token into a human label, fixing acronym casing. */
export const humanizeLabel = (token: string): string =>
  token
    .split('-')
    .map((word) => TOKEN_OVERRIDES[word] ?? word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/** De-numbered section display names, keyed by URL token (after the `NN-` prefix). */
export const SECTION_NAMES: Record<string, string> = {
  understand: 'Understand',
  explore: 'Explore',
  learn: 'Learn',
  build: 'Build',
  deploy: 'Deploy',
  operate: 'Operate',
  secure: 'Secure',
  reference: 'Reference',
};

/** Section sidebar order. Academy sections sit below the legacy groups (0–9). */
export const SECTION_ORDER: Record<string, number> = {
  understand: 10,
  explore: 20,
  learn: 30,
  build: 40,
  deploy: 50,
  operate: 60,
  secure: 70,
  reference: 80,
};
