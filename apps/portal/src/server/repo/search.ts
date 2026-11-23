import { and, asc, desc, eq, isNull, ne, or, type SQL, sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { documents, partners, registrations, users } from '@/db/schema';
import {
  DOCUMENT_TYPE_LABEL,
  isOneOf,
  PARTNER_CATEGORY_LABEL,
  PARTNER_REGION_LABEL,
  PARTNER_ROLE_LABEL,
  PARTNER_ROLES,
  PRODUCT_LABEL,
  REGISTRATION_STATUS_LABEL,
  STAFF_ROLE_LABEL,
  STAFF_ROLES,
} from '@/lib/domain';
import type { SearchHitDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { staffDealHref } from '@/lib/staff-deals-dto';
import { SEARCH_MIN_CHARS } from '@/lib/search-pages';
import type { Viewer } from '@/server/auth/types';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';

const MAX_PER_GROUP = 10;

const escapeLike = (value: string): string => value.replace(/[\\%_]/g, '\\$&');

/** A substring match (uses the trigram index) or a typo tolerant word match (pg_trgm `<%`). */
const matches = (column: AnyPgColumn, q: string, pattern: string): SQL =>
  sql`(${column} ILIKE ${pattern} OR ${q} <% ${column})`;

const rank = (column: AnyPgColumn, q: string): SQL =>
  sql`greatest(similarity(${column}, ${q}), word_similarity(${q}, ${column}))`;

/** 'none' means the role has no business searching this group; undefined means no extra filter. */
type Scope = SQL | undefined | 'none';

/** Deals follow `registration.read`: partner admin the company, partner sales their own, staff by role and region. */
function registrationScope(viewer: Viewer): Scope {
  if (viewer.kind === 'partner') {
    if (viewer.role === 'partner_admin') return eq(registrations.partnerId, viewer.partnerId);
    if (viewer.role === 'sales') {
      return and(eq(registrations.partnerId, viewer.partnerId), eq(registrations.registeredBy, viewer.id));
    }
    return 'none';
  }
  if (viewer.role === 'partner_manager') return undefined;
  if (viewer.role === 'sales') return viewer.region === 'all' ? undefined : eq(registrations.region, viewer.region);
  return 'none';
}

/** Partners follow `partner.read`: partner manager all, staff sales their region. Partners search their own team instead. */
function partnerScope(viewer: Viewer): Scope {
  if (viewer.kind !== 'staff') return 'none';
  if (viewer.role === 'partner_manager') return undefined;
  if (viewer.role === 'sales') return viewer.region === 'all' ? undefined : eq(partners.region, viewer.region);
  return 'none';
}

/** People follow `team.read` (partner admin: own company) and `staff.read` (partner manager: everyone). */
function peopleScope(viewer: Viewer): Scope {
  if (viewer.kind === 'partner') {
    return viewer.role === 'partner_admin' ? eq(users.partnerId, viewer.partnerId) : 'none';
  }
  return viewer.role === 'partner_manager' ? undefined : 'none';
}

const roleLabel = (role: string): string => {
  if (isOneOf(PARTNER_ROLES, role)) return PARTNER_ROLE_LABEL[role];
  if (isOneOf(STAFF_ROLES, role)) return STAFF_ROLE_LABEL[role];
  return role;
};

async function searchRegistrations(tx: Tx, viewer: Viewer, q: string, pattern: string, limit: number): Promise<SearchHitDto[]> {
  const scope = registrationScope(viewer);
  if (scope === 'none') return [];
  const rows = await tx
    .select({
      id: registrations.id,
      customer: registrations.customerName,
      product: registrations.product,
      status: registrations.status,
      partnerName: partners.name,
    })
    .from(registrations)
    .innerJoin(partners, eq(partners.id, registrations.partnerId))
    .where(and(matches(registrations.customerName, q, pattern), scope))
    .orderBy(desc(rank(registrations.customerName, q)), desc(registrations.registeredOn))
    .limit(limit);
  return rows.map((r) => {
    const status = REGISTRATION_STATUS_LABEL[r.status].toLowerCase();
    return viewer.kind === 'partner'
      ? { group: 'registrations', label: r.customer, hint: `${PRODUCT_LABEL[r.product]}, ${status}`, href: ROUTES.partner.deal(r.id), icon: 'deals' }
      : { group: 'registrations', label: r.customer, hint: `${r.partnerName}, ${status}`, href: staffDealHref(r.id), icon: 'approve' };
  });
}

async function searchPartners(tx: Tx, viewer: Viewer, q: string, pattern: string, limit: number): Promise<SearchHitDto[]> {
  const scope = partnerScope(viewer);
  if (scope === 'none') return [];
  const rows = await tx
    .select({ id: partners.id, name: partners.name, category: partners.category, region: partners.region })
    .from(partners)
    .where(and(matches(partners.name, q, pattern), scope))
    .orderBy(desc(rank(partners.name, q)), asc(partners.name))
    .limit(limit);
  return rows.map((p) => ({
    group: 'partners',
    label: p.name,
    hint: `${PARTNER_CATEGORY_LABEL[p.category]}, ${PARTNER_REGION_LABEL[p.region]}`,
    href: `${ROUTES.admin.partners}?selected=${p.id}`,
    icon: 'bld',
  }));
}

/** The audience rule (and soft delete, for partners) is enforced by the documents_select policy; see rls.sql. */
async function searchDocuments(tx: Tx, viewer: Viewer, q: string, pattern: string, limit: number): Promise<SearchHitDto[]> {
  const rows = await tx
    .select({ id: documents.id, title: documents.title, type: documents.type })
    .from(documents)
    .where(and(isNull(documents.deletedAt), matches(documents.title, q, pattern)))
    .orderBy(desc(rank(documents.title, q)), asc(documents.title))
    .limit(limit);
  return rows.map((d) => ({
    group: 'documents',
    label: d.title,
    hint: DOCUMENT_TYPE_LABEL[d.type],
    href: `${viewer.kind === 'partner' ? ROUTES.partner.documents : ROUTES.admin.documents}?doc=${d.id}`,
    icon: d.type === 'video' ? 'play' : 'file',
  }));
}

async function searchPeople(tx: Tx, viewer: Viewer, q: string, pattern: string, limit: number): Promise<SearchHitDto[]> {
  const scope = peopleScope(viewer);
  if (scope === 'none') return [];
  const rows = await tx
    .select({ name: users.name, role: users.role, kind: users.kind, partnerName: partners.name })
    .from(users)
    .leftJoin(partners, eq(partners.id, users.partnerId))
    .where(and(ne(users.status, 'disabled'), scope, or(matches(users.name, q, pattern), sql`${users.email} ILIKE ${pattern}`)))
    .orderBy(desc(rank(users.name, q)), asc(users.name))
    .limit(limit);
  return rows.map((u) => ({
    group: 'people',
    label: u.name,
    hint: `${u.partnerName ?? 'CleanStart'}, ${roleLabel(u.role)}`,
    href: viewer.kind === 'partner' ? ROUTES.partner.team : u.kind === 'staff' ? ROUTES.admin.team : ROUTES.admin.partners,
    icon: 'team',
  }));
}

/**
 * pg_trgm over registrations (customer), partners (name), documents (title) and people (name, email), scoped by the
 * viewer exactly like the list functions. At most `limit` hits per group (never more than 10), groups in a fixed
 * order. A query shorter than SEARCH_MIN_CHARS returns nothing. The static "Pages" group is client data.
 */
export async function searchAll(tx: Tx, viewer: Viewer, input: { q: string; limit: number }): Promise<SearchHitDto[]> {
  const q = input.q.trim();
  if (q.length < SEARCH_MIN_CHARS) return [];
  const pattern = `%${escapeLike(q)}%`;
  const limit = Math.min(Math.max(Math.trunc(input.limit), 1), MAX_PER_GROUP);
  return [
    ...(await searchRegistrations(tx, viewer, q, pattern, limit)),
    ...(await searchPartners(tx, viewer, q, pattern, limit)),
    ...(await searchDocuments(tx, viewer, q, pattern, limit)),
    ...(await searchPeople(tx, viewer, q, pattern, limit)),
  ];
}

export const isolation = defineIsolation<'searchAll'>({
  searchAll: {
    scope: 'tenant',
    expect: 'empty',
    // As partner A, search broadly and return only the hits that point at partner B's deal. None may.
    probe: async (tx, viewer, ctx) =>
      (await searchAll(tx, viewer, { q: 'er', limit: 10 })).filter((hit) => hit.href.includes(ctx.b.registrationId)),
  },
});
