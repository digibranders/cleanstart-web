#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: draft of the "2026 CISO Guide to Software Trust" report.
 *
 * Creates three things, each skipped if it already exists:
 *   1. a gate form cloned from `content-gated`, pointed at the HubSpot form
 *      `CISO-guide-software-trust` (e68b2102…), so this asset's leads land on
 *      their own form and campaign. It is published, because a draft form
 *      rejects submissions, and it keeps the CMS download email on: the
 *      HubSpot email for this asset is a follow-up, not the thank-you;
 *   2. the PDF and the hero image as media, in the web/resource folder;
 *   3. the resource itself, gated by that form, left as a DRAFT so an editor
 *      reviews and publishes it.
 *
 * SEO copy is the SEO team's (title, description, slug). The title is stored
 * without the " | CleanStart" suffix because the site appends it.
 *
 * The files are read from /tmp inside the container; copy them in first.
 *
 * In the prod container (env is in the process, there is no .env):
 *   /app/node_modules/.bin/tsx scripts/seed-ciso-guide-software-trust.ts --dry-run
 *   /app/node_modules/.bin/tsx scripts/seed-ciso-guide-software-trust.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

const SOURCE_FORM_SLUG = 'content-gated';
const FORM_SLUG = 'content-gated-ciso-guide-software-trust';
const FORM_NAME = 'Gated Resource Download: 2026 CISO Guide to Software Trust';
const HUBSPOT_FORM_GUID = 'e68b2102-2bdd-46a1-8267-463fcfa180aa';
const MARKETING_INFORMATION = '2258674941';

const RESOURCE_SLUG = 'ciso-guide-software-trust';
const RESOURCE_TITLE = '2026 CISO Guide to Software Trust';
const REPORT_TYPE_SLUG = 'report';

const PDF_PATH = '/tmp/ciso-guide-software-trust.pdf';
const HERO_PATH = '/tmp/ciso-guide-software-trust-hero.webp';

const SUMMARY =
  'Software trust is now a board-level governance priority for CISOs. This guide explores how verified container foundations, hermetic builds, cryptographic provenance, signed SBOM attestations, and SLSA Level 3-aligned practices can help organizations reduce inherited software risk, strengthen supply-chain security, and generate credible evidence for regulatory, customer, and board scrutiny.';

const SEO_TITLE = 'CISO Guide to Software Trust & Supply Chain Security';
const SEO_DESCRIPTION =
  'Explore how CISOs can build software trust with verified container foundations, software provenance, SBOMs, SLSA-aligned builds, and compliance-ready controls.';

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
        'Boards now expect evidence that code was trustworthy before deployment, not merely scanned and patched after release. Published with Cybersecurity Insiders, this guide shows CISOs how to turn that expectation into an operating model built on verified container foundations, codified compliance and measurable trust outcomes.',
      ),
      heading("What's inside"),
      bulletList([
        'Why inherited risk is now a governance issue, and why post-deployment patching cannot resolve risk that was inherited at the source.',
        'A trust maturity model for moving from reactive patching to preventive and provable trust.',
        'Six imperatives for operationalizing provable trust, from eliminating inherited risk at the source to generating compliance evidence at build time.',
        'How the model aligns with EO 14028, NIST 800-53 and 800-171, FedRAMP, FIPS 140-2/3, DoD STIGs and the EU Cyber Resilience Act.',
        'A 100-day blueprint from pilot to proof, and the board-level metrics that show software trust is working.',
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
            'Gate for the 2026 CISO Guide to Software Trust. Relays to its own HubSpot form and campaign. The CMS download email stays on: the HubSpot email for this asset is a later follow-up, not the thank-you.',
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

  // 3. The resource, left as a draft.
  const existingResource = await findOne('resources', { slug: { equals: RESOURCE_SLUG } }, true);
  if (existingResource) {
    log(`  skip     resource ${RESOURCE_SLUG} (id ${existingResource.id})`);
    return;
  }
  const type = await findOne('resourceTypes', { slug: { equals: REPORT_TYPE_SLUG } });
  if (DRY_RUN) {
    log(`  would create resource ${RESOURCE_SLUG} (draft, gated, type ${type ? type.id : 'MISSING'})`);
    return;
  }
  if (!form || !asset || !hero || !type) {
    throw new Error('Missing a prerequisite: form, asset, hero or resource type');
  }
  const resource = (await payload.create({
    collection: 'resources',
    draft: true,
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
      ctaButtonText: 'View Report',
      _status: 'draft',
      seo: {
        title: SEO_TITLE,
        description: SEO_DESCRIPTION,
        indexable: 'index',
        keywordTarget: 'ciso software trust',
      },
    } as Record<string, unknown>,
    overrideAccess: true,
  })) as Doc;
  log(`  created  resource ${RESOURCE_SLUG} (id ${resource.id}, draft)`);
};

run()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console -- script output
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
