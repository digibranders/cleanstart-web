import { z } from 'zod';
import { PRODUCTS, REGISTRATION_STATUSES, type RegistrationStatus } from '@/lib/domain';
import { regionKeySchema } from '@/lib/regions';
import type { RegistrationListItem } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';

export const STAFF_DEAL_SORT_KEYS = ['customer', 'partner', 'product', 'region', 'manager', 'status', 'registered', 'protection'] as const;
export type StaffDealSortKey = (typeof STAFF_DEAL_SORT_KEYS)[number];

export const STAFF_DEAL_DEFAULT_PAGE_SIZE = 25;

const flag = z.preprocess((v) => v === true || v === 'true' || v === '1', z.boolean());

export const staffDealFiltersSchema = z.object({
  status: z.array(z.enum(REGISTRATION_STATUSES)).max(REGISTRATION_STATUSES.length).default([]),
  partnerId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  product: z.enum(PRODUCTS).optional(),
  region: regionKeySchema.optional(),
  overdue: flag.default(false),
  conflict: flag.default(false),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(STAFF_DEAL_SORT_KEYS).default('registered'),
  dir: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(STAFF_DEAL_DEFAULT_PAGE_SIZE),
});

export type StaffDealFilters = z.output<typeof staffDealFiltersSchema>;

/** A row of the staff Deals table. `overdue` is a waiting deal past the 2 business day target. */
export interface StaffDealRow extends RegistrationListItem {
  overdue: boolean;
  conflict: boolean;
}

export type StaffDealCounts = Record<RegistrationStatus | 'all', number>;

export interface StaffDealsPageDto {
  rows: StaffDealRow[];
  /** Rows matching every filter, across all pages. */
  total: number;
  /** Per status, with every filter applied except status itself, so the facet bar stays meaningful. */
  counts: StaffDealCounts;
  page: number;
  pageSize: number;
}

export const staffDealHref = (id: string): string => `${ROUTES.admin.approvals}/${id}`;

/** The tabs of the facet bar. "waiting" is the approval queue; the rest are tables. */
export type StaffDealFacet = 'waiting' | 'all' | Exclude<RegistrationStatus, 'pending'>;
export const STAFF_DEAL_FACETS: readonly StaffDealFacet[] = ['all', 'waiting', 'accepted', 'rejected', 'expired', 'won', 'lost'];

type SearchParams = Record<string, string | string[] | undefined>;

const first = (params: SearchParams, key: string): string | undefined => {
  const v = params[key];
  return (Array.isArray(v) ? v[0] : v) || undefined;
};

/** `?status=` picks the facet; no value means the waiting queue, which is what the page always showed. */
export function parseStaffDealFacet(params: SearchParams): StaffDealFacet {
  const status = first(params, 'status');
  return STAFF_DEAL_FACETS.find((f) => f === status) ?? 'waiting';
}

/** URL search params to validated filters. A malformed value falls back to its default; it never throws or resets the rest. */
export function parseStaffDealParams(params: SearchParams): StaffDealFilters {
  const facet = parseStaffDealFacet(params);
  const raw = {
    status: facet === 'all' ? [] : [facet === 'waiting' ? 'pending' : facet],
    partnerId: first(params, 'partner'),
    managerId: first(params, 'manager'),
    product: first(params, 'product'),
    region: first(params, 'region'),
    overdue: first(params, 'overdue'),
    conflict: first(params, 'conflict'),
    q: first(params, 'q'),
    sort: first(params, 'sort'),
    dir: first(params, 'dir'),
    page: first(params, 'page'),
  };
  const parsed = staffDealFiltersSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const bad = new Set(parsed.error.issues.map((i) => String(i.path[0])));
  return staffDealFiltersSchema.parse(Object.fromEntries(Object.entries(raw).filter(([key]) => !bad.has(key))));
}
