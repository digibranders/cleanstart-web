import type { CollectionBeforeChangeHook } from 'payload';
import { ValidationError } from 'payload';

const MAX_HOPS = 10;
const FLATTEN_AFTER_HOPS = 3;

const isExternalUrl = (value: string): boolean =>
  /^https?:\/\//i.test(value) || /^(mailto|tel):/i.test(value);

const stripTrailingSlash = (value: string): string =>
  value.length > 1 ? value.replace(/\/+$/, '') : value;

export interface RedirectChainStep {
  readonly to: string;
  /** Status string from the Redirects collection — '301' / '302' / '307' / '308' / '410'. */
  readonly status: string;
}

export type RedirectLookup = (
  from: string,
) => Promise<RedirectChainStep | null>;

export type RedirectChainResult =
  | { kind: 'ok'; target: string; hops: number }
  | { kind: 'flatten'; target: string; hops: number }
  | { kind: 'cycle'; via: string; hops: number };

/**
 * Pure walker. Given a proposed `from`/`to` and a way to resolve
 * existing redirects, follows the chain forward until it hits:
 *   - an external URL or non-redirect destination → `ok`
 *   - a 410 Gone hop → `ok` (the chain terminates)
 *   - a `from` we've already seen → `cycle`
 *   - more than FLATTEN_AFTER_HOPS hops → `flatten`
 *   - more than MAX_HOPS hops → `cycle` (treated as a runaway chain;
 *     same outcome as a true cycle since we refuse to write either)
 *
 * Internal because the only consumer is `redirectCycleGuardHook` —
 * exported for unit-test access.
 */
export const detectRedirectChain = async (args: {
  from: string;
  to: string;
  lookup: RedirectLookup;
}): Promise<RedirectChainResult> => {
  const startFrom = stripTrailingSlash(args.from);
  const visited = new Set<string>([startFrom]);
  let current = stripTrailingSlash(args.to);
  let hops = 0;

  while (hops < MAX_HOPS) {
    if (visited.has(current)) {
      return { kind: 'cycle', via: current, hops };
    }
    visited.add(current);

    if (isExternalUrl(current)) {
      return { kind: 'ok', target: current, hops };
    }

    const next = await args.lookup(current);
    if (!next || next.status === '410') {
      const result =
        hops > FLATTEN_AFTER_HOPS - 1
          ? ({ kind: 'flatten', target: current, hops } as const)
          : ({ kind: 'ok', target: current, hops } as const);
      return result;
    }

    current = stripTrailingSlash(next.to);
    hops += 1;
  }

  return { kind: 'cycle', via: current, hops };
};

interface RedirectsPayload {
  find: (args: {
    collection: 'redirects';
    where: { from: { equals: string } };
    limit: number;
    depth: 0;
    overrideAccess?: boolean;
  }) => Promise<{ docs: { to?: string | null; status?: string | null }[] }>;
}

const lookupFromPayload = (payload: RedirectsPayload): RedirectLookup =>
  async (from) => {
    const result = await payload.find({
      collection: 'redirects',
      where: { from: { equals: from } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const row = result.docs[0];
    if (!row || typeof row.to !== 'string' || typeof row.status !== 'string') {
      return null;
    }
    return { to: row.to, status: row.status };
  };

/**
 * `beforeChange` hook for the Redirects collection. Refuses to save a
 * redirect that would create a cycle, and flattens long chains to a
 * single hop so the public-site middleware doesn't pay the redirect-
 * tax for chains an editor introduced by accident.
 *
 * The existing `to` validator in `Redirects.ts` catches the trivial
 * self-loop (`from === to`); this hook catches the multi-hop case.
 */
export const redirectCycleGuardHook: CollectionBeforeChangeHook = async ({
  data,
  req,
  originalDoc,
}) => {
  if (!data) return data;
  const status = (data as { status?: string }).status ?? '301';
  if (status === '410') return data;

  const from = (data as { from?: string }).from
    ?? (originalDoc as { from?: string } | undefined)?.from;
  const to = (data as { to?: string }).to;
  if (typeof from !== 'string' || typeof to !== 'string') return data;
  if (from.length === 0 || to.length === 0) return data;
  if (isExternalUrl(to)) return data;

  const result = await detectRedirectChain({
    from,
    to,
    lookup: lookupFromPayload(req.payload as unknown as RedirectsPayload),
  });

  if (result.kind === 'cycle') {
    throw new ValidationError({
      errors: [
        {
          message: `Redirect cycle detected via "${result.via}" after ${result.hops} hop(s). Resolve the chain before saving.`,
          path: 'to',
        },
      ],
    });
  }

  if (result.kind === 'flatten') {
    return { ...data, to: result.target };
  }

  return data;
};
