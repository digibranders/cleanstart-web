/**
 * Shared test utilities. Extracted once a third caller emerges — per
 * CLAUDE.md "three similar lines beats premature abstraction." Today
 * the only stable shared helper is `makeFakeLogger()`; see Vitest test
 * files for the inline `vi.mock` patterns that haven't yet hit three
 * callers.
 */

import { vi } from 'vitest';

export const makeFakeLogger = () => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
});

export type FakeLogger = ReturnType<typeof makeFakeLogger>;
