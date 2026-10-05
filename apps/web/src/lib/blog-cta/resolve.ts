import "server-only";

import { fetchCMS } from "@/lib/cms-fetch";
import type { BlogDetail } from "@/lib/blog";
import { lexicalToPlainText } from "@/lib/renderLexical";
import { mediaUrl } from "@/lib/resources";
import type { ResourceType, ResourceTypeTerm } from "@/lib/resources";
import {
  resolveResourceTypeLabel,
  resolveResourceTypeSlug,
  resourceCoverPoster,
  resourceCtaLabel,
} from "@/lib/resources-utils";
import { prepareLogoSvg } from "./logo";
import {
  type ArticleText,
  baseImageNames,
  firstSentence,
  matchCatalogImage,
  pickEditorImage,
  pickEditorResource,
  pickRelatedResource,
} from "./relevance";
import type { BlogCtaSet, CatalogLogo, ExploreCta, ResourceCta } from "./types";

const CATALOG_ORIGIN = "https://images.cleanstart.com";
const CATALOG_LOGO_ORIGIN = "https://storage.googleapis.com/cdpimages";
/** CleanStart's public Docker Hub namespace. The portal's own registry needs an organization login. */
const DOCKER_HUB_REPOS = "https://hub.docker.com/v2/repositories/cleanstart/?page_size=100";
const DAY = 60 * 60 * 24;
/** Shown on the catalog card when the article names no specific image. */
const FEATURED_IMAGES = ["python", "nginx", "redis", "postgres"] as const;

const pullCommand = (name: string): string => `docker pull cleanstart/${name}:latest`;
/** A rewritten logo is inlined only up to this size, to keep the page payload small. */
const INLINE_LOGO_MAX = 100_000;
const NO_LOGO: CatalogLogo = { src: null, tone: "light" };

const logoUrl = (name: string): string => `${CATALOG_LOGO_ORIGIN}/${name}/${name}.svg`;
const imageHref = (name: string): string => `${CATALOG_ORIGIN}/images/${name}/details`;

/** Every image slug in the public catalog, read from its sitemap. Empty on failure. */
async function getCatalogImageNames(): Promise<string[]> {
  try {
    const res = await fetch(`${CATALOG_ORIGIN}/sitemap.xml`, { next: { revalidate: DAY } });
    if (!res.ok) return [];
    const xml = await res.text();
    return [...xml.matchAll(/\/images\/([a-z0-9][a-z0-9.-]*)\/details</g)].map((m) => m[1] as string);
  } catch {
    return [];
  }
}

/**
 * The logo for one catalog image, from the portal's own storage bucket. It is
 * read and normalised rather than linked blindly: a logo that switches to
 * white under a dark system theme would vanish on the card's white tile.
 */
async function getCatalogLogo(name: string): Promise<CatalogLogo> {
  const url = logoUrl(name);
  try {
    const res = await fetch(url, { next: { revalidate: DAY } });
    if (!res.ok) return NO_LOGO;
    const prepared = prepareLogoSvg(await res.text());
    if (!prepared) return NO_LOGO;
    if (!prepared.changed || prepared.svg.length > INLINE_LOGO_MAX) return { src: url, tone: prepared.tone };
    return { src: `data:image/svg+xml;base64,${Buffer.from(prepared.svg).toString("base64")}`, tone: prepared.tone };
  } catch {
    return NO_LOGO;
  }
}

/** Images anyone can pull from Docker Hub without a CleanStart login. Empty on failure. */
async function getPublicPullNames(): Promise<Set<string>> {
  try {
    const res = await fetch(DOCKER_HUB_REPOS, { next: { revalidate: DAY } });
    if (!res.ok) return new Set();
    const body = (await res.json()) as { results?: Array<{ name?: unknown }> };
    return new Set(
      (body.results ?? []).map((r) => r.name).filter((n): n is string => typeof n === "string"),
    );
  } catch {
    return new Set();
  }
}

/** The catalog page's own meta description, cut to its first whole sentence. */
async function getCatalogImageDescription(name: string): Promise<string | null> {
  try {
    const res = await fetch(imageHref(name), { next: { revalidate: DAY } });
    if (!res.ok) return null;
    const html = await res.text();
    const content = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
    return content ? firstSentence(decodeEntities(content)) : null;
  } catch {
    return null;
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

type ResourceRow = {
  id: string | number;
  slug: string;
  title: string;
  summary?: string | null;
  gated?: boolean;
  publishedAt?: string | null;
  type?: ResourceType | null;
  typeRef?: ResourceTypeTerm | string | number | null;
  ctaButtonText?: string | null;
  heroImage?: { url?: string; alt?: string } | null;
};

/** Card fields for every published resource. `asset` stays out so gated file URLs never reach the client. */
async function getResourceRows(): Promise<ResourceRow[]> {
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    "where[publishedAt][exists]": "true",
    depth: "1",
    limit: "200",
    sort: "-publishedAt",
  });
  for (const field of ["title", "slug", "summary", "gated", "publishedAt", "type", "typeRef", "ctaButtonText", "heroImage"]) {
    params.set(`select[${field}]`, "true");
  }
  params.set("populate[resourceTypes][name]", "true");
  params.set("populate[resourceTypes][slug]", "true");
  params.set("populate[media][url]", "true");
  params.set("populate[media][alt]", "true");
  try {
    const res = await fetchCMS<{ docs: ResourceRow[] }>(`/api/resources?${params.toString()}`, {
      revalidateSeconds: 60 * 60,
      tags: ["resources"],
    });
    return res.docs.filter((d) => d.slug && d.title);
  } catch {
    return [];
  }
}

function toArticleText(post: BlogDetail): ArticleText {
  return {
    title: post.title,
    abstract: post.abstract ?? "",
    category: post.categories?.name ?? "",
    headings: (post.tableOfContents ?? []).map((e) => e?.text ?? "").filter(Boolean),
    body: lexicalToPlainText(post.body),
  };
}

function toResourceCta(row: ResourceRow): ResourceCta {
  const typeSlug = resolveResourceTypeSlug(row);
  const cover = mediaUrl(row.heroImage?.url);
  return {
    slug: row.slug,
    title: row.title,
    typeLabel: resolveResourceTypeLabel(row),
    summary: row.summary?.trim() || null,
    href: `/resources/${row.slug}`,
    ctaLabel: resourceCtaLabel(typeSlug, row.ctaButtonText),
    coverUrl: cover ?? resourceCoverPoster(typeSlug),
    coverAlt: row.heroImage?.alt?.trim() || `${row.title} cover`,
    coverIsPoster: !cover,
    gated: Boolean(row.gated),
  };
}

/**
 * The three CTAs for one article: the catalog image it is most about, the
 * resource most related to it, and the POC. Each lookup degrades on its own,
 * so a catalog or CMS outage never breaks the article.
 */
export async function getBlogCtas(post: BlogDetail): Promise<BlogCtaSet> {
  const article = toArticleText(post);
  const [catalogNames, resources, publicPulls] = await Promise.all([
    getCatalogImageNames(),
    getResourceRows(),
    getPublicPullNames(),
  ]);

  // An editor's pick wins; otherwise match from the article.
  const imageName = pickEditorImage(post.ctaImage, catalogNames) ?? matchCatalogImage(article, catalogNames);
  let explore: ExploreCta;
  if (imageName) {
    const [description, logo] = await Promise.all([
      getCatalogImageDescription(imageName),
      getCatalogLogo(imageName),
    ]);
    explore = {
      kind: "image",
      name: imageName,
      description,
      logo,
      href: imageHref(imageName),
      hasFips: catalogNames.includes(`${imageName}-fips`),
      pullCommand: publicPulls.has(imageName) ? pullCommand(imageName) : null,
    };
  } else {
    const bases = baseImageNames(catalogNames);
    const featuredNames = FEATURED_IMAGES.filter((n) => bases.length === 0 || bases.includes(n));
    const featuredLogos = await Promise.all(featuredNames.map((name) => getCatalogLogo(name)));
    explore = {
      kind: "catalog",
      imageCount: bases.length > 0 ? bases.length : null,
      // A stack of logos, so an image with no logo file is left out rather than drawn as a blank.
      featured: featuredNames.flatMap((name, i) => {
        const logo = featuredLogos[i];
        return logo?.src ? [{ name, logo }] : [];
      }),
      href: CATALOG_ORIGIN,
      pullCommand: publicPulls.has("python") ? pullCommand("python") : null,
    };
  }

  const related =
    pickEditorResource(post.ctaResource, resources) ??
    pickRelatedResource(
      article,
      resources.map((r) => ({
        ...r,
        summary: r.summary ?? "",
        gated: Boolean(r.gated),
        publishedAt: r.publishedAt ?? null,
      })),
    );

  return {
    slug: post.slug,
    explore,
    learn: related ? toResourceCta(related) : null,
    prove: { href: "/book-a-demo", label: "Book a free POC" },
  };
}
