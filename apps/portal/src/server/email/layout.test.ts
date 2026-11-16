import { describe, expect, it, vi } from 'vitest';
import { log } from '@/server/log';
import { escapeHtml, isSafeEmailUrl, renderEmail } from './layout';

const sample = () =>
  renderEmail({
    preheader: 'Your reference is APP-2611-0042.',
    heading: 'Application received',
    blocks: [
      { type: 'paragraph', text: 'Hello Rohit Desai,' },
      { type: 'facts', rows: [{ label: 'Reference', value: 'APP-2611-0042' }, { label: 'Reason', value: '' }] },
      { type: 'note', text: 'Quote the reference if you write to us.' },
      { type: 'button', label: 'Open the portal', url: 'https://partners.example.com/sign-in?next=%2Fpartner&x=1' },
    ],
    footnote: 'You received this email because you applied.',
  });

describe('escapeHtml', () => {
  it('neutralises markup and quotes', () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'y'`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;',
    );
  });
});

describe('renderEmail', () => {
  it('matches the layout snapshot', () => {
    expect(sample()).toMatchSnapshot();
  });

  it('is a complete light mode document', () => {
    const html = sample();
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('name="color-scheme" content="light"');
    expect(html).toContain('<title>Application received</title>');
  });

  it('puts the hidden preheader before the heading', () => {
    const html = sample();
    const at = html.indexOf('Your reference is APP-2611-0042.', html.indexOf('<body'));
    expect(at).toBeGreaterThan(-1);
    expect(at).toBeLessThan(html.indexOf('<h1'));
    expect(html.slice(at - 200, at)).toContain('display:none');
  });

  it('lays out with tables and Arial, never flex or grid', () => {
    const html = sample();
    expect(html).toContain('role="presentation"');
    expect(html).toContain('Arial,Helvetica,sans-serif');
    expect(html).not.toMatch(/display:\s*(flex|grid)/);
  });

  it('names the brand in the logo alt text and carries the postal address', () => {
    const html = sample();
    expect(html).toContain('alt="CleanStart"');
    expect(html).toContain('16192 Coastal Highway');
  });

  it('drops a facts row with no value and renders the others', () => {
    const html = sample();
    expect(html).toContain('Reference');
    expect(html).not.toContain('>Reason<');
  });

  it('makes the button a padded table cell and escapes the ampersand in the link', () => {
    const html = sample();
    expect(html).toContain('class="cs-btn"');
    expect(html).toContain('href="https://partners.example.com/sign-in?next=%2Fpartner&amp;x=1"');
  });

  it('leaves out a button whose URL is not http or https', () => {
    const html = renderEmail({
      preheader: 'p',
      heading: 'h',
      blocks: [
        { type: 'button', label: 'Click', url: 'javascript:alert(1)' },
        { type: 'button', label: 'Also click', url: 'not a url' },
      ],
    });
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('>Click<');
    expect(html).not.toContain('>Also click<');
  });

  it('warns, naming the email and the button but never the URL, when it drops a button', () => {
    const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    renderEmail({ preheader: 'p', heading: 'Reset your password', blocks: [{ type: 'button', label: 'Set a new password', url: 'javascript:TOKEN-SECRET' }] });
    expect(warn).toHaveBeenCalledTimes(1);
    const [fields] = warn.mock.calls[0] ?? [];
    expect(fields).toEqual({ heading: 'Reset your password', label: 'Set a new password' });
    expect(JSON.stringify(warn.mock.calls)).not.toContain('TOKEN-SECRET');
    warn.mockRestore();
  });

  it('does not warn for a safe button', () => {
    const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    sample();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('escapes the heading, preheader, facts, notes and footnote', () => {
    const evil = '<img src=x onerror=alert(1)>';
    const html = renderEmail({
      preheader: evil,
      heading: evil,
      blocks: [
        { type: 'paragraph', text: evil },
        { type: 'facts', rows: [{ label: evil, value: evil }] },
        { type: 'note', text: evil },
      ],
      footnote: evil,
    });
    expect(html).not.toContain('<img src=x');
    expect(html.match(/&lt;img src=x onerror=alert\(1\)&gt;/g)?.length).toBeGreaterThanOrEqual(7);
  });

  it('omits the footnote paragraph when there is none', () => {
    const html = renderEmail({ preheader: 'p', heading: 'h', blocks: [] });
    expect(html).not.toContain('You received this email');
  });
});

describe('isSafeEmailUrl', () => {
  it.each([
    ['https://partners.example.com/x?y=1', true],
    ['http://localhost:3004/x', true],
    ['javascript:alert(1)', false],
    ['ftp://example.com', false],
    ['/relative', false],
    ['', false],
  ])('%s -> %s', (url, expected) => {
    expect(isSafeEmailUrl(url)).toBe(expected);
  });
});
