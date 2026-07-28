/**
 * Email-signature template rendering.
 *
 * Signatures are data, not documents: every employee shares one template and
 * differs only in name/title/email/phone. The template is stored as raw email
 * HTML (table-based, inline styles — the only markup Outlook's Word rendering
 * engine handles) with `{{token}}` placeholders that this module substitutes.
 *
 * Two invariants make that safe:
 *
 *  1. **Every token is escaped.** Values land in either a text node or a
 *     double-quoted attribute, and HTML-escaping `& < > " '` is correct in
 *     both positions, so a single escape pass covers every insertion site.
 *  2. **Unknown tokens throw.** A typo'd `{{jobtitle}}` must not silently
 *     render an empty string — that ships a broken signature to a customer's
 *     inbox with no error anywhere. `SignatureTemplates` rejects unknown
 *     tokens at save time; this is the second line of defence for templates
 *     written through the REST API.
 */

/**
 * The complete token contract. Anything not listed here is a template bug.
 *
 * Logo, tagline, divider and the social row are deliberately absent: they are
 * identical for all 20 employees and belong in the template markup, not in
 * per-person data.
 */
export const SIGNATURE_TOKENS = ['name', 'jobTitle', 'email', 'phone', 'phoneHref'] as const;

export type SignatureToken = (typeof SIGNATURE_TOKENS)[number];

export type SignatureTokenValues = Record<SignatureToken, string>;

/**
 * Source fields on an `emailSignatures` document.
 *
 * `phoneDisplay` spells out `undefined` explicitly because the repo runs with
 * `exactOptionalPropertyTypes`, and Payload hands back all three states: absent
 * (never set), `null` (explicitly cleared) and a string.
 */
export type SignatureRecord = {
  name: string;
  jobTitle: string;
  email: string;
  phoneE164: string;
  phoneDisplay?: string | null | undefined;
};

/**
 * E.164: leading `+`, no leading zero, 7–15 digits total. Enforced on the
 * collection field and re-checked here because the value is interpolated into
 * a `tel:` href — a malformed value is the one token that could carry a scheme.
 */
export const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

/** Matches `{{ token }}` with optional inner whitespace. */
const TOKEN_PATTERN = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

const HTML_ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapes the five characters that are unsafe in either a text node or a
 * quoted attribute value. `&` is handled by the same pass (the character class
 * is matched left-to-right against the source, so already-emitted entities are
 * never re-escaped).
 */
export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);

const isSignatureToken = (token: string): token is SignatureToken =>
  (SIGNATURE_TOKENS as readonly string[]).includes(token);

/** Every distinct token referenced by a template, in first-appearance order. */
export const extractTokens = (templateHtml: string): string[] => {
  const seen = new Set<string>();
  for (const match of templateHtml.matchAll(TOKEN_PATTERN)) {
    const token = match[1];
    if (token) seen.add(token);
  }
  return [...seen];
};

/** Tokens a template references that are not in the contract. */
export const unknownTokens = (templateHtml: string): string[] =>
  extractTokens(templateHtml).filter((token) => !isSignatureToken(token));

/**
 * Derives the token map from a signature record.
 *
 * `phoneDisplay` is the human-formatted number shown to the reader; when blank
 * it falls back to the E.164 value verbatim. We deliberately do not synthesise
 * a "pretty" format — grouping digits correctly is locale-specific, and a
 * wrong guess is worse than the unambiguous E.164 form.
 */
export const buildTokenValues = (record: SignatureRecord): SignatureTokenValues => {
  if (!E164_PATTERN.test(record.phoneE164)) {
    throw new Error(
      `Signature phone must be E.164 (e.g. +6596847785); received "${record.phoneE164}".`,
    );
  }

  const display = record.phoneDisplay?.trim();

  return {
    name: record.name,
    jobTitle: record.jobTitle,
    email: record.email,
    phone: display && display.length > 0 ? display : record.phoneE164,
    phoneHref: record.phoneE164,
  };
};

/**
 * Substitutes every `{{token}}` in the template with its escaped value.
 *
 * Throws on an unknown token rather than emitting an empty string — see the
 * module header.
 */
export const renderSignature = ({
  templateHtml,
  values,
}: {
  templateHtml: string;
  values: SignatureTokenValues;
}): string =>
  templateHtml.replace(TOKEN_PATTERN, (_match, rawToken: string) => {
    if (!isSignatureToken(rawToken)) {
      throw new Error(
        `Unknown signature token "{{${rawToken}}}". Supported: ${SIGNATURE_TOKENS.join(', ')}.`,
      );
    }
    return escapeHtml(values[rawToken]);
  });
