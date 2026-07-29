import { cache } from "react";

import { fetchCMS } from "./cms-fetch";
import type { EmailSignatureSummary } from "./email-signatures-utils";

/**
 * Employee email-signature directory — the server-only half.
 *
 * The types and pure helpers the directory UI needs live in
 * `email-signatures-utils.ts`, because `fetchCMS` pulls in `next/headers` and
 * a client component cannot import this module.
 *
 * The signature HTML itself is rendered by the CMS
 * (`/api/emailSignatures/:slug/render`) rather than here: the token contract
 * and its escaping rules live next to the collection that defines them, so
 * there is exactly one implementation. A second renderer on this side would
 * have to duplicate the token list, and any drift would surface as a silently
 * empty field in a signature already pasted into somebody's mail client.
 */

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
