#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: publish-ready draft of "The Kubernetes Policy Trust Gap".
 *
 * Creates three things, each skipped if it already exists:
 *   1. a gate form cloned from `content-gated`, pointed at the HubSpot form
 *      `Kubernetes-policy` (63eeb2de…) that carries the campaign follow-up
 *      email, so this asset's leads land on their own form and campaign;
 *   2. the PDF and the hero image as media, in the web/resource folder;
 *   3. the resource itself, gated by that form, left as a DRAFT so an editor
 *      publishes it deliberately.
 *
 * The files are read from /tmp inside the container; copy them in first.
 *
 * In the prod container (env is in the process, there is no .env):
 *   /app/node_modules/.bin/tsx scripts/seed-kubernetes-policy-whitepaper.ts --dry-run
 *   /app/node_modules/.bin/tsx scripts/seed-kubernetes-policy-whitepaper.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

const SOURCE_FORM_SLUG = 'content-gated';
const FORM_SLUG = 'content-gated-kubernetes-policy';
const FORM_NAME = 'Gated Resource Download: Kubernetes Policy Trust Gap';
const HUBSPOT_FORM_GUID = '63eeb2de-bb0a-44f4-9ccf-27a5b421b651';
const MARKETING_INFORMATION = '2258674941';

const RESOURCE_SLUG = 'the-kubernetes-policy-trust-gap';
const RESOURCE_TITLE = 'The Kubernetes Policy Trust Gap';
const WHITEPAPER_TYPE_SLUG = 'whitepaper';

const PDF_PATH = '/tmp/kubernetes-policy-trust-gap.pdf';
const HERO_PATH = '/tmp/kubernetes-policy-trust-gap-hero.webp';

const SUMMARY =
  'Kubernetes policies govern how workloads run. They cannot tell you whether the image running is the image you built. This whitepaper maps the four trust gaps that sit outside the policy surface: image integrity, build provenance, package reachability and runtime behaviour. It then sets out the layered model that closes them, from signed build-native SBOMs through admission enforcement to runtime correlation, with a five-phase rollout and the metrics that show the gap is closed.';

const SEO_TITLE = 'The Kubernetes Policy Trust Gap: What Policies Cannot Verify';
const SEO_DESCRIPTION =
  'Kubernetes policy cannot verify that the image running is the image you built. See the four trust gaps and the layered model that closes them.';

const paragraph = (text: string): Record<string, unknown> => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: [{ mode: 'normal', text, type: 'text', style: '', detail: 0, format: 0, version: 1 }],
});

const heading = (text: string): Record<string, unknown> => ({
  type: 'heading',
  tag: 'h2',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: [{ mode: 'normal', text, type: 'text', style: '', detail: 0, format: 0, version: 1 }],
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
  children: items.map((text, index) => ({
    type: 'listitem',
    value: index + 1,
    checked: false,
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [{ mode: 'normal', text, type: 'text', style: '', detail: 0, format: 0, version: 1 }],
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
        'Pod Security Admission, NetworkPolicy, RBAC, OPA Gatekeeper and Kyverno all operate at the configuration layer. They check declared properties, restrict API access and enforce resource boundaries. None of them inspects the contents of an image, and none can verify that the image running matches the image that was built.',
      ),
      paragraph(
        'That distinction is the policy trust gap. This whitepaper is written for platform engineering and security teams who have already hardened their clusters with policy and want to know what remains unverified.',
      ),
      heading("What's inside"),
      bulletList([
        'The four trust gaps that sit outside the Kubernetes policy surface: image integrity, build provenance, package reachability and runtime behaviour.',
        'What Pod Security Admission, OPA Gatekeeper, Kyverno and Sigstore Policy Controller can and cannot verify, side by side.',
        'The layered trust model, and why the order of the layers decides whether enforcement means anything.',
        'A five-phase rollout from policy-only to layered trust, ordered by impact against effort.',
        'The five metrics that show the gap is closed, including SBOM coverage, runtime drift delta and policy bypass rate.',
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
}

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE'}\n`);

  const findOne = async (collection: string, where: Record<string, unknown>): Promise<Doc | undefined> => {
    const found = await payload.find({ collection, where, limit: 1, depth: 0, overrideAccess: true });
    return found.docs[0] as Doc | undefined;
  };

  // 1. Gate form, cloned from the existing gated-download form.
  let form = await findOne('forms', { slug: { equals: FORM_SLUG } });
  if (form) {
    log(`  skip     form ${FORM_SLUG} (id ${form.id})`);
  } else {
    const source = (await findOne('forms', { slug: { equals: SOURCE_FORM_SLUG } })) as
      | (Doc & Record<string, unknown>)
      | undefined;
    if (!source) throw new Error(`Source form ${SOURCE_FORM_SLUG} not found`);

    // Array rows carry the source form's own row ids, and Payload rejects
    // those on create. Strip every id, at any depth (fields, select options,
    // condition rules).
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
    const data = {
      name: FORM_NAME,
      slug: FORM_SLUG,
      description:
        'Gate for The Kubernetes Policy Trust Gap. Relays to the HubSpot form that carries the campaign follow-up email, which is why the CMS download email stays off for this form.',
      fields: stripIds(source.fields),
      submitLabel: source.submitLabel,
      postSubmit: stripIds(source.postSubmit),
      crmHandlers: source.crmHandlers,
      hubspotFormGuid: HUBSPOT_FORM_GUID,
      hubspotSubscriptionTypeId: MARKETING_INFORMATION,
    };
    if (DRY_RUN) {
      log(`  would create form ${FORM_SLUG} (cloned from ${SOURCE_FORM_SLUG})`);
    } else {
      form = (await payload.create({
        collection: 'forms',
        data: data as Record<string, unknown>,
        overrideAccess: true,
      })) as Doc;
      log(`  created  form ${FORM_SLUG} (id ${form.id})`);
    }
  }

  // 2. Media: the whitepaper itself and its cover.
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

  const asset = await upload(PDF_PATH, `${RESOURCE_TITLE} (whitepaper PDF)`);
  const hero = await upload(HERO_PATH, RESOURCE_TITLE);

  // 3. The resource, left as a draft.
  const existingResource = await findOne('resources', { slug: { equals: RESOURCE_SLUG } });
  if (existingResource) {
    log(`  skip     resource ${RESOURCE_SLUG} (id ${existingResource.id})`);
    return;
  }
  const type = await findOne('resourceTypes', { slug: { equals: WHITEPAPER_TYPE_SLUG } });
  if (DRY_RUN) {
    log(`  would create resource ${RESOURCE_SLUG} (draft, gated)`);
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
      type: 'whitepaper',
      typeRef: type.id,
      summary: SUMMARY,
      body: BODY,
      asset: asset.id,
      heroImage: hero.id,
      gated: true,
      gateForm: form.id,
      accessLevel: 'lead-gated',
      ctaButtonText: 'View Whitepaper',
      _status: 'draft',
      seo: {
        title: SEO_TITLE,
        description: SEO_DESCRIPTION,
        indexable: 'index',
        keywordTarget: 'kubernetes image trust',
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
