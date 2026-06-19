import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';
import { Client } from 'pg';

/**
 * Unlink broken external/internal links in Blog and Guide article bodies.
 *
 * The full-site prod crawl flagged 12 dead link targets across 4 blogs and 6
 * guides (all in the main `body` rich text, none in `articleSections`):
 *   - Blogs: hallucinated `https://chatgpt//generic-entity?number=N` URLs,
 *     a 404 socket.dev article, two markdown-broken links whose href captured
 *     a trailing `)` (`aikido.dev/)`, `bleepingcomputer.com/)`), and a dead
 *     Dark Reading article (403/removed).
 *   - Guides: internal `/container/*` links to a hub that returns 404.
 *
 * Per the content owner's decision these links are removed rather than
 * repointed — the visible anchor text is kept and converted to plain text by
 * replacing each matching Lexical `link` node with its inline `children`.
 *
 * This is a structural JSON edit (not a string replace), so it runs in Node
 * over a direct `pg` connection (mirrors scripts/preflight-migrate.cjs). It
 * touches the current rows (`blogs.body`, `guides.body`) and the version
 * snapshots (`_blogs_v.version_body`, `_guides_v.version_body`).
 *
 * Idempotent: once a link node is unlinked its `fields.url` is gone, so a
 * re-run finds nothing to remove. (A URL that also appears as visible text —
 * e.g. `aikido.dev/)` — still matches the row filter on re-run, but the
 * transform removes zero nodes and the row is left untouched.)
 */
const BROKEN_URLS: readonly string[] = [
  'https://chatgpt//generic-entity?number=3',
  'https://chatgpt//generic-entity?number=4',
  'https://chatgpt//generic-entity?number=5',
  'https://socket.dev/blog/trapdoor-malware-campaign-targets-npm-pypi-and-crates-ecosystems?utm_source=chatgpt.com',
  'https://www.aikido.dev/)',
  'https://www.bleepingcomputer.com/)',
  'https://www.darkreading.com/cyber-risk/the-cost-of-fixing-an-application-vulnerability',
  'https://www.cleanstart.com/container/',
  'https://www.cleanstart.com/container/image/',
  'https://www.cleanstart.com/container/image/buildsi-cd-pipeline/',
  'https://www.cleanstart.com/container/image/dockerimage/',
  'https://www.cleanstart.com/container/sbom/',
];

interface LexicalNode {
  type?: string;
  fields?: { url?: string } | null;
  children?: LexicalNode[];
  text?: string;
  [key: string]: unknown;
}
interface LexicalBody {
  root?: { children?: LexicalNode[] };
}

const broken = new Set(BROKEN_URLS);

/**
 * Walk a children array; replace each broken `link` node with its own children
 * (promoting the inline text/format nodes into the parent), recursing into the
 * rest. Returns the rewritten array and increments `stats.removed`.
 */
function unlinkChildren(children: LexicalNode[], stats: { removed: number }): LexicalNode[] {
  const out: LexicalNode[] = [];
  for (const child of children) {
    const url = child?.fields?.url;
    const isBrokenLink = child?.type === 'link' && typeof url === 'string' && broken.has(url);
    if (isBrokenLink) {
      stats.removed += 1;
      const kids = Array.isArray(child.children) ? child.children : [];
      for (const promoted of unlinkChildren(kids, stats)) out.push(promoted);
    } else {
      if (Array.isArray(child?.children)) {
        child.children = unlinkChildren(child.children, stats);
      }
      out.push(child);
    }
  }
  return out;
}

/** Returns the number of link nodes removed from the body (0 if unchanged). */
function unlinkBody(body: LexicalBody | null | undefined): number {
  const stats = { removed: 0 };
  if (body?.root && Array.isArray(body.root.children)) {
    body.root.children = unlinkChildren(body.root.children, stats);
  }
  return stats.removed;
}

const TARGETS: ReadonlyArray<readonly [table: string, column: string]> = [
  ['blogs', 'body'],
  ['_blogs_v', 'version_body'],
  ['guides', 'body'],
  ['_guides_v', 'version_body'],
];

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const connectionString = process.env.DATABASE_URI;
  if (!connectionString) {
    throw new Error('[unlink-broken-links] DATABASE_URI not set');
  }

  const patterns = BROKEN_URLS.map((u) => `%${u}%`);
  const client = new Client({ connectionString });
  await client.connect();
  try {
    let updatedRows = 0;
    let removedLinks = 0;
    for (const [table, column] of TARGETS) {
      const { rows } = await client.query<{ id: number; body: LexicalBody | null }>(
        `SELECT "id", "${column}" AS body FROM "${table}" WHERE "${column}"::text LIKE ANY($1::text[])`,
        [patterns],
      );
      for (const row of rows) {
        const removed = unlinkBody(row.body);
        if (removed > 0) {
          await client.query(`UPDATE "${table}" SET "${column}" = $1::jsonb WHERE "id" = $2`, [
            JSON.stringify(row.body),
            row.id,
          ]);
          updatedRows += 1;
          removedLinks += removed;
        }
      }
    }
    payload.logger.info(
      `[unlink-broken-links] updated ${updatedRows} row(s), removed ${removedLinks} broken link node(s)`,
    );
  } finally {
    await client.end();
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // No-op: the broken links were removed (anchor text preserved as plain text).
  // The original hyperlinks were dead 404s/placeholders with nothing to restore,
  // and the discarded `link` wrapper cannot be reconstructed. Not reversible.
}
