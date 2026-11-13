import { createFileStorage } from './r2';
import type { FileStorage } from './storage';

let cached: FileStorage | null = null;

/** The process wide R2 storage. Throws IntegrationError('r2') when R2_* is unset, which actions and routes turn into a safe message. */
export function getFileStorage(): FileStorage {
  cached ??= createFileStorage();
  return cached;
}
