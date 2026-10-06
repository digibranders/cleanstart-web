#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: give the "CleanStart Security" house byline a logo and a profile.
 *
 * The record was a bare name plus a one-line bio, so /author/cleanstart-security
 * rendered a gradient placeholder with no role, topics or links. This uploads the
 * square CleanStart mark to web/author and fills role, topic areas, social links
 * and a longer bio. Every claim is limited to what the team publishes (topics come
 * from its posts, links from the Organization sameAs list). Skips the upload when
 * the media already exists, then purges the web cache directly because the
 * publish hook's deferred purge dies with this process.
 *
 * Copy the PNG to /tmp inside the container first.
 *
 * In the prod container (env is in the process, there is no .env):
 *   /app/node_modules/.bin/tsx scripts/set-house-author-profile.ts --dry-run
 *   /app/node_modules/.bin/tsx scripts/set-house-author-profile.ts
 */
import { getPayload } from 'payload';

import { revalidateWeb } from '../src/payload/lib/web-revalidate.ts';
import payloadConfig from '../src/payload.config.ts';

const AUTHOR_SLUG = 'cleanstart-security';
const LOGO_PATH = '/tmp/cleanstart-security-author.png';
const LOGO_ALT = 'CleanStart logo mark, a white and cyan cube on a dark blue gradient';

const ROLE = 'Software supply chain security team';
const TOPICS = [
  'Software supply chain security',
  'Hardened container images',
  'Vulnerability management and CVEs',
  'AI and ML supply chain security',
  'Regulatory compliance and the EU Cyber Resilience Act',
];
const SOCIAL = {
  linkedin: 'https://www.linkedin.com/company/cleanstart-official',
  twitter: 'https://x.com/CleanStartX',
  github: 'https://github.com/cleanstart-dev',
  website: 'https://www.cleanstart.com',
};
const BIO_PARAGRAPHS = [
  'The CleanStart team brings you the latest news, insights, and quick takes from the world of cybersecurity and software supply chain security.',
  'Articles under this byline are written by CleanStart staff. They cover hardened container images and base images, vulnerability management, CVE scanning and SBOMs, supply chain incidents involving npm, GitHub and AI model hubs, and the compliance rules that apply to software vendors.',
  'CleanStart builds hardened, verified container images. Where a post compares CleanStart with another product, it says so.',
];

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

interface Doc {
  id: number | string;
  photo?: number | string | { id: number | string } | null;
}

const paragraph = (text: string): Record<string, unknown> => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: null,
  textStyle: '',
  textFormat: 0,
  children: [{ type: 'text', text, mode: 'normal', style: '', detail: 0, format: 0, version: 1 }],
});

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE'}\n`);

  const found = await payload.find({
    collection: 'authors',
    where: { slug: { equals: AUTHOR_SLUG } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const author = found.docs[0] as Doc | undefined;
  if (!author) throw new Error(`Author ${AUTHOR_SLUG} not found`);
  log(`  author ${AUTHOR_SLUG} (id ${author.id}, photo ${author.photo ?? 'none'})`);

  const existing = await payload.find({
    collection: 'media',
    where: { alt: { equals: LOGO_ALT } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  let media = existing.docs[0] as Doc | undefined;
  if (media) {
    log(`  skip     media (id ${media.id})`);
  } else if (DRY_RUN) {
    log(`  would upload ${LOGO_PATH} as "${LOGO_ALT}"`);
  } else {
    media = (await payload.create({
      collection: 'media',
      data: { alt: LOGO_ALT, folder: 'web/author' } as Record<string, unknown>,
      filePath: LOGO_PATH,
      overrideAccess: true,
    })) as Doc;
    log(`  uploaded media (id ${media.id})`);
  }

  if (DRY_RUN) {
    log(`  would update author ${author.id}: photo, role, topics, social, bioLong`);
    return;
  }
  if (!media) throw new Error('Media upload did not return a document');

  await payload.update({
    collection: 'authors',
    id: author.id,
    data: {
      photo: media.id,
      role: ROLE,
      topicAreas: TOPICS.map((topic) => ({ topic })),
      social: SOCIAL,
      bioLong: {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          direction: null,
          children: BIO_PARAGRAPHS.map(paragraph),
        },
      },
    } as Record<string, unknown>,
    overrideAccess: true,
  });
  log(`  updated  author ${author.id}`);

  const purge = await revalidateWeb(payload, {
    paths: [`/author/${AUTHOR_SLUG}`],
  });
  log(`  purge    web cache: ${purge.ok ? 'ok' : `failed (${purge.status ?? purge.error ?? 'disabled'})`}`);
};

run()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console -- script output
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
