import { describe, expect, it } from 'vitest';

import { escapeHtml, renderEmail } from './layout';

const base = { preheader: 'Preview line.', heading: 'Hello', blocks: [] } as const;

describe('escapeHtml', () => {
  it('neutralises markup in visitor-supplied text', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
    );
  });
});

describe('renderEmail — client compatibility', () => {
  const html = renderEmail({
    preheader: 'Your demo request reached us.',
    heading: 'Thanks for getting in touch',
    blocks: [
      { kind: 'paragraph', text: 'Body copy.' },
      { kind: 'details', rows: [['Email', 'jane@acme.com'], ['Phone', undefined]] },
      { kind: 'quote', label: 'Message', text: 'We run 300 containers.' },
      { kind: 'button', label: 'Open', url: 'https://www.cleanstart.com/x' },
      { kind: 'note', text: 'Expires in 24 hours.' },
      { kind: 'divider' },
    ],
    footerNote: 'Why you got this.',
  });

  it('is a complete document with a light color-scheme lock', () => {
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('name="color-scheme" content="light"');
  });

  it('carries the preheader before any visible content', () => {
    expect(html).toContain('Your demo request reached us.');
    // Compared against the <h1>, not the first match: the heading also appears
    // in <title>, which legitimately precedes the preheader.
    expect(html.indexOf('Your demo request reached us.')).toBeLessThan(html.indexOf('<h1'));
  });

  it('hides the preheader from the opened email', () => {
    const block = html.slice(html.indexOf('Your demo request reached us.') - 300, html.indexOf('Your demo request reached us.'));
    expect(block).toContain('display:none');
    expect(block).toContain('mso-hide:all');
  });

  it('lays out with tables, since Outlook supports neither flex nor grid', () => {
    expect(html).toContain('role="presentation"');
    expect(html).not.toMatch(/display:\s*flex/u);
    expect(html).not.toMatch(/display:\s*grid/u);
  });

  it('names the brand in alt text, so it reads when images are blocked', () => {
    expect(html).toContain('alt="CleanStart"');
    expect(html).toContain('logo-email.png');
  });

  it('carries the postal address CAN-SPAM requires, and no unsubscribe link', () => {
    expect(html).toContain('16192 Coastal Highway');
    // Comments stripped first: the markup explains *why* there is no
    // unsubscribe, and that explanation is not itself a link.
    const rendered = html.replace(/<!--[\s\S]*?-->/gu, '');
    expect(rendered).not.toMatch(/unsubscribe/iu);
  });

  it('forces Arial, matching the templates already live in Brevo', () => {
    expect(html).toContain('font-family: Arial,Helvetica,sans-serif !important');
  });

  it('renders each block kind', () => {
    expect(html).toContain('Body copy.');
    expect(html).toContain('jane@acme.com');
    expect(html).toContain('We run 300 containers.');
    expect(html).toContain('Expires in 24 hours.');
    expect(html).toContain('https://www.cleanstart.com/x');
  });

  it('drops detail rows with no value rather than printing empty labels', () => {
    expect(html).not.toContain('Phone');
  });
});

describe('renderEmail — safety', () => {
  it('escapes visitor text in every block that carries it', () => {
    const html = renderEmail({
      ...base,
      heading: '<b>h</b>',
      blocks: [
        { kind: 'paragraph', text: '<img src=x onerror=1>' },
        { kind: 'quote', text: '</td><script>bad()</script>' },
        { kind: 'details', rows: [['<b>k</b>', '<b>v</b>']] },
        { kind: 'note', text: '<i>n</i>' },
      ],
    });
    expect(html).not.toContain('<script>bad()');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;script&gt;bad()');
  });

  it('refuses a non-http button URL, so a caller cannot emit javascript:', () => {
    const html = renderEmail({
      ...base,
      blocks: [{ kind: 'button', label: 'Click', url: 'javascript:alert(1)' }],
    });
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('>Click<');
  });

  it('drops a malformed button URL instead of rendering a broken link', () => {
    const html = renderEmail({
      ...base,
      blocks: [{ kind: 'button', label: 'Click', url: 'not a url' }],
    });
    expect(html).not.toContain('>Click<');
  });
});

describe('renderEmail — Outlook and dark mode', () => {
  const html = renderEmail({
    preheader: 'p',
    heading: 'h',
    blocks: [
      { kind: 'button', label: 'Download', url: 'https://www.cleanstart.com/x' },
      { kind: 'paragraph', text: 'body' },
    ],
  });

  it('pads the button cell, not the anchor', () => {
    // Word-based Outlook ignores display:inline-block and is unreliable with
    // padding on inline elements, so an anchor-padded button collapses into
    // coloured text there.
    const cell = /<td class="cs-btn"[^>]*>/u.exec(html)?.[0] ?? '';
    expect(cell).toContain('padding:14px 28px');
    expect(cell).toContain('mso-padding-alt');
    expect(html).not.toMatch(/<a[^>]*display:inline-block[^>]*>Download/u);
  });

  it('sets the button colour as a bgcolor attribute, which Word honours', () => {
    expect(html).toMatch(/<td class="cs-btn"[^>]*bgcolor="#3960f9"/u);
  });

  it('fixes the card width with a width attribute, since Word ignores max-width', () => {
    expect(html).toMatch(/<table[^>]*width="600"[^>]*class="cs-wrap cs-card"/u);
  });

  it('declares a light colour scheme so Apple Mail does not invert', () => {
    expect(html).toContain('color-scheme: light');
    expect(html).toContain('supported-color-schemes: light');
  });

  it('pins the card, text and button against Outlook.com dark-mode rewriting', () => {
    for (const rule of ['[data-ogsc] .cs-heading', '[data-ogsb] .cs-card', '[data-ogsc] .cs-btn a']) {
      expect(html).toContain(rule);
    }
    expect(html).toMatch(/<table[^>]*class="cs-wrap cs-card"[^>]*bgcolor="#ffffff"/u);
  });

  it('uses the plated logo, which stays legible when a client inverts the card', () => {
    expect(html).toContain('web/emails/logo-email.png');
    expect(html).not.toContain('social-icons/cleanstart-logo.png');
  });
});
