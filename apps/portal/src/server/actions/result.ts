// src/server/actions/result.ts
import type { ErrorCode, FieldIssue } from '@/server/errors';

export interface ActionError {
  code: ErrorCode;
  /** Safe to show. */
  message: string;
  issues?: FieldIssue[];
  retryAfterSeconds?: number;
}

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });
export const fail = (error: ActionError): ActionResult<never> => ({ ok: false, error });

/** Maps field issues to { fieldName: message } for the inline error display every form already has. */
export const issuesToErrors = (error: ActionError): Record<string, string> =>
  Object.fromEntries((error.issues ?? []).map((i) => [i.path, i.message]));
