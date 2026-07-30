// Gutter intentionally replaced with a plain div — @payloadcms/ui Gutter
// is a render-side component (forbidden by the data-layer-only rule).
import type { AdminViewServerProps, Payload, Where } from 'payload';
import type { ReactElement, ReactNode } from 'react';

import { ChevronRight } from '../icons/Chevron';
import { scopedCollectionSlugsForUser } from '../../../lib/wire-scoped-nav';
// Analytics snapshot hidden — re-enable with the render below.
// import { AnalyticsCards } from './AnalyticsCards';

const PROJECT_NAME = 'CleanStart';

const VERSIONED_CONTENT = [
  'blogs',
  'news',
  'guides',
  'resources',
  'knowledgeBase',
  'events',
  'webinars',
  'jobs',
  'pages',
] as const;
type VersionedSlug = (typeof VERSIONED_CONTENT)[number];

const COLLECTION_LABELS: Record<VersionedSlug, string> = {
  blogs: 'Blog',
  news: 'News',
  guides: 'Guide',
  resources: 'Resource',
  knowledgeBase: 'Knowledge',
  events: 'Event',
  webinars: 'Webinar',
  jobs: 'Job',
  pages: 'Page',
};

const ONE_DAY = 24 * 60 * 60 * 1000;
const SEVEN_DAYS = 7 * ONE_DAY;

type RecentEdit = {
  id: string | number;
  collection: VersionedSlug;
  title: string;
  status: 'draft' | 'published' | 'unknown';
  updatedAt: string;
};

type Pulse = {
  draftsPending: number;
  publishedThisWeek: number;
  // `null` for scoped (departmental) users, who don't own leads/redirects —
  // the corresponding cards are omitted rather than shown as zero.
  leadsToday: number | null;
  redirectsActive: number | null;
};

const safeFind = async (
  payload: Payload,
  collection: string,
  where: Where | undefined,
  draft = false,
): Promise<number> => {
  try {
    const result = await payload.find({
      collection: collection as Parameters<Payload['find']>[0]['collection'],
      limit: 1,
      depth: 0,
      draft,
      pagination: true,
      ...(where ? { where } : {}),
    });
    return result.totalDocs ?? 0;
  } catch {
    // Collection may not exist or access may be denied — surface as 0
    // rather than crashing the dashboard.
    return 0;
  }
};

const fetchPulse = async (
  payload: Payload,
  contentSlugs: readonly VersionedSlug[],
  includeGlobalStats: boolean,
): Promise<Pulse> => {
  const dayAgo = new Date(Date.now() - ONE_DAY).toISOString();
  const weekAgo = new Date(Date.now() - SEVEN_DAYS).toISOString();

  const [draftCounts, publishedCounts, leadsToday, redirectsActive] =
    await Promise.all([
      Promise.all(
        contentSlugs.map((slug) =>
          safeFind(payload, slug, { _status: { equals: 'draft' } }, true),
        ),
      ),
      Promise.all(
        contentSlugs.map((slug) =>
          safeFind(payload, slug, {
            and: [
              { _status: { equals: 'published' } },
              { updatedAt: { greater_than: weekAgo } },
            ],
          }),
        ),
      ),
      includeGlobalStats
        ? safeFind(payload, 'leads', { createdAt: { greater_than: dayAgo } })
        : Promise.resolve(null),
      includeGlobalStats
        ? safeFind(payload, 'redirects', undefined)
        : Promise.resolve(null),
    ]);

  return {
    draftsPending: draftCounts.reduce((acc, n) => acc + n, 0),
    publishedThisWeek: publishedCounts.reduce((acc, n) => acc + n, 0),
    leadsToday,
    redirectsActive,
  };
};

const pickTitle = (doc: Record<string, unknown>): string => {
  const title = doc.title;
  if (typeof title === 'string' && title.length > 0) return title;
  const name = doc.name;
  if (typeof name === 'string' && name.length > 0) return name;
  const filename = doc.filename;
  if (typeof filename === 'string' && filename.length > 0) return filename;
  return 'Untitled';
};

const fetchRecentEdits = async (
  payload: Payload,
  contentSlugs: readonly VersionedSlug[],
): Promise<RecentEdit[]> => {
  const lists = await Promise.all(
    contentSlugs.map(async (slug) => {
      try {
        const r = await payload.find({
          collection: slug,
          sort: '-updatedAt',
          limit: 5,
          depth: 0,
          draft: true,
        });
        return r.docs.map((doc) => {
          const d = doc as unknown as Record<string, unknown>;
          const status = d._status;
          return {
            id: (d.id ?? '') as string | number,
            collection: slug,
            title: pickTitle(d),
            status:
              status === 'draft' || status === 'published'
                ? (status as 'draft' | 'published')
                : 'unknown',
            updatedAt:
              typeof d.updatedAt === 'string'
                ? d.updatedAt
                : new Date(0).toISOString(),
          } satisfies RecentEdit;
        });
      } catch {
        return [];
      }
    }),
  );
  const flat = lists.flat();
  flat.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  return flat.slice(0, 10);
};

const formatRelative = (iso: string): string => {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  if (diff < 60_000) return 'just now';
  if (diff < 60 * 60_000)
    return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < ONE_DAY) return `${Math.floor(diff / (60 * 60_000))}h ago`;
  if (diff < SEVEN_DAYS) return `${Math.floor(diff / ONE_DAY)}d ago`;
  return new Date(iso).toLocaleDateString();
};

type PulseCardProps = {
  label: string;
  value: number;
  caption: string;
  href?: string | undefined;
  tone?: 'neutral' | 'cyan' | 'amber';
};

const PulseCard = ({
  label,
  value,
  caption,
  href,
  tone = 'neutral',
}: PulseCardProps): ReactElement => {
  const body: ReactNode = (
    <>
      <div className="cs-dashboard__pulse-label">{label}</div>
      <div className="cs-dashboard__pulse-value">
        {value.toLocaleString()}
      </div>
      <div className="cs-dashboard__pulse-caption">{caption}</div>
    </>
  );
  const className = `cs-dashboard__pulse cs-dashboard__pulse--${tone}`;
  if (href) {
    return (
      <a className={className} href={href}>
        {body}
      </a>
    );
  }
  return <div className={className}>{body}</div>;
};

type RecentEditsTableProps = { items: RecentEdit[] };

type TimelineGroupKey = 'today' | 'yesterday' | 'thisWeek' | 'older';

const startOfDay = (ms: number): number => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const groupForUpdated = (iso: string): TimelineGroupKey => {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 'older';
  const now = Date.now();
  const todayStart = startOfDay(now);
  const yesterdayStart = todayStart - ONE_DAY;
  const weekStart = todayStart - 6 * ONE_DAY;
  if (t >= todayStart) return 'today';
  if (t >= yesterdayStart) return 'yesterday';
  if (t >= weekStart) return 'thisWeek';
  return 'older';
};

const GROUP_LABELS: Record<TimelineGroupKey, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'Earlier this week',
  older: 'Older',
};

/**
 * Activity timeline. Replaces the static recent-edits table with a
 * glanceable day-grouped feed: rows under "Today", "Yesterday",
 * "Earlier this week", "Older", each showing a status dot + collection
 * type + title + relative time. The vertical hairline through the
 * status dots reads as a true timeline rather than a list.
 */
const RecentEditsTable = ({
  items,
}: RecentEditsTableProps): ReactElement => {
  if (items.length === 0) {
    return (
      <div className="cs-dashboard__empty">
        No edits yet — your recent work across content collections will
        show up here.
      </div>
    );
  }

  const groups: Array<{ key: TimelineGroupKey; rows: RecentEdit[] }> = [];
  for (const row of items) {
    const key = groupForUpdated(row.updatedAt);
    let bucket = groups.find((g) => g.key === key);
    if (!bucket) {
      bucket = { key, rows: [] };
      groups.push(bucket);
    }
    bucket.rows.push(row);
  }

  return (
    <ol className="cs-dashboard__timeline">
      {groups.map((group) => (
        <li key={group.key} className="cs-dashboard__timeline-group">
          <h3 className="cs-dashboard__timeline-heading">
            {GROUP_LABELS[group.key]}
          </h3>
          <ul className="cs-dashboard__timeline-rows">
            {group.rows.map((row) => {
              const href = `/admin/collections/${row.collection}/${row.id}`;
              const dotMod =
                row.status === 'published'
                  ? 'live'
                  : row.status === 'draft'
                    ? 'draft'
                    : 'unknown';
              return (
                <li
                  key={`${row.collection}:${row.id}`}
                  className="cs-dashboard__timeline-row"
                >
                  <span
                    aria-hidden="true"
                    className={`cs-dashboard__timeline-dot cs-dashboard__timeline-dot--${dotMod}`}
                  />
                  <a className="cs-dashboard__timeline-title" href={href}>
                    <span className="cs-dashboard__timeline-type">
                      {COLLECTION_LABELS[row.collection]}
                    </span>
                    <span className="cs-dashboard__timeline-name">
                      {row.title}
                    </span>
                  </a>
                  <time
                    className="cs-dashboard__timeline-time"
                    dateTime={row.updatedAt}
                    title={new Date(row.updatedAt).toLocaleString()}
                  >
                    {formatRelative(row.updatedAt)}
                  </time>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
};

type QuickLinkProps = {
  label: string;
  href: string;
  description: string;
};

const QUICK_LINKS: QuickLinkProps[] = [
  {
    label: 'New blog post',
    href: '/admin/collections/blogs/create',
    description: 'Start a draft in the Blogs collection.',
  },
  {
    label: 'New news article',
    href: '/admin/collections/news/create',
    description: 'Write a press release or company update.',
  },
  {
    label: 'New webinar',
    href: '/admin/collections/webinars/create',
    description: 'Schedule a live session or upload a recording.',
  },
  {
    label: 'New event',
    href: '/admin/collections/events/create',
    description: 'Create an in-person or virtual event entry.',
  },
  {
    label: 'Open Media library',
    href: '/admin/collections/media',
    description: 'Browse and manage all uploaded assets.',
  },
  {
    label: 'Review leads',
    href: '/admin/collections/leads',
    description: 'See recent form submissions and CRM sync state.',
  },
  {
    label: 'Audit log',
    href: '/admin/collections/audit-log',
    description: 'Inspect editorial actions and version history.',
  },
  {
    label: 'Manage redirects',
    href: '/admin/collections/redirects',
    description: 'Add or audit URL redirects.',
  },
];

/**
 * Domain-scoped quick actions, keyed by collection slug. A departmental user
 * only ever sees the create/manage links for the collections in their own
 * domain — never a "New blog post" link that would 404 on their access.
 */
const DOMAIN_QUICK_LINKS: Partial<Record<string, QuickLinkProps>> = {
  events: {
    label: 'New event',
    href: '/admin/collections/events/create',
    description: 'Create an in-person or virtual event entry.',
  },
  webinars: {
    label: 'New webinar',
    href: '/admin/collections/webinars/create',
    description: 'Schedule a live session or upload a recording.',
  },
  podcastEpisodes: {
    label: 'New podcast episode',
    href: '/admin/collections/podcastEpisodes/create',
    description: 'Publish a new podcast episode.',
  },
  jobs: {
    label: 'New job posting',
    href: '/admin/collections/jobs/create',
    description: 'Open a new role in the Jobs collection.',
  },
  'career-applications': {
    label: 'Review applications',
    href: '/admin/collections/career-applications',
    description: 'See and triage submitted career applications.',
  },
  resumes: {
    label: 'Open resumes',
    href: '/admin/collections/resumes',
    description: 'Browse submitted applicant resumes.',
  },
  emailSignatures: {
    label: 'New email signature',
    href: '/admin/collections/emailSignatures/create',
    description: 'Add a signature for someone who has joined.',
  },
};

const scopedQuickLinks = (slugs: readonly string[]): QuickLinkProps[] =>
  slugs.map((slug) => DOMAIN_QUICK_LINKS[slug]).filter((l): l is QuickLinkProps => l != null);

const QuickLinks = ({
  links = QUICK_LINKS,
}: {
  links?: QuickLinkProps[];
}): ReactElement => (
  <div className="cs-dashboard__quick">
    {links.map((link) => (
      <a key={link.href} className="cs-dashboard__quick-card" href={link.href}>
        <span className="cs-dashboard__quick-label">{link.label}</span>
        <span className="cs-dashboard__quick-desc">{link.description}</span>
        <span aria-hidden="true" className="cs-dashboard__quick-arrow">
          <ChevronRight size={14} />
        </span>
      </a>
    ))}
  </div>
);

const greetingFor = (now: Date = new Date()): string => {
  const h = now.getHours();
  if (h < 5) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const userDisplayName = (
  user: { email?: string | null; name?: string | null } | null | undefined,
): string => {
  if (!user) return 'there';
  if (typeof user.name === 'string' && user.name.length > 0) return user.name;
  if (typeof user.email === 'string' && user.email.length > 0)
    return user.email.split('@')[0] ?? 'there';
  return 'there';
};

/**
 * Dashboard view replacement. Surfaces editorial state at-a-glance:
 * drafts pending, published in the last week, leads in the last 24h,
 * active redirects, plus the 10 most-recently-edited documents and a
 * quick-link grid for common create/manage routes.
 *
 * Server-rendered. All counts are computed via `payload.find(... limit:
 * 1)` and `result.totalDocs` so we never hydrate full documents just to
 * count them. Recent edits fetch 5 docs per content collection in
 * parallel and merge in JS — bounded fanout (~9 queries × 5 rows).
 *
 * NOTE on chrome: Payload's outer admin route already wraps every view
 * in the standard template (sidebar nav + app header). Wrapping again
 * in DefaultTemplate here would duplicate the sidebar — match Payload's
 * own DefaultDashboard and just render `<Gutter>` + content.
 */
export const Dashboard = async (
  props: AdminViewServerProps,
): Promise<ReactElement> => {
  const { initPageResult } = props;
  const {
    req: { payload, user },
  } = initPageResult;

  // Departmental (scoped-only) users get a dashboard restricted to their own
  // domain: no cross-domain counts, recent edits, leads/redirects, or create
  // links that their access would reject.
  const scopedSlugs = scopedCollectionSlugsForUser(user);
  const isScoped = scopedSlugs !== null;
  const contentSlugs = isScoped
    ? VERSIONED_CONTENT.filter((slug) => scopedSlugs.includes(slug))
    : VERSIONED_CONTENT;

  const [pulse, recent] = await Promise.all([
    fetchPulse(payload, contentSlugs, !isScoped),
    fetchRecentEdits(payload, contentSlugs),
  ]);

  const draftsHref =
    contentSlugs.length > 0
      ? `/admin/collections/${contentSlugs[0]}?where[_status][equals]=draft`
      : undefined;
  const draftsCaption = isScoped
    ? 'Across your collections'
    : 'Across all content collections';
  const recentMeta = isScoped
    ? 'Last 10 in your collections'
    : 'Last 10 across content collections';
  const quickLinks = isScoped ? scopedQuickLinks(scopedSlugs) : QUICK_LINKS;

  return (
    <div className="cs-dashboard">
      <header className="cs-dashboard__header">
        <h1 className="cs-dashboard__title">
          {greetingFor()},{' '}
          <span className="cs-dashboard__title-name">
            {userDisplayName(user)}
          </span>
        </h1>
        <p className="cs-dashboard__subtitle">
          Here's what's happening on {PROJECT_NAME} today.
        </p>
      </header>

      <section
        aria-label="Editorial pulse"
        className="cs-dashboard__pulse-grid"
      >
        <PulseCard
          label="Drafts pending"
          value={pulse.draftsPending}
          caption={draftsCaption}
          href={draftsHref}
          tone={pulse.draftsPending > 0 ? 'amber' : 'neutral'}
        />
        <PulseCard
          label="Published · 7d"
          value={pulse.publishedThisWeek}
          caption="Live changes in the last week"
          tone="cyan"
        />
        {pulse.leadsToday !== null ? (
          <PulseCard
            label="Leads · 24h"
            value={pulse.leadsToday}
            caption="Form submissions in the last day"
            href="/admin/collections/leads"
            tone={pulse.leadsToday > 0 ? 'cyan' : 'neutral'}
          />
        ) : null}
        {pulse.redirectsActive !== null ? (
          <PulseCard
            label="Redirects"
            value={pulse.redirectsActive}
            caption="Active URL redirects"
            href="/admin/collections/redirects"
          />
        ) : null}
      </section>

      {/* Analytics snapshot hidden — re-enable by uncommenting this and the
          AnalyticsCards import at the top of the file. */}
      {/* <AnalyticsCards payload={payload} /> */}

      <section aria-label="Recent edits" className="cs-dashboard__section">
        <div className="cs-dashboard__section-head">
          <h2 className="cs-dashboard__section-title">Recent edits</h2>
          <span className="cs-dashboard__section-meta">{recentMeta}</span>
        </div>
        <RecentEditsTable items={recent} />
      </section>

      {quickLinks.length > 0 ? (
        <section aria-label="Quick links" className="cs-dashboard__section">
          <div className="cs-dashboard__section-head">
            <h2 className="cs-dashboard__section-title">Quick actions</h2>
          </div>
          <QuickLinks links={quickLinks} />
        </section>
      ) : null}
    </div>
  );
};

export default Dashboard;
