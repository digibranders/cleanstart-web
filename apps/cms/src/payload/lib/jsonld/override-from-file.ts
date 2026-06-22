import { parseLenientMulti } from './override-validator';

export interface UploadedSchemaResult {
  /** Parsed override ready to store: a single blob, or an array when the file
   *  carried multiple <script type="application/ld+json"> blocks. Null on error. */
  value: unknown | null;
  warnings: string[];
  error: string | null;
}

/**
 * Turn raw uploaded/pasted file text into a storable override value. Reuses the
 * tolerant multi-block parser (strips <script> wrappers, normalises
 * http→https @context, removes trailing commas), so an SEO team can drop a
 * whole .txt/.json file exported from a generator. Pure — no DOM, unit-tested.
 */
export const parseUploadedSchema = (text: string): UploadedSchemaResult => {
  const { blocks, warnings } = parseLenientMulti(text);
  const allWarnings: string[] = [...warnings];
  const parsed: unknown[] = [];
  for (const block of blocks) {
    if (!block.ok) {
      const where = block.line != null ? ` (line ${block.line})` : '';
      return { value: null, warnings: allWarnings, error: `${block.message}${where}` };
    }
    // ok blocks carry their own normalisation notes (trailing comma, http→https…)
    allWarnings.push(...block.warnings);
    parsed.push(block.data);
  }
  if (parsed.length === 0) {
    return { value: null, warnings: allWarnings, error: 'No JSON-LD found in the file.' };
  }
  const value = parsed.length === 1 ? parsed[0] : parsed;
  return { value, warnings: allWarnings, error: null };
};
