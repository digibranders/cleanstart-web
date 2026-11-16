/**
 * Key names whose values must never reach a log line or an error report: credentials, tokens, cookies, signing
 * material and DSNs. Case-insensitive, matched anywhere in the name (apiKey, x-api-key, accessKeyId, Set-Cookie,
 * x-hubspot-signature-v3). A bare `key` or `objectKey` is not matched: the document purge logs the R2 object key on purpose.
 */
export const SENSITIVE_KEY = /authorization|password|passwd|token|cookie|secret|signature|dsn|api[-_]?key|access[-_]?key|private[-_]?key|session[-_]?key/i;
