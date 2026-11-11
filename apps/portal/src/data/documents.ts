import { createSlice } from '@/lib/slice';
import { DEMO_TODAY } from '@/lib/demo-date';
import { appendAudit } from '@/data/audit';
import type { Product } from '@/components/ui/badge';

export const DOC_TYPES = [
  'Datasheet',
  'Solution sheet',
  'Battlecard',
  'Price list',
  'Video',
  'Enablement guide',
] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const DOC_PRODUCTS: readonly Product[] = [
  'Clean Libraries',
  'CleanStart Images',
  'CleanSight',
  'All products',
];

export const PARTNER_CATEGORIES = [
  'Distributors',
  'Channel partners',
  'System integrators',
] as const;

export type DocAudience =
  | { kind: 'all' }
  | { kind: 'categories'; categories: string[] }
  | { kind: 'partners'; partners: string[] };

export interface PortalDocument {
  id: string;
  title: string;
  type: DocType;
  format: string;
  product: Product;
  /** Card blurb on the partner library; uploads have none and fall back to type and format. */
  summary?: string;
  audience: DocAudience;
  /** Full date, e.g. "4 Nov 2026". */
  updated: string;
  /** Uploaded or replaced during this walkthrough: the admin table says "Just now" and partners see a New badge. */
  fresh?: boolean;
  /** Opens across all partners (admin view). */
  opens: number;
  /** Partners whose people opened it (admin view). */
  partnerCount: number;
  /** Opens by Kestrel Systems people (partner view, "Opened by your team"). */
  ownOpens: number;
}

/** The signed-in partner whose library the Documents screen shows. */
export const VIEWER_PARTNER = { name: 'Kestrel Systems', category: 'Channel partners' } as const;

const ADMIN_ACTOR = 'Farhan Qureshi';

const doc = (
  id: string,
  title: string,
  type: DocType,
  format: string,
  product: Product,
  audience: DocAudience,
  updated: string,
  opens: number,
  partnerCount: number,
  ownOpens: number,
  summary?: string,
): PortalDocument => ({
  id,
  title,
  type,
  format,
  product,
  audience,
  updated,
  opens,
  partnerCount,
  ownOpens,
  ...(summary ? { summary } : {}),
});

const ALL: DocAudience = { kind: 'all' };
const DISTRIBUTORS_AND_CHANNEL: DocAudience = {
  kind: 'categories',
  categories: ['Distributors', 'Channel partners'],
};

const SEED: PortalDocument[] = [
  doc(
    'cleansight-product-walkthrough',
    'CleanSight product walkthrough',
    'Video',
    'MP4, 14 min',
    'CleanSight',
    ALL,
    '4 Nov 2026',
    38,
    14,
    9,
    'From first scan to fix, for a technical audience',
  ),
  doc(
    'clean-libraries-solution-sheet',
    'Clean Libraries solution sheet',
    'Solution sheet',
    'PDF, 1.1 MB',
    'Clean Libraries',
    ALL,
    '30 Oct 2026',
    61,
    17,
    6,
    'What it replaces, who buys it, questions to ask',
  ),
  doc(
    'partner-sales-playbook-2026',
    'Partner sales playbook 2026',
    'Enablement guide',
    'PDF, 3.4 MB',
    'All products',
    DISTRIBUTORS_AND_CHANNEL,
    '27 Oct 2026',
    112,
    18,
    14,
    'Ideal customers, discovery, positioning, deal registration',
  ),
  doc(
    'selling-hardened-images-to-banks',
    'Selling hardened images to banks',
    'Video',
    'MP4, 22 min',
    'CleanStart Images',
    ALL,
    '21 Oct 2026',
    29,
    11,
    5,
    'Recorded partner session on BFSI and audit-driven deals',
  ),
  doc(
    'competitive-battlecard',
    'Competitive battlecard',
    'Battlecard',
    'PDF, 640 KB',
    'All products',
    DISTRIBUTORS_AND_CHANNEL,
    '20 Oct 2026',
    87,
    16,
    11,
    'How CleanStart compares with other hardened-image vendors',
  ),
  doc(
    'cleanstart-images-datasheet',
    'CleanStart Images datasheet',
    'Datasheet',
    'PDF, 820 KB',
    'CleanStart Images',
    ALL,
    '14 Oct 2026',
    44,
    13,
    8,
    'Catalogue, update cadence, FIPS and STIG coverage',
  ),
  doc(
    'cleansight-datasheet',
    'CleanSight datasheet',
    'Datasheet',
    'PDF, 950 KB',
    'CleanSight',
    ALL,
    '14 Oct 2026',
    36,
    12,
    4,
    'Capabilities, deployment options, integrations',
  ),
  doc(
    'technical-onboarding-for-partner-engineers',
    'Technical onboarding for partner engineers',
    'Enablement guide',
    'PDF, 2.2 MB',
    'All products',
    ALL,
    '12 Oct 2026',
    24,
    7,
    3,
    'Lab setup, pulling images, running a proof of concept',
  ),
  doc(
    'clean-libraries-datasheet',
    'Clean Libraries datasheet',
    'Datasheet',
    'PDF, 780 KB',
    'Clean Libraries',
    ALL,
    '8 Oct 2026',
    28,
    10,
    2,
    'Supported ecosystems and verification process',
  ),
  doc(
    'partner-logo-and-brand-kit',
    'Partner logo and brand kit',
    'Enablement guide',
    'ZIP, 18 MB',
    'All products',
    ALL,
    '1 Oct 2026',
    19,
    9,
    7,
    'Logos, colours and co-branding rules',
  ),
  doc(
    'gulf-region-price-list',
    'Gulf region price list',
    'Price list',
    'PDF, 310 KB',
    'All products',
    { kind: 'partners', partners: ['Arbor Cyber', 'Harbourline IT'] },
    '1 Oct 2026',
    9,
    2,
    0,
  ),
  doc(
    'india-region-price-list',
    'India region price list',
    'Price list',
    'PDF, 290 KB',
    'All products',
    {
      kind: 'partners',
      partners: [
        'Saffron Secure',
        'Vyom Digital',
        'Meghdoot Systems',
        'Ironleaf Consulting',
        'Dunes Networks',
      ],
    },
    '1 Oct 2026',
    21,
    5,
    0,
  ),
];

export const documentsSlice = createSlice<PortalDocument[]>('documents', SEED);

export function useDocuments(): PortalDocument[] {
  return documentsSlice.use();
}

export function canPartnerOpen(
  d: PortalDocument,
  partner: { name: string; category: string },
): boolean {
  switch (d.audience.kind) {
    case 'all':
      return true;
    case 'categories':
      return d.audience.categories.includes(partner.category);
    case 'partners':
      return d.audience.partners.some((p) => p.toLowerCase() === partner.name.toLowerCase());
  }
}

export function audienceLabel(a: DocAudience): string {
  switch (a.kind) {
    case 'all':
      return 'All partners';
    case 'categories':
      return a.categories.length
        ? a.categories
            .map((c, i) => {
              const word = c.split(' ')[0] ?? c;
              return i === 0 ? word : word.toLowerCase();
            })
            .join(', ')
        : 'No one yet';
    case 'partners':
      return `${a.partners.length} ${a.partners.length === 1 ? 'partner' : 'partners'}`;
  }
}

export function audienceTone(a: DocAudience): 'neutral' | 'pending' | 'violet' {
  return a.kind === 'all' ? 'neutral' : a.kind === 'partners' ? 'pending' : 'violet';
}

/** "4 Nov 2026" to "4 Nov"; a fresh upload reads "Just now" in the admin table. */
export function adminUpdatedLabel(d: PortalDocument): string {
  return d.fresh ? 'Just now' : d.updated.replace(/ \d{4}$/, '');
}

const slugify = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export interface NewDocumentInput {
  title: string;
  type: DocType;
  product: Product;
  audience: DocAudience;
}

export function addDocument(input: NewDocumentInput): PortalDocument {
  const existing = documentsSlice.get();
  const base = slugify(input.title) || 'document';
  let id = base;
  for (let n = 2; existing.some((d) => d.id === id); n += 1) id = `${base}-${n}`;
  const created: PortalDocument = {
    id,
    title: input.title,
    type: input.type,
    format: input.type === 'Video' ? 'MP4, 4 min' : 'PDF, 450 KB',
    product: input.product,
    audience: input.audience,
    updated: DEMO_TODAY,
    fresh: true,
    opens: 0,
    partnerCount: 0,
    ownOpens: 0,
  };
  documentsSlice.set([created, ...existing]);
  appendAudit({
    actor: ADMIN_ACTOR,
    action: 'Uploaded document',
    target: created.title,
    detail: `${created.type}, ${created.product}, open to ${audienceLabel(created.audience)}`,
    source: 'Portal',
  });
  return created;
}

/** Replacing the file keeps the id and the open counts; the document moves to the top as the newest. */
export function replaceDocument(id: string): void {
  const target = documentsSlice.get().find((d) => d.id === id);
  if (!target) return;
  const next: PortalDocument = { ...target, updated: DEMO_TODAY, fresh: true };
  documentsSlice.set((prev) => [next, ...prev.filter((d) => d.id !== id)]);
  appendAudit({
    actor: ADMIN_ACTOR,
    action: 'Replaced document file',
    target: target.title,
    detail: 'New version uploaded, link and open count kept',
    source: 'Portal',
  });
}

export function deleteDocument(id: string): void {
  const target = documentsSlice.get().find((d) => d.id === id);
  if (!target) return;
  documentsSlice.set((prev) => prev.filter((d) => d.id !== id));
  appendAudit({
    actor: ADMIN_ACTOR,
    action: 'Deleted document',
    target: target.title,
    detail: 'Partners lost access',
    source: 'Portal',
  });
}
