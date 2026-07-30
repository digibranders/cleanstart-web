import Link from "next/link";

export interface CrawlableLinkIndexItem {
  href: string;
  title: string;
}

interface CrawlableLinkIndexProps {
  items: CrawlableLinkIndexItem[];
  /** `aria-label` for the index's `<nav>` landmark, e.g. "All blog posts". */
  label: string;
}

/**
 * Server-rendered index of every detail-page link for a listing collection,
 * visually hidden with the `sr-only` clip technique (screen-reader- and
 * crawler-visible, unlike `display:none` or `visibility:hidden`, which drop
 * content from the accessibility tree and can read as a signal to discount
 * the links).
 *
 * These listings paginate and filter client-side (`useSearchParams`) so only
 * the current page's cards become real `<a href>` anchors in the served
 * HTML — everything else exists solely in the RSC hydration payload until
 * client JS runs. The pages stay sitemap-discoverable either way, but that
 * starves the internal link graph and anchor-text signals sitemaps don't
 * carry. Render this once per listing, outside the pagination boundary, with
 * only the items page 1 doesn't already render as visible cards — plain text
 * anchors, no images or card markup, so there's no duplicate-href bloat and
 * the bundle-weight cost stays minimal even at 50-100 extra items.
 */
export function CrawlableLinkIndex({
  items,
  label,
}: CrawlableLinkIndexProps): React.ReactElement | null {
  if (items.length === 0) return null;

  const deduped = Array.from(
    new Map(items.map((item) => [item.href, item])).values(),
  );

  return (
    <nav className="sr-only" aria-label={label}>
      <ul>
        {deduped.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>{item.title}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
