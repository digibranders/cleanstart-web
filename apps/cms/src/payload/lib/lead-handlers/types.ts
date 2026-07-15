import type { Payload } from 'payload';

import type { LeadAttribution } from './attribution';

/**
 * Validated submission payload as it crosses the LeadHandler boundary.
 * Built by the /api/leads/submit endpoint after Zod parsing + Turnstile
 * verification. Handlers receive the same value.
 *
 * Optional properties are typed as `T | undefined` (not `?:`) so the
 * shape composes cleanly with `exactOptionalPropertyTypes: true` —
 * callers can spread keys whose value may be undefined without TypeScript
 * complaining about the present-but-undefined distinction.
 */
export type LeadSubmissionUtm = {
  campaign?: string | undefined;
  source?: string | undefined;
  medium?: string | undefined;
  term?: string | undefined;
  content?: string | undefined;
};

export type LeadSubmissionConsent = {
  givenAt: string;
  snapshot: string;
  policyVersion?: string | undefined;
  categories?: string[] | undefined;
};

export type LeadSubmission = {
  formId: number;
  formSchemaVersion: number;
  fields: Record<string, unknown>;
  source: string | undefined;
  /** Last-touch UTMs from the URL at submit time. */
  utm: LeadSubmissionUtm | undefined;
  /**
   * First-touch campaign, ad click IDs, device, and the server-derived
   * marketing channel. Undefined for legacy / attribution-less submissions.
   */
  attribution: LeadAttribution | undefined;
  ip: string | undefined;
  userAgent: string | undefined;
  consent: LeadSubmissionConsent | undefined;
};

export type LeadHandlerContext = {
  payload: Payload;
  /** Lead document id created by the primary handler. Undefined when running primary itself. */
  leadId: number | undefined;
  /** Whether the primary handler succeeded — secondaries may decide to skip on failure. */
  primarySucceeded: boolean;
  /** Marks the submission as a duplicate of an earlier lead (set by primary). */
  duplicateOfLeadId: number | undefined;
  /**
   * Resolved form-field definitions for the submission's form. Populated
   * by the endpoint before submitLead is invoked. Used by handlers via
   * extract-fields helpers for deterministic email/name lookup
   * (typed-field first, then @-heuristic fallback).
   */
  formFieldDefs?: import('./validate-fields').FormFieldDef[] | undefined;
};

export type LeadHandlerResult =
  | { handler: string; status: 'synced'; externalId?: string | undefined }
  | { handler: string; status: 'failed'; error: string }
  | { handler: string; status: 'skipped'; reason: string };

export type LeadHandler = {
  /** Unique handler name. Recorded on leads.syncedTo[].handler. */
  readonly name: string;
  /** Whether this handler must succeed for the submission to be considered captured. */
  readonly kind: 'primary' | 'secondary';
  run(submission: LeadSubmission, ctx: LeadHandlerContext): Promise<LeadHandlerResult>;
};
