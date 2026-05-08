/**
 * Curated mapping of common author topic-area strings to Schema.org
 * `DefinedTerm` blobs with Wikidata `sameAs` URLs. Stronger E-E-A-T
 * signal than a plain string — Google's knowledge graph can resolve
 * the topic to its canonical entity instead of guessing.
 *
 * Free-text topics that don't match the curated list still emit, but
 * as plain strings in `knowsAbout[]`. Editors can request additions
 * via the curated list — small enough to maintain by hand for the
 * domains the team actually publishes about.
 *
 * Lookup is case-insensitive + whitespace-normalized.
 */

interface CuratedTopic {
  readonly aliases: readonly string[];
  readonly name: string;
  readonly sameAs: string;
}

const CURATED: readonly CuratedTopic[] = [
  {
    aliases: ['container security', 'container-security', 'containers'],
    name: 'Container security',
    sameAs: 'https://www.wikidata.org/wiki/Q3614626',
  },
  {
    aliases: ['kubernetes', 'k8s'],
    name: 'Kubernetes',
    sameAs: 'https://www.wikidata.org/wiki/Q22661306',
  },
  {
    aliases: ['software supply chain', 'supply chain security', 'sbom'],
    name: 'Software supply-chain security',
    sameAs: 'https://www.wikidata.org/wiki/Q108275660',
  },
  {
    aliases: ['cybersecurity', 'cyber security', 'information security', 'infosec'],
    name: 'Cybersecurity',
    sameAs: 'https://www.wikidata.org/wiki/Q3510521',
  },
  {
    aliases: ['devops', 'dev-ops'],
    name: 'DevOps',
    sameAs: 'https://www.wikidata.org/wiki/Q1029315',
  },
  {
    aliases: ['devsecops', 'dev sec ops'],
    name: 'DevSecOps',
    sameAs: 'https://www.wikidata.org/wiki/Q33067378',
  },
  {
    aliases: ['cloud computing', 'cloud-computing', 'cloud'],
    name: 'Cloud computing',
    sameAs: 'https://www.wikidata.org/wiki/Q483639',
  },
  {
    aliases: ['cloud native', 'cloud-native'],
    name: 'Cloud-native computing',
    sameAs: 'https://www.wikidata.org/wiki/Q23000022',
  },
  {
    aliases: ['compliance', 'regulatory compliance'],
    name: 'Regulatory compliance',
    sameAs: 'https://www.wikidata.org/wiki/Q1385167',
  },
  {
    aliases: ['fips', 'fips 140', 'fips-140'],
    name: 'FIPS 140',
    sameAs: 'https://www.wikidata.org/wiki/Q1397079',
  },
  {
    aliases: ['linux'],
    name: 'Linux',
    sameAs: 'https://www.wikidata.org/wiki/Q388',
  },
  {
    aliases: ['open source', 'open-source', 'open source software', 'oss'],
    name: 'Open-source software',
    sameAs: 'https://www.wikidata.org/wiki/Q1130645',
  },
  {
    aliases: ['vulnerability management', 'vuln management', 'cve'],
    name: 'Vulnerability management',
    sameAs: 'https://www.wikidata.org/wiki/Q3091010',
  },
];

const norm = (raw: string): string =>
  raw.trim().toLowerCase().replace(/\s+/g, ' ');

export interface KnowsAboutEntry {
  /** When matched: Schema.org DefinedTerm. Otherwise a plain string. */
  readonly value:
    | string
    | { '@type': 'DefinedTerm'; name: string; sameAs: string };
}

/**
 * Resolve a topic string to either a curated DefinedTerm entry or
 * the plain string itself. Empty / whitespace input returns null.
 */
export const resolveTopicArea = (raw: unknown): KnowsAboutEntry | null => {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim();
  if (cleaned.length === 0) return null;
  const key = norm(cleaned);
  for (const row of CURATED) {
    if (row.aliases.includes(key)) {
      return {
        value: { '@type': 'DefinedTerm', name: row.name, sameAs: row.sameAs },
      };
    }
  }
  return { value: cleaned };
};

/**
 * Bulk version — collapses an array of raw topic strings into the
 * `knowsAbout[]` payload. Drops empties + dedupes by canonical name.
 */
export const buildKnowsAboutEntries = (
  topics: readonly (string | null | undefined)[],
): unknown[] => {
  const seen = new Set<string>();
  const out: unknown[] = [];
  for (const topic of topics) {
    const entry = resolveTopicArea(topic);
    if (!entry) continue;
    const dedupeKey =
      typeof entry.value === 'string'
        ? entry.value.toLowerCase()
        : entry.value.name.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    out.push(entry.value);
  }
  return out;
};
