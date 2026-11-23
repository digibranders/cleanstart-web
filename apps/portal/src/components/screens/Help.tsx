'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { type HelpArticle, groupByTopic, searchHelp } from '@/lib/help';

const SUMMARY = { margin: 0, fontSize: 12.5, lineHeight: 1.5, color: '#5E5B6E' } as const;

interface HelpProps {
  /** The articles this portal shows, already limited to its audience. */
  articles: readonly HelpArticle[];
  /** The Help path of this portal; an article lives at `${basePath}/${slug}`. */
  basePath: string;
  /** Where the viewer finds a person to ask, shown under the list. Null when there is no such page. */
  contact: { href: string; label: string; note: string } | null;
}

/** The Help center: a search box over articles grouped by topic. Shared by the partner and admin portals. */
export function Help({ articles, basePath, contact }: HelpProps): React.JSX.Element {
  const [query, setQuery] = useState('');
  const groups = useMemo(() => groupByTopic(searchHelp(articles, query)), [articles, query]);

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h1 className="h1">Help</h1>
          <span className="h1-sub">Step by step guides for this portal.</span>
        </div>
      </div>

      <div className="toolbar">
        <div className="filters">
          <label className="sr" htmlFor="help-q">
            Search help
          </label>
          <input
            id="help-q"
            className="finput"
            type="search"
            placeholder="Search help"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="empty">No article matches that search. Try fewer or different words.</div>
      ) : (
        groups.map((group) => (
          <section key={group.topic} aria-labelledby={`help-${group.topic}`} className="card clip">
            <div className="card-h">
              <h2 id={`help-${group.topic}`} className="card-t">
                {group.label}
              </h2>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {group.articles.map((a) => (
                <li key={a.slug}>
                  <Link href={`${basePath}/${a.slug}`} className="li">
                    <span className="li-t">
                      <span className="li-n">{a.title}</span>
                      <span className="li-s" style={{ whiteSpace: 'normal' }}>
                        {a.summary}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {contact ? (
        <section aria-labelledby="help-contact" className="card clip">
          <div className="card-h">
            <h2 id="help-contact" className="card-t">
              Still stuck?
            </h2>
          </div>
          <div className="card-b">
            <p style={SUMMARY}>
              {contact.note} <Link href={contact.href}>{contact.label}</Link>
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
