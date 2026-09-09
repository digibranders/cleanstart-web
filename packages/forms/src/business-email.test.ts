import { describe, expect, it } from 'vitest';

import { validateBusinessEmail } from './business-email';
import { COMMON_FREE_EMAIL_DOMAINS } from './common-free-email-domains';
import { UPSTREAM_FREE_EMAIL_DOMAINS } from './free-email-domains';
import { FREE_EMAIL_DOMAINS } from './server';

const client = { freeDomains: COMMON_FREE_EMAIL_DOMAINS };
const server = { freeDomains: FREE_EMAIL_DOMAINS };

describe('validateBusinessEmail', () => {
  it('accepts a corporate address and returns its normalised form', () => {
    const result = validateBusinessEmail('  Jane.Doe@CleanStart.com ', server);
    expect(result).toEqual({
      ok: true,
      email: 'jane.doe@cleanstart.com',
      domain: 'cleanstart.com',
    });
  });

  it.each(['gmail.com', 'hotmail.com', 'yahoo.co.in', 'proton.me', 'qq.com', 'mail.ru'])(
    'rejects %s on both the client and the server list',
    (domain) => {
      const email = `paul.biplab@${domain}`;
      expect(validateBusinessEmail(email, client)).toMatchObject({ reason: 'free-mail' });
      expect(validateBusinessEmail(email, server)).toMatchObject({ reason: 'free-mail' });
    },
  );

  it('rejects a long-tail free-mail domain on the server that the client list misses', () => {
    const email = 'someone@emailfake.com';
    expect(validateBusinessEmail(email, client).ok).toBe(true);
    expect(validateBusinessEmail(email, server)).toMatchObject({ reason: 'free-mail' });
  });

  it.each([
    ['', 'required'],
    ['   ', 'required'],
    ['jane', 'syntax'],
    ['jane@', 'syntax'],
    ['jane@localhost', 'syntax'],
    ['jane@cleanstart', 'syntax'],
    ['jane doe@cleanstart.com', 'syntax'],
    ['jane@cleanstart..com', 'syntax'],
    ['jane@-cleanstart.com', 'syntax'],
    ['jane@cleanstart.c', 'syntax'],
  ])('rejects %j as %s', (input, reason) => {
    expect(validateBusinessEmail(input, server)).toMatchObject({ reason });
  });

  it('rejects an address over the 254-character RFC limit', () => {
    expect(validateBusinessEmail(`${'a'.repeat(250)}@cleanstart.com`, server)).toMatchObject({
      reason: 'syntax',
    });
  });

  it('treats a trailing root dot as the same mailbox', () => {
    expect(validateBusinessEmail('jane@gmail.com.', server)).toMatchObject({
      reason: 'free-mail',
    });
    expect(validateBusinessEmail('jane@cleanstart.com.', server)).toMatchObject({
      ok: true,
      domain: 'cleanstart.com',
    });
  });

  it('checks the shape only when requireBusiness is false', () => {
    expect(validateBusinessEmail('jane@gmail.com', { ...server, requireBusiness: false })).toEqual({
      ok: true,
      email: 'jane@gmail.com',
      domain: 'gmail.com',
    });
    expect(validateBusinessEmail('nope', { ...server, requireBusiness: false })).toMatchObject({
      reason: 'syntax',
    });
  });

  it('handles null and undefined without throwing', () => {
    expect(validateBusinessEmail(null, server)).toMatchObject({ reason: 'required' });
    expect(validateBusinessEmail(undefined, server)).toMatchObject({ reason: 'required' });
  });
});

describe('domain lists', () => {
  it('never lets the server accept what the browser already rejected', () => {
    const missing = [...COMMON_FREE_EMAIL_DOMAINS].filter(
      (domain) => !FREE_EMAIL_DOMAINS.has(domain),
    );
    expect(missing).toEqual([]);
  });

  it('covers providers the upstream corpus is missing', () => {
    for (const domain of ['tutanota.com', 'mailbox.org', 'sfr.fr', 'globo.com']) {
      expect(UPSTREAM_FREE_EMAIL_DOMAINS.has(domain)).toBe(false);
      expect(FREE_EMAIL_DOMAINS.has(domain)).toBe(true);
    }
  });

  it('carries the full corpus', () => {
    expect(FREE_EMAIL_DOMAINS.size).toBeGreaterThan(10_000);
  });

  it('never lists a domain CleanStart sells to', () => {
    for (const domain of ['cleanstart.com', 'jfrog.com', 'redhat.com', 'chainguard.dev']) {
      expect(FREE_EMAIL_DOMAINS.has(domain)).toBe(false);
    }
  });
});
