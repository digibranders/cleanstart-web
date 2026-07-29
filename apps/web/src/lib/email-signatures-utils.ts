/**
 * Client-safe signature-directory types + pure helpers.
 *
 * These are imported by client components (the directory's search + grid).
 * They live here — NOT in `email-signatures.ts` — because that module imports
 * the CMS fetcher, which pulls in `next/headers` (a server-only API). A *value*
 * import from there into a client component drags server code into the client
 * bundle and fails the build.
 */

/** Section headings the directory groups people under, in display order. */
export const SIGNATURE_GROUP_ORDER = [
  "Executive Leadership",
  "Sales & Regional Leadership",
  "Marketing & Communications",
  "HR & People Operations",
  "Account Management & Sales Operations",
  "Engineering & Technical Solutions",
  "Product & Program Management",
  "Infrastructure & Systems",
  "Finance & Accounts",
  "Customer Success",
  "Partnerships & Alliances",
  "Operations",
  "Data & Analytics",
  "Design",
  "IT & Security",
  "Quality Assurance",
  "Training & Enablement",
  "Administration",
  "Legal",
] as const;

export interface EmailSignatureSummary {
  id: string | number;
  slug: string;
  name: string;
  jobTitle: string;
  email: string;
  group: string;
  sortOrder?: number | null;
}

/**
 * Signatures matching a free-text query across name, job title, email and
 * group.
 *
 * Tokens are AND-ed rather than matched as one substring, so "arjun sales"
 * finds the person whose name and group each hold one of the words — the way
 * someone actually types a half-remembered colleague into a directory.
 */
export function filterSignatures(
  signatures: EmailSignatureSummary[],
  query: string,
): EmailSignatureSummary[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return signatures;

  return signatures.filter((person) => {
    const haystack =
      `${person.name} ${person.jobTitle} ${person.email} ${person.group}`.toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });
}

/** Signatures bucketed into `SIGNATURE_GROUP_ORDER`; empty groups are dropped. */
export function groupSignatures(
  signatures: EmailSignatureSummary[],
): { group: string; people: EmailSignatureSummary[] }[] {
  const known = new Set<string>(SIGNATURE_GROUP_ORDER);

  const ordered = SIGNATURE_GROUP_ORDER.map((group) => ({
    group: group as string,
    people: signatures.filter((person) => person.group === group),
  }));

  // A group added in the CMS but not yet reflected here still renders, after
  // the known ones, rather than silently dropping those people from the page.
  const extras = [...new Set(signatures.map((p) => p.group))]
    .filter((group) => !known.has(group))
    .sort()
    .map((group) => ({
      group,
      people: signatures.filter((person) => person.group === group),
    }));

  return [...ordered, ...extras].filter((entry) => entry.people.length > 0);
}
