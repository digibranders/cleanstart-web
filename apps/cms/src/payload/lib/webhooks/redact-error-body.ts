/**
 * Redact secrets from upstream webhook response bodies before they
 * land in our log aggregator. A misbehaving subscriber that echoes
 * back its `Authorization` header (Standard Webhooks impls do this
 * on 401) would otherwise leak its bearer token to Sentry.
 *
 * Keeps the redaction conservative: a truncation cap + a small set
 * of patterns that match common secret shapes. We accept some false
 * negatives (an opaque DB error string with a long base64 chunk
 * gets fully redacted) over leaking real keys.
 */

const MAX_LEN = 200;

const PATTERNS: { regex: RegExp; replacement: string }[] = [
  // Bearer / Basic / token: prefixed Authorization-style values.
  { regex: /\b(Bearer|Basic|Token)\s+[\w./+=:-]{8,}/gi, replacement: '$1 [REDACTED]' },
  // JSON-style "key": "value" where the key name implies a secret.
  {
    regex: /"(api[_-]?key|access[_-]?token|secret|signing[_-]?secret|password|client[_-]?secret|private[_-]?key)"\s*:\s*"[^"]*"/gi,
    replacement: '"$1":"[REDACTED]"',
  },
  // header: value form for authorization-ish headers.
  {
    regex: /(authorization|x-api-key|x-auth-token|cookie|set-cookie)\s*[:=]\s*[^\s,;]+/gi,
    replacement: '$1: [REDACTED]',
  },
  // AWS-style access key id.
  { regex: /AKIA[0-9A-Z]{16}/g, replacement: '[REDACTED-AWS-KEY]' },
  // Generic long opaque tokens (base64-ish / hex-ish, 32+ chars).
  // Last because the more specific patterns above should fire first.
  { regex: /\b[A-Za-z0-9_-]{32,}\b/g, replacement: '[REDACTED]' },
];

export const redactWebhookErrorBody = (raw: string | null | undefined): string => {
  if (raw == null || raw.length === 0) return '';
  let out = raw;
  for (const { regex, replacement } of PATTERNS) {
    out = out.replace(regex, replacement);
  }
  if (out.length > MAX_LEN) {
    return `${out.slice(0, MAX_LEN - 1)}…`;
  }
  return out;
};
