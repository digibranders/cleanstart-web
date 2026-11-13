import { z } from 'zod';
import { env } from '@/env';
import { IntegrationError } from '@/server/errors';

/** The public website. A datasheet row links to its resource page here. */
export const PUBLIC_SITE_URL = 'https://www.cleanstart.com';
/** Next data cache window for the CMS read (master plan 3.3: 10 minutes). */
export const PUBLIC_RESOURCES_REVALIDATE_SECONDS = 600;
const PAGE_LIMIT = 100;
const REQUEST_TIMEOUT_MS = 5000;

export interface PublicDatasheetDto {
  id: string;
  title: string;
  summary: string | null;
  /** The public page on cleanstart.com. The file itself is never linked from the portal. */
  url: string;
  updatedAt: string | null;
}

const rowSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  updatedAt: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  gated: z.boolean().nullish(),
});

const pageSchema = z.object({ docs: z.array(z.unknown()) });

/**
 * The query the website uses for a published list, with the datasheet type filter (taxonomy term or legacy enum) and a
 * field whitelist. `asset` and `body` are deliberately absent: `asset` is the direct file link of a gated download.
 */
function datasheetParams(): URLSearchParams {
  const params = new URLSearchParams({
    'where[_status][equals]': 'published',
    'where[publishedAt][exists]': 'true',
    'where[or][0][typeRef.slug][equals]': 'datasheet',
    'where[or][1][type][equals]': 'datasheet',
    depth: '0',
    limit: String(PAGE_LIMIT),
    sort: '-publishedAt',
  });
  for (const field of ['title', 'slug', 'summary', 'publishedAt', 'updatedAt', 'gated']) {
    params.set(`select[${field}]`, 'true');
  }
  return params;
}

export interface ListPublicDatasheetsOptions {
  /** Defaults to CMS_API_URL. Tests pass a stub server. */
  baseUrl?: string;
  /** Defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

/**
 * Published, public (not gated) datasheets, newest first, at most 100. Throws IntegrationError('cms') on a network error,
 * a non 2xx answer or a body that is not the expected shape; rows that fail validation are skipped.
 */
export async function listPublicDatasheets(options: ListPublicDatasheetsOptions = {}): Promise<PublicDatasheetDto[]> {
  const baseUrl = (options.baseUrl ?? env.CMS_API_URL).replace(/\/+$/, '');
  const fetchImpl = options.fetchImpl ?? fetch;
  const init: RequestInit & { next: { revalidate: number } } = {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    next: { revalidate: PUBLIC_RESOURCES_REVALIDATE_SECONDS },
  };

  let response: Response;
  try {
    response = await fetchImpl(`${baseUrl}/api/resources?${datasheetParams().toString()}`, init);
  } catch (cause) {
    throw new IntegrationError('cms', 'resources request failed', { cause });
  }
  if (!response.ok) {
    throw new IntegrationError('cms', `resources request answered ${response.status}`, { status: response.status });
  }

  let page: z.infer<typeof pageSchema>;
  try {
    page = pageSchema.parse(await response.json());
  } catch (cause) {
    throw new IntegrationError('cms', 'resources answer is not the expected JSON', { cause });
  }

  return page.docs.flatMap((raw) => {
    const row = rowSchema.safeParse(raw);
    if (!row.success || row.data.gated === true) return [];
    return [
      {
        id: row.data.id,
        title: row.data.title,
        summary: row.data.summary,
        url: `${PUBLIC_SITE_URL}/resources/${encodeURIComponent(row.data.slug)}`,
        updatedAt: row.data.updatedAt,
      },
    ];
  });
}
