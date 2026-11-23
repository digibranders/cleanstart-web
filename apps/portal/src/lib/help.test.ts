import { describe, expect, it } from 'vitest';
import { HELP_ARTICLES } from '@/content/help';
import { articlesFor, findArticle, groupByTopic, HELP_TOPICS, type HelpArticle, searchHelp } from './help';

const article = (over: Partial<HelpArticle>): HelpArticle => ({
  slug: 'a',
  title: 'Register a deal',
  topic: 'registering-deals',
  audience: 'partner',
  summary: 'Tell CleanStart about a customer.',
  body: [{ type: 'p', text: 'Open the form and submit it.' }],
  ...over,
});

describe('searchHelp', () => {
  const list = [
    article({ slug: 'one', title: 'Register a deal' }),
    article({ slug: 'two', title: 'Protection', summary: 'Ninety days.', body: [{ type: 'steps', items: ['Register first', 'Wait for review'] }] }),
    article({ slug: 'three', title: 'Documents', topic: 'documents', summary: 'Find files.', body: [{ type: 'p', text: 'Search by name.' }] }),
  ];

  it('returns everything for an empty or blank query', () => {
    expect(searchHelp(list, '')).toHaveLength(3);
    expect(searchHelp(list, '   ')).toHaveLength(3);
  });

  it('matches every word in any order, ignoring case', () => {
    expect(searchHelp(list, 'DEAL register').map((a) => a.slug)).toEqual(['one']);
    expect(searchHelp(list, 'wait review').map((a) => a.slug)).toEqual(['two']);
  });

  it('puts title matches before body matches', () => {
    expect(searchHelp(list, 'register').map((a) => a.slug)).toEqual(['one', 'two']);
  });

  it('returns nothing when a word is missing everywhere', () => {
    expect(searchHelp(list, 'register zebra')).toEqual([]);
  });
});

describe('groupByTopic and articlesFor', () => {
  it('groups in topic order and drops empty topics', () => {
    const groups = groupByTopic([
      article({ slug: 'd', topic: 'documents' }),
      article({ slug: 'g', topic: 'getting-started' }),
      article({ slug: 'd2', topic: 'documents' }),
    ]);
    expect(groups.map((g) => g.label)).toEqual(['Getting started', 'Documents']);
    expect(groups[1]?.articles.map((a) => a.slug)).toEqual(['d', 'd2']);
  });

  it('shows an audience its own articles plus the shared ones', () => {
    const list = [article({ slug: 'p' }), article({ slug: 's', audience: 'staff' }), article({ slug: 'b', audience: 'both' })];
    expect(articlesFor(list, 'partner').map((a) => a.slug)).toEqual(['p', 'b']);
    expect(articlesFor(list, 'staff').map((a) => a.slug)).toEqual(['s', 'b']);
  });

  it('finds an article by slug', () => {
    expect(findArticle([article({ slug: 'x' })], 'x')?.slug).toBe('x');
    expect(findArticle([article({ slug: 'x' })], 'y')).toBeUndefined();
  });
});

describe('the shipped articles', () => {
  const text = (a: HelpArticle): string =>
    [a.title, a.summary, ...a.body.map((b) => (b.type === 'p' ? b.text : b.items.join(' ')))].join(' ');

  it('have unique slugs and a known topic', () => {
    const slugs = HELP_ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const a of HELP_ARTICLES) expect(HELP_TOPICS).toContain(a.topic);
  });

  it('use no em dash or en dash', () => {
    for (const a of HELP_ARTICLES) expect(text(a), a.slug).not.toMatch(/[–—]/);
  });

  it('keep the CRM product name out of the copy', () => {
    for (const a of HELP_ARTICLES) expect(text(a), a.slug).not.toMatch(/hubspot|crm/i);
  });

  it('give each audience at least one article in every topic it uses', () => {
    expect(groupByTopic(articlesFor(HELP_ARTICLES, 'partner')).length).toBeGreaterThanOrEqual(4);
    expect(groupByTopic(articlesFor(HELP_ARTICLES, 'staff')).map((g) => g.topic)).toContain('reports');
    expect(groupByTopic(articlesFor(HELP_ARTICLES, 'partner')).map((g) => g.topic)).not.toContain('reports');
  });
});
