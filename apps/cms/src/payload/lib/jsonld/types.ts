/**
 * Schema.org JSON-LD types we emit.
 *
 * The shape is intentionally permissive — schema.org allows
 * single-or-array for almost every property, and dropping unset keys
 * keeps the rendered HTML lean. We keep the type surface narrow so
 * emitters can't accidentally write `null` or `undefined` into the
 * output (validators flag those).
 */

export type SchemaContext = 'https://schema.org';

export type JsonLdValue =
  | string
  | number
  | boolean
  | JsonLdObject
  | readonly JsonLdValue[];

export interface JsonLdObject {
  readonly '@context'?: SchemaContext;
  readonly '@type'?: string | readonly string[];
  readonly '@id'?: string;
  readonly [key: string]: JsonLdValue | undefined;
}

export type JsonLdReference = { readonly '@id': string };

/**
 * One rendered JSON-LD <script> body. Always carries `@context` at
 * the top level — required by schema.org for valid blobs.
 */
export type JsonLdBlob = JsonLdObject & {
  readonly '@context': SchemaContext;
  readonly '@type': string | readonly string[];
};
