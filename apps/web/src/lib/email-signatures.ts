import { cache } from "react";

import { fetchCMS } from "./cms-fetch";

/**
 * Employee email-signature directory.
 *
 * The signature HTML itself is rendered by the CMS
 * (`/api/emailSignatures/:slug/render`) rather than here: the token contract
 * and its escaping rules live next to the collection that defines them, so
 * there is exactly one implementation. A second renderer on this side would
 * have to duplicate the token list, and any drift would surface as a silently
 * empty field in a signature already pasted into somebody's mail client.
 */

/** Section headings the directory groups people under, in display order. */
export const SIGNATURE_GROUP_ORDER = [
  "Executive Leadership",
  "Sales & Regional Leadership",
  "Marketing & Communications",
  "HR & People Operations",
  "Account Management & Sales Operations",
  "Engineering & Technical Solutions",
] as const;

export interface EmailSignatureSummary {
  id: string | number;
  slug: string;
  name: string;
  jobTitle: string;
  email: string;
  group: string;
  sortOrder?: number | null;
}

export interface RenderedSignature {
  slug: string;
  name: string;
  jobTitle: string;
  html: string;
}

interface PayloadListResponse<T> {
  docs: T[];
  totalDocs: number;
}

interface RenderResponse {
  ok: boolean;
  slug?: string;
  name?: string;
  jobTitle?: string;
  html?: string;
}

/**
 * Active signatures, grouped-ready and ordered by `sortOrder` then name.
 *
 * Returns an empty list rather than throwing when the CMS cannot answer. The
 * directory is prerendered, so an exception here fails the whole build — and
 * the collection legitimately does not exist on a CMS that has not run the
 * migration yet. The page renders its empty state instead, and the error is
 * logged so a real outage is still visible in build/server logs.
 */
export const getEmailSignatures = cache(
  async (): Promise<EmailSignatureSummary[]> => {
    const select = ["slug", "name", "jobTitle", "email", "group", "sortOrder"]
      .map((field) => `select[${field}]=true`)
      .join("&");

    let response: PayloadListResponse<EmailSignatureSummary>;
    try {
      response = await fetchCMS<PayloadListResponse<EmailSignatureSummary>>(
        `/api/emailSignatures?where[active][equals]=true&limit=200&depth=0&sort=sortOrder&${select}`,
        // fetchCMS defaults to a 1-hour data cache, which the route's
        // `revalidate` does not shorten. Offboarding has to take effect in
        // minutes, so override it here.
        { revalidateSeconds: 300 },
      );
    } catch (error) {
      console.error("[email-signatures] failed to load directory", error);
      return [];
    }

    return [...response.docs].sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
    );
  },
);

/** Signatures bucketed into `SIGNATURE_GROUP_ORDER`; empty groups are dropped. */
export function groupSignatures(
  signatures: EmailSignatureSummary[],
): { group: string; people: EmailSignatureSummary[] }[] {
  const known = new Set<string>(SIGNATURE_GROUP_ORDER);

  const ordered = SIGNATURE_GROUP_ORDER.map((group) => ({
    group: group as string,
    people: signatures.filter((person) => person.group === group),
  }));

  // A group added in the CMS but not yet reflected here still renders, after
  // the known ones, rather than silently dropping those people from the page.
  const extras = [...new Set(signatures.map((p) => p.group))]
    .filter((group) => !known.has(group))
    .sort()
    .map((group) => ({
      group,
      people: signatures.filter((person) => person.group === group),
    }));

  return [...ordered, ...extras].filter((entry) => entry.people.length > 0);
}

/**
 * Final signature HTML for one person, or null when the slug is unknown or the
 * person has been deactivated (the offboarding path).
 */
/** Raised when the CMS could not answer — distinct from "this slug is gone". */
export class SignatureUnavailableError extends Error {
  constructor(slug: string, cause: unknown) {
    super(`Signature "${slug}" could not be rendered`);
    this.name = "SignatureUnavailableError";
    this.cause = cause;
  }
}

export async function getRenderedSignature(
  slug: string,
): Promise<RenderedSignature | null> {
  let response: RenderResponse;
  try {
    response = await fetchCMS<RenderResponse>(
      `/api/emailSignatures/${encodeURIComponent(slug)}/render`,
      // Same reasoning as the directory: deactivating someone must stop this
      // URL resolving promptly, not an hour later.
      { revalidateSeconds: 300 },
    );
  } catch (error) {
    // Only a 404 means "no such signature". Treating every failure as 404
    // would let one CMS restart bake a "not available" page into the ISR cache
    // for the next 5 minutes, for a signature that exists.
    const status = (error as { status?: number } | null)?.status;
    if (status === 404) return null;
    console.error(`[email-signatures] render failed for "${slug}"`, error);
    throw new SignatureUnavailableError(slug, error);
  }

  if (!response.ok || typeof response.html !== "string") {
    // The endpoint answered 2xx but could not render — e.g. the template is
    // unpublished. Not a missing signature, so do not cache a 404 for it.
    throw new SignatureUnavailableError(slug, response);
  }

  return {
    slug,
    name: response.name ?? slug,
    jobTitle: response.jobTitle ?? "",
    html: response.html,
  };
}
