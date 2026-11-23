import { daysBetween, fmtShort } from '@/lib/dates';
import type { AudienceInput, AudiencePartnerDto } from '@/lib/document-upload';
import { DOC_PRODUCTS, DOCUMENT_TYPES, type AudienceKind, type DocProduct, type DocumentType, type PartnerCategory } from '@/lib/domain';
import type { DocumentAudienceDto, DocumentDto } from '@/lib/dto';

/** A document is new for a partner for this many days after it was added or replaced, until their company opens it. */
export const NEW_DAYS = 14;

export const isNewDocument = (doc: Pick<DocumentDto, 'updatedAt' | 'ownOpens'>, today: string): boolean =>
  (doc.ownOpens ?? 0) === 0 && daysBetween(doc.updatedAt.slice(0, 10), today) <= NEW_DAYS;

/** Calls `fn` on the first call only: the player counts one open per viewing, however often it fires "play". */
export function once(fn: () => void): () => void {
  let called = false;
  return () => {
    if (called) return;
    called = true;
    fn();
  };
}

/* ---------------------------------------------------------------- library grouping and URL filters */

export const DOC_GROUPS = ['sales', 'technical', 'marketing', 'videos', 'other'] as const;
export type DocGroup = (typeof DOC_GROUPS)[number];
export const DOC_GROUP_LABEL: Record<DocGroup, string> = {
  sales: 'Sales enablement',
  technical: 'Technical',
  marketing: 'Marketing',
  videos: 'Training and videos',
  other: 'Other',
};
/** The tab labels: shorter than the section headings. */
export const DOC_GROUP_TAB: Record<DocGroup, string> = {
  sales: 'Sales',
  technical: 'Technical',
  marketing: 'Marketing',
  videos: 'Videos',
  other: 'Other',
};

const GROUP_OF_TYPE: Record<DocumentType, DocGroup> = {
  battlecard: 'sales',
  price_list: 'sales',
  enablement_guide: 'sales',
  datasheet: 'technical',
  solution_sheet: 'marketing',
  video: 'videos',
};

export const groupOf = (type: DocumentType): DocGroup => GROUP_OF_TYPE[type] ?? 'other';

/** Documents bucketed by purpose in the fixed group order, empty groups left out. Order inside a group is kept. */
export function groupDocuments<T extends { type: DocumentType }>(docs: readonly T[]): Array<{ group: DocGroup; docs: T[] }> {
  return DOC_GROUPS.map((group) => ({ group, docs: docs.filter((d) => groupOf(d.type) === group) })).filter((g) => g.docs.length > 0);
}

export const DOC_SORTS = ['new', 'opened', 'name'] as const;
export type DocSort = (typeof DOC_SORTS)[number];
export const DOC_SORT_LABEL: Record<DocSort, string> = { new: 'Newest first', opened: 'Most opened', name: 'Name' };
export const DOC_VIEWS = ['list', 'cards'] as const;
export type DocLibraryLayout = (typeof DOC_VIEWS)[number];

/** The library filters as they live in the URL. */
export interface DocumentsView {
  q: string;
  type: DocumentType | null;
  product: DocProduct | null;
  group: DocGroup | null;
  sort: DocSort;
  layout: DocLibraryLayout;
}

export const DOCUMENTS_Q_MAX = 100;
type Params = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);
const pick = <T extends string>(allowed: readonly T[], value: string | undefined): T | null =>
  allowed.find((candidate) => candidate === value) ?? null;

/** Anything unknown falls back to the default, so a hand edited URL never throws. */
export function parseDocumentsView(params: Params): DocumentsView {
  return {
    q: (first(params.q) ?? '').trim().slice(0, DOCUMENTS_Q_MAX),
    type: pick(DOCUMENT_TYPES, first(params.type)),
    product: pick(DOC_PRODUCTS, first(params.product)),
    group: pick(DOC_GROUPS, first(params.group)),
    sort: pick(DOC_SORTS, first(params.sort)) ?? 'new',
    layout: pick(DOC_VIEWS, first(params.view)) ?? 'list',
  };
}

/** "?q=..." with defaults left out, or "" when nothing is set. */
export function documentsViewToQuery(view: DocumentsView): string {
  const query = new URLSearchParams();
  if (view.q) query.set('q', view.q);
  if (view.type) query.set('type', view.type);
  if (view.product) query.set('product', view.product);
  if (view.group) query.set('group', view.group);
  if (view.sort !== 'new') query.set('sort', view.sort);
  if (view.layout !== 'list') query.set('view', view.layout);
  const text = query.toString();
  return text ? `?${text}` : '';
}

/** True when a filter (not the sort or the layout) narrows the list. */
export const hasDocumentFilters = (view: DocumentsView): boolean =>
  view.q !== '' || view.type !== null || view.product !== null || view.group !== null;

/** The list arrives newest first from the server; only the other two orders need work. */
export function sortDocuments<T extends Pick<DocumentDto, 'title' | 'ownOpens'>>(docs: readonly T[], sort: DocSort): T[] {
  if (sort === 'opened') return [...docs].sort((a, b) => (b.ownOpens ?? 0) - (a.ownOpens ?? 0));
  if (sort === 'name') return [...docs].sort((a, b) => a.title.localeCompare(b.title));
  return [...docs];
}

/** "Today" for a document updated today, otherwise "4 Nov". Replaces the mock's "Just now". */
export const adminUpdatedLabel = (updatedAt: string, today: string): string =>
  updatedAt.slice(0, 10) === today ? 'Today' : fmtShort(updatedAt);

export const audienceTone = (kind: AudienceKind): 'neutral' | 'pending' | 'violet' =>
  kind === 'all' ? 'neutral' : kind === 'named' ? 'pending' : 'violet';

/** What the audience controls hold while a person edits: named partners stay a comma separated text, as in the mock. */
export interface AudienceDraft {
  kind: AudienceKind;
  categories: PartnerCategory[];
  partnersText: string;
}

export const emptyAudienceDraft: AudienceDraft = { kind: 'categories', categories: [], partnersText: '' };

export const parsePartnerNames = (text: string): string[] =>
  text
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name !== '');

export type DraftResult = { ok: true; audience: AudienceInput } | { ok: false; error: string };

/** Validates the draft the way the server will, and maps partner names to ids. */
export function draftToInput(draft: AudienceDraft, partners: readonly AudiencePartnerDto[]): DraftResult {
  if (draft.kind === 'all') return { ok: true, audience: { kind: 'all' } };
  if (draft.kind === 'categories') {
    if (draft.categories.length === 0) return { ok: false, error: 'Pick at least one category.' };
    return { ok: true, audience: { kind: 'categories', categories: [...draft.categories] } };
  }
  const names = parsePartnerNames(draft.partnersText);
  if (names.length === 0) return { ok: false, error: 'Name at least one partner.' };
  const byName = new Map(partners.map((partner) => [partner.name.toLowerCase(), partner.id]));
  const unknown = names.filter((name) => !byName.has(name.toLowerCase()));
  if (unknown.length > 0) return { ok: false, error: `No partner named ${unknown.join(', ')}.` };
  const ids = names.flatMap((name) => {
    const id = byName.get(name.toLowerCase());
    return id === undefined ? [] : [id];
  });
  return { ok: true, audience: { kind: 'named', partnerIds: [...new Set(ids)] } };
}

export const draftFromAudience = (audience: DocumentAudienceDto): AudienceDraft => ({
  kind: audience.kind,
  categories: [...audience.categories],
  partnersText: audience.partners.map((partner) => partner.name).join(', '),
});

export function audienceInputOf(audience: DocumentAudienceDto): AudienceInput {
  if (audience.kind === 'all') return { kind: 'all' };
  if (audience.kind === 'categories') return { kind: 'categories', categories: [...audience.categories] };
  return { kind: 'named', partnerIds: audience.partners.map((partner) => partner.id) };
}

const sameSet = (a: readonly string[], b: readonly string[]): boolean => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

export function sameAudience(a: AudienceInput, b: AudienceInput): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'categories' && b.kind === 'categories') return sameSet(a.categories, b.categories);
  if (a.kind === 'named' && b.kind === 'named') return sameSet(a.partnerIds, b.partnerIds);
  return true;
}
