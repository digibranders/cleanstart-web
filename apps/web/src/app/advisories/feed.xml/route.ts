import { getAdvisories } from "@/lib/advisory";
import { buildAdvisoryFeed } from "@/lib/advisory-feed";
import { SITE_URL } from "@/lib/seo/canonical";

// Dynamic, like /sitemap.xml: on Vercel `revalidatePath` does not purge a
// Route Handler, so the route re-reads the tagged CMS fetch on each request and
// the publish hook's `sitemap:advisories` purge is what makes a new advisory
// appear. The data cache still absorbs the load.
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const advisories = await getAdvisories().catch(() => null);
  if (!advisories) {
    return new Response("Feed temporarily unavailable.", { status: 503, headers: { "retry-after": "300" } });
  }
  return new Response(buildAdvisoryFeed(advisories, SITE_URL), {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
