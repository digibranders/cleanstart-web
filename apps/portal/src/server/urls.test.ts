import { describe, expect, it } from 'vitest';
import { absoluteUrl, inviteUrl, resetPasswordUrl } from './urls';

describe('urls', () => {
  it('joins APP_URL and a path with one slash', () => {
    expect(absoluteUrl('/partner/deals/1')).toBe('http://localhost:3004/partner/deals/1');
    expect(absoluteUrl('partner/deals/1')).toBe('http://localhost:3004/partner/deals/1');
  });

  it('builds the invite link with the token in the query', () => {
    expect(inviteUrl('abc_DEF-123')).toBe('http://localhost:3004/accept-invite?token=abc_DEF-123');
  });

  it('builds the reset link and encodes a token that needs it', () => {
    expect(resetPasswordUrl('a b&c')).toBe('http://localhost:3004/reset-password?token=a%20b%26c');
  });
});
