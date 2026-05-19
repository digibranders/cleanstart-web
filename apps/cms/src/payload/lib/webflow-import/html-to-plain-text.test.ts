import { describe, expect, it } from 'vitest';
import { htmlToPlainText, looksLikeHtml } from './html-to-plain-text';

describe('htmlToPlainText', () => {
  it('strips a single paragraph tag', () => {
    expect(htmlToPlainText('<p>Co-Founder and Chief Technology Officer</p>')).toBe(
      'Co-Founder and Chief Technology Officer',
    );
  });

  it('decodes named and numeric entities', () => {
    expect(htmlToPlainText('AT&amp;T &mdash; today&#8217;s pick')).toBe('AT&T — today’s pick');
  });

  it('separates block elements with a single space', () => {
    expect(htmlToPlainText('<p>One</p><p>Two</p>')).toBe('One Two');
  });

  it('turns <br> into a newline', () => {
    expect(htmlToPlainText('Line 1<br />Line 2')).toBe('Line 1\nLine 2');
  });

  it('drops script/style content', () => {
    expect(htmlToPlainText('Hello<script>alert(1)</script> world')).toBe('Hello world');
  });

  it('collapses repeated whitespace', () => {
    expect(htmlToPlainText('  a   b\t\tc  ')).toBe('a b c');
  });

  it('returns input untouched when no markup is present', () => {
    expect(htmlToPlainText('Plain string')).toBe('Plain string');
  });

  it('handles empty / null-ish inputs', () => {
    expect(htmlToPlainText('')).toBe('');
  });
});

describe('looksLikeHtml', () => {
  it('detects tags', () => {
    expect(looksLikeHtml('<p>hi</p>')).toBe(true);
  });
  it('detects entities', () => {
    expect(looksLikeHtml('AT&amp;T')).toBe(true);
  });
  it('returns false for plain strings', () => {
    expect(looksLikeHtml('Plain text')).toBe(false);
  });
  it('returns false for non-strings', () => {
    expect(looksLikeHtml(null)).toBe(false);
    expect(looksLikeHtml(undefined)).toBe(false);
    expect(looksLikeHtml(42)).toBe(false);
  });
});
