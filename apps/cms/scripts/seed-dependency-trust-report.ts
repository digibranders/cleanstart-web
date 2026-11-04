#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: publish the "State of Software Dependency Trust 2026" report.
 *
 * Creates three things, each skipped if it already exists:
 *   1. a gate form cloned from `content-gated`, pointed at the HubSpot form
 *      `State-of-software-dependency-trust` (3ffeef72…), so this asset's leads
 *      land on their own form and campaign. It is published, because a draft
 *      form rejects submissions, and it keeps the CMS download email on: that
 *      email is the thank-you every downloader gets;
 *   2. the PDF and the hero image as media, in the web/resource folder;
 *   3. the resource itself, gated by that form, published.
 *
 * Publishing from a script skips the hook's deferred web purge (the process
 * exits first), so the script purges the detail page and the listing itself.
 *
 * The files are read from /tmp inside the container; copy them in first.
 *
 * In the prod container (env is in the process, there is no .env):
 *   /app/node_modules/.bin/tsx scripts/seed-dependency-trust-report.ts --dry-run
 *   /app/node_modules/.bin/tsx scripts/seed-dependency-trust-report.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';
import { revalidateWeb } from '../src/payload/lib/web-revalidate.ts';

const SOURCE_FORM_SLUG = 'content-gated';
const FORM_SLUG = 'content-gated-state-of-software-dependency-trust';
const FORM_NAME = 'Gated Resource Download: State of Software Dependency Trust 2026';
const HUBSPOT_FORM_GUID = '3ffeef72-6545-4b65-ab3f-cb4032df5fe7';
const MARKETING_INFORMATION = '2258674941';

const RESOURCE_SLUG = 'state-of-software-dependency-trust';
const RESOURCE_TITLE = 'State of Software Dependency Trust 2026';
const REPORT_TYPE_SLUG = 'report';

const PDF_PATH = '/tmp/state-of-software-dependency-trust.pdf';
const HERO_PATH = '/tmp/state-of-software-dependency-trust-hero.webp';

const SUMMARY =
  'Applications now carry an average of 1,180 open source components, and most of them were never chosen directly. This research report examines why dependency exposure persists, how attackers moved upstream, what changes when AI assistants pick packages, and why trust has to be established before a dependency is adopted.';

const SEO_TITLE = 'State of Software Dependency Trust 2026 Report';
const SEO_DESCRIPTION =
  'Research on open source dependency risk: transitive sprawl, aging components, upstream attacks, AI-selected packages and verified software foundations.';

const text = (value: string): Record<string, unknown> => ({
  mode: 'normal',
  text: value,
  type: 'text',
  style: '',
  detail: 0,
  format: 0,
  version: 1,
});

const paragraph = (value: string): Record<string, unknown> => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: [text(value)],
});

const heading = (value: string): Record<string, unknown> => ({
  type: 'heading',
  tag: 'h2',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: [text(value)],
});

const bulletList = (items: string[]): Record<string, unknown> => ({
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  start: 1,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: items.map((value, index) => ({
    type: 'listitem',
    value: index + 1,
    checked: false,
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [text(value)],
  })),
});

const BODY = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      paragraph(
        'Software dependency risk is no longer a narrow vulnerability-management issue. Drawing on audit, registry telemetry and survey research, this report shows why exposure persists even when fixes exist, where trust actually fails, and why organizations need verifiable evidence at the point a dependency is selected rather than after it is embedded.',
      ),
      heading("What's inside"),
      bulletList([
        'The estate nobody chose: 64% of components arrive transitively, and 17% sit outside conventional package managers.',
        'Why the problem is older than it looks: 68% of components are more than two years old, while about 95% of vulnerable downloads already had a fixed version available.',
        'How dependency risk varies by industry and geography, and why ranking sectors by risk hides the different pressures each one faces.',
        'How attackers moved upstream to packages, CI systems and registries, and how much widely used software depends on very few maintainers.',
        'What changes when an AI assistant chooses your dependencies, and why trust evidence must be readable by machines as well as people.',
        'Where the current control stack breaks, and a practical path from dependency management to verified software foundations.',
      ]),
    ],
  },
};

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

interface Doc {
  id: number | string;
  _status?: string;
}

const stripIds = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripIds);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== 'id')
        .map(([key, inner]) => [key, stripIds(inner)]),
    );
  }
  return value;
};

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE'}\n`);

  const findOne = async (
    collection: string,
    where: Record<string, unknown>,
    draft = false,
  ): Promise<Doc | undefined> => {
    const found = await payload.find({ collection, where, limit: 1, depth: 0, draft, overrideAccess: true });
    return found.docs[0] as Doc | undefined;
  };

  // 1. Gate form, cloned from the existing gated-download form, published.
  let form = await findOne('forms', { slug: { equals: FORM_SLUG } }, true);
  if (form) {
    log(`  skip     form ${FORM_SLUG} (id ${form.id}, ${form._status})`);
  } else {
    const source = (await findOne('forms', { slug: { equals: SOURCE_FORM_SLUG } })) as
      | (Doc & Record<string, unknown>)
      | undefined;
    if (!source) throw new Error(`Source form ${SOURCE_FORM_SLUG} not found`);
    if (DRY_RUN) {
      log(`  would create + publish form ${FORM_SLUG} (cloned from ${SOURCE_FORM_SLUG})`);
    } else {
      form = (await payload.create({
        collection: 'forms',
        data: {
          name: FORM_NAME,
          slug: FORM_SLUG,
          description:
            'Gate for the State of Software Dependency Trust 2026 report. Relays to its own HubSpot form and campaign. The CMS download email stays on: it is the thank-you every downloader gets.',
          fields: stripIds(source.fields),
          submitLabel: source.submitLabel,
          postSubmit: stripIds(source.postSubmit),
          crmHandlers: source.crmHandlers,
          hubspotFormGuid: HUBSPOT_FORM_GUID,
          hubspotSubscriptionTypeId: MARKETING_INFORMATION,
          sendDownloadEmail: true,
          _status: 'published',
        } as Record<string, unknown>,
        overrideAccess: true,
      })) as Doc;
      log(`  created  form ${FORM_SLUG} (id ${form.id}, published)`);
    }
  }

  // 2. Media: the report itself and its cover.
  const upload = async (filePath: string, alt: string): Promise<Doc | undefined> => {
    const existing = await findOne('media', { alt: { equals: alt } });
    if (existing) {
      log(`  skip     media "${alt}" (id ${existing.id})`);
      return existing;
    }
    if (DRY_RUN) {
      log(`  would upload ${filePath} as "${alt}"`);
      return undefined;
    }
    const doc = (await payload.create({
      collection: 'media',
      data: { alt, folder: 'web/resource' } as Record<string, unknown>,
      filePath,
      overrideAccess: true,
    })) as Doc;
    log(`  uploaded media "${alt}" (id ${doc.id})`);
    return doc;
  };

  const asset = await upload(PDF_PATH, `${RESOURCE_TITLE} (report PDF)`);
  const hero = await upload(HERO_PATH, RESOURCE_TITLE);

  // 3. The resource, published.
  const existingResource = await findOne('resources', { slug: { equals: RESOURCE_SLUG } }, true);
  if (existingResource) {
    log(`  skip     resource ${RESOURCE_SLUG} (id ${existingResource.id}, ${existingResource._status})`);
    return;
  }
  const type = await findOne('resourceTypes', { slug: { equals: REPORT_TYPE_SLUG } });
  if (DRY_RUN) {
    log(`  would create + publish resource ${RESOURCE_SLUG} (gated, type ${type ? type.id : 'MISSING'})`);
    return;
  }
  if (!form || !asset || !hero || !type) {
    throw new Error('Missing a prerequisite: form, asset, hero or resource type');
  }
  const resource = (await payload.create({
    collection: 'resources',
    data: {
      title: RESOURCE_TITLE,
      slug: RESOURCE_SLUG,
      type: 'report',
      typeRef: type.id,
      summary: SUMMARY,
      body: BODY,
      asset: asset.id,
      heroImage: hero.id,
      gated: true,
      gateForm: form.id,
      accessLevel: 'lead-gated',
      ctaButtonText: 'Unlock the Report',
      _status: 'published',
      seo: {
        title: SEO_TITLE,
        description: SEO_DESCRIPTION,
        indexable: 'index',
        keywordTarget: 'software dependency trust',
      },
    } as Record<string, unknown>,
    overrideAccess: true,
  })) as Doc;
  log(`  created  resource ${RESOURCE_SLUG} (id ${resource.id}, ${resource._status})`);

  const purge = await revalidateWeb(payload, {
    paths: [`/resources/${RESOURCE_SLUG}`, '/resource-center'],
  });
  log(`  purge    ${purge.ok ? 'ok' : `failed (${purge.error ?? purge.status ?? 'disabled'})`}`);
};

run()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console -- script output
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
