import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';
import { Client } from 'pg';

/**
 * Unlink all broken links in Knowledge Hub article bodies.
 *
 * The full-site prod link audit flagged 75 dead link targets across 45 KB
 * articles (all in the `body` rich text): third-party pages that moved/died
 * (whitehouse, NTIA, sigstore, FedRAMP, OWASP, Ubuntu archive, …), CleanStart
 * GitHub org repos that 404, CleanStart infra subdomains that do not resolve
 * (docs/portal/registry/status.cleanstart.*), `clnstrt.dev` typos, placeholder
 * URLs (localhost, example.com, …), and the deprecated Bitnami chart repo.
 *
 * Per the content owner's decision every broken link is removed rather than
 * repointed: each matching Lexical `link` node is replaced by its inline
 * `children`, so the visible anchor text is preserved as plain text. This is a
 * structural JSON edit (not a string replace), run in Node over a direct `pg`
 * connection (mirrors scripts/preflight-migrate.cjs). It touches the current
 * rows (`knowledge_base.body`) and the version snapshots
 * (`_knowledge_base_v.version_body`). The seed source
 * (`scripts/data/academy-kb.json`) is unlinked in the same change.
 *
 * Idempotent: once a link node is unlinked its `fields.url` is gone, so a
 * re-run removes nothing. (A URL that also appears as visible text still matches
 * the row filter on re-run but yields zero removals, leaving the row untouched.)
 */
const BROKEN_URLS: readonly string[] = [
  'http://localhost:8000/health',
  'http://localhost:9090/',
  'http://www/',
  'https://api.cleanstart.dev/docs',
  'https://api.example.com/',
  'https://archive.ubuntu.com/ubuntu/pool/main/n/nginx/nginx_1.18.0-0ubuntu1.deb',
  'https://charts.bitnami.com/bitnami',
  'https://charts.cleanstart.dev/',
  'https://cleanstart.community/slack',
  'https://cleanstart.dev/',
  'https://cleanstart.dev/incidents/shai-hulud-incident',
  'https://cleanstart.dev/incidents/shai-hulud-technical',
  'https://cleanstart.dev/incidents/shai-hulud-timeline',
  'https://cleanstart.dev/keys/cosign.pub',
  'https://cleanstart.dev/releases',
  'https://cleanstart.dev/releases.rss',
  'https://cleanstart.dev/security/feed.xml',
  'https://cleanstart.dev/security/subscribe',
  'https://clnstrt.dev/security.gpg',
  'https://clnstrt.dev/subscribe',
  'https://cloud.google.com/docs/provenance',
  'https://cn.archive.ubuntu.com/ubuntu/pool/main/n/nginx/nginx_1.18.0-0ubuntu1.deb',
  'https://compliance.cleanstart.com/baa',
  'https://console.cleanstart.com/support',
  'https://cyclonedx.org/spec/v1.4/',
  'https://dashboard.cleanstart.com/',
  'https://docs.cleanstart.com/intelligence',
  'https://docs.cleanstart.dev/',
  'https://docs.cleanstart.dev/api',
  'https://docs.cleanstart.dev/cli',
  'https://docs.cleanstart.dev/helm',
  'https://docs.cleanstart.dev/images',
  'https://docs.cleanstart.dev/migrate/v1-to-v2',
  'https://docs.cleanstart.dev/migrate/v2.0-to-v2.1',
  'https://docs.cleanstart.dev/portal',
  'https://docs.cleanstart.dev/releases/archive',
  'https://docs.clnstrt.dev/releases/',
  'https://docs.sigstore.dev/cosign/installation/',
  'https://docs.sigstore.dev/cosign/overview/',
  'https://docs.sigstore.dev/cosign/working_with_artifacts/',
  'https://github.com/YOUR-USERNAME/YOUR-REPO/actions',
  'https://github.com/cleanstart/api/issues',
  'https://github.com/cleanstart/clnstrt-cli/issues',
  'https://github.com/cleanstart/container-images',
  'https://github.com/cleanstart/discussions',
  'https://github.com/cleanstart/feature-requests/issues/new',
  'https://github.com/cleanstart/helm-charts/issues',
  'https://github.com/cleanstart/images/issues',
  'https://github.com/cleanstart/images/issues/%5BNUMBER',
  'https://github.com/cleanstart/images/security/advisories',
  'https://github.com/cleanstart/intelligence-go',
  'https://github.com/cleanstart/intelligence-typescript',
  'https://github.com/cleanstart/issues',
  'https://github.com/cleanstart/releases',
  'https://help.cleanstart.dev/',
  'https://images.cleanstart.dev/',
  'https://mirror.example.com/ubuntu/pool/main/n/nginx/nginx_1.18.0-0ubuntu1.deb',
  'https://ntia.gov/page/minimum-elements-software-bill-materials-sbom',
  'https://ntia.gov/page/vex',
  'https://nvlpubs.nist.gov/nistpubs/Legacy/FIPS/nistfips140-2.pdf',
  'https://openquantumcomputing.org/',
  'https://owasp.org/www-project-machine-learning-security/',
  'https://portal.cleanstart.dev/',
  'https://portal.cleanstart.dev/downloads',
  'https://portal.cleanstart.dev/reports/share/abc123xyz789',
  'https://registry.cleanstart.com/v2/',
  'https://registry.cleanstart.io/',
  'https://slack.cleanstart.dev/',
  'https://status.cleanstart.com/',
  'https://status.clnstrt.dev/',
  'https://stigviewer.com/stig/docker_ce/',
  'https://token.actions.githubusercontent.com/',
  'https://www.fedramp.gov/continuous-monitoring-process/',
  'https://www.hhs.gov/hipaa/for-professionals/security/security-risk-assessment-tool',
  'https://www.whitehouse.gov/briefing-room/presidential-actions/2021/05/12/executive-order-on-improving-the-nations-cybersecurity/',
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

/**
 * Compare URLs ignoring trailing slashes: the audit normalised bare-host URLs
 * via `new URL()` (which appends `/`), but the CMS stores the author's original
 * href (e.g. `https://cleanstart.dev`), so an exact match would miss them.
 */
const stripTrailingSlash = (u: string): string => u.replace(/\/+$/, '');
const broken = new Set(BROKEN_URLS.map(stripTrailingSlash));

/**
 * Walk a children array; replace each broken `link` node with its own children
 * (promoting the inline text/format nodes into the parent), recursing into the
 * rest. Returns the rewritten array and increments `stats.removed`.
 */
function unlinkChildren(children: LexicalNode[], stats: { removed: number }): LexicalNode[] {
  const out: LexicalNode[] = [];
  for (const child of children) {
    const url = child?.fields?.url;
    const isBrokenLink =
      child?.type === 'link' && typeof url === 'string' && broken.has(stripTrailingSlash(url));
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
  ['knowledge_base', 'body'],
  ['_knowledge_base_v', 'version_body'],
];

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const connectionString = process.env.DATABASE_URI;
  if (!connectionString) {
    throw new Error('[unlink-broken-kb-links] DATABASE_URI not set');
  }

  const patterns = BROKEN_URLS.map((u) => `%${stripTrailingSlash(u)}%`);
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
      `[unlink-broken-kb-links] updated ${updatedRows} row(s), removed ${removedLinks} broken link node(s)`,
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
