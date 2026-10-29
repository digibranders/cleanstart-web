// Pure and free of Node imports, so the admin (browser) and the sync (server) share one rule.

export interface TopicRef {
  readonly id: number | string;
  readonly name: string;
  readonly aliases: readonly string[];
}

export const normaliseTag = (raw: string): string => raw.toLowerCase().replace(/[^a-z0-9]/g, '');

// A hashtag must start a word, so "page#vex" in a URL fragment is not one.
const HASHTAG = /(?:^|\s)#([\p{L}\p{N}_]+)/gu;

/** Topics whose name or alias matches a YouTube tag or a hashtag in the description. */
export const suggestTopicIds = (
  input: { tags: readonly string[]; description: string },
  topics: readonly TopicRef[],
): (number | string)[] => {
  const candidates = new Set<string>([
    ...input.tags.map(normaliseTag),
    ...[...input.description.matchAll(HASHTAG)].map((m) => normaliseTag(m[1] ?? '')),
  ]);
  return topics
    .filter((t) => [t.name, ...t.aliases].some((label) => candidates.has(normaliseTag(label))))
    .map((t) => t.id);
};
