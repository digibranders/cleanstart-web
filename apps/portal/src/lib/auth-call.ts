/** Status carried by the error `settleAuth` makes from a thrown call (no response was received). */
export const NETWORK_FAILURE_STATUS = 0;

interface AuthFailure {
  status: number;
  statusText: string;
  message?: string;
}

/**
 * Better Auth's client returns `{ data, error }` for an answered request but rejects when the request itself
 * fails (offline, DNS, aborted). Screens call this so both cases come back as `{ data, error }` and `busy`
 * is always released.
 */
export async function settleAuth<R extends { data: unknown; error: unknown }>(
  call: () => Promise<R>,
): Promise<R | { data: null; error: AuthFailure }> {
  try {
    return await call();
  } catch {
    return { data: null, error: { status: NETWORK_FAILURE_STATUS, statusText: 'Network failure' } };
  }
}
