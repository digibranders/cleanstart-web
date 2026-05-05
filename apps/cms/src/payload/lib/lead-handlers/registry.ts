import type { Payload } from 'payload';

import { dbPrimaryHandler } from './db-primary';
import type { LeadHandler, LeadHandlerContext, LeadHandlerResult, LeadSubmission } from './types';
import type { FormFieldDef } from './validate-fields';

const secondaryHandlers: LeadHandler[] = [];

/**
 * Register a secondary handler at module-init time. Brevo, Teams webhook,
 * future HubSpot/Salesforce, etc. each call this once. Idempotent — a
 * second register with the same name replaces the existing entry so dev
 * hot-reload doesn't accumulate duplicates.
 */
export const registerSecondaryHandler = (handler: LeadHandler): void => {
  if (handler.kind !== 'secondary') {
    throw new Error(`Handler ${handler.name} must declare kind: 'secondary'`);
  }
  const existing = secondaryHandlers.findIndex((h) => h.name === handler.name);
  if (existing >= 0) secondaryHandlers[existing] = handler;
  else secondaryHandlers.push(handler);
};

export const listSecondaryHandlers = (): readonly LeadHandler[] => secondaryHandlers;

/** Test-only — clears the registered handlers between unit tests. */
export const __resetSecondaryHandlers = (): void => {
  secondaryHandlers.length = 0;
};

const safeRun = async (
  handler: LeadHandler,
  submission: LeadSubmission,
  ctx: LeadHandlerContext,
): Promise<LeadHandlerResult> => {
  try {
    return await handler.run(submission, ctx);
  } catch (error) {
    return {
      handler: handler.name,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const writeSyncedTo = async (
  payload: Payload,
  leadId: number,
  results: LeadHandlerResult[],
): Promise<void> => {
  if (results.length === 0) return;
  await payload.update({
    collection: 'leads',
    id: leadId,
    data: {
      syncedTo: results.map((result) => ({
        handler: result.handler,
        status: result.status,
        syncedAt: new Date().toISOString(),
        externalId: result.status === 'synced' ? (result.externalId ?? null) : null,
        error:
          result.status === 'failed'
            ? result.error
            : result.status === 'skipped'
              ? result.reason
              : null,
      })),
    },
    overrideAccess: true,
  });
};

export type SubmitResult = {
  ok: boolean;
  leadId?: number | undefined;
  duplicateOfLeadId?: number | undefined;
  primary: LeadHandlerResult;
  secondaries: LeadHandlerResult[];
};

/**
 * Run the full LeadHandler chain — primary writes the row, secondaries
 * fan out in parallel. Secondary failures never block the primary;
 * they're recorded as `failed` rows on `leads.syncedTo[]` and replayable
 * via the admin "Retry sync" action (Phase D admin polish).
 */
export const submitLead = async (
  payload: Payload,
  submission: LeadSubmission,
  options: { formFieldDefs?: FormFieldDef[] } = {},
): Promise<SubmitResult> => {
  const ctx: LeadHandlerContext = {
    payload,
    primarySucceeded: false,
    leadId: undefined,
    duplicateOfLeadId: undefined,
    formFieldDefs: options.formFieldDefs,
  };
  const primary = await safeRun(dbPrimaryHandler, submission, ctx);

  if (primary.status !== 'synced' || ctx.leadId == null) {
    return { ok: false, primary, secondaries: [] };
  }

  ctx.primarySucceeded = true;

  // Run secondaries in parallel; isolate failures with safeRun.
  const secondaryResults = await Promise.all(
    secondaryHandlers.map((handler) => safeRun(handler, submission, ctx)),
  );

  // Persist sync outcomes back onto the lead.
  await writeSyncedTo(payload, ctx.leadId, [primary, ...secondaryResults]);

  return {
    ok: true,
    leadId: ctx.leadId,
    duplicateOfLeadId: ctx.duplicateOfLeadId,
    primary,
    secondaries: secondaryResults,
  };
};
