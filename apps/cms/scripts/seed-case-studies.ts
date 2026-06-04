/**
 * One-shot seed for the `case-studies` collection.
 *
 * Creates the launch set of case studies on a fresh environment (e.g. the
 * production droplet, where the rows created in local dev do not exist). Each
 * case study's media (cover, company-mark logo, PDF) is pulled from its current
 * public R2 URL, re-uploaded as a Media doc in the target environment, then the
 * case study is created referencing the new media.
 *
 * Idempotent: a case study whose `slug` already exists is skipped (no duplicate
 * rows, no duplicate media). Safe to re-run.
 *
 * Run inside the cms container (mirrors the production rollout-checklist tasks):
 *   pnpm exec payload run scripts/seed-case-studies.ts
 * or:
 *   pnpm exec tsx --env-file=.env scripts/seed-case-studies.ts
 */
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { getPayload } from 'payload';

import config from '../src/payload.config.ts';

type Industry = 'healthcare' | 'telecom' | 'finance' | 'technology' | 'manufacturing' | 'other';

interface MediaSource {
  /** Public URL the file is fetched from. */
  url: string;
  /** Alt text stored on the Media doc. */
  alt: string;
}

interface SeedRow {
  slug: string;
  title: string;
  industry: Industry;
  company: string;
  summary: string;
  coverImage: MediaSource;
  companyLogo: MediaSource;
  asset: MediaSource;
}

const ROWS: SeedRow[] = [
  {
    slug: 'how-iifl-finance-standardized-secure-container-foundations',
    title: 'How IIFL Finance Standardized Secure Container Foundations',
    industry: 'finance',
    company: 'IIFL Finance',
    summary:
      'CleanStart helped IIFL Finance standardize its container foundations without slowing development. Tasks that previously required significant manual effort are eliminated, deployments are faster, and the security team has greater confidence in the images they use.',
    coverImage: {
      url: 'https://cdn.cleanstart.com/dev/general/iifl-finance-71560da7.webp',
      alt: 'IIFL Finance',
    },
    companyLogo: {
      url: 'https://cdn.cleanstart.com/dev/general/iifl-finance-mark-74808e75.webp',
      alt: 'IIFL Finance mark',
    },
    asset: {
      url: 'https://cdn.cleanstart.com/dev/general/iifl-finance-case-study-c802a33c.pdf',
      alt: 'IIFL Finance case study',
    },
  },
  {
    slug: 'streamlining-operations-for-a-leading-healthcare-provider',
    title: 'Streamlining Operations for a Leading Healthcare Provider',
    industry: 'healthcare',
    company: 'Aurascape',
    summary:
      'Standardizing on verified container foundations gave Aurascape confidence in the base of every service they deploy and let them shift security much earlier in the build process.',
    coverImage: {
      url: 'https://cdn.cleanstart.com/dev/general/aurascape-b48189be.webp',
      alt: 'Aurascape',
    },
    companyLogo: {
      url: 'https://cdn.cleanstart.com/dev/general/aurascape-mark-2ad1a337.webp',
      alt: 'Aurascape mark',
    },
    asset: {
      url: 'https://cdn.cleanstart.com/dev/general/aurascape-case-study-32c56a9f.pdf',
      alt: 'Aurascape case study',
    },
  },
];

const run = async (): Promise<void> => {
  const payload = await getPayload({ config });
  const workDir = mkdtempSync(path.join(tmpdir(), 'cs-seed-'));

  const downloadToTmp = async (source: MediaSource): Promise<string> => {
    const res = await fetch(source.url);
    if (!res.ok) {
      throw new Error(`Failed to download ${source.url}: ${res.status} ${res.statusText}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const filePath = path.join(workDir, path.basename(new URL(source.url).pathname));
    writeFileSync(filePath, buffer);
    return filePath;
  };

  const uploadMedia = async (source: MediaSource): Promise<number> => {
    const filePath = await downloadToTmp(source);
    const doc = await payload.create({
      collection: 'media',
      data: { alt: source.alt },
      filePath,
      overrideAccess: true,
    });
    return doc.id as number;
  };

  for (const row of ROWS) {
    const existing = await payload.find({
      collection: 'case-studies',
      where: { slug: { equals: row.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    if (existing.docs.length > 0) {
      payload.logger.info(`skip "${row.title}" — slug already exists (id ${existing.docs[0]?.id})`);
      continue;
    }

    const [coverImage, companyLogo, asset] = await Promise.all([
      uploadMedia(row.coverImage),
      uploadMedia(row.companyLogo),
      uploadMedia(row.asset),
    ]);

    const created = await payload.create({
      collection: 'case-studies',
      data: {
        slug: row.slug,
        title: row.title,
        industry: row.industry,
        company: row.company,
        summary: row.summary,
        coverImage,
        companyLogo,
        asset,
        _status: 'published',
      },
      overrideAccess: true,
    });
    payload.logger.info(`seeded "${created.title}" (id ${created.id})`);
  }

  payload.logger.info('case-studies seed complete');
  process.exit(0);
};

void run();
