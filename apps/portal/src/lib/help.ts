// help.ts. Pure and client safe: the types for the Help center and the functions that list and search its articles.

export const HELP_TOPICS = [
  'getting-started',
  'registering-deals',
  'documents',
  'team-access',
  'account-security',
  'reports',
] as const;
export type HelpTopic = (typeof HELP_TOPICS)[number];

export const HELP_TOPIC_LABEL: Record<HelpTopic, string> = {
  'getting-started': 'Getting started',
  'registering-deals': 'Registering deals',
  documents: 'Documents',
  'team-access': 'Team and access',
  'account-security': 'Account and security',
  reports: 'Reports for staff',
};

export type HelpAudience = 'partner' | 'staff' | 'both';

/** One piece of an article: a paragraph, a numbered list of steps, or a bulleted list. */
export type HelpBlock =
  | { type: 'p'; text: string }
  | { type: 'steps'; items: readonly string[] }
  | { type: 'list'; items: readonly string[] };

export interface HelpArticle {
  slug: string;
  title: string;
  topic: HelpTopic;
  audience: HelpAudience;
  /** One sentence shown under the title in the list. */
  summary: string;
  body: readonly HelpBlock[];
}

export interface HelpGroup {
  topic: HelpTopic;
  label: string;
  articles: HelpArticle[];
}

/** The articles a portal shows: its own audience plus everything marked for both. */
export function articlesFor(articles: readonly HelpArticle[], kind: 'partner' | 'staff'): HelpArticle[] {
  return articles.filter((a) => a.audience === 'both' || a.audience === kind);
}

const blockText = (block: HelpBlock): string => (block.type === 'p' ? block.text : block.items.join(' '));

/**
 * Every word of the query must appear in the title, summary or body, in any order, ignoring case.
 * An empty query returns every article. Title matches come first, then the rest in the given order.
 */
export function searchHelp(articles: readonly HelpArticle[], query: string): HelpArticle[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...articles];
  const hits: Array<{ article: HelpArticle; inTitle: boolean }> = [];
  for (const article of articles) {
    const title = article.title.toLowerCase();
    const haystack = `${title} ${article.summary.toLowerCase()} ${article.body.map(blockText).join(' ').toLowerCase()}`;
    if (words.every((w) => haystack.includes(w))) hits.push({ article, inTitle: words.every((w) => title.includes(w)) });
  }
  return [...hits.filter((h) => h.inTitle), ...hits.filter((h) => !h.inTitle)].map((h) => h.article);
}

/** Groups articles by topic in the fixed topic order, dropping topics with no article. Article order inside a topic is kept. */
export function groupByTopic(articles: readonly HelpArticle[]): HelpGroup[] {
  return HELP_TOPICS.map((topic) => ({
    topic,
    label: HELP_TOPIC_LABEL[topic],
    articles: articles.filter((a) => a.topic === topic),
  })).filter((g) => g.articles.length > 0);
}

export const findArticle = (articles: readonly HelpArticle[], slug: string): HelpArticle | undefined =>
  articles.find((a) => a.slug === slug);
