import { daysBetween, fmtShort } from '@/lib/dates';
import type { AudienceInput, AudiencePartnerDto } from '@/lib/document-upload';
import type { AudienceKind, PartnerCategory } from '@/lib/domain';
import type { DocumentAudienceDto } from '@/lib/dto';

/** A document counts as new for this many days after it was added or replaced. */
export const FRESH_DAYS = 7;

export const isFresh = (updatedAt: string, today: string): boolean => daysBetween(updatedAt.slice(0, 10), today) <= FRESH_DAYS;

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
